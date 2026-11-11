# iStoc ana sayfa çalışma kuralları

Bu depo yalnız ana sayfanın tasarım önerisini içerir.
Ayrı içerik veya hesaplayıcı sayfaları üretmeyin.
Mevcut bölümleri ve bileşenleri güncelleyin.

## Kaynak ve derleme

`index.html` dosyasını elle değiştirmeyin.
Şablonları ve `build.py` dosyasını değiştirin.
Önizlemeyi `python3 build.py` komutuyla üretin.
GitHub Pages bu önizlemeyi sunar ve `noindex` taşır.
`--yayin` seçeneği planlanan bölümleri kaldırır.
Bu seçenek GitHub Pages önizlemesi için kullanılmaz.

Canlı olguların kaynağı `data` klasörüdür.
Planlanan hizmetleri görünür etiketle ayırın.
Kaynağı olmayan fiyat, süre veya garanti eklemeyin.
Form ve sepet örneklerinin gerçek işlem yapmadığını belirtin.

## Görünüm ve etkileşim

Bu projede açık kullanıcı kararıyla Ubuntu kullanılır.
Gövde metni en az 16 CSS px olmalıdır.
Diğer okunabilir metinler en az 14 CSS px olmalıdır.
Yerleşimi önce 320 CSS px genişlikte kontrol edin.
Lacivert yüzeyleri ve turuncu vurguları semantik tokenlarla yönetin.
Bileşen sınırları ve eylemler üzerine gelmeden anlaşılmalıdır.
Hareket tokenları `cubic-bezier(.65, 0, .35, 1)` kullanır.
ARIA ve odak anında güncellenir.
Hareket azaltma tercihine uyun.
Normal temada çevreleyen odak halkası kullanmayın.
Tab ile başlayan odak göstergesi dolgu veya alt çizgidir.
İşletim sisteminin yerel seçim menüsünü kullanmayın.

## Kontroller

1. `python3 build.py` komutunu çalıştırın.
2. `node kapi.mjs` komutunu çalıştırın.
3. `node kapi.mjs --sinama` komutunu çalıştırın.
4. Açık önizlemede `node tarayici-testi.mjs <adres>` komutunu çalıştırın.

Tarayıcı araçları kurulu Playwright paketini kullanır.
`PLAYWRIGHT_PACKAGE_DIR` paket kurulumunun üst klasörünü belirtir.
Chromium ve WebKit sonuçlarını gerçek cihaz testi diye sunmayın.
Kullanıcı açıkça istemedikçe Firefox testi çalıştırmayın.
Anlamlı arayüz teslimi bağımsız inceleme gerektirir.
İnceleyici dosya değiştirmez veya komut çalıştırmaz.
Türkçe metinleri ortak yazım denetimiyle kontrol edin.

## Git ve yayın

Yazar ve kaydeden kimliği aşağıdaki gibi olmalıdır.

`karacaismail <35493655+karacaismail@users.noreply.github.com>`

Git yazar korumasını atlamayın veya zayıflatmayın.
Ek yazar ve üretim imzası eklemeyin.
Özel istemleri, kişisel bilgileri ve erişim anahtarlarını depoya koymayın.
Onaylanmadan lisans seçmeyin veya değiştirmeyin.
Push sonrası Pages derlemesini ve canlı sayfayı ayrı doğrulayın.
