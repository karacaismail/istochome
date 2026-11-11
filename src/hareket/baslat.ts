// Hareket önyükleyicisi. Sayfa her zaman durağan sahneyle açılır.
// Hareket azaltma tercihi ya da veri tasarrufu açıksa hareket paketi (sahne.js) indirilmez.
// Tercih sonradan değişirse paket yüklenir ya da çalışan hareket durdurulur ve sahne durağan hâline döner.
// Paket yüklenemezse sahne durağan kalır. Sayfanın içeriği bu dosyaya bağlı değildir.

interface Controller {
  stop(): void;
}
interface MotionModule {
  start(): Controller;
}
interface SaveDataConnection extends EventTarget {
  readonly saveData?: boolean;
}

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const connection = (navigator as Navigator & { connection?: SaveDataConnection }).connection;
let loading: Promise<MotionModule> | null = null;
let running: Controller | null = null;

const allowed = (): boolean =>
  !reduce.matches && connection?.saveData !== true && document.querySelector("[data-motion-scene]") !== null;

function stop(): void {
  running?.stop();
  running = null;
}

function start(): void {
  if (running || !allowed()) return;
  loading ??= import("./sahne.js") as Promise<MotionModule>;
  loading.then(
    (m) => {
      if (!running && allowed()) running = m.start();
    },
    () => {
      loading = null;
    },
  );
}

function sync(): void {
  if (allowed()) start();
  else stop();
}

reduce.addEventListener("change", sync);
connection?.addEventListener("change", sync);
start();
