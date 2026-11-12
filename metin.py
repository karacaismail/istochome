# Sayfadaki metinleri çıkarır ve sınıflandırır.
# Kural: sayfada görünen, en az iki kelimeli her metnin sınıfı bilinir. Sınıfı bilinmeyen metin sayfaya giremez.
#   kaynak  canlı sitedeki bir sayfaya dayanan cümle (secim.py, IDDIALAR). veri.py kanıtını arar.
#           Bu sınıfta eşleşme birebirdir. Sayısı değişen bir cümle başka bir cümledir.
#   veri    sayısı ya da dayanağı data/ klasöründen gelen metin (secim.py, VERI_METNI). Sayılar # ile yazılır.
#   tasarim bu sayfanın kendi sözü: değer önerisi, başlık, soru, yönerge ve öneri notu (secim.py, TASARIM_METNI).
#   etiket  düğme, bağlantı ve alan etiketi (secim.py, ETIKETLER). Canlı sitedeki bir sayfanın adı da etikettir.
# Veri kaynağından gelen adlar (ürün, kategori, mağaza) sayfada data-veri ile işaretlenir ve sınıflandırılmaz.
# Görünmeyen metinler de kayıtlıdır: sayfa başlığı, öznitelik metinleri ve yalnız ekran okuyucuya okunan metinler
# (secim.py, OZNITELIK_METNI). Görünen bir etiketin yinelemesi etiket listesinden tanınır.
# Kapsam dışı kalan: tek kelimelik metin. Tek kelimelik bir olgu adı (ödeme yöntemi, para birimi, dil)
# build.py içinde ayrıca denetlenir: her biri kanıt defterinde bulunmalıdır.
# build.py bu modülü kullanır ve sınıfsız metin bulursa durur. kapi.mjs aynı çıkarımı üretilen sayfada yineler.
import html
import re

VOID = {"img", "input", "br", "meta", "link", "hr"}


def squeeze(text):
    return re.sub(r"\s+", " ", text).strip()


def norm(text):
    """Veri sınıfının karşılaştırma biçimi: sayılar # olur."""
    return re.sub(r"\d[\d.,]*", "#", squeeze(text))


def split(text):
    """Metni cümlelere böler. En az iki kelimeli parçalar alınır."""
    return [p for p in re.split(r"(?<=[.?!])\s+", text) if len(p.split()) >= 2]


def page_texts(doc):
    """Sayfada görünen, en az iki kelimeli bütün metinler.
    Arama motoru açıklaması da sayılır. data-veri ile işaretli adlar ve yalnız ekran okuyucuya
    okunan yinelemeler (sr-only) sayılmaz."""
    out = []
    desc = re.search(r'<meta name="description" content="([^"]*)"', doc)
    if desc:
        out += split(html.unescape(desc.group(1)))
    body = doc[doc.index("<body"):]
    body = re.sub(r"<!--[\s\S]*?-->", " ", body)
    body = re.sub(r"<(script|style|svg)\b[\s\S]*?</\1>", " ", body)
    stack = []
    for m in re.finditer(r"<(/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)", body):
        closing, tag, attrs, text = m.group(1), (m.group(2) or "").lower(), m.group(3) or "", m.group(4)
        if text is not None:
            t = squeeze(html.unescape(text))
            if t and not any(stack):
                out += split(t)
        elif closing:
            if tag not in VOID and stack:
                stack.pop()
        elif tag not in VOID:
            stack.append("data-veri" in attrs or "sr-only" in attrs)
    seen, uniq = set(), []
    for s in out:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


def norm_hidden(text):
    """Görünmeyen metnin karşılaştırma biçimi: tutar ve sayı # olur. Örnek: "Toplam $619,01", "Toplam #" olur."""
    return re.sub(r"[£$€₺]?\d[\d.,]*", "#", squeeze(text))


def hidden_texts(doc):
    """Ekranda yazmayan ama okunan, en az iki kelimeli metinler: sayfa başlığı, öznitelik metinleri
    (aria-label, placeholder, alt, title) ve yalnız ekran okuyucuya okunan metinler (sr-only)."""
    out = []
    title = re.search(r"<title>([^<]*)</title>", doc)
    if title:
        out.append(title.group(1))
    body = doc[doc.index("<body"):]
    body = re.sub(r"<!--[\s\S]*?-->", " ", body)
    body = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", body)
    out += [m.group(2) for m in re.finditer(r'\b(aria-label|placeholder|alt|title)="([^"]*)"', body)]
    # Yalnız ekran okuyucuya okunan metin. Veriden gelen ad (data-veri) sınıflandırılmaz, görünen metinde olduğu gibi.
    for m in re.finditer(r'<([a-z0-9]+)\b([^>]*)>([^<]*)</\1>', body):
        if re.search(r'\bclass="[^"]*\bsr-only\b', m.group(2)) and "data-veri" not in m.group(2):
            out.append(m.group(3))
    seen, uniq = set(), []
    for s in (squeeze(html.unescape(x)) for x in out):
        if len(s.split()) >= 2 and s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


def hidden_known(text, exact):
    """Görünmeyen metin kayıtlı mı? exact: kayıtlı metinler ve görünen etiketler. Eşleşme birebirdir.
    Bölüm adının yinelemesi iki nokta ile biter ("Alıcılar için:"). Karşılaştırmada o iki nokta atılır."""
    t = norm_hidden(text)
    return t in exact or t.rstrip(":").strip() in exact


def classify(doc, sourced, data_copy, design_copy, labels):
    """Her metni sınıfıyla döndürür. Sınıfı olmayan metin "yok" sınıfını alır."""
    exact = {}
    for name, items in (("etiket", labels), ("tasarim", design_copy), ("kaynak", sourced)):
        for item in items:
            exact[squeeze(item)] = name
    folded = {norm(item) for item in data_copy}
    rows = []
    for s in page_texts(doc):
        rows.append((s, exact.get(s) or ("veri" if norm(s) in folded else "yok")))
    return rows
