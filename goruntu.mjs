// Ekran görüntüsü alıcı. Çalıştırma: node goruntu.mjs <adres> <klasör> <genişlik> <yükseklik> [önek] [motor]
// Sayfadaki her modülü sırayla ekrana getirir ve o anki görünümü kaydeder.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// Playwright verilen kurulumdan alınır. Bu komut paket kurmaz.
let pw;
const pwDirs = [process.env.PLAYWRIGHT_PACKAGE_DIR, here, join(here, "..", "site")].filter(Boolean);
for (const dir of pwDirs) {
  try {
    pw = createRequire(join(dir, "package.json"))("@playwright/test");
    break;
  } catch {
    // Sonraki kurulum denenir.
  }
}
if (!pw) throw new Error(`Playwright bulunamadı. Denenen klasörler: ${pwDirs.join(", ")}`);

const [url, dir, w = "1440", h = "900", prefix = "s", engine = "chromium"] = process.argv.slice(2);
const browser = await pw[engine].launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);
await page.screenshot({ path: join(dir, `${prefix}-00.png`) });
// Kategori menüsü açık hali. Dar ekranda ilk üst kategori de açılır.
await page.click(".nav__all--js");
await page.waitForTimeout(900);
if (+w < 1024) {
  await page.click(".mega__cat");
  await page.waitForTimeout(900);
}
await page.screenshot({ path: join(dir, `${prefix}-menu.png`) });
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
const tops = await page.evaluate(() => {
  const els = [...document.querySelectorAll("main .mod, footer")];
  const out = [];
  for (const el of els) {
    const y = Math.round(el.getBoundingClientRect().top + scrollY - 90);
    if (!out.length || y - out[out.length - 1] > innerHeight * 0.6) out.push(Math.max(0, y));
  }
  return out;
});
let n = 1;
for (const y of tops) {
  if (y < 50) continue;
  await page.evaluate((v) => scrollTo(0, v), y);
  await page.waitForTimeout(1700);
  await page.screenshot({ path: join(dir, `${prefix}-${String(n).padStart(2, "0")}.png`) });
  n += 1;
}
console.log(`${n} görüntü: ${prefix}`);
await browser.close();
