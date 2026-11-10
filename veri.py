# Veri toplayıcı. Çalıştırma: python3 veri.py
# istoc.com açık uçlarından ana sayfanın kullandığı bütün olguları alır ve data/ klasörüne yazar.
# build.py yalnız bu dosyaları okur, ağa çıkmaz. Sayfadaki her sayı ve kaynaklı cümle bu dosyalara dayanır.
#   kategoriler.json  kategori ağacı (menü öğeleri)
#   sayilar.json      kategori başına ürün sayısı
#   kur.json          döviz kuru
#   ana-sayfa.json    toplamlar, seçilen ürünlerin ve üreticilerin olguları, alındığı gün
#   dizin.json        dizin öğeleri: ürün grupları, arama sonuç sayıları, mağazalar, markalar ve açıldığı denetlenen sayfalar
#   kaynaklar.json    kaynaklı cümleler: kaynağın adresi, aranan kanıt ifadesi, bulunduğu yer ve gün
# Kural: bir istek başarısız olursa ya da bir kanıt bulunamazsa betik durur ve hiçbir dosyayı yazmaz.
# Böylece ağ hatası "sıfır ürün" gibi yanlış bir olguya dönüşmez.
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from secim import DIZIN, IDDIALAR, KAYNAKLAR, MAGAZA_NOTU, ORNEK_URUN, SAYFALAR, URETICILER, URUNLER

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
SITE = "https://istoc.com"
API = SITE + "/api/method/tradehub_core.api."
TODAY = time.strftime("%Y-%m-%d")
AGENT = {"User-Agent": "Mozilla/5.0 (tasarim-onerisi veri toplayici)"}
_cache = {}


def fetch(url):
    """Adresin ham metni ve son adresi. Geçici hata için üç kez dener. Yine olmazsa hata verir."""
    if url in _cache:
        return _cache[url]
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=30) as r:
                _cache[url] = (r.read().decode("utf-8", "replace"), r.geturl(), r.status)
                return _cache[url]
        except urllib.error.HTTPError as e:
            if e.code in (404, 410):
                _cache[url] = ("", url, e.code)
                return _cache[url]
            last = e
        except Exception as e:  # ağ hatası
            last = e
        time.sleep(1 + attempt)
    raise SystemExit("HATA: %s alınamadı: %s. Hiçbir dosya yazılmadı." % (url, last))


def raw(url):
    text, _final, status = fetch(url)
    if status != 200:
        raise SystemExit("HATA: %s açılmadı (durum %s). Hiçbir dosya yazılmadı." % (url, status))
    return text


def get(path, **params):
    return json.loads(raw(API + path + ("?" + urllib.parse.urlencode(params) if params else "")))["message"]


def total_of(path, what, **params):
    """Bir listenin toplamı. Yanıtta toplam yoksa sıfır yazılmaz, betik durur."""
    total = get(path, **params).get("total")
    if not isinstance(total, int):
        raise SystemExit("HATA: %s okunamadı. Hiçbir dosya yazılmadı." % what)
    return total


def clean(slug):
    # "ev-ve-mutfak-gerecleri-0cc3c707" -> "ev-ve-mutfak-gerecleri"
    return re.sub(r"-[0-9a-f]{8}$", "", slug)


def flat(text):
    return re.sub(r"\s+", " ", text).replace("’", "'")


def page_text(url):
    """Sunucunun gönderdiği sayfanın görünen metni. Yorumlar, betikler ve stiller sayılmaz."""
    page = re.sub(r"<!--[\s\S]*?-->", " ", raw(url))
    return flat(html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", " ", page))))


# --- Tarayıcıda kurulan sayfalar -------------------------------------------------
# Böyle bir sayfanın metni iki yerde durur: sayfanın kendi kodunda ve dil paketinde.
# Dil paketi bütün sitenin metnini taşır. İçinde hiçbir sayfanın göstermediği metin de bulunur.
# Bu yüzden dil paketindeki bir metin, ancak sayfanın kodu o metnin anahtarını adıyla çağırıyorsa kanıt sayılır.
LOCALE_FILE = re.compile(r"/assets/(tr|en|ar|ru)-[A-Za-z0-9_-]{8}\.js$")
IDENT = re.compile(r"[A-Za-z0-9_$]+")
REST = re.compile(r"[^,}\]]*")


def parse_locale(src):
    """Dil paketini (JavaScript nesnesi) düz bir sözlüğe çevirir: "sellPage.feeNote" -> [metin]."""
    out = {}
    try:
        i = src.index("={", src.index("const ")) + 1
    except ValueError:
        raise SystemExit("HATA: dil paketinin başı bulunamadı. Hiçbir dosya yazılmadı.")

    def ws(i):
        while src[i] in " \n\r\t":
            i += 1
        return i

    def string(i):
        quote, j, buf = src[i], i + 1, []
        while src[j] != quote:
            if src[j] == "\\":
                nxt = src[j + 1]
                if nxt == "u":
                    buf.append(chr(int(src[j + 2:j + 6], 16)))
                    j += 6
                    continue
                buf.append({"n": " ", "t": " ", "r": " "}.get(nxt, nxt))
                j += 2
            else:
                buf.append(src[j])
                j += 1
        return "".join(buf), j + 1

    def value(i, path):
        i = ws(i)
        ch = src[i]
        if ch == "{":
            i = ws(i + 1)
            while src[i] != "}":
                if src[i] in "\"'`":
                    key, i = string(i)
                else:
                    m = IDENT.match(src, i)
                    key, i = m.group(0), m.end()
                i = ws(i)
                if src[i] != ":":  # kısa yazım: {ad} biçiminde başka parçadan gelen değer
                    i = ws(i + 1) if src[i] == "," else i
                    continue
                i = ws(value(i + 1, path + [key]))
                if src[i] == ",":
                    i = ws(i + 1)
            return i + 1
        if ch == "[":
            i = ws(i + 1)
            while src[i] != "]":
                i = ws(value(i, path + ["[]"]))
                if src[i] == ",":
                    i = ws(i + 1)
            return i + 1
        if ch in "\"'`":
            text, i = string(i)
            out.setdefault(".".join(path), []).append(flat(text))
            return i
        return REST.match(src, i).end()  # sayı, başka parçadan gelen ad ya da kısa mantık değeri

    try:
        value(i, [])
    except (IndexError, AttributeError) as e:
        raise SystemExit("HATA: dil paketi çözümlenemedi (%s). Hiçbir dosya yazılmadı." % e)
    return out


def app_parts(url):
    """Sayfanın kendi kodu (HTML ve dil paketi olmayan betikler) ve Türkçe dil paketinin sözlüğü."""
    page = raw(url)
    code = [page]
    names = set()
    for a in sorted(set(re.findall(r"/assets/[A-Za-z0-9_.-]+\.js", page))):
        if LOCALE_FILE.search(a):
            continue
        t = raw(SITE + a)
        code.append(t)
        names.update(re.findall(r"\btr-[A-Za-z0-9_-]{8}\.js", t))
    if not names:
        raise SystemExit("HATA: %s için Türkçe dil paketi bulunamadı. Hiçbir dosya yazılmadı." % url)
    keys = {}
    for name in sorted(names):
        for k, v in parse_locale(raw(SITE + "/assets/" + name)).items():
            keys.setdefault(k, []).extend(v)
    # Koddaki metin kaçış işaretleriyle yazılıdır (\", \' ve \n). Arama için sadeleştirilir.
    return flat(" ".join(code).replace('\\"', '"').replace("\\'", "'").replace("\\n", " ")), keys


def where_in_app(proof, code, keys):
    """Kanıtın bulunduğu yer: "kod" ya da "dil: anahtar". Bulunamazsa ya da sayfa anahtarı çağırmıyorsa None."""
    if proof in code:
        return "kod"
    for path, values in keys.items():
        if "[]" in path or not any(proof in v for v in values):
            continue
        # "translation.auth.register.freeSignUp" anahtarını sayfa "register.freeSignUp" diye çağırır.
        ref = ".".join(path.split(".")[-2:])
        if re.search(r"[\"'`.]" + re.escape(ref) + r"(?![A-Za-z0-9_$])", code):
            return "dil: " + ref
    return None


# 1. Kategori ağacı
menu = get("category.get_mega_menu", lang="tr")
top = menu if isinstance(menu, list) else list(menu.values())
cats = []
for c in top:
    cats.append({
        "name": c["name"].strip(),
        "slug": c["slug"],
        "path": clean(c["slug"]),
        "children": [
            {
                "name": k["name"].strip(),
                "slug": k["slug"],
                "children": [{"name": g["name"].strip(), "slug": g["slug"]} for g in (k.get("children") or [])],
            }
            for k in (c.get("children") or [])
        ],
    })
print("kategori:", len(cats), "alt:", sum(len(c["children"]) for c in cats), "ürün grubu:", sum(len(k["children"]) for c in cats for k in c["children"]))

# 2. Kategori başına ürün sayısı. Tek ürünlük sayfa istenir, yalnız toplam okunur.
counts = {}
for c in cats:
    counts[c["path"]] = total_of("listing.get_listings", "%s kategorisinin ürün sayısı" % c["name"], category=c["slug"], page_size=1, lang="tr")
    time.sleep(0.2)
print("ürünü olan kategori:", sum(1 for v in counts.values() if v), "toplam ürün (kategorili):", sum(counts.values()))

# 3. Döviz kuru ve para birimleri
cur = get("currency.get_currency_settings", lang="tr")
rates = cur.get("rates", {}).get("TRY", {})
codes_cur = [c["code"] for c in cur.get("currencies", [])]
if not rates.get("USD") or any(not rates.get(c) for c in codes_cur):
    raise SystemExit("HATA: döviz kuru okunamadı. Hiçbir dosya yazılmadı.")
print("kur TRY->USD:", rates.get("USD"), "para birimleri:", codes_cur)

# 4. Ana sayfanın olguları
listing_total = total_of("listing.get_listings", "ürün toplamı", page_size=1, lang="tr")
sellers = get("seller.get_sellers", page_size=100, lang="tr")
if not sellers.get("sellers"):
    raise SystemExit("HATA: mağaza listesi boş geldi. Hiçbir dosya yazılmadı.")
by_slug = {s["slug"]: s for s in sellers["sellers"]}

urunler = {}
for slug, _img, _grup in URUNLER:
    d = get("listing.get_listing_detail", listing_id=slug, lang="tr")["data"]
    sup = d.get("supplier") or {}
    urunler[slug] = {
        "ad": d["title"].strip(),
        "fiyat_try": d["sellingPrice"],  # KDV hariç birim fiyat
        "kdv": d["vatRate"],
        "en_az_adet": d["moq"],
        "birim": d.get("unit") or "Adet",
        "katlarla_satilir": bool(d.get("sellInMoqMultiples")),
        "hazirlik": (d.get("leadTime") or "").strip(),
        "uretici": (sup.get("name") or "").strip(),
        "uretici_adres": sup.get("slug") or "",
        "uretici_sehir": (sup.get("city") or "").strip(),
        "uretici_dogrulanmis": bool(sup.get("kybVerified")),
        # İşletme türü mağaza listesinden gelir. Rozet "üretici" sözünü yalnız tür üreticiyse kullanır.
        "uretici_tur": (by_slug.get(sup.get("slug") or "") or {}).get("business_type") or "",
        "ozellikler": {s["label"].strip(): s["value"].strip() for s in (d.get("specs") or [])},
    }
    time.sleep(0.2)

# Mağazaların ürün sayıları. Dizinde yalnız işletmesi doğrulanmış mağazalar yer alır.
# Doğrulanmamış mağazanın adı veri dosyasına yazılmaz.
magazalar = []
for s in sellers["sellers"]:
    if not s.get("kybVerified"):
        continue
    magazalar.append({
        "ad": s["seller_name"].strip(),
        "adres": s["slug"],
        "sehir": (s.get("city") or "").strip(),
        "tur": s.get("business_type") or "",
        "kurulus": str(s.get("founded_year") or "").strip(),
        "fabrika_m2": str(s.get("factory_size") or "").strip(),
        "urun_sayisi": total_of("seller.get_seller_products", "%s mağazasının ürün sayısı" % s["slug"], seller_code=s["seller_code"], page=1, page_size=1),
    })
    time.sleep(0.2)
store = {m["adres"]: m for m in magazalar}

ureticiler = {}
for slug, _logo, _thumbs in URETICILER:
    if slug not in store:
        raise SystemExit("HATA: %s mağazası doğrulanmış mağazalar arasında yok. Hiçbir dosya yazılmadı." % slug)
    s, m = by_slug[slug], store[slug]
    ureticiler[slug] = {"ad": m["ad"], "sehir": m["sehir"], "tur": m["tur"], "kurulus": m["kurulus"], "fabrika_m2": m["fabrika_m2"], "dogrulanmis": True, "urun_sayisi": m["urun_sayisi"]}
    # Mağaza notu: kuruluş yılı alanı boşsa, mağazanın kendi açıklamasındaki bilgi kullanılır.
    # Bilgi açıklamada bulunamazsa betik durur.
    if slug in MAGAZA_NOTU:
        label, value, proof = MAGAZA_NOTU[slug]
        about = flat((s.get("short_description") or "") + " " + (s.get("description") or ""))
        if proof not in about:
            raise SystemExit("HATA: %s mağazasının açıklamasında \"%s\" bulunamadı. Hiçbir dosya yazılmadı." % (slug, proof))
        ureticiler[slug]["not"] = {"etiket": label, "deger": value, "kanit": proof}

# 5. Dizin: ürün grupları, markalar, arama sonuç sayıları ve sipariş adedi süzgeçleri
facets = get("listing.get_filter_facets", lang="tr")
facets = facets.get("data", facets)
urun_gruplari = [{"ad": c["name"].strip(), "adres": c["slug"], "sayi": c["count"], "yol": [p["name"].strip() for p in (c.get("path") or [])]} for c in facets.get("categories") or []]
markalar = [{"ad": b["label"].strip(), "adres": b["slug"], "sayi": b["count"]} for b in facets.get("brands") or [] if b.get("slug")]
if not urun_gruplari:
    raise SystemExit("HATA: ürün grupları okunamadı. Hiçbir dosya yazılmadı.")
aramalar, adetler = {}, {}
words = list(ORNEK_URUN)
for group in DIZIN:
    for _label, target in group.get("ogeler", []):
        if group["tur"] == "arama":
            words.append(target)
        elif isinstance(target, int):
            adetler[str(target)] = total_of("listing.get_listings", "en az %d adetle satılan ürün sayısı" % target, min_order=target, page_size=1, lang="tr")
for word in words:
    if word not in aramalar:
        aramalar[word] = total_of("listing.get_listings", "\"%s\" aramasının sonuç sayısı" % word, query=word, page_size=1, lang="tr")
        time.sleep(0.15)
empty = [w for w in ORNEK_URUN if not aramalar[w]]
if empty:
    raise SystemExit("HATA: örnek arama sonuç vermiyor: %s. Hiçbir dosya yazılmadı." % ", ".join(empty))
print("ürün grubu:", len(urun_gruplari), "marka:", len(markalar), "arama:", len(aramalar), "doğrulanmış mağaza:", len(magazalar))

# 6. Bağlantı verilen sayfalar açılıyor mu? Sayfa açılmalı ve başka bir sayfaya yönlenmemelidir.
sayfalar = {}
broken = []
for path in SAYFALAR:
    _text, final, status = fetch(SITE + path)
    landed = urllib.parse.urlsplit(final).path
    sayfalar[path] = {"durum": status, "son": landed}
    if status != 200 or landed.rstrip("/") != path.rstrip("/"):
        broken.append("%s (durum %s, son adres %s)" % (path, status, landed))
    time.sleep(0.1)
if broken:
    raise SystemExit("HATA: açılmayan ya da başka sayfaya yönlenen bağlantı var. Hiçbir dosya yazılmadı.\n  " + "\n  ".join(broken))
print("açıldığı denetlenen sayfa:", len(sayfalar))


def around(text, proof, span=70):
    """İfadenin kaynaktaki çevresi. Kanıtı bağlamıyla okumak içindir."""
    i = text.index(proof)
    return text[max(0, i - span): i + len(proof) + span].strip()


# 7. Kaynaklı cümleler: her cümlenin kanıt ifadesi kaynağında aranır.
texts, apps = {}, {}
for key, src in KAYNAKLAR.items():
    if src["tur"] == "sayfa":
        texts[key] = page_text(src["adres"])
    elif src["tur"] == "uygulama":
        apps[key] = app_parts(src["adres"])
    else:
        texts[key] = flat(json.dumps(json.loads(raw(src["adres"])), ensure_ascii=False))
ledger = []
missing = []
for sentence, key, proofs in IDDIALAR:
    found, context, lost = [], [], []
    for p in proofs:
        if key in apps:
            code, keys = apps[key]
            place = where_in_app(p, code, keys)
            if place:
                found.append(place)
                context.append(around(code, p) if place == "kod" else next(v for k, vs in keys.items() if k.endswith(place[5:]) for v in vs if p in v)[:220])
            else:
                lost.append(p)
        elif p in texts[key]:
            found.append("sayfa" if KAYNAKLAR[key]["tur"] == "sayfa" else "veri")
            context.append(around(texts[key], p))
        else:
            lost.append(p)
    if lost:
        missing.append("%s: %s" % (sentence, ", ".join(lost)))
    ledger.append({"metin": sentence, "kaynak": KAYNAKLAR[key]["adres"], "kanit": proofs, "yer": found, "baglam": context, "bulundu": not lost})
# Paket verisi yapısal olarak da denetlenir: hiçbir pakette komisyon yok, her pakette doğrulama rozeti var.
plans = json.loads(raw(KAYNAKLAR["paketler"]["adres"]))["message"]
codes = [p["plan_code"] for p in plans["plans"]]
with_commission = [p["plan_code"] for p in plans["plans"] if p.get("commission_active") or p.get("commission_rate")]
badge = [f for cat in plans["features_matrix"]["categories"] for f in cat["features"] if f["feature_key"] == "feature.storefront.manufacturer_badge_tier"]
verified_plans = [c for c in codes if badge and (badge[0]["values_by_plan"].get(c) or {}).get("text_value") not in (None, "", "Yok")]
if with_commission:
    missing.append("Komisyon alan paket var: %s" % ", ".join(with_commission))
if sorted(verified_plans) != sorted(codes):
    missing.append("Doğrulama rozeti her pakette yok: %s" % ", ".join(sorted(set(codes) - set(verified_plans))))
if missing:
    raise SystemExit("HATA: kaynakta bulunamayan kanıt var. Hiçbir dosya yazılmadı.\n  " + "\n  ".join(missing))
print("kaynaklı cümle:", len(ledger), "paket:", len(codes), "komisyonlu paket:", len(with_commission), "doğrulama rozetli paket:", len(verified_plans))


# 8. Bütün istekler başarılıysa dosyalar yazılır.
def save(name, value):
    json.dump(value, open(os.path.join(DATA, name), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


os.makedirs(DATA, exist_ok=True)
save("kategoriler.json", cats)
save("sayilar.json", counts)
save("kur.json", {"TRY": rates, "alindi": TODAY})
save("ana-sayfa.json", {
    "alindi": TODAY,
    "urun_toplami": listing_total,
    "magaza_toplami": sellers.get("total") or len(sellers["sellers"]),
    "dogrulanmis_magaza": len(magazalar),
    "para_birimleri": codes_cur,
    "urunler": urunler,
    "ureticiler": ureticiler,
})
save("dizin.json", {
    "alindi": TODAY,
    "urun_gruplari": urun_gruplari,
    "markalar": markalar,
    "aramalar": aramalar,
    "adetler": adetler,
    "magazalar": magazalar,
    "sayfalar": sayfalar,
})
save("kaynaklar.json", {
    "alindi": TODAY,
    "paketler": {"sayi": len(codes), "komisyonlu": len(with_commission), "dogrulama_rozetli": len(verified_plans)},
    "iddialar": ledger,
})
print("ürün toplamı:", listing_total, "mağaza:", sellers.get("total"), "doğrulanmış:", len(magazalar))
print("seçilen ürün:", len(urunler), "seçilen üretici:", len(ureticiler))
print("veri yazıldı:", TODAY)
sys.exit(0)
