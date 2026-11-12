# Seçki: ana sayfada neyin yer alacağını ve sayfadaki her metnin sınıfını belirler.
# Bu dosyada yalnız seçim ve sunum bilgisi durur: adres, görsel dosyası, süzgeç grubu, arama kelimesi.
# Fiyat, en az adet, hazırlık süresi, sonuç sayısı ve doğrulama gibi olgular burada yazmaz.
# Olguları veri.py canlı siteden alır ve data/ klasörüne yazar.

# Ürünler: (ürün adresi, görsel dosyası, süzgeç grubu)
URUNLER = [
    ("suzgecli-ve-bolmeli-organizer-5-lt", "organizer-5.webp", "saklama"),
    ("miknatisli-baharatlik", "baharatlik.webp", "mutfak"),
    ("kristal-slim-aski-10-lu", "slim-aski.webp", "aski"),
    ("softline-lavabo-ve-kuvet-fircasi", "lavabo-fircasi.webp", "temizlik"),
    ("renkli-sapli-meyve-bicagi", "meyve-bicagi.webp", "mutfak"),
    ("fresh-box-kilitli-organizer-5-lt", "freshbox-5.webp", "saklama"),
    ("mikrofiber-kurulama-bezi-5-li-paket", "kurulama-bezi.webp", "temizlik"),
    ("ayarlanabilir-paslanmaz-kek-kalibi", "kek-kalibi.webp", "mutfak"),
]

# Süzgeç grupları: (anahtar, etiket). Sıra, süzgeç düğmelerinin sırasıdır.
GRUPLAR = [("mutfak", "Mutfak"), ("saklama", "Saklama"), ("temizlik", "Temizlik"), ("aski", "Askı")]

# Aramada dönen örnek kelimeler. Aynı kelimeler karşılamada "Örnek aramalar" kısa yolu olarak da durur.
# Kelimeleri biz seçtik. Ne kadar arandıkları bilinmez, bu yüzden sayfa "sık aranan" demez.
# veri.py her kelimenin canlı sitede sonuç verdiğini denetler.
ORNEK_URUN = ["saklama kabı", "çöp kovası", "elbise askısı", "temizlik fırçası", "baharatlık"]

# Örnek sipariş panelinde gösterilen ürün
ORNEK_SIPARIS = "suzgecli-ve-bolmeli-organizer-5-lt"

# Üreticiler: (mağaza adresi, logo dosyası, ürün görselleri)
URETICILER = [
    ("cetin-plastik", "s-logo-cetin.jpg", ["lavabo-fircasi.webp", "temizlik-seti.webp", "cok-amacli-firca.webp"]),
    ("avcilar-plastik", "s-logo-avcilar.png", ["slim-aski.webp", "star-aski.webp", "boncuk-aski.webp"]),
    ("alkan-plastik", "s-logo-alkan.png", ["organizer-9.webp", "kasiklik-8.webp", "freshbox-5.webp"]),
    ("solingen-bicak", "s-logo-solingen.jpg", ["baharatlik.webp", "kek-kalibi.webp", "mikro-bicak.webp"]),
]

# Kuruluş yılı alanı boş olan mağaza için mağazanın kendi açıklamasından alınan bilgi.
# (etiket, değer, mağaza açıklamasında bulunması gereken ifade). veri.py ifadeyi açıklamada arar.
MAGAZA_NOTU = {
    "solingen-bicak": ("Faaliyet", "1992'den beri", "1992'den bu yana"),
}

# --- Dizin: programatik arama motoru stratejileri ----------------------------
# Her grup ayrı bir stratejidir: sayfa, bir veri boyutundan üretilir. Konum (şehir, ilçe) kullanılmaz.
# Bu görevde sayfa üretilmez. Her öğe bir menü öğesidir ve canlı sitede çalışan bir adrese gider.
# veri.py her öğenin sonuç sayısını canlı siteden alır. Sonucu DIZIN_EN_AZ değerinin altında kalan öğe sayfaya girmez.
DIZIN_EN_AZ = 5
DIZIN_OGE = 6  # bir grupta gösterilen en çok öğe
# tur: "veri"  öğeler veriden gelir (kategori ağacı, mağaza listesi, marka listesi)
#      "arama" öğeler aşağıdaki arama kelimeleridir: (etiket, arama kelimesi)
#      "liste" öğeler canlı sitedeki hazır listelerdir: (etiket, adres) ve sipariş adedi süzgeçleridir: (etiket, en az adet)
DIZIN = [
    {"anahtar": "grup", "tur": "veri", "piktogram": "izgara", "baslik": "Ürün grubuna göre", "aciklama": "Kategori ağacındaki ürün grupları."},
    {"anahtar": "malzeme", "tur": "arama", "piktogram": "malzeme", "baslik": "Malzemeye göre", "aciklama": "Ürünün yapıldığı malzeme.",
     "ogeler": [("Plastik ürünler", "plastik"), ("Bambu ürünler", "bambu"), ("Paslanmaz ürünler", "paslanmaz"), ("Metal ürünler", "metal"),
                ("Akrilik ürünler", "akrilik"), ("Silikon ürünler", "silikon"), ("Mikrofiber ürünler", "mikrofiber")]},
    {"anahtar": "yer", "tur": "arama", "piktogram": "kullanim", "baslik": "Kullanım yerine göre", "aciklama": "Ürünün kullanıldığı yer.",
     "ogeler": [("Banyo ürünleri", "banyo"), ("Mutfak ürünleri", "mutfak"), ("Otel ürünleri", "otel"), ("Ofis ürünleri", "ofis"),
                ("Kafe ürünleri", "kafe"), ("Restoran ürünleri", "restoran"), ("Kiler ürünleri", "kiler")]},
    {"anahtar": "ozellik", "tur": "arama", "piktogram": "ozellik", "baslik": "Özelliğe göre", "aciklama": "Ürünü ayıran özellik.",
     "ogeler": [("Kapaklı ürünler", "kapaklı"), ("Bölmeli ürünler", "bölmeli"), ("Kilitli ürünler", "kilitli"), ("Tekerlekli ürünler", "tekerlekli"),
                ("Çekmeceli ürünler", "çekmeceli"), ("Pedallı ürünler", "pedallı"), ("Katlanır ürünler", "katlanır")]},
    {"anahtar": "gorunum", "tur": "arama", "piktogram": "gorunum", "baslik": "Görünüme göre", "aciklama": "Ürünün deseni ve görünümü.",
     "ogeler": [("Şeffaf ürünler", "şeffaf"), ("Desenli ürünler", "desenli"), ("Krom ürünler", "krom"), ("Rattan görünümlü ürünler", "rattan görünümlü"),
                ("Bambu görünümlü ürünler", "bambu görünümlü"), ("Mermer desenli ürünler", "mermer desenli")]},
    {"anahtar": "takim", "tur": "arama", "piktogram": "adet", "baslik": "Takıma ve pakete göre", "aciklama": "Paketteki parça sayısı.",
     "ogeler": [("Set ürünler", "set"), ("Takım ürünler", "takım"), ("3'lü paketler", "3'lü"), ("4'lü paketler", "4'lü"), ("2'li paketler", "2'li"), ("6'lı paketler", "6'lı")]},
    {"anahtar": "ikili", "tur": "arama", "piktogram": "matris", "baslik": "Özellik ve ürüne göre", "aciklama": "İki kelimeli aramalar.",
     "ogeler": [("Plastik saklama kabı", "plastik saklama kabı"), ("Kapaklı saklama kabı", "kapaklı saklama kabı"), ("Plastik sepet", "plastik sepet"),
                ("Plastik kova", "plastik kova"), ("Kilitli saklama kabı", "kilitli saklama kabı"), ("Pedallı çöp kovası", "pedallı çöp kovası"), ("Plastik tabure", "plastik tabure")]},
    {"anahtar": "uretici", "tur": "veri", "piktogram": "uretici", "baslik": "Üreticiye ve markaya göre", "aciklama": "Mağaza ve marka sayfaları."},
    {"anahtar": "liste", "tur": "liste", "piktogram": "liste", "baslik": "Listeye ve sipariş adedine göre", "aciklama": "Hazır listeler ve sipariş adedi.",
     "ogeler": [("Çok satanlar", "/cok-satanlar"), ("Kategoriye göre çok satanlar", "/cok-satanlar/kategori"), ("Haftanın fırsatları", "/firsatlar"),
                ("Yeni ürünler", "/urunler?sort=newest"), ("En az 100 adetle satılanlar", 100), ("En az 12 adetle satılanlar", 12)]},
]

# --- Ödeme yöntemleri ---------------------------------------------------------
# (piktogram, ad). Her adın kaynağı kanıt defterindedir, build.py bunu denetler.
# Marka logosu kullanılmaz, piktogram yöntemin türünü gösterir.
ODEME_YONTEMLERI = [
    ("kart", "Banka ve kredi kartı"),
    ("cuzdan", "PayPal"),
    ("banka", "EFT ve anlık EFT"),
    ("cek", "Çek ve senet"),
    ("taksit", "Elden taksit"),
    ("tek-odeme", "Thoptan.com ile tek ödeme"),
]

# Para birimleri: kod canlı siteden gelir. Simge ve Türkçe ad buradadır. Adların kaynağı kanıt defterindedir.
PARA = {"GBP": ("£", "İngiliz sterlini"), "USD": ("$", "ABD doları"), "EUR": ("€", "Euro"), "TRY": ("₺", "Türk lirası")}
PARA_VARSAYILAN = "USD"

# Site dilleri: (kod, ad, kısaltma, yazı yönü). Kaynak: canlı sitenin dil seçicisi (IDDIALAR).
DILLER = [("tr", "Türkçe", "TR", "ltr"), ("en", "English", "EN", "ltr"), ("ar", "العربية", "AR", "rtl"), ("ru", "Русский", "RU", "ltr")]

# --- Alt bölüm ------------------------------------------------------------------
# Kişiye göre sütunlar: (başlık, [(etiket, adres)])
ALT_KISI = [
    ("Alıcılar için", [("Teklif isteği", "/pages/dashboard/rfq.html"), ("Üreticiler", "/ureticiler"), ("Tüm kategoriler", "/kategoriler"),
                       ("Sipariş takibi", "/hesabim/siparisler"), ("Mesajlar", "/hesabim/mesajlar")]),
    ("Satıcılar için", [("Satışa başlayın", "/satici-ol"), ("Satıcı Merkezi", "/panel/"), ("Paketler ve ücretler", "/satici-ol#paketler"),
                        ("Satıcı Hizmet Sözleşmesi", "/satici-hizmet-sozlesmesi")]),
    ("Destek", [("Yardım Merkezi", "/yardim-merkezi"), ("Canlı destek", "/destek/taleplerim"), ("Kötüye kullanım bildirin", "/destek/yeni")]),
]
# İçerik türüne göre sütunlar. Günlük (blog) yazısı dışındaki içerik türleridir: (piktogram, başlık, [(etiket, adres)])
# Her öğe canlı sitede var olan bir sayfaya gider.
ALT_TUR = [
    ("rehber", "Rehberler", [("Ticaret güvencesi nasıl işler?", "/ticaret-guvencesi"), ("Ödeme seçenekleri", "/odeme-secenekleri"), ("Kargo ve teslimat", "/kargo-lojistik"),
                            ("Satış sonrası korumalar", "/satis-sonrasi"), ("Alıcı Koruma Programı", "/ticaret-guvencesi-detay")]),
    ("soru", "Soru ve yanıt", [("Sık sorulan sorular", "/sss"), ("Yardım makaleleri", "/yardim/merkez")]),
    ("liste", "Listeler", [("Çok satanlar", "/cok-satanlar"), ("Kategoriye göre çok satanlar", "/cok-satanlar/kategori"), ("Haftanın fırsatları", "/firsatlar"), ("Yeni ürünler", "/urunler?sort=newest")]),
    ("dizin", "Dizinler", [("Kategori dizini", "/kategoriler"), ("Üretici dizini", "/ureticiler"), ("Ürün dizini", "/urunler"), ("Arama dizini", "#dizin")]),
    ("kural", "Kurallar ve sözleşmeler", [("Ürün listeleme kuralları", "/urun-listeleme-kurallari"), ("Para iade politikası", "/iade-politikasi"), ("İade koşulları", "/iade-kosullari"),
                                          ("Erişilebilirlik bildirimi", "/erisilebilirlik")]),
    ("arac", "Araçlar", [("Teklif isteği formu", "/pages/dashboard/rfq.html"), ("Kimlik doğrulaması", "/pages/dashboard/kyc.html"), ("Canlı sepet", "/pages/cart.html")]),
]
# Planlanan içerik türleri. Canlı sitede karşılığı yoktur. Yalnız önizleme derlemesinde, bağlantısız olarak gösterilir.
ALT_PLAN = ["Sözlük", "Hesaplayıcılar", "Şablonlar", "Karşılaştırmalar", "Sektör verileri", "Kontrol listeleri"]

# Sosyal hesaplar: (ad, adres, simge çizimi). Adresler canlı sitenin alt bölümündeki adreslerdir.
# veri.py her adresin canlı sitenin kodunda geçtiğini denetler.
SOSYAL = [
    ("Instagram", "https://www.instagram.com/istoc_com", '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.7" cy="7.3" r=".6"/>'),
    ("Facebook", "https://www.facebook.com/istoccom", '<path d="M14 21v-7h2.5l.5-3H14V9.2c0-1 .4-1.7 1.8-1.7H17V4.8c-.5-.1-1.3-.2-2.2-.2C12.5 4.6 11 6 11 8.7V11H8.5v3H11v7"/>'),
    ("X", "https://x.com/istoc_com", '<path d="M5 4.5 19 19.5M19 4.5 5 19.5"/>'),
    ("LinkedIn", "https://www.linkedin.com/company/istoc-com", '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.5 1-2.5 2.3-2.5S16 11.4 16 13v3"/>'),
    ("YouTube", "https://youtube.com/@istoccom", '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>'),
]
# Sayfanın başlığında adı geçen canlı görseller (paylaşım görseli ve logo). veri.py açıldıklarını denetler.
GORSELLER = {"paylasim": "/images/og-default.jpg", "logo": "/images/istoc-logo.png"}

# Adres kanıtı: sayfanın kullandığı adres kalıplarının canlı sitede gerçekten çalıştığını gösteren izler.
# (canlı sayfa, o sayfanın kodunda bulunması gereken ifadeler). veri.py bir iz bulamazsa durur.
# Sonuç sayıları açık uçtan gelir. Bu izler, bağlantıdaki değişken adlarının canlı sayfaca okunduğunu gösterir.
ADRES_KANITI = [
    ("/urunler", ['get("q")', 'get("min_order")', 'get("sort")', '"newest"', '"/kategori/:slug"', '"/urun/:slug"', '"/marka/:slug"', '"/magaza/:code"']),
    ("/ureticiler", ['get("q")']),
    ("/satici-ol", ['"#paketler"']),
]

# Sayfanın bağlantı verdiği canlı sayfalar. veri.py her adresin açıldığını denetler (HTTP 200, başka sayfaya yönlenmeden).
# build.py, sayfadaki her istoc.com bağlantısının bu listede ya da veride olduğunu denetler. Böylece ölü bağlantı sayfaya giremez.
SAYFALAR = [
    "/", "/urunler", "/ureticiler", "/kategoriler", "/firsatlar", "/cok-satanlar", "/cok-satanlar/kategori",
    "/ticaret-guvencesi", "/ticaret-guvencesi-detay", "/odeme-secenekleri", "/kargo-lojistik", "/satis-sonrasi", "/iade-politikasi", "/iade-kosullari",
    "/yardim-merkezi", "/yardim/merkez", "/sss", "/satici-ol", "/satici-hizmet-sozlesmesi", "/urun-listeleme-kurallari", "/erisilebilirlik",
    "/kullanim-kosullari", "/gizlilik", "/cerezler", "/panel/", "/hesabim/siparisler", "/hesabim/mesajlar", "/destek/taleplerim", "/destek/yeni",
    "/pages/dashboard/rfq.html", "/pages/dashboard/kyc.html", "/pages/cart.html", "/pages/auth/login.html", "/pages/auth/register.html",
]

# --- Kanıt defteri ---------------------------------------------------------------
# Kaynaklı cümleler. Sayfadaki her kaynaklı cümle burada kaynağıyla birlikte yazar.
# veri.py her cümlenin kanıt ifadesini kaynakta arar. Bulamazsa durur, veri dosyasını yazmaz.
# build.py her cümlenin sayfada birebir geçtiğini denetler. Böylece liste eskiyemez.
KAYNAKLAR = {
    # tur: "sayfa"    sunucunun gönderdiği sayfanın görünen metni.
    #      "uygulama" tarayıcıda kurulan sayfa. Kanıt ya sayfanın kendi kodunda durur
    #                 ya da dil paketinde, sayfanın kodunun adıyla çağırdığı bir anahtarın değerindedir.
    #                 Dil paketinde durup sayfanın çağırmadığı bir metin kanıt sayılmaz.
    #      "veri"     açık uçtan gelen veri.
    "satici": {"adres": "https://istoc.com/satici-ol", "tur": "uygulama"},
    "uretici": {"adres": "https://istoc.com/ureticiler", "tur": "uygulama"},
    "sepet": {"adres": "https://istoc.com/pages/cart.html", "tur": "uygulama"},
    "kyc": {"adres": "https://istoc.com/pages/dashboard/kyc.html", "tur": "uygulama"},
    "site": {"adres": "https://istoc.com/", "tur": "uygulama"},
    "guvence": {"adres": "https://istoc.com/ticaret-guvencesi", "tur": "sayfa"},
    "odeme": {"adres": "https://istoc.com/odeme-secenekleri", "tur": "sayfa"},
    "paketler": {"adres": "https://istoc.com/api/method/tradehub_core.api.v1.public_pricing.get_pricing_plans", "tur": "veri"},
}

# (sayfadaki cümle, kaynak, kaynakta bulunması gereken ifadeler)
IDDIALAR = [
    # Satıcılar için
    ("Şu an satış komisyonu yok", "satici", ["komisyon alınmaz"]),
    ("Şu an satışlardan komisyon alınmaz.", "satici", ["şu an satışlardan komisyon alınmaz"]),
    # Kaynakta sözleşme adı bir bağlantının içindedir. Bu yüzden cümle iki parça halinde aranır.
    ("Ücretler Satıcı Hizmet Sözleşmesi'ndeki ücret tablosuna göredir.", "satici", ["Satıcı Hizmet Sözleşmesi", "'ndeki ücret tablosuna göredir"]),
    ("Alıcıya aracısız ulaşırsınız", "satici", ["aracısız buluşturur"]),
    ("iStoc üreticiyi alıcıyla aracısız buluşturur.", "satici", ["aracısız buluşturur"]),
    ("iStoc sizi toptan alıcıyla doğrudan buluşturur.", "satici", ["aracısız buluşturur"]),
    ("Başvuru 4 dakika sürer", "satici", ["Başvuru 4 dakikada biter"]),
    ("Vergi numaranızı, üretim kategorinizi ve bir iletişim bilginizi yazarsınız.", "satici", ["Vergi numarası, üretim kategorisi ve bir iletişim"]),
    ("Onay ortalama 2 iş günü sürer.", "satici", ["Onay süresi ortalama 2 iş günü"]),
    ("Başvuru ücretsizdir.", "satici", ["Başvuru ücretsiz"]),
    ("İşletme doğrulaması rozeti bütün paketlerde vardır.", "paketler", ["Şirket Doğrulandı"]),
    ("Doğrulanan mağaza rozet taşır", "paketler", ["Üretici kimliğinizin doğrulandığını gösteren rozet"]),
    ("Rozet, mağazanın işletme doğrulamasının tamamlandığını gösterir.", "paketler", ["Üretici kimliğinizin doğrulandığını gösteren rozet"]),
    # Doğrulama: satıcının işletme doğrulaması (KYB) ve alıcının kimlik doğrulaması (KYC)
    ("Rozetli mağazanın kimlik ve işletme doğrulamasını iStoc yapar.", "uretici", ["Bu satıcının kimlik ve işletme doğrulaması iStoc tarafından yapılmıştır"]),
    ("Hesabınızı açar, kimliğinizi doğrularsınız", "kyc", ["kimlik doğrulamanızı tamamlayın"]),
    ("Satın almak için kimlik doğrulamasını tamamlarsınız.", "kyc", ["Ürün satın alabilmek için kimlik doğrulamanızı tamamlayın"]),
    ("Bireysel ya da kurumsal hesap seçersiniz.", "kyc", ["Bireysel", "Kurumsal"]),
    ("Kimlik belgenizi yüklersiniz.", "kyc", ["Kimlik Belgesi"]),
    # Kaynak "1-2 iş günü" yazar. Sayfada aralık "1 ya da 2" diye açık yazılır.
    ("İnceleme genellikle 1 ya da 2 iş günü sürer.", "kyc", ["Genellikle 1-2 iş günü içinde sonuçlanır"]),
    # Ödeme
    ("Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez.", "guvence", ["iStoc ödemeyi tutmaz ve aracılık etmez"]),
    ("Ödemeyi satıcının sunduğu yöntemle doğrudan satıcıya yaparsınız.", "guvence", ["Ödemeyi satıcının sunduğu yöntemle", "doğrudan satıcıya yapın"]),
    ("Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a ödersiniz.", "guvence", ["sunulduğunda tüm sepeti tek ödemeyle Thoptan.com'a ödeyin"]),
    ("Yalnız sipariş sayfanızda gösterilen hesaba ödeme yaparsınız.", "odeme", ["Yalnız sipariş sayfanızda gösterilen hesaba ödeme yapın"]),
    ("Ödeme dekontunu sipariş ayrıntılarından yüklersiniz.", "odeme", ["dekontunuzu", "Sipariş Detayları", "sayfasından yükleyin"]),
    ("Geçerli yöntemi satıcı belirler.", "guvence", ["Kabul edilen yöntemleri satıcı belirler"]),
    ("Satıcı kredi kartı, banka kartı ya da EFT kabul edebilir.", "guvence", ["kredi/banka kartı, EFT"]),
    ("Satıcı başka yöntemler de sunabilir.", "guvence", ["satıcının kabul ettiği diğer yöntemler"]),
    # Ödeme yöntemi ve para birimi adları
    ("Banka ve kredi kartı", "guvence", ["kredi/banka kartı", "VISA", "Mastercard", "AMEX"]),
    ("PayPal", "guvence", ["PayPal"]),
    ("EFT ve anlık EFT", "odeme", ["Anlık EFT"]),
    ("Çek ve senet", "odeme", ["Çek / Senet"]),
    ("Elden taksit", "odeme", ["Elden Taksit"]),
    ("Thoptan.com ile tek ödeme", "odeme", ["Thoptan.com ile tek ödeme"]),
    ("İngiliz sterlini", "odeme", ["İngiliz Sterlini (GBP)"]),
    ("ABD doları", "odeme", ["ABD Doları (USD)"]),
    ("Euro", "odeme", ["Euro (EUR)"]),
    ("Türk lirası", "odeme", ["Türk Lirası (TRY)"]),
    # Sipariş kaydı, destek ve iade
    ("Ürünü seçer, satıcıyla anlaşır ve siparişi ekrandan başlatırsınız.", "odeme", ["ürününüzü seçin, tedarikçiyle anlaşın ve siparişinizi başlatın"]),
    ("Kabul ettiğiniz sipariş koşullarının bir kopyasını iStoc saklar.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar"]),
    ("Sipariş durumunu teslimata kadar iStoc izler.", "guvence", ["sipariş durumunu teslimata kadar izler"]),
    ("Sipariş koşulları karşılanmazsa talep açarsınız.", "guvence", ["Sipariş koşulları karşılanmazsa talep açın"]),
    ("İadeyi, ödeme yaptığınız taraf yapar.", "guvence", ["ödeme yaptığınız tarafça yapılır"]),
    ("Teslimat süresini ve gönderim şeklini satıcı siparişte belirtir.", "guvence", ["satıcının siparişte belirttiği koşullara göredir"]),
    ("Ürün gönderilince takip numarası sipariş ayrıntılarınıza eklenir.", "guvence", ["takip numarası ve kargo firması bilgisi sipariş detaylarınıza eklenir"]),
    ("Siparişiniz teslimata kadar kayıt altında kalır.", "guvence", ["sipariş durumunu teslimata kadar izler"]),
    ("Sipariş koşullarınızı iStoc saklar ve siparişinizi teslimata kadar izler.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar", "sipariş durumunu teslimata kadar izler"]),
    ("iStoc kabul ettiğiniz koşulları saklar.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar"]),
    ("Koşullar karşılanmazsa talep açarsınız.", "guvence", ["Sipariş koşulları karşılanmazsa talep açın"]),
    ("Sorunu, kabul ettiğiniz koşullara göre çözmenize iStoc yardım eder.", "guvence", ["çözüme ulaşmanıza yardımcı oluruz"]),
    ("Sipariş gönderilmezse ya da kaybolursa iade talebi oluşturursunuz.", "guvence", ["gönderilmezse, kaybolursa", "iade talebi oluşturun"]),
    ("Ürün kusurlu, yanlış ya da hasarlı gelirse de iade talebi oluşturursunuz.", "guvence", ["kusurlu, yanlış veya hasarlı gelirse iade talebi oluşturun"]),
    ("İade, kabul ettiğiniz koşullara göre yapılır.", "guvence", ["kabul edilen koşullar çerçevesinde"]),
    ("Kargo firmasının adı da eklenir.", "guvence", ["takip numarası ve kargo firması bilgisi sipariş detaylarınıza eklenir"]),
    # Sipariş adımlarının başlıkları
    ("Her sipariş kayıt altında.", "guvence", ["her siparişe açık bir anlaşma, kayıtlı bir sözleşme"]),
    ("Siparişiniz kayıt altındadır", "guvence", ["her siparişe açık bir anlaşma, kayıtlı bir sözleşme"]),
    ("Sipariş koşullarında anlaşırsınız", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız"]),
    ("Satıcıyla sipariş koşullarında anlaşırsınız.", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız"]),
    ("Sonra siparişi başlatırsınız.", "guvence", ["Trade Assurance siparişini başlat"]),
    ("Ödemeyi yaparsınız", "guvence", ["Satıcıya veya Thoptan.com'a ödeyin"]),
    ("Ödemeyi, sipariş koşullarında anlaşınca yaparsınız.", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız", "Satıcıya veya Thoptan.com'a ödeyin"]),
    ("Sipariş koşullarınız kaydedilir", "guvence", ["Siparişiniz ve sözleşmeniz kayıt altına alınır"]),
    ("Sorun çıkarsa destek alırsınız", "guvence", ["Sorun çıkarsa destek alın"]),
    # Canlı sitedeki bir bölümün ya da programın adını taşıyan bağlantı etiketleri.
    # Kanıt, canlı sitenin alt bölümünde aynı adın geçmesidir.
    ("Canlı destek", "site", ["Canlı Destek"]),
    ("Haftanın fırsatları", "site", ["Haftanın Fırsatları"]),
    ("Alıcı Koruma Programı", "site", ["Alıcı Koruma Programı"]),
    # Site geneli
    # Dil adları tek kelimedir. Her biri sitenin dil seçicisinde aranır.
    ("Türkçe", "site", ['name:"Türkçe"']),
    ("English", "site", ['name:"English"']),
    ("العربية", "site", ['name:"العربية"']),
    ("Русский", "site", ['name:"Русский"']),
    ("Global B2B toptan satış ve ticaret pazaryeri.", "site", ["Global B2B Toptan Satış ve Ticaret Pazaryeri"]),
    ("Global B2B toptan pazaryeri", "site", ["Global B2B Toptan Satış ve Ticaret Pazaryeri"]),
    ("© 2026 iStoc Private Company Limited.", "site", ["© 2026 iStoc Private Company Limited"]),
    ("Tüm hakları saklıdır.", "site", ["Tüm hakları saklıdır"]),
    ("Hesap açmak ücretsizdir.", "uretici", ["Ücretsiz Kaydolun"]),
    ("Ücretsiz kaydolun", "uretici", ["Ücretsiz Kaydolun"]),
    ("Bir istek, birden fazla teklif", "uretici", ["Bir istek, birden fazla teklif"]),
    ("Sepette bu adedin altında kalırsanız iStoc sizi uyarır.", "sepet", ["Minimum sipariş adedi eksik ürünler var"]),
]

# Veri cümleleri: sayısı ya da dayanağı data/ klasöründen gelen cümleler. Sayılar # ile yazılır.
# build.py bu cümlelerin dayanağını ayrıca denetler (örneğin gösterilen her üretici doğrulanmış mı).
VERI_METNI = [
    "# ürün",
    "# doğrulanmış mağaza",
    "# alt kategori",
    "# kategorinin tümü",
    "# ürünün tümü",
    "# adet",
    "# adet ekleyin",
    # Rozetler: yalnız verideki doğrulama alanı doğruysa yazılır.
    "Doğrulanmış üretici",
    "İşletmesi doğrulandı",
    "iStoc'ta # mağaza var.",
    "# mağazanın işletme doğrulaması tamamlandı.",
    "# mağazanın # tanesi doğrulandı.",
    "# üst kategori ve # alt kategori var.",
    "# alt kategori daha var.",
    "Ürünü en çok olan kategoriler önde durur.",
    "Büyük yazan fiyata KDV dahildir.",
    "Ürünleri # ayrı yoldan bulursunuz.",
]

# Tasarım metni: bu sayfanın kendi sözü. Değer önerisi, başlık, yönerge, çağrı,
# bu sayfanın kendi kartlarını anlatan cümle ve öneri notu burada durur.
# Canlı site hakkında olgu bildiren cümle buraya yazılmaz. O cümle IDDIALAR listesine kanıtıyla girer.
TASARIM_METNI = [
    # Arama motoru açıklaması
    "Doğrulanmış üreticilerin birim fiyatını, en az sipariş adedini ve hazırlık süresini karşılaştırın.",
    "Teklif isteyin, toptan alımı yerinizden yapın.",
    # Değer önerisi ve başlıklar
    "Çarşıya gitmeyin.",
    "Çarşı ekranınızda.",
    "Toptan alım için İstanbul'a, Ankara'ya, Antep'e gitmeniz gerekmez.",
    "Söze değil, kayda güvenin.",
    "İşletmenizin toptan alımını yerinizden yaparsınız.",
    "Altı nedeni var.",
    "Yola çıkmazsınız",
    "Kimin doğrulandığını görürsünüz",
    "Koşulu önceden görürsünüz",
    "Hangi hesaba ödeyeceğinizi bilirsiniz",
    "Sorun çıkarsa muhatabınız vardır",
    "Sektörünüzü seçin.",
    "Üreticiyi bulun.",
    "Fiyatı sormayın.",
    "Kartta yazıyor.",
    "Kiminle çalıştığınızı bilin.",
    "Sormadan sipariş vermeyin.",
    "Rakibiniz yoldayken siz siparişi verin.",
    "Aracıya pay bırakmayın.",
    "Aradığınıza kısa yoldan gidin.",
    # Sorular
    "Hesabınız yok mu?",
    "Üretici misiniz?",
    "Aradığınızı bulamadınız mı?",
    "Aradığınız ürün burada yok mu?",
    # Bu sayfanın kendi kartlarını ve bölümlerini anlatan cümleler
    "Fiyatı, en az sipariş adedini ve hazırlık süresini ekranınızda görürsünüz.",
    "Ürün kartında birim fiyat, KDV hariç fiyat, en az sipariş adedi ve hazırlık süresi yazar.",
    "En az sipariş adedi ürün kartında yazar.",
    "Rozet üretici kartında ve ürün kartında durur.",
    "Para birimini sayfanın altından değiştirirsiniz.",
    "Fiyatlar seçtiğiniz para biriminde gösterilir.",
    # Betik yokken para birimi seçilemez. O durumda sayfa bu cümleyi gösterir. Para birimi PARA_VARSAYILAN değeridir.
    "Fiyatlar ABD doları olarak gösterilir.",
    # Tutarlar build.py içinde Türk lirası fiyatından, canlı sitenin kuruyla çevrilir.
    "Bu sayfa tutarları Türk lirası fiyatından çevirir.",
    "Bağlantının yanındaki sayı, canlı sitedeki sonuç sayısıdır.",
    # Dizin gruplarının açıklamaları
    "Kategori ağacındaki ürün grupları.",
    "Ürünün yapıldığı malzeme.",
    "Ürünün kullanıldığı yer.",
    "Ürünü ayıran özellik.",
    "Ürünün deseni ve görünümü.",
    "Paketteki parça sayısı.",
    "İki kelimeli aramalar.",
    "Mağaza ve marka sayfaları.",
    "Hazır listeler ve sipariş adedi.",
    # Sık sorulan sorular. Yanıtları kanıt defterindedir.
    "Ödemeyi kime yaparım?",
    "Hangi ödeme yöntemleri geçerlidir?",
    "Satın almak için ne gerekir?",
    "En az sipariş adedini nerede görürüm?",
    "Doğrulama rozeti ne demektir?",
    "Siparişim gelmezse ne olur?",
    "Teslimat süresi nasıl belirlenir?",
    # Yönergeler
    "Aradığınız ürünü yazın.",
    "Üreticiler size teklif göndersin.",
    "Ürünü ve adedi yazın.",
    "Üreticilerden teklif alın.",
    "Teklifleri karşılaştırın ve seçin.",
    "Ürün adını yazın.",
    "Arayın, üreticiye yazın, teklif isteyin.",
    "Başvuruyu yaparsınız.",
    "Onayı beklersiniz.",
    "Mağazanızı açarsınız.",
    # Öneri notları: bu sayfanın canlı siteye bağlı olmadığını söyleyen cümleler
    "Bu sayfa bir tasarım önerisidir.",
    "Form bir yere veri göndermez.",
    "İsteğiniz gönderilmedi.",
    "Bu sepet bir örnektir.",
    "Sepete eklemek ödeme başlatmaz.",
    "Ürünler canlı sepete eklenmez.",
    "Bu öneride dil seçimi sayfanın dilini değiştirmez.",
]

# Etiketler: düğme, bağlantı, alan ve bölüm adları. Canlı sitedeki bir sayfanın adı da etikettir.
# Etiket bir olgu bildirmez. Olgu bildiren metin IDDIALAR ya da VERI_METNI listesine yazılır.
# Dizin ve alt bölüm öğelerinin etiketleri bu dosyadaki listelerden kendiliğinden eklenir (build.py).
ETIKETLER = [
    # Üst bölüm ve gezinme
    "İçeriğe atlayın", "Sipariş takibi", "Ticaret güvencesi", "Yardım Merkezi", "Satıcı Merkezi", "Giriş yapın", "Teklif isteyin",
    "Tüm kategoriler", "Kategorinin tümü", "Çok satanlar", "Yeni ürünler", "Teklif isteği", "Satışa başlayın", "Ana sayfa",
    # Bölüm adları
    "Alıcılar için", "Satıcılar için", "Sipariş süreci", "Sık sorulanlar", "Örnek sipariş", "Örnek aramalar", "Satıcı yolu",
    # Sayıların ve koşulların etiketleri
    "toptan ürün", "doğrulanmış mağaza", "para birimi", "adet başına", "KDV hariç", "En az sipariş adedi", "En az sipariş tutarı", "Hazırlık süresi",
    "Birim fiyat", "Ödeme yöntemleri", "Dil ve para birimi", "Sepetiniz boş",
    # Süreç adımlarının güven işaretleri
    "Kimlik doğrulaması (KYC)", "İşletme doğrulaması (KYB)", "Belge yükleme", "Dekont yükleme", "İade talebi",
    # Form
    "Hangi ürünü arıyorsunuz?", "Kaç adet?",
    # Eylemler
    "Teklif isteği oluşturun", "Canlı sitede teklif isteği oluşturun", "Ürünleri inceleyin", "Ticaret güvencesini inceleyin",
    "Satıcı başvurusu yapın", "Paketleri ve ücretleri görün", "Tüm üreticiler", "Mağazaya gidin", "Mesaj yazın",
    "Sepete ekleyin", "Başa dönün",
    # Alt bölüm
    "Kişiye göre", "İçerik türüne göre", "Kullanım koşulları", "Gizlilik politikası", "Çerez tercihleri",
]

# Görünmeyen metinler: ekran okuyucunun okuduğu adlar (aria-label), alan içi örnekler (placeholder),
# görsel adları (alt), sayfa başlığı ve yalnız ekran okuyucuya okunan metinler (sr-only).
# En az iki kelimeli her görünmeyen metin burada kayıtlıdır. Sayılar ve tutarlar # ile yazılır.
# Görünen bir etiketin yinelemesi (örneğin bölüm adı) ayrıca yazılmaz, ETIKETLER listesinden tanınır.
# Bu metinler olgu bildirmez. build.py kayıtsız bir görünmeyen metin bulursa sayfayı üretmez.
OZNITELIK_METNI = [
    "iStoc: Üreticiden toptan alım | B2B toptan pazaryeri",
    "iStoc ana sayfa", "Ürün arayın", "Kategori menüsü", "Bölümleri geri kaydırın", "Bölümleri ileri kaydırın",
    "Arama türü", "Örnek: saklama kabı", "Örnek: #", "Ürünleri süzün", "Süzgeçleri geri kaydırın", "Süzgeçleri ileri kaydırın",
    "Önceki kartlar", "Sonraki kartlar", "# adet azaltın", "# adet artırın", "Para birimi", "Ana gezinme",
    "Canlı sepeti açın. Örnek sepette # ürün var.", "Toplam #",
]
# Yalnız önizleme derlemesinde bulunan görünmeyen metin
ONIZLEME_OZNITELIK = ["Öneri notu"]

# Yalnız önizleme derlemesinde görünen metinler. Yayın derlemesinde sayfada bulunmazlar.
ONIZLEME_ETIKET = ["Canlı siteye gidin", "Planlanan içerik türleri", "Sektör verileri", "Kontrol listeleri"]
ONIZLEME_TASARIM = ["Bu türler öneridir.", "Canlı sitede henüz yoktur."]

# Betik metinleri: app.js içinde yazan ve kullanıcının gördüğü ya da duyduğu metin parçaları.
# kapi.mjs, app.js içindeki her Türkçe metnin bu listede olduğunu denetler.
BETIK_METNI = [
    "Ürün arayın", "Üretici arayın", "Ürün adını yazın.",
    "İsteğiniz gönderilmedi. Bu sayfa bir tasarım önerisidir.",
    "Canlı sepeti açın. Örnek sepette", "ürün var.", "ürün,", "Sepetiniz boş", "adet ekleyin",
    "adet örnek sepette. Ürün canlı sepete eklenmedi.", "örnek sepetten çıkarıldı.",
    "ürün gösteriliyor.",
    "seçildi. Bu öneride dil seçimi sayfanın dilini değiştirmez.",
    "seçildi. Fiyatlar bu para biriminde gösteriliyor.",
]
