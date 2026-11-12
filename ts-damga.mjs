// Derleme damgası. npm run build:ts derlemeden sonra bu betiği çalıştırır.
// Damga, derleme anındaki TypeScript kaynaklarının ve JavaScript çıktılarının SHA-256 özetini yazar.
// kapi.mjs özetleri yeniden hesaplar. Kaynak derlemeden sonra değiştiyse ya da çıktı elle değiştiyse kapı FAIL verir.
// Derleyici sürümü, derlemeyi yapan TypeScript paketinden okunur (TSC ortam değişkeni ya da node_modules).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sha = (p) => createHash("sha256").update(readFileSync(p, "utf8")).digest("hex");
const map = (dir, ext) => Object.fromEntries(readdirSync(join(here, dir)).filter((f) => f.endsWith(ext)).sort().map((f) => [f, sha(join(here, dir, f))]));
const tsc = process.env.TSC || join(here, "node_modules", "typescript", "bin", "tsc");
const version = execFileSync(process.execPath, [tsc, "--version"], { encoding: "utf8" }).trim().replace(/^Version\s+/, "");
// Derleme ayarı ve kilit dosyası da özetlenir. Biri derlemeden sonra değişirse derleme eskimiş sayılır.
// Damga bir bütünlük güvencesi değildir. Yalnız eskimiş derlemeyi yakalar.
const ayar = { "tsconfig.json": sha(join(here, "tsconfig.json")), "package-lock.json": sha(join(here, "package-lock.json")) };
const damga = { typescript: version, ayar, kaynak: map("src/hareket", ".ts"), cikti: map("hareket", ".js") };
writeFileSync(join(here, "hareket", "damga.json"), JSON.stringify(damga, null, 1) + "\n");
console.log(`hareket/damga.json yazıldı: TypeScript ${version}, ${Object.keys(damga.kaynak).length} kaynak, ${Object.keys(damga.cikti).length} çıktı`);
