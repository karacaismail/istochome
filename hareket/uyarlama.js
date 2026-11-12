/*! Uyarlama: React Bits (https://github.com/DavidHDev/react-bits), commit 9d9c687dc4f55b23539aa5417b703078047efa74.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0.
 * Lisans metni: third_party/react-bits/LICENSE.md. Ayrıntı: THIRD_PARTY_NOTICES.md.
 * Bu dosya bileşenleri ayrı paket olarak dağıtmaz. Yalnız bu sitenin arka plan hareketinde kullanılır. */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const PACE = [1, 0.86, 1.12, 0.94];
export const pick = (list, index) => list[index % list.length] ?? 1;
export const feather = (side, zone) => {
    const head = [];
    const tail = [];
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
export const smootherstep = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
};
const GRADIENTS = [
    [1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 1], [0, -1],
];
const SEED = 3;
const gradient = (cx, cy) => {
    let qx = ((cx + 65536) >>> 0) + Math.imul(SEED, 7919);
    let qy = ((cy + 65536) >>> 0) + Math.imul(SEED, 104729);
    const sx = Math.imul(1103515245, (qx >>> 1) ^ qy) >>> 0;
    const sy = Math.imul(1103515245, (qy >>> 1) ^ qx) >>> 0;
    qx = sx;
    qy = sy;
    const n = Math.imul(1103515245, qx ^ (qy >>> 3)) >>> 0;
    return GRADIENTS[(n >>> 16) % 12] ?? [1, 0];
};
const quintic = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const perlin = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const dot = (cx, cy, dx, dy) => {
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
export const wave = (x, y, frequency, drift, twist, amplitude) => {
    const turn = perlin(x * frequency + drift, y * frequency) * 12 * twist;
    return [x + Math.cos(turn) * amplitude, y + Math.sin(turn) * 0.5 * amplitude];
};
export const seedFor = (column, row) => {
    let hash = Math.imul(column + 40503, 2246822519) ^ Math.imul(row + 9973, 3266489917);
    hash = Math.imul(hash ^ (hash >>> 15), 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 374761393);
    return (((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 2 - 1;
};
export const fieldAngle = (cx, cy, px, py, spiral) => {
    const toward = Math.atan2(py - cy, px - cx);
    return spiral ? toward + Math.PI / 4 : toward;
};
export const push = (dx, dy, radius, strength) => {
    const distance = Math.hypot(dx, dy);
    if (distance >= radius || distance < 0.001)
        return [0, 0];
    const weight = smootherstep(1 - distance / radius) * strength;
    return [(dx / distance) * weight, (dy / distance) * weight];
};
export const bezier = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};
