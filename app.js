/* iStoc ana sayfa tasarım önerisi, 5. sürüm. Davranış katmanı.
   İlke: durum (değer, ARIA, odak) anında güncellenir. Yalnız sunum yumuşak geçer. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* Bu dosyada hata olursa gizli başlayan içerik görünür kalsın. */
  window.addEventListener("error", function (e) {
    if (e.filename && e.filename.indexOf("app.js") !== -1) root.classList.remove("js");
  });
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* Hareket tokenları CSS'ten okunur. JS kendi süre veya eğri tanımlamaz. */
  function dur(name) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v.slice(-2) === "ms" ? parseFloat(v) : parseFloat(v) * 1000;
  }
  /* --ease tokenının (simetrik easeInOut Cubic) JS karşılığı */
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  /* Sayı geçişi. Yarıda yön değişirse o anki değerden devam eder.
     Her yeni geçiş aynı öğedeki öncekini geçersiz kılar (el._run). */
  function tween(el, to, ms, paint, done) {
    var from = typeof el._v === "number" ? el._v : to;
    var run = (el._run = (el._run || 0) + 1);
    function finish() {
      if (el._run !== run) return;
      el._run += 1;
      el._v = to;
      paint(to);
      if (done) done();
    }
    /* Sekme arka plandaysa kare çizilmez. Değer geçişsiz yazılır, ekranda eski sayı kalmaz. */
    if (reduce.matches || document.hidden || from === to) { finish(); return; }
    var t0 = performance.now();
    /* Kare hiç gelmezse (örtülü pencere, yavaşlatılmış sekme) son değer yine yazılır.
       Böylece ekranda yarım kalmış, yanlış bir sayı durmaz. */
    window.setTimeout(finish, ms + 250);
    (function frame(now) {
      if (el._run !== run) return;
      var t = Math.min(1, (now - t0) / ms);
      if (t >= 1) { finish(); return; }
      el._v = from + (to - from) * ease(t);
      paint(el._v);
      requestAnimationFrame(frame);
    })(t0);
  }
  /* Para birimi. Tutarlar sayfada dört para biriminde hazır durur (build.py yazar).
     Betik kendi kur hesabı yapmaz. Birim fiyatı hazır değerden gösterir.
     Toplamı, sayfadaki yuvarlanmamış birim tutarı adetle çarparak bulur (data-unit-usd gibi öznitelikler).
     build.py en az sipariş tutarını aynı işlemle hesaplar. Bu yüzden karttaki tutar ile sepetin toplamı aynıdır. */
  var para = (function () {
    var on = $('[data-tercih="para"] [aria-checked="true"]');
    return { code: on ? on.dataset.deger : "USD", sym: on ? $(".pref__mark", on).textContent : "$" };
  })();
  /* Tutar Türkçe sayı biçimiyle yazılır: binlik ayırıcı nokta, ondalık ayırıcı virgül. Örnek: $1.234,50. */
  function money(n) { return para.sym + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  /* Öğenin seçili para birimindeki yuvarlanmamış birim tutarı: data-unit-usd, data-unit-try gibi özniteliklerden okunur. */
  function unitOf(el) { return parseFloat(el.dataset["unit" + para.code.charAt(0) + para.code.slice(1).toLowerCase()]); }
  function paintPrices() {
    $$("[data-para]").forEach(function (el) { el.textContent = money(parseFloat(el.dataset[para.code.toLowerCase()])); });
  }
  function tr(n) { return Math.round(n).toLocaleString("tr-TR"); }
  var status = $("#durum");
  function announce(text) { if (status) status.textContent = text; }

  /* Kaydırma kareleri. Kaydırmaya bağlı bütün işler tek bir karede çalışır: önce hepsi ölçer, sonra hepsi yazar.
     Ölçüm ile yazma art arda gelseydi tarayıcı aynı karede yerleşimi birkaç kez yeniden hesaplardı. */
  var frame = (function () {
    var jobs = [];
    var ticking = false;
    function run() {
      ticking = false;
      var i;
      for (i = 0; i < jobs.length; i++) jobs[i].state = jobs[i].read();
      for (i = 0; i < jobs.length; i++) jobs[i].write(jobs[i].state);
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(run); } }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return { add: function (read, write) { jobs.push({ read: read, write: write, state: null }); }, run: run };
  })();

  /* 0. Kaydırma şeritleri. Kural: kaydırılan her alan bunu durağan halde gösterir.
     data-scroll değeri (none, start, middle, end) kenar solmasını, okları ve konum çubuğunu yönetir. */
  var rails = (function () {
    var list = $$("[data-scroller]").map(function (el) {
      var inline = el.parentNode.classList.contains("rail");
      var ctl = !inline && el.nextElementSibling && el.nextElementSibling.hasAttribute("data-rail-ctl") ? el.nextElementSibling : null;
      var host = inline ? el.parentNode : ctl;
      return {
        el: el, inline: inline, ctl: ctl,
        prev: host ? $('[data-rail-btn="-1"]', host) : null,
        next: host ? $('[data-rail-btn="1"]', host) : null
      };
    });
    function sync(r) {
      var el = r.el;
      var max = el.scrollWidth - el.clientWidth;
      var x = el.scrollLeft;
      var state = max <= 1 ? "none" : x <= 1 ? "start" : x >= max - 1 ? "end" : "middle";
      if (el.dataset.scroll !== state) el.dataset.scroll = state;
      var noPrev = state === "none" || state === "start";
      var noNext = state === "none" || state === "end";
      if (r.inline) {
        /* Gizlenecek ok odaktaysa odak diğer oka geçer, kaybolmaz. */
        if (noNext && !noPrev && document.activeElement === r.next) { r.prev.hidden = false; r.prev.focus(); }
        if (noPrev && !noNext && document.activeElement === r.prev) { r.next.hidden = false; r.next.focus(); }
        r.prev.hidden = noPrev;
        r.next.hidden = noNext;
      } else if (r.ctl) {
        r.ctl.hidden = state === "none";
        r.prev.setAttribute("aria-disabled", noPrev ? "true" : "false");
        r.next.setAttribute("aria-disabled", noNext ? "true" : "false");
        r.ctl.style.setProperty("--size", (el.clientWidth / el.scrollWidth).toFixed(4));
        r.ctl.style.setProperty("--pos", (max > 0 ? x / max : 0).toFixed(4));
      }
    }
    function syncAll() { list.forEach(sync); }
    /* Ok düğmesi şeridi bir ekran kadar kaydırır. Geçiş merkezi eğriyi ve süreyi kullanır. */
    function glide(r, dir) {
      var el = r.el;
      var max = el.scrollWidth - el.clientWidth;
      var to = Math.max(0, Math.min(max, el.scrollLeft + dir * Math.max(el.clientWidth * 0.8, 160)));
      el._v = el.scrollLeft;
      el.style.scrollSnapType = "none";
      tween(el, to, dur("--dur-3"), function (v) { el.scrollLeft = v; }, function () { el.style.scrollSnapType = ""; sync(r); });
    }
    list.forEach(function (r) {
      var ticking = false;
      r.el.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; sync(r); });
      }, { passive: true });
      [[r.prev, -1], [r.next, 1]].forEach(function (pair) {
        if (pair[0]) pair[0].addEventListener("click", function () {
          if (pair[0].getAttribute("aria-disabled") !== "true") glide(r, pair[1]);
        });
      });
      /* Satır içi şeritte ok düğmesi içeriğin üstünde durur. Klavyeyle odaklanan öğe okun altında kalmasın diye
         şerit, öğeyi ok kadar içeri kaydırır. Pay CSS'teki scroll-padding değerinden okunur.
         Odak durumu olduğu için kaydırma geçişsiz yapılır.
         Bu yalnız klavye modunda yapılır. Fareyle ya da parmakla basılan bağlantı yerinden oynarsa
         basış başka bir öğenin üstünde biter ve tıklama kaybolur. */
      if (r.inline) r.el.addEventListener("focusin", function (e) {
        if (root.dataset.kb !== "on") return;
        /* Süren bir ok kaydırması varsa durdurulur, iki kaydırma birbiriyle çekişmez. */
        r.el._run = (r.el._run || 0) + 1;
        r.el.style.scrollSnapType = "";
        var zone = parseFloat(getComputedStyle(r.el).scrollPaddingRight) || 0;
        var box = r.el.getBoundingClientRect();
        var item = e.target.getBoundingClientRect();
        var past = item.right - (box.right - zone);
        var before = box.left + zone - item.left;
        if (past > 0) r.el.scrollLeft += past;
        else if (before > 0) r.el.scrollLeft -= before;
        sync(r);
      });
    });
    syncAll();
    window.addEventListener("resize", syncAll);
    window.addEventListener("load", syncAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncAll);
    return { sync: syncAll };
  })();

  /* 1. Klavye odak modu: yalnız Tab açar, dokunma ve fare kapatır. */
  document.addEventListener("keydown", function (e) { if (e.key === "Tab") root.dataset.kb = "on"; });
  ["pointerdown", "touchstart"].forEach(function (t) {
    document.addEventListener(t, function () { delete root.dataset.kb; }, { passive: true });
  });
  /* 2. Üst bölüm: kaydırınca gölge, karşılama araması çıkınca üst arama. */
  (function () {
    var header = $(".header");
    var slot = $(".header__search", header);
    var heroSearch = $(".hero .search");
    var bar = $("[data-progress]", header);
    /* Konum çubuğu sayfanın ne kadarının geçildiğini gösterir. Değer kaydırmaya bağlıdır, geçiş kullanmaz.
       Değer 0 ile 1 arasında tutulur. Sayfa kenarında esneyen kaydırma (iOS) eksi değer üretmez. */
    frame.add(function () {
      var max = root.scrollHeight - window.innerHeight;
      return { stuck: window.scrollY > 8, p: max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0 };
    }, function (now) {
      header.classList.toggle("is-stuck", now.stuck);
      if (bar) bar.style.setProperty("--p", now.p.toFixed(4));
    });
    /* Gözlemci yoksa üst arama kapalı kalır. Karşılama araması sayfada durur. */
    if (!("IntersectionObserver" in window) || !heroSearch) return;
    var past = false;
    var pressing = false;
    function apply() {
      /* Üst aramada yazan kullanıcının alanı kapanmaz. Odak alandan çıkınca kapanır.
         Böylece odak, üst bölümün arkasında kalan karşılama aramasına taşınmaz.
         Kullanıcı alanın içine basarken de alan kapanmaz (pressing). Safari tıklanan düğmeye
         odak vermez. Alan basış sırasında kapansaydı "Arayın" düğmesinin tıklaması yutulurdu. */
      var on = past || pressing || slot.contains(document.activeElement);
      header.dataset.search = on ? "on" : "off";
      slot.inert = !on;
    }
    slot.addEventListener("pointerdown", function () { pressing = true; });
    function release() {
      if (!pressing) return;
      pressing = false;
      window.setTimeout(apply, 0);
    }
    /* Basış tıklamayla ya da iptalle biter. Tıklama olayı hiç gelmezse basışın bırakılması da yeter. */
    window.addEventListener("click", release, true);
    window.addEventListener("pointercancel", release, true);
    window.addEventListener("pointerup", function () { window.setTimeout(release, dur("--dur-3")); }, true);
    new IntersectionObserver(function (entries) {
      var en = entries[entries.length - 1];
      /* Üst arama yalnız karşılama araması ekranın üstünden çıkınca açılır.
         Arama henüz ekranın altındaysa (kısa ekran, yakınlaştırma) açılmaz.
         Açılsaydı dar ekranda gezinme satırını örterdi. */
      var edge = en.rootBounds ? en.rootBounds.top : 72;
      past = !en.isIntersecting && en.boundingClientRect.bottom <= edge + 1;
      apply();
    /* Alt pay çok büyüktür. Böylece ekranın altındaki arama "görünür" sayılır.
       Sayfa bir bağlantıyla aramanın üstüne ya da altına aniden sıçrasa da durum değişir ve gözlemci haber verir. */
    }, { rootMargin: "-72px 0px 100000px 0px" }).observe(heroSearch);
    slot.addEventListener("focusout", function () { window.setTimeout(apply, 0); });
  })();

  /* 3. Arama konsolu: sekmeler, kayan gösterge, dönen örnek. */
  (function () {
    var box = $("[data-console]");
    if (!box) return;
    var tabs = $$('[role="tab"]', box);
    var thumb = $(".seg__thumb", box);
    var panel = $("#konsol");
    var form = $("form", panel);
    var input = $("input", form);
    var label = $("[data-console-label]", form);
    var rot = $("[data-rot]", form);
    var modes = {
      /* Örnek kelimeler sayfadan okunur. Ürün örnekleri seçkiden, üretici adları veriden gelir (build.py yazar). */
      urun: { label: "Ürün arayın", words: form.dataset.ornekUrun.split("|") },
      uretici: { label: "Üretici arayın", words: form.dataset.ornekUretici.split("|") }
    };
    var mode = "urun";
    var index = 0;

    function moveThumb() {
      var on = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
      thumb.style.setProperty("--x", on.offsetLeft + "px");
      thumb.style.setProperty("--w", on.offsetWidth + "px");
    }
    function showWord(text, animate) {
      /* Yarım kalan eski geçişlerin artığı temizlenir. Ekranda en çok iki kelime bulunur. */
      while (rot.children.length > 1) rot.firstElementChild.remove();
      var old = rot.lastElementChild;
      var next = document.createElement("span");
      next.textContent = text;
      if (!animate || reduce.matches) { rot.textContent = ""; rot.appendChild(next); return; }
      next.className = "is-pre";
      rot.appendChild(next);
      void next.offsetWidth;
      next.className = "";
      if (old) {
        old.className = "is-out";
        old.addEventListener("transitionend", function () { old.remove(); }, { once: true });
      }
    }
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      mode = tab.dataset.mode;
      index = 0;
      panel.setAttribute("aria-labelledby", tab.id);
      label.textContent = modes[mode].label;
      /* Sekme, aramanın gideceği sonuç sayfasını da belirler. */
      form.action = form.dataset[mode];
      moveThumb();
      showWord(modes[mode].words[0], true);
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
        else if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
      });
    });
    moveThumb();
    window.addEventListener("resize", moveThumb);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveThumb);

    /* Örnek arama yalnız alan boşken, sayfa görünürken ve hareket açıkken döner.
       Kullanıcı konsola dokununca veya odaklanınca kalıcı olarak durur.
       Kimse dokunmazsa listeyi bir kez gösterir ve ilk kelimede durur. */
    var shown = 0;
    var timer = window.setInterval(function () {
      if (reduce.matches || document.hidden || input.value) return;
      index = (index + 1) % modes[mode].words.length;
      showWord(modes[mode].words[index], true);
      shown += 1;
      if (shown >= modes[mode].words.length) stop();
    /* Bekleme süresi de merkezi tokendır (--dwell). */
    }, dur("--dwell"));
    function stop() { window.clearInterval(timer); }
    box.addEventListener("focusin", stop);
    box.addEventListener("pointerdown", stop);
  })();

  /* 3b. Kategori menüsü. Düğmeyle açılır ve kapanır, üzerine gelmeyle açılmaz.
     Üst kategori düğmesi kendi alt menüsünü açar. Aynı anda tek alt menü açıktır.
     Geniş ekranda (iki bölme) her zaman bir alt menü açıktır.
     Dar ekranda (akordeon) açık olana yeniden dokunmak onu kapatır.
     Escape menüyü kapatır ve odağı düğmeye geri verir. Kapalı bölümler klavyeden gizlidir. */
  (function () {
    var btn = $(".nav__all--js");
    var panel = $("#mega");
    if (!btn || !panel) return;
    /* Menünün görünen yüzeyi. Çevresindeki saydam kenar payı menünün dışı sayılır. */
    var sheet = $(".mega__panel", panel);
    var cats = $$(".mega__cat", panel);
    var wide = window.matchMedia("(min-width: 1024px)");
    function expanded(c) { return c.getAttribute("aria-expanded") === "true"; }
    function openCat(target, toggle) {
      var next = toggle && expanded(target) ? null : target;
      cats.forEach(function (c) {
        var sub = document.getElementById(c.getAttribute("aria-controls"));
        var on = c === next;
        c.setAttribute("aria-expanded", on ? "true" : "false");
        sub.dataset.open = on ? "true" : "false";
        sub.inert = !on;
      });
    }
    function ensureOne() { if (wide.matches && !cats.some(expanded)) openCat(cats[0], false); }
    function isOpen() { return btn.getAttribute("aria-expanded") === "true"; }
    function set(open, returnFocus) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.dataset.open = open ? "true" : "false";
      panel.inert = !open;
      if (open) ensureOne();
      if (!open && returnFocus) btn.focus();
    }
    cats.forEach(function (c, i) {
      c.addEventListener("click", function () { openCat(c, !wide.matches); });
      /* Ok tuşları üst kategoriler arasında odağı taşır. Böylece alt menü bağlantılarını
         tek tek geçmeden sonraki kategoriye ulaşılır. Seçimi Enter ya da boşluk yapar. */
      c.addEventListener("keydown", function (e) {
        var to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? cats.length - 1 : null;
        if (to === null) return;
        /* Bu tuşlar menünün içinde kalır. İlk ya da son kategoride de sayfa kaymaz. */
        e.preventDefault();
        cats[Math.max(0, Math.min(cats.length - 1, to))].focus();
      });
    });
    btn.addEventListener("click", function () { set(!isOpen(), false); });
    /* Menüdeki sayfa içi bağlantı (teklif isteği) menüyü kapatır. Sayfa hedefe gider, menü üstünde kalmaz. */
    $$("[data-mega-kapat]", panel).forEach(function (a) { a.addEventListener("click", function () { set(false, false); }); });
    wide.addEventListener("change", ensureOne);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) set(false, true); });
    /* Menü yüzeyinin dışına dokunmak menüyü kapatır. Yüzeyin yanındaki saydam pay da dışarıdır. */
    document.addEventListener("pointerdown", function (e) {
      if (isOpen() && !sheet.contains(e.target) && !btn.contains(e.target)) set(false, false);
    });
    /* Odak menünün ve düğmesinin dışındaki bir öğeye geçince menü kapanır.
       Böylece açık menü sayfanın üstünde unutulmaz. Dinleyici belgededir, çünkü Safari
       fareyle tıklanan düğmeye odak vermez ve düğmeden "odak çıktı" olayı gelmez. */
    document.addEventListener("focusin", function (e) {
      if (isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) set(false, false);
    });
  })();

  /* 4. Arama formları canlı sitedeki sonuç sayfasına gider. Boş arama gönderilmez.
     Üst arama ile karşılama araması aynı değeri taşır. */
  (function () {
    var forms = $$("form[data-search]");
    forms.forEach(function (f) {
      var input = $("input", f);
      f.addEventListener("submit", function (e) {
        if (input.value.trim()) return;
        e.preventDefault();
        input.focus();
      });
      input.addEventListener("input", function () {
        forms.forEach(function (o) { var i = $("input", o); if (i !== input) i.value = input.value; });
      });
    });
  })();

  /* 4b. Teklif isteği formu. Ürün adı boşsa hata alanın altında yazar ve odak alana gider.
     Bu sayfa bir tasarım önerisi olduğu için istek gönderilmez. Bunu sahte bir başarı
     mesajıyla gizlemeyiz, açıkça söyleriz. */
  (function () {
    var form = $("[data-rfq]");
    if (!form) return;
    var product = $("#t-urun", form);
    var err = $("#t-urun-hata", form);
    var note = $("[data-rfq-note]", form);
    var done = $("[data-rfq-done]", form);
    function setError(on) {
      err.hidden = !on;
      /* Alanın çerçevesi durumu bu öznitelikten okur. */
      product.parentNode.dataset.invalid = on ? "true" : "false";
      if (on) {
        product.setAttribute("aria-invalid", "true");
        product.setAttribute("aria-describedby", err.id);
      } else {
        product.removeAttribute("aria-invalid");
        product.removeAttribute("aria-describedby");
      }
    }
    product.addEventListener("input", function () { if (product.value.trim()) setError(false); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var empty = !product.value.trim();
      setError(empty);
      note.hidden = !empty;
      done.hidden = empty;
      if (empty) { product.focus(); announce("Ürün adını yazın."); }
      else announce("İsteğiniz gönderilmedi. Bu sayfa bir tasarım önerisidir.");
    });
  })();

  /* 5. Sepet durumu. Sayı, toplam ve düğmeler anında güncellenir. */
  var cart = (function () {
    var lines = {};
    var badges = $$("[data-cart]");
    var links = $$("[data-cart-link]");
    var bar = $("[data-cartbar]");
    var unitsEl = $("[data-cart-units]");
    var totalEl = $("[data-cart-total]");
    var shown = 0;
    function paint(instant) {
      var keys = Object.keys(lines);
      var units = 0, total = 0;
      keys.forEach(function (k) { units += lines[k].qty; total += lines[k].qty * unitOf(lines[k].src); });
      /* Sayaç yalnız ürün sayısı değişince zıplar. Para birimi ya da adet değişince zıplamaz. */
      var changed = keys.length !== shown;
      shown = keys.length;
      badges.forEach(function (b) {
        b.textContent = keys.length;
        b.hidden = keys.length === 0;
        if (!changed) return;
        b.classList.remove("is-bump");
        void b.offsetWidth;
        b.classList.add("is-bump");
      });
      /* Sepet bağlantıları canlı sitedeki sepeti açar. Sayaç ise bu örnek sepeti sayar. Etiket ikisini de söyler. */
      links.forEach(function (l) { l.setAttribute("aria-label", "Canlı sepeti açın. Örnek sepette " + keys.length + " ürün var."); });
      unitsEl.textContent = keys.length ? keys.length + " ürün, " + tr(units) + " adet" : "Sepetiniz boş";
      /* Para birimi değişince toplam geçişsiz yazılır. Yeni simgeyle görünen ara sayı gerçek bir tutar olmazdı. */
      if (instant === true) totalEl._v = total;
      tween(totalEl, total, dur("--dur-3"), function (v) { totalEl.textContent = money(v); });
      bar.classList.toggle("is-on", keys.length > 0);
      bar.inert = keys.length === 0;
      /* Çubuk açıkken sayfanın alt payı çubuğun yüksekliği kadar büyür (--dock).
         Böylece içerik ve odaklanan öğe çubuğun altında kalmaz. */
      root.classList.toggle("has-cartbar", keys.length > 0);
      root.style.setProperty("--cartbar-h", bar.offsetHeight + "px");
      $$(".pc").forEach(function (card) {
        var on = !!lines[card.dataset.slug];
        var b = $(".pc__add", card);
        var moq = card.dataset.moq;
        /* Erişilebilir ad sabit kalır. Durumu yalnız aria-pressed bildirir. */
        b.setAttribute("aria-pressed", on ? "true" : "false");
        $("span", b).textContent = on ? "Sepette" : moq + " adet ekleyin";
      });
    }
    /* Ekran daralınca çubuğun metni alt satıra geçebilir. Alt pay yeniden ölçülür. */
    window.addEventListener("resize", function () { root.style.setProperty("--cartbar-h", bar.offsetHeight + "px"); });
    return {
      /* Sepet bu öneride canlı siteye bağlı değildir. Duyuru da bunu söyler. */
      /* src: birim fiyatı taşıyan öğe. Fiyat, seçili para birimine göre bu öğeden okunur. */
      set: function (slug, name, src, qty) { lines[slug] = { name: name, src: src, qty: qty }; paint(); announce(name + ": " + tr(qty) + " adet örnek sepette. Ürün canlı sepete eklenmedi."); },
      remove: function (slug, name) { delete lines[slug]; paint(); announce(name + " örnek sepetten çıkarıldı."); },
      has: function (slug) { return !!lines[slug]; },
      repaint: paint
    };
  })();
  $$(".pc").forEach(function (card) {
    $(".pc__add", card).addEventListener("click", function () {
      var d = card.dataset;
      if (cart.has(d.slug)) cart.remove(d.slug, d.name);
      else cart.set(d.slug, d.name, card, parseInt(d.moq, 10));
    });
  });

  /* 6. Örnek sipariş paneli: adet en az sipariş adedinin katlarıyla artar. */
  var order = (function () {
    var box = $("[data-order]");
    if (!box) return { repaint: function () {} };
    var moq = parseInt(box.dataset.moq, 10);
    var qty = moq;
    var out = $("[data-qty]", box);
    var total = $("[data-total]", box);
    var totalSr = $("[data-total-sr]", box);
    var dec = $("[data-dec]", box);
    total._v = qty * unitOf(box);
    function paint(instant) {
      var sum = qty * unitOf(box);
      out.textContent = tr(qty);
      dec.setAttribute("aria-disabled", qty <= moq ? "true" : "false");
      totalSr.textContent = "Toplam " + money(sum);
      if (instant === true) total._v = sum;
      tween(total, sum, dur("--dur-3"), function (v) { total.textContent = money(v); });
    }
    $("[data-inc]", box).addEventListener("click", function () { qty += moq; paint(); });
    dec.addEventListener("click", function () { if (qty > moq) { qty -= moq; paint(); } });
    $("[data-order-add]").addEventListener("click", function () {
      cart.set(box.dataset.slug, box.dataset.name, box, qty);
    });
    return { repaint: paint };
  })();

  /* 7. Kaydırınca beliren öğeler ve sayaçlar. */
  (function () {
    var items = $$("[data-reveal]");
    var stats = $("[data-stats]");
    function countUp() {
      $$("[data-count]", stats).forEach(function (el) {
        var to = parseInt(el.dataset.count, 10);
        el._v = 0;
        tween(el, to, dur("--dur-5"), function (v) { el.textContent = tr(v); });
      });
    }
    if (!("IntersectionObserver" in window) || reduce.matches) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        /* Yatay şeritte ilk kart görününce kardeşleri de belirir. */
        var rail = en.target.parentNode.hasAttribute("data-reveal-rail");
        var group = rail ? $$("[data-reveal]", en.target.parentNode) : [en.target];
        group.forEach(function (el) { el.classList.add("is-in"); io.unobserve(el); });
      });
    /* Öğe ekrana ilk girdiği anda belirir. Böylece ekranın kenarında boş bir modül görünmez. */
    }, { rootMargin: "0px", threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
    if (stats) {
      var so = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        so.disconnect();
        countUp();
      }, { threshold: 0.4 });
      so.observe(stats);
    }
  })();

  /* 8. Ürün süzgeci: seçim anında uygulanır, kartlar yeni yerine kayar. */
  (function () {
    var buttons = $$("[data-filter]");
    var items = $$("#urun-listesi > li");
    var current = "";
    /* Her zaman son seçimi uygular. Art arda tıklamada eski geçiş listeyi geri almaz. */
    function apply() {
      items.forEach(function (li) {
        li.hidden = !!current && li.dataset.cat !== current;
        li.classList.add("is-in");
      });
      /* Kart sayısı değişince şerit başa döner ve kaydırma ipuçları yeniden hesaplanır. */
      items[0].parentNode.scrollLeft = 0;
      rails.sync();
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.dataset.filter;
        current = key;
        buttons.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        if (document.startViewTransition && !reduce.matches && !document.hidden) {
          /* Geçiş atlanırsa (art arda tıklama, arka plan sekmesi) liste yine güncellenir. */
          var vt = document.startViewTransition(apply);
          [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (p) { if (p) p.catch(function () {}); });
        } else apply();
        var n = items.filter(function (li) { return !key || li.dataset.cat === key; }).length;
        announce(n + " ürün gösteriliyor.");
      });
    });
  })();

  /* 9. Güvence adımları: çizgi kaydırmayla dolar, geçilen adım yanar. */
  (function () {
    var box = $("[data-tl]");
    if (!box) return;
    var rail = $(".tl__rail", box);
    var steps = $$(".tl > li", box);
    frame.add(function () {
      var line = window.innerHeight * 0.62;
      var r = rail.getBoundingClientRect();
      return {
        p: r.height > 0 ? Math.max(0, Math.min(1, (line - r.top) / r.height)) : 0,
        on: steps.map(function (li) {
          var m = li.firstElementChild.getBoundingClientRect();
          return m.top + m.height / 2 < line;
        })
      };
    }, function (now) {
      rail.style.setProperty("--p", now.p.toFixed(4));
      steps.forEach(function (li, i) { li.classList.toggle("is-on", now.on[i]); });
    });
  })();

  /* 10. Sık sorulanlar: tek tek açılır. Kapalı yanıt klavye ve okuyucudan gizlenir. */
  $$(".faq").forEach(function (item) {
    var btn = $("button", item);
    var panel = $(".faq__panel", item);
    panel.inert = true;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.dataset.open = open ? "true" : "false";
      panel.inert = !open;
    });
  });

  /* 11. Katlanan gruplar: dizin grupları ve alt bölüm sütunları.
     Dar ekranda başlık bir düğmedir. Grup onunla açılır ve kapanır. Durumu data-open ve aria-expanded taşır.
     Geniş ekranda ve kâğıtta başlık düz yazıdır ve grup hep açıktır. Bunu CSS yapar, betik yalnız durumu yazar.
     Durum ekran genişliğine bağlı değildir. Kullanıcının açtığı grup, ekran dönüp yeniden daralınca da açık kalır. */
  (function () {
    var groups = $$("[data-fold]").map(function (el) {
      var g = { el: el, btn: $(".fold__btn", el), panel: $(".fold__panel", el) };
      /* Başlığın metni sayfada bir kez yazılıdır (düz başlık). Düğme o metnin kopyasını betikle alır.
         Böylece arama motoru ve okuma modu başlığı bir kez okur. Betik yokken düğme zaten görünmez. */
      var copy = $(".fold__label", el).cloneNode(true);
      var chev = g.btn.firstChild;
      while (copy.firstChild) g.btn.insertBefore(copy.firstChild, chev);
      return g;
    });
    /* Kapalı grubun içi klavyeden ve ekran okuyucudan hemen gizlenir (inert). Kapanma geçişi sürerken de içine odak girmez.
       Bu yalnız başlığın düğme olduğu düzende geçerlidir. Geniş ekranda grup hep açıktır ve hiçbir bölüm gizlenmez. */
    function sync(g) { g.panel.inert = g.btn.getClientRects().length > 0 && g.el.dataset.open !== "true"; }
    function set(g, open) {
      g.el.dataset.open = open ? "true" : "false";
      g.btn.setAttribute("aria-expanded", open ? "true" : "false");
      sync(g);
    }
    function shown(el) { return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden"; }
    groups.forEach(function (g) {
      g.btn.addEventListener("click", function () { set(g, g.el.dataset.open !== "true"); });
    });
    /* Ekran genişleyince düğme gizlenir. Odak düğmedeyse grubun ilk bağlantısına geçer.
       Ekran daralınca kapalı bir grubun içindeki odak da kaybolmaz: o grup açılır ve odak yerinde kalır.
       Tarayıcı gizlenen öğedeki odağı bırakabilir. Bu yüzden son odaklanan öğe izlenir.
       Kullanıcı odağı kendisi bırakırsa (boş bir yere dokunursa) izlenen öğe unutulur.
       Odak, öğe gizlendiği için düştüyse izlenen öğe kalır ve denetim bir sonraki karede yinelenir. */
    var last = null;
    document.addEventListener("focusin", function (e) { last = e.target; });
    document.addEventListener("focusout", function (e) {
      if (e.relatedTarget) return;
      if (shown(e.target)) last = null;
      else requestAnimationFrame(keep);
    });
    function keep() {
      var active = document.activeElement;
      var away = !active || active === document.body || active === root;
      var from = away ? last : active;
      if (from) groups.forEach(function (g) {
        var button = g.btn.getClientRects().length > 0;
        if (from === g.btn && !button) {
          var first = $("a", g.panel);
          if (first) first.focus();
        } else if (button && g.el.dataset.open !== "true" && g.panel.contains(from)) {
          set(g, true);
          /* Odak düştüyse bölüm görünür olunca geri verilir. Bölüm bir sonraki karede görünür. */
          if (away) requestAnimationFrame(function () { requestAnimationFrame(function () { from.focus(); }); });
        }
      });
      /* Odak işlendikten sonra kapalı bölümler gizlenir. Önce gizlenseydi odaktaki bağlantı düşerdi. */
      groups.forEach(sync);
    }
    groups.forEach(sync);
    /* Düğme görünür ya da gizli olunca boyutu değişir. Gözlemci bunu yerleşim kurulduktan sonra bildirir.
       Böylece denetim, tarayıcının yeni genişliğe göre kurduğu yerleşimle yapılır. */
    if ("ResizeObserver" in window) {
      var watch = new ResizeObserver(keep);
      groups.forEach(function (g) { watch.observe(g.btn); });
    }
  })();

  /* 12. Dil ve para birimi: her grup bir radyo grubudur. Ok tuşları seçimi ve odağı birlikte taşır.
     Para birimi seçimi sayfadaki fiyatları gerçekten değiştirir. Dil seçimi bu öneride sayfayı çevirmez,
     duyuru bunu açıkça söyler. */
  (function () {
    var labels = $$("[data-tercih-deger]");
    function chosen(kind) { return $('[data-tercih="' + kind + '"] [aria-checked="true"]'); }
    function writeLabel() {
      var lang = chosen("dil"), cur = chosen("para");
      if (!lang || !cur) return;
      labels.forEach(function (el) {
        /* Dil adı kendi dilinde yazılıdır (örneğin Русский). Ekran okuyucu adı doğru dille okusun diye dil kodu eklenir. */
        var name = document.createElement("span");
        name.lang = lang.dataset.deger;
        name.dir = "auto";
        name.textContent = lang.dataset.ad;
        el.textContent = "";
        el.appendChild(name);
        el.appendChild(document.createTextNode(", " + cur.dataset.deger));
      });
    }
    $$("[data-tercih]").forEach(function (group) {
      var kind = group.dataset.tercih;
      var radios = $$('[role="radio"]', group);
      function select(radio, focus) {
        radios.forEach(function (r) {
          var on = r === radio;
          r.setAttribute("aria-checked", on ? "true" : "false");
          r.tabIndex = on ? 0 : -1;
        });
        if (focus) radio.focus();
        writeLabel();
        if (kind === "para") {
          para = { code: radio.dataset.deger, sym: $(".pref__mark", radio).textContent };
          paintPrices();
          cart.repaint(true);
          order.repaint(true);
          announce(radio.dataset.ad + " seçildi. Fiyatlar bu para biriminde gösteriliyor.");
        } else announce(radio.dataset.ad + " seçildi. Bu öneride dil seçimi sayfanın dilini değiştirmez.");
      }
      radios.forEach(function (r, i) {
        r.addEventListener("click", function () { if (r.getAttribute("aria-checked") !== "true") select(r, false); });
        r.addEventListener("keydown", function (e) {
          var step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          select(radios[(i + step + radios.length) % radios.length], true);
        });
      });
    });
  })();

  /* 13. İşaretçi ışığı. Koyu bantta ışık işaretçiyi izler, kartın üstünde yumuşak bir ışık belirir.
     Betik yalnız işaretçinin yerini yazar. Geçişi CSS, merkezi eğriyle yapar.
     Değerler bandın bütününe değil, ışık katmanına yazılır (.spot). Böylece bandın içeriği her karede yeniden hesaplanmaz.
     --mx ve --my ızgaranın aydınlanan yerini, --dx ve --dy ışığın durağan yerinden ne kadar kaydığını bildirir.
     Dokunmatik ekranda ve hareket azaltma tercihinde ışık sabit durur. */
  (function () {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var last = null;
    var ticking = false;
    function flush() {
      ticking = false;
      var e = last;
      if (!e || !e.target || !e.target.closest) return;
      var band = e.target.closest("[data-spot]");
      var card = e.target.closest("[data-glow]");
      var spot = band ? band.querySelector(":scope > .spot") : null;
      var light = spot ? $("i", spot) : null;
      /* Önce ölçülür, sonra yazılır. */
      var b = spot ? spot.getBoundingClientRect() : null;
      var c = card ? card.getBoundingClientRect() : null;
      var restX = light ? light.offsetLeft + light.offsetWidth / 2 : 0;
      var restY = light ? light.offsetTop + light.offsetHeight / 2 : 0;
      if (spot) {
        var x = Math.round(e.clientX - b.left);
        var y = Math.round(e.clientY - b.top);
        spot.style.setProperty("--mx", x + "px");
        spot.style.setProperty("--my", y + "px");
        spot.style.setProperty("--dx", Math.round(x - restX) + "px");
        spot.style.setProperty("--dy", Math.round(y - restY) + "px");
      }
      if (card) {
        card.style.setProperty("--gx", Math.round(e.clientX - c.left) + "px");
        card.style.setProperty("--gy", Math.round(e.clientY - c.top) + "px");
      }
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" || !fine.matches || reduce.matches) return;
      last = e;
      if (!ticking) { ticking = true; requestAnimationFrame(flush); }
    }, { passive: true });
  })();

  /* 14. Koyu bandın ızgarası. Yatay çizgiler sayfa kaydıkça içerikten yavaş kayar (--sy).
     Değer kaydırmaya bağlıdır, geçiş kullanmaz. Değer ışık katmanına yazılır, bandın bütününe değil.
     Hareket azaltma tercihi her karede yeniden okunur. Tercih sonradan açılırsa ızgara yerine döner ve durur. */
  (function () {
    var spots = $$(".band--ink > .spot");
    if (!spots.length) return;
    frame.add(function () {
      if (reduce.matches) return null;
      var h = window.innerHeight;
      return spots.map(function (el) {
        var r = el.getBoundingClientRect();
        return r.bottom < 0 || r.top > h ? null : Math.round(r.top * -0.12);
      });
    }, function (list) {
      spots.forEach(function (el, i) {
        if (!list) el.style.removeProperty("--sy");
        else if (list[i] !== null) el.style.setProperty("--sy", list[i] + "px");
      });
    });
  })();

  /* Kaydırmaya bağlı değerlerin ilk hali. */
  frame.run();
  window.addEventListener("load", frame.run);
})();
