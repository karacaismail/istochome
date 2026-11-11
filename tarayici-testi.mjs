// Tarayıcı denetimi.
//   node tarayici-testi.mjs [adres] [ekran görüntüsü klasörü]
//     Chromium ve WebKit'te (Safari ailesi) yerleşimi, renk rollerini, karşıtlığı, odağı ve etkileşimleri sınar.
//     İki denetim yalnız Chromium'da çalışır: büyütülmüş kök yazı boyutu ve zorlanmış renkler.
//     WebKit bu iki ayarı öykünmez. Çıktıda NOT_RUN satırı bunu yazar.
//   node tarayici-testi.mjs [adres] --motor=chromium   (ya da --motor=webkit)
//     Yalnız o motoru çalıştırır. Diğer seçeneklerle birlikte kullanılabilir.
//   node tarayici-testi.mjs [adres] --bolge
//     Yalnız bölgesel tedarik bölümünü, hareketli yüzeyleri ve betiksiz görünümü sınar.
//   node tarayici-testi.mjs [adres] --sinama
//     Test kendini sınar. Bilinen her bozulma kaynağa uygulanır. İlgili denetim FAIL vermelidir.
// Playwright, komşu site klasöründeki kurulumdan alınır. Önizleme sunucusu açık olmalıdır.
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// Playwright önce PLAYWRIGHT_PACKAGE_DIR ile verilen klasörde aranır (içinde node_modules olan klasör).
// Sonra bu klasörde, en son komşu site klasöründe aranır. Test paket kurmaz.
let playwright;
const pwDirs = [process.env.PLAYWRIGHT_PACKAGE_DIR, here, join(here, "..", "site")].filter(Boolean);
for (const dir of pwDirs) {
  try {
    playwright = createRequire(join(dir, "package.json"))("@playwright/test");
    break;
  } catch {
    // Sonraki klasör denenir.
  }
}
if (!playwright) throw new Error(`Playwright bulunamadı. Denenen klasörler: ${pwDirs.join(", ")}`);
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
const rates = JSON.parse(readFileSync(join(here, "data", "kur.json"), "utf8")).TRY;
const topCats = JSON.parse(readFileSync(join(here, "data", "kategoriler.json"), "utf8")).length;
const SYM = { GBP: "£", USD: "$", EUR: "€", TRY: "₺" };
// Bölgesel tedarik bölümünün tek veri kaynağı. Dosya yoksa bölüm denetimleri FAIL verir, test çökmez.
const bolgeFile = join(here, "data", "bolgeler.json");
const bolgeData = existsSync(bolgeFile) ? JSON.parse(readFileSync(bolgeFile, "utf8")) : null;
// Yer listesi veriden gelir (kullanıcı kararı 11 Kasım 2026). En az 6 gerçek ticari alım merkezi olur.
// Geçerli türler: ilçe, semt, ticaret merkezi ve sanayi bölgesi. İlçenin etiketi "ilçesi" ile biter.
// Öteki türlerin etiketi türün adını taşır ve "ilçe" sözcüğünü kullanmaz. Etiket ilçenin adını yer olarak yazabilir. Örnek: "İstanbul, Bağcılar'da ticaret merkezi".
// Kullanıcı kararı (11 Kasım 2026): tedarik bölümünde en az 22 merkez olur, sayı veriden gelir. Alıcı talep bölümünde tam 24 alan olur.
// Aynı yer ve aynı sektör ikinci kez eklenmez.
// Bir yerde (şehir ve normalleştirilmiş yer adı) en çok 2 farklı sektör (sektor_kodu) bulunur. Bir şehirde birden çok merkez olabilir.
// Her kayıt tek sektördür. Kural iki dosyanın birleşimine uygulanır.
const BOLGE_EN_AZ = 22;
const trNorm = (t) => String(t || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
// Yer anahtarı: şehir ve kanonik yer adı. Türkçe küçük harf, işaretler atılır, noktasız ı da i olur (ASCII yazımla eşleşir).
// "Organize Sanayi Bölgesi" ve "OSB" aynı yerdir. Böylece aynı yer farklı yazımla ikinci kez sayılmaz.
const yerAnahtari = (y) => `${trNorm(y.il)}|${trNorm(y.ad).replace(/organize sanayi bolgesi/g, "osb").replace(/[^a-z0-9]+/g, "")}`;
const aliciFile = join(here, "data", "alicilar.json");
const aliciData = existsSync(aliciFile) ? JSON.parse(readFileSync(aliciFile, "utf8")) : null;
const GRUPLAR = ["gida", "tekstil", "konaklama", "imalat"];
const BOLGE_TURLERI = ["ilçe", "semt", "ticaret merkezi", "sanayi bölgesi"];
const etiketUyar = (y) => (y.tur === "ilçe" ? /ilçesi$/.test(y.yer_etiketi || "") : (y.yer_etiketi || "").includes(y.tur) && !/ilçe/.test(y.yer_etiketi || ""));
// Sayfada yazan yer etiketi: yerin adı ve verideki yer etiketi. Örnek: "Laleli İstanbul, Fatih'te semt".
const yerEtiketi = (y) => `${y.ad} ${y.yer_etiketi}`;
// Bir ürünün KDV dahil, yuvarlanmamış birim tutarı. build.py ile aynı işlem ve aynı sıra: sekiz ondalık.
// Toplam bu değerden hesaplanır. Yuvarlanmış birim fiyat adetle çarpılsaydı toplam, çevrilen gerçek tutardan sapardı.
const unitOf = (slug, cur = "USD") => {
  const f = facts.urunler[slug];
  return Number((f.fiyat_try * (1 + f.kdv / 100) * rates[cur]).toFixed(8));
};
// Bir ürünün sayfada beklenen koşulları: yuvarlanmamış birim tutar (USD) ve en az sipariş adedi.
const expected = (slug) => ({ unit: unitOf(slug), moq: facts.urunler[slug].en_az_adet, lead: facts.urunler[slug].hazirlik });
// Tutarlar Türkçe sayı biçimiyle yazılır: binlik ayırıcı nokta, ondalık ayırıcı virgül.
const money = (n, cur = "USD") => SYM[cur] + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  // Koyu bandın üstünde işaretçi ışığı gezer. Işığın en parlak yeri ortasıdır.
  // Karşıtlık o noktaya göre ölçülür: ışığın rengi ve saydamlığı katmanın kendi stilinden okunur.
  const spotLayer = (band) => {
    const light = band.querySelector(":scope > .spot i");
    const m = light && getComputedStyle(light).backgroundImage.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  // Öğenin arkasındaki etkin zemin: saydam olmayan ilk üst öğeye kadar katmanlar birleştirilir.
  // Zemin ışıklı bir bantsa ışık katmanı da hesaba katılır.
  const backdrop = (e) => {
    const layers = [];
    for (let n = e; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) {
        if (c[3] === 1 && n.hasAttribute("data-spot")) { const light = spotLayer(n); if (light) layers.push(light); }
        layers.push(c);
        if (c[3] === 1) break;
      }
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
  out.small = [...document.querySelectorAll("a, button")].filter((e) => visible(e) && getComputedStyle(e).pointerEvents !== "none").map((e) => [e, e.getBoundingClientRect()])
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
  out.flatCards = [...document.querySelectorAll(".rfqbox, .reason, .dir__item, .pc, .sc, .op, .nudge, .sell__panel, .dgroup, .pref")].filter((c) => {
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
  // Bölüm başlığı bölümün adını da okutur: bölüm adı başlığın içinde durur, gözle okunan üst satır okuyucudan gizlidir.
  // Böylece bölgenin adı yalnız slogan olmaz ("Ürünler: Fiyat sormanıza gerek yok.").
  out.sloganNames = [...document.querySelectorAll("main .mh")].filter((h) => {
    const kicker = h.querySelector(".mh__kicker").textContent.trim();
    return !h.querySelector("h2").textContent.trim().startsWith(kicker + ":") || h.querySelector(".mh__top").getAttribute("aria-hidden") !== "true";
  }).length;
  // Seçenek kutusunda ad, seçim işaretine değmez. İşaret seçili olmayan kutuda da yerinde durur, bu yüzden her kutu ölçülür.
  out.prefOverlap = [...document.querySelectorAll(".pref")].filter(visible).filter((p) => {
    const a = p.querySelector(".pref__t").getBoundingClientRect();
    const b = p.querySelector(".pref__on").getBoundingClientRect();
    const inside = (r) => r.left >= p.getBoundingClientRect().left - 0.5 && r.right <= p.getBoundingClientRect().right + 0.5;
    const text = [...p.querySelectorAll(".pref__t b, .pref__t small")].every((n) => n.scrollWidth <= n.clientWidth + 1);
    return (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) || !inside(a) || !text;
  }).map((p) => p.dataset.deger);

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
  // Sayaç yalnız sayılar ekrandayken başlar. Sayılar ekrana getirilir ve sayacın bitmesi beklenir.
  // Böylece "sayaç gerçek değerde durur" denetimi çalışmış bir sayacı ölçer.
  await page.evaluate(() => document.querySelector("[data-stats]").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1900);
  const counted = await page.evaluate(() => [...document.querySelectorAll("[data-count]")].every((e) => typeof e._v === "number"));
  check(engine, size, "sayaç sayılar ekrana girince çalışır", counted);
  await page.evaluate(() => scrollTo(0, 0));
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
  check(engine, size, "bölüm başlığı bölümün adını da okutur", m.sloganNames === 0, `${m.sloganNames}`);
  check(engine, size, "seçenek adı seçim işaretine değmez", m.prefOverlap.length === 0, m.prefOverlap.join(", "));
  check(engine, size, "her modülün adı var", m.unnamedMods === 0, `${m.unnamedMods}`);
  check(engine, size, "turuncu yalnız izinli öğelerde", m.strayOrange.length === 0, m.strayOrange.join(", "));
  check(engine, size, "bileşende en çok bir turuncu düğme", m.crowded.length === 0, m.crowded.join(", "));
  check(engine, size, "turuncu ilk ekranın yüzde 5'inden az", m.orangeShare < 0.05, `${(m.orangeShare * 100).toFixed(1)}%`);
  check(engine, size, "piktogramlar etiketli", m.barePictos === 0, `${m.barePictos}`);
  // Kapalı grupların içeriği de ölçülür. Dar ekranda dizin grupları ve alt bölüm sütunları kapalı başlar.
  // Kapalı içerik ilk ölçümde görünmez. Bu yüzden bütün gruplar açılır ve sayfa bir kez daha ölçülür.
  const opened = await page.evaluate(() => {
    const closed = [...document.querySelectorAll('[data-fold][data-open="false"]')].filter((g) => g.querySelector(".fold__btn").getClientRects().length);
    closed.forEach((g) => g.querySelector(".fold__btn").click());
    return closed.length;
  });
  if (opened) {
    await page.waitForTimeout(900);
    const m2 = await page.evaluate(measure);
    check(engine, size, "açılan gruplarda yatay taşma yok", m2.overflow <= 0, `taşma ${m2.overflow}px`);
    check(engine, size, "açılan gruplarda en küçük metin 14 px", m2.minFont >= 14, `${m2.minFont}px`);
    check(engine, size, "açılan gruplarda metin karşıtlığı yeterli", m2.lowContrast.length === 0, m2.lowContrast.slice(0, 5).join(" | "));
    check(engine, size, "açılan gruplarda dokunma hedefi en az 44 px", m2.small.length === 0, m2.small.slice(0, 6).join(", "));
  }
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
  // Önce menü kapatılır. Böylece denetim, önceki adımın menüyü açık bırakıp bırakmadığına bağlı kalmaz.
  await page.mouse.click(5, 5);
  if ((await megaState()).expanded === "true") await page.keyboard.press("Escape");
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
    /örnek/.test(c.note) && /istoc\.com sepetine eklenmez/.test(c.note) && /örnek sepette/.test(c.said) && bar.labels.every((x) => x === "istoc.com sepetini açın. Örnek sepette 1 ürün var."), JSON.stringify({ note: c.note, said: c.said, labels: bar.labels }));
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
  const tryPrice = money(unitOf(firstSlug, "TRY"), "TRY");
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
  // Sepetin ve örnek siparişin toplamı yeni para biriminde yeniden hesaplanır. Sepette örnek siparişin ürünü durur.
  // Beklenen tutar veri dosyasından, yuvarlanmamış birim tutardan hesaplanır.
  const tryTotal = money(wantQty * unitOf(sampleSlug, "TRY"), "TRY");
  const totals = await page.evaluate(() => ({
    cart: document.querySelector("[data-cart-total]").textContent, order: document.querySelector("[data-total]").textContent,
    sr: document.querySelector("[data-total-sr]").textContent, least: document.querySelector(".pc .terms [data-para]").textContent,
  }));
  const tryLeast = money(expected(firstSlug).moq * unitOf(firstSlug, "TRY"), "TRY");
  check(engine, size, "para birimi değişince sepet ve sipariş toplamı yeniden hesaplanır",
    totals.cart === tryTotal && totals.order === tryTotal && totals.sr === "Toplam " + tryTotal && totals.least === tryLeast, JSON.stringify({ ...totals, tryTotal, tryLeast }));
  // Kartta yazan en az sipariş tutarı, sepetin göstereceği toplamla aynı işlemden çıkar: yuvarlanmamış birim tutar çarpı adet.
  // Dört para biriminde ve bütün kartlarda sınanır. Birim tutar da veri dosyasındaki fiyatla aynı olmalıdır.
  const cards = await page.evaluate(() => [...document.querySelectorAll(".pc")].map((c) => {
    const least = c.querySelector(".terms [data-para]").dataset;
    return { slug: c.dataset.slug, moq: Number(c.dataset.moq), unit: { GBP: c.dataset.unitGbp, USD: c.dataset.unitUsd, EUR: c.dataset.unitEur, TRY: c.dataset.unitTry }, least: { GBP: least.gbp, USD: least.usd, EUR: least.eur, TRY: least.try } };
  }));
  const drift = [];
  for (const c of cards) for (const cur of Object.keys(SYM)) {
    if (c.unit[cur] !== unitOf(c.slug, cur).toFixed(8)) drift.push(`${c.slug} ${cur} birim ${c.unit[cur]}`);
    else if (money(Number(c.unit[cur]) * c.moq, cur) !== money(Number(c.least[cur]), cur)) drift.push(`${c.slug} ${cur} ${c.least[cur]}`);
  }
  check(engine, size, "en az sipariş tutarı sepetin toplamıyla aynı hesaplanır", cards.length === Object.keys(facts.urunler).length && drift.length === 0, drift.slice(0, 4).join(", "));
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

  // Dizin: her grup ürünleri başka bir yoldan bulur. Dar ekranda yalnız ilk grup açık başlar ve başlık bir düğmedir.
  // Geniş ekranda gruplar hep açıktır ve başlık düz yazıdır: ekranda işe yaramayan bir düğme durmaz.
  const dzState = () => page.evaluate(() => {
    const groups = [...document.querySelectorAll(".dgroup")];
    const links = [...document.querySelectorAll(".dlink")];
    const panel = (g) => g.querySelector(".fold__panel");
    return {
      groups: groups.length, links: links.length,
      open: groups.filter((g) => getComputedStyle(panel(g)).visibility === "visible" && panel(g).getBoundingClientRect().height > 40).length,
      live: links.every((l) => l.href.startsWith("https://istoc.com/")), counted: links.filter((l) => l.querySelector(".dlink__n")).length,
      buttons: groups.filter((g) => g.querySelector(".fold__btn").getClientRects().length > 0).length,
      labels: groups.filter((g) => g.querySelector(".fold__label").getClientRects().length > 0).length,
      synced: groups.every((g) => g.dataset.open === g.querySelector(".fold__btn").getAttribute("aria-expanded")),
    };
  });
  const dz = await dzState();
  check(engine, size, "dizin grupları canlı adreslere gider", dz.groups >= 6 && dz.links >= 30 && dz.live && dz.counted >= 20, JSON.stringify(dz));
  if (w < 700) {
    check(engine, size, "dar ekranda yalnız ilk dizin grubu açık başlar", dz.open === 1 && dz.buttons === dz.groups && dz.labels === 0 && dz.synced, JSON.stringify(dz));
    const second = page.locator(".dgroup:nth-of-type(2) .fold__btn");
    const g2 = () => page.evaluate(() => {
      const g = document.querySelector(".dgroup:nth-of-type(2)");
      const p = g.querySelector(".fold__panel");
      const a = document.activeElement;
      return { open: g.dataset.open, exp: g.querySelector(".fold__btn").getAttribute("aria-expanded"), vis: getComputedStyle(p).visibility, h: Math.round(p.getBoundingClientRect().height), focus: !!a && g.contains(a), inPanel: !!a && p.contains(a) };
    });
    await second.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await second.click();
    const o1 = await g2();
    check(engine, size, "dizin grubu dar ekranda açılır, durum anında güncellenir", o1.open === "true" && o1.exp === "true", JSON.stringify(o1));
    await page.waitForTimeout(900);
    const o2 = await g2();
    check(engine, size, "dizin grubu geçişten sonra görünür", o2.vis === "visible" && o2.h > 100, JSON.stringify(o2));
    await second.click();
    await page.waitForTimeout(900);
    const o3 = await g2();
    check(engine, size, "kapalı dizin grubu klavyeden ve okuyucudan gizli", o3.open === "false" && o3.exp === "false" && o3.vis === "hidden" && o3.h < 2, JSON.stringify(o3));
    // Ekran döner: önce genişler, sonra yeniden daralır. Kullanıcının açtığı grup açık kalır, odak kaybolmaz.
    await second.click();
    await second.focus();
    await page.setViewportSize({ width: 900, height: h });
    await page.waitForTimeout(500);
    const turned = { ...(await g2()), ...(await dzState()) };
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(700);
    const back = await g2();
    check(engine, size, "açılan grup ekran dönünce açık kalır, odak kaybolmaz",
      turned.buttons === 0 && turned.open === turned.groups && turned.inPanel && back.open === "true" && back.vis === "visible" && back.focus, JSON.stringify({ turned: { buttons: turned.buttons, open: turned.open, inPanel: turned.inPanel }, back }));
  } else {
    check(engine, size, "geniş ekranda dizin grupları hep açık, başlık düz yazı", dz.open === dz.groups && dz.buttons === 0 && dz.labels === dz.groups, JSON.stringify(dz));
  }
  // Örnek aramalar: her kutucuk canlı sitedeki arama sonucuna gider.
  const chips = await page.evaluate(() => [...document.querySelectorAll(".chip")].map((c) => c.href));
  check(engine, size, "örnek aramalar canlı aramaya gider", chips.length >= 4 && chips.every((x) => x.startsWith("https://istoc.com/urunler?q=")), chips.join(" "));
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
      // Işığın yeri ışık katmanına yazılır. Bandın bütününe yazılsaydı bandın içeriği her karede yeniden hesaplanırdı.
      const spot = await page.evaluate(() => {
        const band = document.querySelector(".band--hero");
        const layer = band.querySelector(":scope > .spot");
        const light = layer.querySelector("i").getBoundingClientRect();
        const r = band.getBoundingClientRect();
        return { mx: layer.style.getPropertyValue("--mx"), my: layer.style.getPropertyValue("--my"), onBand: band.style.getPropertyValue("--mx"), cx: Math.round(light.left + light.width / 2 - r.left), cy: Math.round(light.top + light.height / 2 - r.top) };
      });
      check(engine, size, "ışık işaretçiyi izler", spot.mx === "320px" && spot.my === "210px" && spot.onBand === "" && Math.abs(spot.cx - 320) < 3 && Math.abs(spot.cy - 210) < 3, JSON.stringify(spot));
      await page.locator(".pc").first().scrollIntoViewIfNeeded();
      await page.locator(".pc .pc__body").first().hover();
      await page.waitForTimeout(500);
      const glow = await page.evaluate(() => { const card = document.querySelector(".pc"); return { on: getComputedStyle(card, "::after").opacity, gx: card.style.getPropertyValue("--gx"), move: getComputedStyle(card).transform }; });
      check(engine, size, "kartın üstünde ışık belirir, kart oynamaz", glow.on === "1" && /px$/.test(glow.gx) && glow.move === "none", JSON.stringify(glow));
      // Tıklanmayan öğe üzerine gelince değişmez: gerekçe kartı, ödeme yöntemi ve alt bölümdeki ödeme satırı.
      // Üzerine gelince değişen öğe tıklanır sanılır.
      const changed = [];
      for (const sel of [".reasons .reason", ".sell__list .reason", ".ptile", ".paylist li"]) {
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded();
        // Öğe ekrana girince belirir. Durağan hal, beliriş geçişi bittikten sonra ölçülür.
        // Geçiş, sınıf eklendikten sonraki karede başlar. Bu yüzden önce iki kare beklenir.
        await el.evaluate(async (e) => {
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          await Promise.all(e.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
        });
        const snap = () => el.evaluate((e) => {
          const st = getComputedStyle(e);
          const after = getComputedStyle(e, "::after");
          return [st.backgroundColor, st.boxShadow, st.transform, st.color, st.textDecorationLine, after.content === "none" ? "" : after.opacity + after.backgroundImage].join("|");
        });
        await page.mouse.move(4, 300);
        await page.waitForTimeout(400);
        const rest = await snap();
        await el.hover();
        await page.waitForTimeout(500);
        if ((await snap()) !== rest) changed.push(sel);
      }
      check(engine, size, "tıklanmayan öğe üzerine gelince değişmez", changed.length === 0, changed.join(", "));
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
      for (const sel of [".dir__subs a", ".faq:nth-of-type(3) button", ".dgroup:nth-of-type(3) .fold__btn", ".fgroup:nth-of-type(2) .fold__btn", '[data-tercih="dil"] [role="radio"]', ".footer__legal li a"]) {
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
  await page.waitForTimeout(250);
  const pr = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll("[data-reveal], [data-intro]")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    faq: [...document.querySelectorAll(".faq__panel")].filter((p) => p.offsetHeight < 20).length,
    nav: getComputedStyle(document.querySelector(".bottomnav")).display,
    picto: getComputedStyle(document.querySelector(".sell__list .picto .s")).strokeDashoffset,
    steps: [...document.querySelectorAll(".tl li > div")].filter((e) => getComputedStyle(e).opacity !== "1").length,
    // Kâğıtta katlanan gruplar açıktır ve başlıkları düz yazıdır.
    closedGroups: [...document.querySelectorAll("[data-fold]")].filter((g) => {
      const p = g.querySelector(".fold__panel");
      return getComputedStyle(p).visibility !== "visible" || p.getBoundingClientRect().height < 20 || g.querySelector(".fold__btn").getClientRects().length > 0;
    }).length,
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
    shown.counts[0] === String(facts.urun_toplami) && shown.counts[1] === String(topCats) && shown.counts[2] === String(facts.dogrulanmis_magaza) && shown.counts[3] === String(facts.para_birimleri.length) && /\d{4}/.test(shown.src),
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
    // Odaktaki öğenin içindeki simge de zemininden seçilmelidir (en az 3:1). Kendi kutusu olan simge o kutuya göre ölçülür.
    // Etkin olmayan düğmenin soluk simgesi ve gizli duran simge (örneğin sepetteki onay işareti) sayılmaz.
    if (el.getAttribute("aria-disabled") !== "true") {
      for (const icon of el.querySelectorAll("svg")) {
        if (!icon.getClientRects().length) continue;
        let seen = 1;
        for (let n = icon; n && n !== el; n = n.parentElement) seen *= parseFloat(getComputedStyle(n).opacity);
        if (seen < 0.05) continue;
        const ink = rgba(getComputedStyle(icon).color);
        if (!ink) continue;
        ink[3] *= seen;
        const bg = under(icon);
        const [hi3, lo3] = [lum(over(ink, bg)), lum(bg)].sort((p, q) => q - p);
        const r3 = (hi3 + 0.05) / (lo3 + 0.05);
        if (r3 < 3) t.dim.push(label + " içindeki simge " + r3.toFixed(2));
      }
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
  check(engine, size, "odaktaki öğenin metni ve simgesi okunur", res.dim.length === 0, res.dim.slice(0, 6).join(" | "));
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
  // Katlanan gruplar (dizin ve alt bölüm) betik olmadan açık durur ve başlıkları düz yazıdır. Dizin çubukları da çizilmiş görünür.
  const shownCount = (q) => nojs.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0).length, q);
  const folds = await nojs.evaluate(() => ({
    closed: [...document.querySelectorAll("[data-fold]")].filter((g) => {
      const p = g.querySelector(".fold__panel");
      return getComputedStyle(p).visibility !== "visible" || p.getBoundingClientRect().height < 20;
    }).length,
    groups: document.querySelectorAll("[data-fold]").length,
    bar: getComputedStyle(document.querySelector(".dlink__bar")).transform,
  }));
  folds.buttons = await shownCount(".fold__btn");
  check(engine, size, "JavaScript kapalıyken katlanan gruplar açık", folds.groups >= 15 && folds.closed === 0 && folds.buttons === 0 && folds.bar !== "matrix(0, 0, 0, 1, 0, 0)", JSON.stringify(folds));
  // Betik yokken çalışmayan denetim ve doğru olmayan cümle ekranda durmaz. Dil ve para birimi kutuları betikle çalışır.
  // Yerlerine, fiyatların hangi para biriminde yazdığını söyleyen durağan cümle görünür.
  const dead = {
    radios: await shownCount('[role="radio"]'), jsOnly: await shownCount(".js-only"), fixed: await shownCount(".prefs .nojs-only"),
    text: await nojs.evaluate(() => (document.querySelector(".prefs .nojs-only") || {}).textContent || ""),
  };
  check(engine, size, "JavaScript kapalıyken çalışmayan seçenek ve doğru olmayan cümle görünmez", dead.radios === 0 && dead.jsOnly === 0 && dead.fixed === 1 && /olarak gösterilir/.test(dead.text), JSON.stringify(dead));
  // Betik yokken bölgesel tedarik bölümü açık durur ve yönlü yüzeylerin örüntüsü çizili görünür.
  const nb = await nojs.evaluate(() => {
    const sec = document.querySelector("#bolgesel-tedarik");
    const p = document.querySelector("[data-motion-scene] path");
    return { sec: !!sec && getComputedStyle(sec.querySelector("[data-bolge]") || sec).opacity === "1" && sec.getBoundingClientRect().height > 200, path: p ? getComputedStyle(p).strokeDashoffset : "yok" };
  });
  check(engine, size, "JavaScript kapalıyken bölge bölümü ve yüzey örüntüsü görünür", nb.sec && nb.path === "0px", JSON.stringify(nb));
  // Betik yokken tedarik aramasının alanı görünmez. Panel açık durur, bütün merkezler görünür.
  const nbs = await nojs.evaluate(() => {
    const sec = document.querySelector("#bolgesel-tedarik");
    if (!sec) return null;
    const ara = sec.querySelector("[data-bolge-ara]");
    const rows = [...sec.querySelectorAll("[data-bolge]")];
    return { ara: ara ? getComputedStyle(ara).display : "yok", all: rows.length, shown: rows.filter((li) => li.getBoundingClientRect().height > 40).length };
  });
  if (nbs) check(engine, size, "JavaScript kapalıyken bütün merkezler okunur, arama alanı görünmez", nbs.ara === "none" && nbs.all > 0 && nbs.shown === nbs.all, JSON.stringify(nbs));
  // Betik yokken alıcı talep bölümünün süzgeci görünmez. Açılır panel açık durur, 24 alanın hepsi görünür.
  const na = await nojs.evaluate(() => {
    const sec = document.querySelector("#alici-talepleri");
    if (!sec) return null;
    const filt = sec.querySelector("[data-talep-filtre]");
    const shown = [...sec.querySelectorAll("[data-talep]")].filter((li) => li.getBoundingClientRect().height > 40).length;
    return { all: sec.querySelectorAll("[data-talep]").length, shown, filter: filt ? getComputedStyle(filt).display : "yok" };
  });
  if (na) check(engine, size, "JavaScript kapalıyken alıcı alanları okunur, süzgeç görünmez", na.all === 24 && na.shown === 24 && na.filter === "none", JSON.stringify(na));
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

// Yatay telefon: sabit çubuklar ekranın büyük bölümünü örtmez. Sepete bir ürün eklenir, iki çubuk birlikte ölçülür.
async function landscape(page, engine, w, h) {
  const size = `${w}x${h}`;
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.locator(".pc__add").first().scrollIntoViewIfNeeded();
  await page.locator(".pc__add").first().click();
  await page.waitForTimeout(900);
  const bars = await page.evaluate(() => {
    const el = document.querySelector(".cartbar");
    const bar = el.getBoundingClientRect();
    const nav = document.querySelector(".bottomnav").getBoundingClientRect();
    const note = el.querySelector(".cartbar__note").getBoundingClientRect();
    const items = [...document.querySelectorAll(".bottomnav a")].map((a) => a.getBoundingClientRect());
    return {
      on: el.classList.contains("is-on"), bar: Number((bar.height / innerHeight).toFixed(3)), both: Number(((innerHeight - bar.top) / innerHeight).toFixed(3)), nav: Math.round(nav.height),
      note: note.width > 0 && note.left >= bar.left - 1 && note.right <= bar.right + 1 && note.bottom <= bar.bottom + 1, link: Math.round(el.querySelector("a").getBoundingClientRect().height),
      navFits: items.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.height >= 44), overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  check(engine, size, "yatay telefonda sepet çubuğu ekranın dörtte birinden az yer kaplar", bars.on && bars.bar < 0.25 && bars.note && bars.link >= 44, JSON.stringify(bars));
  check(engine, size, "yatay telefonda sabit çubuklar birlikte ekranın yüzde 40'ından az yer kaplar", bars.both < 0.4 && bars.navFits && bars.overflow <= 0, JSON.stringify(bars));
  // Odaklanan öğe iki çubuğun arkasında kalmaz.
  const hidden = await page.evaluate(async () => {
    const out = [];
    for (const sel of [".faq:nth-of-type(2) button", ".footer__legal li a"]) {
      const el = document.querySelector(sel);
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().bottom - window.innerHeight + 6);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      el.focus();
      await new Promise((r) => setTimeout(r, 250));
      const top = Math.min(document.querySelector(".cartbar").getBoundingClientRect().top, document.querySelector(".bottomnav").getBoundingClientRect().top);
      const r1 = el.getBoundingClientRect();
      if (r1.bottom > top + 1) out.push(sel + " " + Math.round(r1.bottom - top) + "px arkada");
    }
    return out;
  });
  check(engine, size, "yatay telefonda odaklanan öğe çubukların arkasında kalmaz", hidden.length === 0, hidden.join(", "));
}

// Sayfada çalışır: büyütülmüş yazıda metnin kutusuna ve ekrana sığıp sığmadığını ölçer.
function fits() {
  const visible = (e) => {
    if (e.closest("[inert], [hidden], .sr-only")) return false;
    const r = e.getBoundingClientRect();
    const st = getComputedStyle(e);
    if (!(r.width > 0 && r.height > 0) || st.visibility === "hidden" || st.display === "none") return false;
    for (let n = e; n; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.05) return false;
    return true;
  };
  const name = (e) => (e.className && e.className.baseVal === undefined ? e.className : e.tagName).toString().slice(0, 24) + ":" + e.textContent.trim().slice(0, 18);
  // Yatay kayan şeridin içindeki öğe ve dönen örnek arama bilerek kırpılır. Onlar sayılmaz.
  const free = (e) => !e.closest("[data-scroller], .search__ghost");
  const texts = [...document.querySelectorAll("body *")].filter((e) => visible(e) && free(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const out = {};
  out.root = parseFloat(getComputedStyle(document.documentElement).fontSize);
  out.body = parseFloat(getComputedStyle(document.querySelector(".hero__lead")).fontSize);
  out.overflow = document.documentElement.scrollWidth - window.innerWidth;
  // Ekranın dışına çıkan metin
  out.out = texts.filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).map(name);
  // Kutusuna sığmayan metin: içeriği kutusundan geniştir. Satır içi öğenin kutusu yoktur, o sayılmaz.
  out.cut = texts.filter((e) => getComputedStyle(e).display !== "inline" && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1).map((e) => name(e) + " " + e.scrollWidth + ">" + e.clientWidth);
  out.minFont = Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  const nav = [...document.querySelectorAll(".bottomnav a")].filter(visible).map((a) => a.getBoundingClientRect());
  out.navFits = nav.every((r) => r.left >= -1 && r.right <= innerWidth + 1);
  // Yan yana duran iki gezinme öğesi birbirine değmez.
  const all = document.querySelector(".nav__all--js").getBoundingClientRect();
  const aside = document.querySelector(".nav__aside").getBoundingClientRect();
  out.navRow = aside.width === 0 || aside.top >= all.bottom - 1 || aside.left - all.right >= 8;
  return out;
}

// Kök yazı boyutu büyütülünce dar ekran bozulmaz. Kullanıcı bu ayarı tarayıcıdan yapar.
// Chromium'da sınanır: varsayılan yazı boyutu tarayıcı başlatılırken verilir. Böylece yazı boyutuna bağlı
// ekran sorguları (em) da gerçek ayara göre çalışır. WebKit bu ayarı öykünmez.
async function textScale(engine, px, w, h, prepare) {
  const size = `${w}x${h} yazı ${px}px`;
  const browser = await chromium.launch({ args: [`--blink-settings=defaultFontSize=${px}`] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  if (prepare) await prepare(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in"));
    document.querySelectorAll('[data-fold][data-open="false"] .fold__btn').forEach((b) => { if (b.getClientRects().length) b.click(); });
  });
  await page.waitForTimeout(1300);
  const f = await page.evaluate(fits);
  if (Math.abs(f.root - px) > 0.5) notRun.push(`${engine} ${size}: tarayıcı yazı boyutu ayarını uygulamadı (kök ${f.root}px), denetim çalışmadı`);
  else {
    check(engine, size, "büyütülen yazıda gövde metni büyür", f.body >= px - 0.5 && f.minFont >= 14, `gövde ${f.body}px, en küçük ${f.minFont}px`);
    check(engine, size, "büyütülen yazıda yatay taşma yok", f.overflow <= 0, `taşma ${f.overflow}px`);
    check(engine, size, "büyütülen yazıda metin kutusuna ve ekrana sığar", f.out.length === 0 && f.cut.length === 0, [...f.out, ...f.cut].slice(0, 6).join(" | "));
    check(engine, size, "büyütülen yazıda gezinme öğeleri ekrana sığar", f.navFits && f.navRow, JSON.stringify({ alt: f.navFits, ust: f.navRow }));
  }
  if (shots) await page.screenshot({ path: join(shots, `${engine}-${w}x${h}-yazi${px}.png`), fullPage: true });
  await browser.close();
}

// Zorlanmış renkler (örneğin Windows yüksek karşıtlık). Yazarın dolguları silinir.
// Odak, klavye modunda çerçeveyle gösterilir. Çerçevenin izinli olduğu tek durum budur.
// Yalnız dolguyla anlatılan seçili durum da sistem rengiyle ayırt edilir.
async function forcedColors(browser, engine, prepare) {
  const size = "1024x768 zorlanmış renk";
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, forcedColors: "active" });
  if (prepare) await prepare(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  if (!(await page.evaluate(() => matchMedia("(forced-colors: active)").matches))) {
    notRun.push(`${engine} ${size}: bu motor zorlanmış renkleri öykünmedi, denetim çalışmadı`);
    await ctx.close();
    return;
  }
  await page.focus("#mod-urun");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const kbd = await page.evaluate(() => { const st = getComputedStyle(document.activeElement); return { id: document.activeElement.id, style: st.outlineStyle, width: st.outlineWidth, kb: document.documentElement.dataset.kb }; });
  check(engine, size, "zorlanmış renklerde klavye odağı çerçeveyle görünür", kbd.kb === "on" && kbd.id === "mod-urun" && kbd.style === "solid" && kbd.width === "2px", JSON.stringify(kbd));
  await page.locator('[data-filter="mutfak"]').scrollIntoViewIfNeeded();
  await page.click('[data-filter="mutfak"]');
  const ptr = await page.evaluate(() => { const el = document.querySelector('[data-filter="mutfak"]'); return { style: getComputedStyle(el).outlineStyle, kb: document.documentElement.dataset.kb || "", pressed: el.getAttribute("aria-pressed") }; });
  check(engine, size, "zorlanmış renklerde fareyle basılan öğede çerçeve yok", ptr.kb === "" && ptr.style === "none" && ptr.pressed === "true", JSON.stringify(ptr));
  const sel = await page.evaluate(() => {
    const bg = (q) => getComputedStyle(document.querySelector(q)).backgroundColor;
    return {
      filter: bg('.filter[aria-pressed="true"]'), filterOff: bg('.filter[aria-pressed="false"]'), tab: bg('.seg button[aria-selected="true"]'), tabOff: bg('.seg button[aria-selected="false"]'),
      pref: bg('.pref[aria-checked="true"]'), prefOff: bg('.pref[aria-checked="false"]'), bar: bg(".header__bar"), page: getComputedStyle(document.body).backgroundColor,
    };
  });
  check(engine, size, "zorlanmış renklerde seçili durum ayırt edilir", sel.filter !== sel.filterOff && sel.tab !== sel.tabOff && sel.pref !== sel.prefOff && sel.bar !== sel.page, JSON.stringify(sel));
  await ctx.close();
}

// Altıncı sürümün bölümleri: karşılamadaki iki yol, teklif özeti, planlanan bölgeler, araç ayrıntıları,
// içerik kütüphanesi ve hareketli yüzeyler. Durum tıklama anında okunur, geçiş beklenmez.
async function planned(page, engine, w, h) {
  const size = `${w}x${h}`;
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const hero = await page.evaluate(() => ({
    h1: document.querySelector("h1").textContent.replace(/\s+/g, " ").trim(),
    paths: [...document.querySelectorAll(".paths .path")].map((a) => a.getAttribute("href")),
  }));
  check(engine, size, "karşılama alıcıyı ve satıcıyı iki yolla anlatır", hero.h1.endsWith("Toptan alın. Yeni müşterilere satın.") && hero.paths.join(" ") === "#urunler #saticilar", JSON.stringify(hero));
  // Teklif özeti yazma anında güncellenir.
  await page.fill("#t-urun", "saklama kabı");
  await page.fill("#t-adet", "500");
  const sum = await page.evaluate(() => document.querySelector("[data-rfq-sum-t]").textContent);
  // Özet gönderilmiş bir istek gibi görünmez. Boş özet ne olacağını söyler. Form notu düğmenin göndermediğini ve gerçek isteğin yerini söyler.
  const rfqCopy = await page.evaluate(() => ({
    note: document.querySelector("[data-rfq-note]").textContent.trim(),
    done: document.querySelector("[data-rfq-done]").textContent.replace(/\s+/g, " ").trim(),
    next: document.querySelector("#teklif-sonra").textContent.trim(),
  }));
  check(engine, size, "teklif formu gönderilmediğini ve gerçek isteğin yerini söyler",
    rfqCopy.note.includes("Düğme isteğinizi kimseye göndermez.") && rfqCopy.note.includes("Gerçek isteği istoc.com'da gönderirsiniz.")
    && rfqCopy.done.includes("Gerçek isteği istoc.com'da gönderirsiniz.") && rfqCopy.next.endsWith("?") && !rfqCopy.next.startsWith("Sonra"), JSON.stringify(rfqCopy));
  // Başlık faydayı, açıklama gerekçeyi söyler. Araç adları ve araçlara giden bağlantılar tek ve açık adla yazar.
  const names = await page.evaluate(() => ({
    urun: document.querySelector("#urun-baslik").textContent.replace(/^Ürünler: /, "").trim(),
    lead: document.querySelector("#urunler .mh__lead").textContent.trim(),
    tools: [...document.querySelectorAll("#araclar .tool h4")].map((h) => h.textContent.trim()),
    toTools: [...document.querySelectorAll('a[href="#araclar"]')].filter((a) => !a.closest(".nav, .header, .lib")).map((a) => a.textContent.trim()),
  }));
  check(engine, size, "ürün başlığı faydayı, açıklaması gerekçeyi söyler",
    names.urun === "Fiyatları ve sipariş şartlarını birlikte görün." && names.lead.startsWith("Fiyat sormanıza gerek yok çünkü ürünlerin fiyatları aşağıda yazıyor."), JSON.stringify(names));
  check(engine, size, "araç adları ve araç bağlantıları açık",
    names.tools.includes("Toplu alım indirimi") && names.tools.includes("Masrafı karşılayan satış adedi")
    && names.toTools.length >= 2 && names.toTools.every((t) => t === "Hesaplama araçlarını görün"), JSON.stringify({ tools: names.tools, toTools: names.toTools }));
  check(engine, size, "teklif özeti ürün ve adet yazılınca anında güncellenir", sum === "İstek özeti: 500 adet saklama kabı.", sum);
  // Özet her tuşta okunmaz: canlı bölge değildir. Gönderim sonucunu sayfanın durum satırı (#durum) okur.
  const live = await page.evaluate(() => document.querySelector("[data-rfq-sum]").getAttribute("aria-live"));
  check(engine, size, "teklif özeti her tuşta okunmaz", live === null, String(live));
  // Adet katı pozitif tam sayıdır. Türkçe binlik gruplama (1.000) kabul edilir. Başka biçim hazır sayılmaz.
  const qtyCases = [["-5", null], ["1,5", null], ["5x10", null], ["1.5", null], ["0", null], ["99999999999999999999", null], ["1.000", "1.000"], ["12.500", "12.500"], ["500", "500"]];
  const bad = [];
  for (const [input, shown] of qtyCases) {
    await page.fill("#t-adet", input);
    const st = await page.evaluate(() => ({ t: document.querySelector("[data-rfq-sum-t]").textContent, inv: document.querySelector("#t-adet").getAttribute("aria-invalid"), desc: document.querySelector("#t-adet").getAttribute("aria-describedby") }));
    const ok = shown === null
      ? st.t === "Adedi 1 ya da daha büyük bir tam sayıyla yazın. Örneğin 500 ya da 1.000." && st.inv === "true" && st.desc === "teklif-ozeti"
      : st.t === `İstek özeti: ${shown} adet saklama kabı.` && st.inv === null;
    if (!ok) bad.push(`${input}: ${st.t} (${st.inv})`);
  }
  check(engine, size, "adet yalnız pozitif tam sayı olarak kabul edilir", bad.length === 0, bad.join(" | "));
  await page.fill("#t-adet", "500");
  // Gerekçe kartının sıra numarası başlığa ve piktograma değmez. Kartlar ve akış adımları aynı hizada başlar.
  const lay = await page.evaluate(() => {
    const hits = [];
    for (const li of document.querySelectorAll(".reason")) {
      const r = li.getBoundingClientRect();
      const ps = getComputedStyle(li, "::before");
      const c = document.createElement("canvas").getContext("2d");
      c.font = `${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily}`;
      const w = c.measureText("06").width;
      const box = { left: r.right - parseFloat(ps.right) - w, top: r.top + parseFloat(ps.top), bottom: r.top + parseFloat(ps.top) + parseFloat(ps.lineHeight || ps.fontSize) * 1 };
      if (!isFinite(box.bottom)) box.bottom = box.top + parseFloat(ps.fontSize) * 1.5;
      const range = document.createRange();
      range.selectNodeContents(li.querySelector("h3"));
      const rects = [...range.getClientRects(), li.querySelector(".picto").getBoundingClientRect()];
      if (rects.some((q) => q.right > box.left && q.left < r.right && q.bottom > box.top && q.top < box.bottom)) hits.push(li.querySelector("h3").textContent.trim().slice(0, 24));
    }
    const rows = (sel, inner) => {
      const by = {};
      for (const li of document.querySelectorAll(sel)) {
        const r = li.getBoundingClientRect();
        if (!r.height) continue;
        (by[Math.round(r.top + scrollY)] ||= []).push(Math.round(li.querySelector(inner).getBoundingClientRect().top - r.top));
      }
      return Object.values(by).filter((row) => row.some((x) => x !== row[0]));
    };
    return { hits, reason: rows(".reason", "h3"), flow: rows(".pp__flow li", ".pp__who") };
  });
  check(engine, size, "gerekçe kartında numara başlığa değmez", lay.hits.length === 0, lay.hits.join(" | "));
  check(engine, size, "kartlar ve akış adımları aynı hizada başlar", !lay.reason.length && !lay.flow.length, JSON.stringify(lay));
  // Planlanan her bölge görünür etiketini taşır. Gezinme ve alt bölüm araçlara ve kütüphaneye gider.
  const plan = await page.evaluate(() => ({
    regions: [...document.querySelectorAll("[data-plan]")].map((r) => [r.id, !!r.querySelector(".plan-tag")]),
    links: ["araclar", "kutuphane"].map((id) => document.querySelectorAll(`a[href="#${id}"]`).length),
    tools: document.querySelectorAll("#araclar .tool").length,
    groups: document.querySelectorAll("#araclar .tgroup").length,
    lib: [...document.querySelectorAll("#kutuphane .lib__type")].map((t) => t.querySelectorAll(".libq").length),
  }));
  check(engine, size, "planlanan bölgeler etiketli", plan.regions.length >= 5 && plan.regions.every((r) => r[1]), JSON.stringify(plan.regions));
  check(engine, size, "araçlarda 3 grup ve 12 araç var", plan.tools === 12 && plan.groups === 3, JSON.stringify(plan));
  check(engine, size, "kütüphanede 6 tür ve türde 3 ya da 4 öğe var", plan.lib.length === 6 && plan.lib.every((n) => n >= 3 && n <= 4), JSON.stringify(plan.lib));
  check(engine, size, "araçlara ve kütüphaneye en az iki bağlantı gider", plan.links.every((n) => n >= 2), JSON.stringify(plan.links));
  // Araç ayrıntısı: tıklama ve klavye ile açılır, durum anında yazılır.
  const btn = page.locator("#arac-1-1-b");
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  const open = await page.evaluate(() => {
    const b = document.querySelector("#arac-1-1-b");
    const p = document.getElementById(b.getAttribute("aria-controls"));
    return { exp: b.getAttribute("aria-expanded"), state: p.dataset.open, inert: p.inert, text: p.textContent };
  });
  check(engine, size, "araç ayrıntısı tıklama anında açılır", open.exp === "true" && open.state === "true" && open.inert === false && open.text.includes("henüz hesaplama yapmaz"), JSON.stringify(open));
  await page.focus("#arac-1-1-b");
  await page.keyboard.press("Enter");
  const closed = await page.evaluate(() => document.querySelector("#arac-1-1-b").getAttribute("aria-expanded"));
  check(engine, size, "araç ayrıntısı Enter ile kapanır", closed === "false", closed);
  // Terim açıklamalı uzun ayrıntılar da tam açılır: metin panelden taşmaz ve kesilmez.
  // Yeniden sipariş zamanı aracı tedarik süresini ve güvenlik stokunu günlük sözle açıklar. Birim kâr brüt farkı açıklar.
  const longs = [];
  for (const id of ["arac-3-4", "arac-3-1", "arac-2-2"]) {
    await page.locator(`#${id}-b`).scrollIntoViewIfNeeded();
    await page.locator(`#${id}-b`).click();
    await page.waitForTimeout(450);
    longs.push(await page.evaluate((id) => {
      const p = document.getElementById(id);
      const inner = p.firstElementChild;
      const pr = p.getBoundingClientRect(), ir = inner.getBoundingClientRect();
      const words = [...inner.querySelectorAll("p")].every((q) => q.scrollWidth <= q.clientWidth + 1);
      return { id, open: p.dataset.open, fits: ir.bottom <= pr.bottom + 1 && ir.right <= pr.right + 1 && words, text: inner.textContent };
    }, id));
  }
  const terms = longs.map((l) => l.text).join(" ");
  check(engine, size, "uzun araç ayrıntısı tam açılır ve taşmaz", longs.every((l) => l.open === "true" && l.fits), JSON.stringify(longs.map(({ id, open, fits }) => ({ id, open, fits }))));
  check(engine, size, "araç terimleri günlük sözle açıklanır",
    ["Güvenlik stoku, ", "Tedarik süresi, ", "Brüt fark, ", "Hacim böleni, ", "Hacimsel ağırlık, "].every((t) => terms.includes(t)), terms.slice(0, 200));
  const lb = page.locator("#lib-b1-1");
  await lb.scrollIntoViewIfNeeded();
  await lb.click();
  const libOpen = await page.evaluate(() => document.querySelector("#lib-b1-1").getAttribute("aria-expanded"));
  check(engine, size, "kütüphane öğesi sayfa içinde açılır", libOpen === "true", libOpen);
  // Durağan yüzeyler ve hareketli sahneler süstür: okuyucudan gizlidir ve tıklanmaz (kullanıcı kararı 11 Kasım 2026).
  // Eski giriş çizimi (is-on) ve işaretçi aydınlatması (is-near) kalktı. Hareket sözleşmesini motion() sınar.
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const surf = await page.evaluate(() => {
    const list = [...document.querySelectorAll("[data-surface], [data-motion-scene]")];
    return { n: list.length, hidden: list.every((e) => e.getAttribute("aria-hidden") === "true" && getComputedStyle(e).pointerEvents === "none") };
  });
  check(engine, size, "yüzeyler gizli ve tıklanmaz", surf.n >= 8 && surf.hidden, JSON.stringify(surf));
}

// Yeni bölüm ve hareket denetimleri sayfayı DOM hazır olunca sınar. Dış yazı tipinin yüklenmesi beklenmez.
// Bir koşu zaman aşımına uğrarsa o koşunun denetimi FAIL olur. Diğer koşular ve sonuç yine yazılır.
// Yükleme sorunu ile uygulama hatası ayrı yazılır. Sayfa, bağlam ya da sekme açılamazsa satır "YÜKLEME" ile başlar ve NOT_RUN olur.
// NOT_RUN geçmiş sayılmaz: koşunun çıkış kodu 1 olur. Uygulama denetiminin kendisi gevşemez.
const loadIssues = [];
class LoadError extends Error {}
const bounded = (promise, ms, what) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new LoadError(`${what} ${ms} ms içinde bitmedi`)), ms)),
]);
async function open(page) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForFunction(() => document.readyState !== "loading" && !!document.querySelector("footer"), null, { timeout: 10000 });
  } catch (e) {
    throw new LoadError(`sayfa açılamadı: ${String(e.message || e).split("\n")[0]}`);
  }
}
// Yeni denetimlerin açtığı bağlamlar. Koşu bitince ya da yarıda kalınca sınırlı süreyle kapatılır.
const made = [];
async function newCtx(browser, opts) {
  const ctx = await bounded(browser.newContext(opts), 15000, "bağlam açma");
  made.push(ctx);
  return ctx;
}
async function newTab(ctx) {
  return bounded(ctx.newPage(), 15000, "sekme açma");
}
async function guarded(engine, size, name, run) {
  try {
    await run();
  } catch (e) {
    const msg = String(e.message || e).split("\n")[0];
    if (e instanceof LoadError) {
      loadIssues.push(`${engine} ${size} ${name}`);
      notRun.push(`${engine} ${size} ${name}: YÜKLEME ${msg}`);
    } else check(engine, size, `${name} koşusu tamamlanır`, false, msg);
  } finally {
    for (const ctx of made.splice(0)) await bounded(ctx.close(), 10000, "bağlam kapatma").catch((e) => notRun.push(`${engine} ${size} ${name}: YÜKLEME ${e.message}`));
  }
}

// Bölgesel tedarik bölümü. Dizinden sonra, footer'dan önce gelir.
// Önce işletmenin ihtiyacı yazar, sonra yerler gelir. Her yerin nedeni ve teklif için 3 koşulu hep görünür.
// Ana eylem aynı sayfadaki teklif formunu o yerin ürünüyle doldurur. Satıcı varlığı ve doğrulama yazılmaz.
async function bolge(page, engine, w, h) {
  const size = `${w}x${h}`;
  await page.setViewportSize({ width: w, height: h });
  await open(page);
  await page.waitForTimeout(600);
  check(engine, size, "bölge verisi tek dosyada var", !!bolgeData && Array.isArray(bolgeData.yerler), bolgeFile);
  const data = bolgeData || { yerler: [], alim_plani: {} };
  // Yerin türü geçerli, etiketi türüyle uyumlu, ili yazılı ve kimliği tekildir. Yer sayısı en az 6'dır.
  const wrongType = data.yerler.filter((y) => !BOLGE_TURLERI.includes(y.tur) || !y.il || !etiketUyar(y)).map((y) => y.kimlik);
  const uniq = new Set(data.yerler.map((y) => y.kimlik)).size === data.yerler.length;
  const fold = await page.evaluate(() => {
    const more = document.querySelector("#bolgesel-tedarik [data-bolge-more]");
    const rows = [...document.querySelectorAll("#bolgesel-tedarik [data-bolge]")];
    return { more: !!more, open: more ? more.querySelector("button").getAttribute("aria-expanded") : null, inMore: rows.map((li) => (more && more.contains(li) ? 1 : 0)).join("") };
  });
  check(engine, size, "ilk 6 merkez açık, kalan merkezler kapalı panelde", fold.more && fold.open === "false" && /^0{6}1+$/.test(fold.inMore), JSON.stringify(fold));
  if (fold.more) {
    const btn = page.locator("#bolgesel-tedarik [data-bolge-more] button");
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(700);
  }
  const dup = data.yerler.map((y) => `${yerAnahtari(y)}|${y.sektor_kodu}`).filter((k, i, all) => all.indexOf(k) !== i);
  check(engine, size, "veride en az 22 merkez var, kayıt tekrar etmez ve türü doğru etiketli", data.yerler.length >= BOLGE_EN_AZ && uniq && dup.length === 0 && wrongType.length === 0, [...wrongType, ...dup].join(", ") || String(data.yerler.length));
  const m = await page.evaluate(() => {
    const sec = document.querySelector("#bolgesel-tedarik");
    if (!sec) return null;
    const dizin = document.querySelector("#dizin");
    const footer = document.querySelector("footer");
    const shown = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility === "visible" && e.getBoundingClientRect().height > 0;
    const hiddenBehind = (e) => !!e.closest("details:not([open]), [hidden], [aria-hidden='true'], [data-open='false'], [inert]");
    const need = sec.querySelector("[data-bolge-giris]");
    const list = sec.querySelector("[data-bolgeler]");
    const items = [...sec.querySelectorAll("[data-bolge]")].map((li) => {
      const teklif = li.querySelector("a[data-bolge-teklif]");
      const src = li.querySelector("a[data-bolge-kaynak]");
      const kosul = [...li.querySelectorAll("[data-bolge-kosul] > li")];
      const parts = ["[data-bolge-yer]", "[data-bolge-ihtiyac]", "[data-bolge-neden]"].map((q) => li.querySelector(q));
      return {
        id: li.dataset.bolge,
        yer: (parts[0] || {}).textContent?.replace(/\s+/g, " ").trim() || "",
        ihtiyac: (parts[1] || {}).textContent?.trim() || "",
        neden: (parts[2] || {}).textContent?.trim() || "",
        kosul: kosul.map((k) => k.textContent.trim()),
        open: parts.every((e) => shown(e) && !hiddenBehind(e)) && kosul.length === 3 && kosul.every((k) => shown(k) && !hiddenBehind(k)),
        teklif: teklif ? { text: teklif.textContent.trim(), href: teklif.getAttribute("href"), urun: teklif.dataset.urun || "" } : null,
        src: src ? { href: src.getAttribute("href"), size: parseFloat(getComputedStyle(src).fontSize), text: src.textContent.trim() } : null,
      };
    });
    const links = [...sec.querySelectorAll("a")].map((a) => a.getAttribute("href") || "");
    const plan = sec.querySelector("[data-alim-plani]") || document.querySelector("[data-alim-plani]");
    const planLinks = plan ? [...plan.querySelectorAll("a")].map((a) => a.textContent.trim() + ">" + a.getAttribute("href")) : [];
    const small = [...sec.querySelectorAll("*")].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(e) && parseFloat(getComputedStyle(e).fontSize) < 14)
      .map((e) => e.textContent.trim().slice(0, 20));
    const r = sec.getBoundingClientRect();
    const follows = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      inMain: !!sec.closest("main"),
      order: follows(dizin, sec) && follows(sec, footer),
      title: (sec.querySelector("h2") || {}).textContent?.replace(/\s+/g, " ").trim() || "",
      needFirst: !!need && shown(need) && follows(need, list),
      items,
      links,
      targetsOk: links.every((href) => /^https:\/\/\S+$/.test(href) || (/^#[\w-]+$/.test(href) && !!document.getElementById(href.slice(1)))),
      text: sec.innerText,
      plan: plan ? {
        title: (plan.querySelector("h3") || {}).textContent?.trim() || "",
        desc: (plan.querySelector("[data-alim-aciklama]") || {}).textContent?.trim() || "",
        checks: [...plan.querySelectorAll("[data-alim-kontrol] > li")].filter(shown).map((li) => li.textContent.trim()),
        links: planLinks,
        text: plan.innerText,
      } : null,
      small,
      overflow: Math.round(Math.max(r.right - innerWidth, document.documentElement.scrollWidth - innerWidth)),
      boxed: [...sec.querySelectorAll("[data-bolge]")].filter((li) => { const s = getComputedStyle(li); return parseFloat(s.borderTopLeftRadius) > 0 && s.borderLeftWidth !== "0px" && s.borderLeftColor !== s.borderTopColor; }).length,
    };
  });
  check(engine, size, "bölgesel tedarik bölümü dizinden sonra ve footer'dan önce gelir", !!m && m.inMain && m.order, JSON.stringify(m && { inMain: m.inMain, order: m.order }));
  if (!m) return;
  check(engine, size, "bölge başlığı faydayı söyler", m.title.endsWith("Alımınıza uygun ticaret merkezini bulun."), m.title);
  check(engine, size, "bölgelerden önce işletmenin ihtiyacı yazar", m.needFirst, String(m.needFirst));
  const ids = m.items.map((i) => i.id).join(" ");
  check(engine, size, "bölümde verideki bütün yerler var", ids === data.yerler.map((y) => y.kimlik).join(" ") && m.items.length === data.yerler.length, ids);
  const badLabel = m.items.filter((i) => { const y = data.yerler.find((x) => x.kimlik === i.id); return !y || i.yer !== yerEtiketi(y); }).map((i) => `${i.id}: ${i.yer}`);
  check(engine, size, "yerin ilçe ya da semt olduğu yazıyla görünür", badLabel.length === 0, badLabel.join(" | "));
  const closed = m.items.filter((i) => !i.open).map((i) => i.id);
  check(engine, size, "yerin nedeni ve 3 teklif koşulu hep açık görünür", closed.length === 0, closed.join(", "));
  // Her yerin metni o yere özgüdür. Yer adı çıkarılınca aynı kalan cümle şablon metindir.
  const strip = (i, t) => t.replace(new RegExp(data.yerler.find((y) => y.kimlik === i.id)?.ad || "@@", "g"), "").trim();
  const same = (key) => new Set(m.items.map((i) => strip(i, Array.isArray(i[key]) ? i[key].join("|") : i[key]))).size === m.items.length;
  check(engine, size, "her yerin ihtiyacı, nedeni ve koşulları kendine özgü", same("ihtiyac") && same("neden") && same("kosul"), "");
  // Olgu kaynaklıdır, ihtiyaç ve koşullar editoryal öneridir. İkisi veride ayrı durur.
  const dataSame = m.items.every((i) => { const y = data.yerler.find((x) => x.kimlik === i.id); return y && y.fact && y.editorial && i.ihtiyac === y.editorial.ihtiyac && i.neden === y.fact.metin && i.kosul.join("|") === y.editorial.kosullar.join("|") && i.teklif?.urun === y.editorial.teklif_urun; });
  check(engine, size, "bölge metni tek veri kaynağıyla aynı", dataSame, "");
  const badFact = data.yerler.filter((y) => !y.fact || !(y.fact.source_url || []).length || !y.fact.source_url.every((u) => /^https:\/\//.test(u)) || !(/^\d{4}-\d{2}-\d{2}$/.test(y.checked_at || "") && !Number.isNaN(Date.parse(y.checked_at)))).map((y) => y.kimlik);
  check(engine, size, "her olgunun kaynağı ve denetim tarihi var", data.yerler.length >= 1 && badFact.length === 0, badFact.join(", "));
  const srcSame = m.items.every((i) => { const y = data.yerler.find((x) => x.kimlik === i.id); return y && y.fact && y.fact.source_url.includes(i.src?.href); });
  check(engine, size, "kaynak bağlantısı verideki kaynağa gider", srcSame, m.items.map((i) => i.src && i.src.href).join(" "));
  check(engine, size, "bölüm satıcı bulunduğu anlamına gelmediğini söyler", /Bu merkezlerdeki satıcıların iStoc'ta bulunduğu anlamına gelmez\./.test(m.text) && !/Planlanan|Yakında/.test(m.text), "");
  const badAction = m.items.filter((i) => !i.teklif || i.teklif.text !== "Teklif isteyin" || i.teklif.href !== "#teklif" || !i.teklif.urun).map((i) => i.id);
  check(engine, size, "ana eylem teklif formuna gider", badAction.length === 0, badAction.join(", "));
  const badSrc = m.items.filter((i) => !i.src || !/^https:\/\//.test(i.src.href) || i.src.size < 14 || !i.src.text).map((i) => i.id);
  check(engine, size, "her yerin kaynak bağlantısı okunur", badSrc.length === 0, badSrc.join(", "));
  check(engine, size, "bölüm bağlantıları boş ya da sahte hedefe gitmez", m.targetsOk && m.links.length <= m.items.length * 2 + 4, m.links.join(" "));
  check(engine, size, "bölüm satıcı varlığı ya da doğrulama uydurmaz", !/doğrulan|onaylı satıcı|\d+\s*(satıcı|üretici)|satıcı bulunur|satıcılar var/i.test(m.text), (m.text.match(/.{0,30}(doğrulan|onaylı|satıcı).{0,30}/i) || [""])[0]);
  check(engine, size, "bölge satırları vurgu kenarlı kutu değildir", m.boxed === 0, String(m.boxed));
  check(engine, size, "bölümde 14 px altında metin yok", m.small.length === 0, m.small.slice(0, 4).join(" | "));
  check(engine, size, "bölüm yatay taşmaz", m.overflow <= 0, `${m.overflow}px`);
  // Alım planı: çok çeşit satan mağazalar için satın alma kontrol önerisi. Platform garantisi değildir.
  const pl = m.plan;
  check(engine, size, "alım planı bloğu çok çeşit satan mağazaya seslenir", !!pl && pl.title === "Ucuzluk mağazanızın alım listesini hazırlayın." && pl.desc === "Ev gereçleri, kırtasiye ve temizlik ürünleri satıyorsanız ürünlerin toplam maliyetini karşılaştırın.", JSON.stringify(pl && { title: pl.title, desc: pl.desc }));
  if (pl) {
    check(engine, size, "alım planı 4 kontrol önerisi verir", pl.checks.length === 4 && pl.checks.every((t) => /[.?]$/.test(t)), pl.checks.join(" | "));
    check(engine, size, "alım planı garanti ya da anahtar kelime yığını değildir", !/garanti|tek kargo|karışık koli (gönder|sağla)|japon|kapatıyoruz/i.test(pl.text), (pl.text.match(/.{0,20}(garanti|tek kargo|japon|kapatıyoruz).{0,20}/i) || [""])[0]);
    check(engine, size, "alım planı kategorilere ve teklif formuna gider", pl.links.join(" ") === "Ürün kategorilerini inceleyin>#kategoriler Teklif isteyin>#teklif", pl.links.join(" "));
  }
  // Arama: merkez adı, şehir ya da sektör yazılınca eşleşen merkezler kalır. Eşleşen merkez kapalı paneldeyse panel açılır.
  // Gizlenen merkez odaklanamaz. Sonuç sayısı yazar ve duyurulur. Eşleşme yoksa durum cümlesi görünür. Arama temizlenince bütün merkezler geri gelir.
  // Arama Türkçe büyük ve küçük harfe ve işaretlere duyarsızdır. Yerel seçim menüsü kullanılmaz.
  const q = page.locator("#bolgesel-tedarik [data-bolge-q]");
  if (await q.count()) {
    const norm = trNorm;
    const city = data.yerler[data.yerler.length - 1].il;
    const want = data.yerler.filter((y) => [y.ad, y.il, y.sektor, y.yer_etiketi].some((t) => norm(t).includes(norm(city)))).map((y) => y.kimlik);
    await q.scrollIntoViewIfNeeded();
    await q.fill(city.toLocaleUpperCase("tr"));
    const r = await page.evaluate(() => {
      const sec = document.querySelector("#bolgesel-tedarik");
      const rows = [...sec.querySelectorAll("[data-bolge]")];
      const hidden = rows.filter((li) => li.hidden);
      const focusable = hidden.some((li) => { const a = li.querySelector("a"); a.focus(); return document.activeElement === a; });
      return {
        shown: rows.filter((li) => !li.hidden && li.getClientRects().length > 0).map((li) => li.dataset.bolge),
        // Arama sürerken panelin düğmesi ve eski sayısı gizlenir, panel açık durur. Eşleşen satır düğmesiz görünür.
        open: (() => { const m = sec.querySelector("[data-bolge-more]"); return m ? { btn: m.querySelector("button").hidden, panel: m.querySelector(".faq__panel").dataset.open } : null; })(),
        // Panelin erişilebilir adı: aria-labelledby ile gösterilen öğelerin metni. Arama sürerken eski "... daha görün" sayısını okumaz.
        name: (() => { const p = sec.querySelector("[data-bolge-more] .faq__panel"); return p ? (p.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || "").join(" ").replace(/\s+/g, " ").trim() : ""; })(),
        sonuc: (sec.querySelector("[data-bolge-sonuc]") || {}).textContent || "", durum: (document.querySelector("#durum") || {}).textContent || "",
        focusable, select: sec.querySelectorAll("select").length,
      };
    });
    const inMore = want.some((id) => data.yerler.findIndex((y) => y.kimlik === id) >= 6);
    check(engine, size, "arama şehir, merkez ve sektörde eşleşenleri gösterir", r.shown.slice().sort().join() === want.slice().sort().join() && want.length > 0
      && r.sonuc.includes(String(want.length)) && r.durum.includes(String(want.length)) && (!r.open || (r.open.btn === true && r.open.panel === "true")) && r.select === 0 && inMore !== null, JSON.stringify({ want, r }));
    // ASCII yazım da eşleşir: "Istanbul" yazılınca İstanbul'daki merkezler bulunur.
    await q.fill("Istanbul");
    const ascii = await page.evaluate(() => [...document.querySelectorAll("#bolgesel-tedarik [data-bolge]")].filter((li) => !li.hidden).length);
    const ist = data.yerler.filter((y) => [y.ad, y.il, y.sektor, y.yer_etiketi].some((t) => trNorm(t).includes("istanbul"))).length;
    check(engine, size, "arama ASCII yazımı da eşleştirir", ist > 0 && ascii === ist, `${ascii}/${ist}`);
    check(engine, size, "aramada gizlenen merkez odaklanamaz", r.focusable === false, "");
    check(engine, size, "arama sürerken panelin erişilebilir adı eski sayıyı okumaz", !!r.name && !/daha görün/.test(r.name), r.name);
    await q.fill("zzzz eşleşmeyen");
    const z = await page.evaluate(() => { const sec = document.querySelector("#bolgesel-tedarik"); const e = sec.querySelector("[data-bolge-bos]"); return { bos: !!e && !e.hidden, shown: sec.querySelectorAll("[data-bolge]:not([hidden])").length }; });
    check(engine, size, "aramada eşleşme yoksa durum cümlesi görünür", z.bos && z.shown === 0, JSON.stringify(z));
    await q.fill("");
    const back = await page.evaluate(() => { const sec = document.querySelector("#bolgesel-tedarik"); const m = sec.querySelector("[data-bolge-more]"); return { hidden: sec.querySelectorAll("[data-bolge][hidden]").length, bos: sec.querySelector("[data-bolge-bos]").hidden, btn: m ? m.querySelector("button").hidden : false, expanded: m ? m.querySelector("button").getAttribute("aria-expanded") : "", panel: m ? m.querySelector(".faq__panel").dataset.open : "" }; });
    check(engine, size, "arama temizlenince bütün merkezler ve panelin önceki durumu geri gelir", back.hidden === 0 && back.bos === true && back.btn === false && back.expanded === back.panel, JSON.stringify(back));
  } else check(engine, size, "arama şehir, merkez ve sektörde eşleşenleri gösterir", false, "arama alanı yok");
  // Eylem: teklif formunu o yerin ürünüyle doldurur ve odağı ürün alanına taşır.
  const first = m.items.find((i) => i.teklif);
  if (first) {
    await page.fill("#t-urun", "");
    const link = page.locator(`[data-bolge="${first.id}"] a[data-bolge-teklif]`);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => ({ value: document.querySelector("#t-urun").value, focus: document.activeElement && document.activeElement.id, hash: location.hash, sum: document.querySelector("[data-rfq-sum-t]").textContent }));
    check(engine, size, "teklif bağlantısı formu o yerin ürünüyle doldurur", after.value === first.teklif.urun && after.focus === "t-urun" && after.hash === "#teklif" && after.sum.includes(first.teklif.urun), JSON.stringify(after));
    // Odak ve özet tıklamayla aynı karede gelir. Gecikmeli odak yoktur.
    await page.fill("#t-urun", "");
    const tick = await page.evaluate((id) => {
      document.querySelector(`[data-bolge="${id}"] a[data-bolge-teklif]`).click();
      return { focus: document.activeElement && document.activeElement.id, value: document.querySelector("#t-urun").value, sum: document.querySelector("[data-rfq-sum-t]").textContent, hash: location.hash };
    }, first.id);
    check(engine, size, "teklif bağlantısı odağı ve özeti aynı anda verir", tick.focus === "t-urun" && tick.value === first.teklif.urun && tick.sum.includes(first.teklif.urun) && tick.hash === "#teklif", JSON.stringify(tick));
    // Değiştirici tuşlu tıklama bağlantının doğal davranışına bırakılır: alan doldurulmaz.
    await page.fill("#t-urun", "");
    const mod = await page.evaluate((id) => {
      const a = document.querySelector(`[data-bolge="${id}"] a[data-bolge-teklif]`);
      let prevented = null;
      const spy = (e) => { prevented = e.defaultPrevented; e.preventDefault(); };
      document.addEventListener("click", spy);
      a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, metaKey: true }));
      document.removeEventListener("click", spy);
      return { prevented, value: document.querySelector("#t-urun").value };
    }, first.id);
    check(engine, size, "değiştirici tuşlu tıklamada bağlantı doğal davranır", mod.prevented === false && mod.value === "", JSON.stringify(mod));
    // Kullanıcının yazdığı ürün silinmez. Alan doluysa öneri yazılmaz, odak yine alana gider.
    await page.fill("#t-urun", "kendi ürünüm");
    const other = page.locator(`[data-bolge="${m.items[1].id}"] a[data-bolge-teklif]`);
    await other.scrollIntoViewIfNeeded();
    await other.click();
    await page.waitForTimeout(100);
    const kept = await page.evaluate(() => ({ value: document.querySelector("#t-urun").value, focus: document.activeElement && document.activeElement.id }));
    check(engine, size, "teklif bağlantısı yazılan ürünü silmez", kept.value === "kendi ürünüm" && kept.focus === "t-urun", JSON.stringify(kept));
  }
}

// Hareketli sahneler (kullanıcı kararı 11 Kasım 2026, TypeScript hareket paketi).
// Eski sözleşme (24 px kayan süs katmanı, data-surface ve data-axis) bu kararla değişti. Güvenlik şartları aynı kaldı:
//   hareket azaltmada ve veri tasarrufunda paket indirilmez, içerik ve odak yerinde kalır, işaretçi yalnız ince işaretçide çalışır,
//   ekran dışında ve gizli sekmede iş yapılmaz, kaydırma durunca kare istenmez.
// Sözleşme: sahne kökü data-motion-scene ve data-axis taşır. Hareketli grup data-motion-layer taşır.
// Denetleyici başlayınca kökte data-motion-ready="true" olur. Kaydırma ilerlemesi kökte --scene-progress (0..1) olarak yazar.
// Sunum, ortak hareket sözleşmesine göre hedefe 520 ms ve merkezi eğriyle gider. --scene-progress anlık anlamsal değerdir.
// Hareket sınırı tasarım kararıdır: katman en çok 160 CSS px (640 px altında 56 CSS px) kayar, ölçek 0,65 ile 1,08 arasında kalır.
async function motion(browser, engine, w, h, prepare) {
  const size = `${w}x${h} hareket`;
  const ctx = await newCtx(browser, { viewport: { width: w, height: h } });
  if (prepare) await prepare(ctx);
  const loaded = [];
  ctx.on("request", (r) => { const p = new URL(r.url()).pathname; if (/\/hareket\/[^/]+\.js$/.test(p)) loaded.push(p); });
  // Kare isteklerini sayar. Sayaç testin kendisine aittir, sayfanın davranışını değiştirmez.
  await ctx.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__raf = 0;
    window.requestAnimationFrame = (cb) => { window.__raf++; return raf(cb); };
  });
  const page = await newTab(ctx);
  await open(page);
  const ready = await page.waitForFunction(() => [...document.querySelectorAll("[data-motion-scene]")].every((e) => e.dataset.motionReady === "true"), null, { timeout: 8000 }).then(() => true, () => false);
  const info = await page.evaluate(() => [...document.querySelectorAll("[data-motion-scene]")].map((e) => ({
    name: e.dataset.motionScene, axis: e.dataset.axis || "", ready: e.dataset.motionReady || "", layers: e.querySelectorAll("[data-motion-layer]").length,
    hidden: e.getAttribute("aria-hidden") === "true" && getComputedStyle(e).pointerEvents === "none",
  })));
  const plan = info.some((s) => s.name === "depth");
  const want = ["flow", "grid", "route", "rise", "magnet", ...(plan ? ["depth"] : [])].sort().join(" ");
  check(engine, size, "sahneler hazır, süstür ve tıklanmaz", ready && info.map((s) => s.name).sort().join(" ") === want && info.every((s) => s.hidden && s.layers >= 2), JSON.stringify(info));
  check(engine, size, "üç hareket ekseni var", new Set(info.map((s) => s.axis)).size === 3, info.map((s) => s.axis).join(" "));
  check(engine, size, "hareket paketi önyükleyiciden sonra dinamik yüklenir", loaded[0] === "/hareket/baslat.js" && loaded.includes("/hareket/sahne.js"), loaded.join(" "));
  // Bir sahnenin ölçümü: ilerleme, katmanların dönüşümü ve başlığın sahneye göre yeri.
  const read = (sel) => page.evaluate((q) => {
    const sec = document.querySelector(q);
    const s = sec && sec.querySelector("[data-motion-scene]");
    if (!s) return null;
    const sr = s.getBoundingClientRect();
    const head = sec.querySelector("h1, h2");
    const hr = head ? head.getBoundingClientRect() : sr;
    // SVG katmanının matris değeri görünüm kutusu birimidir. CSS px için SVG ölçeğiyle (unit) çarpılır. DOM katmanında unit 1'dir.
    const svg = s.querySelector("svg");
    const box = svg ? svg.getBoundingClientRect() : null;
    const unit = box ? Math.max(box.width / 1200, box.height / 640) : 1;
    const layers = [...s.querySelectorAll("[data-motion-layer]")].map((l) => {
      const m = new DOMMatrix(getComputedStyle(l).transform === "none" ? undefined : getComputedStyle(l).transform);
      const k = l instanceof SVGElement ? unit : 1;
      return { x: m.m41 * k, y: m.m42 * k, s: Math.hypot(m.m11, m.m12), r: Math.atan2(m.m12, m.m11) * 180 / Math.PI };
    });
    return { p: s.style.getPropertyValue("--scene-progress"), layers, head: [Math.round(hr.left - sr.left), Math.round(hr.top - sr.top), Math.round(hr.width)].join(","), narrow: innerWidth < 640 };
  }, sel);
  // Bölümün başlığındaki beliriş geçişi doğal olarak biter, sonra ölçülür. Yalnız süren ya da bekleyen geçiş beklenir.
  const settled = (sel) => page.waitForFunction((q) => {
    const sec = document.querySelector(q);
    // Bölümün içindeki bütün CSS geçişleri ve canlandırmaları beklenir, ekranın hemen altındaki başlık da dahil.
    // Beliriş geçişi ekran dışında başlayabilir. Yalnız ekrandaki öğeyi beklemek bu geçişi kaçırıyordu (1440 px'te 160,008 px ölçümü).
    return !sec || sec.getAnimations({ subtree: true }).every((an) => an.playState !== "running" && !an.pending);
  }, sel, { timeout: 5000 });
  // Katman dönüşümü hedefe 520 ms (--dur-3) geçişle gider. Ölçüm geçiş bittikten sonra yapılır.
  const scroll = async (sel, dy) => { await page.evaluate((d) => scrollBy(0, d), dy); await page.waitForTimeout(700); await settled(sel); return read(sel); };
  const bring = async (sel, frac) => { await page.evaluate(([q, f]) => { const e = document.querySelector(q); if (e) scrollBy(0, e.getBoundingClientRect().top - innerHeight * f); }, [sel, frac]); await page.waitForTimeout(700); await settled(sel); return read(sel); };
  const num = (x) => (x && x.p !== "" ? Number(x.p) : NaN);
  for (const sel of ["#bolgesel-tedarik", "#ureticiler"]) {
    const a = await bring(sel, 0.85);
    const b = await scroll(sel, 260);
    const c = await scroll(sel, -140);
    check(engine, size, `${sel} ilerlemesi kaydırma yönünü izler`, num(b) > num(a) && num(c) < num(b) && [a, b, c].every((x) => num(x) >= 0 && num(x) <= 1), JSON.stringify([a, b, c].map((x) => x && x.p)));
    const d = (k) => a && b && c ? { ab: [b.layers[k].x - a.layers[k].x, b.layers[k].y - a.layers[k].y], bc: [c.layers[k].x - b.layers[k].x, c.layers[k].y - b.layers[k].y] } : null;
    const moves = a ? a.layers.map((_l, k) => d(k)) : [];
    const mag = (v) => Math.hypot(v[0], v[1]);
    const moved = moves.filter((m) => m && mag(m.ab) >= 4);
    // Ters yön: aşağı kaydırmadaki kayma ile yukarı kaydırmadaki kayma zıt işaretlidir.
    const back = moved.every((m) => m.ab[0] * m.bc[0] + m.ab[1] * m.bc[1] < 0);
    check(engine, size, `${sel} katmanları kaydırmayla taşınır ve geri döner`, moved.length >= 2 && back, JSON.stringify(moves.slice(0, 4)));
    const speeds = moved.map((m) => mag(m.ab)).sort((x, y) => x - y);
    check(engine, size, `${sel} katmanları farklı hızda kayar`, speeds.length >= 2 && speeds[speeds.length - 1] >= speeds[0] * 1.25, JSON.stringify(speeds.map((x) => Math.round(x))));
    const limit = a && a.narrow ? 56 : 160;
    const out = [a, b, c].flatMap((x) => (x ? x.layers : [])).filter((l) => Math.abs(l.x) > limit + 0.5 || Math.abs(l.y) > limit + 0.5 || l.s < 0.649 || l.s > 1.081);
    check(engine, size, `${sel} kayma ve ölçek sınırda kalır`, out.length === 0, JSON.stringify(out.slice(0, 3)));
    check(engine, size, `${sel} kaydırmada içerik yerinde kalır`, !!a && a.head === b.head && b.head === c.head, JSON.stringify([a && a.head, b && b.head, c && c.head]));
  }
  // Ekran dışındaki sahne için iş yapılmaz.
  const off0 = await read(".band--hero");
  await page.evaluate(() => scrollBy(0, 150));
  await page.waitForTimeout(250);
  const off1 = await read(".band--hero");
  check(engine, size, "ekran dışındaki sahne güncellenmez", !!off0 && off0.p === off1.p && JSON.stringify(off0.layers) === JSON.stringify(off1.layers), JSON.stringify([off0 && off0.p, off1 && off1.p]));
  // Gizli sekmede hesap yapılmaz. Sekme görünür olunca ekrandaki sahne güncellenir. hidden ve visibilityState birlikte değişir.
  const v0 = await read("#ureticiler");
  await page.evaluate(() => { for (const [k, v] of [["hidden", true], ["visibilityState", "hidden"]]) Object.defineProperty(document, k, { configurable: true, get: () => v }); scrollBy(0, -160); });
  await page.waitForTimeout(250);
  const v1 = await read("#ureticiler");
  await page.evaluate(() => { for (const [k, v] of [["hidden", false], ["visibilityState", "visible"]]) Object.defineProperty(document, k, { configurable: true, get: () => v }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForTimeout(250);
  const v2 = await read("#ureticiler");
  check(engine, size, "gizli sekmede sahne güncellenmez, görünür olunca güncellenir", !!v0 && v0.p === v1.p && v2.p !== v1.p, JSON.stringify([v0 && v0.p, v1 && v1.p, v2 && v2.p]));
  // Kaydırma durunca kare istenmez. Karşılamadaki örnek arama önce durdurulur, o hareket ayrı bir sözleşmedir.
  await page.evaluate(() => { const q = document.querySelector("#q-ana"); if (q) q.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); });
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.__raf = 0; });
  await page.waitForTimeout(1200);
  const idle = await page.evaluate(() => window.__raf);
  check(engine, size, "kaydırma durunca kare istenmez", idle === 0, String(idle));
  // İnce işaretçi: sahne en çok 8 px eğilir. İşaretçi sahneden çıkınca ya da sayfadan ayrılınca eğim sıfıra döner.
  if (w >= 1024) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    await settled(".band--hero");
    const box = await page.evaluate(() => { const r = document.querySelector(".band--hero").getBoundingClientRect(); const top = Math.max(0, r.top); const bottom = Math.min(innerHeight, r.bottom); return { x: r.left, y: top, w: r.width, h: bottom - top }; });
    const tilt = () => page.evaluate(() => { const s = document.querySelector(".band--hero [data-motion-scene]"); return { tx: s.style.getPropertyValue("--tx"), ty: s.style.getPropertyValue("--ty") }; });
    const headBefore = await read(".band--hero");
    await page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5);
    await page.mouse.move(box.x + box.w * 0.9, box.y + box.h * 0.85);
    await page.waitForTimeout(150);
    const t1 = await tilt();
    const headIn = await read(".band--hero");
    const px = (v) => Math.abs(parseFloat(v) || 0);
    check(engine, size, "işaretçi sahneyi sınırlı eğer, içerik yerinde kalır", (px(t1.tx) > 0 || px(t1.ty) > 0) && px(t1.tx) <= 8 && px(t1.ty) <= 8 && headBefore.head === headIn.head, JSON.stringify({ t1, headBefore: headBefore.head, headIn: headIn.head }));
    await page.mouse.move(box.x + 10, Math.max(2, box.y - 40));
    await page.waitForTimeout(150);
    const t2 = await tilt();
    await page.mouse.move(box.x + box.w * 0.8, box.y + box.h * 0.8);
    await page.waitForTimeout(150);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: null, pointerType: "mouse" })));
    await page.waitForTimeout(150);
    const t3 = await tilt();
    const zero = (t) => px(t.tx) === 0 && px(t.ty) === 0;
    check(engine, size, "işaretçi çıkınca eğim sıfıra döner", zero(t2) && zero(t3), JSON.stringify({ t2, t3 }));
    const tr = await page.evaluate(() => { const l = document.querySelector(".band--hero .scene__tilt"); const s = l ? getComputedStyle(l) : null; return s ? { prop: s.transitionProperty, dur: s.transitionDuration, fn: s.transitionTimingFunction } : null; });
    const parts = (v) => v.split(/,\s*(?![^()]*\))/);
    const i = tr ? parts(tr.prop).indexOf("transform") : -1;
    check(engine, size, "eğim iki yönde aynı süre ve eğriyle döner", i >= 0 && parts(tr.dur)[i] === "0.52s" && parts(tr.fn)[i] === "cubic-bezier(0.65, 0, 0.35, 1)", JSON.stringify(tr));
  }
  await ctx.close();
  // Dokunmatik ekran: üzerine gelmeden, yalnız kaydırmayla sahne ilerler. Dokunma eğim yazmaz.
  const tctx = await newCtx(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  if (prepare) await prepare(tctx);
  const tp = await newTab(tctx);
  await open(tp);
  await tp.waitForFunction(() => document.querySelector("[data-motion-scene]")?.dataset.motionReady === "true", null, { timeout: 8000 }).catch(() => {});
  await tp.evaluate(() => { const e = document.querySelector("#ureticiler"); if (e) scrollBy(0, e.getBoundingClientRect().top - innerHeight * 0.8); });
  await tp.waitForTimeout(250);
  const tA = await tp.evaluate(() => document.querySelector("#ureticiler [data-motion-scene]")?.style.getPropertyValue("--scene-progress") || "");
  await tp.evaluate(() => scrollBy(0, 200));
  await tp.waitForTimeout(250);
  const tB = await tp.evaluate(() => document.querySelector("#ureticiler [data-motion-scene]")?.style.getPropertyValue("--scene-progress") || "");
  await tp.touchscreen.tap(195, 400).catch(() => {});
  const tT = await tp.evaluate(() => document.querySelector("#ureticiler [data-motion-scene]")?.style.getPropertyValue("--tx") || "");
  check(engine, "390x844 dokunmatik", "dokunmatik ekranda sahne kaydırmayla ilerler, dokunma eğim yazmaz", tA !== "" && Number(tB) > Number(tA) && tT === "", JSON.stringify([tA, tB, tT]));
  await tctx.close();
  // Hareket azaltma: hareket paketi indirilmez. Sahne durağandır ve görünür.
  const rctx = await newCtx(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  if (prepare) await prepare(rctx);
  const rloaded = [];
  rctx.on("request", (r) => { const p = new URL(r.url()).pathname; if (/\/hareket\/[^/]+\.js$/.test(p)) rloaded.push(p); });
  const rp = await newTab(rctx);
  await open(rp);
  await rp.waitForTimeout(600);
  await rp.evaluate(() => { const e = document.querySelector("#ureticiler"); if (e) scrollBy(0, e.getBoundingClientRect().top - innerHeight * 0.6); });
  await rp.waitForTimeout(250);
  await rp.evaluate(() => scrollBy(0, 200));
  await rp.waitForTimeout(250);
  const rs = await rp.evaluate(() => [...document.querySelectorAll("[data-motion-scene]")].map((s) => ({
    p: s.style.getPropertyValue("--scene-progress"), ready: s.dataset.motionReady || "",
    moved: [...s.querySelectorAll("[data-motion-layer]")].some((l) => l.style.transform !== ""),
    shown: s.getBoundingClientRect().height > 0 && getComputedStyle(s).visibility === "visible",
  })));
  check(engine, "390x844 hareket azaltma", "hareket azaltmada paket indirilmez ve sahne durağandır", !rloaded.includes("/hareket/sahne.js") && rs.length >= 5 && rs.every((x) => x.p === "" && x.ready === "" && !x.moved && x.shown), JSON.stringify({ rloaded, rs: rs.slice(0, 3) }));
  await rctx.close();
  notRun.push(`${engine}: veri tasarrufu (Save-Data) tarayıcıda öykünülmedi. Kapı önyükleyicinin bu tercihi okuduğunu kaynakta denetler`);
}

// Kısa yatay ekranda teklif bağlantısı: odaklanan ürün alanı ekranda tam görünür.
// Sabit üst çubuk ve alt çubuk alanı örtmez. Alan en az 44 px yüksekliktedir.
async function prefillShort(page, engine) {
  const size = "568x320";
  await page.setViewportSize({ width: 568, height: 320 });
  await open(page);
  await page.waitForTimeout(300);
  const link = page.locator("[data-bolge] a[data-bolge-teklif]").first();
  await link.scrollIntoViewIfNeeded();
  await page.fill("#t-urun", "");
  await link.click();
  await page.waitForTimeout(150);
  const m = await page.evaluate(() => {
    const el = document.activeElement;
    const r = el.getBoundingClientRect();
    const covers = [...document.querySelectorAll("header, .header, .bottomnav, .cartbar")].filter((b) => {
      const s = getComputedStyle(b);
      // Boş sepet çubuğu saydam, etkisiz (inert) ve tıklanmaz durur. O çubuk alanı örtmez. Görünen ve tıklanan çubuk sayılır.
      return (s.position === "sticky" || s.position === "fixed") && b.getClientRects().length && s.visibility !== "hidden" && !b.inert && s.opacity !== "0" && s.pointerEvents !== "none";
    }).map((b) => b.getBoundingClientRect()).filter((b) => b.bottom > r.top && b.top < r.bottom && b.right > r.left && b.left < r.right);
    return { id: el.id, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), vh: innerHeight, covered: covers.length };
  });
  check(engine, size, "kısa yatay ekranda odaklanan ürün alanı tam görünür", m.id === "t-urun" && m.top >= 0 && m.bottom <= m.vh && m.h >= 44 && m.covered === 0, JSON.stringify(m));
}

// Alıcı talep bölümü (kullanıcı kararı 11 Kasım 2026). Planlanan hizmettir: gerçek alıcı profili ya da yayımlanmış talep listesi değildir.
// 24 bölge ve sektör alanı aynı HTML içindedir. İlk 6 alan açıktır, kalan 18 alan sayfanın açılır panelindedir (proje kuralı: details yok).
// Betik olmadan panel açık durur, 24 alan okunur.
// Grup süzgeci aria-pressed taşır, sonuç sayısını yazar ve duyurur. Eşleşmeyen alan gizlenir ve odak sırasından çıkar.
async function alici(page, engine, w, h) {
  const size = `${w}x${h}`;
  await page.setViewportSize({ width: w, height: h });
  await open(page);
  await page.waitForTimeout(400);
  check(engine, size, "alıcı verisi tek dosyada var ve tam 24 alan içerir", !!aliciData && Array.isArray(aliciData.yerler) && aliciData.yerler.length === 24, aliciFile);
  const data = aliciData || { yerler: [] };
  // Veri sözleşmesi: tek sektör, kanonik kod, geçerli grup, işletme türü, kaynaklı olgu ve 3 koşul.
  const badRec = data.yerler.filter((y) => typeof y.sektor !== "string" || !y.sektor || typeof y.sektor_kodu !== "string" || !GRUPLAR.includes(y.grup) || !y.isletme
    || !y.fact || !(y.fact.source_url || []).length || !(y.fact.source_url || []).every((u) => /^https:\/\//.test(u)) || !y.editorial || (y.editorial.kosullar || []).length !== 3).map((y) => y.kimlik);
  check(engine, size, "alıcı kayıtları sözleşmeye uyar", data.yerler.length === 24 && badRec.length === 0 && new Set(data.yerler.map((y) => y.kimlik)).size === 24, badRec.join(", "));
  // Yer başına en çok 2 farklı sektör: tedarik ve alıcı verisinin birleşimi.
  const perPlace = {};
  for (const y of [...((bolgeData || {}).yerler || []), ...data.yerler]) (perPlace[yerAnahtari(y)] ||= new Set()).add(y.sektor_kodu);
  const crowded = Object.entries(perPlace).filter(([, set]) => set.size > 2).map(([k, set]) => `${k}: ${[...set].join("/")}`);
  check(engine, size, "bir yerde en çok 2 farklı sektör var", crowded.length === 0 && Object.keys(perPlace).length > 0, crowded.join(" | "));
  const m = await page.evaluate(() => {
    const sec = document.querySelector("#alici-talepleri");
    if (!sec) return null;
    const follows = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const more = sec.querySelector("[data-talep-more]");
    const items = [...sec.querySelectorAll("[data-talep]")].map((li) => ({
      id: li.dataset.talep, grup: li.dataset.grup, inMore: !!more && more.contains(li),
      sektor: (li.querySelector("[data-talep-sektor]") || {}).textContent?.trim() || "",
      isletme: (li.querySelector("[data-talep-isletme]") || {}).textContent?.trim() || "",
      neden: (li.querySelector("[data-talep-neden]") || {}).textContent?.trim() || "",
      kosul: li.querySelectorAll("[data-talep-kosul] > li").length,
      src: (() => { const a = li.querySelector("a[data-talep-kaynak]"); return a ? { href: a.getAttribute("href"), size: parseFloat(getComputedStyle(a).fontSize) } : null; })(),
      teklif: (() => { const a = li.querySelector("a[data-bolge-teklif]"); return a ? { href: a.getAttribute("href"), urun: a.dataset.urun || "", text: a.textContent.trim() } : null; })(),
      ask: (li.querySelector(".bolge__ask-t") || {}).textContent?.trim() || "",
    }));
    const help = sec.querySelector("[data-talep-nasil]");
    return {
      order: follows(document.querySelector("#bolgesel-tedarik"), sec) && follows(sec, document.querySelector("footer")) && !!sec.closest("main"),
      plan: sec.hasAttribute("data-plan") && /Planlanan hizmet/.test((sec.querySelector(".plan-tag") || {}).textContent || ""),
      title: (sec.querySelector("h2") || {}).textContent?.replace(/\s+/g, " ").trim() || "",
      giris: (sec.querySelector("[data-talep-giris]") || {}).textContent?.trim() || "",
      not: (sec.querySelector("[data-talep-not]") || {}).textContent?.trim() || "",
      satici: (sec.querySelector("[data-talep-satici]") || {}).textContent?.trim() || "",
      items, moreOpen: more ? more.querySelector("button").getAttribute("aria-expanded") === "true" : null,
      help: help ? { open: help.querySelector("button").getAttribute("aria-expanded") === "true", summary: help.querySelector("button").textContent.trim(), text: help.textContent, inputs: help.querySelectorAll("input, textarea, select").length } : null,
      text: sec.innerText, imgs: sec.querySelectorAll("img").length,
      overflow: Math.round(document.documentElement.scrollWidth - innerWidth),
    };
  });
  check(engine, size, "alıcı talep bölümü tedarik bölümünden sonra ve footer'dan önce gelir", !!m && m.order, JSON.stringify(m && m.order));
  if (!m) return;
  check(engine, size, "alıcı talep bölümü planlanan hizmet etiketini taşır", m.plan, "");
  check(engine, size, "alıcı talep bölümünün başlığı ve açıklaması doğru", m.title.endsWith("İhtiyacınızı yazın. Uygun satıcılar sizi bulsun.")
    && m.giris === "İşletmenizin bulunduğu bölgeyi ve alacağınız ürünü seçin. Talebiniz için gereken bilgileri hazırlayın."
    && m.not === "Bu bölüm planlanan alım alanlarını gösterir. Yayımlanmış alıcı veya talep listesi değildir."
    && m.satici === "Satıcıysanız, ürünlerinize ihtiyaç duyabilecek işletme türlerini inceleyin.", JSON.stringify({ t: m.title, g: m.giris, n: m.not, s: m.satici }));
  const ids = m.items.map((i) => i.id).join(" ");
  check(engine, size, "24 alanın hepsi HTML içinde ve veriyle aynı sırada", ids === data.yerler.map((y) => y.kimlik).join(" ") && m.items.length === 24, ids);
  check(engine, size, "ilk 6 alan açık, kalan 18 alan kapalı panelde", m.items.slice(0, 6).every((i) => !i.inMore) && m.items.slice(6).every((i) => i.inMore) && m.moreOpen === false, JSON.stringify(m.items.map((i) => i.inMore ? 1 : 0).join("")));
  const badItem = m.items.filter((i) => { const y = data.yerler.find((x) => x.kimlik === i.id); return !y || i.sektor !== y.sektor || i.isletme !== y.isletme || i.neden !== y.fact.metin || i.kosul !== 3 || i.grup !== y.grup
    || !i.src || !y.fact.source_url.includes(i.src.href) || i.src.size < 14 || !i.teklif || i.teklif.href !== "#teklif" || i.teklif.urun !== y.editorial.teklif_urun; }).map((i) => i.id);
  check(engine, size, "her alan sektörü, işletme türünü, kaynağı, 3 koşulu ve teklif eylemini gösterir", badItem.length === 0, badItem.join(", "));
  // Alıcı eylemi gerçek gönderim yapmaz: düğme talebi hazırlamaya çağırır. Koşul başlığı hazırlığı söyler.
  check(engine, size, "alıcı düğmesi talebi hazırlamaya çağırır", m.items.length > 0 && m.items.every((i) => i.teklif && i.teklif.text === "Talebinizi hazırlayın" && i.ask === "Teklif için hazırlanın"), JSON.stringify(m.items[0] && { t: m.items[0].teklif, a: m.items[0].ask }));
  // Seçilen alım alanı formun yanında yazar. Ürün alanı boşsa öneri yazılır, doluysa yazılan ürün korunur. Satır teslimat adresi gibi yazmaz.
  if (m.items[0]) {
    const y0 = data.yerler.find((x) => x.kimlik === m.items[0].id);
    await page.fill("#t-urun", "");
    const link = page.locator(`[data-talep="${m.items[0].id}"] a[data-bolge-teklif]`);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForTimeout(100);
    const sel = await page.evaluate(() => { const e = document.querySelector("[data-rfq-alan]"); return { shown: !!e && !e.hidden && e.getBoundingClientRect().height > 0, text: e ? e.textContent.trim() : "", inForm: !!e && !!e.closest("#teklif"), value: document.querySelector("#t-urun").value }; });
    check(engine, size, "seçilen alım alanı formun yanında yazar", sel.shown && sel.inForm && y0 && sel.text === `Seçtiğiniz alım alanı: ${y0.isletme}, ${y0.ad}.` && !/adres|teslimat/i.test(sel.text) && sel.value === y0.editorial.teklif_urun, JSON.stringify(sel));
    // Tedarik bölümündeki bağlantı alım alanı seçmez: satır gizlenir.
    const sup = page.locator("[data-bolge] a[data-bolge-teklif]").first();
    await sup.scrollIntoViewIfNeeded();
    await sup.click();
    await page.waitForTimeout(100);
    const gone = await page.evaluate(() => { const e = document.querySelector("[data-rfq-alan]"); return !!e && e.hidden; });
    check(engine, size, "tedarik bağlantısı seçili alım alanını kaldırır", gone, String(gone));
    await page.fill("#t-urun", "");
  }
  check(engine, size, "alıcı bölümü gerçek profil ya da talep varmış gibi yazmaz", !/\d+\s*(alıcı|talep|işletme)\s*(var|bekliyor|listelendi)|talepler yayında|aktif talep|doğrulanmış alıcı/i.test(m.text) && m.imgs === 0, (m.text.match(/.{0,30}(aktif talep|talepler yayında|alıcı var).{0,30}/i) || [""])[0]);
  check(engine, size, "işletme listeleme yardımı kapalı panelde bilgi olarak durur, sahte kayıt yoktur", !!m.help && m.help.open === false && m.help.summary === "İşletmenizi nasıl listelersiniz?" && m.help.inputs === 0
    && ["Şirket adı", "Bölge", "Faaliyet", "Alım ihtiyacı"].every((k) => m.help.text.includes(k)), JSON.stringify(m.help && { s: m.help.summary, i: m.help.inputs }));
  check(engine, size, "alıcı bölümü yatay taşmaz", m.overflow <= 0, `${m.overflow}px`);
  // Grup süzgeci: tıklama anında süzer, sayıyı yazar ve duyurur. Eşleşmeyen alan gizlenir, odaklanamaz. Eşleşen alan kapalı paneldeyse panel açılır.
  const counts = Object.fromEntries(GRUPLAR.map((g) => [g, data.yerler.filter((y) => y.grup === g).length]));
  const target = GRUPLAR.find((g) => counts[g] > 0 && data.yerler.slice(6).some((y) => y.grup === g)) || GRUPLAR[0];
  const btn = page.locator(`#alici-talepleri [data-talep-grup="${target}"]`);
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    const f = await page.evaluate((g) => {
      const sec = document.querySelector("#alici-talepleri");
      const items = [...sec.querySelectorAll("[data-talep]")];
      const shown = items.filter((li) => !li.hidden && li.getClientRects().length > 0);
      const hiddenFocusable = items.filter((li) => li.hidden).some((li) => { const a = li.querySelector("a"); a.focus(); return document.activeElement === a; });
      return {
        pressed: [...sec.querySelectorAll("[data-talep-grup]")].map((b) => `${b.dataset.talepGrup}:${b.getAttribute("aria-pressed")}`),
        shown: shown.map((li) => li.dataset.grup), all: items.length,
        // Süzgeç sürerken panelin düğmesi ve eski sayısı gizlenir, panel açık durur.
        open: sec.querySelector("[data-talep-more] button").hidden === true && sec.querySelector("[data-talep-more] .faq__panel").dataset.open === "true",
        name: (() => { const p = sec.querySelector("[data-talep-more] .faq__panel"); return (p.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || "").join(" ").replace(/\s+/g, " ").trim(); })(),
        sonuc: (sec.querySelector("[data-talep-sonuc]") || {}).textContent || "", durum: (document.querySelector("#durum") || {}).textContent || "", hiddenFocusable,
      };
    }, target);
    const n = counts[target];
    check(engine, size, "grup süzgeci eşleşen alanları gösterir ve sayıyı yazar", f.shown.length === n && f.shown.every((g) => g === target) && f.open === true && f.sonuc.includes(String(n)) && f.durum.includes(String(n))
      && f.pressed.filter((x) => x.endsWith(":true")).join() === `${target}:true`, JSON.stringify(f));
    check(engine, size, "gizlenen alan odaklanamaz", f.hiddenFocusable === false, "");
    check(engine, size, "süzgeç sürerken panelin erişilebilir adı eski sayıyı okumaz", !!f.name && !/daha görün/.test(f.name), f.name);
    await page.locator('#alici-talepleri [data-talep-grup=""]').click();
    const back = await page.evaluate(() => { const sec = document.querySelector("#alici-talepleri"); const b = sec.querySelector("[data-talep-more] button"); return { hidden: sec.querySelectorAll("[data-talep][hidden]").length, sonuc: sec.querySelector("[data-talep-sonuc]").textContent, btn: b.hidden }; });
    check(engine, size, "tüm gruplar seçilince 24 alan ve panelin düğmesi geri gelir", back.hidden === 0 && back.sonuc.includes("24") && back.btn === false, JSON.stringify(back));
    const empty = GRUPLAR.find((g) => counts[g] === 0);
    if (empty) {
      await page.locator(`#alici-talepleri [data-talep-grup="${empty}"]`).click();
      const z = await page.evaluate(() => { const sec = document.querySelector("#alici-talepleri"); const e = sec.querySelector("[data-talep-bos]"); return { bos: !!e && !e.hidden, shown: sec.querySelectorAll("[data-talep]:not([hidden])").length }; });
      check(engine, size, "boş grupta durum cümlesi görünür", z.bos && z.shown === 0, JSON.stringify(z));
      await page.locator('#alici-talepleri [data-talep-grup=""]').click();
    }
  } else check(engine, size, "grup süzgeci eşleşen alanları gösterir ve sayıyı yazar", false, "süzgeç düğmesi yok");
}

// Yeni bölüm ve hareket denetimleri. --bolge seçeneği yalnız bunları ve betiksiz denetimi çalıştırır.
async function newChecks(browser, page, engine) {
  await guarded(engine, "568x320", "kısa ekranda teklif", () => prefillShort(page, engine));
  await guarded(engine, "320x568", "bölge", () => bolge(page, engine, 320, 568));
  await guarded(engine, "1440x900", "bölge", () => bolge(page, engine, 1440, 900));
  await guarded(engine, "320x568", "alıcı", () => alici(page, engine, 320, 568));
  await guarded(engine, "1440x900", "alıcı", () => alici(page, engine, 1440, 900));
  await guarded(engine, "390x844 hareket", "hareket", () => motion(browser, engine, 390, 844));
  await guarded(engine, "1440x900 hareket", "hareket", () => motion(browser, engine, 1440, 900));
}
const onlyBolge = process.argv.includes("--bolge");
// --motor=chromium ya da --motor=webkit yalnız o motoru çalıştırır. Varsayılan ikisidir.
const motorArg = (process.argv.find((a) => a.startsWith("--motor=")) || "").split("=")[1] || "";
const ENGINES = [["chromium", chromium], ["webkit", webkit]].filter(([n]) => !motorArg || n === motorArg);
if (motorArg && !ENGINES.length) throw new Error(`Bilinmeyen motor: ${motorArg}. Seçenekler: chromium, webkit`);
// Her motor bitince o motorun sonucu hemen yazılır. Böylece bir motor takılırsa öteki motorun sonucu kaybolmaz.
function report(engine) {
  const mine = results.filter((r) => r.engine === engine);
  for (const r of mine.filter((x) => !x.ok)) console.log(`FAIL ${r.engine} ${r.size} ${r.name}${r.detail ? ": " + r.detail : ""}`);
  for (const n of notRun.filter((x) => x.startsWith(engine))) console.log(`NOT_RUN ${n}`);
  console.log(`[${engine}] bitti ${new Date().toISOString()}: ${mine.filter((r) => r.ok).length} pass, ${mine.filter((r) => !r.ok).length} fail, ${loadIssues.filter((x) => x.startsWith(engine)).length} yükleme sorunu`);
}

async function all() {
  for (const [engine, type] of ENGINES) {
    console.log(`[${engine}] başladı ${new Date().toISOString()}`);
    // Tarayıcı ve ilk sekme sınırlı süre beklenir. Açılamazsa bu motor YÜKLEME olarak NOT_RUN yazılır ve koşu takılmaz.
    let browser;
    let page;
    try {
      browser = await bounded(type.launch(), 30000, "tarayıcı açma");
      page = await bounded(browser.newPage(), 30000, "ilk sekme açma");
    } catch (e) {
      loadIssues.push(`${engine} başlangıç`);
      notRun.push(`${engine}: YÜKLEME ${String(e.message || e).split("\n")[0]}`);
      if (browser) await bounded(browser.close(), 15000, "tarayıcı kapatma").catch(() => {});
      report(engine);
      continue;
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    if (onlyBolge) {
      await newChecks(browser, page, engine);
      await guarded(engine, "390x844 betiksiz", "betiksiz", () => noScript(browser, engine));
      check(engine, "tümü", "konsol hatası yok", errors.length === 0, errors.slice(0, 3).join(" | "));
      await bounded(browser.close(), 15000, "tarayıcı kapatma").catch((e) => notRun.push(`${engine}: YÜKLEME ${e.message}`));
      report(engine);
      continue;
    }
    for (const [w, h] of sizes) await layout(page, engine, w, h);
    // Davranış en dar ekranda da sınanır: 320 px önce gelir.
    await behavior(page, engine, 320, 568);
    await behavior(page, engine, 390, 844);
    await behavior(page, engine, 1440, 900);
    await planned(page, engine, 320, 568);
    await planned(page, engine, 1440, 900);
    await newChecks(browser, page, engine);
    // Yatay telefon: sabit çubuklar. En küçük yatay ekran da sınanır.
    await landscape(page, engine, 844, 390);
    await landscape(page, engine, 568, 320);
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
    // Hareket azaltmada yüzeyler çizilmiş haliyle durur, geçiş yoktur.
    const rs = await reduced.evaluate(() => {
      const path = document.querySelector("[data-surface] path");
      return {
        on: [...document.querySelectorAll("[data-motion-scene]")].every((e) => e.dataset.motionReady !== "true"),
        offset: getComputedStyle(path).strokeDashoffset, dur: getComputedStyle(path).transitionDuration,
      };
    });
    check(engine, "390x844", "hareket azaltmada yüzeyler durağan ve çizili", rs.on && rs.offset === "0px" && /^0s/.test(rs.dur), JSON.stringify(rs));
    await noScript(browser, engine);
    // Büyütülmüş yazı ve zorlanmış renkler yalnız Chromium'da öykünülür.
    if (engine === "chromium") {
      await forcedColors(browser, engine);
      for (const [px, w, h] of [[20, 320, 568], [24, 320, 568], [20, 390, 844], [24, 390, 844]]) await textScale(engine, px, w, h);
    } else {
      notRun.push(`${engine}: bu motor kök yazı boyutu ayarını ve zorlanmış renkleri öykünmez, bu iki denetim yalnız Chromium'da çalıştı`);
    }
    check(engine, "tümü", "konsol hatası yok", errors.length === 0, errors.slice(0, 3).join(" | "));
    await browser.close();
    report(engine);
  }
  // Özet: her motorun satırları motor bitince yazıldı. Burada yalnız sayılar tekrarlanır.
  const failed = results.filter((r) => !r.ok);
  for (const [engine] of ENGINES) {
    const mine = results.filter((r) => r.engine === engine);
    console.log(`${engine}: ${mine.filter((r) => r.ok).length} pass, ${mine.filter((r) => !r.ok).length} fail`);
  }
  if (loadIssues.length) console.log(`NOT_RUN yükleme sorunu: ${loadIssues.join(", ")}`);
  return failed.length || loadIssues.length ? 1 : 0;
}

// Sınama kipi: testin kendisi sınanır. Her bozulma, sunucudan gelen kaynağa yolda uygulanır (dosyalar değişmez).
// Beklenen: adı yazılan denetim FAIL verir. Vermezse test o bozulmayı kaçırıyordur.
// koşu: hangi test bölümünün çalışacağı. Aynı koşudaki bozulmalar birlikte uygulanır.
const swap = (from, to) => (text) => text.replace(from, to);
const add = (css) => (text) => text + "\n" + css;
const BREAKS = [
  // Bölgesel tedarik ve yönlü yüzeyler (11 Kasım 2026). En değerli üç bozulma.
  { name: "teklif bağlantısı yazılan ürünü eziyor", file: "app.js", run: "bolge:1440x900", expect: "teklif bağlantısı yazılan ürünü silmez",
    apply: swap("        if (!product.value.trim()) {\n          product.value = a.dataset.urun;", "        if (true) {\n          product.value = a.dataset.urun;") },
  { name: "hareket azaltmada hareket paketi yükleniyor", file: "index.html", run: "motion:390x844", expect: "hareket azaltmada paket indirilmez ve sahne durağandır",
    apply: swap('<script type="module" src="hareket/baslat.js"></script>', '<script type="module">import("./hareket/sahne.js").then((m) => m.start());</script>') },
  { name: "bölgede satıcı uyarısı kayboldu", file: "index.html", run: "bolge:320x568", expect: "bölüm satıcı bulunduğu anlamına gelmediğini söyler",
    apply: swap("Bu merkezlerdeki satıcıların iStoc'ta bulunduğu anlamına gelmez.", "") },
  // Beşinci incelemenin bulguları. Her bozulma, düzeltilen bir kusuru geri getirir.
  { name: "seçenek adı seçim işaretinin altına giriyor", file: "styles.css", run: "layout:320x568", expect: "seçenek adı seçim işaretine değmez",
    apply: add(".pref { grid-template-columns: auto minmax(0, 1fr) auto; column-gap: 12px; } .pref__mark { grid-column: 1; } .pref__t { grid-column: 2; grid-row: 1; } .pref__on { grid-column: 3; }") },
  { name: "kapalı grubun içinde küçük yazı", file: "styles.css", run: "layout:320x568", expect: "açılan gruplarda en küçük metin 14 px",
    apply: add(".dlink__k { font-size: 12px; }") },
  { name: "bölüm adı başlıkta okunmuyor", file: "index.html", run: "layout:1440x900", expect: "bölüm başlığı bölümün adını da okutur",
    apply: swap('<span class="sr-only">Ürünler: </span>', "") },
  { name: "ışığın altında metin soluk kalıyor", file: "styles.css", run: "layout:1024x768", expect: "metin karşıtlığı yeterli",
    apply: swap("background: radial-gradient(closest-side, rgba(79, 136, 207, 0.24), rgba(79, 136, 207, 0));\n  transform", "background: radial-gradient(closest-side, rgba(79, 136, 207, 0.5), rgba(79, 136, 207, 0));\n  transform") },
  { name: "para birimi değişince sipariş toplamı eski kalıyor", file: "app.js", run: "behavior:390x844", expect: "para birimi değişince sepet ve sipariş toplamı yeniden hesaplanır",
    apply: swap("          order.repaint(true);\n", "") },
  { name: "toplam her para biriminde dolar tutarından hesaplanıyor", file: "app.js", run: "behavior:1440x900", expect: "para birimi değişince sepet ve sipariş toplamı yeniden hesaplanır",
    apply: swap('parseFloat(el.dataset["unit" + para.code.charAt(0) + para.code.slice(1).toLowerCase()])', "parseFloat(el.dataset.unitUsd)") },
  { name: "toplam yuvarlanmış birim fiyattan hesaplanıyor", file: "index.html", run: "behavior:320x568", expect: "en az sipariş tutarı sepetin toplamıyla aynı hesaplanır",
    apply: (t) => t.replace(/data-unit-(gbp|usd|eur)="(\d+\.\d\d)\d+"/g, 'data-unit-$1="$2"') },
  { name: "tıklanmayan öğe üzerine gelince değişiyor", file: "styles.css", run: "behavior:1440x900", expect: "tıklanmayan öğe üzerine gelince değişmez",
    apply: add(".ptile:hover { background-color: var(--ink-fill-hover); }") },
  { name: "ekran dönünce odak kayboluyor", file: "app.js", run: "behavior:320x568", expect: "açılan grup ekran dönünce açık kalır, odak kaybolmaz",
    apply: swap("if (active === g.btn && !button) {", "if (active === null) {") },
  { name: "açılan grup ekran dönünce kapanıyor", file: "app.js", run: "behavior:390x844", expect: "açılan grup ekran dönünce açık kalır, odak kaybolmaz",
    // Ekran dönünce her grup kapanır. Odağı taşıyan grubu yeniden açan dal da kaldırılır.
    apply: swap('} else if (button && g.el.dataset.open !== "true" && g.panel.contains(active)) set(g, true);', "} else set(g, false);") },
  { name: "betik yokken seçenek kutuları görünüyor", file: "styles.css", run: "noscript", expect: "JavaScript kapalıyken çalışmayan seçenek ve doğru olmayan cümle görünmez",
    apply: swap("html:not(.js) .js-only, html.js .nojs-only { display: none; }", "html.js .nojs-only { display: none; }") },
  { name: "odakta simge kendi kutusunun üstünde okunmuyor", file: "styles.css", run: "focus:390x844", expect: "odaktaki öğenin metni ve simgesi okunur",
    apply: add('html[data-kb="on"] :is(a, button):focus-visible i { color: inherit; }') },
  { name: "yatay telefonda sepet çubuğu yüksek", file: "styles.css", run: "landscape:844x390", expect: "yatay telefonda sepet çubuğu ekranın dörtte birinden az yer kaplar",
    apply: swap("@media (max-height: 480px) and (max-width: 1023px) {\n  .bottomnav a { flex-direction: row;", "@media not all {\n  .bottomnav a { flex-direction: row;") },
  { name: "büyütülen yazıda başlık taşıyor", file: "styles.css", run: "scale:24:320x568", expect: "büyütülen yazıda metin kutusuna ve ekrana sığar",
    apply: swap("--t-display: min(clamp(2.375rem, 1.2rem + 5.4vw, 5rem), 12vw);", "--t-display: clamp(2.375rem, 1.2rem + 5.4vw, 5rem);") },
  { name: "zorlanmış renklerde seçili durum kayboluyor", file: "styles.css", run: "forced", expect: "zorlanmış renklerde seçili durum ayırt edilir",
    apply: swap('  .filter[aria-pressed="true"], .seg button[aria-selected="true"], .pref[aria-checked="true"], .mega__cat[aria-expanded="true"] { background-color: Highlight; color: HighlightText; }\n', "") },
  // Beşinci sürümün kuralları
  { name: "komşu iki bant aynı yüzeyde", file: "styles.css", run: "layout:1440x900", expect: "komşu bantlar farklı yüzeyde",
    apply: add(".band--tint { background-color: var(--surface); }") },
  { name: "kart bandıyla aynı yüzeyde", file: "styles.css", run: "layout:1440x900", expect: "kart yüzeyi bandından ayrılır",
    apply: add(".dir__item, .sc { background: var(--sunken); }") },
  { name: "bölüm numarası atlanmış", file: "index.html", run: "layout:1440x900", expect: "bölüm başlıkları sırayla numaralı",
    apply: swap('<b class="mh__no">03</b>', '<b class="mh__no">04</b>') },
  { name: "odaklanan dizin bağlantısında yazı koyu kalıyor", file: "styles.css", run: "focus:1440x900", expect: "odaktaki öğenin metni ve simgesi okunur",
    apply: (t) => t.split(":is(small, b, svg, h3, .dlink__t, .dlink__n)").join(":is(small, b, svg, h3)") },
  { name: "yazı tipi Ubuntu değil", file: "styles.css", run: "layout:390x844", expect: "font Ubuntu",
    apply: swap('--font: "Ubuntu",', '--font: "Georgia",') },
  { name: "Ubuntu ailesinde olmayan ara kalınlık", file: "styles.css", run: "layout:390x844", expect: "yazı kalınlığı Ubuntu ailesinde",
    apply: add(".btn { font-weight: 600; }") },
  { name: "para birimi seçimi fiyatları değiştirmiyor", file: "app.js", run: "behavior:390x844", expect: "para birimi seçimi fiyatları değiştirir",
    apply: swap("          paintPrices();\n          cart.repaint(true);", "          cart.repaint(true);") },
  { name: "radyo grubunda ok tuşu çalışmıyor", file: "app.js", run: "behavior:1440x900", expect: "para birimi klavyeyle seçilir",
    apply: swap("          select(radios[(i + step + radios.length) % radios.length], true);", "") },
  { name: "dizin grubu dar ekranda açılmıyor", file: "app.js", run: "behavior:320x568", expect: "dizin grubu dar ekranda açılır, durum anında güncellenir",
    apply: swap('g.btn.addEventListener("click", function () { set(g, g.el.dataset.open !== "true"); });', "") },
  { name: "menüdeki teklif bağlantısı menüyü kapatmıyor", file: "app.js", run: "behavior:320x568", expect: "menüdeki teklif bağlantısı menüyü kapatır",
    apply: swap('$$("[data-mega-kapat]", panel).forEach(function (a) { a.addEventListener("click", function () { set(false, false); }); });', "") },
  { name: "konum çubuğu ilerlemiyor", file: "app.js", run: "behavior:390x844", expect: "konum çubuğu kaydırmayla ilerler",
    apply: swap('if (bar) bar.style.setProperty("--p",', 'if (!bar) bar.style.setProperty("--p",') },
  { name: "ışık işaretçiyi izlemiyor", file: "app.js", run: "behavior:1440x900", expect: "ışık işaretçiyi izler",
    apply: swap('spot.style.setProperty("--dx", Math.round(x - restX) + "px");', "") },
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
    apply: swap('html[data-kb="on"] :is(a, button, [role="option"], [role="tab"]):focus-visible :is(.picto, .pref__mark),', 'html[data-kb="on"] :focus-visible :is(.picto, .pref__mark),') },
  { name: "fare üzerindeyken odak dolgusu eziliyor", file: "styles.css", run: "behavior:1440x900", expect: "fare üzerindeyken de odak dolgusu görünür",
    apply: swap('html[data-kb="on"]:root :is(a, button, [role="option"], [role="tab"]):focus-visible,', 'html[data-kb="on"] :is(a, button, [role="option"], [role="tab"]):focus-visible,') },
  { name: "sepet çubuğu dar ekranda yükseliyor", file: "styles.css", run: "behavior:320x568", expect: "sepet çubuğu ekranın dörtte birinden az yer kaplar",
    apply: swap(".cartbar__note { flex: 1 0 100%; }", ".cartbar__note { flex: 0 1 72px; }") },
  { name: "seçili para birimi kutusunda odak görünmüyor", file: "styles.css", run: "behavior:320x568", expect: "seçili para birimi kutusu klavye odağını gösterir",
    apply: swap('.on-ink .btn--light, .pref[aria-checked="true"] { --focus-bg', '.on-ink .btn--light { --focus-bg') },
  { name: "JavaScript yokken odak göstergesi yok", file: "styles.css", run: "noscript", expect: "JavaScript kapalıyken klavye odağı görünür",
    apply: swap('html:not(.js):root :is(a, button, [role="option"], [role="tab"]):focus-visible {', 'html.yok:root :is(a, button, [role="option"], [role="tab"]):focus-visible {') },
  { name: "işaretçiyle odaklanan şerit bağlantısı yerinden oynuyor", file: "app.js", run: "behavior:320x568", expect: "şeritteki bağlantıya dokunmak onu açar",
    apply: swap('if (root.dataset.kb !== "on") return;', "") },
  { name: "şeritte odaklanan bağlantı okun altında kalıyor", file: "app.js", run: "focus:320x568", expect: "odaklanan öğe başka bir katmanın altında kalmaz",
    apply: swap("if (past > 0) r.el.scrollLeft += past;", "if (past > 9999) r.el.scrollLeft += past;") },
  // Yalnız Safari ailesinde görülen bozulma. WebKit'te denenir.
  { name: "Safari'de üst arama düğmesinin tıklaması yutuluyor", file: "app.js", run: "behavior:390x844", engine: "webkit", expect: "üst arama düğmesinin tıklaması yutulmaz",
    apply: swap("var on = past || pressing || slot.contains(document.activeElement);", "var on = past || slot.contains(document.activeElement);") },
  { name: "sepet örnek olduğunu söylemiyor", file: "index.html", run: "behavior:1440x900", expect: "sepet örnek olduğunu söyler",
    apply: swap('<small class="cartbar__note">Bu sepet bir örnektir. Ürünler istoc.com sepetine eklenmez.</small>', "") },
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

// Altıncı sürümün bozulmaları: yeni davranışların testi bunları yakalamalıdır.
BREAKS.push(
  { name: "teklif özeti adetle güncellenmiyor", file: "app.js", run: "planned:390x844", expect: "teklif özeti ürün ve adet yazılınca anında güncellenir",
    apply: swap('qty.addEventListener("input", summary);', "") },
  { name: "araç ayrıntısı açılmıyor", file: "app.js", run: "planned:390x844", expect: "araç ayrıntısı tıklama anında açılır",
    apply: swap('$$(".faq, .tool, .libq")', '$$(".faq, .libq")') },
  { name: "yüzey tıklamayı tutuyor", file: "styles.css", run: "planned:390x844", expect: "yüzeyler gizli ve tıklanmaz",
    apply: add(".surface { pointer-events: auto; }") },
);

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
  // --motor verilirse sınama da yalnız o motorda çalışır. Öteki motorun bozulmaları bu koşuda denenmez.
  const chosen = BREAKS.filter((b) => b.name.includes(selfOnly) && (!motorArg || (b.engine || "chromium") === motorArg));
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
      const [kind, dims, extra] = run.split(":");
      if (kind === "touch") await touch(browser, engine, prepare);
      else if (kind === "motion") await motion(browser, engine, ...dims.split("x").map(Number), prepare);
      else if (kind === "noscript") await noScript(browser, engine, prepare);
      else if (kind === "forced") await forcedColors(browser, engine, prepare);
      else if (kind === "scale") await textScale(engine, Number(dims), ...extra.split("x").map(Number), prepare);
      else {
        const ctx = await browser.newContext();
        await prepare(ctx);
        const page = await ctx.newPage();
        const [w, h] = dims.split("x").map(Number);
        if (kind === "layout") await layout(page, engine, w, h);
        else if (kind === "landscape") await landscape(page, engine, w, h);
        else if (kind === "focus") await focusTour(page, engine, w, h);
        else if (kind === "planned") await planned(page, engine, w, h);
        else if (kind === "bolge") await bolge(page, engine, w, h);
        else if (kind === "alici") await alici(page, engine, w, h);
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
