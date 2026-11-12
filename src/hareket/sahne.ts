// Hareket denetleyicisi. Altı sahneyi tek kare zamanlayıcısıyla yönetir.
// Kural: her karede önce bütün ölçümler okunur, sonra bütün dönüşümler yazılır.
// Kare yalnız kaydırma, boyut değişimi, görünürlük, yazı tipi yüklenmesi ya da işaretçi hareketiyle istenir.
// Kendiliğinden süren kare döngüsü yoktur. Ekran dışındaki ve gizli sekmedeki sahne için iş yapılmaz.
// İlerleme (p) sahnenin ekrandan geçişidir: 0 ekrana girerken, 1 ekrandan çıkarken. v = 2p - 1 aralığı -1 ile 1'dir.
// Sayfa aşağı kaydıkça v artar, yukarı kaydıkça azalır. Bu yüzden her hareket kaydırmayla gerçekten tersine döner.
// Ortak hareket sözleşmesi: sunum merkezi pozitif süre ve eğriyle yumuşar. Anlamsal değer anında güncellenir.
//   Kökteki --scene-progress kaydırma konumunun anlık değeridir.
//   Katmanların gördüğü ilerleme ise o anki görünen değerden yeni hedefe --dur-3 süresinde ve --ease eğrisiyle gider.
//   Hedef geçiş sırasında değişirse geçiş o anki değerden yeni hedefe yeniden başlar. Geçiş bitince kare istenmez.
//   İşaretçinin sahnedeki yeri ve etkisi de aynı geçişle yumuşar. Böylece çizgiler işaretçiye anında sıçramaz.
import { bezier, clamp, feather, fieldAngle, PACE, pick, push, seedFor, smootherstep, wave, type Point } from "./uyarlama.js";

interface Frame {
  v: number;
  p: number;
  amp: number;
  unit: number;
  pointer: { x: number; y: number; w: number } | null;
}
interface Scene {
  readonly root: HTMLElement;
  update(f: Frame): void;
  reset(): void;
}

const VIEW_W = 1200;
const VIEW_H = 640;
const DEG = 180 / Math.PI;
const fx = (n: number): string => n.toFixed(2);
const all = <T extends Element>(root: ParentNode, q: string): T[] => Array.from(root.querySelectorAll<T>(q));
const layer = (root: Element, name: string): SVGGElement | HTMLElement | null => root.querySelector<SVGGElement>(`[data-motion-layer="${name}"]`);
const pointsOf = (el: Element | null): [Point, Point, Point, Point] => {
  const raw = (el?.getAttribute("data-b") ?? "0,0 0,0 0,0 0,0").split(" ").map((s) => s.split(",").map(Number) as unknown as Point);
  return [raw[0] ?? [0, 0], raw[1] ?? [0, 0], raw[2] ?? [0, 0], raw[3] ?? [0, 0]];
};
// Yalnız değişen değer yazılır.
const put = (el: Element | null, value: string): void => {
  const s = (el as HTMLElement | null)?.style;
  if (s && s.transform !== value) s.transform = value;
};
// Eğri merkezi --ease tokenından okunur. Kodda eğri sabiti yazmaz.
// Token "cubic-bezier(x1, y1, x2, y2)" biçimindedir. x1 ve x2, 0 ile 1 arasında olmalıdır.
// Zaman t için önce x(u) = t denklemi u için çözülür (Newton, gerekirse ikiye bölme). Sonra y(u) eğrinin değeridir.
// Token okunamazsa eğri yoktur. Bu durumda denetleyici başlamaz ve sahne durağan kalır. Sessizce başka bir eğriye düşülmez.
type Curve = (t: number) => number;
export function curveOf(token: string): Curve | null {
  const m = /^cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)$/.exec(token.trim());
  if (!m) return null;
  const [x1, y1, x2, y2] = [m[1], m[2], m[3], m[4]].map(Number) as [number, number, number, number];
  if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
  const bez = (u: number, a: number, b: number): number => 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u;
  const slope = (u: number, a: number, b: number): number => 3 * (1 - u) * (1 - u) * a + 6 * (1 - u) * u * (b - a) + 3 * u * u * (1 - b);
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const err = bez(u, x1, x2) - t;
      if (Math.abs(err) < 1e-6) return bez(u, y1, y2);
      const d = slope(u, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0;
    let hi = 1;
    u = t;
    for (let i = 0; i < 40 && hi - lo > 1e-7; i++) {
      if (bez(u, x1, x2) < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return bez(u, y1, y2);
  };
}
// Süre merkezi tokendır: "520ms" ya da "0.52s". Pozitif ve sonlu değilse süre yoktur.
export function durationOf(raw: string): number | null {
  const v = raw.trim();
  const n = v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
// Sonlu sayı geçişi: üst üste binen kübik tepkiler.
// Her hedef değişimi (fark ve zaman) kuyruğa girer. Görünen değer, taban artı her farkın kendi yaşındaki eğri değeridir:
//   value = base + toplam(fark * eğri(yaş / süre)).
// Tek bir değişimde değer tam olarak merkezi eğriyi (--ease) ve süreyi (--dur-3) izler.
// Sürekli girdide (her karede yeni hedef) tepkiler üst üste biner. Hız düzgündür, eğri dönemsel olarak yeniden başlamaz ve donmaz.
// Süresi dolan fark tabana katılır, kuyruktan çıkar. Kuyruk en çok bir süre penceresindeki farkları tutar.
// Girdi kesilince son fark en geç bir süre sonra biter ve geçiş durur. Boşta kare döngüsü yoktur.
export class Tween {
  value: number;
  active = false;
  private base: number;
  private target: number;
  private queue: { d: number; t: number }[] = [];
  constructor(v: number) {
    this.value = v;
    this.base = v;
    this.target = v;
  }
  aim(to: number, now: number, snap: boolean): void {
    if (snap) {
      this.value = this.base = this.target = to;
      this.queue = [];
      this.active = false;
      return;
    }
    if (to === this.target) return;
    this.queue.push({ d: to - this.target, t: now });
    this.target = to;
    this.active = true;
  }
  step(now: number, ms: number, curve: Curve): boolean {
    if (!this.active) return false;
    let sum = 0;
    const keep: { d: number; t: number }[] = [];
    for (const q of this.queue) {
      const age = (now - q.t) / ms;
      if (age >= 1) this.base += q.d;
      else {
        sum += q.d * curve(Math.max(0, age));
        keep.push(q);
      }
    }
    this.queue = keep;
    this.value = this.base + sum;
    this.active = keep.length > 0;
    if (!this.active) this.value = this.base = this.target;
    return this.active;
  }
}
const clear = (els: (Element | null)[]): void => els.forEach((el) => el && ((el as HTMLElement).style.transform = ""));
// Ölçek sözleşmesi (tek kural): her dönüşümün ölçeği SCALE_MIN ile SCALE_MAX arasındadır, yani 0,65 ile 1,08.
// Alt sınıra yalnız derinlik sahnesi iner (DotGrid kararı). Öteki sahneler kendi aralıklarını bu sınırın içinde seçer.
const SCALE_MIN = 0.65;
const SCALE_MAX = 1.08;
const scale = (n: number): string => fx(clamp(n, SCALE_MIN, SCALE_MAX));
// Ölçek: katman ortadayken büyük, ekrana girerken ve çıkarken küçüktür. Aralık lo ile hi arasıdır.
const swell = (v: number, lo: number, hi: number): number => clamp(lo + (hi - lo) * smootherstep(1 - Math.abs(v)), SCALE_MIN, SCALE_MAX);

// Catmull-Rom noktalarından düzgün kübik yol.
function smoothPath(pts: [number, number][]): string {
  let d = "";
  pts.forEach((p, i) => {
    if (i === 0) {
      d = `M${fx(p[0])} ${fx(p[1])}`;
      return;
    }
    const a = pts[i - 2] ?? pts[i - 1] ?? p;
    const b = pts[i - 1] ?? p;
    const c = pts[i + 1] ?? p;
    d += ` C${fx(b[0] + (p[0] - a[0]) / 6)} ${fx(b[1] + (p[1] - a[1]) / 6)} ${fx(p[0] - (c[0] - b[0]) / 6)} ${fx(p[1] - (c[1] - b[1]) / 6)} ${fx(p[0])} ${fx(p[1])}`;
  });
  return d;
}

// 1. Ticaret akışı. Waves uyarlaması: şerit noktaları gürültüyle döndürülen vektör kadar itilir. Sürüklenme kaydırma ilerlemesidir.
function flow(root: HTMLElement): Scene {
  const back = layer(root, "back");
  const front = layer(root, "front");
  const ribs = all<SVGPathElement>(root, ".rib").map((el) => ({ el, b: pointsOf(el), d: el.getAttribute("d") ?? "" }));
  const main = pointsOf(root.querySelector(".rib--front"));
  const pkts = all<SVGRectElement>(root, ".pkt").map((el) => ({ el, t: Number(el.dataset["t"] ?? 0), base: el.getAttribute("transform") ?? "" }));
  let lastP = -1;
  const shape = (b: [Point, Point, Point, Point], drift: number, t: number): [number, number] => {
    const [x, y] = bezier(b[0], b[1], b[2], b[3], t);
    return wave(x, y, 0.0035, drift, 0.32, 22);
  };
  return {
    root,
    update({ v, p, amp, unit }) {
      const a = amp / unit;
      put(back, `translate(${fx(v * a * 0.45)}px, ${fx(-v * a * 0.15)}px) rotate(${fx(-v * 2)}deg) scale(${fx(swell(v, 0.9, 1))})`);
      put(front, `translate(${fx(v * a)}px, ${fx(-v * a * 0.35)}px) rotate(${fx(v * 3)}deg) scale(${fx(swell(v, 0.96, 1.08))})`);
      if (Math.abs(p - lastP) < 0.002) return;
      lastP = p;
      const drift = p * 2.4;
      for (const r of ribs) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 12; i++) pts.push(shape(r.b, drift, i / 12));
        r.el.setAttribute("d", smoothPath(pts));
      }
      for (const k of pkts) {
        const t = clamp(k.t + v * 0.07, 0.02, 0.98);
        const [x, y] = shape(main, drift, t);
        const [x2, y2] = shape(main, drift, Math.min(1, t + 0.01));
        put(k.el, `translate(${fx(x)}px, ${fx(y)}px) rotate(${fx(Math.atan2(y2 - y, x2 - x) * DEG)}deg)`);
      }
    },
    reset() {
      clear([back, front, ...pkts.map((k) => k.el)]);
      ribs.forEach((r) => r.el.setAttribute("d", r.d));
      lastP = -1;
    },
  };
}

// 2. Üretici ızgarası. GridMotion uyarlaması: satırlar sırayla karşıt yöne kayar, her satırın hızı PACE katsayısıdır.
// Kaynakta kayma zamanla sürer. Burada kaydırma ilerlemesine bağlıdır. Kenar yumuşatma maskesi feather() ile kurulur.
function grid(root: HTMLElement): Scene {
  const rows = all<HTMLElement>(root, ".grid__row");
  const plane = root.querySelector<HTMLElement>(".grid__plane");
  const top = Math.max(...PACE);
  if (plane) {
    const mask = feather("to right", 18);
    plane.style.setProperty("-webkit-mask-image", mask);
    plane.style.setProperty("mask-image", mask);
  }
  return {
    root,
    update({ v, amp }) {
      rows.forEach((row, r) => {
        const drift = r % 2 ? 1 : -1;
        put(row, `translate3d(${fx((drift * pick(PACE, r) * amp * v) / top)}px, 0px, 0px)`);
      });
    },
    reset() {
      clear(rows);
      plane?.style.removeProperty("-webkit-mask-image");
      plane?.style.removeProperty("mask-image");
      root.style.removeProperty("--nudge");
    },
  };
}

// 3. Süreç güzergâhı: düğümler kübik Bezier eğrisi üstünde ilerler ve geri döner. Kesik çizgi eğri boyunca kayar.
function route(root: HTMLElement): Scene {
  const back = layer(root, "back");
  const front = layer(root, "front");
  const b = pointsOf(root.querySelector(".route__line"));
  const dash = root.querySelector<SVGPathElement>(".route__dash");
  const nodes = all<SVGGElement>(root, ".route__node").map((el) => ({ el, t: Number(el.dataset["t"] ?? 0) }));
  return {
    root,
    update({ v, amp, unit }) {
      const a = amp / unit;
      put(back, `translate(0px, ${fx(-v * a * 0.4)}px) scale(${fx(swell(v, 0.92, 1))})`);
      put(front, `translate(${fx(v * a * 0.15)}px, ${fx(v * a)}px) rotate(${fx(v * 2)}deg) scale(${fx(swell(v, 0.96, 1.06))})`);
      if (dash && dash.style.strokeDashoffset !== fx(-v * 0.5)) dash.style.strokeDashoffset = fx(-v * 0.5);
      for (const n of nodes) {
        const t = clamp(n.t + v * 0.2, 0, 1);
        const [x, y] = bezier(b[0], b[1], b[2], b[3], t);
        put(n.el, `translate(${fx(x)}px, ${fx(y)}px) scale(${scale(0.78 + 0.3 * smootherstep(t))})`);
      }
    },
    reset() {
      clear([back, front, ...nodes.map((n) => n.el)]);
      if (dash) dash.style.strokeDashoffset = "";
    },
  };
}

// 4. Yükselen katmanlar: arka ve ön katman alt kenardan yükselir, ters yönde döner. Her şekil kendi tohumuyla döner.
function rise(root: HTMLElement): Scene {
  const back = layer(root, "back");
  const front = layer(root, "front");
  const shapes = all<SVGElement>(root, ".rise__s").map((el, i) => ({ el, k: seedFor(i, 7) }));
  return {
    root,
    update({ v, amp, unit }) {
      const a = amp / unit;
      put(back, `translate(${fx(v * a * 0.2)}px, ${fx(-v * a * 0.5)}px) rotate(${fx(-v * 4)}deg) scale(${fx(swell(v, 0.88, 1))})`);
      put(front, `translate(${fx(-v * a * 0.25)}px, ${fx(-v * a)}px) rotate(${fx(v * 6)}deg) scale(${fx(swell(v, 0.9, 1.08))})`);
      for (const s of shapes) put(s.el, `rotate(${fx(s.k * v * 28)}deg)`);
    },
    reset() {
      clear([back, front, ...shapes.map((s) => s.el)]);
    },
  };
}

// 5. Derinlik noktaları. DotGrid uyarlaması: iki katman merkezden 0,65 ile 1 arası ölçeklenir.
// Ön katmanın noktaları ince işaretçiden smootherstep ağırlığıyla itilir. İşaretçi gidince geçişle yerine döner.
function depth(root: HTMLElement): Scene {
  const back = layer(root, "back");
  const front = layer(root, "front");
  const dots = all<SVGCircleElement>(root, ".depth__front circle").map((el) => ({ el, x: Number(el.getAttribute("cx")), y: Number(el.getAttribute("cy")) }));
  let pushed = false;
  return {
    root,
    update({ v, amp, unit, pointer }) {
      const a = amp / unit;
      put(back, `translate(0px, ${fx(v * a * 0.3)}px) scale(${scale(0.65 + 0.35 * smootherstep(1 - Math.abs(v)))})`);
      put(front, `translate(0px, ${fx(v * a * 0.75)}px) scale(${scale(0.65 + 0.35 * smootherstep(1 - Math.abs(v) * 0.6))})`);
      if (!pointer && !pushed) return;
      pushed = !!pointer;
      for (const d of dots) {
        const [dx, dy] = pointer ? push(d.x - pointer.x, d.y - pointer.y, 220, 34 * pointer.w) : [0, 0];
        put(d.el, dx || dy ? `translate(${fx(dx)}px, ${fx(dy)}px)` : "");
      }
    },
    reset() {
      clear([back, front, ...dots.map((d) => d.el)]);
      pushed = false;
    },
  };
}

// 6. Çekim çizgileri. MagnetLines uyarlaması: her çizgi çekim noktasına göre fieldAngle ile döner (spiral kipi).
// Çekim noktası sağ üstten sol alta giden kübik eğri üstünde kaydırmayla ilerler. İnce işaretçi varsa çekim noktası işaretçidir.
function magnet(root: HTMLElement): Scene {
  const a = layer(root, "a");
  const b = layer(root, "b");
  const path = pointsOf(root.querySelector(".magnet__lines"));
  const lines = all<SVGLineElement>(root, ".magnet__lines line").map((el) => {
    const [x, y] = (el.dataset["c"] ?? "0,0").split(",").map(Number);
    return { el, x: x ?? 0, y: y ?? 0 };
  });
  return {
    root,
    update({ v, p, amp, unit, pointer }) {
      const k = amp / unit;
      put(a, `translate(${fx(v * k)}px, ${fx(-v * k * 0.4)}px) scale(${fx(swell(v, 0.94, 1.06))})`);
      put(b, `translate(${fx(-v * k * 0.6)}px, ${fx(v * k * 0.25)}px) scale(${fx(swell(v, 0.9, 1))})`);
      const [bx, by] = bezier(path[0], path[1], path[2], path[3], p);
      const [ax, ay] = pointer ? [bx + (pointer.x - bx) * pointer.w, by + (pointer.y - by) * pointer.w] : [bx, by];
      for (const l of lines) put(l.el, `translate(${l.x}px, ${l.y}px) rotate(${fx(fieldAngle(l.x, l.y, ax, ay, true) * DEG)}deg)`);
    },
    reset() {
      clear([a, b, ...lines.map((l) => l.el)]);
    },
  };
}

const FACTORIES: Record<string, (root: HTMLElement) => Scene> = { flow, grid, route, rise, depth, magnet };

export function start(): { stop(): void } {
  const doc = document.documentElement;
  const css = getComputedStyle(doc);
  const token = (name: string): number => parseFloat(getComputedStyle(doc).getPropertyValue(name)) || 0;
  // Eğri ve süre merkezi tokenlardan bir kez okunur. Biri geçersizse hareket başlamaz, sahne durağan kalır.
  const easeToken = curveOf(css.getPropertyValue("--ease"));
  const durToken = durationOf(css.getPropertyValue("--dur-3"));
  if (!easeToken || durToken === null) return { stop() {} };
  const curve: Curve = easeToken;
  const ms: number = durToken;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const scenes = all<HTMLElement>(document, "[data-motion-scene]").flatMap((root) => {
    const make = FACTORIES[root.dataset["motionScene"] ?? ""];
    return make ? [{ scene: make(root), live: false, seen: false, prog: new Tween(0.5), px: new Tween(0), py: new Tween(0), pw: new Tween(0) }] : [];
  });
  let alive = true;
  let ticking = false;
  let mouse: { x: number; y: number } | null = null;
  let tilted = new Set<HTMLElement>();

  function frame(): void {
    ticking = false;
    if (!alive || document.hidden) return;
    // Ölçüm
    const vh = window.innerHeight;
    const amp = token(window.innerWidth < 640 ? "--hareket-genlik-dar" : "--hareket-genlik");
    const tilt = token("--tilt");
    const now = performance.now();
    let moving = false;
    // Ölçek ve işaretçi koordinatı SVG kutusundan, DOM sahnede kökten okunur.
    // Masaüstünde SVG yapışkandır ve bütün bölüm boyunca görünür. İlerleme bu yüzden bölümün geçişidir.
    // Dar ekranda SVG bölümün başında durur (yapışkan değildir). İlerleme ve görünürlük o zaman görünen SVG kutusunun geçişidir.
    // Böylece uzun bölümde de hareket görünen süsle aynı kaydırma aralığında olur. SVG ekran dışındaysa iş yapılmaz.
    const live = scenes.filter((s) => s.live).map((s) => {
      const root = s.scene.root.getBoundingClientRect();
      const svg = s.scene.root.querySelector("svg");
      const box = svg ? svg.getBoundingClientRect() : root;
      const fixed = !!svg && getComputedStyle(svg).position !== "sticky";
      return { s, r: fixed ? box : root, box };
    }).filter(({ r }) => r.bottom > 0 && r.top < vh && r.height > 0);
    // Yazma
    const touched = new Set<HTMLElement>();
    for (const { s, r, box } of live) {
      const root = s.scene.root;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const unit = Math.max(box.width / VIEW_W, box.height / VIEW_H) || 1;
      // İlk ölçümde görünen değer hedefe oturur. Sonraki ölçümlerde geçişle gider.
      s.prog.aim(p, now, !s.seen);
      s.seen = true;
      if (s.prog.step(now, ms, curve)) moving = true;
      let inside = false;
      if (mouse && fine.matches && mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom) {
        inside = true;
        const nx = (mouse.x - r.left) / r.width - 0.5;
        const ny = (mouse.y - r.top) / r.height - 0.5;
        root.style.setProperty("--tx", `${fx(nx * 2 * tilt)}px`);
        root.style.setProperty("--ty", `${fx(ny * 2 * tilt)}px`);
        root.style.setProperty("--nudge", fx(nx * 2));
        touched.add(root);
        // Sahne koordinatı: SVG görünüm kutusu "slice" ile ortalanır. İşaretçi ilk girişte yerine oturur, sonra geçişle izlenir.
        const x = VIEW_W / 2 + (mouse.x - (box.left + box.width / 2)) / unit;
        const y = VIEW_H / 2 + (mouse.y - (box.top + box.height / 2)) / unit;
        const first = s.pw.value === 0 && !s.pw.active;
        s.px.aim(x, now, first);
        s.py.aim(y, now, first);
      }
      s.pw.aim(inside ? 1 : 0, now, false);
      for (const t of [s.px, s.py, s.pw]) if (t.step(now, ms, curve)) moving = true;
      const pointer = s.pw.value > 0 ? { x: s.px.value, y: s.py.value, w: s.pw.value } : null;
      // Anlamsal ilerleme anında yazılır. Katmanlar görünen ilerlemeyi kullanır.
      const value = fx(p);
      if (root.style.getPropertyValue("--scene-progress") !== value) root.style.setProperty("--scene-progress", value);
      const shown = s.prog.value;
      s.scene.update({ v: shown * 2 - 1, p: shown, amp, unit, pointer });
    }
    // Süren geçiş varsa bir sonraki kare istenir. Geçiş en geç --dur-3 sonra biter, sonra kare istenmez.
    if (moving) request();
    tilted.forEach((root) => { if (!touched.has(root)) rest(root); });
    tilted = touched;
  }
  function rest(root: HTMLElement): void {
    root.style.setProperty("--tx", "0px");
    root.style.setProperty("--ty", "0px");
    root.style.setProperty("--nudge", "0");
  }
  function request(): void {
    if (!ticking && alive && !document.hidden) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }
  function leave(): void {
    mouse = null;
    tilted.forEach(rest);
    tilted.clear();
    request();
  }
  const onMove = (e: PointerEvent): void => {
    if ((e.pointerType !== "mouse" && e.pointerType !== "pen") || !fine.matches) return;
    mouse = { x: e.clientX, y: e.clientY };
    request();
  };
  const onOut = (e: PointerEvent): void => { if (!e.relatedTarget) leave(); };
  const onVisible = (): void => { if (!document.hidden) request(); };
  const io = new IntersectionObserver((entries) => {
    let entered = false;
    for (const en of entries) {
      const hit = scenes.find((s) => s.scene.root === en.target);
      if (hit) hit.live = en.isIntersecting;
      if (en.isIntersecting) entered = true;
    }
    if (entered) request();
  });
  scenes.forEach((s) => {
    io.observe(s.scene.root);
    s.scene.root.dataset["motionReady"] = "true";
  });
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("blur", leave);
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onOut);
  document.addEventListener("visibilitychange", onVisible);
  void document.fonts?.ready.then(() => { if (alive) request(); });
  request();

  return {
    stop() {
      alive = false;
      io.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("blur", leave);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("visibilitychange", onVisible);
      for (const { scene } of scenes) {
        scene.reset();
        for (const k of ["--scene-progress", "--tx", "--ty", "--nudge"]) scene.root.style.removeProperty(k);
        delete scene.root.dataset["motionReady"];
      }
    },
  };
}
