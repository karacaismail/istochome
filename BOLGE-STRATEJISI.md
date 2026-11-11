# Bölgesel tedarik bölümünün gerekçesi

Bu bölüm, alıcıya nereden başlayacağını anlatır.
Yer adından önce işletmenin ihtiyacını gösterir.
Her yer için üretim bilgisi, alım koşulları ve sonraki adım birlikte görünür.

## Kapsam

Mevcut üst bölüm, alt bölüm ve ürün dizini korunur.
Ürün dizininden sonra yeni bir bölgesel tedarik bölümü eklenir.
Ayrı ilçe sayfası veya yeni hesaplayıcı üretilmez.
GitHub Pages bir tasarım önizlemesidir ve arama dizinine kapalı kalır.

## Yerlerin seçilme nedeni

| Yer | Alıcının ihtiyacı | Seçim gerekçesi | Siparişte karşılaştırılacak bilgiler |
|---|---|---|---|
| Buldan ilçesi, Denizli | Mağazası için dokuma ürün arar. | Buldan bezinin ev tekstilinde kullanımı resmi sicil belgesinde anlatılır. | Kumaş içeriği, ölçü, çekme ve yeniden sipariş koşulları karşılaştırılır. |
| Sürmene ilçesi, Trabzon | Mağazasına veya mutfağına bıçak alır. | Sicil belgesi, ilçedeki mutfak ve kasap bıçağı üretiminin geçmişini anlatır. | Kullanım amacı, çelik, sap, ambalaj ve bakım koşulları karşılaştırılır. |
| İnegöl ilçesi, Bursa | Mobilya mağazasının ürünlerini yeniler. | Ticaret odası, mobilya üretiminin geçmişini ve farklı ürün gruplarını anlatır. | Ölçü, malzeme, üretim süresi, nakliye ve montaj koşulları karşılaştırılır. |
| Merter semti, İstanbul | Giyim mağazasındaki beden ve renkleri tamamlar. | Bölgedeki dernek, tekstil ve hazır giyim işletmelerini temsil eder. | Beden dağılımı, kumaş, renk ve yeniden sipariş koşulları karşılaştırılır. |

İhtiyaçlar ve kontrol listeleri editoryal öneridir.
Bunlar müşteri görüşmelerinden elde edilmiş bulgular değildir.
Üretim bilgileri aşağıdaki kurumsal kaynaklara dayanır.
Kaynaklar 11 Kasım 2026 tarihinde incelendi.

- [Buldan Bezi sicil belgesi](https://ci.turkpatent.gov.tr/Files/GeographicalSigns/194.pdf), ilk iki sayfa.
- [Sürmene Bıçağı sicil belgesi](https://ci.turkpatent.gov.tr/Files/GeographicalSigns/65d834cb-5d2e-4104-a3d1-f961aae52cb0.pdf), ikinci sayfa.
- [İnegöl Ticaret ve Sanayi Odası](https://www.itso.org.tr/inegol-mobilyasi), üretim geçmişi ve ürün grupları.
- [MESİAD hakkında](https://www.mesiad.tr/kurumsal/hakkimizda) ve [başkanın mesajı](https://www.mesiad.tr/baskanin-mesajlari/baskanin-mesaji), Merter ve hazır giyim.

Bölge seçimi fiyat üstünlüğü veya ürün kalitesi garantisi değildir.
Bölgenin anılması, iStoc'ta o bölgeden satıcı bulunduğu anlamına gelmez.
Coğrafi işaret kaydı her satıcının ürününe otomatik güvence sağlamaz.
İnegöl için eldeki kaynak genel mobilyayı destekler. Metin bu yüzden ofis mobilyasıyla sınırlandırılmaz.
Merter ilçe olarak yazılmaz.

## Çok çeşit satan mağazalar

Ucuzluk mağazası işleten alıcı birden fazla ürün grubunu birlikte değerlendirebilir.
Bu nedenle bölümde çok kategorili alım için ayrı bir kontrol alanı bulunur.
Alıcı ürün başına adedi, koli içeriğini, taşıma maliyetini ve yeniden sipariş koşulunu karşılaştırır.
Bu liste, platformun tek koli veya tek kargo hizmeti sunduğu anlamına gelmez.

## İçerik ve tasarım kararı

Yerler, ziyaretçinin okuyacağı tam cümlelerle açıklanır.
Ana gerekçe ve alım koşulları üzerine gelmeden görünür.
Kaynak bağlantısı, alım eyleminden görsel olarak ayrılır.
Teklif bağlantısı aynı sayfadaki forma gider.
Formda yazılmış ürün varsa yeni öneri bu metni silmez.

Gelecekte ayrı bölge sayfası düşünülürse özgül alım bilgisi gerekir.
Yalnız yer adı değişen sayfalar üretilmez.
Doğrulanmış satıcı kapsamı, ürün bilgisi ve güncel kaynaklar ayrıca değerlendirilir.
Bu görevde böyle sayfalar veya sıralama sonucu üretilmedi.
Yaklaşım, [Google’ın insanlara yararlı içerik rehberiyle](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) birlikte değerlendirildi.

## Arka plan hareketleri

Görsel referanslar [Waves](https://reactbits.dev/backgrounds/waves), [Shape Grid](https://reactbits.dev/backgrounds/shape-grid) ve [Dot Grid](https://reactbits.dev/backgrounds/dot-grid) örnekleridir.
Bu örneklerdeki çizgi, ızgara ve nokta dili mevcut marka renklerine uyarlanır.
Three.js veya yeni bir grafik kütüphanesi eklenmez.
Hareket yalnız dekoratif yüzeyleri etkiler. Metinler ve düğmeler sabit kalır.
Kaydırma yönüne göre yatay, dikey ve çapraz hareketler kullanılır.
İşaretçi tepkisi ek bir ayrıntıdır. Telefonda hareket kaydırmayla çalışır.
Hareket azaltma tercihinde yüzeyler sabit görünür.

## Doğrulama sınırı

Gerçek okurla denenmedi.
Gerçek cihaz ve ekran okuyucu denemesi yapılmadı.
Tarayıcı kontrol sonuçları PLAN.md dosyasında kaydedilir.
