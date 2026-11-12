// Yeni hareket katmanının davranış, görünürlük ve kaynak bütçesi denetimi.
// Kullanım: PLAYWRIGHT_PACKAGE_DIR=<klasör> node motion-testi.mjs <adres> --motor=chromium
import {createRequire} from 'node:module';
import {readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
const args=process.argv.slice(2);
const url=args.find(x=>!x.startsWith('--')) || 'http://127.0.0.1:4393/';
const engine=(args.find(x=>x.startsWith('--motor='))||'--motor=chromium').split('=')[1];
const folder=(args.find(x=>x.startsWith('--kanit='))||'--kanit=.pane/prompts/motion-qa').split('=')[1];
const onlyRed=args.includes('--red');
const req=createRequire(join(process.env.PLAYWRIGHT_PACKAGE_DIR||process.cwd(),'package.json'));
const pw=req('@playwright/test');
if(!['chromium','webkit'].includes(engine)) throw new Error('Geçersiz motor');
mkdirSync(folder,{recursive:true});
const results=[]; const notes=[]; const samples=[]; const contexts=[];
const bounded=(p,ms,name)=>{let id;return Promise.race([p,new Promise((_,reject)=>{id=setTimeout(()=>reject(new Error(name+' zaman aşımı')),ms);})]).finally(()=>clearTimeout(id));};
const check=(name,ok,detail)=>{results.push({name,status:ok?'pass':'fail',detail});if(!ok)console.log('FAIL',name,JSON.stringify(detail??''));};
let browser;
const watchdog=setTimeout(()=>{console.error('NOT_RUN: genel süre sınırı');process.exit(124);},150000);
async function context(options={}) {const c=await bounded(browser.newContext(options),12000,'bağlam');contexts.push(c);return c;}
async function tab(c){return bounded(c.newPage(),12000,'sekme');}
async function load(p){await p.goto(url,{waitUntil:'domcontentloaded',timeout:15000});await p.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,4000))]));}
async function settle(p,selector){await p.waitForTimeout(700);await bounded(p.locator(selector).evaluate(async e=>{
 const scope=e.closest('section,.band')||e;
 await Promise.all(scope.getAnimations({subtree:true}).filter(a=>a.playState==='running'&&Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));
}),2500,'görsel geçiş');}
async function sceneState(p,selector){return p.locator(selector).evaluate(e=>{
 const root=e.closest('section,.band')||e.parentElement;
 const r=root.getBoundingClientRect();const heading=root.querySelector('h1,h2');const h=heading?.getBoundingClientRect();
 return {progress:getComputedStyle(e).getPropertyValue('--scene-progress'),ready:e.dataset.motionReady,
 head:h?[Math.round(h.left-r.left),Math.round(h.top-r.top),Math.round(h.width)]:null,
 layers:[...e.querySelectorAll('[data-motion-layer]')].map(n=>{const s=getComputedStyle(n);let m;try{m=new DOMMatrix(s.transform==='none'?undefined:s.transform);}catch{m=new DOMMatrix();}return {transform:s.transform,attr:n.getAttribute('transform'),opacity:s.opacity,x:m.m41,y:m.m42,scale:Math.hypot(m.m11,m.m12),d:n.getAttribute('d')};})};
});}
async function seek(p,selector,phase){await p.locator(selector).evaluate((e,t)=>{const svg=e.querySelector("svg");const mobileBox=svg&&getComputedStyle(svg).position==="absolute";const r=(mobileBox?svg:e).getBoundingClientRect();const top=r.top+scrollY;scrollTo(0,Math.max(0,top-innerHeight+t*(innerHeight+r.height)));},phase);await settle(p,selector);return sceneState(p,selector);}
function different(a,b){return JSON.stringify(a.layers)!==JSON.stringify(b.layers);}
// Ekran dışındaki sahnenin görüntüsü ilerleme sınırında zaten değişmez. Görüntüye bakan denetim bu yüzden düşemezdi.
// Bu denetim denetleyicinin yaptığı işe bakar. Ekrandan en az 200 px uzaktaki sahne köküne ölçüm ve yazım yapılmamalıdır.
// Kısa kaydırma o sahneyi ekrana getirmez. Ölçüm yapılırsa denetleyici görünmeyen sahne için de çalışıyordur.
async function offscreenWork(p){return p.evaluate(async()=>{
 const roots=[...document.querySelectorAll('[data-motion-scene]')];
 const off=new Set(roots.filter(e=>{const r=e.getBoundingClientRect();return r.bottom<=-200||r.top>=innerHeight+200;}));
 const proto=Element.prototype;const orig=proto.getBoundingClientRect;let hits=0;
 proto.getBoundingClientRect=function(){if(off.has(this))hits++;return orig.call(this);};
 const before=[...off].map(e=>e.getAttribute('style'));
 scrollBy(0,60);await new Promise(r=>setTimeout(r,300));scrollBy(0,-60);await new Promise(r=>setTimeout(r,500));
 proto.getBoundingClientRect=orig;
 const after=[...off].map(e=>e.getAttribute('style'));
 return {off:off.size,hits,written:before.some((s,i)=>s!==after[i])};
});}
const offscreenOk=(w)=>w.off>0&&w.hits===0&&!w.written;
function near(a,b){return a.layers.length===b.layers.length&&a.layers.every((n,i)=>Math.abs(n.x-b.layers[i].x)<1.5&&Math.abs(n.y-b.layers[i].y)<1.5&&Math.abs(n.scale-b.layers[i].scale)<.02);}
// Kendini sınama (--sinama). Bozulma sunucudan gelen hareket paketine yolda uygulanır, dosya değişmez.
// Önce bozulmasız paketle denetim geçmelidir. Sonra bozulmuş paketle aynı denetim FAIL vermelidir.
if(args.includes('--sinama')){
 let code=1;
 try{
  browser=await bounded(pw[engine].launch(),12000,'tarayıcı');
  const run=async(broken)=>{
   const c=await context({viewport:{width:320,height:800}});
   if(broken)await c.route('**/hareket/sahne.js*',async route=>{
    const res=await route.fetch();const body=await res.text();const next=body.replace('scenes.filter((s) => s.live)','scenes.filter(() => true)');
    if(next===body)throw new Error('bozulma uygulanamadı: hareket/sahne.js değişmiş olabilir');
    await route.fulfill({response:res,body:next});
   });
   const p=await tab(c);await load(p);await p.waitForSelector('[data-motion-ready="true"]',{timeout:8000});
   await seek(p,'[data-motion-scene="magnet"]',.28);
   const w=await offscreenWork(p);await bounded(c.close(),3000,'bağlam kapatma');return w;
  };
  const clean=await run(false);const broken=await run(true);
  const ok=offscreenOk(clean)&&!offscreenOk(broken);
  console.log(`Hareket testi sınaması: bozulmasız ${JSON.stringify(clean)}, bozulmuş ${JSON.stringify(broken)}. Sonuç: ${ok?'PASS':'FAIL'}`);
  code=ok?0:1;
 }catch(e){console.log('NOT_RUN hareket testi sınaması: '+e.message);}
 finally{if(browser)await browser.close().catch(()=>{});clearTimeout(watchdog);process.exit(code);}
}
try {
 browser=await bounded(pw[engine].launch(),12000,'tarayıcı');
 const c=await context({viewport:{width:320,height:800}});const p=await tab(c);const errors=[];const network=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>network.push(r.url()));
 await p.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.__testRaf=0;window.requestAnimationFrame=cb=>{window.__testRaf++;return raf(cb);};});
 await load(p);
 const sceneCount=await p.locator('[data-motion-scene]').count();
 check('Altı bölümün hareket sahnesi var',sceneCount===6,sceneCount);
 check('TypeScript derleme sözleşmesi var',existsSync('tsconfig.json')&&existsSync('package.json'));
 const modules=await p.locator('script[type=module][src]').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));
 check('Derlenmiş hareket önyükleyicisi kullanılıyor',modules.some(x=>x.includes('hareket/')&&x.endsWith('.js')),modules);
 await settle(p, '.hero');
 await p.screenshot({path:join(folder,engine+'-320-baslangic.png')});
 if(!sceneCount||onlyRed) throw new Error('BASELINE: yeni hareket sözleşmesi henüz yok');
 await p.waitForSelector('[data-motion-ready="true"]',{timeout:8000});
 // 320 önce. Sonra içerik kaynaklı genişlikler, yatay telefon, tablet ve masaüstü.
 for(const [width,height] of [[320,800],[360,800],[375,812],[390,844],[844,390],[768,1024],[1440,900]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(100);
  const m=await p.evaluate(()=>{
   const roots=[...document.querySelectorAll('[data-motion-scene]')];
   const text=[...document.querySelectorAll('body *')].filter(e=>!e.closest('[aria-hidden=true],.sr-only')&&e.getClientRects().length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
   return {overflow:document.documentElement.scrollWidth-innerWidth,tiny:text.filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).length,
    decorative:roots.every(e=>e.getAttribute('aria-hidden')==='true'&&getComputedStyle(e).pointerEvents==='none'),
    nodes:roots.reduce((sum,e)=>sum+e.querySelectorAll('*').length,0),maxScene:Math.max(...roots.map(e=>[...e.querySelectorAll('*')].filter(x=>getComputedStyle(x).display!=='none').length))};
  });
  check(width+'px sayfa taşmaz ve yazı küçülmez',m.overflow<=1&&m.tiny===0,m);
  check(width+'px dekorasyon eylemleri engellemez',m.decorative,m);
  check(width+'px dekoratif öğe bütçesi',m.nodes<=240&&(width>=640||m.maxScene<=64),m);
 }
 const types=await p.locator('[data-motion-scene]').evaluateAll(es=>es.map(e=>e.getAttribute('data-motion-scene')));
 check('Sahne adları ayrı',new Set(types).size===6,types);
 for(const type of types){
  const selector=`[data-motion-scene="${type}"]`;
  const a=await seek(p,selector,.28);const b=await seek(p,selector,.55);const d=await seek(p,selector,.76);const back=await seek(p,selector,.28);
  const usable=a.layers.length>0;
  check(type+' kaydırmayla görünür biçimde değişir',usable&&different(a,b)&&different(b,d),{a,b,d});
  check(type+' geri kaydırınca önceki konuma döner',near(a,back),{a,back});
  check(type+' başlığı hareketten etkilenmez',JSON.stringify(a.head)===JSON.stringify(b.head)&&JSON.stringify(b.head)===JSON.stringify(d.head),{a:a.head,b:b.head,d:d.head});
  const dx=b.layers.map((l,i)=>l.x-(a.layers[i]?.x||0));const dy=b.layers.map((l,i)=>l.y-(a.layers[i]?.y||0));
  samples.push({type,dx,dy,scales:[a,b,d].map(x=>x.layers.map(l=>l.scale))});
  if(type==='grid')check('Izgara satırları karşıt yönde ilerler',dx.some(x=>x>2)&&dx.some(x=>x< -2),dx);
  if(type==='depth')check('Derinlikte ölçek değişir',a.layers.some((l,i)=>Math.abs(l.scale-(b.layers[i]?.scale||0))>.05),{edge:a.layers,center:b.layers});
  await seek(p,selector,.28);await p.screenshot({path:join(folder,engine+'-1440-'+type+'-once.png')});
  await seek(p,selector,.76);await p.screenshot({path:join(folder,engine+'-1440-'+type+'-sonra.png')});
  await seek(p,selector,.55);await p.screenshot({path:join(folder,engine+'-1440-'+type+'.png')});
 }
 check('Yatay ve dikey hareket birlikte var',samples.some(s=>s.dx.some(x=>Math.abs(x)>12))&&samples.some(s=>s.dy.some(y=>Math.abs(y)>12)),samples);
 const curved=await p.locator('[data-motion-scene] path').evaluateAll(es=>es.some(e=>/[Cc]/.test(e.getAttribute('d')||'')));
 check('Kavisli hareketin SVG yolu var',curved);
 // Sürekli kaydırmada hareket girdi durana kadar donmamalıdır.
 await seek(p,'[data-motion-scene="grid"]',.25);
 const continuous = await p.evaluate(async () => {
  const el=document.querySelector('[data-motion-scene="grid"] [data-motion-layer]');
  const x=()=>new DOMMatrix(getComputedStyle(el).transform).m41;
  const before=x();const samples=[];
  for(let i=0;i<180;i++){
   scrollBy(0,2);await new Promise(requestAnimationFrame);
   samples.push({x:x(),y:scrollY,t:performance.now()});
  }
  let run=0,maxZero=0;
  for(let i=35;i<samples.length;i++){
   const inputChanged=samples[i].y!==samples[i-1].y;
   run=inputChanged&&Math.abs(samples[i].x-samples[i-1].x)<.00001?run+1:0;
   maxZero=Math.max(maxZero,run);
  }
  return {change:Math.abs(x()-before),samples,maxZero};
 });
 check('Sürekli kaydırmada katman girdi sürerken ilerler',continuous.change>8,continuous);
 check('Sürekli kaydırmada iki kare boyunca duraklama olmaz',continuous.maxZero<2,continuous);

 await settle(p,'[data-motion-scene="grid"]');
 // JavaScript eğrisi gerçek tarayıcı eğrisiyle aynı olmalıdır.
 const curve = await p.evaluate(async () => {
  const module = await import('./hareket/sahne.js');
  const token = getComputedStyle(document.documentElement).getPropertyValue('--ease').trim();
  const fn = module.curveOf?.(token);
  if (!fn) return {ok:false,token};
  const a = new Animation(new KeyframeEffect(null,[],{duration:1000,easing:token,fill:'both'}),document.timeline);
  a.pause();const samples=[];
  for(const t of [.1,.25,.5,.75,.9]){a.currentTime=t*1000;samples.push({t,js:fn(t),browser:a.effect.getComputedTiming().progress});}
  a.cancel();return {ok:samples.every(x=>Math.abs(x.js-x.browser)<.0001),token,samples};
 });
 check('JavaScript hareket eğrisi tarayıcıdaki merkezi eğriyle aynı',curve.ok,curve);
 // Tercih sonradan değişince çalışan paket durur ve statik yüzey geri gelir.
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);
 check('Sonradan hareket azaltmada denetleyici durur',await p.locator('[data-motion-ready="true"]').count()===0);
 const stopped=await sceneState(p,'[data-motion-scene="magnet"]');await p.evaluate(()=>scrollBy(0,-80));await p.waitForTimeout(600);
 check('Sonradan hareket azaltmada yüzey durağandır',!different(stopped,await sceneState(p,'[data-motion-scene="magnet"]')));
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForSelector('[data-motion-ready="true"]');
 check('Tercih geri açılınca altı sahne yeniden başlar',await p.locator('[data-motion-ready="true"]').count()===6);
 await p.emulateMedia({forcedColors:'active'});
 check('Zorlanmış renklerde dekorasyon metni örtmez',await p.locator('[data-motion-scene]').evaluateAll(es=>es.every(e=>getComputedStyle(e).display==='none')));
 await p.emulateMedia({forcedColors:'none',media:'print'});
 check('Yazdırmada dekorasyon gizlenir',await p.locator('[data-motion-scene]').evaluateAll(es=>es.every(e=>getComputedStyle(e).display==='none')));
 await p.emulateMedia({media:'screen'});
 // Mobilde de hareket vardır; yalnız fareye bağlı değildir.
 await p.setViewportSize({width:320,height:800});
 const mobile=await seek(p,'[data-motion-scene="depth"]',.28);const mobileAfter=await seek(p,'[data-motion-scene="depth"]',.7);
 check('Dar ekranda kaydırma hareketi çalışır',different(mobile,mobileAfter));
 await seek(p,'[data-motion-scene="depth"]',.28);await p.screenshot({path:join(folder,engine+'-320-depth.png')});
 await seek(p,'[data-motion-scene="magnet"]',.28);await p.screenshot({path:join(folder,engine+'-320-magnet.png')});
 // Durağan halde JS sürekli kare istemez. Örnek arama döngüsünü gerçek pointerdown olayıyla durdur.
 await p.evaluate(()=>document.querySelector('#q-ana')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
 await p.waitForTimeout(1500);await p.evaluate(()=>{window.__testRaf=0;});await p.waitForTimeout(700);
 check('Kaydırma durunca kare döngüsü durur',await p.evaluate(()=>window.__testRaf)===0,await p.evaluate(()=>window.__testRaf));
 const offWork=await offscreenWork(p);
 check('Ekran dışındaki sahne ölçülmez ve yazılmaz',offscreenOk(offWork),offWork);
 const hiddenBefore=await sceneState(p,'[data-motion-scene="magnet"]');
 await p.evaluate(()=>{for(const [k,v]of[['hidden',true],['visibilityState','hidden']])Object.defineProperty(document,k,{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'));scrollBy(0,-100);});
 await p.waitForTimeout(600);check('Gizli sekmede sahne değişmez',!different(hiddenBefore,await sceneState(p,'[data-motion-scene="magnet"]')));
 await p.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});
 check('Sayfa hatası yok',errors.length===0,errors);
 check('Tarayıcı TypeScript veya ağır grafik paketi istemez',!network.some(x=>/\.tsx?(\?|$)|three|gsap|\/ogl\//i.test(x)),network.filter(x=>/\.tsx?(\?|$)|three|gsap|\/ogl\//i.test(x)));
 await bounded(c.close(),3000,'bağlam kapatma');
 // Soğuk bağlamda azaltılmış hareket ve veri tasarrufu: ana hareket modülü istenmez.
 for(const mode of ['reduce','saveData','nojs']){
  const cc=await context({viewport:{width:390,height:844},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='nojs'});
  if(mode==='saveData')await cc.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,addEventListener(){},removeEventListener(){}}}));
  const pp=await tab(cc);const requests=[];pp.on('request',r=>requests.push(r.url()));await load(pp);await pp.waitForTimeout(400);
  const a=await sceneState(pp,'[data-motion-scene="flow"]');await pp.evaluate(()=>scrollBy(0,250));await pp.waitForTimeout(650);const b=await sceneState(pp,'[data-motion-scene="flow"]');
  check(mode+' durumda yüzey durağan kalır',!different(a,b),{a,b});
  check(mode+' durumda hareket paketi istenmez',!requests.some(x=>/\/hareket\/(?!baslat\.js)[^?]+\.js/.test(x)),requests.filter(x=>x.includes('/hareket/')));
  check(mode+' durumda ana eylem görünür',await pp.locator('#t-urun').count()===1&&await pp.locator('h1').isVisible());
  await bounded(cc.close(),3000,'bağlam kapatma');
 }
 // Yerel dosya bütçesi; bu değerler ağ transferi ölçümü değildir.
 if(existsSync('hareket/baslat.js')){
  const files=readdirSync('hareket').filter(f=>f.endsWith('.js')).sort((a,b)=>a==='baslat.js'?-1:b==='baslat.js'?1:a.localeCompare(b)).map(f=>'hareket/'+f);
  const sizes=files.filter(existsSync).map(file=>({file,bytes:readFileSync(file).length,gzip:gzipSync(readFileSync(file)).length}));
  check('Hareket JavaScript bütçesi',sizes.length===3&&sizes.reduce((n,x)=>n+x.gzip,0)<=16384&&sizes[0].gzip<=2048,sizes);
 }
}catch(e){if(String(e.message).startsWith('BASELINE:'))notes.push(e.message);else{notes.push('NOT_RUN: '+e.message);console.error('NOT_RUN',e.message);}}
finally{
 if(browser)await bounded(browser.close(),4000,'tarayıcı kapatma').catch(e=>notes.push('NOT_RUN: '+e.message));
 clearTimeout(watchdog);
 const report={engine,url,time:new Date().toISOString(),results,notes,samples};writeFileSync(join(folder,engine+'.json'),JSON.stringify(report,null,2));
 const fail=results.filter(r=>r.status==='fail').length;console.log(`${engine}: ${results.length-fail} pass, ${fail} fail; ${notes.join(' | ')}`);
 process.exitCode=fail||notes.some(x=>x.startsWith('NOT_RUN'))?1:0;
}
