// Tarayıcı denetimi.
//   node tarayici-testi.mjs [adres] [ekran görüntüsü klasörü]
//     Chromium ve WebKit'te (Safari ailesi) yerleşimi, renk rollerini, karşıtlığı, odağı ve etkileşimleri sınar.
//   node tarayici-testi.mjs [adres] --sinama
//     Test kendini sınar. Bilinen her bozulma kaynağa uygulanır. İlgili denetim FAIL vermelidir.
// Playwright, komşu site klasöründeki kurulumdan alınır. Önizleme sunucusu açık olmalıdır.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// Playwright önce bu klasörde aranır. Bulunamazsa komşu site klasöründeki kurulum kullanılır.
let playwright;
try {
  playwright = createRequire(join(here, "package.json"))("@playwright/test");
} catch {
  playwright = createRequire(join(here, "..", "site", "package.json"))("@playwright/test");
}
const { chromium, webkit } = playwright;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
// --sinama bütün bozulmaları dener. --sinama=<metin> yalnız adı o metni içeren bozulmaları dener.
const selfFlag = process.argv.find((a) => a.startsWith("--sinama"));
const selfTest = !!selfFlag;
const selfOnly = selfFlag ? selfFlag.split("=")[1] || "" : "";
const url = args[0] || "http://localhost:4391/";
const shots = args[1] || "";
// Sayfadaki olgular bu dosyadan gelir. Test, sayfanın veriyle aynı olduğunu da sınar.
const facts = JSON.parse(readFileSync(join(here, "data", "ana-sayfa.json"), "utf8"));
const usdRate = JSON.parse(readFileSync(join(here, "data", "kur.json"), "utf8")).TRY.USD;
// Bir ürünün sayfada beklenen koşulları: KDV dahil birim fiyat (USD) ve en az sipariş adedi.
const expected = (slug) => {
  const f = facts.urunler[slug];
  return { unit: Number((f.fiyat_try * (1 + f.kdv / 100) * usdRate).toFixed(2)), moq: f.en_az_adet, lead: f.hazirlik };
};
const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sizes = [[320, 568], [320, 700], [360, 740], [375, 760], [390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]];
const results = [];
const notRun = [];
const check = (engine, size, name, ok, detail = "") => results.push({ engine, size, name, ok, detail });

// Sayfada çalışır: yerleşim, gösterge, bileşen sınırı, renk rolü ve karşıtlık ölçümleri.
function measure() {
  const visible = (e) => {
    if (e.closest("[inert], [hidden], .sr-only")) return false;
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    if (!(r.width > 0 && r.height > 0) || s.visibility === "hidden" || s.display === "none") return false;
    // Kapalı açılır liste gibi tümüyle saydam katmanlar görünür sayılmaz.
    for (let n = e; n; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.05) return false;
    return true;
  };
  const rgba = (v) => {
    const m = v.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (top, bottom) => top.slice(0, 3).map((c, i) => c * top[3] + bottom[i] * (1 - top[3])).concat(1);
  // Öğenin arkasındaki etkin zemin: saydam olmayan ilk üst öğeye kadar katmanlar birleştirilir.
  const backdrop = (e) => {
    const layers = [];
    for (let n = e; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] === 1) break; }
    }
    let base = [255, 255, 255, 1];
    for (const c of layers.reverse()) base = over(c, base);
    return base;
  };
  const opacity = (e) => { let o = 1; for (let n = e; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  // Renk turuncu ailesinde mi? Ton ölçülür, böylece tokena yakın bir kod da yakalanır.
  const orangeish = (v) => {
    const c = rgba(v);
    if (!c || c[3] < 0.05) return false;
    const [R, G, B] = c.slice(0, 3).map((x) => x / 255);
    const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
    if (d === 0) return false;
    const l = (max + min) / 2;
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = (((max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4) * 60) + 360) % 360;
    return h >= 10 && h <= 55 && s >= 0.45 && l >= 0.25 && l <= 0.85;
  };
  // Metnin ekrandaki gerçek boyutu: ölçek ve yakınlaştırma yazı boyutunu dolaylı yoldan küçültebilir.
  const shrink = (e) => {
    let k = 1;
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.transform && s.transform !== "none") { const m = new DOMMatrixReadOnly(s.transform); k *= Math.min(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)); }
      if (s.scale && s.scale !== "none") k *= Math.min(...s.scale.split(" ").map(parseFloat));
      const z = parseFloat(s.zoom);
      if (z > 0 && z !== 1) k *= z;
    }
    return k;
  };
  const name = (e) => (e.className && e.className.baseVal === undefined ? e.className : e.tagName).toString().slice(0, 28) || e.tagName;
  const out = {};

  // Yerleşim ve metin
  const texts = [...document.querySelectorAll("body *")].filter((e) => visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  out.overflow = document.documentElement.scrollWidth - window.innerWidth;
  out.minFont = Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize) * shrink(e)));
  out.minWeight = Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontWeight)));
  out.font = getComputedStyle(document.body).fontFamily.split(",")[0].replace(/"/g, "");
  out.fontLoaded = document.fonts.check("16px Ubuntu");
  // Ubuntu ailesinde dört kalınlık vardır. Ara bir değer tarayıcıda başka bir kalınlığa yuvarlanır.
  out.oddWeights = [...new Set(texts.map((e) => getComputedStyle(e).fontWeight))].filter((x) => !["300", "400", "500", "700"].includes(x));
  // Tıklanamayan öğe (pointer-events: none) hedef sayılmaz.
  out.small = [...document.querySelectorAll("a, button, summary")].filter((e) => visible(e) && getComputedStyle(e).pointerEvents !== "none").map((e) => [e, e.getBoundingClientRect()])
    .filter(([, r]) => r.width < 44 || r.height < 44).map(([e]) => name(e) + ":" + e.textContent.trim().slice(0, 16) + ":" + Math.round(e.getBoundingClientRect().height));
  out.coarse = matchMedia("(any-pointer: coarse)").matches;
  out.deadLinks = [...document.querySelectorAll("a")].filter((a) => { const h = a.getAttribute("href"); return !h || h === "#"; }).map(name);
  out.brokenWords = [...document.querySelectorAll("h1, h2, h3, a, button")].filter((e) => {
    const s = getComputedStyle(e);
    return s.wordBreak === "break-all" || s.overflowWrap === "anywhere";
  }).length;
  out.heroVisible = [...document.querySelectorAll("[data-intro]")].every((e) => getComputedStyle(e).opacity === "1");
  // Sayaç geçişi bitince ekrandaki sayı gerçek değerdir. Yarım kalmış bir sayı yanlış bir olgudur.
  out.countsOff = [...document.querySelectorAll("[data-count]")].filter((e) => e.textContent !== Number(e.dataset.count).toLocaleString("tr-TR")).map((e) => e.dataset.count + ":" + e.textContent);
  out.images = [...document.images].filter((i) => i.complete && !i.naturalWidth).length;

  // Karşıtlık: her metnin rengi ile arkasındaki etkin zemin ölçülür.
  out.lowContrast = [];
  for (const e of texts) {
    const s = getComputedStyle(e);
    const fg = rgba(s.color);
    if (!fg) continue;
    const bg = backdrop(e);
    fg[3] *= opacity(e);
    const c = over(fg, bg);
    const [a, b] = [lum(c), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(s.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseFloat(s.fontWeight) >= 700);
    if (ratio >= (large ? 3 : 4.5)) continue;
    // Zemin bir üst öğe değil de kardeş bir katman olabilir (ör. seçili sekmenin altındaki kayan gösterge).
    // Bu durumda metnin altındaki gerçek katman sırası okunur ve karşıtlık yeniden ölçülür.
    e.scrollIntoView({ block: "center" });
    const r = e.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const below = stack.slice(stack.findIndex((n) => n === e || e.contains(n)) + 1).filter((n) => !e.contains(n));
    let real = [255, 255, 255, 1];
    const found = [];
    for (const n of below) {
      const c2 = rgba(getComputedStyle(n).backgroundColor);
      if (c2 && c2[3] > 0) { found.push(c2); if (c2[3] === 1) break; }
    }
    for (const c2 of found.reverse()) real = over(c2, real);
    const c3 = over(fg, real);
    const [a2, b2] = [lum(c3), lum(real)].sort((x, y) => y - x);
    const ratio2 = (a2 + 0.05) / (b2 + 0.05);
    if (ratio2 < (large ? 3 : 4.5)) out.lowContrast.push(`${name(e)} "${e.textContent.trim().slice(0, 18)}" ${Math.max(ratio, ratio2).toFixed(2)}`);
  }
  window.scrollTo(0, 0);

  // Gösterge: yapı durağan halde anlaşılır.
  out.unregistered = [];
  out.noCue = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (!/(auto|scroll)/.test(s.overflowX) || el.scrollWidth <= el.clientWidth + 1 || !visible(el)) continue;
    if (!el.hasAttribute("data-scroller")) { out.unregistered.push(name(el)); continue; }
    const mask = s.maskImage && s.maskImage !== "none" ? s.maskImage : s.webkitMaskImage;
    const inline = el.parentElement.classList.contains("rail");
    const cue = inline ? el.parentElement.querySelector('[data-rail-btn="1"]') : el.nextElementSibling;
    const cueVisible = !!cue && !cue.hidden && cue.getBoundingClientRect().width > 0;
    if (el.dataset.scroll !== "start" || !mask || mask === "none" || !cueVisible) out.noCue.push(`${name(el)}:${el.dataset.scroll}:${cueVisible}`);
  }
  out.plainLinks = [...document.querySelectorAll(".lnk span")].filter((e) => visible(e) && !getComputedStyle(e).backgroundSize.startsWith("100%")).length;
  // Liste içindeki bağlantılar (menü, kategori dizini, alt bölüm) durağan halde altı çizilidir. Kapalı menü de ölçülür.
  out.plainListLinks = [...document.querySelectorAll(".mega__links a, .mega__groups a, .dir__subs a, .fgroup a, .footer__legal li a, .dlink__t")]
    .filter((a) => !getComputedStyle(a).textDecorationLine.includes("underline")).map(name);
  out.groupArrows = [...document.querySelectorAll(".mega__group")].filter((a) => !a.querySelector("svg")).length;
  // Alt çizgi bağlantının tek göstergesidir. Zeminden seçilebilmesi için en az 3:1 karşıtlık taşır.
  const faint = new Set();
  for (const a of document.querySelectorAll(".mega__links a, .mega__groups a, .dir__subs a, .fgroup a, .footer__legal li a, .dlink__t")) {
    const c = rgba(getComputedStyle(a).textDecorationColor);
    const bg = backdrop(a);
    const line = c ? over(c, bg) : bg;
    const [hi, lo] = [lum(line), lum(bg)].sort((x, y) => y - x);
    const ratio = (hi + 0.05) / (lo + 0.05);
    if (ratio < 3) faint.add(`${name(a)} ${ratio.toFixed(2)}`);
  }
  out.faintUnderlines = [...faint].slice(0, 6);
  const seps = [...document.querySelectorAll(".nav__sep")].filter(visible);
  const allBtn = document.querySelector(".nav__all--js").getBoundingClientRect();
  const rail = document.querySelector(".nav .rail").getBoundingClientRect();
  const aside = document.querySelector(".nav__aside").getBoundingClientRect();
  // Dar ekranda şerit kendi satırındadır: iki satırı bir çizgi ayırır, satıcı bağlantısı kategori düğmesinden uzakta durur.
  // Geniş ekranda bölgeler aynı satırdadır ve dikey ayırıcılarla ayrılır.
  const railEl = document.querySelector(".nav .rail");
  if (rail.top >= allBtn.bottom - 1) {
    out.boundary = parseFloat(getComputedStyle(railEl).borderTopWidth) > 0 && (aside.width === 0 || aside.left - allBtn.right >= 16);
  } else {
    out.boundary = seps.length >= 1 && seps[0].getBoundingClientRect().left >= allBtn.right - 1 && rail.left >= seps[0].getBoundingClientRect().right - 1
      && (aside.width === 0 || (seps.length === 2 && aside.left >= seps[1].getBoundingClientRect().right - 1));
  }
  out.iconOnly = [...document.querySelectorAll(".action--desk")].filter((a) => a.offsetWidth && !a.querySelector(".action__label").offsetWidth).length;

  // Bileşen sınırı: sayfa boydan boya bantlardan oluşur. Komşu iki bant farklı zemindedir,
  // her kartın yüzeyi de içinde durduğu banttan ayrılır. Böylece bir bölümün nerede başlayıp bittiği gözle seçilir.
  const mods = [...document.querySelectorAll("main .mod")];
  const bands = [...document.querySelectorAll("main > .band"), document.querySelector(".footer")];
  const solid = (e) => over(rgba(getComputedStyle(e).backgroundColor) || [255, 255, 255, 0], [255, 255, 255, 1]);
  const ratioOf = (c1, c2) => { const [hi, lo] = [lum(c1), lum(c2)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  out.sameBands = [];
  for (let i = 1; i < bands.length; i++) if (ratioOf(solid(bands[i - 1]), solid(bands[i])) < 1.08) out.sameBands.push(`${name(bands[i - 1])} | ${name(bands[i])}`);
  out.bandCount = bands.length;
  out.flatCards = [...document.querySelectorAll(".rfqbox, .reason, .dir__item, .pc, .sc, .op, .nudge, .sell__panel, .dgroup, .ptile, .pref")].filter((c) => {
    const under = solid(c.closest(".band, .footer"));
    const top = rgba(getComputedStyle(c).backgroundColor) || [0, 0, 0, 0];
    return ratioOf(over(top, under), under) < 1.08;
  }).map(name);
  // Aynı bantta yan yana duran modüller (karşılama ve teklif kutusu) birbirine değmez.
  out.touching = [];
  for (const band of bands) {
    const inside = [...band.querySelectorAll(".mod")].map((m) => m.getBoundingClientRect());
    for (let i = 0; i < inside.length; i++) {
      for (let j = i + 1; j < inside.length; j++) {
        const p = inside[i], q = inside[j];
        const dx = Math.max(p.left, q.left) - Math.min(p.right, q.right);
        const dy = Math.max(p.top, q.top) - Math.min(p.bottom, q.bottom);
        if (dx < 0 && dy < 8) out.touching.push(`dikey ${dy.toFixed(0)}`);
        if (dy < 0 && dx < 8) out.touching.push(`yatay ${dx.toFixed(0)}`);
      }
    }
  }
  out.unnamedMods = mods.filter((m) => !m.getAttribute("aria-label") && !document.getElementById(m.getAttribute("aria-labelledby") || "-")).length;
  // Bölüm başlıkları sırayla numaralıdır: 01, 02, 03. Numara, bölümün nerede başladığını gösterir.
  out.numbers = [...document.querySelectorAll("main .mh__no")].map((e) => e.textContent.trim());
  out.numbersVisible = [...document.querySelectorAll("main .mh__no")].every(visible);

  // Renk rolü: turuncu yalnız izinli öğelerde bulunur ve bir modülde en çok bir turuncu düğme olur.
  const allowed = ".btn--brand, .search button, .count, .hl, .bottomnav__main i";
  out.strayOrange = [...document.querySelectorAll("body *")].filter((e) => {
    const s = getComputedStyle(e);
    const own = orangeish(s.backgroundColor) || orangeish(s.borderTopColor) && parseFloat(s.borderTopWidth) > 0
      || (orangeish(s.color) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    return own && !e.closest(allowed);
  }).map(name);
  // Bir bileşende en çok bir turuncu düğme durur. Üst ve alt bölüm de birer bileşendir. Renk, sınıftan değil ekrandan okunur.
  const orangeButtons = (box) => [...box.querySelectorAll("a, button")].filter((b) => visible(b) && orangeish(getComputedStyle(b).backgroundColor)).length;
  out.crowded = [...mods, document.querySelector(".header"), document.querySelector(".footer")].filter((m) => orangeButtons(m) > 1).map(name);
  // Turuncunun ilk ekrandaki alan payı
  const vw = window.innerWidth, vh = window.innerHeight;
  let orange = 0;
  for (const e of document.querySelectorAll(".btn--brand, .search button, .count, .bottomnav__main i")) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    orange += w * h;
  }
  out.orangeShare = orange / (vw * vh);

  // Hareket: tarayıcının hesapladığı her geçiş ve canlandırma merkezi eğriyi ve süre tokenlarını kullanır.
  const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
  const rootStyle = getComputedStyle(document.documentElement);
  const sec = (v) => (v.trim().endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v));
  const durs = [1, 2, 3, 4, 5].map((n) => sec(rootStyle.getPropertyValue("--dur-" + n)));
  const parts = (v) => v.split(/,(?![^(]*\))/).map((x) => x.trim());
  const off = new Set();
  let moving = 0;
  for (const el of document.querySelectorAll("body *")) {
    for (const pseudo of [null, "::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      for (const kind of ["transition", "animation"]) {
        if (kind === "animation" && s.animationName === "none") continue;
        const ds = parts(s[kind + "Duration"]).map(sec);
        const fs = parts(s[kind + "TimingFunction"]);
        ds.forEach((d, i) => {
          if (!(d > 0)) return;
          moving++;
          const f = fs[i % fs.length];
          if (f !== EASE || !durs.some((x) => Math.abs(x - d) < 0.0005)) off.add(`${name(el)}${pseudo || ""} ${kind} ${d}s ${f}`);
        });
      }
    }
  }
  out.offMotion = [...off].slice(0, 6);
  out.moving = moving;

  // Piktogram: okuyucudan gizlidir ve yanında görünür bir metin vardır.
  out.barePictos = [...document.querySelectorAll(".picto")].filter((p) => visible(p) && (p.getAttribute("aria-hidden") !== "true" || !p.parentElement.textContent.trim())).length;
  return out;
}

async function layout(page, engine, w, h) {
  const size = `${w}x${h}`;
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  // Sayfa başında üst arama kapalıdır. Kısa ekranda karşılama araması ekranın altında kalsa da
  // üst arama açılıp gezinme satırını örtmez. Kategori düğmesine dokunulabilir.
  const top = await page.evaluate(() => {
    const b = document.querySelector(".nav__all--js");
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { search: document.querySelector(".header").dataset.search, hit: !!hit && (hit === b || b.contains(hit)), what: hit ? String(hit.className).slice(0, 30) : "" };
  });
  check(engine, size, "sayfa başında üst arama kapalı, kategori düğmesine dokunulur", top.search === "off" && top.hit, JSON.stringify(top));
  // Ani sıçrama: sayfa bir bağlantıyla aramanın çok altına ve yeniden başa bir anda geçer.
  // Üst arama aşağıda açılmalı, başa dönünce kapanmalı ve gezinme satırını örtmemelidir.
  await page.evaluate(() => scrollTo(0, 3000));
  await page.waitForTimeout(400);
  const down = await page.evaluate(() => document.querySelector(".header").dataset.search);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(400);
  const up = await page.evaluate(() => {
    const b = document.querySelector(".nav__all--js");
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { search: document.querySelector(".header").dataset.search, hit: !!hit && (hit === b || b.contains(hit)) };
  });
  check(engine, size, "ani sıçramada üst arama durumu doğru kalır", down === "on" && up.search === "off" && up.hit, JSON.stringify({ down, ...up }));
  // Beliren öğeler ölçümden önce görünür yapılır ki sayfanın tamamı ölçülsün.
  await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in")));
  await page.waitForTimeout(1300);
  const m = await page.evaluate(measure);
  check(engine, size, "sayfada yatay taşma yok", m.overflow <= 0, `taşma ${m.overflow}px`);
  check(engine, size, "en küçük metin 14 px", m.minFont >= 14, `${m.minFont}px`);
  check(engine, size, "en ince yazı 300", m.minWeight >= 300, `${m.minWeight}`);
  check(engine, size, "font Ubuntu", m.font === "Ubuntu" && m.fontLoaded, m.font);
  check(engine, size, "yazı kalınlığı Ubuntu ailesinde", m.oddWeights.length === 0, m.oddWeights.join(", "));
  check(engine, size, "kelime ortasından bölme yok", m.brokenWords === 0);
  check(engine, size, "karşılama içeriği görünür", m.heroVisible);
  check(engine, size, "sayaç gerçek değerde durur", m.countsOff.length === 0, m.countsOff.join(", "));
  check(engine, size, "kırık görsel yok", m.images === 0, `${m.images}`);
  // Hedef boyutu genişliğe göre değil, işaretçiye göre sınanır: dar ekranda ve dokunmatik ekranda 44 px.
  if (w < 1024 || m.coarse) check(engine, size, "dokunma hedefi en az 44 px", m.small.length === 0, m.small.slice(0, 6).join(", "));
  check(engine, size, "hedefsiz bağlantı yok", m.deadLinks.length === 0, m.deadLinks.join(", "));
  check(engine, size, "metin karşıtlığı yeterli", m.lowContrast.length === 0, m.lowContrast.slice(0, 5).join(" | "));
  check(engine, size, "kaydırılan her alan şerit sistemine kayıtlı", m.unregistered.length === 0, m.unregistered.join(", "));
  check(engine, size, "kaydırılan alan durağan halde ipucu gösterir", m.noCue.length === 0, m.noCue.join(", "));
  check(engine, size, "metin bağlantısı durağan halde altı çizili", m.plainLinks === 0, `${m.plainLinks}`);
  check(engine, size, "liste bağlantıları durağan halde altı çizili", m.plainListLinks.length === 0 && m.groupArrows === 0, `${m.plainListLinks.slice(0, 4).join(", ")} ${m.groupArrows}`);
  check(engine, size, "liste bağlantısının alt çizgisi zeminden seçilir", m.faintUnderlines.length === 0, m.faintUnderlines.join(" | "));
  check(engine, size, "hesaplanan eğri ve süre merkezi tokenlarla aynı", m.offMotion.length === 0 && m.moving > 50, `${m.moving} geçiş, ${m.offMotion.join(" | ")}`);
  check(engine, size, "gezinme bölgeleri ayırıcıyla ayrılmış", m.boundary);
  check(engine, size, "simge düğmeleri etiketli", m.iconOnly === 0, `${m.iconOnly}`);
  check(engine, size, "komşu bantlar farklı yüzeyde", m.sameBands.length === 0 && m.bandCount >= 10, `${m.bandCount} bant. ${m.sameBands.join(", ")}`);
  check(engine, size, "kart yüzeyi bandından ayrılır", m.flatCards.length === 0, [...new Set(m.flatCards)].join(", "));
  check(engine, size, "aynı banttaki modüller birbirine değmez", m.touching.length === 0, m.touching.join(", "));
  check(engine, size, "bölüm başlıkları sırayla numaralı", m.numbersVisible && m.numbers.length >= 8 && m.numbers.every((n, i) => n === String(i + 1).padStart(2, "0")), m.numbers.join(" "));
  check(engine, size, "her modülün adı var", m.unnamedMods === 0, `${m.unnamedMods}`);
  check(engine, size, "turuncu yalnız izinli öğelerde", m.strayOrange.length === 0, m.strayOrange.join(", "));
  check(engine, size, "bileşende en çok bir turuncu düğme", m.crowded.length === 0, m.crowded.join(", "));
  check(engine, size, "turuncu ilk ekranın yüzde 5'inden az", m.orangeShare < 0.05, `${(m.orangeShare * 100).toFixed(1)}%`);
  check(engine, size, "piktogramlar etiketli", m.barePictos === 0, `${m.barePictos}`);
  if (shots) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(shots, `${engine}-${size}.png`) });
  }
}

async function behavior(page, engine, w, h) {
  const size = `${w}x${h}`;
  const wide = w >= 1024;
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1800);
  const kb = () => page.evaluate(() => document.documentElement.dataset.kb);
  // Safari, düğme ve bağlantılara varsayılan olarak Option+Tab ile gider.
  const tab = engine === "webkit" ? "Alt+Tab" : "Tab";
  const shiftTab = engine === "webkit" ? "Alt+Shift+Tab" : "Shift+Tab";

  // Odak: klavye modu kapalı başlar, yalnız Tab açar, fare kapatır. Çevreleyen halka yoktur.
  check(engine, size, "klavye modu kapalı başlar", (await kb()) === undefined);
  await page.keyboard.press("ArrowDown");
  check(engine, size, "ok tuşu klavye modunu açmaz", (await kb()) === undefined);
  await page.focus("#mod-urun");
  await page.keyboard.press(tab);
  await page.keyboard.press(shiftTab);
  const f = await page.evaluate(() => {
    const a = document.activeElement;
    const s = getComputedStyle(a);
    return { id: a.id, kb: document.documentElement.dataset.kb, outline: s.outlineStyle, shadow: s.boxShadow, deco: s.textDecorationLine };
  });
  check(engine, size, "Tab klavye modunu açar", f.kb === "on" && f.id === "mod-urun", JSON.stringify(f));
  check(engine, size, "odakta çevreleyen halka yok", f.outline === "none" && f.shadow === "none", `${f.outline} ${f.shadow}`);
  check(engine, size, "odak göstergesi görünür", f.deco.includes("underline"), f.deco);

  // Sekmeler: ok tuşu seçimi ve odağı taşır.
  await page.keyboard.press("ArrowRight");
  const t = await page.evaluate(() => ({
    id: document.activeElement.id,
    sel: document.activeElement.getAttribute("aria-selected"),
    label: document.querySelector("[data-console-label]").textContent,
    panel: document.querySelector("#konsol").getAttribute("aria-labelledby"),
  }));
  check(engine, size, "sekmede ok tuşu çalışır", t.id === "mod-uretici" && t.sel === "true" && t.label === "Üretici arayın" && t.panel === "mod-uretici", JSON.stringify(t));

  // Metin alanı odakta çevrelenmez, alt çizgi belirir.
  const field = await page.evaluate(() => {
    const input = document.querySelector("#q-ana");
    const box = input.closest(".search");
    const snap = () => getComputedStyle(box).boxShadow + getComputedStyle(box).borderTopColor + getComputedStyle(box).backgroundColor + getComputedStyle(box).outlineStyle;
    document.querySelector("#mod-urun").focus();
    const before = snap();
    const noLine = getComputedStyle(input).backgroundImage;
    input.focus();
    const s = getComputedStyle(input);
    return { same: before === snap(), noLine, line: s.backgroundImage, size: s.backgroundSize, outline: s.outlineStyle, shadow: s.boxShadow };
  });
  check(engine, size, "metin alanı odakta çevrelenmez, alt çizgi belirir",
    field.same && field.noLine === "none" && field.line.includes("linear-gradient") && /2px$/.test(field.size) && field.outline === "none" && field.shadow === "none", JSON.stringify(field));

  // Arama canlı sitedeki sonuç sayfasına gider. Sekme hedef adresi değiştirir. Boş arama gönderilmez.
  const search = await page.evaluate(() => {
    const form = document.querySelector("#konsol form");
    const before = form.action;
    document.querySelector("#mod-urun").click();
    return { uretici: before, urun: form.action, method: form.method, name: form.querySelector("input").name };
  });
  check(engine, size, "arama hedefi sekmeye göre değişir", search.uretici === "https://istoc.com/ureticiler" && search.urun === "https://istoc.com/urunler" && search.method === "get" && search.name === "q", JSON.stringify(search));
  await page.focus("#q-ana");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  check(engine, size, "boş arama gönderilmez", page.url() === url, page.url());

  // Teklif isteği: boş gönderimde hata alanın altında yazar. Dolu gönderimde sahte başarı gösterilmez.
  const rfqBtn = page.locator("[data-rfq] button[type=submit]");
  await rfqBtn.scrollIntoViewIfNeeded();
  await rfqBtn.click();
  const e1 = await page.evaluate(() => ({
    err: !document.querySelector("#t-urun-hata").hidden,
    invalid: document.querySelector("#t-urun").getAttribute("aria-invalid"),
    described: document.querySelector("#t-urun").getAttribute("aria-describedby"),
    focus: document.activeElement.id,
  }));
  check(engine, size, "boş teklif isteği hatayı alanın altında gösterir", e1.err && e1.invalid === "true" && e1.described === "t-urun-hata" && e1.focus === "t-urun", JSON.stringify(e1));
  await page.fill("#t-urun", "saklama kabı");
  await rfqBtn.click();
  const e2 = await page.evaluate(() => ({
    err: document.querySelector("#t-urun-hata").hidden,
    invalid: document.querySelector("#t-urun").getAttribute("aria-invalid"),
    done: !document.querySelector("[data-rfq-done]").hidden,
    note: document.querySelector("[data-rfq-note]").hidden,
    honest: document.querySelector("[data-rfq-done]").textContent.includes("gönderilmedi"),
  }));
  check(engine, size, "teklif isteği sahte başarı göstermez", e2.err && e2.invalid === null && e2.done && e2.note && e2.honest && page.url() === url, JSON.stringify(e2));

  // Kategori menüsü: düğmeyle açılır, alt menü öğeleri görünür, Escape kapatır ve odağı geri verir.
  const megaState = () => page.evaluate(() => {
    const cats = [...document.querySelectorAll(".mega__cat")];
    const open = cats.filter((c) => c.getAttribute("aria-expanded") === "true");
    const sub = open[0] && document.getElementById(open[0].getAttribute("aria-controls"));
    return {
      expanded: document.querySelector(".nav__all--js").getAttribute("aria-expanded"),
      inert: document.querySelector("#mega").inert,
      openCats: open.length,
      first: open[0] ? open[0].id : "",
      subInert: sub ? sub.inert : null,
      subHeight: sub ? Math.round(sub.getBoundingClientRect().height) : 0,
      links: sub ? sub.querySelectorAll("a[href*='/kategori/']").length : 0,
      closedInert: cats.filter((c) => c.getAttribute("aria-expanded") !== "true").every((c) => document.getElementById(c.getAttribute("aria-controls")).inert),
      focus: document.activeElement.className,
    };
  });
  await page.mouse.click(5, 5);
  check(engine, size, "fare klavye modunu kapatır", (await kb()) === undefined);
  // Durum anında güncellenir. Tıklamadan hemen sonra, geçiş bitmeden okunur. Görünüm ayrıca, geçişten sonra ölçülür.
  const megaLook = () => page.evaluate(() => {
    const m = document.querySelector("#mega");
    return { opacity: getComputedStyle(m).opacity, h: Math.round(m.getBoundingClientRect().height) };
  });
  await page.click(".nav__all--js");
  let mg = await megaState();
  check(engine, size, "kategori menüsü açılır, durum anında güncellenir", mg.expanded === "true" && mg.inert === false && mg.closedInert, JSON.stringify(mg));
  if (wide) check(engine, size, "geniş ekranda ilk alt menü açık", mg.openCats === 1 && mg.first === "mgb-1" && mg.subInert === false && mg.links >= 4, JSON.stringify(mg));
  else check(engine, size, "dar ekranda alt menüler kapalı başlar", mg.openCats === 0, JSON.stringify(mg));
  await page.waitForTimeout(800);
  let look = await megaLook();
  check(engine, size, "kategori menüsü geçişten sonra görünür", look.opacity === "1" && look.h > 200, JSON.stringify(look));
  if (wide) {
    await page.click("#mgb-3");
    mg = await megaState();
    check(engine, size, "başka üst kategori alt menüyü değiştirir", mg.openCats === 1 && mg.first === "mgb-3" && mg.subInert === false && mg.links >= 4, JSON.stringify(mg));
    await page.click("#mgb-3");
    mg = await megaState();
    check(engine, size, "geniş ekranda bir alt menü hep açık kalır", mg.openCats === 1, JSON.stringify(mg));
  } else {
    await page.click("#mgb-2");
    mg = await megaState();
    check(engine, size, "üst kategori alt menüyü açar, durum anında güncellenir", mg.openCats === 1 && mg.first === "mgb-2" && mg.subInert === false && mg.links >= 4, JSON.stringify(mg));
    await page.waitForTimeout(800);
    mg = await megaState();
    check(engine, size, "alt menü geçişten sonra görünür", mg.subHeight > 100, JSON.stringify(mg));
    await page.click("#mgb-2");
    mg = await megaState();
    check(engine, size, "aynı üst kategori alt menüyü kapatır", mg.openCats === 0 && mg.closedInert, JSON.stringify(mg));
    await page.waitForTimeout(800);
  }
  // Ok tuşları üst kategoriler arasında odağı taşır, seçimi değiştirmez.
  await page.focus("#mgb-1");
  await page.keyboard.press("ArrowDown");
  const k1 = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press("End");
  const k2 = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press("Home");
  const k3 = await page.evaluate(() => document.activeElement.id);
  check(engine, size, "menüde ok tuşları üst kategoriler arasında gezer", k1 === "mgb-2" && k2 === "mgb-10" && k3 === "mgb-1", `${k1} ${k2} ${k3}`);
  check(engine, size, "ok tuşu klavye modunu açmaz (menü)", (await kb()) === undefined);
  // Son kategoride End ve aşağı ok menünün içinde kalır. Sayfa kaymaz.
  await page.focus("#mgb-10");
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  const edge = await page.evaluate(() => ({ y: scrollY, id: document.activeElement.id }));
  check(engine, size, "son kategoride ok tuşu sayfayı kaydırmaz", edge.y === y0 && edge.id === "mgb-10", JSON.stringify({ ...edge, y0 }));
  await page.keyboard.press("Escape");
  mg = await megaState();
  check(engine, size, "Escape menüyü kapatır, odak düğmeye döner", mg.expanded === "false" && mg.inert === true && mg.focus.includes("nav__all--js"), JSON.stringify(mg));
  // Menü yüzeyinin yanındaki saydam paya dokunmak da menüyü kapatır.
  await page.click(".nav__all--js");
  await page.waitForTimeout(800);
  const sheet = await page.evaluate(() => { const r = document.querySelector(".mega__panel").getBoundingClientRect(); return { left: r.left, y: r.top + 60 }; });
  await page.mouse.click(Math.max(2, sheet.left / 2), sheet.y);
  mg = await megaState();
  check(engine, size, "menünün yanındaki boşluğa dokunmak menüyü kapatır", sheet.left > 4 && mg.expanded === "false" && mg.inert === true, JSON.stringify({ ...sheet, expanded: mg.expanded }));
  // Geri sekme: odak düğmeye geçince menü açık kalır. Odak düğmeden de çıkınca menü kapanır.
  await page.click(".nav__all--js");
  await page.waitForTimeout(800);
  await page.focus("#mgb-1");
  await page.keyboard.press(shiftTab);
  const back1 = await megaState();
  await page.keyboard.press(shiftTab);
  const back2 = await megaState();
  check(engine, size, "geri sekmeyle menüden çıkınca menü kapanır", back1.expanded === "true" && back1.focus.includes("nav__all--js") && back2.expanded === "false" && back2.inert === true, JSON.stringify({ a: back1.expanded, f: back1.focus, b: back2.expanded }));
  // Menüdeki teklif isteği bağlantısı menüyü kapatır ve sayfayı teklif kutusuna götürür.
  await page.click(".nav__all--js");
  await page.waitForTimeout(800);
  await page.locator("[data-mega-kapat]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.click("[data-mega-kapat]");
  await page.waitForTimeout(300);
  mg = await megaState();
  check(engine, size, "menüdeki teklif bağlantısı menüyü kapatır", mg.expanded === "false" && mg.inert === true && page.url().endsWith("#teklif"), JSON.stringify({ expanded: mg.expanded, url: page.url() }));
  // Sonraki denetimler sayfanın adresini parçasız bekler.
  await page.evaluate(() => { history.replaceState(null, "", location.pathname); scrollTo(0, 0); });
  await page.mouse.click(5, 5);

  // Piktogram çizgisi belirdikten sonra tamamlanır.
  // Gerekçeler dar ekranda uzun bir listedir. Ölçülen piktogram ilk karttadır, bu yüzden ilk kart ekrana getirilir.
  await page.evaluate(() => document.querySelector(".reasons .reason").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(2300);
  const drawn = await page.evaluate(() => getComputedStyle(document.querySelector(".reasons .picto .s")).strokeDashoffset);
  check(engine, size, "piktogram çizimi tamamlanır", drawn === "0px", drawn);

  // Örnek sipariş: adet en az sipariş adedinin katıyla artar, toplam anında güncellenir.
  // Bağlayıcı adımın düğmesi lacivert renktedir ve güvence satırı taşır.
  await page.locator("[data-inc]").scrollIntoViewIfNeeded();
  const secure = await page.evaluate(() => {
    const b = document.querySelector("[data-order-add]");
    const note = b.parentElement.querySelector(".secure__note");
    document.querySelector("[data-inc]").focus();
    return {
      bg: getComputedStyle(b).backgroundColor,
      note: note ? note.textContent.trim().length : 0,
      badge: getComputedStyle(document.querySelector(".op .vb")).color,
    };
  });
  check(engine, size, "bağlayıcı düğme lacivert ve güvence satırlı", secure.bg === "rgb(16, 37, 60)" && secure.note > 20, JSON.stringify(secure));
  check(engine, size, "açık yüzeyde rozet okunur", secure.badge === "rgb(10, 107, 72)", secure.badge);
  // Beklenen adet ve toplam veri dosyasından hesaplanır. Kur ya da fiyat değişince test kendiliğinden uyar.
  const sampleSlug = await page.evaluate(() => document.querySelector("[data-order]").dataset.slug);
  const want = expected(sampleSlug);
  const wantQty = want.moq * 2;
  const wantTotal = money(wantQty * want.unit);
  await page.click("[data-inc]");
  const q = await page.evaluate(() => ({ qty: document.querySelector("[data-qty]").textContent, sr: document.querySelector("[data-total-sr]").textContent, dec: document.querySelector("[data-dec]").getAttribute("aria-disabled") }));
  check(engine, size, "adet en az sipariş adedi kadar artar", q.qty === wantQty.toLocaleString("tr-TR") && q.sr === "Toplam " + wantTotal && q.dec === "false", JSON.stringify({ ...q, wantQty, wantTotal }));
  await page.click("[data-order-add]");
  await page.waitForTimeout(900);
  const c = await page.evaluate((slug) => ({
    units: document.querySelector("[data-cart-units]").textContent,
    total: document.querySelector("[data-cart-total]").textContent,
    bar: document.querySelector("[data-cartbar]").classList.contains("is-on"),
    inert: document.querySelector("[data-cartbar]").inert,
    card: document.querySelector(`.pc[data-slug="${slug}"] .pc__add`).getAttribute("aria-pressed"),
    note: (document.querySelector(".cartbar__note") || {}).textContent || "",
    said: document.querySelector("#durum").textContent,
  }), sampleSlug);
  check(engine, size, "sepet özeti güncellenir", c.units === `1 ürün, ${wantQty.toLocaleString("tr-TR")} adet` && c.total === wantTotal && c.bar && !c.inert && c.card === "true", JSON.stringify({ ...c, wantTotal }));
  // Sepet canlı siteye bağlı değildir. Çubuk ve duyuru bunu açıkça söyler. Sahte başarı gösterilmez.
  const bar = await page.evaluate(() => {
    const el = document.querySelector(".cartbar");
    const r = el.getBoundingClientRect();
    const noteEl = el.querySelector(".cartbar__note");
    const note = noteEl ? noteEl.getBoundingClientRect() : null;
    const link = el.querySelector("a").getBoundingClientRect();
    return {
      share: r.height / innerHeight, overflow: el.scrollWidth - el.clientWidth, noteInside: !!note && note.right <= r.right + 1 && note.left >= r.left - 1,
      link: Math.round(link.height), labels: [...document.querySelectorAll("[data-cart-link]")].map((a) => a.getAttribute("aria-label")),
    };
  });
  check(engine, size, "sepet örnek olduğunu söyler",
    /örnek/.test(c.note) && /canlı sepete eklenmez/.test(c.note) && /örnek sepette/.test(c.said) && bar.labels.every((x) => x === "Canlı sepeti açın. Örnek sepette 1 ürün var."), JSON.stringify({ note: c.note, said: c.said, labels: bar.labels }));
  // Çubuk dar ekranda da kısa kalır. Not kendi satırında durur, dar bir sütuna sıkışmaz.
  check(engine, size, "sepet çubuğu ekranın dörtte birinden az yer kaplar", bar.share < 0.25 && bar.overflow <= 0 && bar.noteInside && bar.link >= 44, JSON.stringify(bar));

  // Süzgeç: gerçek tıklamayla art arda seçimde son seçim geçerli olur. Geçiş katmanı tıklamayı yutmaz.
  await page.locator(".filters").scrollIntoViewIfNeeded();
  await page.click('[data-filter="mutfak"]');
  await page.click('[data-filter="temizlik"]', { timeout: 4000 });
  await page.waitForTimeout(1200);
  const n = await page.evaluate(() => {
    const items = [...document.querySelectorAll("#urun-listesi > li")];
    return { shown: items.filter((l) => !l.hidden).length, want: items.filter((l) => l.dataset.cat === "temizlik").length, wrong: items.filter((l) => !l.hidden && l.dataset.cat !== "temizlik").length };
  });
  check(engine, size, "süzgeç son seçimi uygular", n.want > 0 && n.shown === n.want && n.wrong === 0, JSON.stringify(n));
  // Kart üzerine gelince yerinden oynamaz.
  await page.locator("#urun-listesi > li:not([hidden]) .pc__body").first().hover();
  await page.waitForTimeout(500);
  const lift = await page.evaluate(() => getComputedStyle(document.querySelector("#urun-listesi > li:not([hidden]) .pc")).transform);
  check(engine, size, "kart üzerine gelince kaymaz", lift === "none", lift);

  // Sık sorulanlar: kapalı yanıt klavyeden gizlidir, açılınca erişilir.
  const faq = page.locator(".faq button").first();
  await faq.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => document.querySelector(".faq__panel").inert);
  await faq.click();
  const a0 = await page.evaluate(() => ({ exp: document.querySelector(".faq button").getAttribute("aria-expanded"), inert: document.querySelector(".faq__panel").inert, open: document.querySelector(".faq__panel").dataset.open }));
  check(engine, size, "soru açılır, durum anında güncellenir", before === true && a0.exp === "true" && a0.inert === false && a0.open === "true", JSON.stringify(a0));
  await page.waitForTimeout(900);
  const a = await page.evaluate(() => document.querySelector(".faq__panel").offsetHeight);
  check(engine, size, "yanıt geçişten sonra görünür", a > 20, `${a}px`);

  // Para birimi: seçenekler bir radyo grubudur. Ok tuşu seçimi ve odağı birlikte taşır.
  // Seçim sayfadaki fiyatları gerçekten değiştirir. Beklenen tutar veri dosyasından hesaplanır.
  const firstSlug = await page.evaluate(() => document.querySelector(".pc").dataset.slug);
  const tryPrice = "₺" + (facts.urunler[firstSlug].fiyat_try * (1 + facts.urunler[firstSlug].kdv / 100)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  await page.focus('[data-tercih="para"] [aria-checked="true"]');
  // Klavye modu yalnız Tab ile açılır. Geri ve ileri sekme odağı yine seçili seçeneğe getirir.
  await page.keyboard.press(shiftTab);
  await page.keyboard.press(tab);
  const pf = await page.evaluate(() => {
    const el = document.activeElement;
    return { kb: document.documentElement.dataset.kb, on: el.getAttribute("aria-checked"), value: el.dataset.deger, bg: getComputedStyle(el).backgroundColor, deco: getComputedStyle(el).textDecorationLine };
  });
  check(engine, size, "seçili para birimi kutusu klavye odağını gösterir", pf.kb === "on" && pf.on === "true" && pf.value === "USD" && pf.bg === "rgb(40, 112, 195)" && pf.deco.includes("underline"), JSON.stringify(pf));
  // Para birimleri sırayla GBP, USD, EUR ve TRY durur. İki kez ileri ok TRY seçer.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const pc = await page.evaluate(() => {
    const radios = [...document.querySelectorAll('[data-tercih="para"] [role="radio"]')];
    return {
      focus: document.activeElement.dataset.deger, checked: radios.filter((r) => r.getAttribute("aria-checked") === "true").map((r) => r.dataset.deger).join(","),
      stops: radios.filter((r) => r.tabIndex === 0).length, price: document.querySelector(".pc__price b").textContent,
      label: document.querySelector("[data-tercih-deger]").textContent, said: document.querySelector("#durum").textContent,
      cart: document.querySelector("[data-cart-total]").textContent,
    };
  });
  check(engine, size, "para birimi klavyeyle seçilir", pc.focus === "TRY" && pc.checked === "TRY" && pc.stops === 1, JSON.stringify(pc));
  check(engine, size, "para birimi seçimi fiyatları değiştirir", pc.price === tryPrice && pc.cart.startsWith("₺") && /TRY$/.test(pc.label) && /para biriminde/.test(pc.said), JSON.stringify({ ...pc, want: tryPrice }));
  // Dil: seçim etikete yazılır. Bu öneride sayfa çevrilmez ve duyuru bunu açıkça söyler.
  await page.locator('[data-tercih="dil"] [data-deger="en"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.click('[data-tercih="dil"] [data-deger="en"]');
  const lg = await page.evaluate(() => ({
    label: document.querySelector("[data-tercih-deger]").textContent, said: document.querySelector("#durum").textContent,
    note: document.querySelector(".prefs__note").textContent, checked: document.querySelectorAll('[data-tercih="dil"] [aria-checked="true"]').length, lang: document.documentElement.lang,
  }));
  check(engine, size, "dil seçimi etikete yazılır ve dil değişmediği söylenir", lg.label === "English, TRY" && lg.checked === 1 && lg.lang === "tr" && /dilini değiştirmez/.test(lg.note) && /dilini değiştirmez/.test(lg.said), JSON.stringify(lg));
  // Sonraki denetimler fiyatları ABD doları olarak bekler.
  await page.click('[data-tercih="para"] [data-deger="USD"]');

  // Üst arama katmanı sayfa akışını itmez. Alan kapanırsa odak kaybolmaz.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  const h0 = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => scrollTo(0, 1600));
  await page.waitForTimeout(900);
  const s = await page.evaluate(() => ({ h: document.body.scrollHeight, on: document.querySelector(".header").dataset.search }));
  check(engine, size, "üst arama belirir, sayfa boyu değişmez", s.on === "on" && s.h === h0, JSON.stringify({ ...s, h0 }));
  // Üst arama açıkken üst bölümde en çok bir turuncu düğme görünür. Arama düğmesi güven rengindedir.
  const hdr = await page.evaluate(() => [...document.querySelectorAll(".header a, .header button")].filter((b) => {
    const r = b.getBoundingClientRect();
    const c = getComputedStyle(b).backgroundColor.match(/[\d.]+/g).map(Number);
    return r.width > 0 && !b.closest("[inert]") && c[0] > 200 && c[1] > 90 && c[1] < 180 && c[2] < 90;
  }).map((b) => b.textContent.trim()));
  check(engine, size, "üst arama açıkken üst bölümde en çok bir turuncu düğme", hdr.length <= 1, hdr.join(", "));
  // Fare odaklanan düğmenin üzerinde dursa da odak dolgusu görünür. Üzerine gelme rengi onu ezemez.
  await page.hover(".header .search button");
  await page.focus("#q-ust");
  await page.keyboard.press(tab);
  const hov = await page.evaluate(() => ({ on: !!document.activeElement.closest(".header .search") && document.activeElement.tagName === "BUTTON", bg: getComputedStyle(document.activeElement).backgroundColor, kb: document.documentElement.dataset.kb }));
  check(engine, size, "fare üzerindeyken de odak dolgusu görünür", hov.on && hov.kb === "on" && hov.bg === "rgb(40, 112, 195)", JSON.stringify(hov));
  await page.mouse.move(4, 300);
  // Üst aramada yazan kullanıcının alanı, sayfa başa dönse de kapanmaz. Odak alandan çıkınca kapanır.
  await page.focus("#q-ust");
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  const kept = await page.evaluate(() => ({ id: document.activeElement.id, on: document.querySelector(".header").dataset.search, inert: document.querySelector(".header__search").inert }));
  check(engine, size, "üst aramada odak varken alan kapanmaz", kept.id === "q-ust" && kept.on === "on" && kept.inert === false, JSON.stringify(kept));
  // Alan yalnız odak sayesinde açıkken "Arayın" düğmesine fareyle tıklanır. Safari tıklanan düğmeye odak vermez.
  // Alan basış sırasında kapanırsa tıklama yutulur. Boş arama gönderilmez ve odak alana döner: tıklama ulaştıysa odak alandadır.
  await page.click(".header .search button");
  await page.waitForTimeout(300);
  const clicked = await page.evaluate(() => ({ id: document.activeElement.id, on: document.querySelector(".header").dataset.search }));
  check(engine, size, "üst arama düğmesinin tıklaması yutulmaz", clicked.id === "q-ust" && clicked.on === "on" && page.url() === url, JSON.stringify(clicked));
  await page.evaluate(() => document.querySelector("#mod-urun").focus());
  await page.waitForTimeout(400);
  const left = await page.evaluate(() => ({ on: document.querySelector(".header").dataset.search, inert: document.querySelector(".header__search").inert }));
  check(engine, size, "odak üst aramadan çıkınca alan kapanır", left.on === "off" && left.inert === true, JSON.stringify(left));

  // Şeritte ok düğmesinin hemen yanındaki bağlantıya dokunulur. Bağlantı işaretçiyle odaklanınca yerinden oynamamalıdır.
  // Oynarsa basış başka bir öğenin üstünde biter ve tıklama kaybolur. Tıklama yakalanır, sayfa değişmez.
  const tapAt = await page.evaluate(() => {
    scrollTo(0, 0);
    const sc = document.querySelector(".nav [data-scroller]");
    sc.scrollLeft = 0;
    const next = document.querySelector('.nav [data-rail-btn="1"]');
    if (next.hidden) return null;
    const arrow = next.getBoundingClientRect();
    const zone = parseFloat(getComputedStyle(sc).scrollPaddingRight) || 0;
    const box = sc.getBoundingClientRect();
    const link = [...sc.querySelectorAll("a")].find((a) => { const r = a.getBoundingClientRect(); return r.left < arrow.left - 8 && r.right > box.right - zone + 4; });
    if (!link) return null;
    window.__tap = "";
    document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest("a"); window.__tap = a ? a.textContent.trim() : "başka öğe"; e.preventDefault(); }, { capture: true, once: true });
    const r = link.getBoundingClientRect();
    // Dokunma noktası okun hemen solundadır. Bağlantı işaretçiyle odaklanınca kayarsa bu nokta bağlantının dışında kalır.
    return { x: arrow.left - 1.5, y: r.top + r.height / 2, text: link.textContent.trim() };
  });
  if (tapAt) {
    await page.waitForTimeout(300);
    await page.mouse.click(tapAt.x, tapAt.y);
    await page.waitForTimeout(300);
    const tapped = await page.evaluate(() => window.__tap);
    check(engine, size, "şeritteki bağlantıya dokunmak onu açar", tapped === tapAt.text && page.url().split("#")[0] === url, JSON.stringify({ tapAt, tapped }));
  }
  // Ok düğmesi şeridi kaydırır. Geri oku ve konum çubuğu durumu gösterir.
  const railNext = page.locator('.nav [data-rail-btn="1"]');
  if (await railNext.isVisible()) {
    await railNext.click();
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const el = document.querySelector(".nav [data-scroller]");
      return { x: Math.round(el.scrollLeft), state: el.dataset.scroll, prev: !document.querySelector('.nav [data-rail-btn="-1"]').hidden };
    });
    check(engine, size, "ok düğmesi gezinme şeridini kaydırır", r.x > 50 && r.prev && r.state !== "start", JSON.stringify(r));
  }
  await page.click('[data-filter=""]');
  await page.waitForTimeout(900);
  const ctlNext = page.locator('#urun-listesi + .rail-ctl [data-rail-btn="1"]');
  if (await ctlNext.isVisible()) {
    await ctlNext.scrollIntoViewIfNeeded();
    await ctlNext.click();
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const el = document.querySelector("#urun-listesi");
      const ctl = el.nextElementSibling;
      return { x: Math.round(el.scrollLeft), pos: parseFloat(ctl.style.getPropertyValue("--pos")), prev: ctl.querySelector('[data-rail-btn="-1"]').getAttribute("aria-disabled") };
    });
    check(engine, size, "kart şeridi oku ve konum çubuğu çalışır", r.x > 50 && r.pos > 0 && r.prev === "false", JSON.stringify(r));
  }

  // Dizin: her grup ürünleri başka bir yoldan bulur. Dar ekranda yalnız ilk grup açık başlar,
  // kapalı grubun başlığına dokununca grup açılır. Geniş ekranda gruplar hep açıktır ve başlık bir düğme değildir.
  const dz = await page.evaluate(() => {
    const groups = [...document.querySelectorAll(".dgroup")];
    const links = [...document.querySelectorAll(".dlink")];
    return {
      groups: groups.length, open: groups.filter((g) => g.open).length, links: links.length,
      live: links.every((l) => l.href.startsWith("https://istoc.com/")), counted: links.filter((l) => l.querySelector(".dlink__n")).length,
      stops: groups.filter((g) => g.querySelector("summary").tabIndex === 0).length,
    };
  });
  check(engine, size, "dizin grupları canlı adreslere gider", dz.groups >= 6 && dz.links >= 30 && dz.live && dz.counted >= 20, JSON.stringify(dz));
  if (w < 700) {
    check(engine, size, "dar ekranda yalnız ilk dizin grubu açık başlar", dz.open === 1 && dz.stops === dz.groups, JSON.stringify(dz));
    const second = page.locator(".dgroup:nth-of-type(2) summary");
    await second.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await second.click();
    const opened = await page.evaluate(() => { const g = document.querySelector(".dgroup:nth-of-type(2)"); return { open: g.open, h: Math.round(g.querySelector("ul").getBoundingClientRect().height) }; });
    check(engine, size, "dizin grubu dar ekranda açılır", opened.open && opened.h > 100, JSON.stringify(opened));
  } else {
    check(engine, size, "geniş ekranda dizin grupları hep açık", dz.open === dz.groups && dz.stops === 0, JSON.stringify(dz));
  }
  // Sık arananlar: her kutucuk canlı sitedeki arama sonucuna gider.
  const chips = await page.evaluate(() => [...document.querySelectorAll(".chip")].map((c) => c.href));
  check(engine, size, "sık arananlar canlı aramaya gider", chips.length >= 4 && chips.every((x) => x.startsWith("https://istoc.com/urunler?q=")), chips.join(" "));
  // Konum çubuğu: sayfa kaydıkça ilerler. Değer kaydırmaya bağlıdır.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  const p0 = await page.evaluate(() => parseFloat(document.querySelector("[data-progress]").style.getPropertyValue("--p")) || 0);
  await page.evaluate(() => scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) / 2)));
  await page.waitForTimeout(350);
  const p1 = await page.evaluate(() => { const bar = document.querySelector("[data-progress]"); return { p: parseFloat(bar.style.getPropertyValue("--p")) || 0, w: Math.round(bar.getBoundingClientRect().width), vw: innerWidth }; });
  check(engine, size, "konum çubuğu kaydırmayla ilerler", p0 < 0.02 && Math.abs(p1.p - 0.5) < 0.05 && Math.abs(p1.w - p1.p * p1.vw) < 3, JSON.stringify({ p0, ...p1 }));
  // İşaretçi ışığı: koyu bantta ışık işaretçiyi izler. Kartın üstünde ışık belirir, kart yerinden oynamaz.
  // Yalnız fareyle kullanılan ekranda çalışır. Dokunmatik ekranda ışık sabit durur.
  if (wide) {
    const canHover = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
    if (!canHover) notRun.push(`${engine} ${size}: bu motor fare işaretçisini öykünmedi, ışık denetimi çalışmadı`);
    else {
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(250);
      const box = await page.locator(".band--hero").boundingBox();
      await page.mouse.move(box.x + 200, box.y + 150);
      await page.mouse.move(box.x + 320, box.y + 210);
      await page.waitForTimeout(800);
      const spot = await page.evaluate(() => {
        const band = document.querySelector(".band--hero");
        const light = band.querySelector(".spot i").getBoundingClientRect();
        const r = band.getBoundingClientRect();
        return { mx: band.style.getPropertyValue("--mx"), my: band.style.getPropertyValue("--my"), cx: Math.round(light.left + light.width / 2 - r.left), cy: Math.round(light.top + light.height / 2 - r.top) };
      });
      check(engine, size, "ışık işaretçiyi izler", spot.mx === "320px" && spot.my === "210px" && Math.abs(spot.cx - 320) < 3 && Math.abs(spot.cy - 210) < 3, JSON.stringify(spot));
      await page.locator(".pc").first().scrollIntoViewIfNeeded();
      await page.locator(".pc .pc__body").first().hover();
      await page.waitForTimeout(500);
      const glow = await page.evaluate(() => { const card = document.querySelector(".pc"); return { on: getComputedStyle(card, "::after").opacity, gx: card.style.getPropertyValue("--gx"), move: getComputedStyle(card).transform }; });
      check(engine, size, "kartın üstünde ışık belirir, kart oynamaz", glow.on === "1" && /px$/.test(glow.gx) && glow.move === "none", JSON.stringify(glow));
      await page.mouse.move(4, 300);
    }
  }

  // İçeriğe atla bağlantısı ilk klavye durağıdır ve odakta görünür.
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.keyboard.press(tab);
  await page.waitForTimeout(600);
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    return { cls: el.className, top: Math.round(el.getBoundingClientRect().top), href: el.getAttribute("href") };
  });
  check(engine, size, "içeriğe atla bağlantısı görünür", skip.cls === "skip" && skip.top >= 0 && skip.href === "#icerik", JSON.stringify(skip));
  // Bağlantı çalıştırılınca odak ana bölüme geçer. Ana bölüm bir denetim değildir.
  // İçindeki piktogramlar ve soluk metinler odak rengine dönmemelidir.
  const tone = () => page.evaluate(() => ({
    picto: getComputedStyle(document.querySelector(".reasons .picto")).backgroundColor,
    small: getComputedStyle(document.querySelector(".dir__head small")).color,
    icon: getComputedStyle(document.querySelector(".dir__head > svg")).color,
    focus: document.activeElement.id,
    visible: document.activeElement.matches(":focus-visible"),
    kb: document.documentElement.dataset.kb,
  }));
  const calm = await tone();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await page.evaluate(() => { const main = document.querySelector("#icerik"); if (document.activeElement !== main) main.focus(); });
  const jumped = await tone();
  check(engine, size, "içeriğe atlayınca sayfa renk değiştirmez",
    jumped.focus === "icerik" && jumped.kb === "on" && jumped.picto === calm.picto && jumped.small === calm.small && jumped.icon === calm.icon, JSON.stringify({ calm, jumped }));

  // Odaklanan öğe mobil alt gezinmenin arkasında kalmaz. Öğe önce çubuğun arkasına denk getirilir, sonra odaklanır.
  if (!wide) {
    const behind = await page.evaluate(async () => {
      const nav = document.querySelector(".bottomnav").getBoundingClientRect();
      const out = [];
      for (const sel of [".dir__subs a", ".faq:nth-of-type(3) button", ".dgroup:nth-of-type(3) summary", ".fgroup:nth-of-type(2) summary", '[data-tercih="dil"] [role="radio"]', ".footer__legal li a"]) {
        const el = document.querySelector(sel);
        window.scrollTo(0, window.scrollY + el.getBoundingClientRect().bottom - window.innerHeight + 6);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const was = Math.round(el.getBoundingClientRect().bottom - nav.top);
        el.focus();
        await new Promise((r) => setTimeout(r, 250));
        const now = Math.round(el.getBoundingClientRect().bottom - nav.top);
        if (was <= 0) out.push(sel + " çubuğun arkasına getirilemedi");
        else if (now > 1) out.push(sel + " " + now + "px arkada");
      }
      return out;
    });
    check(engine, size, "odaklanan öğe alt gezinmenin arkasında kalmaz", behind.length === 0, behind.join(", "));
  }
  // Sepet çubuğu açıkken alt pay büyür. Odaklanan öğe çubuğun arkasında da kalmaz.
  await page.locator(".pc__add").first().scrollIntoViewIfNeeded();
  await page.locator(".pc__add").first().click();
  await page.waitForTimeout(900);
  const covered = await page.evaluate(async () => {
    const out = [];
    for (const sel of [".faq:nth-of-type(4) button", ".footer__legal li:last-child a"]) {
      const el = document.querySelector(sel);
      const bar = document.querySelector(".cartbar").getBoundingClientRect();
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().bottom - window.innerHeight + 6);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      el.focus();
      await new Promise((r) => setTimeout(r, 250));
      const r1 = el.getBoundingClientRect();
      // Yatayda çubukla kesişen öğe, dikeyde çubuğun üstünde durmalıdır.
      const overlapX = r1.right > bar.left && r1.left < bar.right;
      if (overlapX && r1.bottom > bar.top + 1) out.push(sel + " " + Math.round(r1.bottom - bar.top) + "px arkada");
    }
    return { out, dock: getComputedStyle(document.documentElement).getPropertyValue("--cartbar-h").trim(), on: document.querySelector(".cartbar").classList.contains("is-on") };
  });
  check(engine, size, "odaklanan öğe sepet çubuğunun arkasında kalmaz", covered.on && /^\d+px$/.test(covered.dock) && covered.out.length === 0, JSON.stringify(covered));

  // Yazdırma: beliren bölümler, kapalı yanıtlar ve piktogramlar kâğıtta görünür. Sabit çubuklar basılmaz.
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: "print" });
  // Ortam değişikliği olayı bir sonraki karede gelir. Alt bölüm gruplarının açılması için kısa süre beklenir.
  await page.waitForTimeout(250);
  const pr = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll("[data-reveal], [data-intro]")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    faq: [...document.querySelectorAll(".faq__panel")].filter((p) => p.offsetHeight < 20).length,
    nav: getComputedStyle(document.querySelector(".bottomnav")).display,
    picto: getComputedStyle(document.querySelector(".sell__list .picto .s")).strokeDashoffset,
    steps: [...document.querySelectorAll(".tl li > div")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    closedGroups: [...document.querySelectorAll("details[data-fold]")].filter((g) => !g.open).length,
  }));
  check(engine, size, "yazdırmada bütün içerik görünür", pr.hidden === 0 && pr.faq === 0 && pr.nav === "none" && pr.picto === "0px" && pr.steps === 0 && pr.closedGroups === 0, JSON.stringify(pr));
  await page.emulateMedia({ media: "screen" });

  // Olgular: ürün kartındaki koşullar ve karşılamadaki sayılar veri dosyasıyla aynıdır.
  const shown = await page.evaluate(() => ({
    cards: [...document.querySelectorAll(".pc")].map((c) => ({
      slug: c.dataset.slug, moq: c.dataset.moq, badge: !!c.querySelector(".pc__badge"), sup: c.querySelector(".pc__sup").textContent,
      badgeText: (c.querySelector(".pc__badge") || {}).textContent || "",
      terms: [...c.querySelectorAll(".terms dd")].map((d) => d.textContent),
    })),
    counts: [...document.querySelectorAll("[data-count]")].map((e) => e.dataset.count),
    src: (document.querySelector(".stats__src") || {}).textContent || "",
  }));
  const wrong = shown.cards.filter((c) => {
    const f = facts.urunler[c.slug];
    // Rozet "üretici" sözünü yalnız mağazanın işletme türü üreticiyse kullanır.
    const maker = f && f.uretici_tur === "Manufacturer";
    return !f || String(f.en_az_adet) !== c.moq || f.uretici_dogrulanmis !== c.badge || f.uretici !== c.sup || !c.terms.includes(f.hazirlik)
      || (c.badge && c.badgeText.includes("üretici") !== maker);
  }).map((c) => c.slug);
  check(engine, size, "ürün kartı koşulları veriyle aynı", shown.cards.length === Object.keys(facts.urunler).length && wrong.length === 0, wrong.join(", "));
  check(engine, size, "karşılamadaki sayılar veriyle aynı ve günü yazıyor",
    shown.counts[0] === String(facts.urun_toplami) && shown.counts[2] === String(facts.dogrulanmis_magaza) && shown.counts[3] === String(facts.para_birimleri.length) && /\d{4}/.test(shown.src),
    JSON.stringify(shown.counts) + " " + shown.src);
}

// Klavye odağı görünürlüğü. Sayfa gerçek Tab tuşuyla baştan sona dolaşılır.
// Her durakta öğenin dolgusu, odak göstergesi kapalıyken görünen dolgusundan en az 3:1 karşıtlıkla ayrılmalıdır.
// Metin alanında dolgu değişmez, yazının altında çizgi belirir. Hiçbir durakta çevreleyen halka olmaz.
// Ölçüm ekrandan yapılır: öğenin altındaki gerçek katmanlar (örneğin seçili sekmenin kayan göstergesi) hesaba katılır.
// Tur kapalı duran denetimleri de açar ve ölçer: üst arama, kategori menüsü, sepetteki ürün düğmesi ve sepet çubuğu.

// Sayfada çalışır: odaktaki öğeyi ölçer. force verilirse daha önce görülen öğe yeniden ölçülür.
async function tourProbe(force) {
  const t = window.__tour;
  const root = document.documentElement;
  const el = document.activeElement;
  if (!el || el === document.body || el === root) return t.stops > 5;
  // Safari odaklanan metin alanını birkaç kare içinde ekrana getirir ve alt kaydırma payını o sırada uygular.
  // Ölçümden önce üç kare beklenir. Hemen ölçülürse alan henüz alt menünün arkasında görünür.
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))));
  for (let k = 0; k < 6; k++) {
    const b = el.getBoundingClientRect();
    if (b.top >= 0 && b.bottom <= innerHeight) break;
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  }
  if (t.seen.has(el) && !force) return true;
  t.seen.add(el);
  t.stops += 1;
  const rgba = (v) => { const m = v.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (top, bottom) => top.slice(0, 3).map((c, k) => c * top[3] + bottom[k] * (1 - top[3])).concat(1);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const label = (String(el.className).split(" ")[0] || el.tagName) + ":" + (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 14);
  t.names.push(label);
  // Öğenin kendi dolgusu ve altındaki katmanlar. İçindeki çocuk öğeler (simge kutusu gibi) sayılmaz.
  const r = el.getBoundingClientRect();
  const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
  const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
  // Öğenin solunda, ortasında ve sağında en üstte kendisi ya da kendi içeriği durmalıdır.
  // Bu noktalardan birinde başka bir katman duruyorsa öğe örtülüdür (örneğin şeridin ok düğmesi).
  for (const share of [0.15, 0.5, 0.85]) {
    const px = Math.min(innerWidth - 1, Math.max(0, r.left + r.width * share));
    const top = document.elementFromPoint(px, y);
    if (!top || !(top === el || el.contains(top))) {
      t.covered.push(label + " üstünde: " + (top ? String(top.className.baseVal ?? top.className).slice(0, 24) || top.tagName : "yok") + " x=" + Math.round(px) + " y=" + Math.round(r.top));
      return false;
    }
  }
  const own = () => {
    const stack = document.elementsFromPoint(x, y);
    const at = stack.indexOf(el);
    if (at < 0) return null;
    const layers = [];
    for (const n of stack.slice(at)) { const c = rgba(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] === 1) break; } }
    let base = [255, 255, 255, 1];
    for (const c of layers.reverse()) base = over(c, base);
    return base;
  };
  // Kenarlık yalnız çizgisi varsa karşılaştırılır. Çizgisi olmayan öğede kenarlık rengi metin rengini izler.
  const look = () => { const s = getComputedStyle(el); return { fill: own(), outline: s.outlineStyle, shadow: s.boxShadow, border: parseFloat(s.borderTopWidth) > 0 ? s.borderTopColor + s.borderTopWidth : "yok", image: s.backgroundImage, deco: s.textDecorationLine }; };
  const on = look();
  // Odak göstergesi klavye moduna bağlıdır. Mod bir an kapatılır ve aynı öğenin göstergesiz hali ölçülür.
  // Ölçüm sırasında öğenin geçişi durdurulur. Yoksa tarayıcı geçişin ilk karesini, yani eski rengi bildirir.
  const keep = el.style.transition;
  el.style.transition = "none";
  delete root.dataset.kb;
  const off = look();
  root.dataset.kb = "on";
  void el.offsetWidth;
  el.style.transition = keep;
  if (!on.fill || !off.fill) { t.covered.push(label + " ölçülemedi"); return false; }
  if (on.outline !== "none" || on.shadow !== off.shadow || on.border !== off.border) t.ring.push(label);
  if (el.tagName === "INPUT") {
    if (!on.image.includes("linear-gradient") || off.image !== "none") t.bare.push(label);
  } else if (!el.classList.contains("skip")) {
    // İçeriğe atla bağlantısı yalnız odakta görünür. Onun göstergesi görünür olmasıdır.
    const [hi, lo] = [lum(on.fill), lum(off.fill)].sort((p, q) => q - p);
    const ratio = (hi + 0.05) / (lo + 0.05);
    if (ratio < 3 || !on.deco.includes("underline")) t.weak.push(label + " " + ratio.toFixed(2));
    // Odaktaki öğenin içindeki her metin, odak dolgusunun üstünde okunmalıdır.
    // Kendi dolgusu olan iç öğe (sayaç, piktogram kutusu) kendi dolgusuna göre ölçülür.
    const under = (node) => {
      const layers = [];
      for (let n = node; n && n !== el; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] === 1) break; } }
      let base = layers.length && layers[layers.length - 1][3] === 1 ? layers.pop() : on.fill;
      for (const c of layers.reverse()) base = over(c, base);
      return base;
    };
    for (const node of [el, ...el.querySelectorAll("*")]) {
      if (node.closest(".sr-only") || !node.getClientRects().length) continue;
      if (![...node.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(node);
      const fg = rgba(s.color);
      if (!fg) continue;
      const bg = under(node);
      const [hi2, lo2] = [lum(over(fg, bg)), lum(bg)].sort((p, q) => q - p);
      const r2 = (hi2 + 0.05) / (lo2 + 0.05);
      const px = parseFloat(s.fontSize);
      const large = px >= 24 || (px >= 18.66 && parseFloat(s.fontWeight) >= 700);
      if (r2 < (large ? 3 : 4.5)) t.dim.push(label + " içindeki \"" + node.textContent.trim().slice(0, 12) + "\" " + r2.toFixed(2));
    }
  }
  return false;
}

async function focusTour(page, engine, w, h) {
  const size = `${w}x${h}`;
  const tab = engine === "webkit" ? "Alt+Tab" : "Tab";
  const shiftTab = engine === "webkit" ? "Alt+Shift+Tab" : "Shift+Tab";
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in"));
    window.__tour = { seen: new Set(), names: [], weak: [], ring: [], bare: [], covered: [], dim: [], stops: 0 };
  });
  await page.waitForTimeout(1300);
  // 1. Kapalı haldeki sayfa: baştan sona Tab.
  for (let i = 0; i < 420; i++) {
    await page.keyboard.press(tab);
    if (await page.evaluate(tourProbe, false)) break;
  }
  const visit = async (label) => { await page.evaluate(tourProbe, true); return label; };
  const active = (sel) => page.evaluate((q) => !!document.activeElement && !!document.activeElement.closest(q), sel);
  const reached = [];
  // 2. Üst arama: karşılama araması ekrandan çıkınca açılır. Alan ve yalnız simgesi görünen düğme ölçülür.
  await page.evaluate(() => scrollTo(0, 1600));
  await page.waitForTimeout(700);
  await page.focus("#q-ust");
  await page.keyboard.press(shiftTab);
  await page.keyboard.press(tab);
  if (await active("#q-ust")) reached.push(await visit("üst arama alanı"));
  await page.keyboard.press(tab);
  if (await active(".header .search button")) reached.push(await visit("üst arama düğmesi"));
  // 3. Kategori menüsü: klavyeyle açılır, içindeki denetimler dolaşılır.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.focus(".nav__all--js");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  let inMenu = 0;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press(tab);
    if (!(await active("#mega"))) break;
    await page.evaluate(tourProbe, true);
    inMenu += 1;
  }
  if (inMenu >= 8) reached.push("kategori menüsü");
  await page.keyboard.press("Escape");
  // 4. Sepetteki ürün düğmesi (yeşil) ve sepet çubuğundaki bağlantı.
  await page.locator(".pc__add").first().scrollIntoViewIfNeeded();
  await page.locator(".pc__add").first().click();
  await page.waitForTimeout(900);
  await page.focus(".pc__name a");
  await page.keyboard.press(tab);
  if (await active('.pc__add[aria-pressed="true"]')) reached.push(await visit("sepetteki ürün düğmesi"));
  await page.focus(".footer__legal > .lnk");
  await page.keyboard.press(tab);
  if (await active(".cartbar")) reached.push(await visit("sepet çubuğu bağlantısı"));
  const res = await page.evaluate(() => ({ stops: window.__tour.stops, weak: window.__tour.weak, ring: window.__tour.ring, bare: window.__tour.bare, covered: window.__tour.covered, dim: window.__tour.dim, kb: document.documentElement.dataset.kb }));
  check(engine, size, "klavye odağı her denetimde görünür", res.kb === "on" && res.stops >= 40 && res.weak.length === 0, `${res.stops} durak. Zayıf: ${res.weak.slice(0, 6).join(" | ")}`);
  check(engine, size, "odaktaki öğenin metni okunur", res.dim.length === 0, res.dim.slice(0, 6).join(" | "));
  check(engine, size, "klavye turu açık durumlara da ulaşır", reached.length === 5, reached.join(", "));
  check(engine, size, "odaklanan öğe başka bir katmanın altında kalmaz", res.covered.length === 0, res.covered.slice(0, 6).join(", "));
  check(engine, size, "metin alanında odak çizgisi belirir", res.bare.length === 0, res.bare.join(", "));
  check(engine, size, "hiçbir durakta çevreleyen halka yok", res.ring.length === 0, res.ring.slice(0, 6).join(", "));
}

// JavaScript kapalıyken sayfa: içerik görünür kalır, kategori bölümüne giden bağlantı görünür ve klavye odağı görünür.
// JavaScript yokken klavye modu izlenemez. Odak göstergesi tarayıcının kendi :focus-visible kararıyla açılmalıdır.
async function noScript(browser, engine, prepare) {
  const size = "390x844 betiksiz";
  const tab = engine === "webkit" ? "Alt+Tab" : "Tab";
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  if (prepare) await prepare(ctx);
  const nojs = await ctx.newPage();
  await nojs.goto(url, { waitUntil: "load" });
  await nojs.waitForTimeout(1500);
  const visibleNoJs = await nojs.locator("#alici-baslik").evaluate((e) => getComputedStyle(e.closest("[data-reveal]")).opacity);
  check(engine, size, "JavaScript kapalıyken içerik görünür", visibleNoJs === "1", visibleNoJs);
  const fallback = await nojs.evaluate(() => ({
    link: getComputedStyle(document.querySelector(".nav__all--nojs")).display,
    button: getComputedStyle(document.querySelector(".nav__all--js")).display,
  }));
  check(engine, size, "JavaScript kapalıyken kategori bağlantısı görünür", fallback.link !== "none" && fallback.button === "none", JSON.stringify(fallback));
  // Katlanan gruplar (dizin ve alt bölüm) betik olmadan açık durur. Dizin çubukları da çizilmiş görünür.
  const folds = await nojs.evaluate(() => ({
    closed: [...document.querySelectorAll("details[data-fold]")].filter((g) => !g.open).length,
    bar: getComputedStyle(document.querySelector(".dlink__bar")).transform,
    prefs: document.querySelectorAll('[role="radio"]').length,
  }));
  check(engine, size, "JavaScript kapalıyken katlanan gruplar açık", folds.closed === 0 && folds.bar !== "matrix(0, 0, 0, 1, 0, 0)" && folds.prefs === 8, JSON.stringify(folds));
  // İlk durak içeriğe atla bağlantısıdır. Üçüncü durakta odak dolgusu ve alt çizgi görünmelidir.
  // Dolgu, sayfadaki odak dolgularından biridir: lacivert, beyaz, vurgu mavisi ya da logonun ara tonu.
  await nojs.keyboard.press(tab);
  await nojs.keyboard.press(tab);
  await nojs.keyboard.press(tab);
  const seen = await nojs.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return { tag: el.tagName, text: el.textContent.trim().slice(0, 16), bg: s.backgroundColor, deco: s.textDecorationLine, outline: s.outlineStyle, shadow: s.boxShadow, js: document.documentElement.classList.contains("js") };
  });
  check(engine, size, "JavaScript kapalıyken klavye odağı görünür",
    !seen.js && seen.tag === "A" && ["rgb(16, 37, 60)", "rgb(255, 255, 255)", "rgb(40, 112, 195)", "rgb(79, 136, 207)"].includes(seen.bg)
      && seen.deco.includes("underline") && seen.outline === "none" && seen.shadow === "none", JSON.stringify(seen));
  await ctx.close();
}

// Dokunmatik geniş ekran (tablet, hibrit dizüstü): hedef boyutu genişliğe göre küçülmez.
async function touch(browser, engine, prepare) {
  const size = "1024x768 dokunmatik";
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true });
  if (prepare) await prepare(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in")));
  await page.waitForTimeout(1300);
  const m = await page.evaluate(measure);
  if (!m.coarse) notRun.push(`${engine} ${size}: bu motor dokunmatik işaretçiyi öykünmedi, hedef boyutu denetimi çalışmadı`);
  else {
    check(engine, size, "dokunmatik geniş ekranda hedef en az 44 px", m.small.length === 0, m.small.slice(0, 6).join(", "));
    check(engine, size, "dokunmatik geniş ekranda yatay taşma yok", m.overflow <= 0, `taşma ${m.overflow}px`);
    // Açık kategori menüsündeki hedefler de 44 px olmalıdır.
    await page.click(".nav__all--js");
    await page.waitForTimeout(900);
    const menu = await page.evaluate(() => [...document.querySelectorAll("#mega a, #mega button")].filter((e) => {
      if (e.closest("[inert]")) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
    }).map((e) => e.textContent.trim().slice(0, 16) + ":" + Math.round(e.getBoundingClientRect().height)));
    check(engine, size, "dokunmatik ekranda açık menünün hedefleri en az 44 px", menu.length === 0, menu.slice(0, 6).join(", "));
  }
  await ctx.close();
}

async function all() {
  for (const [engine, type] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await type.launch();
    const errors = [];
    const page = await browser.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    for (const [w, h] of sizes) await layout(page, engine, w, h);
    // Davranış en dar ekranda da sınanır: 320 px önce gelir.
    await behavior(page, engine, 320, 568);
    await behavior(page, engine, 390, 844);
    await behavior(page, engine, 1440, 900);
    await focusTour(page, engine, 320, 568);
    await focusTour(page, engine, 390, 844);
    await focusTour(page, engine, 1440, 900);
    await touch(browser, engine);
    // Hareket azaltma tercihi: içerik ve piktogramlar geçiş beklemeden görünür.
    const reduced = await browser.newPage({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    await reduced.goto(url, { waitUntil: "load" });
    await reduced.waitForTimeout(300);
    const rm = await reduced.evaluate(() => ({
      shown: [...document.querySelectorAll("[data-reveal], [data-intro]")].every((e) => getComputedStyle(e).opacity === "1"),
      drawn: getComputedStyle(document.querySelector(".reasons .picto .s")).strokeDashoffset,
    }));
    check(engine, "390x844", "hareket azaltmada içerik hemen görünür", rm.shown && rm.drawn === "0px", JSON.stringify(rm));
    await noScript(browser, engine);
    check(engine, "tümü", "konsol hatası yok", errors.length === 0, errors.slice(0, 3).join(" | "));
    await browser.close();
  }
  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(`FAIL ${r.engine} ${r.size} ${r.name}${r.detail ? ": " + r.detail : ""}`);
  for (const n of notRun) console.log(`NOT_RUN ${n}`);
  for (const engine of ["chromium", "webkit"]) {
    const mine = results.filter((r) => r.engine === engine);
    console.log(`${engine}: ${mine.filter((r) => r.ok).length} pass, ${mine.filter((r) => !r.ok).length} fail`);
  }
  return failed.length ? 1 : 0;
}

// Sınama kipi: testin kendisi sınanır. Her bozulma, sunucudan gelen kaynağa yolda uygulanır (dosyalar değişmez).
// Beklenen: adı yazılan denetim FAIL verir. Vermezse test o bozulmayı kaçırıyordur.
// koşu: hangi test bölümünün çalışacağı. Aynı koşudaki bozulmalar birlikte uygulanır.
const swap = (from, to) => (text) => text.replace(from, to);
const add = (css) => (text) => text + "\n" + css;
const BREAKS = [
  // Beşinci sürümün kuralları
  { name: "komşu iki bant aynı yüzeyde", file: "styles.css", run: "layout:1440x900", expect: "komşu bantlar farklı yüzeyde",
    apply: add(".band--tint { background-color: var(--surface); }") },
  { name: "kart bandıyla aynı yüzeyde", file: "styles.css", run: "layout:1440x900", expect: "kart yüzeyi bandından ayrılır",
    apply: add(".dir__item, .sc { background: var(--sunken); }") },
  { name: "bölüm numarası atlanmış", file: "index.html", run: "layout:1440x900", expect: "bölüm başlıkları sırayla numaralı",
    apply: swap('<b class="mh__no" aria-hidden="true">03</b>', '<b class="mh__no" aria-hidden="true">04</b>') },
  { name: "odaklanan dizin bağlantısında yazı koyu kalıyor", file: "styles.css", run: "focus:1440x900", expect: "odaktaki öğenin metni okunur",
    apply: (t) => t.split(":is(small, b, svg, i, h3, .dlink__t, .dlink__n)").join(":is(small, b, svg, i, h3)") },
  { name: "yazı tipi Ubuntu değil", file: "styles.css", run: "layout:390x844", expect: "font Ubuntu",
    apply: swap('--font: "Ubuntu",', '--font: "Georgia",') },
  { name: "Ubuntu ailesinde olmayan ara kalınlık", file: "styles.css", run: "layout:390x844", expect: "yazı kalınlığı Ubuntu ailesinde",
    apply: add(".btn { font-weight: 600; }") },
  { name: "para birimi seçimi fiyatları değiştirmiyor", file: "app.js", run: "behavior:390x844", expect: "para birimi seçimi fiyatları değiştirir",
    apply: swap("          paintPrices();\n          cart.repaint();", "          cart.repaint();") },
  { name: "radyo grubunda ok tuşu çalışmıyor", file: "app.js", run: "behavior:1440x900", expect: "para birimi klavyeyle seçilir",
    apply: swap("          select(radios[(i + step + radios.length) % radios.length], true);", "") },
  { name: "dizin grubu dar ekranda açılmıyor", file: "app.js", run: "behavior:320x568", expect: "dizin grubu dar ekranda açılır",
    apply: swap('$("summary", g.el).addEventListener("click", function (e) { if (g.mq.matches) e.preventDefault(); });', '$("summary", g.el).addEventListener("click", function (e) { e.preventDefault(); });') },
  { name: "menüdeki teklif bağlantısı menüyü kapatmıyor", file: "app.js", run: "behavior:320x568", expect: "menüdeki teklif bağlantısı menüyü kapatır",
    apply: swap('$$("[data-mega-kapat]", panel).forEach(function (a) { a.addEventListener("click", function () { set(false, false); }); });', "") },
  { name: "konum çubuğu ilerlemiyor", file: "app.js", run: "behavior:390x844", expect: "konum çubuğu kaydırmayla ilerler",
    apply: swap('if (bar) bar.style.setProperty("--p",', 'if (!bar) bar.style.setProperty("--p",') },
  { name: "ışık işaretçiyi izlemiyor", file: "app.js", run: "behavior:1440x900", expect: "ışık işaretçiyi izler",
    apply: swap('if (band) place(band, e, "--mx", "--my");', "") },
  { name: "ışık kartı yerinden oynatıyor", file: "styles.css", run: "behavior:1440x900", expect: "kartın üstünde ışık belirir, kart oynamaz",
    apply: add("[data-glow]:hover { transform: translateY(-4px); }") },
  { name: "JavaScript yokken dizin çubukları çizilmiyor", file: "styles.css", run: "noscript", expect: "JavaScript kapalıyken katlanan gruplar açık",
    apply: add(".dlink__bar { transform: scaleX(0); }") },
  { name: "üst arama ekranın altındayken de açılıyor", file: "app.js", run: "layout:844x390", expect: "sayfa başında üst arama kapalı, kategori düğmesine dokunulur",
    apply: (t) => t.replace("past = !en.isIntersecting && en.boundingClientRect.bottom <= edge + 1;", "past = !en.isIntersecting;").replace('rootMargin: "-72px 0px 100000px 0px"', 'rootMargin: "-72px 0px 0px 0px"') },
  // Bu bozulma yalnız karşılama araması sayfa açılınca tümüyle ekranın altındaysa görünür. Kısa bir ekranda sınanır.
  { name: "ani sıçramada üst arama eski durumda kalıyor", file: "app.js", run: "layout:360x480", expect: "ani sıçramada üst arama durumu doğru kalır",
    apply: swap('rootMargin: "-72px 0px 100000px 0px"', 'rootMargin: "-72px 0px 0px 0px"') },
  { name: "alt çizgi zeminle aynı renkte", file: "styles.css", run: "layout:320x568", expect: "liste bağlantısının alt çizgisi zeminden seçilir",
    apply: add(".fgroup a, .mega__links a { text-decoration-color: transparent; }") },
  { name: "lacivert düğmede odak dolgusu değişmiyor", file: "styles.css", run: "focus:390x844", expect: "klavye odağı her denetimde görünür",
    apply: swap('.btn--ink, .pc__add, .header .search button, .filter[aria-pressed="true"], .seg button[aria-selected="true"], .on-ink .btn--light, .pref[aria-checked="true"] { --focus-bg: var(--a-500); --focus-fg: var(--on-ink); }', "") },
  { name: "metin alanında odak çizgisi yok", file: "styles.css", run: "focus:1440x900", expect: "metin alanında odak çizgisi belirir",
    apply: (t) => t.replace('html[data-kb="on"] .field input:focus-visible,', 'html[data-kb="yok"] .field input:focus-visible,').replace('html[data-kb="on"] .search input:focus-visible,', 'html[data-kb="yok"] .search input:focus-visible,') },
  { name: "odakta çevreleyen halka", file: "styles.css", run: "focus:1440x900", expect: "hiçbir durakta çevreleyen halka yok",
    apply: add('html[data-kb="on"] .btn:focus-visible { box-shadow: 0 0 0 3px #2870c3; }') },
  { name: "içeriğe atlayınca piktogramlar renk değiştiriyor", file: "styles.css", run: "behavior:390x844", expect: "içeriğe atlayınca sayfa renk değiştirmez",
    apply: swap('html[data-kb="on"] :is(a, button, summary, [role="option"], [role="tab"]):focus-visible :is(.picto, .pref__mark),', 'html[data-kb="on"] :focus-visible :is(.picto, .pref__mark),') },
  { name: "fare üzerindeyken odak dolgusu eziliyor", file: "styles.css", run: "behavior:1440x900", expect: "fare üzerindeyken de odak dolgusu görünür",
    apply: swap('html[data-kb="on"]:root :is(a, button, summary, [role="option"], [role="tab"]):focus-visible,', 'html[data-kb="on"] :is(a, button, summary, [role="option"], [role="tab"]):focus-visible,') },
  { name: "sepet çubuğu dar ekranda yükseliyor", file: "styles.css", run: "behavior:320x568", expect: "sepet çubuğu ekranın dörtte birinden az yer kaplar",
    apply: swap(".cartbar__note { flex: 1 0 100%; }", ".cartbar__note { flex: 0 1 72px; }") },
  { name: "seçili para birimi kutusunda odak görünmüyor", file: "styles.css", run: "behavior:320x568", expect: "seçili para birimi kutusu klavye odağını gösterir",
    apply: swap('.on-ink .btn--light, .pref[aria-checked="true"] { --focus-bg', '.on-ink .btn--light { --focus-bg') },
  { name: "JavaScript yokken odak göstergesi yok", file: "styles.css", run: "noscript", expect: "JavaScript kapalıyken klavye odağı görünür",
    apply: swap('html:not(.js):root :is(a, button, summary, [role="option"], [role="tab"]):focus-visible {', 'html.yok:root :is(a, button, summary, [role="option"], [role="tab"]):focus-visible {') },
  { name: "işaretçiyle odaklanan şerit bağlantısı yerinden oynuyor", file: "app.js", run: "behavior:320x568", expect: "şeritteki bağlantıya dokunmak onu açar",
    apply: swap('if (root.dataset.kb !== "on") return;', "") },
  { name: "şeritte odaklanan bağlantı okun altında kalıyor", file: "app.js", run: "focus:320x568", expect: "odaklanan öğe başka bir katmanın altında kalmaz",
    apply: swap("if (past > 0) r.el.scrollLeft += past;", "if (past > 9999) r.el.scrollLeft += past;") },
  // Yalnız Safari ailesinde görülen bozulma. WebKit'te denenir.
  { name: "Safari'de üst arama düğmesinin tıklaması yutuluyor", file: "app.js", run: "behavior:390x844", engine: "webkit", expect: "üst arama düğmesinin tıklaması yutulmaz",
    apply: swap("var on = past || pressing || slot.contains(document.activeElement);", "var on = past || slot.contains(document.activeElement);") },
  { name: "sepet örnek olduğunu söylemiyor", file: "index.html", run: "behavior:1440x900", expect: "sepet örnek olduğunu söyler",
    apply: swap('<small class="cartbar__note">Bu sepet bir örnektir. Ürünler canlı sepete eklenmez.</small>', "") },
  // Sayaç yalnız sayılar ekrandayken başlar. Bu yüzden sayıların ilk ekranda göründüğü boyutta sınanır.
  { name: "sayaç kare gelmeyince yarıda kalıyor", file: "app.js", run: "layout:1440x900", expect: "sayaç gerçek değerde durur",
    apply: (t) => t.replace("window.setTimeout(finish, ms + 250);", "").replace('"use strict";', '"use strict"; window.requestAnimationFrame = function () { return 0; };') },
  { name: "menü bağlantılarının alt çizgisi kaldırılmış", file: "styles.css", run: "layout:844x390", expect: "liste bağlantıları durağan halde altı çizili",
    apply: add(".mega__links a, .fgroup a { text-decoration: none; }") },
  { name: "token dışı eğri ve süre", file: "styles.css", run: "layout:844x390", expect: "hesaplanan eğri ve süre merkezi tokenlarla aynı",
    apply: add(".btn { transition: background-color 200ms ease-out; }") },
  { name: "rozet metni ölçekle küçültülmüş", file: "styles.css", run: "layout:844x390", expect: "en küçük metin 14 px",
    apply: add(".pc__badge { transform: scale(0.8); }") },
  { name: "süzgeç düğmesi yakın turuncu", file: "styles.css", run: "layout:844x390", expect: "turuncu yalnız izinli öğelerde",
    apply: add(".filter { background: #ff8a00; }") },
  { name: "ana sayfa bağlantısı hedefsiz", file: "index.html", run: "layout:844x390", expect: "hedefsiz bağlantı yok",
    apply: swap('href="./" aria-current="page"', 'href="#" aria-current="page"') },
  { name: "sıkı hedef boyutu dokunmatik ekranda da geçerli", file: "styles.css", run: "touch", expect: "dokunmatik geniş ekranda hedef en az 44 px",
    apply: (t) => t.replace("@media (min-width: 1024px) and (pointer: fine) {", "@media (min-width: 1024px) {").replace("@media (any-pointer: coarse) {", "@media (any-pointer: none) {") },
  { name: "alt kaydırma payı yok", file: "styles.css", run: "behavior:390x844", expect: "odaklanan öğe alt gezinmenin arkasında kalmaz",
    apply: swap("scroll-padding-bottom: calc(var(--dock) + env(safe-area-inset-bottom, 0px) + var(--sp-4));", "") },
  { name: "yazdırma kuralları yok", file: "styles.css", run: "behavior:390x844", expect: "yazdırmada bütün içerik görünür",
    apply: swap("@media print {", "@media not all {") },
  { name: "ürün kartında veriden farklı hazırlık süresi", file: "index.html", run: "behavior:390x844", expect: "ürün kartı koşulları veriyle aynı",
    apply: swap(`<dt>Hazırlık süresi</dt><dd data-veri>${Object.values(facts.urunler)[0].hazirlik}</dd>`, "<dt>Hazırlık süresi</dt><dd data-veri>999 iş günü</dd>") },
  { name: "yanıtın açık durumu yazılmıyor", file: "app.js", run: "behavior:390x844", expect: "soru açılır, durum anında güncellenir",
    // Aynı iki satır menüde de vardır. Kapanış ayraçları yalnız sık sorulanlar bölümünü seçer.
    apply: swap('panel.dataset.open = open ? "true" : "false";\n      panel.inert = !open;\n    });', "panel.inert = !open;\n    });") },
  { name: "son kategoride ok tuşu sayfayı kaydırıyor", file: "app.js", run: "behavior:390x844", expect: "son kategoride ok tuşu sayfayı kaydırmaz",
    apply: swap("e.preventDefault();\n        cats[Math.max(0, Math.min(cats.length - 1, to))].focus();", "if (to >= 0 && to < cats.length && to !== i) { e.preventDefault(); cats[to].focus(); }") },
  { name: "menünün saydam payı menünün içi sayılıyor", file: "app.js", run: "behavior:390x844", expect: "menünün yanındaki boşluğa dokunmak menüyü kapatır",
    apply: swap("if (isOpen() && !sheet.contains(e.target) && !btn.contains(e.target)) set(false, false);", "if (isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) set(false, false);") },
  { name: "menüden çıkan odak menüyü kapatmıyor", file: "app.js", run: "behavior:1440x900", expect: "geri sekmeyle menüden çıkınca menü kapanır",
    apply: swap('document.addEventListener("focusin"', 'document.addEventListener("yok-focusin"') },
  { name: "üst arama düğmesi turuncu", file: "styles.css", run: "behavior:1440x900", expect: "üst arama açıkken üst bölümde en çok bir turuncu düğme",
    apply: add(".header .search button { background: var(--brand); color: var(--on-brand); }") },
  { name: "alt menü durumu gecikmeli yazılıyor", file: "app.js", run: "behavior:1440x900", expect: "başka üst kategori alt menüyü değiştirir",
    apply: swap('c.addEventListener("click", function () { openCat(c, !wide.matches); });', 'c.addEventListener("click", function () { setTimeout(function () { openCat(c, !wide.matches); }, 400); });') },
];

async function selfCheck() {
  // Bozulmalar varsayılan olarak Chromium'da denenir. Yalnız Safari ailesinde görülen bozulma WebKit'te denenir.
  const engines = { chromium, webkit };
  const open = {};
  const launch = async (name) => (open[name] ||= await engines[name].launch());
  const files = { "index.html": "text/html; charset=utf-8", "app.js": "text/javascript; charset=utf-8", "styles.css": "text/css; charset=utf-8" };
  const source = {};
  for (const f of Object.keys(files)) source[f] = await (await fetch(new URL(f, url))).text();
  const lines = [];
  let caught = 0;
  const chosen = BREAKS.filter((b) => b.name.includes(selfOnly));
  const runs = [...new Set(chosen.map((b) => `${b.engine || "chromium"}|${b.run}`))];
  for (const key of runs) {
    const [engine, run] = key.split("|");
    const browser = await launch(engine);
    const list = chosen.filter((b) => `${b.engine || "chromium"}|${b.run}` === key);
    const body = { ...source };
    for (const b of list) {
      const next = b.apply(body[b.file]);
      if (next === body[b.file]) lines.push(`FAIL bozulma uygulanamadı (kaynak değişmiş olabilir): ${b.name}`);
      body[b.file] = next;
    }
    const prepare = (ctx) => ctx.route((u) => ["/", "/index.html", "/app.js", "/styles.css"].includes(u.pathname), (route) => {
      const f = new URL(route.request().url()).pathname.replace(/^\//, "") || "index.html";
      return route.fulfill({ status: 200, contentType: files[f], body: body[f] });
    });
    results.length = 0;
    notRun.length = 0;
    let crash = "";
    try {
      const [kind, dims] = run.split(":");
      if (kind === "touch") await touch(browser, engine, prepare);
      else if (kind === "noscript") await noScript(browser, engine, prepare);
      else {
        const ctx = await browser.newContext();
        await prepare(ctx);
        const page = await ctx.newPage();
        const [w, h] = dims.split("x").map(Number);
        if (kind === "layout") await layout(page, engine, w, h);
        else if (kind === "focus") await focusTour(page, engine, w, h);
        else await behavior(page, engine, w, h);
        await ctx.close();
      }
    } catch (e) {
      crash = String(e.message || e).split("\n")[0];
    }
    for (const b of list) {
      const hit = results.some((r) => !r.ok && r.name === b.expect);
      if (hit) caught++;
      else lines.push(`FAIL test kaçırdı: ${b.name}. Beklenen FAIL: "${b.expect}"${crash ? ". Koşu yarıda kesildi: " + crash : ""}${notRun.length ? ". " + notRun.join(" ") : ""}`);
    }
  }
  for (const b of Object.values(open)) await b.close();
  if (lines.length) console.log(lines.join("\n"));
  console.log(`Test sınaması: ${chosen.length} bozulmadan ${caught} tanesi yakalandı. Sonuç: ${lines.length ? "FAIL" : "PASS"}`);
  return lines.length ? 1 : 0;
}

process.exit(await (selfTest ? selfCheck() : all()));
