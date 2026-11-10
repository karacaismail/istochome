# Seçki: ana sayfada hangi ürünün ve hangi üreticinin yer alacağını belirler.
# Bu dosyada yalnız seçim ve sunum bilgisi durur: adres, görsel dosyası, süzgeç grubu.
# Fiyat, en az adet, hazırlık süresi ve doğrulama gibi olgular burada yazmaz.
# Olguları veri.py canlı siteden alır ve data/ana-sayfa.json dosyasına yazar.

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

# Aramada dönen örnek kelimeler. Üretici örnekleri veriden gelir (seçilen üreticilerin adları).
ORNEK_URUN = ["saklama kabı", "elbise askısı", "mikrofiber bez", "baharatlık", "temizlik fırçası"]

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

# Kaynaklı cümleler. Sayfadaki her kaynaklı cümle burada kaynağıyla birlikte yazar.
# veri.py her cümlenin kanıt ifadesini kaynakta arar. Bulamazsa durur, veri dosyasını yazmaz.
# build.py her cümlenin sayfada birebir geçtiğini denetler. Böylece liste eskiyemez.
KAYNAKLAR = {
    # tur: "sayfa" sunucunun gönderdiği metindir. "uygulama" sayfanın betiklerindeki ve dil paketindeki metindir.
    # "veri" açık uçtan gelen veridir.
    "satici": {"adres": "https://istoc.com/satici-ol", "tur": "uygulama"},
    "guvence": {"adres": "https://istoc.com/ticaret-guvencesi", "tur": "sayfa"},
    "site": {"adres": "https://istoc.com/", "tur": "uygulama"},
    "paketler": {"adres": "https://istoc.com/api/method/tradehub_core.api.v1.public_pricing.get_pricing_plans", "tur": "veri"},
}

# (sayfadaki cümle, kaynak, kaynakta bulunması gereken ifadeler)
IDDIALAR = [
    # Satıcılar için
    ("Şu an satış komisyonu yok", "satici", ["komisyon alınmaz"]),
    # Kaynakta sözleşme adı bir bağlantının içindedir. Bu yüzden cümle iki parça halinde aranır.
    ("Ücretler Satıcı Hizmet Sözleşmesi'ndeki ücret tablosuna göredir.", "satici", ["Satıcı Hizmet Sözleşmesi", "'ndeki ücret tablosuna göredir"]),
    ("Alıcıya aracısız ulaşırsınız", "satici", ["aracısız buluşturur"]),
    ("Başvuru 4 dakika sürer", "satici", ["Başvuru 4 dakikada biter"]),
    ("Onay ortalama 2 iş günü sürer.", "satici", ["Onay süresi ortalama 2 iş günü"]),
    ("Başvuru ücretsizdir.", "satici", ["Başvuru ücretsiz"]),
    ("İşletme doğrulaması rozeti bütün paketlerde vardır.", "paketler", ["Şirket Doğrulandı"]),
    # Ödeme ve sipariş süreci
    ("Ödemeyi iStoc tutmaz ve ödemeye aracılık etmez.", "guvence", ["iStoc ödemeyi tutmaz ve aracılık etmez"]),
    ("Ödemeyi satıcının sunduğu yöntemle doğrudan satıcıya yaparsınız.", "guvence", ["Ödemeyi satıcının sunduğu yöntemle", "doğrudan satıcıya yapın"]),
    ("Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a ödersiniz.", "guvence", ["sunulduğunda tüm sepeti tek ödemeyle Thoptan.com'a ödeyin"]),
    ("Geçerli yöntemi satıcı belirler.", "guvence", ["Kabul edilen yöntemleri satıcı belirler"]),
    ("Visa, Mastercard, AMEX, PayPal, EFT.", "guvence", ["VISA", "Mastercard", "AMEX", "PayPal", "EFT"]),
    ("Satıcı kredi kartı, banka kartı ya da EFT kabul edebilir.", "guvence", ["kredi/banka kartı, EFT"]),
    ("Satıcı başka yöntemler de sunabilir.", "guvence", ["satıcının kabul ettiği diğer yöntemler"]),
    ("Kabul ettiğiniz sipariş koşullarının bir kopyasını iStoc saklar.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar"]),
    ("Sipariş durumunu teslimata kadar iStoc izler.", "guvence", ["sipariş durumunu teslimata kadar izler"]),
    ("Sipariş koşulları karşılanmazsa talep açarsınız.", "guvence", ["Sipariş koşulları karşılanmazsa talep açın"]),
    ("İadeyi, ödeme yaptığınız taraf yapar.", "guvence", ["ödeme yaptığınız tarafça yapılır"]),
    ("Teslimat süresini ve gönderim şeklini satıcı siparişte belirtir.", "guvence", ["satıcının siparişte belirttiği koşullara göredir"]),
    ("Ürün gönderilince takip numarası sipariş ayrıntılarınıza eklenir.", "guvence", ["takip numarası ve kargo firması bilgisi sipariş detaylarınıza eklenir"]),
    # Site geneli
    ("Türkçe, English, العربية, Русский", "site", ['name:"Türkçe"', 'name:"English"', 'name:"العربية"', 'name:"Русский"']),
    ("Hesap açmak ücretsizdir.", "site", ["Ücretsiz üyelik ile ürün arayabilir, tedarikçilere mesaj gönderebilir, teklif isteyebilir"]),
    ("Bir istek, birden fazla teklif", "site", ["Bir istek, birden fazla teklif"]),
    ("Sepette bu adedin altında kalırsanız iStoc sizi uyarır.", "site", ["Minimum sipariş adedi eksik ürünler var"]),
    ("Rozet, mağazanın işletme doğrulamasının tamamlandığını gösterir.", "paketler", ["Üretici kimliğinizin doğrulandığını gösteren rozet"]),
    ("Doğrulanan mağaza rozet taşır", "paketler", ["Üretici kimliğinizin doğrulandığını gösteren rozet"]),
    ("Global B2B toptan satış ve ticaret pazaryeri.", "site", ["Global B2B Toptan Satış ve Ticaret Pazaryeri"]),
    ("iStoc üreticiyi alıcıyla aracısız buluşturur.", "satici", ["aracısız buluşturur"]),
    ("iStoc sizi toptan alıcıyla doğrudan buluşturur.", "satici", ["aracısız buluşturur"]),
    ("Ürünleri arar, üreticilere yazar ve teklif istersiniz.", "site", ["Ücretsiz üyelik ile ürün arayabilir, tedarikçilere mesaj gönderebilir, teklif isteyebilir"]),
    ("Üreticiye mesaj yazar, teklif ister ve siparişi ekrandan verirsiniz.", "site", ["tedarikçilere mesaj gönderebilir, teklif isteyebilir"]),
    ("Teklifleri karşılaştırır ve uygun olanı seçersiniz.", "site", ["birden fazla tedarikçiden aynı anda teklif alabilir, fiyat ve koşulları karşılaştırabilirsiniz"]),
    # Sipariş kaydı, destek ve iade
    ("Siparişiniz teslimata kadar kayıt altında kalır.", "guvence", ["sipariş durumunu teslimata kadar izler"]),
    ("Sipariş koşullarınızı iStoc saklar ve siparişi teslimata kadar izler.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar", "sipariş durumunu teslimata kadar izler"]),
    ("Sipariş koşullarınızı iStoc saklar ve siparişinizi teslimata kadar izler.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar", "sipariş durumunu teslimata kadar izler"]),
    ("iStoc kabul ettiğiniz koşulları saklar.", "guvence", ["sipariş koşullarının sürümlü bir kopyasını saklar"]),
    ("Koşullar karşılanmazsa talep açarsınız.", "guvence", ["Sipariş koşulları karşılanmazsa talep açın"]),
    ("Sorunu, kabul ettiğiniz koşullara göre çözmenize iStoc yardım eder.", "guvence", ["çözüme ulaşmanıza yardımcı oluruz"]),
    ("Sipariş gönderilmezse ya da kaybolursa iade talebi oluşturursunuz.", "guvence", ["gönderilmezse, kaybolursa", "iade talebi oluşturun"]),
    ("Ürün kusurlu, yanlış ya da hasarlı gelirse de iade talebi oluşturursunuz.", "guvence", ["kusurlu, yanlış veya hasarlı gelirse iade talebi oluşturun"]),
    ("İade, kabul ettiğiniz koşullara göre yapılır.", "guvence", ["kabul edilen koşullar çerçevesinde"]),
    ("Kargo firmasının adı da eklenir.", "guvence", ["takip numarası ve kargo firması bilgisi sipariş detaylarınıza eklenir"]),
    # Sipariş adımlarının başlıkları ve ilk adım
    ("Her sipariş kayıt altında.", "guvence", ["her siparişe açık bir anlaşma, kayıtlı bir sözleşme"]),
    ("Siparişiniz kayıt altındadır", "guvence", ["her siparişe açık bir anlaşma, kayıtlı bir sözleşme"]),
    ("Sipariş koşullarında anlaşırsınız", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız"]),
    ("Satıcıyla sipariş koşullarında anlaşırsınız.", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız"]),
    ("Sonra siparişi başlatırsınız.", "guvence", ["Trade Assurance siparişini başlat"]),
    ("Ödemeyi yaparsınız", "guvence", ["Satıcıya veya Thoptan.com'a ödeyin"]),
    ("Ödemeyi, sipariş koşullarında anlaşınca yaparsınız.", "guvence", ["bir tedarikçiyle sipariş anlaşması yaptınız", "Satıcıya veya Thoptan.com'a ödeyin"]),
    ("Sipariş koşullarınız kaydedilir", "guvence", ["Siparişiniz ve sözleşmeniz kayıt altına alınır"]),
    ("Sorun çıkarsa destek alırsınız", "guvence", ["Sorun çıkarsa destek alın"]),
    # Teklif isteği ve yasal satır
    ("Üreticiler isteğinizi görür ve teklif verir.", "site", ["eşleşen tedarikçi tekliflerini alın"]),
    ("© 2026 iStoc Private Company Limited.", "site", ["iStoc Private Company Limited"]),
    ("Tüm hakları saklıdır.", "site", ["Tüm hakları saklıdır"]),
    ("Global B2B toptan pazaryeri", "site", ["Global B2B Toptan Satış ve Ticaret Pazaryeri"]),
    ("Ücretsiz kaydolun", "site", ["Ücretsiz Kaydolun"]),
]

# Veri cümleleri: sayısı ya da dayanağı data/ klasöründen gelen cümleler. Sayılar # ile yazılır.
# build.py bu cümlelerin dayanağını ayrıca denetler (örneğin gösterilen her üretici doğrulanmış mı).
VERI_METNI = [
    "# ürün",
    "# alt kategori",
    "# kategorinin tümü",
    "# ürünün tümü",
    "KDV hariç $#",
    "# adet",
    "# adet ekleyin",
    # Rozetler: yalnız verideki doğrulama alanı doğruysa yazılır.
    "Doğrulanmış üretici",
    "İşletmesi doğrulandı",
    "# mağaza var.",
    "iStoc'ta # mağaza var.",
    "# mağazanın işletme doğrulaması tamamlandı.",
    "# üst kategori ve # alt kategori var.",
    "# alt kategori daha var.",
    "Ürünü en çok olan kategoriler önde durur.",
    "Fiyatlar ABD doları cinsindendir.",
    "Büyük yazan fiyata KDV dahildir.",
    "İşletmesi doğrulanmış üreticiler.",
]

# Tasarım metni: bu sayfanın kendi sözü. Değer önerisi, başlık, yönerge, çağrı,
# bu sayfanın kendi kartlarını anlatan cümle ve öneri notu burada durur.
# Canlı site hakkında olgu bildiren cümle buraya yazılmaz. O cümle IDDIALAR listesine kanıtıyla girer.
TASARIM_METNI = [
    # Arama motoru açıklaması
    "Doğrulanmış üreticilerin birim fiyatını, en az sipariş adedini ve hazırlık süresini karşılaştırın.",
    "Teklif isteyin, toptan alımı yerinizden yapın.",
    # Değer önerisi ve başlıklar
    "Çarşıya gitmeden",
    "toptan alın.",
    "Hesabınız yok mu?",
    "Üretici misiniz?",
    "İstanbul'a, Ankara'ya, Antep'e gitmeniz gerekmez.",
    "İşletmenizin toptan alımını yerinizden yaparsınız.",
    "Dört nedeni var.",
    "Neden iStoc'tan alırsınız?",
    "Neden iStoc'ta satarsınız?",
    "Yola çıkmanız gerekmez",
    "Üreticiyi tanırsınız",
    "Koşulu önceden görürsünüz",
    "Doğrulanmış mağazalar",
    "Açık koşullar",
    "Kayıtlı sipariş",
    "Destek ve iade",
    "Sektörünüze göre tedarik edin.",
    "Fiyatı ve koşulu açık ürünler.",
    "Sipariş vermeden önce sorulanlar.",
    "Toptan alıma bugün başlayın.",
    # Bu sayfanın kendi kartlarını anlatan cümleler
    "Fiyatı, en az sipariş adedini ve hazırlık süresini ekranınızda görürsünüz.",
    "Ürün kartında fiyat, en az sipariş adedi ve hazırlık süresi yazar.",
    "Ürün kartında birim fiyat, KDV hariç fiyat, en az sipariş adedi ve hazırlık süresi yazar.",
    "Üretici kartında işletme doğrulaması, şehir ve ürün sayısı yazar.",
    "En az sipariş adedi ürün kartında yazar.",
    "Rozet üretici kartında ve ürün kartında durur.",
    # Sık sorulan sorular. Yanıtları kanıt defterindedir.
    "Ödemeyi kime yaparım?",
    "Hangi ödeme yöntemleri geçerlidir?",
    "En az sipariş adedini nerede görürüm?",
    "Doğrulama rozeti ne demektir?",
    "Siparişim gelmezse ne olur?",
    "Teslimat süresi nasıl belirlenir?",
    # Yönergeler
    "Aradığınız ürünü yazın.",
    "Üreticiler size teklif göndersin.",
    "Ürünü ve adedi yazarsınız.",
    "Ürün adını yazın.",
    # Öneri notları: bu sayfanın canlı siteye bağlı olmadığını söyleyen cümleler
    "Bu sayfa bir tasarım önerisidir.",
    "Form bir yere veri göndermez.",
    "İsteğiniz gönderilmedi.",
    "Bu sepet bir örnektir.",
    "Sepete eklemek ödeme başlatmaz.",
    "Ürünler canlı sepete eklenmez.",
    "Bu öneride seçim sayfanın dilini değiştirmez.",
]

# Etiketler: düğme, bağlantı ve alan adları. Canlı sitedeki bir sayfanın adı da etikettir.
# Etiket bir olgu bildirmez. Olgu bildiren metin IDDIALAR ya da VERI_METNI listesine yazılır.
ETIKETLER = [
    # Üst bölüm ve gezinme
    "İçeriğe atlayın", "Sipariş takibi", "Ticaret güvencesi", "Yardım Merkezi", "Giriş yapın", "Teklif isteyin",
    "Tüm kategoriler", "Kategorinin tümü", "Çok satanlar", "Yeni ürünler", "Teklif isteği", "Satışa başlayın", "Ana sayfa",
    # Bölüm adları
    "Alıcılar için", "Satıcılar için", "Sipariş süreci", "Sık sorulanlar", "Örnek sipariş",
    # Sayıların ve koşulların etiketleri
    "toptan ürün", "doğrulanmış mağaza", "para birimi", "adet başına", "En az sipariş adedi", "Hazırlık süresi",
    "Birim fiyat", "Ödeme yöntemleri", "Para birimleri", "Dil ve para birimi", "Sepetiniz boş",
    # Form
    "Hangi ürünü arıyorsunuz?", "Kaç adet?",
    # Eylemler
    "Teklif isteği oluşturun", "Canlı sitede teklif isteği oluşturun", "Ürünleri inceleyin", "Ticaret güvencesini inceleyin",
    "Satıcı başvurusu yapın", "Paketleri ve ücretleri görün", "Tüm üreticiler", "Mağazaya gidin", "Mesaj yazın",
    "Sepete ekleyin", "Üreticileri keşfedin", "Canlı sepet",
    # Alt bölümdeki sayfa adları
    "Haftanın fırsatları", "Satıcı Merkezi", "Paketler ve ücretler", "Satıcı Hizmet Sözleşmesi", "Nasıl işler?",
    "Ödeme seçenekleri", "Para iade politikası", "Satış sonrası korumalar", "Alıcı Koruma Programı", "Canlı destek",
    "Kargo ve teslimat", "Kötüye kullanım bildirin", "Kullanım koşulları", "Gizlilik politikası", "Çerez tercihleri",
]

# Betik metinleri: app.js içinde yazan ve kullanıcının gördüğü ya da duyduğu metin parçaları.
# kapi.mjs, app.js içindeki her Türkçe metnin bu listede olduğunu denetler.
BETIK_METNI = [
    "Ürün arayın", "Üretici arayın", "Ürün adını yazın.",
    "İsteğiniz gönderilmedi. Bu sayfa bir tasarım önerisidir.",
    "Canlı sepeti açın. Örnek sepette", "ürün var.", "ürün,", "Sepetiniz boş", "adet ekleyin",
    "adet örnek sepette. Ürün canlı sepete eklenmedi.", "örnek sepetten çıkarıldı.",
    "ürün gösteriliyor.", "seçildi. Bu öneride seçim sayfanın dilini değiştirmez.",
]
