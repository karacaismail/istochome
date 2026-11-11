# Ana sayfayı üretir.
#   python3 build.py           önizleme derlemesi. Sayfa arama motorlarına kapalıdır (noindex).
#   python3 build.py --yayin   yayın derlemesi. Sayfa arama motorlarına açıktır (index).
# Girdi: sablon/ klasörü, secim.py ve data/ klasörü (veri.py yazar). Ağa çıkmaz.
# Çıktı: index.html
# Kapsam: yalnız ana sayfa. Kategori, arama ve mağaza sayfaları üretilmez, menü öğesi olarak yer alır.
# Kural: sayfadaki her sayı ve her olgu data/ klasöründen gelir. Bu dosyada olgu yazmaz.
import hashlib
import html
import json
import os
import re
import sys
from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import parse_qs, quote, unquote, urlencode, urlsplit

from piktogram import icon, picto
from metin import classify, hidden_known, hidden_texts, norm, norm_hidden, split, squeeze, walk_texts
from secim import (
    ALT_KISI, ALT_TUR, BETIK_METNI, DILLER, DIZIN, DIZIN_EN_AZ, DIZIN_OGE, ETIKETLER, GORSELLER, GRUPLAR, IDDIALAR, ODEME_YONTEMLERI,
    ONIZLEME_ETIKET, ONIZLEME_OZNITELIK, ONIZLEME_TASARIM, ORNEK_SIPARIS, ORNEK_URUN, OZNITELIK_METNI, PARA, PARA_VARSAYILAN, SOSYAL,
    TASARIM_METNI, URETICILER, URUNLER, VERI_METNI,
    ARACLAR, DEGER_BOLUMLERI, KUTUPHANE, ODEME_FAYDA, ODEME_PLAN, PLAN_ETIKET, PLAN_METNI,
)

HERE = os.path.dirname(os.path.abspath(__file__))
U = "https://istoc.com"
YAYIN = "--yayin" in sys.argv
MENU_CATS = 10  # Kategori menüsündeki üst kategori sayısı
MENU_LINKS = 12  # Bir kategori altında gösterilen en çok bağlantı sayısı
AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]


def read(*parts):
    return open(os.path.join(HERE, *parts), encoding="utf-8").read()


def load(name):
    return json.load(open(os.path.join(HERE, "data", name), encoding="utf-8"))


def esc(s):
    return html.escape(str(s), quote=True)


def tr_num(n):
    return "{:,}".format(int(n)).replace(",", ".")


def tr_date(iso):
    y, m, d = iso.split("-")
    return "%d %s %s" % (int(d), AYLAR[int(m) - 1], y)


def render(tpl, ctx):
    out = tpl
    for _ in range(3):  # iç içe parçalar için birkaç geçiş
        for k, v in ctx.items():
            out = out.replace("{{%s}}" % k, v)
    left = re.findall(r"\{\{[a-z0-9_]+\}\}", out)
    assert not left, "Doldurulmayan alan: %s" % sorted(set(left))
    return out


CATS = load("kategoriler.json")
COUNTS = load("sayilar.json")
FACTS = load("ana-sayfa.json")
DZ = load("dizin.json")
RATES = load("kur.json")["TRY"]  # 1 TRY kaç birim eder: USD, EUR, GBP, TRY
CURS = FACTS["para_birimleri"]
assert set(CURS) == set(PARA), "Para birimi listesi değişmiş: %s. secim.py içindeki PARA sözlüğünü güncelleyin." % CURS
# Veri dosyaları tek bir koşudan gelmelidir. veri.py her koşunun sonunda dosyaların özetini yazar (kosu.json).
# Bir dosya sonradan değiştiyse ya da yazma yarıda kaldıysa özet tutmaz ve sayfa üretilmez.
KOSU = load("kosu.json")
for _name, _sum in KOSU["dosyalar"].items():
    _body = open(os.path.join(HERE, "data", _name), "rb").read()
    assert hashlib.sha256(_body).hexdigest() == _sum, "data/%s son veri koşusuyla aynı değil. python3 veri.py çalıştırın." % _name
assert FACTS["alindi"] == KOSU["alindi"], "Veri dosyaları son koşudan gelmiyor. python3 veri.py çalıştırın."
# Kaynaklı metinler. Bir bağlantı etiketi kaynaklıysa etiket listesine ayrıca girmez.
SOURCED = [m[0] for m in IDDIALAR]
N_CHILD = sum(len(c["children"]) for c in CATS)


def total_of(c):
    return COUNTS.get(c["path"]) or 0


# Ürünü çok olan kategori önde. Eşitlikte alt kategorisi çok olan önde.
RANKED = sorted(CATS, key=lambda c: (-total_of(c), -len(c["children"]), c["name"]))

CAT_PICTO = {
    "Ev ve Mutfak Gereçleri": "tencere", "Temizlik ve Hijyen Ürünleri": "sprey", "Mobilya": "koltuk",
    "Elektrik Malzemeleri": "simsek", "Tarım ve Hayvancılık": "filiz", "Otomotiv": "araba",
    "Kozmetik, Makyaj ve Kişisel Bakım": "damla", "Hırdavat": "anahtar", "Kırtasiye ve Ofis Sarf Malzemeleri": "kalem",
    "İnşaat ve Yapı Malzemeleri": "bina", "Promosyon Ürünler": "hediye", "Gıda ve İçecek": "fincan",
    "Ambalaj ve Paketleme": "koli", "Endüstriyel Mutfak": "alev", "Hotel, Restaurant ve Cafe Ekipmanları": "zil",
    "İmalat Hizmetleri": "uretici", "Mağaza Ekipmanları, Reyon ve Teşhir Sistemleri": "magaza",
}


def cat_picto(c, size="md"):
    return picto(CAT_PICTO.get(c["name"], "koli"), size)


def cat_count(c):
    t = total_of(c)
    return "%s ürün" % tr_num(t) if t else "%d alt kategori" % len(c["children"])


def cat_url(slug):
    # Menü öğeleri canlı sitedeki kategori sayfasına gider. Canlı sitenin site haritası da bu adresi kullanır.
    # Adres parçası kodlanır. Böylece veri kaynağından gelen bir işaret HTML'i bozamaz.
    return "%s/kategori/%s" % (U, quote(slug, safe=""))


def search_url(word):
    return "%s/urunler?%s" % (U, urlencode({"q": word}))


def vc(s=16):
    return (
        '<svg width="%d" height="%d" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="currentColor"/>'
        '<path d="m7.4 12.4 3.1 3.1 6.1-6.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' % (s, s)
    )


OK18 = icon("ok", 18)


def lnk(text, href):
    # Metin span içinde durur. Alt çizgi yalnız metnin altına çizilir ve durağan halde görünür.
    return '<a class="lnk" href="%s"><span>%s</span>%s</a>' % (href, text, OK18)


# Kart şeridi denetimi: konum çubuğu ve iki ok. app.js, şerit kaydırılabiliyorsa görünür yapar.
RAIL_CTL = (
    '<div class="rail-ctl" data-rail-ctl hidden>'
    '<span class="rail-ctl__track" aria-hidden="true"><span class="rail-ctl__bar"></span></span>'
    '<button class="rail-ctl__btn" type="button" data-rail-btn="-1" aria-label="Önceki kartlar" aria-disabled="true">%s</button>'
    '<button class="rail-ctl__btn" type="button" data-rail-btn="1" aria-label="Sonraki kartlar">%s</button>'
    "</div>"
) % (icon("sol", 20), icon("sag", 20))


def head(no, kicker, hid, title, lead="", link="", split=True):
    """Bölüm başlığı. Her bölüm aynı başlıkla başlar: sıra numarası, bölüm adı, ayırıcı çizgi, başlık ve açıklama.
    Üst satır gözle okunur. Ekran okuyucu bölüm adını başlığın içinde okur. Böylece bölgenin adı yalnız slogan olmaz."""
    side = '<div class="mh__side">%s%s</div>' % ('<p class="mh__lead">%s</p>' % lead if lead else "", link) if lead or link else ""
    return (
        '<header class="mh%s" data-reveal>'
        '<p class="mh__top" aria-hidden="true"><b class="mh__no">%s</b><span class="mh__kicker">%s</span><span class="mh__bar"></span></p>'
        '<h2 id="%s"><span class="sr-only">%s: </span>%s</h2>%s</header>' % (" mh--split" if split else "", no, kicker, hid, kicker, title, side)
    )


# Bölüm sırası. Planlanan bölümler yalnız önizleme derlemesinde vardır.
# Numara derlemeye göre sırayla verilir. Böylece yayın derlemesinde numara atlanmaz.
SIRA = ["alici", "kat", "urun", "uretici", "surec", "odeme_plan", "sss", "satici", "yeni-musteri", "yeniden-siparis", "araclar", "dizin"]
PLANLI = {"odeme_plan", "yeni-musteri", "yeniden-siparis", "araclar"}
NO = {k: "%02d" % i for i, k in enumerate([k for k in SIRA if not (YAYIN and k in PLANLI)], 1)}


# --- Hareketli yüzeyler ---------------------------------------------------------
# Her bölümün arkasında kendi yüzeyi durur: ticaret ağı, nokta alanı ya da sipariş rotası.
# Yüzey süstür. Okuyucudan gizlidir, tıklanmaz ve içeriğin yerini değiştirmez.
# Hareket kısadır ve olayla başlar: yüzey ekrana girince bir kez çizilir (app.js is-on yazar).
# İşaretçi yüzeyin üstündeyken yakınındaki çizgiler belirginleşir. Sonsuz hareket yoktur, bu yüzden durdurma düğmesi gerekmez.
AG_DUGUM = [(80, 120), (230, 60), (360, 190), (520, 90), (660, 210), (820, 70), (980, 170), (1130, 90), (140, 330), (300, 420),
            (470, 330), (640, 450), (790, 340), (950, 440), (1100, 330), (210, 560), (420, 600), (700, 580), (900, 590), (1150, 540)]


def _ag(seed):
    """Ticaret ağı: düğümler ve her düğümü en yakın iki komşusuna bağlayan çizgiler. seed ağı yansıtır."""
    nodes = [((1200 - x) if seed % 2 else x, y) for x, y in AG_DUGUM]
    edges = set()
    for i, (x, y) in enumerate(nodes):
        near = sorted((j for j in range(len(nodes)) if j != i), key=lambda j: (nodes[j][0] - x) ** 2 + (nodes[j][1] - y) ** 2)[:2]
        edges |= {tuple(sorted((i, j))) for j in near}
    lines = "".join('<path pathLength="1" d="M%d %dL%d %d" style="--i:%d"/>' % (nodes[a] + nodes[b] + (k % 8,)) for k, (a, b) in enumerate(sorted(edges)))
    dots = "".join('<circle cx="%d" cy="%d" r="3" style="--i:%d"/>' % (x, y, k % 8) for k, (x, y) in enumerate(nodes))
    return lines + dots


def _rota(seed):
    """Sipariş rotası: yüzeyi boydan boya geçen bir yol ve yol üstündeki duraklar."""
    path = "M-20 %d C 220 %d, 380 %d, 600 %d S 980 %d, 1220 %d" % ((420, 300, 520, 380, 250, 330) if seed % 2 else (200, 330, 120, 260, 420, 300))
    stops = [(150, 300), (420, 420), (600, 380), (860, 290), (1080, 320)] if seed % 2 else [(150, 260), (400, 190), (600, 260), (850, 360), (1080, 310)]
    return '<path pathLength="1" d="%s"/>' % path + "".join('<circle cx="%d" cy="%d" r="5" style="--i:%d"/>' % (x, y, k + 2) for k, (x, y) in enumerate(stops))


def surface(kind, seed=0):
    """Bir bölümün hareketli yüzeyi. kind: ag, rota ya da nokta. Nokta alanı yalnız CSS ile çizilir."""
    if kind == "nokta":
        return '<span class="surface surface--nokta" aria-hidden="true" data-surface></span>'
    body = _ag(seed) if kind == "ag" else _rota(seed)
    svg = '<svg class="%s" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" focusable="false">%s</svg>'
    return '<span class="surface surface--%s" aria-hidden="true" data-surface>%s%s</span>' % (kind, svg % ("surface__lo", body), svg % ("surface__hi", body))


# --- Para: her tutar dört para biriminde hesaplanır ---------------------------
# Canlı sitede fiyat Türk lirasıdır. Diğer para birimlerindeki tutar, canlı sitenin kuruyla çevrilir.
# Toplam, yuvarlanmamış birim tutardan hesaplanır. Yuvarlanmış birim fiyat adetle çarpılsaydı
# toplam, çevrilen gerçek tutardan sapardı (250 adette yüzde 1'e kadar).
class Html(str):
    """Hazır HTML. Yalnız bu dosyanın ürettiği parça bu sınıfı taşır. Veriden gelen metin her zaman kaçışla yazılır."""


def r2(x):
    """İki ondalığa yuvarlar. Kural tarayıcının sayı biçimiyle aynıdır: sayının en kısa ondalık yazımı alınır,
    tam yarıda kalan değer yukarı yuvarlanır. Böylece build.py ile app.js aynı tutarı yazar."""
    return str(Decimal(repr(float(x))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def amounts(try_amount):
    """TRY tutarının her para birimindeki karşılığı, iki ondalıkla. Örnek: 180 TRY, USD için "3.59" olur."""
    return {c: r2(try_amount * RATES[c]) for c in CURS}


def units(try_amount):
    """Birim tutarın her para birimindeki yuvarlanmamış karşılığı. app.js toplamı bu değerden hesaplar."""
    return {c: "%.8f" % (try_amount * RATES[c]) for c in CURS}


def totals(unit, n):
    """n adedin toplamı. app.js ile aynı işlemi yapar: yuvarlanmamış birim tutar adetle çarpılır, sonuç yuvarlanır.
    Böylece kartta yazan en az sipariş tutarı, sepetin göstereceği toplamla aynıdır."""
    return {c: r2(float(v) * n) for c, v in unit.items()}


def money(cur, value):
    # Yazım app.js ile aynıdır: simge ve Türkçe sayı biçimi. Binlik ayırıcı nokta, ondalık ayırıcı virgüldür.
    # Örnek: "$1.234,50". Sayfadaki diğer sayılar da bu biçimdedir (2.412 ürün, 8,7 kg).
    return PARA[cur][0] + "{:,.2f}".format(float(value)).replace(",", " ").replace(".", ",").replace(" ", ".")


def para(amts):
    """Para birimi değişince güncellenen tutar. Değerler özniteliklerde hazır durur."""
    return Html("<span data-para%s>%s</span>" % ("".join(' data-%s="%s"' % (c.lower(), amts[c]) for c in CURS), money(PARA_VARSAYILAN, amts[PARA_VARSAYILAN])))


def unit_attrs(unit):
    """Yuvarlanmamış birim tutarlar. app.js sepetin ve örnek siparişin toplamını bu değerlerden hesaplar."""
    return "".join(' data-unit-%s="%s"' % (c.lower(), unit[c]) for c in CURS)


# --- Kategori menüsü (menü öğeleri) -----------------------------------------
def mega_sub(c):
    """Bir üst kategorinin alt menüsü. Az alt kategorisi varsa ürün gruplarıyla birlikte gösterilir."""
    kids = c["children"]
    if len(kids) <= 6:
        groups = []
        for k in kids:
            links = "".join('<li><a href="%s">%s</a></li>' % (cat_url(g["slug"]), esc(g["name"])) for g in k["children"][:5])
            # Grup adı da bir bağlantıdır. Bunu ok simgesi ve alt çizgi gösterir.
            groups.append('<div><a class="mega__group" href="%s"><span>%s</span>%s</a><ul>%s</ul></div>' % (cat_url(k["slug"]), esc(k["name"]), icon("sag", 16), links))
        body = '<div class="mega__groups" data-veri>%s</div>' % "".join(groups)
    else:
        links = "".join('<li><a href="%s">%s</a></li>' % (cat_url(k["slug"]), esc(k["name"])) for k in kids[:MENU_LINKS])
        more = '<p class="mega__more">%d alt kategori daha var.</p>' % (len(kids) - MENU_LINKS) if len(kids) > MENU_LINKS else ""
        body = '<ul class="mega__links" data-veri>%s</ul>%s' % (links, more)
    return body


def mega_items():
    out = []
    for i, c in enumerate(RANKED[:MENU_CATS], 1):
        out.append(
            '<button class="mega__cat" type="button" id="mgb-%d" aria-expanded="false" aria-controls="mg-%d">%s<span><strong data-veri>%s</strong><small>%s</small></span>%s</button>'
            '<div class="mega__sub" id="mg-%d" role="group" aria-labelledby="mgb-%d" data-open="false" inert><div class="mega__subin"><div class="mega__subpad">'
            '<div class="mega__subhead"><p class="mega__title" data-veri>%s</p>%s</div>%s</div></div></div>'
            % (i, i, cat_picto(c, "sm"), esc(c["name"]), cat_count(c), icon("asagi", 18, "chev"), i, i, esc(c["name"]), lnk("Kategorinin tümü", cat_url(c["slug"])), mega_sub(c))
        )
    return "\n            ".join(out)


# --- Olgular: data/ana-sayfa.json ------------------------------------------
def product(slug):
    """Seçilen ürünün sayfada kullanılan bütün olguları. Hepsi canlı siteden alınmış veridir."""
    f = FACTS["urunler"][slug]
    assert f["birim"] == "Adet", "Birim beklenmiyor: %s" % f["birim"]
    # KDV dahil birim fiyat, TRY. veri.py bu varsayımı canlı sitedeki liste kaydıyla doğrular.
    unit = units(f["fiyat_try"] * (1 + f["kdv"] / 100))
    return {
        "slug": slug,
        "href": "%s/urun/%s" % (U, quote(slug, safe="")),
        # Canlı sitedeki ad korunur. Yalnız "Ve" bağlacı küçük harfe çevrilir.
        "name": re.sub(r"\bVe\b", "ve", f["ad"]),
        "ex": amounts(f["fiyat_try"]),
        "inc": {c: r2(float(v)) for c, v in unit.items()},
        "unit": unit,
        "moq": int(f["en_az_adet"]),
        "least": totals(unit, int(f["en_az_adet"])),
        "lead": f["hazirlik"],
        "sup": f["uretici"],
        "city": f["uretici_sehir"],
        "verified": f["uretici_dogrulanmis"],
        # Rozet "üretici" sözünü yalnız mağazanın işletme türü üreticiyse kullanır.
        "badge": "Doğrulanmış üretici" if f.get("uretici_tur") == "Manufacturer" else "Doğrulanmış satıcı",
        "specs": f["ozellikler"],
    }


def terms(pairs):
    # Değer veriden gelir ve kaçışla yazılır. Yalnız bu dosyanın ürettiği tutar (Html) olduğu gibi yazılır.
    # Satıcının canlı siteye girdiği bir metin, HTML gibi görünse de sayfaya işaret olarak giremez.
    return "".join("<div><dt>%s</dt><dd data-veri>%s</dd></div>" % (esc(k), v if isinstance(v, Html) else esc(v)) for k, v in pairs if v)


def product_card(i, slug, img, cat):
    """Ürün kartı. Büyük fiyat KDV dahildir. Doğrulama rozeti yalnız doğrulanmış üreticide görünür."""
    p = product(slug)
    badge = '<span class="vb vb--pill pc__badge">%s%s</span>' % (vc(16), p["badge"]) if p["verified"] else ""
    return """<li data-cat="%(cat)s" data-reveal style="--i:%(col)d;view-transition-name:pc-%(i)d">
        <article class="pc" data-glow data-slug="%(slug)s" data-name="%(name)s" data-moq="%(moq)d"%(unit)s>
          <a class="pc__media" href="%(href)s" tabindex="-1" aria-hidden="true"><img src="img/%(img)s" alt="" width="768" height="768" loading="lazy" decoding="async"></a>
          %(badge)s
          <div class="pc__body">
            <p class="pc__sup" data-veri>%(sup)s</p>
            <h3 class="pc__name" data-veri><a href="%(href)s">%(name)s</a></h3>
            <p class="pc__price"><b>%(inc)s</b><span>adet başına</span></p>
            <p class="pc__ex">KDV hariç %(ex)s</p>
          </div>
          <div class="pc__foot">
            <dl class="terms">%(terms)s</dl>
            <button class="pc__add" type="button" aria-pressed="false" aria-label="%(moq)d adet sepete ekleyin: %(name)s"><i>%(plus)s%(check)s</i><span>%(moq)d adet ekleyin</span></button>
          </div>
        </article>
      </li>""" % dict(
        i=i, col=i % 4, slug=esc(slug), name=esc(p["name"]), sup=esc(p["sup"]), inc=para(p["inc"]), ex=para(p["ex"]), moq=p["moq"], href=p["href"], img=img, cat=cat,
        unit=unit_attrs(p["unit"]), badge=badge,
        terms=terms([("En az sipariş adedi", "%d adet" % p["moq"]), ("En az sipariş tutarı", para(p["least"])), ("Hazırlık süresi", p["lead"])]),
        plus=icon("arti", 20, "i-off"), check=icon("onay", 20, "i-on"),
    )


TUR = {"Manufacturer": "Üretici"}


def supplier_card(i, slug, logo, thumbs):
    f = FACTS["ureticiler"][slug]
    store = "%s/magaza/%s/dukkan" % (U, quote(slug, safe=""))
    facts = []
    if f["kurulus"]:
        facts.append(("Kuruluş", f["kurulus"]))
    elif f.get("not"):
        # Kuruluş yılı alanı boşsa mağazanın kendi açıklamasındaki bilgi yazılır. veri.py bunu açıklamada doğrular.
        facts.append((f["not"]["etiket"], f["not"]["deger"]))
    facts.append(("Ürün", tr_num(f["urun_sayisi"])))
    if f["fabrika_m2"]:
        facts.append(("Fabrika", "%s m²" % tr_num(f["fabrika_m2"])))
    kind = ", ".join(x for x in [TUR.get(f["tur"], "Satıcı"), f["sehir"]] if x)
    badge = '<span class="vb vb--pill">%sİşletmesi doğrulandı</span>' % vc(18) if f["dogrulanmis"] else ""
    return """<li data-reveal style="--i:%(i)d">
        <article class="sc" data-glow>
          <div class="sc__top"><img class="sc__logo" src="img/%(logo)s" alt="" width="56" height="56" loading="lazy"><div><h3 data-veri>%(name)s</h3><p class="sc__type" data-veri>%(kind)s</p></div></div>
          %(badge)s
          <dl class="terms">%(facts)s</dl>
          <ul class="sc__thumbs" aria-hidden="true">%(thumbs)s</ul>
          <div class="sc__cta"><a class="btn btn--ink btn--sm" href="%(store)s">Mağazaya gidin</a>%(msg)s</div>
        </article>
      </li>""" % dict(
        i=i, name=esc(f["ad"]), kind=esc(kind), logo=logo, store=store, badge=badge, facts=terms(facts),
        thumbs="".join('<li><a href="%s" tabindex="-1"><img src="img/%s" alt="" width="768" height="768" loading="lazy"></a></li>' % (store, t) for t in thumbs),
        msg=lnk("Mesaj yazın", U + "/hesabim/mesajlar"),
    )


def carton(specs):
    """Koli bilgisi: net ağırlık ve hacim. Örnek: "8.7 KG" ve "0.11", "8,7 kg net" ve "0,11 m³" olur."""
    w = specs.get("Koli Net Ağırlığı", "")
    v = specs.get("Koli m3", "")
    m = re.match(r"^([\d.]+)\s*KG$", w, re.I)
    weight = "%s kg net" % m.group(1).replace(".", ",") if m else ""
    volume = "%s m³" % v.replace(".", ",") if re.match(r"^[\d.]+$", v) else ""
    if not weight and not volume:
        return ""
    return '<div><dt>Koli</dt><dd data-veri>%s%s</dd></div>' % (weight or volume, "<small>%s</small>" % volume if weight and volume else "")


# --- Sipariş süreci ve sık sorulanlar. Kaynaklı her cümle secim.py içindeki IDDIALAR listesinde durur. ---
ODEME_YOLU = (
    "Ödemeyi satıcının sunduğu yöntemle doğrudan satıcıya yaparsınız. "
    "Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a ödersiniz."
)
HESAP = "Yalnız sipariş sayfanızda gösterilen hesaba ödeme yaparsınız."
KYC = "Satın almak için kimlik doğrulamasını tamamlarsınız."
KYC_SURE = "Kimlik belgenizi yüklersiniz. İnceleme genellikle 1 ya da 2 iş günü sürer."
# Adımlar: (piktogram, başlık, açıklama, [güven işaretleri: (simge, etiket)])
# Kilitli kart piktogramı yalnız gerçek ödeme adımında kullanılır. Ana sayfa bir ödeme adımı değildir.
# Bu yüzden ödeme adımını düz kart, hesap güvenliğini banka piktogramı anlatır.
TL = [
    ("kimlik", "Hesabınızı açar, kimliğinizi doğrularsınız", "Hesap açmak ücretsizdir. %s %s" % (KYC, KYC_SURE), [("kimlik", "Kimlik doğrulaması (KYC)"), ("belge-yukle", "Belge yükleme")]),
    ("siparis", "Sipariş koşullarında anlaşırsınız", "Satıcıyla sipariş koşullarında anlaşırsınız. Sonra siparişi başlatırsınız.", []),
    ("kart", "Ödemeyi yaparsınız", "%s %s Ödeme dekontunu sipariş ayrıntılarından yüklersiniz." % (ODEME_YOLU, HESAP), [("belge-yukle", "Dekont yükleme")]),
    ("kayit", "Sipariş koşullarınız kaydedilir", "Kabul ettiğiniz sipariş koşullarının bir kopyasını iStoc saklar. Sipariş durumunu teslimata kadar iStoc izler.", [("takip", "Sipariş takibi")]),
    ("destek", "Sorun çıkarsa destek alırsınız", "Sipariş koşulları karşılanmazsa talep açarsınız. Sorunu, kabul ettiğiniz koşullara göre çözmenize iStoc yardım eder.", [("iade", "İade talebi")]),
]
FAQS = [
    ("Ödemeyi kime yaparım?", "%s Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez. %s" % (ODEME_YOLU, HESAP)),
    ("Hangi ödeme yöntemleri geçerlidir?", "Geçerli yöntemi satıcı belirler. Satıcı kredi kartı, banka kartı ya da EFT kabul edebilir. Satıcı başka yöntemler de sunabilir."),
    ("Satın almak için ne gerekir?", "%s Bireysel ya da kurumsal hesap seçersiniz. %s" % (KYC, KYC_SURE)),
    ("En az sipariş adedini nerede görürüm?", "En az sipariş adedi ürün kartında yazar. Sepette bu adedin altında kalırsanız iStoc sizi uyarır."),
    ("Doğrulama rozeti ne demektir?", "Rozet, mağazanın işletme doğrulamasının tamamlandığını gösterir. Rozet üretici kartında ve ürün kartında durur."),
    ("Siparişim gelmezse ne olur?", "Sipariş gönderilmezse ya da kaybolursa iade talebi oluşturursunuz. Ürün kusurlu, yanlış ya da hasarlı gelirse de iade talebi oluşturursunuz. İadeyi, ödeme yaptığınız taraf yapar. İade, kabul ettiğiniz koşullara göre yapılır."),
    ("Teslimat süresi nasıl belirlenir?", "Teslimat süresini ve gönderim şeklini satıcı siparişte belirtir. Ürün gönderilince takip numarası sipariş ayrıntılarınıza eklenir. Kargo firmasının adı da eklenir."),
]


def tl_html():
    out = []
    for n, (p, title, text, tags) in enumerate(TL, 1):
        chips = "".join('<li>%s%s</li>' % (icon(i, 18), label) for i, label in tags)
        out.append("<li>%s<div><h3><b>%02d</b>%s</h3><p>%s</p>%s</div></li>" % (picto(p), n, title, text, '<ul class="tags">%s</ul>' % chips if chips else ""))
    return "".join(out)


# Sosyal hesaplar secim.py içindedir (SOSYAL). veri.py her adresin canlı sitede geçtiğini denetler.
def soc_icon(p):
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>' % p


def faq_html(faqs):
    # Yanıtın açık olup olmadığını data-open taşır. Görünüm tarayıcının :has() desteğine bağlı kalmaz.
    return "".join(
        '<div class="faq"><h3><button type="button" id="sss-b%d" aria-expanded="false" aria-controls="sss-%d">%s<i>%s</i></button></h3>'
        '<div class="faq__panel" id="sss-%d" role="region" aria-labelledby="sss-b%d" data-open="false"><div><p>%s</p></div></div></div>'
        % (i, i, esc(q), icon("arti", 18), i, i, esc(a))
        for i, (q, a) in enumerate(faqs, 1)
    )


def filters_html():
    n = {key: sum(1 for _s, _i, g in URUNLER if g == key) for key, _label in GRUPLAR}
    out = ['<button class="filter" type="button" data-filter="" aria-pressed="true">Tümü<b>%d</b></button>' % len(URUNLER)]
    out += ['<button class="filter" type="button" data-filter="%s" aria-pressed="false">%s<b>%d</b></button>' % (key, esc(label), n[key]) for key, label in GRUPLAR if n[key]]
    return "\n        ".join(out)


# --- Dizin: programatik arama motoru stratejileri (menü öğeleri) ---------------
# Her grup bir veri boyutudur. Öğeler canlı sitede çalışan adreslere gider ve yanlarında canlı sonuç sayısı yazar.
AUTO_LABELS = []  # Dizin ve alt bölüm öğelerinin etiketleri. Sınıflandırmaya etiket olarak eklenir.


def auto_label(text):
    """Etiketi kaydeder. Kaynaklı bir ad (canlı sitedeki bölüm adı) kanıt defterinde durur, etiket listesine girmez."""
    if text not in SOURCED:
        AUTO_LABELS.append(text)


def dizin_items(group):
    """Bir grubun öğeleri: (etiket, adres, sayı ya da None, veri mi, ek). Sonucu az olan öğe atılır."""
    key = group["anahtar"]
    if key == "grup":
        rows = [(g["ad"], cat_url(g["adres"]), g["sayi"], True, "") for g in sorted(DZ["urun_gruplari"], key=lambda g: -g["sayi"])]
    elif key == "uretici":
        makers = [m for m in DZ["magazalar"] if m["tur"] == "Manufacturer"]
        rows = [(m["ad"], "%s/magaza/%s" % (U, quote(m["adres"], safe="")), m["urun_sayisi"], True, "mağaza") for m in sorted(makers, key=lambda m: -m["urun_sayisi"])[:DIZIN_OGE - 1]]
        rows += [(b["ad"], "%s/marka/%s" % (U, quote(b["adres"], safe="")), b["sayi"], True, "marka") for b in sorted(DZ["markalar"], key=lambda b: -b["sayi"])[:1]]
    elif group["tur"] == "arama":
        rows = [(label, search_url(word), DZ["aramalar"][word], False, "") for label, word in group["ogeler"]]
        rows.sort(key=lambda r: -r[2])
    else:
        rows = []
        for label, target in group["ogeler"]:
            if isinstance(target, int):
                rows.append((label, "%s/urunler?%s" % (U, urlencode({"min_order": target})), DZ["adetler"][str(target)], False, ""))
            else:
                rows.append((label, U + target, None, False, ""))
    rows = [r for r in rows if r[2] is None or r[2] >= DIZIN_EN_AZ][:DIZIN_OGE]
    assert len(rows) >= 3, "Dizin grubu boşaldı: %s. secim.py içindeki öğeleri güncelleyin." % group["baslik"]
    return rows


def dizin_html():
    out = []
    for i, group in enumerate(DIZIN):
        rows = dizin_items(group)
        top = max([r[2] for r in rows if r[2]] or [1])
        links = []
        for label, href, count, from_data, kind in rows:
            if not from_data:
                auto_label(label)
            name = '<span class="dlink__t"%s>%s</span>' % (" data-veri" if from_data else "", esc(label))
            tag = '<small class="dlink__k">%s</small>' % kind if kind else ""
            if count is None:
                links.append('<li><a class="dlink" href="%s">%s%s</a></li>' % (esc(href), name, icon("ok", 16)))
            else:
                # Çubuk, öğenin gruptaki en büyük sayıya oranını gösterir. Sayının kendisi yanında yazar.
                share = max(0.04, count / top)
                links.append(
                    # Çubuk bağlantının alt kenarına değer. Bu yüzden çubuklu bağlantının alt köşeleri yuvarlak değildir (dlink--n).
                    '<li><a class="dlink dlink--n" href="%s" style="--p:%.3f">%s%s<span class="dlink__n">%s<span class="sr-only"> ürün</span></span>'
                    '<span class="dlink__bar" aria-hidden="true"></span></a></li>' % (esc(href), share, name, tag, tr_num(count))
                )
        # Katlanan grup. Dar ekranda başlık bir düğmedir ve grup onunla açılır. Geniş ekranda ve betik yokken
        # başlık düz yazıdır, grup hep açıktır. Başlığın iki hali de sayfada durur, CSS genişliğe göre birini gösterir.
        # İlk grup dar ekranda da açık başlar. Böylece ziyaretçi grubun içinde ne olduğunu görür.
        state = "true" if i == 0 else "false"
        title = '%s<span class="dgroup__t"><span class="fold__name">%s</span><small>%s</small></span>' % (picto(group["piktogram"], "sm"), group["baslik"], group["aciklama"])
        out.append(
            '<div class="dgroup" data-fold data-open="%s" data-reveal style="--i:%d">'
            '<h3 class="fold__h"><span class="fold__label">%s</span>'
            '<button class="fold__btn" type="button" aria-expanded="%s" aria-controls="dz-%d">%s%s</button></h3>'
            '<div class="fold__panel" id="dz-%d"><div><ul>%s</ul></div></div></div>'
            % (state, i % 3, title, state, i + 1, title, icon("asagi", 20, "chev"), i + 1, "".join(links))
        )
        auto_label(group["baslik"])
    return "\n      ".join(out)


# --- Alt bölüm ------------------------------------------------------------------
CAT_NAMES = {c["name"] for c in CATS}


def flinks(items):
    out = []
    for label, href in items:
        auto_label(label)
        out.append('<li><a href="%s">%s</a></li>' % (href if href.startswith("#") else U + href, esc(label)))
    return "".join(out)


def fgroups(groups, with_picto, key):
    """Alt bölüm sütunları. Dizin gruplarıyla aynı katlanan grup yapısını kullanır. Dar ekranda sütunlar kapalı başlar."""
    out = []
    for n, g in enumerate(groups, 1):
        pic, title, items = g if with_picto else ("",) + tuple(g)
        auto_label(title)
        head = "%s<span>%s</span>" % (icon(pic, 20, "fgroup__i") if pic else "", title)
        out.append(
            '<div class="fgroup" data-fold data-open="false">'
            '<div class="fold__h"><span class="fold__label">%s</span>'
            '<button class="fold__btn" type="button" aria-expanded="false" aria-controls="%s-%d">%s%s</button></div>'
            '<div class="fold__panel" id="%s-%d"><div><ul>%s</ul></div></div></div>'
            % (head, key, n, head, icon("asagi", 20, "chev"), key, n, flinks(items))
        )
    return "\n        ".join(out)


def tile(value, mark, name, sub, checked, lang=""):
    """Dil ya da para birimi seçeneği. Seçenek bir radyo düğmesidir: grupta tek seçenek seçilidir."""
    return (
        '<button class="pref" type="button" role="radio" aria-checked="%s" tabindex="%s" data-deger="%s" data-ad="%s">'
        '<i class="pref__mark" aria-hidden="true">%s</i><span class="pref__t"><b%s data-veri>%s</b>%s</span>%s</button>'
        % ("true" if checked else "false", "0" if checked else "-1", value, esc(name), mark, lang, esc(name), "<small>%s</small>" % sub if sub else "", icon("onay", 18, "pref__on"))
    )


# --- Arama motoru için yapısal veri (yalnız ana sayfa) -----------------------
# Ürün listesi özet kalıbındadır: her öğe adını ve ürün sayfasının adresini taşır.
# Fiyat bilgisi yapısal veriye konmaz, çünkü sayfadaki fiyat seçili para birimine göre değişir.
def jsonld(*objs):
    # "<" işareti kaçışla yazılır. Böylece veri kaynağından gelen bir ad betik etiketini kapatamaz.
    return "\n".join('<script type="application/ld+json">%s</script>' % json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c") for o in objs)


PRODUCTS = [product(slug) for slug, _img, _cat in URUNLER]
LD = jsonld(
    {"@context": "https://schema.org", "@type": "Organization", "name": "iStoc", "legalName": "iStoc Private Company Limited", "url": U + "/", "logo": U + GORSELLER["logo"],
     "sameAs": [href for _n, href, _p in SOSYAL]},
    {"@context": "https://schema.org", "@type": "WebSite", "name": "iStoc", "url": U + "/", "inLanguage": "tr",
     "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": U + "/urunler?q={search_term_string}"}, "query-input": "required name=search_term_string"}},
    {"@context": "https://schema.org", "@type": "ItemList", "name": "Ürünler", "numberOfItems": len(PRODUCTS),
     "itemListElement": [{"@type": "ListItem", "position": i, "name": p["name"], "url": p["href"]} for i, p in enumerate(PRODUCTS, 1)]},
    {"@context": "https://schema.org", "@type": "FAQPage",
     "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS]},
)

# --- Sayfa -------------------------------------------------------------------
dir_items = []
for i, c in enumerate(RANKED[:12]):
    subs = "".join('<a href="%s">%s</a>' % (cat_url(k["slug"]), esc(k["name"])) for k in c["children"][:3])
    dir_items.append(
        '<li class="dir__item" data-glow data-reveal style="--i:%d"><a class="dir__head" href="%s">%s<span><h3 data-veri>%s</h3><small>%s</small></span>%s</a>'
        '<div class="dir__subs" data-veri>%s</div></li>' % (i % 3, cat_url(c["slug"]), cat_picto(c), esc(c["name"]), cat_count(c), icon("ok", 18), subs)
    )

OP = product(ORNEK_SIPARIS)
OP_IMG = dict((s, img) for s, img, _c in URUNLER)[ORNEK_SIPARIS]

# Öneri notu: yalnız önizleme derlemesinde görünür. Sayfa herkese açık bir adreste yayımlanınca
# ziyaretçi, sayfanın canlı site olmadığını en başta okur.
ONERI_NOTU = (
    '<aside class="demo" aria-label="Öneri notu"><div class="wrap demo__in">'
    "<p>Bu sayfa bir tasarım önerisidir.</p>"
    '<a class="lnk" href="%s/"><span>istoc.com\'a gidin</span>%s</a>'
    "</div></aside>"
) % (U, OK18)
# --- Planlanan hizmetler ve içerik (yalnız önizleme) -------------------------------
# Bu bölgeler data-plan taşır ve "Planlanan hizmet" ya da "Planlanan içerik" etiketini gösterir.
# Metinleri plan sınıfındadır. Aşağıdaki denetim her plan metninin bu bölgelerde durduğunu sınar.
def plan_tag(kind):
    return '<p class="plan-tag">%s<span>%s</span></p>' % (icon("bilgi", 18), PLAN_ETIKET[kind])


def degerler_html():
    """Değer bölümleri: yeni müşteri ve yeniden sipariş. Her kart alıcının ve satıcının faydasını ayrı yazar.
    Bantlar sırayla açık ve tonludur. Böylece komşu bantlar zemin rengiyle ayrılır."""
    out = []
    for n, (sid, kicker, title, items) in enumerate(DEGER_BOLUMLERI):
        cards = "".join(
            '<li class="val" data-reveal style="--i:%d">%s<div><h3>%s</h3><p class="val__side"><b>Alıcı</b>%s</p><p class="val__side"><b>Satıcı</b>%s</p></div></li>'
            % (i % 3, picto(p), esc(t), esc(a), esc(b)) for i, (p, t, a, b) in enumerate(items)
        )
        out.append(
            '<section class="mod band%s" id="%s" aria-labelledby="%s-baslik" data-plan>%s<div class="wrap">%s%s'
            '<ul class="vals" role="list">%s</ul><p class="plan-note">Hizmetlerin koşulları henüz belirlenmedi.</p></div></section>'
            % (" band--tint" if n % 2 else "", sid, sid, surface("nokta" if n % 2 else "ag", 1),
               head(NO[sid], kicker, sid + "-baslik", title, "Bu hizmetler öneridir. Bu hizmetler istoc.com'da henüz yoktur."), plan_tag("hizmet"), cards)
        )
    return "\n".join(out)


def odeme_plan_html():
    steps = "".join(
        '<li data-reveal style="--i:%d"><span class="pp__who">%s<b>%s</b></span><p>%s</p></li>' % (i % 4, picto(p, "sm"), esc(who), esc(t))
        for i, (p, who, t) in enumerate(ODEME_PLAN)
    )
    gains = "".join('<div class="pp__gain" data-reveal><h3>%s</h3><p>%s</p></div>' % (esc(h), esc(t)) for h, t in ODEME_FAYDA)
    return (
        '<section class="mod band band--tint" id="guvenli-odeme" aria-labelledby="gp-baslik" data-plan>%s<div class="wrap">%s%s'
        '<div class="pp"><p class="pp__now" data-reveal>%s<span>Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez.</span></p>'
        '<ol class="pp__flow" role="list">%s</ol><div class="pp__gains">%s</div>'
        '<p class="plan-note">Bu model henüz yoktur. Süreler ve ücretler henüz belirlenmedi. Koşulları ödeme kuruluşuyla yapılacak sözleşme belirler.</p></div></div></section>'
    ) % (surface("rota", 1), head(NO["odeme_plan"], "Güvenli ödeme", "gp-baslik", "Güvenli ödeme modeli", "Planlanan modelde ödeme, lisanslı bir ödeme kuruluşunda bekler."),
         plan_tag("hizmet"), icon("bilgi", 18), steps, gains)


def araclar_html():
    """Hesaplama araçları: üç grup, her grupta dört araç. Her araç kısa faydasını yazar.
    "Neyi hesaplar?" düğmesi aracın girişini, çıktısını ve sınırını sayfa içinde açar. Betik yoksa açıklama açık durur."""
    groups = []
    for g, (name, tools) in enumerate(ARACLAR, 1):
        items = []
        for k, (t, who, gain, inp, outp, limit) in enumerate(tools, 1):
            tid = "arac-%d-%d" % (g, k)
            detail = "".join("<p>%s</p>" % esc(x) for x in [inp, outp, limit, "Bu öneride araç henüz hesaplama yapmaz."] if x)
            items.append(
                '<li class="tool"><h4 id="%s-ad">%s</h4><p class="tool__who">%s</p><p class="tool__gain">%s</p>'
                '<button class="tool__btn" type="button" id="%s-b" aria-expanded="false" aria-controls="%s" aria-describedby="%s-ad"><span>Neyi hesaplar?</span>%s</button>'
                '<div class="faq__panel tool__panel" id="%s" role="region" aria-labelledby="%s-b %s-ad" data-open="false"><div>%s</div></div></li>'
                % (tid, esc(t), esc(who), esc(gain), tid, tid, tid, icon("asagi", 18, "chev"), tid, tid, tid, detail)
            )
        groups.append('<div class="tgroup" data-reveal style="--i:%d"><h3>%s</h3><ul class="tools" role="list">%s</ul></div>' % (g - 1, esc(name), "".join(items)))
    return (
        '<section class="mod band band--ink on-ink" id="araclar" aria-labelledby="arac-baslik" data-plan>%s<div class="wrap">%s%s'
        '<div class="tgroups">%s</div><div class="band__cta">%s</div></div></section>'
    ) % (surface("nokta"), head(NO["araclar"], "Araçlar", "arac-baslik", "Maliyetinizi, kârınızı ve stok ihtiyacınızı hesaplayın.", "Bu araçlar öneridir. Bu araçlar istoc.com'da henüz yoktur."),
         plan_tag("hizmet"), "".join(groups), lnk("İçerik kütüphanesini görün", "#kutuphane"))


def kutuphane_html():
    types = []
    for n, (p, name, desc, items) in enumerate(KUTUPHANE, 1):
        rows = "".join(
            '<li class="libq"><h4><button type="button" id="lib-b%d-%d" aria-expanded="false" aria-controls="lib-%d-%d">%s%s</button></h4>'
            '<div class="faq__panel libq__panel" id="lib-%d-%d" role="region" aria-labelledby="lib-b%d-%d" data-open="false"><div><p>%s</p></div></div></li>'
            % (n, k, n, k, esc(t), icon("asagi", 18, "chev"), n, k, n, k, esc(d)) for k, (t, d) in enumerate(items, 1)
        )
        extra = lnk("Hesaplama araçlarını görün", "#araclar") if name == "Hesaplayıcılar" else ""
        types.append('<div class="lib__type">%s<h3>%s</h3><p class="lib__d">%s</p><ul class="lib__list" role="list">%s</ul>%s</div>' % (picto(p, "sm"), esc(name), esc(desc), rows, extra))
    return (
        '<section class="lib" id="kutuphane" aria-labelledby="lib-baslik" data-plan><div class="lib__head">%s<h2 id="lib-baslik">İçerik kütüphanesi</h2>'
        '<p class="lib__note">Bu içerikler öneridir. Bu içerikler istoc.com\'da henüz yoktur. Her içeriğin kısa açıklaması burada açılır.</p></div><div class="lib__grid">%s</div></section>'
    ) % (plan_tag("icerik"), "".join(types))


# Planlanan bölümlerin metinleri: sabit liste, etiketler ve yapılardaki cümleler.
PLAN = [] if YAYIN else sorted(set(
    PLAN_METNI + list(PLAN_ETIKET.values())
    + [x for _s, k, h, items in DEGER_BOLUMLERI for x in [k, h] + [y for _p, t, a, b in items for y in [t] + split(a) + split(b)]]
    + [x for _p, who, t in ODEME_PLAN for x in [who] + split(t)] + [x for h, t in ODEME_FAYDA for x in [h] + split(t)]
    + [x for _p, n, d, items in KUTUPHANE for x in [n] + split(d) + [y for t, e in items for y in [t] + split(e)]]
    + [x for g, tools in ARACLAR for x in [g] + [y for tool in tools for z in tool for y in ([z] if z in tool[:2] else split(z))]]
))
# Gezinmede planlanan bölümlere giden bağlantılar
NAV_PLAN = "" if YAYIN else '<a href="#araclar">Araçlar</a><a href="#kutuphane">İçerik kütüphanesi</a>'

DIZIN_HTML = dizin_html()
TL_LABELS = [label for _p, _t, _d, tags in TL for _i, label in tags]

CTX = {
    "u": U,
    "oneri_notu": "" if YAYIN else ONERI_NOTU,
    "kutuphane": "" if YAYIN else kutuphane_html(),
    "b_degerler": "" if YAYIN else degerler_html(),
    "b_odeme_plan": "" if YAYIN else odeme_plan_html(),
    "b_araclar": "" if YAYIN else araclar_html(),
    "nav_plan": NAV_PLAN,
    # Alıcının ve satıcının bölümünden araçlara giden kısa yol. Yalnız önizlemede.
    "arac_alici": "" if YAYIN else lnk("Hesaplama araçlarını görün", "#araclar"),
    "arac_satici": "" if YAYIN else lnk("Hesaplama araçlarını görün", "#araclar"),
    # Hareketli yüzeyler
    "s_ag": surface("ag"), "s_ag2": surface("ag", 2), "s_rota": surface("rota"), "s_nokta": surface("nokta"),
    "title": "iStoc: Üreticiden toptan alım | B2B toptan pazaryeri",
    "description": "Doğrulanmış üreticilerin birim fiyatlarını karşılaştırın. En az sipariş adedini ve hazırlık süresini görün. Teklif isteyin ve bulunduğunuz yerden alın.",
    "canonical": U + "/",
    # Paylaşım görseli canlı sitedeki görseldir. veri.py açıldığını denetler.
    "og_image": U + GORSELLER["paylasim"],
    # Önizleme derlemesi bir tasarım önerisidir. Arama motoru onu dizine eklememelidir.
    "robots": "index,follow" if YAYIN else "noindex,nofollow",
    # Dil seçenekleri canlı sitedeki gibi yalnız tr ve x-default olarak bildirilir.
    # Diğer diller için ayrı ve kalıcı adresler doğrulanmadan dil bağlantısı eklenmez.
    "hreflang": "\n".join('<link rel="alternate" hreflang="%s" href="%s">' % (k, v) for k, v in [("tr", U + "/"), ("x-default", U + "/")]),
    "jsonld": LD,
    # Sayılar: data/ klasöründen
    "n_cats": str(len(CATS)), "n_child": tr_num(N_CHILD),
    "n_listings": tr_num(FACTS["urun_toplami"]), "n_listings_raw": str(FACTS["urun_toplami"]),
    "n_sellers": str(FACTS["magaza_toplami"]), "n_verified": str(FACTS["dogrulanmis_magaza"]),
    "n_cur": str(len(CURS)), "n_yol": str(len(DIZIN)),
    "veri_tarihi": tr_date(FACTS["alindi"]),
    "mega_items": mega_items(),
    # Simgeler
    "i_kure": icon("kure", 20), "i_ara": icon("ara", 20), "i_ara18": icon("ara", 18), "i_mesaj": icon("mesaj", 24), "i_sepet": icon("sepet", 24),
    "i_kisi": icon("kisi", 24), "i_izgara": icon("izgara", 20), "i_chev": icon("asagi", 18, "chev"), "i_ok18": OK18, "i_sol": icon("sol", 20), "i_sag": icon("sag", 20),
    "i_ev": icon("ev", 24), "i_izgara24": icon("izgara", 24), "i_belge": icon("belge", 20),
    "i_go": icon("ok", 20, "btn__go"), "i_bilgi": icon("bilgi", 18), "i_uyari": icon("uyari", 18), "i_eksi": icon("eksi", 20), "i_arti": icon("arti", 20),
    "i_yukari": icon("yukari", 18), "i_isletme18": icon("isletme", 18), "i_onayli": vc(16),
    # Piktogramlar
    "p_teklif": picto("teklif"), "p_ekran": picto("ekran-carsi"), "p_isletme": picto("isletme"), "p_fiyat": picto("fiyat"), "p_kayit": picto("kayit"),
    "p_fatura": picto("fatura"), "p_uretici": picto("uretici"), "p_sure": picto("sure"), "p_kalkan": picto("kalkan"),
    "p_odeme": picto("banka"), "p_destek": picto("destek"), "p_sepet": picto("sepet", "sm"), "p_magaza": picto("magaza", "sm"),
    # Bölüm başlıkları
    "h_alici": head(NO["alici"], "Alıcılar için", "alici-baslik", "Sipariş koşullarınızı kayıtta tutun.", "İşletmenizin toptan alımını bulunduğunuz yerden yaparsınız. Buradan almanın altı faydası aşağıda yazıyor."),
    "h_kat": head(NO["kat"], "Kategoriler", "kat-baslik", "Ürün kategorinizi seçin. O kategorideki ürünleri ve üreticileri bulun.",
                  "%d üst kategori ve %s alt kategori var. Ürünü en çok olan kategoriler önde durur." % (len(CATS), tr_num(N_CHILD)), lnk("%d kategorinin tümü" % len(CATS), U + "/kategoriler")),
    "h_urun": head(NO["urun"], "Ürünler", "urun-baslik", "Fiyatları ve sipariş şartlarını birlikte görün.",
                   # Para birimi yalnız betikle değişir. Betik yoksa bu cümle görünmez.
                   'Fiyat sormanıza gerek yok çünkü ürünlerin fiyatları aşağıda yazıyor. Büyük yazan fiyata KDV dahildir. <span class="js-only">Para birimini sayfanın altından değiştirirsiniz.</span>', lnk("%s ürünün tümü" % tr_num(FACTS["urun_toplami"]), U + "/urunler")),
    "h_uretici": head(NO["uretici"], "Üreticiler", "uretici-baslik", "Çalışacağınız üreticiyi önceden tanıyın.",
                      "iStoc'ta %d mağaza var. %d mağazanın işletme doğrulaması tamamlandı." % (FACTS["magaza_toplami"], FACTS["dogrulanmis_magaza"]), lnk("Tüm üreticiler", U + "/ureticiler")),
    "h_surec": head(NO["surec"], "Sipariş süreci", "surec-baslik", "Her sipariş kayıt altında.",
                    "Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez. Sipariş koşullarınızı iStoc saklar ve siparişinizi teslimata kadar izler.", split=False),
    "h_sss": head(NO["sss"], "Sık sorulanlar", "sss-baslik", "Sipariş vermeden önce sorularınıza yanıt bulun.", link=lnk("Yardım Merkezi", U + "/yardim-merkezi"), split=False),
    "h_satici": head(NO["satici"], "Satıcılar için", "satici-baslik", "Ürünlerinizi doğrudan alıcılara sunun.", "iStoc sizi toptan alıcıyla doğrudan buluşturur. Şu an satışlardan komisyon alınmaz."),
    "h_dizin": head(NO["dizin"], "Dizin", "dizin-baslik", "Ürünü aradığınız özelliğe göre bulun.",
                    "Ürünleri %d farklı ölçüte göre bulursunuz. Her bağlantının yanındaki sayı, istoc.com'da kaç sonuç çıktığını gösterir." % len(DIZIN)),
    # İçerik
    "kyb_sayi": "%d mağazanın %d tanesi doğrulandı." % (FACTS["magaza_toplami"], FACTS["dogrulanmis_magaza"]),
    "quick": "".join('<li><a class="chip" href="%s">%s%s</a></li>' % (esc(search_url(w)), icon("ara", 18), esc(w)) for w in ORNEK_URUN),
    "dir_items": "\n      ".join(dir_items),
    "filters": filters_html(),
    "prods": "\n      ".join(product_card(i, slug, img, cat) for i, (slug, img, cat) in enumerate(URUNLER)),
    "sups": "\n      ".join(supplier_card(i, *s) for i, s in enumerate(URETICILER)),
    "tl": tl_html(),
    "odeme_tiles": "".join('<li class="ptile">%s<span>%s</span></li>' % (picto(p, "sm"), esc(n)) for p, n in ODEME_YONTEMLERI),
    "odeme_chips": "".join('<li>%s<span>%s</span></li>' % (icon(p, 20), esc(n)) for p, n in ODEME_YONTEMLERI),
    "faqs": faq_html(FAQS),
    "rail_ctl": RAIL_CTL,
    "dizin": DIZIN_HTML,
    # Aramada dönen örnekler: ürün örnekleri seçkiden, üretici adları veriden gelir.
    "ornek_urun": esc("|".join(ORNEK_URUN)), "ornek_ilk": esc(ORNEK_URUN[0]),
    "ornek_uretici": esc("|".join(FACTS["ureticiler"][slug]["ad"] for slug, _logo, _thumbs in URETICILER)),
    # Örnek sipariş paneli: seçilen ürünün canlı sitedeki koşulları
    "op_slug": esc(OP["slug"]), "op_name": esc(OP["name"]), "op_img": OP_IMG, "op_inc": para(OP["inc"]), "op_ex": para(OP["ex"]), "op_moq": str(OP["moq"]),
    "op_unit": unit_attrs(OP["unit"]),
    "op_lead": esc(OP["lead"]), "op_carton": carton(OP["specs"]), "op_total": money(PARA_VARSAYILAN, OP["least"][PARA_VARSAYILAN]),
    "op_sup": esc(", ".join(x for x in [OP["sup"], OP["city"]] if x)),
    "op_badge": '<span class="vb">%s%s</span>' % (vc(16), OP["badge"]) if OP["verified"] else "",
    # Alt bölüm
    "fgroups": fgroups(ALT_KISI, False, "kisi"),
    "tgroups": fgroups(ALT_TUR, True, "tur"),
    "dil_tiles": "".join(tile(code, short, name, "", code == "tr", ' lang="%s" dir="%s"' % (code, direction)) for code, name, short, direction in DILLER),
    "para_tiles": "".join(tile(c, PARA[c][0], c, PARA[c][1], c == PARA_VARSAYILAN) for c in CURS),
    "tercih": esc("%s, %s" % (DILLER[0][1], PARA_VARSAYILAN)),
    "sifir": money(PARA_VARSAYILAN, "0.00"),
    # Betik yokken para birimi seçilemez. Sayfa, fiyatların hangi para biriminde yazdığını durağan bir cümleyle söyler.
    "para_sabit": "Fiyatlar %s olarak gösterilir." % PARA[PARA_VARSAYILAN][1],
    "soc": "".join('<a href="%s" rel="noopener" aria-label="iStoc %s hesabı">%s</a>' % (href, n, soc_icon(p)) for n, href, p in SOSYAL),
}

out = render(read("sablon", "bas.html") + read("sablon", "ust.html") + read("sablon", "ana.html") + read("sablon", "alt.html"), CTX)

# --- Denetimler ----------------------------------------------------------------
# 1. Kaynaklı cümleler: secim.py listesi ile veri.py'nin yazdığı kanıt defteri aynı olmalıdır.
# Her cümle kaynağında bulunmuş olmalı ve sayfada birebir geçmelidir. Böylece kaynaksız bir cümle sayfaya giremez.
LEDGER = load("kaynaklar.json")
plain = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", " ", out))))
assert {c["metin"] for c in LEDGER["iddialar"]} == {m[0] for m in IDDIALAR}, "secim.py ile data/kaynaklar.json uyuşmuyor. Önce python3 veri.py çalıştırın."
unproven = [c["metin"] for c in LEDGER["iddialar"] if not c["bulundu"]]
assert not unproven, "Kaynağında bulunamayan cümle: %s" % unproven
absent = [c["metin"] for c in LEDGER["iddialar"] if c["metin"] not in plain]
assert not absent, "Kanıt defterinde olup sayfada geçmeyen cümle: %s" % absent

# 2. Ters denetim: sayfada görünen, en az iki kelimeli her metnin sınıfı bilinmelidir.
# Sınıflar: kaynak (kanıt defteri, birebir), veri (data/ klasörü), tasarim (sayfanın kendi sözü), etiket (düğme ve bağlantı adı).
# Şablona eklenen yeni bir metin sınıflandırılmadan sayfaya giremez.
DATA_COPY = VERI_METNI + ["Sayılar %s günü istoc.com verisinden alındı." % CTX["veri_tarihi"]]
# Dizin ve alt bölüm öğelerinin etiketleri, örnek aramalar ve adım işaretleri secim.py listelerinden gelir.
DESIGN = TASARIM_METNI + ([] if YAYIN else ONIZLEME_TASARIM)
LABELS = sorted(set(ETIKETLER + AUTO_LABELS + ORNEK_URUN + TL_LABELS + ([] if YAYIN else ONIZLEME_ETIKET)))
clash = sorted((set(LABELS) & (set(SOURCED) | set(DESIGN) | set(PLAN))) | (set(PLAN) & (set(SOURCED) | set(DESIGN))))
assert not clash, "Aynı metin iki sınıfta: %s" % clash
ROWS = classify(out, SOURCED, DATA_COPY, DESIGN, LABELS, PLAN)
unknown = [s for s, c in ROWS if c == "yok"]
assert not unknown, "Sınıfı bilinmeyen metin. secim.py içinde IDDIALAR, VERI_METNI, TASARIM_METNI, PLAN_METNI ya da ETIKETLER listesine ekleyin:\n  " + "\n  ".join(unknown)
# Listelerde olup sayfada geçmeyen metin de hatadır. Böylece listeler eskimez.
# Tek kelimelik etiket sayfadan metin olarak çıkarılmaz. O etiketin sayfada geçtiği düz metinde aranır.
present = {s for s, _c in ROWS}
folded = {norm(s) for s in present}
stale = [x for x in DESIGN + LABELS + PLAN if (squeeze(x) not in present if len(x.split()) > 1 else x not in plain)] + [x for x in VERI_METNI if norm(x) not in folded]
assert not stale, "Listede olup sayfada geçmeyen metin. secim.py içinden çıkarın:\n  " + "\n  ".join(stale)

# 2a. Planlanan hizmet ve içerik canlı olgu değildir. Plan metni yalnız data-plan bölgesinde durur.
#     Her bölge görünür etiketini taşır. Yayın derlemesinde planlanan bölge yoktur.
WALK, REGIONS = walk_texts(out)
outside = sorted({t for t, inside in WALK if t in set(PLAN) and not inside})
assert not outside, "Planlanan metin işaretli bölgenin dışında:\n  " + "\n  ".join(outside)
untagged = [r["id"] for r in REGIONS if not r["tagged"]]
assert not untagged, "Planlanan bölgenin görünür etiketi yok: %s" % untagged
assert not (YAYIN and REGIONS), "Yayın derlemesinde planlanan bölge var."

# 2b. Görünmeyen metinler: sayfa başlığı, öznitelik metinleri ve yalnız ekran okuyucuya okunan metinler.
#     En az iki kelimeli her biri kayıtlı olmalıdır (secim.py, OZNITELIK_METNI). Görünen bir etiketin yinelemesi etiket sayılır.
HIDDEN = OZNITELIK_METNI + ([] if YAYIN else ONIZLEME_OZNITELIK) + ["iStoc %s hesabı" % n for n, _u, _p in SOSYAL]
HID_PREFIX = sorted({norm_hidden(x) for x in HIDDEN if x.endswith(":")})
HID_EXACT = sorted({norm_hidden(x) for x in HIDDEN if not x.endswith(":")} | {norm_hidden(x) for x in LABELS + PLAN})
HID_ROWS = hidden_texts(out)
unknown_hidden = [t for t in HID_ROWS if not hidden_known(t, set(HID_EXACT), HID_PREFIX)]
assert not unknown_hidden, "Kayıtsız görünmeyen metin. secim.py içindeki OZNITELIK_METNI listesine ekleyin:\n  " + "\n  ".join(unknown_hidden)
hid_found = {norm_hidden(t) for t in HID_ROWS}
stale_hidden = [x for x in HIDDEN if not (any(f.startswith(norm_hidden(x)) for f in hid_found) if x.endswith(":") else norm_hidden(x) in hid_found)]
assert not stale_hidden, "OZNITELIK_METNI listesinde olup sayfada geçmeyen metin:\n  " + "\n  ".join(stale_hidden)

# 2c. Tek kelimelik adlar sınıflandırmaya girmez. Olgu bildiren adlar bu yüzden ayrıca denetlenir:
#     her ödeme yöntemi, para birimi ve dil adı kanıt defterinde bulunmalıdır.
unsourced = [n for _p, n in ODEME_YONTEMLERI if n not in SOURCED] + [n for _s, n in PARA.values() if n not in SOURCED] + [n for _c, n, _k, _d in DILLER if n not in SOURCED]
assert not unsourced, "Kanıt defterinde olmayan ad. secim.py içindeki IDDIALAR listesine kaynağıyla ekleyin: %s" % unsourced
# 2d. Yapısal verideki soru ve yanıtlar sayfada görünen metnin aynısıdır.
assert all(q in plain and a in plain for q, a in FAQS), "Yapısal verideki soru ya da yanıt sayfada geçmiyor."

# 3. Veri cümlelerinin dayanağı: gösterilen her üretici doğrulanmış ve üretici türünde olmalıdır.
shown = [FACTS["ureticiler"][slug] for slug, _logo, _thumbs in URETICILER]
assert all(f["dogrulanmis"] and f["tur"] == "Manufacturer" for f in shown), "Üreticiler modülünde doğrulanmamış ya da üretici olmayan mağaza var."

# 4. Bağlantılar. Sayfadaki her adres denetlenir: bağlantı, form hedefi, paylaşım görseli ve yapısal verideki adresler.
#    Sunucu adı birebir karşılaştırılır. "istoc.com.baska.site" gibi bir adres istoc.com sayılmaz.
#    istoc.com adresi şunlardan biri olmalıdır:
#      açıldığı denetlenmiş sabit bir sayfa (veri.py, SAYFALAR),
#      canlı sitenin verisinde duran bir kategori,
#      canlı sitenin site haritasında duran bir ürün, mağaza ya da marka sayfası,
#      açıldığı denetlenmiş bir görsel.
#    istoc.com dışındaki adres yalnız canlı sitede geçen bir sosyal hesap, yazı tipi ya da yapısal veri sözlüğü olabilir.
#    Bu denetim adresin var olduğunu gösterir. Giriş isteyen sayfanın girişten sonra ne gösterdiğini göstermez.
PAGES = {p.rstrip("/") for p, v in DZ["sayfalar"].items() if v["durum"] == 200}
CAT_SLUGS = {c["slug"] for c in CATS} | {k["slug"] for c in CATS for k in c["children"]} | {g["slug"] for c in CATS for k in c["children"] for g in k["children"]} | {g["adres"] for g in DZ["urun_gruplari"]}
MAP = DZ["site_haritasi"]
VERIFIED = {m["adres"] for m in DZ["magazalar"]}  # yalnız işletmesi doğrulanmış mağazalar
IMAGES = set(DZ["gorseller"].values())
OUTSIDE = set(DZ["sosyal"])
LIBRARIES = ("https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://schema.org")
PARAMS = {"/urunler": {"q", "sort", "min_order"}}
FRAGMENTS = {"/satici-ol": {"paketler"}}


def link_ok(address):
    u = urlsplit(address)
    if u.scheme != "https":
        return False
    if u.netloc != "istoc.com":
        return address in OUTSIDE or any(address == lib or address.startswith(lib + "/") for lib in LIBRARIES)
    path = unquote(u.path)
    bare = path.rstrip("/")
    parts = bare.split("/")
    if u.fragment and u.fragment not in FRAGMENTS.get(bare, set()):
        return False
    if bare.startswith("/kategori/"):
        return len(parts) == 3 and parts[2] in CAT_SLUGS and not u.query
    if bare.startswith("/urun/"):
        return bare in MAP["urun"] and not u.query
    if bare.startswith("/magaza/"):
        return bare in MAP["magaza"] and parts[2] in VERIFIED and not u.query
    if bare.startswith("/marka/"):
        return bare in MAP["marka"] and not u.query
    if path in IMAGES:
        return not u.query
    return bare in PAGES and set(parse_qs(u.query)) <= PARAMS.get(bare, set())


ADDRESSES = sorted({html.unescape(m.group(0)) for m in re.finditer(r"https?://[^\s\"'<>\\)]+", out)})
dead = [a for a in ADDRESSES if not link_ok(a)]
assert not dead, "Denetlenmemiş adres. Sabit sayfa ise secim.py içindeki SAYFALAR listesine ekleyip python3 veri.py çalıştırın:\n  " + "\n  ".join(dead)
anchors = set(re.findall(r'href="#([^"]+)"', out))
missing_ids = sorted(a for a in anchors if not re.search(r'\bid="%s"' % re.escape(a), out))
assert not missing_ids, "Sayfa içi bağlantının hedefi yok: %s" % missing_ids

# kapi.mjs aynı denetimleri üretilen sayfada yineler. Sınıf listeleri onun için yazılır.
json.dump(
    {
        "kaynak": sorted({squeeze(m[0]) for m in IDDIALAR}),
        "veri": sorted({norm(x) for x in DATA_COPY}),
        "tasarim": sorted({squeeze(x) for x in DESIGN}),
        "etiket": sorted({squeeze(x) for x in LABELS}),
        "plan": sorted({squeeze(x) for x in PLAN}),
        "betik": sorted({squeeze(x) for x in BETIK_METNI}),
        # Görünmeyen metinler: kayıtlı metinler ile görünen etiketler, ve iki nokta ile biten ön ekler.
        "gizli": HID_EXACT,
        "gizli_on_ek": HID_PREFIX,
    },
    open(os.path.join(HERE, "data", "metin.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1,
)

open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("index.html yazıldı (%s): %s bayt, %d menü kategorisi, %d ürün, %d üretici, %d dizin grubu" % ("yayın" if YAYIN else "önizleme", tr_num(len(out.encode("utf-8"))), MENU_CATS, len(URUNLER), len(URETICILER), len(DIZIN)))
# Canlı sitede her ürün bir kategoriye bağlı değildir. Bu yüzden iki toplam farklıdır.
print("veri günü %s: ürün toplamı %s, kategoriye bağlı ürün %s" % (FACTS["alindi"], tr_num(FACTS["urun_toplami"]), tr_num(sum(COUNTS.values()))))
print("kaynaklı cümle: %d, hepsi kaynağında bulundu (%s)" % (len(LEDGER["iddialar"]), LEDGER["alindi"]))
print("adres: %d ayrı adres denetlendi (%d istoc.com), %d sayfa içi hedef var" % (len(ADDRESSES), sum(1 for a in ADDRESSES if urlsplit(a).netloc == "istoc.com"), len(anchors)))
print("görünmeyen metin: %d, hepsi kayıtlı" % len(HID_ROWS))
print("sayfadaki metin: %d (kaynak %d, veri %d, tasarım %d, etiket %d, plan %d)" % (len(ROWS), *(sum(c == k for _s, c in ROWS) for k in ("kaynak", "veri", "tasarim", "etiket", "plan"))))
