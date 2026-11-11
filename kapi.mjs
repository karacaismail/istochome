// Kural kapısı.
//   node kapi.mjs            styles.css, app.js ve index.html denetlenir. Önizleme derlemesi beklenir.
//   node kapi.mjs --yayin    aynı denetim. Yayın derlemesi beklenir (robots: index,follow).
//   node kapi.mjs --sinama   kapı kendini sınar. Bilinen her ihlal örneği reddedilmelidir.
// Bu bir kaynak denetimidir. Tarayıcıdaki davranışı kanıtlamaz. Onu tarayici-testi.mjs sınar.
// Kapının göremediği durumlar: sözde öğeyle ya da geçişli zeminle çizilen vurgu çubuğu,
// betiğin çalışırken yazdığı stil ve yalnız ekranda ölçülebilen değerler (boyut, karşıtlık, hedef).
// Metin denetiminin dışında kalan: tek kelimelik metin. Tek kelimelik olgu adlarını build.py ayrıca denetler.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));

const TOKEN_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const KEYWORD_EASE = /\b(ease|ease-in|ease-out|ease-in-out|step-start|step-end)\b|\blinear\b(?!-)/;
const EASE_FN = /(cubic-bezier|steps|linear)\(/;
const LITERAL_TIME = /(^|[\s,(])\d*\.?\d+m?s\b/;
const MOTION_VAR = /^--(ease|dur-\d+|stagger|i)$/;
// Durum seçicisi: sözde sınıf, durum sınıfı (.is-, .has-) ve değeri olan aria ya da data özniteliği.
const STATE = /:hover|:active|:focus|:checked|:disabled|\[open\]|\.is-[a-z-]+|\.has-[a-z-]+|\[aria-[a-z]+="[^"]*"\]|\[data-[a-z-]+="[^"]*"\]/;
// Üzerine gelince ya da basınca kutunun yerini ve boyutunu değiştiren özellikler.
const MOVE_PROP = /^(transform|translate|scale|rotate|margin(-[a-z-]+)?|top|right|bottom|left|inset(-[a-z-]+)?|width|height|(min|max)-(width|height)|padding(-[a-z-]+)?)$/;
// Yalnız kutunun içindeki simge ya da görsel oynayabilir.
const MOVE_OK = /(\ssvg|\simg|\.btn__go|\.chev|\si)$/;
const SIDE_BORDER = /^border-(top|right|bottom|left|inline|block)(-start|-end)?(-color|-width|-style)?$/;
// Marka turuncusu yalnız bu seçicilerde kullanılabilir: ana eylem düğmesi, arama düğmesi,
// sayaç, başlık vurgusu ve mobil alt gezinmedeki teklif eylemi.
const BRAND_OK = /^(:root|\.btn--brand(:hover|:active)?|\.search button(:hover)?|\.count|\.hl|\.bottomnav__main i)$/;
// Gölge yalnız merkezi tokenla ya da nötr ayırıcı çizgi olarak yazılır.
const SHADOW_OK = /^(none|var\(--shadow-\d\)|0 -?1px 0 var\(--line(-ink)?\))$/;
// Kenarlık yalnız işlev içindir: form alanı sınırı, hata durumu ve nötr ayırıcı çizgi.
const BORDER_OK = /^(0|none|transparent|(\d*\.?\d+px )?(solid )?var\(--(field-line|line|line-ink|err)\))$/;
// Tasarım tokenları yalnız :root içinde tanımlanır. Bileşen düzeyinde yalnız bu yerel değişkenler yazılabilir.
const LOCAL_VAR = /^--(bleed|fade|dock|i|x|w|p|size|pos|focus-bg|focus-fg)$/;
// Küçülten ölçek yalnız simge, görsel ve süs çubuğunda kullanılır. Metni küçültmek için kullanılamaz.
const SCALE_OK = /(\ssvg|\simg|\.i-(on|off)|__fill|__bar)$/;
// Ubuntu ailesinin kalınlıkları
const WEIGHTS = ["300", "400", "500", "700"];
const NAMED_ORANGE = /\b(orange|darkorange|orangered|coral|tomato|gold|goldenrod|darkgoldenrod|chocolate|sandybrown|peru|sienna|salmon|lightsalmon|darksalmon)\b/i;

// Virgülle ayrılmış değeri üst düzey parçalara böler. Parantez içindeki virgül ayırmaz.
function splitTop(value) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Renk tonu turuncu ailesinde mi? Ham kod birebir aynı olmasa da yakalanır.
function orangeHsl(h, s, l) { return h >= 10 && h <= 55 && s >= 0.45 && l >= 0.25 && l <= 0.85; }
function orangeRgb(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  if (d === 0) return false;
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = (((max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4) * 60) + 360) % 360;
  return orangeHsl(h, s, l);
}
function hasOrange(text) {
  for (const m of text.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if ((h.length === 6 || h.length === 8) && orangeRgb(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16))) return true;
  }
  for (const m of text.matchAll(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/gi)) if (orangeRgb(+m[1], +m[2], +m[3])) return true;
  for (const m of text.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) if (orangeHsl(+m[1] % 360, +m[2] / 100, +m[3] / 100)) return true;
  return false;
}

// CSS'i yaprak kurallara ayırır. Her kural, içinde bulunduğu @ bloklarını taşır.
// İç içe yazılmış kural denetlenemez, bu yüzden reddedilir.
function checkCss(source) {
  const fails = [];
  const fail = (rule, where, detail) => fails.push({ rule, where, detail });
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  if (/@import\b/.test(css)) fail("yapı", "styles.css", "@import yasak, stil tek dosyada durur");
  const rules = [];
  const stack = [];
  let buf = "";
  for (const ch of css) {
    if (ch === "{") {
      const parent = stack[stack.length - 1];
      if (parent !== undefined && !parent.startsWith("@")) fail("yapı", parent, "iç içe kural denetlenemez");
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      const selector = stack.pop();
      if (buf.trim() && !/^@(media|supports)/.test(selector)) {
        rules.push({ selector, context: stack.filter((s) => s.startsWith("@")).join(" "), body: buf.trim() });
      }
      buf = "";
    } else buf += ch;
  }
  const decls = (body) =>
    body
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const i = d.indexOf(":");
        // Tarayıcı öneki atılır. Böylece -webkit-transition gibi yazımlar da aynı kurallara girer.
        return [d.slice(0, i).trim().replace(/^-(webkit|moz|ms|o)-/, ""), d.slice(i + 1).trim()];
      });
  let focusIndicator = false;
  let headerSearch = false;

  for (const r of rules) {
    // Hareket azaltma tercihinde ve kâğıtta hareket yoktur. Bu iki bağlamda "none" serbesttir.
    const still = /prefers-reduced-motion:\s*reduce/.test(r.context) || /@media\s+print\b/.test(r.context);
    const forced = /forced-colors:\s*active/.test(r.context);
    const keyframe = r.context.includes("@keyframes");
    const focusSel = /:focus/.test(r.selector);
    const selectors = splitTop(r.selector);
    // Açık istisna: merkezi klavye odak göstergesi geçişsiz, anında görünür.
    const focusInstant = r.selector.includes('html[data-kb="on"]') && r.selector.includes(":focus-visible");
    const d = decls(r.body).filter(([p, v]) => !(focusInstant && p === "transition" && v === "none"));
    const has = (p) => d.some(([k]) => k === p);
    const get = (p) => (d.find(([k]) => k === p) || [])[1];

    // 0. Temel deneyim: içeriğin görünmesi yeni seçicilere bağlanmaz. Durumu öznitelik taşır.
    if (r.selector.includes(":has(")) fail("temel", r.selector, ":has() kullanılmaz, durum öznitelikle taşınır");

    for (const [prop, value] of d) {
      // 1. Hareket: yalnız merkezi eğri ve süre tokenları
      if (!still) {
        if (prop === "transition" || prop === "animation") {
          if (prop === "transition" && /\ball\b/.test(value)) fail("hareket", r.selector, "transition: all yasak");
          if (KEYWORD_EASE.test(value.replace(/var\(--ease\)/g, ""))) fail("hareket", r.selector, `onaysız eğri: ${value}`);
          if (EASE_FN.test(value)) fail("hareket", r.selector, `token dışı eğri: ${value}`);
          if (LITERAL_TIME.test(value)) fail("hareket", r.selector, `token dışı süre: ${value}`);
          if (/\bnone\b/.test(value)) fail("hareket", r.selector, "normal durumda none yasak");
          // Her parça kendi eğri tokenını taşır. Tek bir parçadaki token diğerlerini örtmez.
          for (const seg of splitTop(value)) if (!seg.includes("var(--ease)")) fail("hareket", r.selector, `eğri tokenı yok: ${seg}`);
        }
        if (/^(transition|animation)(-timing-function|-duration|-delay)?$/.test(prop)) {
          for (const m of value.matchAll(/var\((--[a-z0-9-]+)/g)) if (!MOTION_VAR.test(m[1])) fail("hareket", r.selector, `hareket tokenı olmayan değişken: ${m[1]}`);
        }
        if (/^(transition|animation)-timing-function$/.test(prop) && value !== "var(--ease)") fail("hareket", r.selector, `${prop}: ${value}`);
        if (/^(transition|animation)-(duration|delay)$/.test(prop) && LITERAL_TIME.test(value)) fail("hareket", r.selector, `token dışı süre: ${prop}: ${value}`);
        if (prop === "transition-property" && /\b(all|none)\b/.test(value)) fail("hareket", r.selector, `transition-property: ${value} yasak`);
      }
      if (prop === "--ease" && value !== TOKEN_EASE) fail("hareket", r.selector, `eğri tokenı değişmiş: ${value}`);
      if (/^--dur-/.test(prop) && !(parseFloat(value) > 0)) fail("hareket", r.selector, `süre pozitif değil: ${value}`);
      // Eğri ve süre başka bir değişkene saklanarak kapıdan geçirilemez.
      if (prop.startsWith("--") && prop !== "--ease" && (EASE_FN.test(value) || KEYWORD_EASE.test(value))) fail("hareket", r.selector, `eğri yalnız --ease tokenında tanımlanır: ${prop}`);
      if (prop.startsWith("--") && !/^--(dur-\d+|stagger|dwell)$/.test(prop) && LITERAL_TIME.test(value)) fail("hareket", r.selector, `süre yalnız --dur, --stagger ve --dwell tokenlarında tanımlanır: ${prop}`);
      // Üzerine gelince ya da basınca kutu yerinden oynamaz. Yalnız içindeki simge ya da görsel oynayabilir.
      if (MOVE_PROP.test(prop)) for (const sel of selectors) if (/:hover|:active/.test(sel) && !MOVE_OK.test(sel)) fail("hareket", sel, `üzerine gelince ya da basınca kutu oynamaz: ${prop}`);

      // 2. Tasarım tokenları yalnız :root içinde tanımlanır.
      if (prop.startsWith("--") && r.selector !== ":root" && !LOCAL_VAR.test(prop)) fail("token", r.selector, `token yalnız :root içinde tanımlanır: ${prop}`);

      // 3. Odak: çevreleyen halka yok. Tek istisna forced-colors.
      if (prop.startsWith("outline") && !/^(none|0)$/.test(value) && !forced) fail("odak", r.selector, `outline yasak: ${value}`);
      if (focusSel && !forced) {
        if (prop === "box-shadow") fail("odak", r.selector, "odakta box-shadow yasak");
        if (/^border(?!-radius)/.test(prop)) fail("odak", r.selector, `odakta kenarlık değişimi yasak: ${prop}`);
        if (prop === "inset" && /::(before|after)/.test(r.selector)) fail("odak", r.selector, "odakta çevreleyen sözde öğe yasak");
        // Kenarlığı ya da gölgeyi besleyen değişken odakta değiştirilerek halka çizilemez.
        if (prop.startsWith("--")) fail("odak", r.selector, `odakta değişken değişimi yasak: ${prop}`);
        if (prop === "filter") fail("odak", r.selector, "odakta filter yasak");
      }

      // 4. Metin: en küçük boyut 14 CSS px, font Ubuntu. Ubuntu ailesinde dört kalınlık vardır: 300, 400, 500 ve 700.
      //    Ara bir değer (örneğin 600) yazılırsa tarayıcı onu sessizce 700'e yuvarlar. Bu yüzden ara değer reddedilir.
      if (prop === "font" && value !== "inherit") fail("metin", r.selector, `font kısaltması denetlenemez: ${value}`);
      if (prop === "font-family" && !/^(var\(--font\)|inherit|ui-monospace, "SF Mono", Menlo, monospace)$/.test(value)) fail("metin", r.selector, `font-family tokenı kullanılmalı: ${value}`);
      if (prop === "--font" && !/^"Ubuntu"/.test(value)) fail("metin", r.selector, "font ailesi Ubuntu ile başlamalı");
      if (/^--w-/.test(prop) && !WEIGHTS.includes(value)) fail("metin", r.selector, `kalınlık tokenı Ubuntu ailesinde yok: ${prop}: ${value}`);
      if (prop === "font-size" || /^--t-/.test(prop)) {
        // min(A, Nvw): boyut ekran genişliğiyle de sınırlanır. A tek başına denetlenir.
        // vw parçası 320 CSS px tabanında 14 px altına inemez. Bu yüzden N en az 4,375 olmalıdır.
        let size = value;
        if (value.startsWith("min(") && value.endsWith(")")) {
          const inner = splitTop(value.slice(4, -1));
          const vw = inner.length === 2 ? inner[1].match(/^(\d*\.?\d+)vw$/) : null;
          if (!vw) fail("metin", r.selector, `${prop}: ${value} çözümlenemiyor`);
          else if (parseFloat(vw[1]) * 3.2 < 14) fail("metin", r.selector, `${prop}: ${value} 320 px genişlikte 14 px altında`);
          size = inner[0];
        }
        const first = size.startsWith("clamp(") ? size.slice(6).split(",")[0].trim() : size;
        if (!/^(inherit|var\(--t-[a-z0-9]+\))$/.test(first)) {
          const m = first.match(/^(\d*\.?\d+)(rem|px)$/);
          if (!m) fail("metin", r.selector, `${prop}: ${value} çözümlenemiyor`);
          else if (parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1) < 14) fail("metin", r.selector, `${prop}: ${value} 14 px altında`);
        }
      }
      if (prop === "font-weight" && !/^(inherit|normal|bold|var\(--w-[a-z]+\))$/.test(value) && !WEIGHTS.includes(value)) fail("metin", r.selector, `font-weight: ${value}`);
      // Metin, ölçekle ya da yakınlaştırmayla dolaylı yoldan küçültülemez.
      if (prop === "zoom") fail("metin", r.selector, "zoom yasak");
      if (/text-size-adjust$/.test(prop) && value !== "100%") fail("metin", r.selector, `${prop}: ${value}`);
      if (!keyframe && (prop === "transform" || prop === "scale")) {
        const num = (x) => (/%\s*$/.test(x) ? parseFloat(x) / 100 : parseFloat(x));
        const nums = prop === "scale" ? value.split(/\s+/).map(num) : [...value.matchAll(/scale(?:X|Y|3d)?\(([^)]*)\)/g)].flatMap((m) => m[1].split(",").map(num));
        if (nums.some((n) => n < 1) && !selectors.every((s) => SCALE_OK.test(s))) fail("metin", r.selector, `küçülten ölçek yalnız simgede ve görselde kullanılır: ${value}`);
      }

      // 5. Satır kırma
      if ((prop === "word-break" && value === "break-all") || (prop === "overflow-wrap" && value === "anywhere")) fail("satır", r.selector, `${prop}: ${value} yasak`);

      // 6. Vurgu kenarı: gölge çubuğu ve renkli tek kenar çizgisi yasak.
      //    Tek kenarda yalnız nötr ayırıcı çizgi (--line, --line-ink) kullanılabilir.
      if (prop === "box-shadow" && /\binset\b/.test(value)) fail("kenar", r.selector, "iç gölge çubuğu yasak");
      if (prop === "box-shadow" && !SHADOW_OK.test(value)) fail("kenar", r.selector, `gölge tokenı kullanılmalı: ${value}`);
      if (/^--shadow-/.test(prop) && /\binset\b/.test(value)) fail("kenar", r.selector, "gölge tokenında iç gölge yasak");
      if (prop === "filter" || prop === "backdrop-filter") {
        for (const m of value.matchAll(/drop-shadow\(((?:[^()]|\([^()]*\))*)\)/g)) {
          const lens = m[1].replace(/[a-z-]+\([^()]*\)|#[0-9a-f]+/gi, "").trim().split(/\s+/).filter(Boolean);
          if (lens.length < 3 || !(parseFloat(lens[2]) > 0)) fail("kenar", r.selector, "bulanıksız gölge çubuğu yasak");
        }
      }
      if (SIDE_BORDER.test(prop) && !/^(0|0px|none)$/.test(value) && !/var\(--line(-ink)?\)/.test(value)) fail("kenar", r.selector, `renkli kenar çizgisi: ${prop}: ${value}`);
      if ((prop === "border" || prop === "border-color") && !BORDER_OK.test(value)) fail("kenar", r.selector, `kenarlık yalnız işlev için kullanılır: ${prop}: ${value}`);
      if (/^border-image/.test(prop)) fail("kenar", r.selector, `${prop} yasak`);

      // 7. Renk rolü: marka turuncusu yalnız vurguda. Turuncu tonu yalnız marka tokenında tanımlanır.
      if (/var\(--brand(-hover|-press)?\)/.test(value) && !BRAND_OK.test(r.selector)) fail("renk", r.selector, `turuncu izinli yerlerin dışında: ${prop}`);
      if (hasOrange(value) && !(r.selector === ":root" && /^--brand(-hover|-press)?$/.test(prop))) fail("renk", r.selector, `turuncu tonu yalnız marka tokenında tanımlanır: ${prop}`);
      if (!/^(font-family|--font|content|animation(-name)?|view-transition-name|grid-area|grid-template-areas)$/.test(prop) && NAMED_ORANGE.test(value)) fail("renk", r.selector, `adlı turuncu tonu: ${prop}: ${value}`);
      if (/\b(oklch|oklab|lab|lch|hwb|hsla?|color|color-mix)\(/.test(value)) fail("renk", r.selector, `denetlenemeyen renk biçimi: ${prop}`);
      for (const m of value.matchAll(/rgba?\(([^)]*)\)/g)) {
        if (!/^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?$/.test(m[1])) fail("renk", r.selector, `rgb yalnız virgüllü tam sayılarla yazılır: ${prop}`);
      }
      if (/^(background(-color)?|color)$/.test(prop) && /^#(000|000000)$/i.test(value)) fail("renk", r.selector, "saf siyah kullanılmaz");
    }

    // Uzun yazımda eğri unutulursa tarayıcı kendi eğrisini kullanır.
    if (!still) {
      if ((has("transition-duration") || has("transition-property")) && !has("transition") && get("transition-timing-function") !== "var(--ease)") fail("hareket", r.selector, "transition uzun yazımında eğri tokenı yok");
      if ((has("animation-duration") || has("animation-name")) && !has("animation") && get("animation-timing-function") !== "var(--ease)") fail("hareket", r.selector, "animation uzun yazımında eğri tokenı yok");
      // Geçiş yalnız etkin durumda tanımlanamaz. Temel kuralda durmalıdır ki geri dönüş de yumuşak olsun.
      if (!keyframe && STATE.test(r.selector) && d.some(([p]) => /^transition/.test(p))) fail("hareket", r.selector, "geçiş yalnız etkin durumda tanımlı");
    }
    // Yuvarlak köşeli kuralda tek kenar çizgisi
    const radius = get("border-radius");
    const side = d.find(([p, v]) => SIDE_BORDER.test(p) && !/^(0|0px|none)$/.test(v));
    if (radius && !/^0(px)?$/.test(radius) && side) fail("kenar", r.selector, `yuvarlak köşede kenar çizgisi: ${side[0]}`);
    // Merkezi klavye odak göstergesi var mı?
    if (focusInstant && get("background-color") === "var(--focus-bg)" && get("color") === "var(--focus-fg)" && has("text-decoration")) focusIndicator = true;
    if (r.selector === ".header .search button" && get("background") === "var(--ink)") headerSearch = true;
  }
  if (!focusIndicator) fail("odak", "styles.css", "merkezi klavye odak göstergesi bulunamadı ya da odak dolgusu tokenını kullanmıyor");
  // Üst bölümde iki turuncu düğme yan yana durmaz. Üst arama düğmesi güven rengindedir.
  if (!headerSearch) fail("renk", "styles.css", "üst arama düğmesi lacivert olmalı (.header .search button)");
  return { fails, count: rules.length };
}

// Sayfada görünen, en az iki kelimeli bütün metinler. metin.py içindeki çıkarımın aynısıdır.
// data-veri ile işaretli adlar ve yalnız ekran okuyucuya okunan yinelemeler (sr-only) sayılmaz.
const squeeze = (t) => t.replace(/\s+/g, " ").trim();
const normText = (t) => squeeze(t).replace(/\d[\d.,]*/g, "#");
const plainText = (t) => t.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
// Görünmeyen metinler: sayfa başlığı, öznitelik metinleri ve yalnız ekran okuyucuya okunan metinler (sr-only).
// metin.py içindeki çıkarımın aynısıdır. Karşılaştırmada tutar ve sayı # olur.
const normHidden = (t) => squeeze(t).replace(/[£$€₺]?\d[\d.,]*/g, "#");
function hiddenTexts(doc) {
  const out = [];
  const title = doc.match(/<title>([^<]*)<\/title>/);
  if (title) out.push(title[1]);
  const body = doc.slice(doc.indexOf("<body")).replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style)\b[\s\S]*?<\/\1>/g, " ");
  for (const m of body.matchAll(/\b(aria-label|placeholder|alt|title)="([^"]*)"/g)) out.push(m[2]);
  for (const m of body.matchAll(/<([a-z0-9]+)\b[^>]*\bclass="[^"]*\bsr-only\b[^"]*"[^>]*>([^<]*)<\/\1>/g)) out.push(m[2]);
  return [...new Set(out.map((t) => squeeze(plainText(t))).filter((t) => t.split(/\s+/).length >= 2))];
}
// Sayfa metinleri ve planlanan bölgeler. Planlanan bölge data-plan özniteliği taşır.
// Her metin, planlanan bir bölgenin içinde olup olmadığını bilir. Her bölge görünür etiketini (plan-tag) taşımalıdır.
const PLAN_TAGS = ["Planlanan hizmet", "Planlanan içerik"];
function walkTexts(doc) {
  const texts = [];
  const regions = [];
  const VOID = new Set(["img", "input", "br", "meta", "link", "hr"]);
  const split = (t) => t.split(/(?<=[.?!])\s+/).filter((x) => x.split(/\s+/).length >= 2);
  const desc = doc.match(/<meta name="description" content="([^"]*)"/);
  if (desc) for (const t of split(plainText(desc[1]))) texts.push({ t, plan: false });
  const body = doc.slice(doc.indexOf("<body")).replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, " ");
  const stack = [];
  for (const m of body.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g)) {
    const closing = m[1];
    const tag = (m[2] || "").toLowerCase();
    const attrs = m[3] || "";
    if (m[4] !== undefined) {
      const t = squeeze(plainText(m[4]));
      const region = [...stack].reverse().find((s) => s.region);
      if (t && region && stack.some((s) => s.tag) && PLAN_TAGS.includes(t)) region.region.tagged = true;
      if (t && !stack.some((s) => s.skip)) for (const x of split(t)) texts.push({ t: x, plan: !!region });
    } else if (closing) {
      if (!VOID.has(tag) && stack.length) stack.pop();
    } else if (!VOID.has(tag)) {
      const item = { skip: attrs.includes("data-veri") || attrs.includes("sr-only"), tag: /\bclass="[^"]*\bplan-tag\b/.test(attrs), region: null };
      if (/\sdata-plan(\s|=|$)/.test(attrs)) {
        item.region = { id: (attrs.match(/\bid="([^"]+)"/) || [])[1] || "", tagged: false };
        regions.push(item.region);
      }
      stack.push(item);
    }
  }
  return { texts, regions };
}
function pageTexts(doc) {
  return [...new Set(walkTexts(doc).texts.map((x) => x.t))];
}

// Betikteki kullanıcıya görünen metinler: Türkçe harf taşıyan ya da boşluklu, teknik olmayan dizgiler.
function scriptTexts(js) {
  const out = new Set();
  const code = js.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
    const t = (m[1] ?? m[2]).trim();
    if (!t) continue;
    const technical = /^[.#\[(\-]|^use strict$/.test(t);
    const turkish = /[çğıöşüÇĞİÖŞÜ]/.test(t);
    const phrase = /[A-Za-zçğıöşüÇĞİÖŞÜ]{2,} [A-Za-zçğıöşüÇĞİÖŞÜ]{2,}/.test(t);
    if (turkish || (phrase && !technical)) out.add(t);
  }
  return [...out];
}

// JS: süre ve eğri CSS tokenlarından gelir. Odak gizlenmez.
function checkJs(js, scriptCopy) {
  const fails = [];
  const fail = (rule, detail) => fails.push({ rule, where: "app.js", detail });
  if (/['"](linear|ease|ease-in|ease-out|ease-in-out)['"]|cubic-bezier\(|steps\(/.test(js)) fail("hareket", "token dışı eğri");
  if (/\.animate\(/.test(js)) fail("hareket", "betikte animate() kullanımı");
  if (/\.style\.(transition|animation)/.test(js) || /setProperty\(\s*["'](transition|animation)/.test(js)) fail("hareket", "betikte geçiş ya da canlandırma stili");
  // Süre tokenı olduğu gibi kullanılır. Çarpılan ya da bölünen süre artık token değildir.
  if (/dur\([^)]*\)\s*[*\/]/.test(js)) fail("hareket", "süre tokenı üzerinde hesap");
  if (/behavior:\s*['"]smooth['"]/.test(js)) fail("hareket", "tarayıcı eğrisiyle yumuşak kaydırma");
  if (/\boutline\b/.test(js)) fail("odak", "outline kullanımı");
  if (/\.blur\(\)/.test(js)) fail("odak", "blur() ile odak kaldırma");
  if (!/key === "Tab"/.test(js)) fail("odak", "klavye modu Tab ile açılmıyor");
  if (hasOrange(js)) fail("renk", "betikte turuncu tonu");
  // Betikteki her kullanıcı metni kayıtlı olmalıdır (secim.py, BETIK_METNI). Kayıtlı metin de betikte geçmelidir.
  const registered = new Set(scriptCopy || []);
  const found = scriptTexts(js);
  for (const t of found) if (!registered.has(t)) fail("olgu", `kayıtsız betik metni: ${t}`);
  for (const t of registered) if (!found.includes(t)) fail("olgu", `kayıtlı ama betikte geçmeyen metin: ${t}`);
  return fails;
}

// Ana sayfa (index.html)
function checkHtml(html, yayin, ledger, classes, site) {
  const f = "index.html";
  const fails = [];
  const fail = (rule, where, detail) => fails.push({ rule, where, detail });
  const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<[^>]+>|&[a-z#0-9]+;/g, "");
  const count = (re) => (html.match(re) || []).length;
  const pick = (re) => (html.match(re) || [])[1] || "";
  // Arayüz kuralları
  if (/<select\b/.test(html)) fail("açılır menü", f, "native select yasak");
  for (const m of html.matchAll(/style="([^"]*)"/g)) {
    for (const part of m[1].split(";").map((x) => x.trim()).filter(Boolean)) {
      // İzinli satır içi değerler: sıra (--i), geçiş adı ve veriden gelen oran (--p, 0 ile 1 arası).
      if (!/^(--i:\d+|view-transition-name:[a-z0-9-]+|--p:(0|1|[01]?\.\d+))$/.test(part)) fail("satır içi stil", f, part);
    }
  }
  if (/<style\b/.test(html)) fail("satır içi stil", f, "sayfada stil bloğu yasak");
  for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)) {
    const href = (m[0].match(/href="([^"]*)"/) || [])[1] || "";
    if (href !== "styles.css" && !href.startsWith("https://fonts.googleapis.com/css2?family=Ubuntu:")) fail("satır içi stil", f, `ek stil dosyası: ${href}`);
  }
  const BAD_MARK = /[;—–→←↑↓⇒]/;
  if (BAD_MARK.test(strip(html))) fail("yazım", f, "noktalı virgül, çizgi ya da ok işareti");
  // Ekran okuyucunun okuduğu öznitelik metni de aynı yazım kuralına uyar.
  for (const m of html.matchAll(/\b(aria-label|placeholder|alt|title)="([^"]*)"/g)) if (BAD_MARK.test(m[2].replace(/&[a-z#0-9]+;/g, ""))) fail("yazım", f, `${m[1]}: ${m[2].slice(0, 40)}`);
  for (const m of html.matchAll(/<meta (?:name|property)="(description|og:description|og:title)" content="([^"]*)"/g)) if (BAD_MARK.test(m[2].replace(/&[a-z#0-9]+;/g, ""))) fail("yazım", f, `${m[1]}: ${m[2].slice(0, 40)}`);
  if (hasOrange(html.replace(/<script[\s\S]*?<\/script>/g, ""))) fail("renk", f, "sayfada ham turuncu tonu");
  // Gösterge: metin bağlantısının metni span içinde durmalı ki alt çizgi çizilsin.
  // Sınıf, öznitelik sırasından bağımsız aranır.
  for (const m of html.matchAll(/<a\b[^>]*\bclass="(?:[^"]* )?lnk(?: [^"]*)?"[^>]*>(?!<span>)/g)) fail("gösterge", f, `alt çizgisiz bağlantı: ${m[0].slice(0, 60)}`);
  // Ölü bağlantı: hedefi olmayan bağlantı ve form güveni zedeler.
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const href = (m[0].match(/\bhref="([^"]*)"/) || [])[1];
    if (href === undefined || href === "" || href === "#") fail("bağlantı", f, `hedefsiz bağlantı: ${m[0].slice(0, 60)}`);
  }
  if (/<form\b[^>]*\baction="#?"/.test(html)) fail("bağlantı", f, "hedefsiz form");
  // Piktogram her zaman okuyucudan gizlidir, anlamı yanındaki metin taşır.
  for (const m of html.matchAll(/<span class="picto[^"]*"(?! aria-hidden="true")/g)) fail("piktogram", f, "aria-hidden eksik");
  // Güvenli eylem: bağlayıcı adımın düğmesi güvence satırıyla aynı grupta durur.
  for (const m of html.matchAll(/<div class="secure">([\s\S]*?)<\/div>/g)) {
    if (!/class="secure__note"/.test(m[1])) fail("güven", f, "güvence satırı eksik");
  }
  if (!/data-order-add[\s\S]{0,200}secure__note/.test(html)) fail("güven", f, "sepete ekle düğmesinin güvence satırı yok");
  // Modül sınırı: her modülün adı vardır (başlık ya da etiket).
  for (const m of html.matchAll(/<section class="mod[^"]*"([^>]*)>/g)) {
    if (!/aria-labelledby="|aria-label="/.test(m[1])) fail("modül", f, "adsız modül");
  }
  // Menü öğeleri: kategori menüsü gerçek bağlantılardan oluşur.
  if (count(/class="mega__cat"/g) < 8) fail("menü", f, `üst kategori sayısı ${count(/class="mega__cat"/g)}`);
  if (count(/<a (class="[^"]*" )?href="https:\/\/istoc\.com\/kategori\//g) < 60) fail("menü", f, "kategori bağlantısı az");
  // Dizin: programatik arama motoru stratejileri. Her grup bir başlık ve en az üç bağlantı taşır.
  // Sayısı olan bağlantıda sayı yazıyla da durur. Çubuk tek başına bilgi taşımaz.
  const groups = [...html.matchAll(/<div class="dgroup"[\s\S]*?<\/ul><\/div><\/div><\/div>/g)].map((m) => m[0]);
  if (groups.length < 6) fail("dizin", f, `dizin grubu sayısı ${groups.length}`);
  for (const g of groups) {
    const links = (g.match(/class="dlink(?: dlink--n)?"/g) || []).length;
    const title = (g.match(/<span class="fold__name">([^<]+)<\/span>/) || [])[1] || "adsız";
    if (!/<h3 class="fold__h">/.test(g) || title === "adsız") fail("dizin", f, "dizin grubunun başlığı yok");
    if (links < 3) fail("dizin", f, `dizin grubunda bağlantı az: ${title} (${links})`);
    if ((g.match(/dlink__bar/g) || []).length !== (g.match(/dlink__n/g) || []).length) fail("dizin", f, `sayısı yazmayan çubuk: ${title}`);
  }
  if (count(/class="dlink(?: dlink--n)?"/g) < 30) fail("dizin", f, `dizin bağlantısı az: ${count(/class="dlink(?: dlink--n)?"/g)}`);
  // Katlanan grup (dizin grupları ve alt bölüm sütunları): düğmenin durumu grubun durumuyla aynıdır
  // ve düğmenin yönettiği bölüm sayfada vardır. Grup düğmeyle açılır, details öğesi kullanılmaz.
  const folds = [...html.matchAll(/<div class="(?:dgroup|fgroup)" data-fold data-open="(true|false)"[^>]*>[\s\S]*?<button class="fold__btn" type="button" aria-expanded="(true|false)" aria-controls="([a-z0-9-]+)">/g)];
  if (folds.length < 15) fail("katlanan grup", f, `grup sayısı ${folds.length}`);
  for (const m of folds) {
    if (m[1] !== m[2]) fail("katlanan grup", f, `düğmenin durumu grubun durumundan farklı: ${m[3]}`);
    if (!html.includes(`<div class="fold__panel" id="${m[3]}">`)) fail("katlanan grup", f, `düğmenin yönettiği bölüm yok: ${m[3]}`);
  }
  if (/<details\b|<summary\b/.test(html)) fail("katlanan grup", f, "details öğesi kullanılmaz");
  // Alt bölüm: bağlantı sütunları, ödeme yöntemleri ve tercih grupları. Her tercih grubunda tek seçenek seçilidir.
  if (count(/<div class="fgroup"/g) < 8) fail("alt bölüm", f, `bağlantı sütunu az: ${count(/<div class="fgroup"/g)}`);
  if (count(/<li class="ptile"><span class="picto/g) < 4) fail("alt bölüm", f, "ödeme yöntemi piktogramsız ya da az");
  const prefs = [...html.matchAll(/role="radiogroup"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]);
  if (prefs.length !== 2) fail("tercih", f, `tercih grubu sayısı ${prefs.length}`);
  for (const p of prefs) {
    const on = (p.match(/aria-checked="true"/g) || []).length;
    const zero = (p.match(/tabindex="0"/g) || []).length;
    if (on !== 1 || zero !== 1) fail("tercih", f, `grupta seçili seçenek sayısı ${on}, klavye durağı ${zero}`);
  }
  // Bağlantılar. Sayfadaki her adres denetlenir: bağlantı, form hedefi, paylaşım görseli ve yapısal verideki adresler.
  // Kural build.py ile aynıdır. Sunucu adı birebir karşılaştırılır.
  // istoc.com adresi ya açıldığı denetlenmiş bir sayfa ya da görseldir, ya da veride ve site haritasında duran bir kayıttır.
  // istoc.com dışındaki adres yalnız canlı sitede geçen bir sosyal hesap, yazı tipi ya da yapısal veri sözlüğü olabilir.
  if (site) {
    const pages = new Set(Object.entries(site.sayfalar).filter(([, v]) => v.durum === 200).map(([p]) => p.replace(/\/$/, "")));
    const libraries = ["https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://schema.org"];
    const params = { "/urunler": ["q", "sort", "min_order"] };
    const fragments = { "/satici-ol": ["paketler"] };
    const linkOk = (address) => {
      let u;
      try { u = new URL(address); } catch { return false; }
      if (u.protocol !== "https:") return false;
      if (u.host !== "istoc.com") return site.sosyal.has(address) || libraries.some((l) => address === l || address.startsWith(l + "/"));
      const path = decodeURIComponent(u.pathname);
      const bare = path.replace(/\/+$/, "");
      const parts = bare.split("/");
      const query = [...u.searchParams.keys()];
      const frag = u.hash.slice(1);
      if (frag && !(fragments[bare] || []).includes(frag)) return false;
      if (bare.startsWith("/kategori/")) return parts.length === 3 && site.kategori.has(parts[2]) && !query.length;
      if (bare.startsWith("/urun/")) return site.harita.urun.has(bare) && !query.length;
      if (bare.startsWith("/magaza/")) return site.harita.magaza.has(bare) && site.magaza.has(parts[2]) && !query.length;
      if (bare.startsWith("/marka/")) return site.harita.marka.has(bare) && !query.length;
      if (site.gorsel.has(path)) return !query.length;
      return pages.has(bare) && query.every((k) => (params[bare] || []).includes(k));
    };
    const addresses = new Set([...html.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)].map((m) => m[0].replace(/&amp;/g, "&")));
    if (addresses.size < 100) fail("bağlantı", f, `adres çıkarımı beklenenden az: ${addresses.size}`);
    for (const a of addresses) if (!linkOk(a)) fail("bağlantı", f, `denetlenmemiş adres: ${a.slice(0, 70)}`);
  }
  // Arama motoru için ana sayfa yapısı
  const title = pick(/<title>([^<]*)<\/title>/);
  const desc = pick(/<meta name="description" content="([^"]*)"/);
  if (count(/<h1[\s>]/g) !== 1) fail("seo", f, `h1 sayısı ${count(/<h1[\s>]/g)}`);
  if (!title || title.length > 65) fail("seo", f, `başlık uzunluğu ${title.length}`);
  if (desc.length < 50 || desc.length > 160) fail("seo", f, `açıklama uzunluğu ${desc.length}`);
  if (pick(/<link rel="canonical" href="([^"]*)"/) !== "https://istoc.com/") fail("seo", f, "canonical eksik");
  // Önizleme derlemesi bir tasarım önerisidir ve dizine eklenmez. Yayın derlemesi dizine açıktır.
  const robots = pick(/<meta name="robots" content="([^"]*)"/);
  const wanted = yayin ? "index,follow" : "noindex,nofollow";
  if (robots !== wanted) fail("seo", f, `robots "${robots}", beklenen "${wanted}"`);
  if (count(/<html lang="tr">/g) !== 1) fail("seo", f, "lang eksik");
  if (count(/rel="alternate" hreflang="/g) < 2) fail("seo", f, "hreflang eksik");
  for (const tag of ["og:title", "og:description", "og:url", "og:image"]) if (!html.includes(`property="${tag}"`)) fail("seo", f, `${tag} eksik`);
  // Başlık sırası: bir düzey atlanamaz.
  let last = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const level = +m[1];
    if (level > last + 1) fail("seo", f, `başlık düzeyi atlandı: h${last} sonra h${level}`);
    last = level;
  }
  // Yapısal veri geçerli JSON olmalı ve dört türü içermeli.
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const o = JSON.parse(m[1]);
      if (o["@context"] !== "https://schema.org" || !o["@type"]) fail("seo", f, "yapısal veri türü eksik");
      types.push(o["@type"]);
    } catch {
      fail("seo", f, "yapısal veri çözümlenemiyor");
    }
  }
  for (const t of ["Organization", "WebSite", "ItemList", "FAQPage"]) if (!types.includes(t)) fail("seo", f, `yapısal veri yok: ${t}`);
  // Görseller: boyut bildirilmiş olmalı ki sayfa yüklenirken kaymasın.
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/width="\d+"/.test(m[0]) || !/height="\d+"/.test(m[0])) fail("görsel", f, `boyutsuz görsel: ${m[0].slice(0, 60)}`);
  // Olgu: sayıların alındığı gün sayfada yazar.
  if (!/class="stats__src"/.test(html)) fail("olgu", f, "sayıların kaynağı ve günü yazmıyor");
  // Olgu: kanıt defterindeki her cümle kaynağında bulunmuş olmalı ve sayfada birebir geçmelidir.
  const plain = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ledger.alindi || "")) fail("olgu", "data/kaynaklar.json", "kanıtın alındığı gün yok");
  if (!(ledger.iddialar || []).length) fail("olgu", "data/kaynaklar.json", "kaynaklı cümle yok");
  for (const c of ledger.iddialar || []) {
    if (!c.bulundu) fail("olgu", "data/kaynaklar.json", `kaynağında bulunamadı: ${c.metin}`);
    if (!/^https:\/\/istoc\.com\//.test(c.kaynak || "")) fail("olgu", "data/kaynaklar.json", `kaynak adresi yok: ${c.metin}`);
    if (!plain.includes(c.metin)) fail("olgu", f, `kanıt defterindeki cümle sayfada yok: ${c.metin}`);
  }
  // Ters denetim: sayfada görünen, en az iki kelimeli her metnin sınıfı bilinmelidir.
  // Sınıflar: kaynak (birebir, kanıt defterinde), veri (sayılar # ile), tasarım ve etiket (birebir).
  // Kaynak sınıfındaki her metin kanıt defterinde de bulunmalıdır. Böylece kaynaksız bir cümle "kaynak" diye geçemez.
  const proven = new Set((ledger.iddialar || []).map((c) => squeeze(c.metin)));
  for (const k of classes.kaynak || []) if (!proven.has(k)) fail("olgu", "data/metin.json", `kaynak sınıfında ama kanıt defterinde yok: ${k}`);
  const exact = new Set([...(classes.kaynak || []), ...(classes.tasarim || []), ...(classes.etiket || []), ...(classes.plan || [])]);
  const folded = new Set(classes.veri || []);
  const texts = pageTexts(html);
  if (texts.length < 120) fail("olgu", f, `metin çıkarımı beklenenden az: ${texts.length}`);
  for (const t of texts) if (!exact.has(t) && !folded.has(normText(t))) fail("olgu", f, `sınıfı bilinmeyen metin: ${t}`);
  // Görünmeyen metinler de kayıtlıdır: sayfa başlığı, öznitelik metinleri ve yalnız ekran okuyucuya okunan metinler.
  // Kayıt ya birebir tutar ya da iki nokta ile biten bir ön ektir. Bölüm adının yinelemesi sondaki iki nokta atılarak aranır.
  const hidExact = new Set(classes.gizli || []);
  const hidPrefix = classes.gizli_on_ek || [];
  const hidden = hiddenTexts(html);
  if (hidden.length < 20) fail("olgu", f, `görünmeyen metin çıkarımı beklenenden az: ${hidden.length}`);
  for (const t of hidden) {
    const n = normHidden(t);
    if (!hidExact.has(n) && !hidExact.has(n.replace(/:+$/, "").trim()) && !hidPrefix.some((p) => n.startsWith(p))) fail("olgu", f, `kayıtsız görünmeyen metin: ${t}`);
  }
  // Planlanan hizmet ve içerik (kullanıcı kararı 11 Kasım 2026). Planlanan öneri canlı olgu gibi yazılmaz.
  // Plan sınıfındaki metin yalnız data-plan bölgesinde durur. Her bölge "Planlanan hizmet" ya da "Planlanan içerik" etiketini gösterir.
  // Plan sınıfındaki bir cümle kanıt defterinde olamaz. Yayın derlemesinde planlanan bölge bulunmaz.
  const planSet = new Set(classes.plan || []);
  for (const k of planSet) if (proven.has(k)) fail("plan", "data/metin.json", `planlanan metin kaynak sınıfında da var: ${k}`);
  const walked = walkTexts(html);
  for (const x of walked.texts) if (planSet.has(x.t) && !x.plan) fail("plan", f, `planlanan metin işaretli bölgenin dışında: ${x.t}`);
  for (const r of walked.regions) if (!r.tagged) fail("plan", f, `planlanan bölgenin görünür etiketi yok: ${r.id || "adsız"}`);
  if (yayin && walked.regions.length) fail("plan", f, `yayın derlemesinde planlanan bölge var: ${walked.regions.map((r) => r.id).join(", ")}`);
  if (!yayin) {
    const ids = new Set(walked.regions.map((r) => r.id));
    for (const id of ["guvenli-odeme", "yeni-musteri", "yeniden-siparis", "araclar", "kutuphane"]) if (!ids.has(id)) fail("plan", f, `planlanan bölüm yok: ${id}`);
    // Gezinmeden ve sayfanın başka bir yerinden bu iki bölüme bağlantı vardır.
    for (const id of ["araclar", "kutuphane"]) if (count(new RegExp(`href="#${id}"`, "g")) < 2) fail("plan", f, `en az iki bağlantı yok: #${id}`);
  }
  // Kullanıcı metninde teknik jargon yoktur: RFQ ve escrow. Görünen metin ve öznitelik metni denetlenir.
  const said = strip(html) + " " + [...html.matchAll(/\b(aria-label|placeholder|alt|title|content)="([^"]*)"/g)].map((m) => m[2]).join(" ");
  for (const w of ["RFQ", "escrow"]) if (new RegExp(`\\b${w}\\b`, "i").test(said)) fail("jargon", f, `kullanıcı metninde ${w}`);
  // Kaldırılan metinler geri gelmez (kullanıcı kararı 11 Kasım 2026).
  for (const t of ["Çarşıya gitmeyin", "Rakibiniz yoldayken"]) if (said.includes(t)) fail("kaldırılan metin", f, t);
  if (/class="reason__why"/.test(html)) fail("kaldırılan metin", f, "gerekçe kartında Çünkü satırı");
  // Ödeme garantisi vaat edilmez. Canlı iStoc ödemeyi tutmaz.
  if (/garanti/i.test(said)) fail("vaat", f, "sayfada garanti sözü");
  return fails;
}

const cssSource = readFileSync(join(here, "styles.css"), "utf8");
const jsSource = readFileSync(join(here, "app.js"), "utf8");
const htmlSource = readFileSync(join(here, "index.html"), "utf8");
const ledgerSource = JSON.parse(readFileSync(join(here, "data", "kaynaklar.json"), "utf8"));
const classSource = JSON.parse(readFileSync(join(here, "data", "metin.json"), "utf8"));
const yayin = flags.has("--yayin");
// Bağlantı denetiminin dayanağı: açıldığı denetlenen sayfalar ve veride var olan kayıtlar (veri.py yazar).
const readData = (name) => JSON.parse(readFileSync(join(here, "data", name), "utf8"));
const dizinData = readData("dizin.json");
const catData = readData("kategoriler.json");
const siteSource = {
  sayfalar: dizinData.sayfalar,
  kategori: new Set([...catData.flatMap((c) => [c.slug, ...c.children.flatMap((k) => [k.slug, ...k.children.map((g) => g.slug)])]), ...dizinData.urun_gruplari.map((g) => g.adres)]),
  urun: new Set(Object.keys(readData("ana-sayfa.json").urunler)),
  magaza: new Set(dizinData.magazalar.map((m) => m.adres)),
  marka: new Set(dizinData.markalar.map((b) => b.adres)),
  // Canlı sitenin site haritasındaki kayıt adresleri, canlı sitede geçen sosyal hesaplar ve açıldığı denetlenen görseller.
  harita: { urun: new Set(dizinData.site_haritasi.urun), magaza: new Set(dizinData.site_haritasi.magaza), marka: new Set(dizinData.site_haritasi.marka) },
  sosyal: new Set(dizinData.sosyal),
  gorsel: new Set(Object.values(dizinData.gorseller)),
};

if (flags.has("--sinama")) {
  // Kapı kendini sınar. Önce temiz kaynak geçmelidir. Sonra her ihlal örneği beklenen kuralla reddedilmelidir.
  const cssCases = [
    ["transition: all ve anahtar kelime eğri", ".a1 { transition: all 200ms ease-in; }", "hareket"],
    ["odakta outline", ".a2:focus-visible { outline: 2px solid blue; }", "odak"],
    ["14 px altında metin", ".a3 { font-size: 12px; }", "metin"],
    ["yuvarlak köşede renkli kenar çizgisi", ".a3 { border-radius: 12px; border-left: 4px solid blue; }", "kenar"],
    ["iç gölge çubuğu", ".a4 { box-shadow: inset 4px 0 0 blue; }", "kenar"],
    ["kelime ortasından bölme", ".a4 { overflow-wrap: anywhere; }", "satır"],
    ["geçiş yalnız hover durumunda", ".a5:hover { transition: color var(--dur-1) var(--ease); }", "hareket"],
    ["linear animasyon", ".a6 { animation: spin var(--dur-1) linear infinite; }", "hareket"],
    ["uzun yazımda eğri yok", ".b2 { transition-property: opacity; transition-duration: var(--dur-1); }", "hareket"],
    ["iç içe kural", ".b3 { color: red; &:hover { color: blue; } }", "yapı"],
    ["geçiş yalnız .is- durumunda", ".b4.is-open { transition: opacity var(--dur-1) var(--ease); }", "hareket"],
    ["odakta gölge halkası", "button.b5:focus-visible { box-shadow: 0 0 0 3px blue; }", "odak"],
    ["ayrı kuralda renkli kenar çizgisi", ".b6--x { border-left: 4px solid blue; }", "kenar"],
    ["font kısaltması", ".b7 { font: 500 11px/1 Arial; }", "metin"],
    ["çözümlenemeyen yazı boyutu", ".b8 { font-size: min(1rem, 3vw); }", "metin"],
    ["300 altı yazı ağırlığı", ".b9 { font-weight: 200; }", "metin"],
    ["Ubuntu ailesinde olmayan ara kalınlık", ".b12 { font-weight: 600; }", "metin"],
    ["kalınlık tokenı ara değerde", ":root { --w-ara: 600; }", "metin"],
    ["yazı tipi Ubuntu değil", ':root { --font: "Outfit", sans-serif; }', "metin"],
    ["odakta kenarlık rengi", ".b10:focus-within { border-color: blue; }", "odak"],
    ["odakta çevreleyen sözde öğe", '.b11:focus-visible::after { content: ""; position: absolute; inset: 0; }', "odak"],
    // İkinci incelemenin bulduğu kör noktalar
    ["eğri başka değişkene saklanmış", ":root { --pop: steps(3); }", "hareket"],
    ["geçişte token olmayan eğri değişkeni", ".c1 { transition: transform var(--dur-2) var(--pop); }", "hareket"],
    ["karışık geçişte ikinci parçada eğri yok", ".c1 { transition: opacity var(--dur-1) var(--ease), transform var(--dur-2) var(--pop); }", "hareket"],
    ["odakta kenarlık değişkeni", 'html[data-kb="on"] .field:focus-within { --field-line: var(--ink); }', "odak"],
    ["bileşende token tanımı", ".c2 { --field-line: var(--ink); }", "token"],
    ["dış gölgeyle vurgu kenarı", ".reason { box-shadow: -4px 0 0 var(--a-500); }", "kenar"],
    ["gölge tokenı bileşende yeniden tanımlanmış", ".reason { --shadow-1: -4px 0 0 blue; box-shadow: var(--shadow-1); }", "token"],
    ["bulanıksız drop-shadow çubuğu", ".c3 { filter: drop-shadow(-4px 0 0 var(--a-500)); }", "kenar"],
    ["metni ölçekle küçültme", ".pc__badge { transform: scale(.8); }", "metin"],
    ["metni zoom ile küçültme", ".c4 { zoom: 0.8; }", "metin"],
    ["yakın turuncu ham kod", ".filter { background: #ff8a00; }", "renk"],
    ["hsl ile turuncu", ".c5 { color: hsl(30 100% 50%); }", "renk"],
    ["adlı turuncu", ".c6 { color: darkorange; }", "renk"],
    ["marka tokenı izinsiz yerde", ".filter { background: var(--brand); }", "renk"],
    [":has() ile içerik durumu", ".faq h3:has(button) + .faq__panel { color: red; }", "temel"],
    ["süs amaçlı renkli kenarlık", ".reason { border: 2px solid var(--a-500); }", "kenar"],
    // Üçüncü incelemenin bulduğu kör noktalar
    ["önekle yazılmış geçiş", ".d1 { -webkit-transition: all 200ms ease-in; }", "hareket"],
    ["önekle yazılmış gölge çubuğu", ".d2 { -webkit-box-shadow: -4px 0 0 blue; }", "kenar"],
    ["hwb rengi", ".d3 { color: hwb(30 0% 0%); }", "renk"],
    ["color-mix rengi", ".d4 { color: color-mix(in srgb, red, yellow); }", "renk"],
    ["yüzdeli rgb", ".d5 { color: rgb(100% 53% 0%); }", "renk"],
    ["üzerine gelince kutu oynuyor", ".btn:hover { transform: translateY(-2px); }", "hareket"],
    ["basınca kutu küçülüyor", ".btn:active { scale: 0.98; }", "hareket"],
    ["geçiş yalnız veri durumunda", '.header[data-search="on"] .header__search { transition: opacity var(--dur-2) var(--ease); }', "hareket"],
    ["geçiş yalnız .has- durumunda", "html.has-cartbar .cartbar { transition: opacity var(--dur-2) var(--ease); }", "hareket"],
    ["geçiş yalnız :disabled durumunda", ".btn:disabled { transition: opacity var(--dur-2) var(--ease); }", "hareket"],
    ["yüzdeyle küçülten ölçek", ".pc__badge { scale: 80%; }", "metin"],
    ["ek stil dosyası çağrısı", '@import url("ek.css");', "yapı"],
    ["token olmayan süre değişkeni", ":root { --hizli: 90ms; }", "hareket"],
    ["kenarlık rengi vurgu rengine çevrilmiş", ".reason { border-color: var(--a-500); }", "kenar"],
    // Beşinci incelemenin bulduğu boşluk
    ["ekran genişliğiyle 14 px altına inen yazı", ".e1 { font-size: min(var(--t-sm), 4vw); }", "metin"],
  ];
  const jsCases = [
    ["betikte animate()", "el.animate([{ opacity: 0 }], { duration: 200 });", "hareket"],
    ["betikte geçiş stili", 'el.style.transition = "opacity 1s";', "hareket"],
    ["betikte anahtar kelime eğri", 'el.animate(k, { easing: "ease-in-out" });', "hareket"],
    ["süre tokenı üzerinde hesap", 'tween(el, to, dur("--dur-4") * 2, paint);', "hareket"],
    ["betikte turuncu", 'el.style.color = "#ff8a00";', "renk"],
    ["kayıtsız betik metni", 'announce("Siparişiniz başarıyla oluşturuldu.");', "olgu"],
    ["betikte setProperty ile geçiş", 'el.style.setProperty("transition", "none");', "hareket"],
  ];
  const htmlCases = [
    ["sınıfı sonda yazılmış alt çizgisiz bağlantı", '<a href="/x" class="lnk">Metin</a>', "gösterge"],
    ["hedefsiz bağlantı", '<a href="#">Uygulama</a>', "bağlantı"],
    ["satır içi stil", '<p style="color:red">x</p>', "satır içi stil"],
    ["native select", "<select><option>x</option></select>", "açılır menü"],
    ["sayfada ham turuncu", '<svg><path fill="#ff8a00"/></svg>', "renk"],
    ["sayfada stil bloğu", "<style>.x { color: red }</style>", "satır içi stil"],
    ["ek stil dosyası", '<link rel="stylesheet" href="ek.css">', "satır içi stil"],
    ["etikette noktalı virgül", '<button aria-label="Kaydedin; kapatın">x</button>', "yazım"],
    ["metinde ok işareti", "<p>Ürün → sepet</p>", "yazım"],
    ["metinde kısa çizgi", "<p>Ürün – sepet</p>", "yazım"],
    // Beşinci sürümün yeni kuralları
    ["izinsiz satır içi oran", '<a href="./" style="--p:2">Ana sayfa</a>', "satır içi stil"],
    ["bağlantısız dizin grubu", '<div class="dgroup" data-fold data-open="true"><h3 class="fold__h"><span class="fold__label"><span class="fold__name">Dizin</span></span></h3><div class="fold__panel"><div><ul></ul></div></div></div>', "dizin"],
    ["açıldığı denetlenmemiş adres", '<a href="https://istoc.com/olmayan-sayfa">Ana sayfa</a>', "bağlantı"],
    ["veride olmayan mağaza adresi", '<a href="https://istoc.com/magaza/olmayan-magaza">Ana sayfa</a>', "bağlantı"],
    ["izinsiz adres değişkeni", '<a href="https://istoc.com/urunler?max_price=1">Ana sayfa</a>', "bağlantı"],
    // Dördüncü incelemenin bulduğu boşluk: şablona eklenen kaynaksız cümle
    ["sınıfı bilinmeyen cümle", "<p>iStoc bölgenin en büyük toptan pazaryeridir.</p>", "olgu"],
    ["sınıfı bilinmeyen başlık", "<h3>En düşük fiyat garantisi</h3>", "olgu"],
    ["sınıfı bilinmeyen etiket", '<a href="/x">Ücretsiz kargo</a>', "olgu"],
    ["sayısı değişmiş kaynaklı cümle", "<p>Başvuru 9 dakika sürer</p>", "olgu"],
    // Beşinci incelemenin bulduğu boşluklar: sunucu adı, dış adres, görünmeyen metin ve eski katlanan grup
    ["sunucu adı taklit edilmiş adres", '<a href="https://istoc.com.baska.site/urunler">Ana sayfa</a>', "bağlantı"],
    ["kayıtsız dış adres", '<a href="https://example.com/">Ana sayfa</a>', "bağlantı"],
    ["güvensiz adres", '<a href="http://istoc.com/urunler">Ana sayfa</a>', "bağlantı"],
    ["site haritasında olmayan ürün adresi", '<a href="https://istoc.com/urun/olmayan-urun">Ana sayfa</a>', "bağlantı"],
    ["kayıtsız öznitelik metni", '<button type="button" aria-label="En ucuz ürünleri gösterin">x</button>', "olgu"],
    ["kayıtsız ekran okuyucu metni", '<span class="sr-only">Garantili en düşük fiyat</span>', "olgu"],
    ["details ile katlanan grup", "<details><summary>Dizin</summary></details>", "katlanan grup"],
    ["düğmesi grubundan farklı durumda", '<div class="fgroup" data-fold data-open="true"><div class="fold__h"><button class="fold__btn" type="button" aria-expanded="false" aria-controls="yok-1">Dizin</button></div></div>', "katlanan grup"],
    // Altıncı sürüm: planlanan hizmet, jargon, kaldırılan metin ve ödeme vaadi
    ["planlanan metin işaretsiz bölgede", `<p>${(classSource.plan || ["Planlanan metin yok."])[0]}</p>`, "plan"],
    ["etiketsiz planlanan bölge", '<div id="yeni-plan" data-plan><p>Bu sayfa bir tasarım önerisidir.</p></div>', "plan"],
    ["kullanıcı metninde RFQ", '<a href="/x">RFQ formu</a>', "jargon"],
    ["öznitelikte escrow", '<button type="button" aria-label="Escrow ile ödeyin">x</button>', "jargon"],
    ["kaldırılan slogan geri geldi", "<p>Çarşıya gitmeyin.</p>", "kaldırılan metin"],
    ["Çünkü satırı geri geldi", '<p class="reason__why">Çünkü</p>', "kaldırılan metin"],
    ["ödeme garantisi vaadi", "<p>Paranız garanti altında.</p>", "vaat"],
  ];
  const lines = [];
  const base = [...checkCss(cssSource).fails, ...checkJs(jsSource, classSource.betik), ...checkHtml(htmlSource, yayin, ledgerSource, classSource, siteSource)];
  if (base.length) lines.push(`FAIL temiz kaynak reddedildi: ${base.length} ihlal. Önce "node kapi.mjs" çıktısını düzeltin.`);
  let caught = 0;
  for (const [name, snippet, rule] of cssCases) {
    const ok = checkCss(cssSource + "\n" + snippet).fails.some((x) => x.rule === rule);
    if (ok) caught++; else lines.push(`FAIL kapı kaçırdı [${rule}] ${name}: ${snippet}`);
  }
  for (const [name, snippet, rule] of jsCases) {
    const ok = checkJs(jsSource + "\n" + snippet, classSource.betik).some((x) => x.rule === rule);
    if (ok) caught++; else lines.push(`FAIL kapı kaçırdı [${rule}] ${name}: ${snippet}`);
  }
  for (const [name, snippet, rule] of htmlCases) {
    const ok = checkHtml(htmlSource.replace("</main>", snippet + "</main>"), yayin, ledgerSource, classSource, siteSource).some((x) => x.rule === rule);
    if (ok) caught++; else lines.push(`FAIL kapı kaçırdı [${rule}] ${name}: ${snippet}`);
  }
  // Kaynak sınıfına kanıtsız eklenen cümle de reddedilmelidir.
  const forged = { ...classSource, kaynak: [...classSource.kaynak, "Kanıtı olmayan cümle."] };
  if (checkHtml(htmlSource, yayin, ledgerSource, forged, siteSource).some((x) => x.rule === "olgu")) caught++;
  else lines.push("FAIL kapı kaçırdı [olgu] kaynak sınıfına kanıtsız eklenen cümle");
  const ledgerCases = [
    ["kaynağında bulunamayan cümle", { ...ledgerSource, iddialar: [{ ...ledgerSource.iddialar[0], bulundu: false }] }],
    ["sayfada geçmeyen kaynaklı cümle", { ...ledgerSource, iddialar: [{ ...ledgerSource.iddialar[0], metin: "Bu cümle sayfada yok." }] }],
    ["günü olmayan kanıt defteri", { ...ledgerSource, alindi: "" }],
  ];
  for (const [name, bad] of ledgerCases) {
    const ok = checkHtml(htmlSource, yayin, bad, classSource, siteSource).some((x) => x.rule === "olgu");
    if (ok) caught++; else lines.push(`FAIL kapı kaçırdı [olgu] ${name}`);
  }
  // Tercih grubunda iki seçenek birden seçili olamaz.
  const twoOn = htmlSource.replace('aria-checked="false"', 'aria-checked="true"');
  if (twoOn !== htmlSource && checkHtml(twoOn, yayin, ledgerSource, classSource, siteSource).some((x) => x.rule === "tercih")) caught++;
  else lines.push("FAIL kapı kaçırdı [tercih] grupta iki seçili seçenek");
  const total = cssCases.length + jsCases.length + htmlCases.length + ledgerCases.length + 2;
  if (lines.length) console.log(lines.join("\n"));
  console.log(`Kapı sınaması: ${total} ihlal örneğinden ${caught} tanesi reddedildi. Sonuç: ${lines.length ? "FAIL" : "PASS"}`);
  process.exit(lines.length ? 1 : 0);
}

const cssResult = checkCss(cssSource);
const fails = [...cssResult.fails, ...checkJs(jsSource, classSource.betik), ...checkHtml(htmlSource, yayin, ledgerSource, classSource, siteSource)];
const kind = yayin ? "yayın" : "önizleme";
if (fails.length) {
  console.log(fails.map((x) => `FAIL [${x.rule}] ${x.where}: ${x.detail}`).join("\n"));
  console.log(`\nSonuç: FAIL (${fails.length} ihlal, ${cssResult.count} stil kuralı ve 1 sayfa denetlendi, ${kind} derlemesi)`);
  process.exit(1);
}
console.log(`Sonuç: PASS (${cssResult.count} stil kuralı ve 1 sayfa denetlendi, ${kind} derlemesi)`);
