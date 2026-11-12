/*! Uyarlama: React Bits (https://github.com/DavidHDev/react-bits), commit 9d9c687dc4f55b23539aa5417b703078047efa74.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0.
 * Lisans metni: third_party/react-bits/LICENSE.md. Ayrıntı: THIRD_PARTY_NOTICES.md.
 * Bu dosya bileşenleri ayrı paket olarak dağıtmaz. Yalnız bu sitenin arka plan hareketinde kullanılır. */

// Bu dosya React Bits arka planlarından seçilen hesapları sitenin SVG ve DOM yüzeyine taşır.
// WebGL, gölgelendirici, fizik çözücü ve zaman döngüsü alınmadı. Zamanın yerini sayfa kaydırma ilerlemesi alır.

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// GridMotion.tsx satır 62: satır başına hız katsayısı (PACE). Satır 266: satırlar sırayla karşıt yöne kayar.
export const PACE: readonly number[] = [1, 0.86, 1.12, 0.94];
export const pick = (list: readonly number[], index: number): number => list[index % list.length] ?? 1;

// GridMotion.tsx satır 71-84: kenar yumuşatma maskesi. Smootherstep eğrisiyle 12 duraklı geçiş üretir.
export const feather = (side: string, zone: number): string => {
  const head: string[] = [];
  const tail: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = t * t * t * (t * (t * 6 - 15) + 10);
    head.push(`rgba(0, 0, 0, ${a.toFixed(4)}) ${(t * zone).toFixed(2)}%`);
    const m = (12 - i) / 12;
    const b = m * m * m * (m * (m * 6 - 15) + 10);
    tail.push(`rgba(0, 0, 0, ${b.toFixed(4)}) ${(100 - m * zone).toFixed(2)}%`);
  }
  return `linear-gradient(${side}, ${head.join(", ")}, ${tail.join(", ")})`;
};

// DotGrid.tsx satır 138 ve MagnetLines.tsx satır 289: smootherstep.
export const smootherstep = (value: number): number => {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Waves.tsx satır 105-131 (gölgelendirici): 12 yönlü gradyan, karma ve Perlin gürültüsü. GLSL'den TypeScript'e çevrildi.
// Tohum (uSeed) sabittir. İşaretsiz tamsayı çarpımı Math.imul ile yapılır.
const GRADIENTS: readonly (readonly [number, number])[] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 1], [0, -1],
];
const SEED = 3;
const gradient = (cx: number, cy: number): readonly [number, number] => {
  let qx = ((cx + 65536) >>> 0) + Math.imul(SEED, 7919);
  let qy = ((cy + 65536) >>> 0) + Math.imul(SEED, 104729);
  const sx = Math.imul(1103515245, (qx >>> 1) ^ qy) >>> 0;
  const sy = Math.imul(1103515245, (qy >>> 1) ^ qx) >>> 0;
  qx = sx;
  qy = sy;
  const n = Math.imul(1103515245, qx ^ (qy >>> 3)) >>> 0;
  return GRADIENTS[(n >>> 16) % 12] ?? [1, 0];
};
const quintic = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
export const perlin = (x: number, y: number): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const dot = (cx: number, cy: number, dx: number, dy: number): number => {
    const g = gradient(cx, cy);
    return g[0] * dx + g[1] * dy;
  };
  const n00 = dot(ix, iy, fx, fy);
  const n10 = dot(ix + 1, iy, fx - 1, fy);
  const n01 = dot(ix, iy + 1, fx, fy - 1);
  const n11 = dot(ix + 1, iy + 1, fx - 1, fy - 1);
  const ux = quintic(fx);
  const uy = quintic(fy);
  const a = n00 + (n10 - n00) * ux;
  const b = n01 + (n11 - n01) * ux;
  return a + (b - a) * uy;
};

// Waves.tsx satır 177-181 (wave): noktayı gürültüyle döndürülen bir vektör kadar iter.
// Kaynakta uDrift zamanla artar. Burada drift sayfa kaydırma ilerlemesidir, bu yüzden yukarı kaydırınca dalga geri döner.
export const wave = (x: number, y: number, frequency: number, drift: number, twist: number, amplitude: number): [number, number] => {
  const turn = perlin(x * frequency + drift, y * frequency) * 12 * twist;
  return [x + Math.cos(turn) * amplitude, y + Math.sin(turn) * 0.5 * amplitude];
};

// MagnetLines.tsx satır 296-302: hücre başına sabit tohum (-1 ile 1 arası).
export const seedFor = (column: number, row: number): number => {
  let hash = Math.imul(column + 40503, 2246822519) ^ Math.imul(row + 9973, 3266489917);
  hash = Math.imul(hash ^ (hash >>> 15), 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 374761393);
  return (((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 2 - 1;
};

// MagnetLines.tsx satır 868-884 (fieldAngle, "spiral" ve "attract" kipleri): çizginin çekim noktasına göre açısı.
export const fieldAngle = (cx: number, cy: number, px: number, py: number, spiral: boolean): number => {
  const toward = Math.atan2(py - cy, px - cx);
  return spiral ? toward + Math.PI / 4 : toward;
};

// DotGrid.tsx satır 352-361: işaretçi yakınlık itmesi. Kaynakta ivmedir, burada doğrudan kaymadır.
export const push = (dx: number, dy: number, radius: number, strength: number): [number, number] => {
  const distance = Math.hypot(dx, dy);
  if (distance >= radius || distance < 0.001) return [0, 0];
  const weight = smootherstep(1 - distance / radius) * strength;
  return [(dx / distance) * weight, (dy / distance) * weight];
};

// Kübik Bezier noktası. Güzergâh ve paket parçacıkları bu eğri üstünde ilerler.
export type Point = readonly [number, number];
export const bezier = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): [number, number] => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};
