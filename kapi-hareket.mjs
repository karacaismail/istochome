// Hareket kapısı. kapi.mjs bu modülü çağırır.
// Denetlenen: TypeScript kaynağı ve derleme çıktısı, eskimiş derleme, sahne sözleşmesi, boyut ve öğe bütçesi, lisans atfı.
// Bu bir kaynak denetimidir. Hareketin tarayıcıda nasıl göründüğünü kanıtlamaz. Onu tarayıcı testleri sınar.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

// Bütçe: projenin uygulama kararı (11 Kasım 2026). Sessizce artırılmaz.
export const BUTCE = { baslat: 2048, toplam: 16384, css: 6144, oge: 240, darSahne: 64 };
export const SAHNELER = ["flow", "grid", "route", "rise", "depth", "magnet"];
export const KAYNAK_SHA = "9d9c687dc4f55b23539aa5417b703078047efa74";
const sha = (t) => createHash("sha256").update(t).digest("hex");
const gz = (t) => gzipSync(Buffer.from(t, "utf8"), { level: 9 }).length;

// Diskten okunan girdi. Sınama kipi bu nesnenin kopyasını bozar.
export function readMotion(here) {
  const list = (dir, ext) => (existsSync(join(here, dir)) ? readdirSync(join(here, dir)).filter((f) => f.endsWith(ext)).sort() : []);
  const read = (p) => (existsSync(join(here, p)) ? readFileSync(join(here, p), "utf8") : null);
  const sources = Object.fromEntries(list("src/hareket", ".ts").map((f) => [f, read(join("src/hareket", f))]));
  const outputs = Object.fromEntries(list("hareket", ".js").map((f) => [f, read(join("hareket", f))]));
  return {
    sources, outputs,
    tsconfig: read("tsconfig.json"), pkg: read("package.json"), lock: read("package-lock.json"),
    damga: read("hareket/damga.json"), license: read("third_party/react-bits/LICENSE.md"), notices: read("THIRD_PARTY_NOTICES.md"),
  };
}

// Sahne kökünün içindeki öğeleri sayar. Dar ekranda gizlenen öğe (m-off ya da m-off içindeki) ayrı sayılır.
export function sceneCounts(html) {
  const out = [];
  const re = /<([a-zA-Z][\w-]*)\b[^>]*\bdata-motion-scene="([^"]*)"[^>]*>/g;
  for (const m of html.matchAll(re)) {
    const tag = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>/g;
    tag.lastIndex = m.index + m[0].length;
    const stack = [];
    let all = 0;
    let narrow = 0;
    let layers = 0;
    for (let t = tag.exec(html); t; t = tag.exec(html)) {
      const [, close, , attrs, self] = t;
      if (close) {
        if (!stack.length) break;
        stack.pop();
        continue;
      }
      const off = /\bclass="[^"]*\bm-off\b/.test(attrs) || stack.some((x) => x);
      all++;
      if (!off) narrow++;
      if (/\bdata-motion-layer\b/.test(attrs)) layers++;
      if (!self) stack.push(off);
    }
    out.push({ name: m[2], root: m[0], all, narrow, layers });
  }
  return out;
}

export function checkMotion(m, html, css, yayin) {
  const fails = [];
  const fail = (rule, where, detail) => fails.push({ rule, where, detail });
  // TypeScript: sıkı ayar, sabit sürüm ve kilit.
  let ts = {};
  try { ts = JSON.parse(m.tsconfig || "{}"); } catch { fail("ts", "tsconfig.json", "okunamadı"); }
  const co = ts.compilerOptions || {};
  if (co.strict !== true) fail("ts", "tsconfig.json", "strict açık değil");
  if (co.outDir !== "hareket" || co.rootDir !== "src/hareket") fail("ts", "tsconfig.json", "kaynak ya da çıktı klasörü beklenen yerde değil");
  let pkg = {};
  try { pkg = JSON.parse(m.pkg || "{}"); } catch { fail("ts", "package.json", "okunamadı"); }
  if ((pkg.devDependencies || {}).typescript !== "5.9.3") fail("ts", "package.json", "TypeScript 5.9.3 sabit sürümle yazılı değil");
  for (const s of ["build:ts", "check:ts", "build", "check"]) if (!(pkg.scripts || {})[s]) fail("ts", "package.json", `${s} betiği yok`);
  let lock = {};
  try { lock = JSON.parse(m.lock || "{}"); } catch { fail("ts", "package-lock.json", "okunamadı"); }
  if (((lock.packages || {})["node_modules/typescript"] || {}).version !== "5.9.3") fail("ts", "package-lock.json", "kilitte TypeScript 5.9.3 yok");
  const names = Object.keys(m.sources);
  if (!names.length) fail("ts", "src/hareket", "TypeScript kaynağı yok");
  for (const n of names) if (!m.outputs[n.replace(/\.ts$/, ".js")]) fail("ts", "hareket", `derleme çıktısı yok: ${n}`);
  for (const o of Object.keys(m.outputs)) if (!m.sources[o.replace(/\.js$/, ".ts")]) fail("ts", "hareket", `kaynağı olmayan çıktı: ${o}`);
  // Eskimiş derleme: damga, derleme anındaki kaynak ve çıktı özetlerini taşır. Biri değişmişse derleme yeniden yapılmalıdır.
  let damga = null;
  try { damga = JSON.parse(m.damga || "null"); } catch { damga = null; }
  if (!damga) fail("ts", "hareket/damga.json", "derleme damgası yok. npm run build:ts çalıştırın");
  else {
    if (damga.typescript !== "5.9.3") fail("ts", "hareket/damga.json", `derleyici sürümü ${damga.typescript}`);
    for (const [n, t] of Object.entries(m.sources)) if ((damga.kaynak || {})[n] !== sha(t)) fail("ts", "hareket/damga.json", `derleme eski, kaynak değişti: ${n}`);
    for (const [n, t] of Object.entries(m.outputs)) if ((damga.cikti || {})[n] !== sha(t)) fail("ts", "hareket/damga.json", `derleme çıktısı elle değişti: ${n}`);
    if (Object.keys(damga.kaynak || {}).length !== names.length) fail("ts", "hareket/damga.json", "damgadaki kaynak listesi güncel değil");
    // Derleme ayarı ve kilit dosyası derlemeden sonra değişirse derleme eskimiştir.
    for (const [n, t] of [["tsconfig.json", m.tsconfig], ["package-lock.json", m.lock]]) if (!t || (damga.ayar || {})[n] !== sha(t)) fail("ts", "hareket/damga.json", `derleme eski, ${n} değişti`);
  }
  // Derleme çıktısında hareket kuralları: süre ve eğri CSS tokenlarından gelir. Paket ve WebGL yoktur.
  const boot = m.outputs["baslat.js"] || "";
  const main = m.outputs["sahne.js"] || "";
  for (const [n, js] of Object.entries(m.outputs)) {
    if (/['"](linear|ease|ease-in|ease-out|ease-in-out)['"]|cubic-bezier\(|steps\(/.test(js)) fail("hareket", n, "token dışı eğri");
    if (/\.animate\(/.test(js)) fail("hareket", n, "animate() kullanımı");
    if (/\.style\.(transition|animation)\b/.test(js) || /setProperty\(\s*["'](transition|animation)/.test(js)) fail("hareket", n, "betikte geçiş stili");
    if (/setInterval\(/.test(js)) fail("hareket", n, "sürekli zamanlayıcı");
    if (/\bimport\b[^;]*['"](three|gsap|ogl|react|react-dom)(\/[^'"]*)?['"]|\bTHREE\.|\bgsap\.|getContext\(/.test(js)) fail("paket", n, "yasak paket, WebGL ya da Canvas");
  }
  if (!boot) fail("hareket", "hareket/baslat.js", "önyükleyici yok");
  if (!/prefers-reduced-motion: reduce/.test(boot) || !/saveData/.test(boot)) fail("hareket", "baslat.js", "hareket azaltma ya da veri tasarrufu denetlenmiyor");
  if (!/import\(\s*["']\.\/sahne\.js["']\s*\)/.test(boot) || /^\s*import\s[^(]*from\s*["']\.\/sahne\.js["']/m.test(boot)) fail("hareket", "baslat.js", "hareket paketi dinamik içe aktarılmıyor");
  if (!main) fail("hareket", "hareket/sahne.js", "hareket paketi yok");
  // Sunum geçişi: katman dönüşümü hedefe merkezi süreyle (--dur-3) ve easeInOut Cubic eğrisiyle gider.
  // Geçişsiz, anlık katman güncellemesi geri gelirse bu iz kaybolur.
  // Eğri kodda yazmaz, --ease tokenından okunur ve kübik Bezier olarak çözülür. Polinom kestirmesi kabul edilmez.
  if (!/["']--dur-3["']/.test(main) || !/["']--ease["']/.test(main) || /4 \* t \* t \* t/.test(main)) fail("hareket", "sahne.js", "sunum geçişi merkezi süre ve eğriyle yapılmıyor");
  const raf = (main.match(/requestAnimationFrame\(/g) || []).length;
  if (raf !== 1) fail("hareket", "sahne.js", `tek kare zamanlayıcısı olmalı, ${raf} çağrı var`);
  // Bütçe
  if (gz(boot) > BUTCE.baslat) fail("bütçe", "baslat.js", `gzip ${gz(boot)} bayt, sınır ${BUTCE.baslat}`);
  const total = Object.values(m.outputs).reduce((a, t) => a + gz(t), 0);
  if (total > BUTCE.toplam) fail("bütçe", "hareket", `gzip toplam ${total} bayt, sınır ${BUTCE.toplam}`);
  const seg = css.match(/\/\* hareket:başla \*\/([\s\S]*?)\/\* hareket:bitti \*\//);
  if (!seg) fail("bütçe", "styles.css", "hareket stil bölümü işaretli değil");
  else if (gz(seg[1]) > BUTCE.css) fail("bütçe", "styles.css", `hareket stili gzip ${gz(seg[1])} bayt, sınır ${BUTCE.css}`);
  // Sayfa: tek önyükleyici, doğrudan yüklenen hareket paketi yok.
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((x) => x[0]);
  if (scripts.filter((s) => /type="module"/.test(s) && /src="hareket\/baslat\.js"/.test(s)).length !== 1) fail("hareket", "index.html", "hareket önyükleyicisi tek modül betiği olarak yok");
  if (/hareket\/sahne\.js/.test(html)) fail("hareket", "index.html", "hareket paketi sayfadan doğrudan yükleniyor");
  // Sahneler
  const scenes = sceneCounts(html);
  const want = SAHNELER.filter((s) => !(yayin && s === "depth"));
  const got = scenes.map((s) => s.name).sort().join(" ");
  if (got !== [...want].sort().join(" ")) fail("sahne", "index.html", `sahneler: ${got}`);
  for (const s of scenes) {
    if (!/aria-hidden="true"/.test(s.root)) fail("sahne", s.name, "sahne okuyucudan gizli değil");
    if (!/data-axis="(x|y|xy)"/.test(s.root)) fail("sahne", s.name, "hareket ekseni yok");
    if (s.layers < 2) fail("sahne", s.name, `hareketli katman az: ${s.layers}`);
    if (s.narrow > BUTCE.darSahne) fail("bütçe", s.name, `dar ekranda ${s.narrow} öğe, sınır ${BUTCE.darSahne}`);
  }
  const sum = scenes.reduce((a, s) => a + s.all, 0);
  if (sum > BUTCE.oge) fail("bütçe", "index.html", `sahnelerde ${sum} öğe, sınır ${BUTCE.oge}`);
  // Lisans atfı
  if (!/Commons Clause/.test(m.license || "") || !/David Haz/.test(m.license || "")) fail("lisans", "third_party/react-bits/LICENSE.md", "lisans metni yok");
  if (!(m.notices || "").includes(KAYNAK_SHA)) fail("lisans", "THIRD_PARTY_NOTICES.md", "kaynak commit'i yazmıyor");
  const adapted = m.outputs["uyarlama.js"] || "";
  if (!/\/\*![\s\S]*MIT \+ Commons Clause[\s\S]*\*\//.test(adapted)) fail("lisans", "uyarlama.js", "derleme çıktısında lisans atfı yok");
  return fails;
}

// Sürekli girdi sınaması (bağımsız inceleme bulgusu, 11 Kasım 2026).
// Derlenmiş hareket paketindeki geçiş sınıfı (Tween), CSS tokenlarıyla (--ease, --dur-3) sanal saatte çalıştırılır.
// Hedef her 16 ms'de değişir (sürekli kaydırma). Beklenen davranış:
//   1. Geçiş girdinin başında donmaz: görünen değer hedefi en çok bir geçiş süresi kadar geriden izler.
//   2. Değer sıçramaz: bir karedeki adım, hedefin kare başına hızının 4 katını aşmaz. Değer geri gitmez.
//   3. Girdi kesilince geçiş en geç --dur-3 sonra biter.
//   4. Isınmadan sonra değer art arda iki karede durmaz (eğrinin periyodik yeniden başlaması yoktur).
export async function tweenCheck(here, css) {
  const fails = [];
  const fail = (detail) => fails.push({ rule: "hareket", where: "sahne.js", detail });
  let mod;
  try {
    mod = await import(new URL(`file://${join(here, "hareket", "sahne.js")}`).href);
  } catch (e) {
    fail(`hareket paketi yüklenemedi: ${String(e.message || e).split("\n")[0]}`);
    return fails;
  }
  const ease = (css.match(/--ease:\s*([^;]+);/) || [])[1] || "";
  const dur = (css.match(/--dur-3:\s*([^;]+);/) || [])[1] || "";
  const curve = mod.curveOf ? mod.curveOf(ease) : null;
  const ms = mod.durationOf ? mod.durationOf(dur) : null;
  if (!mod.Tween || !curve || !ms) {
    fail("geçiş sınıfı ya da tokenlar okunamadı");
    return fails;
  }
  const tw = new mod.Tween(0);
  tw.aim(0, 0, true, ms, curve);
  const frame = 16;
  const speed = 0.0005; // hedef ms başına 0,0005 artar
  let worstLag = 0;
  let worstStep = 0;
  let back = false;
  // Sürekli hız: ısınmadan (bir süre) sonra art arda iki karede değer durmamalıdır. Girdi her karede değişir.
  let zeroRun = 0;
  let worstZeroRun = 0;
  let prev = 0;
  let t = 0;
  for (; t <= 2000; t += frame) {
    tw.aim(t * speed, t, false, ms, curve);
    tw.step(t, ms, curve);
    if (t >= ms) worstLag = Math.max(worstLag, t * speed - tw.value);
    worstStep = Math.max(worstStep, tw.value - prev);
    // Durma: kare adımı hedefin kare adımının yüzde 5'inden küçüktür (ölçülen sorun 0,01 px altındaki adımlardı).
    if (t >= ms) { zeroRun = tw.value - prev < speed * frame * 0.05 ? zeroRun + 1 : 0; worstZeroRun = Math.max(worstZeroRun, zeroRun); }
    if (tw.value < prev - 1e-9) back = true;
    prev = tw.value;
  }
  const stop = t - frame;
  let end = stop;
  while (tw.active && end < stop + 5 * ms) { end += frame; tw.step(end, ms, curve); }
  if (worstLag > speed * ms * 1.05) fail(`sürekli girdide geçiş geride kalıyor: ${worstLag.toFixed(3)} > ${(speed * ms * 1.05).toFixed(3)}`);
  if (worstStep > speed * frame * 4 || back) fail(`sürekli girdide değer sıçrıyor ya da geri gidiyor: adım ${worstStep.toFixed(4)}`);
  if (worstZeroRun >= 2) fail(`sürekli girdide değer art arda ${worstZeroRun} karede duruyor`);
  if (end - stop > ms + frame) fail(`girdi kesilince geçiş ${end - stop} ms sürüyor, sınır ${ms} ms`);
  return fails;
}

// Sınama örnekleri: her biri beklenen kuralla reddedilmelidir.
export function motionCases(m, html, css) {
  const firstSrc = Object.keys(m.sources)[0] || "x.ts";
  const flowOpen = (html.match(/<span class="scene__tilt">/) || [""])[0];
  return [
    ["eskimiş derleme", { ...m, sources: { ...m.sources, [firstSrc]: (m.sources[firstSrc] || "") + "\n// değişti" } }, html, css, "ts"],
    ["derlemeden sonra kilit dosyası değişti", { ...m, lock: (m.lock || "").replace('"version": "0.0.0"', '"version": "0.0.1"') }, html, css, "ts"],
    ["strict kapalı", { ...m, tsconfig: (m.tsconfig || "").replace('"strict": true', '"strict": false') }, html, css, "ts"],
    ["hareket paketinde ikinci kare zamanlayıcısı", { ...m, outputs: { ...m.outputs, "sahne.js": (m.outputs["sahne.js"] || "") + "\nrequestAnimationFrame(() => 0);" } }, html, css, "hareket"],
    ["hareket paketi sayfadan doğrudan yükleniyor", m, html.replace("</body>", '<script type="module" src="hareket/sahne.js"></script></body>'), css, "hareket"],
    ["sahnede öğe bütçesi aşıldı", m, html.replace(flowOpen, flowOpen + "<i></i>".repeat(60)), css, "bütçe"],
    ["lisans atfı silindi", { ...m, license: "" }, html, css, "lisans"],
    ["katman dönüşümü geçişsiz yazılıyor", { ...m, outputs: { ...m.outputs, "sahne.js": (m.outputs["sahne.js"] || "").replace(/["']--dur-3["']/g, '"--hiz"') } }, html, css, "hareket"],
    ["eğri tokenı okunmuyor", { ...m, outputs: { ...m.outputs, "sahne.js": (m.outputs["sahne.js"] || "").replace(/["']--ease["']/g, '"--egri"') } }, html, css, "hareket"],
  ];
}
