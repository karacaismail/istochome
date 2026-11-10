# Veri toplayıcı. Çalıştırma: python3 veri.py
# istoc.com açık uçlarından ana sayfanın kullandığı bütün olguları alır ve data/ klasörüne yazar.
# build.py yalnız bu dosyaları okur, ağa çıkmaz. Sayfadaki her sayı ve kaynaklı cümle bu dosyalara dayanır.
#   kategoriler.json  kategori ağacı (menü öğeleri)
#   sayilar.json      kategori başına ürün sayısı
#   kur.json          döviz kuru
#   ana-sayfa.json    toplamlar, seçilen ürünlerin ve üreticilerin olguları, alındığı gün
#   kaynaklar.json    kaynaklı cümleler: kaynağın adresi, aranan kanıt ifadesi ve bulunduğu gün
# Kural: bir istek başarısız olursa ya da bir kanıt bulunamazsa betik durur ve hiçbir dosyayı yazmaz.
# Böylece ağ hatası "sıfır ürün" gibi yanlış bir olguya dönüşmez.
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from secim import IDDIALAR, KAYNAKLAR, MAGAZA_NOTU, URETICILER, URUNLER

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
SITE = "https://istoc.com"
API = SITE + "/api/method/tradehub_core.api."
TODAY = time.strftime("%Y-%m-%d")


def raw(url):
    """Adresin ham metni. Geçici hata için üç kez dener. Yine olmazsa hata verir."""
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (tasarim-onerisi veri toplayici)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # ağ hatası
            last = e
            time.sleep(1 + attempt)
    raise SystemExit("HATA: %s alınamadı: %s. Hiçbir dosya yazılmadı." % (url, last))


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
    return re.sub(r"\s+", " ", text)


def page_text(url):
    """Sunucunun gönderdiği sayfanın görünen metni."""
    page = raw(url)
    return flat(html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", " ", page)))).replace("\u2019", "'")


def app_text(url):
    """Tarayıcıda kurulan sayfanın metin kaynağı: sayfanın betikleri ve Türkçe dil paketi."""
    page = raw(url)
    parts = [page]
    locale = set()
    for a in sorted(set(re.findall(r"/assets/[A-Za-z0-9_.-]+\.js", page))):
        t = raw(SITE + a)
        parts.append(t)
        locale.update(re.findall(r"tr-[A-Za-z0-9_-]{6,}\.js", t))
    if not locale:
        raise SystemExit("HATA: %s için Türkçe dil paketi bulunamadı. Hiçbir dosya yazılmadı." % url)
    for name in sorted(locale):
        parts.append(raw(SITE + "/assets/" + name))
    # Dil paketindeki metin kaçış işaretleriyle yazılıdır (\", \' ve \n). Arama için sadeleştirilir.
    return flat(" ".join(parts).replace('\\"', '"').replace("\\'", "'").replace("\\n", " ").replace("\u2019", "'"))


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
    time.sleep(0.3)
print("ürünü olan kategori:", sum(1 for v in counts.values() if v), "toplam ürün (kategorili):", sum(counts.values()))

# 3. Döviz kuru ve para birimleri
cur = get("currency.get_currency_settings", lang="tr")
rates = cur.get("rates", {}).get("TRY", {})
if not rates.get("USD"):
    raise SystemExit("HATA: TRY ve USD kuru okunamadı. Hiçbir dosya yazılmadı.")
print("kur TRY->USD:", rates.get("USD"))

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
    time.sleep(0.3)

ureticiler = {}
for slug, _logo, _thumbs in URETICILER:
    if slug not in by_slug:
        raise SystemExit("HATA: %s mağazası mağaza listesinde yok. Hiçbir dosya yazılmadı." % slug)
    s = by_slug[slug]
    ureticiler[slug] = {
        "ad": s["seller_name"].strip(),
        "sehir": (s.get("city") or "").strip(),
        "tur": s.get("business_type") or "",
        "kurulus": str(s.get("founded_year") or "").strip(),
        "fabrika_m2": str(s.get("factory_size") or "").strip(),
        "dogrulanmis": bool(s.get("kybVerified")),
        "urun_sayisi": total_of("seller.get_seller_products", "%s mağazasının ürün sayısı" % slug, seller_code=s["seller_code"], page=1, page_size=1),
    }
    # Mağaza notu: kuruluş yılı alanı boşsa, mağazanın kendi açıklamasındaki bilgi kullanılır.
    # Bilgi açıklamada bulunamazsa betik durur.
    if slug in MAGAZA_NOTU:
        label, value, proof = MAGAZA_NOTU[slug]
        about = flat((s.get("short_description") or "") + " " + (s.get("description") or "")).replace("\u2019", "'")
        if proof not in about:
            raise SystemExit("HATA: %s mağazasının açıklamasında \"%s\" bulunamadı. Hiçbir dosya yazılmadı." % (slug, proof))
        ureticiler[slug]["not"] = {"etiket": label, "deger": value, "kanit": proof}
    time.sleep(0.3)

def around(text, proof, span=70):
    """İfadenin kaynaktaki çevresi. Kanıtı bağlamıyla okumak içindir."""
    i = text.index(proof)
    return text[max(0, i - span): i + len(proof) + span].strip()


# 5. Kaynaklı cümleler: her cümlenin kanıt ifadesi kaynağında aranır.
texts = {}
for key, src in KAYNAKLAR.items():
    if src["tur"] == "sayfa":
        texts[key] = page_text(src["adres"])
    elif src["tur"] == "uygulama":
        texts[key] = app_text(src["adres"])
    else:
        texts[key] = flat(json.dumps(json.loads(raw(src["adres"])), ensure_ascii=False))
ledger = []
missing = []
for sentence, key, proofs in IDDIALAR:
    lost = [p for p in proofs if p not in texts[key]]
    if lost:
        missing.append("%s: %s" % (sentence, ", ".join(lost)))
    ledger.append({"metin": sentence, "kaynak": KAYNAKLAR[key]["adres"], "kanit": proofs, "baglam": [around(texts[key], p) for p in proofs if p in texts[key]], "bulundu": not lost})
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


# 6. Bütün istekler başarılıysa dosyalar yazılır.
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
    "dogrulanmis_magaza": sum(1 for s in sellers["sellers"] if s.get("kybVerified")),
    "para_birimleri": [c["code"] for c in cur.get("currencies", [])],
    "urunler": urunler,
    "ureticiler": ureticiler,
})
save("kaynaklar.json", {
    "alindi": TODAY,
    "paketler": {"sayi": len(codes), "komisyonlu": len(with_commission), "dogrulama_rozetli": len(verified_plans)},
    "iddialar": ledger,
})
print("ürün toplamı:", listing_total, "mağaza:", sellers.get("total"), "doğrulanmış:", sum(1 for s in sellers["sellers"] if s.get("kybVerified")))
print("seçilen ürün:", len(urunler), "seçilen üretici:", len(ureticiler))
print("veri yazıldı:", TODAY)
sys.exit(0)
