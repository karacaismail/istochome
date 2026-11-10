# Ana sayfayı üretir.
#   python3 build.py           önizleme derlemesi. Sayfa arama motorlarına kapalıdır (noindex).
#   python3 build.py --yayin   yayın derlemesi. Sayfa arama motorlarına açıktır (index).
# Girdi: sablon/ klasörü, secim.py ve data/ klasörü (veri.py yazar). Ağa çıkmaz.
# Çıktı: index.html
# Kapsam: yalnız ana sayfa. Kategoriler sayfa olarak üretilmez, menü öğesi olarak yer alır.
# Kural: sayfadaki her sayı ve her olgu data/ klasöründen gelir. Bu dosyada olgu yazmaz.
import html
import json
import os
import re
import sys
from urllib.parse import quote

from piktogram import icon, picto
from metin import classify, norm, squeeze
from secim import BETIK_METNI, ETIKETLER, GRUPLAR, IDDIALAR, ORNEK_SIPARIS, ORNEK_URUN, TASARIM_METNI, URETICILER, URUNLER, VERI_METNI

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
USD = load("kur.json")["TRY"]["USD"]  # 1 TRY kaç USD eder
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
    # Menü öğeleri canlı sitedeki kategori listesine gider.
    # Adres parçası kodlanır. Böylece veri kaynağından gelen bir işaret HTML'i bozamaz.
    return "%s/urunler?category=%s" % (U, quote(slug, safe=""))


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
def money(try_amount):
    """TRY tutarını USD metnine çevirir. Örnek: 180 TRY, 3.59 olur."""
    return "%.2f" % (try_amount * USD)


def product(slug):
    """Seçilen ürünün sayfada kullanılan bütün olguları. Hepsi canlı siteden alınmış veridir."""
    f = FACTS["urunler"][slug]
    assert f["birim"] == "Adet", "Birim beklenmiyor: %s" % f["birim"]
    return {
        "slug": slug,
        "href": "%s/urun/%s" % (U, quote(slug, safe="")),
        # Canlı sitedeki ad korunur. Yalnız "Ve" bağlacı küçük harfe çevrilir.
        "name": re.sub(r"\bVe\b", "ve", f["ad"]),
        "ex": money(f["fiyat_try"]),
        "inc": money(f["fiyat_try"] * (1 + f["kdv"] / 100)),
        "moq": int(f["en_az_adet"]),
        "lead": f["hazirlik"],
        "sup": f["uretici"],
        "city": f["uretici_sehir"],
        "verified": f["uretici_dogrulanmis"],
        # Rozet "üretici" sözünü yalnız mağazanın işletme türü üreticiyse kullanır.
        "badge": "Doğrulanmış üretici" if f.get("uretici_tur") == "Manufacturer" else "Doğrulanmış satıcı",
        "specs": f["ozellikler"],
    }


def terms(pairs):
    return "".join("<div><dt>%s</dt><dd data-veri>%s</dd></div>" % (esc(k), esc(v)) for k, v in pairs if v)


def product_card(i, slug, img, cat):
    """Ürün kartı. Büyük fiyat KDV dahildir. Doğrulama rozeti yalnız doğrulanmış üreticide görünür."""
    p = product(slug)
    badge = '<span class="vb vb--pill pc__badge">%s%s</span>' % (vc(16), p["badge"]) if p["verified"] else ""
    return """<li data-cat="%(cat)s" data-reveal style="--i:%(col)d;view-transition-name:pc-%(i)d">
        <article class="pc" data-slug="%(slug)s" data-name="%(name)s" data-unit="%(inc)s" data-moq="%(moq)d">
          <a class="pc__media" href="%(href)s" tabindex="-1" aria-hidden="true"><img src="img/%(img)s" alt="" width="768" height="768" loading="lazy" decoding="async"></a>
          %(badge)s
          <div class="pc__body">
            <p class="pc__sup" data-veri>%(sup)s</p>
            <h3 class="pc__name" data-veri><a href="%(href)s">%(name)s</a></h3>
            <p class="pc__price"><b>$%(inc)s</b><span>adet başına</span></p>
            <p class="pc__ex">KDV hariç $%(ex)s</p>
          </div>
          <div class="pc__foot">
            <dl class="terms">%(terms)s</dl>
            <button class="pc__add" type="button" aria-pressed="false" aria-label="%(moq)d adet sepete ekleyin: %(name)s"><i>%(plus)s%(check)s</i><span>%(moq)d adet ekleyin</span></button>
          </div>
        </article>
      </li>""" % dict(
        i=i, col=i % 4, slug=esc(slug), name=esc(p["name"]), sup=esc(p["sup"]), inc=p["inc"], ex=p["ex"], moq=p["moq"], href=p["href"], img=img, cat=cat,
        badge=badge, terms=terms([("En az sipariş adedi", "%d adet" % p["moq"]), ("Hazırlık süresi", p["lead"])]),
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
        <article class="sc">
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


# Sipariş süreci ve sık sorulanlar. Kaynaklı her cümle secim.py içindeki IDDIALAR listesinde durur.
ODEME_YOLU = (
    "Ödemeyi satıcının sunduğu yöntemle doğrudan satıcıya yaparsınız. "
    "Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a ödersiniz. "
    "Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez."
)
TL = [
    ("siparis", "Sipariş koşullarında anlaşırsınız", "Satıcıyla sipariş koşullarında anlaşırsınız. Sonra siparişi başlatırsınız."),
    # Kilitli kart piktogramı yalnız gerçek ödeme adımında kullanılır. Burada düz kart durur.
    # Kaynak iki ödeme yolu sayar: doğrudan satıcıya ya da, sunulduğunda, tek ödemeyle Thoptan.com'a. İkisi de yazılır.
    ("kart", "Ödemeyi yaparsınız", ODEME_YOLU),
    ("kayit", "Sipariş koşullarınız kaydedilir", "Kabul ettiğiniz sipariş koşullarının bir kopyasını iStoc saklar. Sipariş durumunu teslimata kadar iStoc izler."),
    ("destek", "Sorun çıkarsa destek alırsınız", "Sipariş koşulları karşılanmazsa talep açarsınız. Sorunu, kabul ettiğiniz koşullara göre çözmenize iStoc yardım eder."),
]
FAQS = [
    ("Ödemeyi kime yaparım?", ODEME_YOLU),
    ("Hangi ödeme yöntemleri geçerlidir?", "Geçerli yöntemi satıcı belirler. Satıcı kredi kartı, banka kartı ya da EFT kabul edebilir. Satıcı başka yöntemler de sunabilir."),
    ("En az sipariş adedini nerede görürüm?", "En az sipariş adedi ürün kartında yazar. Sepette bu adedin altında kalırsanız iStoc sizi uyarır."),
    ("Doğrulama rozeti ne demektir?", "Rozet, mağazanın işletme doğrulamasının tamamlandığını gösterir. Rozet üretici kartında ve ürün kartında durur."),
    ("Siparişim gelmezse ne olur?", "Sipariş gönderilmezse ya da kaybolursa iade talebi oluşturursunuz. Ürün kusurlu, yanlış ya da hasarlı gelirse de iade talebi oluşturursunuz. İadeyi, ödeme yaptığınız taraf yapar. İade, kabul ettiğiniz koşullara göre yapılır."),
    ("Teslimat süresi nasıl belirlenir?", "Teslimat süresini ve gönderim şeklini satıcı siparişte belirtir. Ürün gönderilince takip numarası sipariş ayrıntılarınıza eklenir. Kargo firmasının adı da eklenir."),
]
# Ödeme yöntemleri canlı sitedeki ticaret güvencesi sayfasında sayılır. Yöntemi satıcı seçer.
# Bu yüzden liste her yerde aynı açıklamayla birlikte yazılır.
ODEME = "Visa, Mastercard, AMEX, PayPal, EFT. Geçerli yöntemi satıcı belirler."

# Site dilleri. Kaynak: canlı sitenin dil seçicisi (secim.py, IDDIALAR).
DILLER = [("tr", "Türkçe"), ("en", "English"), ("ar", "العربية"), ("ru", "Русский")]

# Alt bölüm sütunları. Son sütun kategori menü öğeleridir.
FG = [
    ("Alıcılar için", [("Teklif isteği", "/pages/dashboard/rfq.html"), ("Üreticiler", "/pages/manufacturers.html"), ("Tüm kategoriler", "/pages/categories.html"),
                       ("Haftanın fırsatları", "/pages/top-deals.html"), ("Yeni ürünler", "/urunler?sort=newest"), ("Sipariş takibi", "/hesabim/siparisler")]),
    ("Satıcılar için", [("Satışa başlayın", "/satici-ol"), ("Satıcı Merkezi", "/panel/"), ("Paketler ve ücretler", "/satici-ol#paketler"), ("Satıcı Hizmet Sözleşmesi", "/satici-hizmet-sozlesmesi")]),
    ("Ticaret güvencesi", [("Nasıl işler?", "/ticaret-guvencesi"), ("Ödeme seçenekleri", "/odeme-secenekleri"), ("Para iade politikası", "/iade-politikasi"),
                           ("Satış sonrası korumalar", "/satis-sonrasi"), ("Alıcı Koruma Programı", "/ticaret-guvencesi-detay")]),
    ("Destek", [("Yardım Merkezi", "/yardim-merkezi"), ("Canlı destek", "/destek/taleplerim"), ("Kargo ve teslimat", "/kargo-lojistik"), ("İadeler", "/iade-kosullari"), ("Kötüye kullanım bildirin", "/destek/yeni")]),
    ("Kategoriler", [(c["name"], "/urunler?category=" + quote(c["slug"], safe="")) for c in RANKED[:5]] + [("Tüm kategoriler", "/kategoriler")]),
]
# Sosyal hesaplar: canlı sitenin alt bölümündeki adresler.
CAT_NAMES = {c["name"] for c in CATS}
SOC = [
    ("Instagram", "https://www.instagram.com/istoc_com", '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.7" cy="7.3" r=".6"/>'),
    ("Facebook", "https://www.facebook.com/istoccom", '<path d="M14 21v-7h2.5l.5-3H14V9.2c0-1 .4-1.7 1.8-1.7H17V4.8c-.5-.1-1.3-.2-2.2-.2C12.5 4.6 11 6 11 8.7V11H8.5v3H11v7"/>'),
    ("X", "https://x.com/istoc_com", '<path d="M5 4.5 19 19.5M19 4.5 5 19.5"/>'),
    ("LinkedIn", "https://www.linkedin.com/company/istoc-com", '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.5 1-2.5 2.3-2.5S16 11.4 16 13v3"/>'),
    ("YouTube", "https://youtube.com/@istoccom", '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>'),
]


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


# --- Arama motoru için yapısal veri (yalnız ana sayfa) -----------------------
# Ürün listesi özet kalıbındadır: her öğe adını ve ürün sayfasının adresini taşır.
# Fiyat bilgisi yapısal veriye konmaz, çünkü sayfadaki fiyat seçili para birimine göre değişir.
def jsonld(*objs):
    # "<" işareti kaçışla yazılır. Böylece veri kaynağından gelen bir ad betik etiketini kapatamaz.
    return "\n".join('<script type="application/ld+json">%s</script>' % json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c") for o in objs)


PRODUCTS = [product(slug) for slug, _img, _cat in URUNLER]
LD = jsonld(
    {"@context": "https://schema.org", "@type": "Organization", "name": "iStoc", "legalName": "iStoc Private Company Limited", "url": U + "/", "logo": U + "/images/istoc-logo.png",
     "sameAs": [href for _n, href, _p in SOC]},
    {"@context": "https://schema.org", "@type": "WebSite", "name": "iStoc", "url": U + "/", "inLanguage": "tr",
     "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": U + "/urunler?q={search_term_string}"}, "query-input": "required name=search_term_string"}},
    {"@context": "https://schema.org", "@type": "ItemList", "name": "Fiyatı ve koşulu açık ürünler", "numberOfItems": len(PRODUCTS),
     "itemListElement": [{"@type": "ListItem", "position": i, "name": p["name"], "url": p["href"]} for i, p in enumerate(PRODUCTS, 1)]},
    {"@context": "https://schema.org", "@type": "FAQPage",
     "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS]},
)

# --- Sayfa -------------------------------------------------------------------
dir_items = []
for i, c in enumerate(RANKED[:12]):
    subs = "".join('<a href="%s">%s</a>' % (cat_url(k["slug"]), esc(k["name"])) for k in c["children"][:3])
    dir_items.append(
        '<li class="dir__item" data-reveal style="--i:%d"><a class="dir__head" href="%s">%s<span><h3 data-veri>%s</h3><small>%s</small></span>%s</a>'
        '<div class="dir__subs" data-veri>%s</div></li>' % (i % 3, cat_url(c["slug"]), cat_picto(c), esc(c["name"]), cat_count(c), icon("ok", 18), subs)
    )

OP = product(ORNEK_SIPARIS)
OP_IMG = dict((s, img) for s, img, _c in URUNLER)[ORNEK_SIPARIS]

# Öneri notu: yalnız önizleme derlemesinde görünür. Sayfa herkese açık bir adreste yayımlanınca
# ziyaretçi, sayfanın canlı site olmadığını en başta okur.
ONERI_NOTU = (
    '<aside class="demo" aria-label="Öneri notu"><div class="wrap demo__in">'
    "<p>Bu sayfa bir tasarım önerisidir.</p>"
    '<a class="lnk" href="%s/"><span>Canlı siteye gidin</span>%s</a>'
    "</div></aside>"
) % (U, OK18)

CTX = {
    "u": U,
    "oneri_notu": "" if YAYIN else ONERI_NOTU,
    "title": "iStoc: Üreticiden toptan alım | B2B toptan pazaryeri",
    "description": "Doğrulanmış üreticilerin birim fiyatını, en az sipariş adedini ve hazırlık süresini karşılaştırın. Teklif isteyin, toptan alımı yerinizden yapın.",
    "canonical": U + "/",
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
    "n_cur": str(len(FACTS["para_birimleri"])), "para_birimleri": esc(", ".join(FACTS["para_birimleri"])),
    "diller": esc(", ".join(name for _code, name in DILLER)),
    "veri_tarihi": tr_date(FACTS["alindi"]),
    "odeme": ODEME,
    "mega_items": mega_items(),
    # Simgeler
    "i_kure": icon("kure", 20), "i_ara": icon("ara", 20), "i_mesaj": icon("mesaj", 24), "i_sepet": icon("sepet", 24),
    "i_kisi": icon("kisi", 24), "i_izgara": icon("izgara", 20), "i_chev": icon("asagi", 18, "chev"), "i_ok18": OK18, "i_sol": icon("sol", 20), "i_sag": icon("sag", 20),
    "i_asagi": icon("asagi", 20), "i_ev": icon("ev", 24), "i_izgara24": icon("izgara", 24), "i_belge": icon("belge", 20),
    "i_go": icon("ok", 20, "btn__go"), "i_bilgi": icon("bilgi", 18), "i_uyari": icon("uyari", 18), "i_eksi": icon("eksi", 20), "i_arti": icon("arti", 20),
    # Piktogramlar
    "p_teklif": picto("teklif"), "p_ekran": picto("ekran-carsi"), "p_isletme": picto("isletme"), "p_fiyat": picto("fiyat"), "p_kayit": picto("kayit"),
    "p_fatura": picto("fatura"), "p_uretici": picto("uretici"), "p_sure": picto("sure"), "p_kalkan": picto("kalkan"),
    "p_kalkan_ok": picto("kalkan", "md", "ok"), "p_adet": picto("adet"), "p_destek": picto("destek"),
    # İçerik
    "dir_items": "\n      ".join(dir_items),
    "filters": filters_html(),
    "prods": "\n      ".join(product_card(i, slug, img, cat) for i, (slug, img, cat) in enumerate(URUNLER)),
    "sups": "\n      ".join(supplier_card(i, *s) for i, s in enumerate(URETICILER)),
    "tl": "".join("<li>%s<div><h3><b>%02d</b>%s</h3><p>%s</p></div></li>" % (picto(p), n, t, d) for n, (p, t, d) in enumerate(TL, 1)),
    "faqs": faq_html(FAQS),
    "rail_ctl": RAIL_CTL,
    # Aramada dönen örnekler: ürün örnekleri seçkiden, üretici adları veriden gelir.
    "ornek_urun": esc("|".join(ORNEK_URUN)), "ornek_ilk": esc(ORNEK_URUN[0]),
    "ornek_uretici": esc("|".join(FACTS["ureticiler"][slug]["ad"] for slug, _logo, _thumbs in URETICILER)),
    # Örnek sipariş paneli: seçilen ürünün canlı sitedeki koşulları
    "op_slug": esc(OP["slug"]), "op_name": esc(OP["name"]), "op_img": OP_IMG, "op_inc": OP["inc"], "op_ex": OP["ex"], "op_moq": str(OP["moq"]),
    "op_lead": esc(OP["lead"]), "op_carton": carton(OP["specs"]), "op_total": "%.2f" % (float(OP["inc"]) * OP["moq"]),
    "op_sup": esc(", ".join(x for x in [OP["sup"], OP["city"]] if x)),
    "op_badge": '<span class="vb">%s%s</span>' % (vc(16), OP["badge"]) if OP["verified"] else "",
    "fgroups": "".join(
        '<details class="fgroup" open><summary>%s%s</summary><ul>%s</ul></details>\n    '
        % (t, icon("asagi", 20), "".join('<li><a href="%s%s"%s>%s</a></li>' % (U, h, " data-veri" if l in CAT_NAMES else "", esc(l)) for l, h in ls)) for t, ls in FG
    ),
    "langs": "".join(
        '<li role="option" id="dil-%s" aria-selected="%s" data-value="%s, USD" data-veri>%s, USD%s</li>' % (k, "true" if k == "tr" else "false", v, v, icon("onay", 18))
        for k, v in DILLER
    ),
    "soc": "".join('<a href="%s" rel="noopener" aria-label="iStoc %s hesabı">%s</a>' % (href, n, soc_icon(p)) for n, href, p in SOC),
}

out = render(read("sablon", "bas.html") + read("sablon", "ust.html") + read("sablon", "ana.html") + read("sablon", "alt.html"), CTX)

# Kaynaklı cümleler: secim.py listesi ile veri.py'nin yazdığı kanıt defteri aynı olmalıdır.
# Her cümle kaynağında bulunmuş olmalı ve sayfada birebir geçmelidir. Böylece kaynaksız bir cümle sayfaya giremez.
LEDGER = load("kaynaklar.json")
plain = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", " ", out))))
assert {c["metin"] for c in LEDGER["iddialar"]} == {m[0] for m in IDDIALAR}, "secim.py ile data/kaynaklar.json uyuşmuyor. Önce python3 veri.py çalıştırın."
unproven = [c["metin"] for c in LEDGER["iddialar"] if not c["bulundu"]]
assert not unproven, "Kaynağında bulunamayan cümle: %s" % unproven
absent = [c["metin"] for c in LEDGER["iddialar"] if c["metin"] not in plain]
assert not absent, "Kanıt defterinde olup sayfada geçmeyen cümle: %s" % absent

# Ters denetim: sayfada görünen, en az iki kelimeli her metnin sınıfı bilinmelidir.
# Sınıflar: kaynak (kanıt defteri, birebir), veri (data/ klasörü), tasarim (sayfanın kendi sözü), etiket (düğme ve bağlantı adı).
# Şablona eklenen yeni bir metin sınıflandırılmadan sayfaya giremez.
DATA_COPY = VERI_METNI + ["Sayılar %s günü istoc.com verisinden alındı." % CTX["veri_tarihi"]]
# Öneri notunun etiketi yalnız önizleme derlemesinde sayfada bulunur.
LABELS = ETIKETLER + ([] if YAYIN else ["Canlı siteye gidin"])
ROWS = classify(out, [m[0] for m in IDDIALAR], DATA_COPY, TASARIM_METNI, LABELS)
unknown = [s for s, c in ROWS if c == "yok"]
assert not unknown, "Sınıfı bilinmeyen metin. secim.py içinde IDDIALAR, VERI_METNI, TASARIM_METNI ya da ETIKETLER listesine ekleyin:\n  " + "\n  ".join(unknown)
# Listelerde olup sayfada geçmeyen metin de hatadır. Böylece listeler eskimez.
present = {s for s, _c in ROWS}
folded = {norm(s) for s in present}
stale = [x for x in TASARIM_METNI + LABELS if squeeze(x) not in present] + [x for x in VERI_METNI if norm(x) not in folded]
assert not stale, "Listede olup sayfada geçmeyen metin. secim.py içinden çıkarın:\n  " + "\n  ".join(stale)
# Veri cümlelerinin dayanağı: gösterilen her üretici doğrulanmış ve üretici türünde olmalıdır.
shown = [FACTS["ureticiler"][slug] for slug, _logo, _thumbs in URETICILER]
assert all(f["dogrulanmis"] and f["tur"] == "Manufacturer" for f in shown), "Üreticiler modülünde doğrulanmamış ya da üretici olmayan mağaza var."
# kapi.mjs aynı denetimi üretilen sayfada yineler. Sınıf listeleri onun için yazılır.
json.dump(
    {
        "kaynak": sorted({squeeze(m[0]) for m in IDDIALAR}),
        "veri": sorted({norm(x) for x in DATA_COPY}),
        "tasarim": sorted({squeeze(x) for x in TASARIM_METNI}),
        "etiket": sorted({squeeze(x) for x in LABELS}),
        "betik": sorted({squeeze(x) for x in BETIK_METNI}),
    },
    open(os.path.join(HERE, "data", "metin.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1,
)

open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("index.html yazıldı (%s): %s bayt, %d menü kategorisi, %d ürün, %d üretici" % ("yayın" if YAYIN else "önizleme", tr_num(len(out.encode("utf-8"))), MENU_CATS, len(URUNLER), len(URETICILER)))
# Canlı sitede her ürün bir kategoriye bağlı değildir. Bu yüzden iki toplam farklıdır.
print("veri günü %s: ürün toplamı %s, kategoriye bağlı ürün %s" % (FACTS["alindi"], tr_num(FACTS["urun_toplami"]), tr_num(sum(COUNTS.values()))))
print("kaynaklı cümle: %d, hepsi kaynağında bulundu (%s)" % (len(LEDGER["iddialar"]), LEDGER["alindi"]))
print("sayfadaki metin: %d (kaynak %d, veri %d, tasarım %d, etiket %d)" % (len(ROWS), sum(c == "kaynak" for _s, c in ROWS), sum(c == "veri" for _s, c in ROWS), sum(c == "tasarim" for _s, c in ROWS), sum(c == "etiket" for _s, c in ROWS)))
