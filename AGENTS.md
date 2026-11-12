# iStoc ana sayfa çalışma kuralları

Bu depo yalnız ana sayfanın tasarım önerisini içerir.
Ayrı içerik veya hesaplayıcı sayfaları üretmeyin.
Mevcut bölümleri ve bileşenleri güncelleyin.

## Kaynak ve derleme

`index.html` dosyasını elle değiştirmeyin.
Şablonları ve `build.py` dosyasını değiştirin.
Önce `npm ci --ignore-scripts` ile sabit derleyiciyi kurun.
Önizlemeyi `npm run build` komutuyla üretin.
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

1. `npm run build` komutunu çalıştırın.
2. `npm run check` komutunu çalıştırın.
3. `node motion-testi.mjs <adres> --motor=chromium` komutunu çalıştırın.
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


## Metni kısaltırken anlamı koruyun

Başlık faydayı, açıklama gerekçeyi söylesin.
Neyin anlatıldığını aynı bileşende açıkça belirtin.
"Kart" veya "hesap" gibi çok anlamlı kelimeleri tek başına bırakmayın.
Açıklamaları kopuk sloganlara veya etiket dizilerine çevirmeyin.
Gerekiyorsa "çünkü" ile doğal bir neden bağı kurun.
Başlıkta ve açıklamada aynı bilgiyi gereksiz yere tekrarlamayın.
Kaynakta olmayan fayda, garanti veya işlem sonucu eklemeyin.
Bilinmeyen terimi günlük kelimelerle açıklayın.
Örnek site bağlantısında hedefi "istoc.com" diye belirtin.
Kısa metni, gerçek okurun anladığına kanıt saymayın.


## Bölgesel tedarik ve kaynaklar

Bölgesel içerikte önce işletmenin alım ihtiyacını açıklayın.
Yerin seçilme nedenini kaynakla destekleyin.
İlçe, semt, ticaret merkezi ve sanayi bölgesini doğru türle yazın.
Ticaret ve üretim bilgilerini `data/bolgeler.json` dosyasında tutun.
Alıcı bölgelerini `data/alicilar.json` dosyasında tutun.
Tedarik listesi 45 kayıt, alıcı listesi 24 kayıt içerir.
Her merkez için en fazla iki sektör seçin.
Sınırı şehre değil, aynı adlı merkez veya bölgeye uygulayın.
İki veri dosyasının sektörlerini birlikte sayın.
Kaynak faaliyetinden gerçek satın alma talebi sonucu çıkarmayın.
Planlanan alıcı listesini gerçek profil listesi gibi sunmayın.
Arama sonuçlarını ve boş durumunu görünür biçimde açıklayın.
Betik çalışmazsa bütün merkezler okunabilsin.
Kaynaklı olguları editoryal alım önerilerinden ayırın.
Her olgunun kaynak adresi ve denetim günü bulunsun.
Bölgenin anılması platformda satıcı bulunduğu anlamına gelmez.
Fiyat üstünlüğü, sertifika veya kalite garantisi uydurmayın.
Bu görev yalnız ana sayfayı kapsar. Ayrı bölge sayfası üretmeyin.
Teklif bağlantısı kullanıcının yazdığı ürün bilgisini korusun.
Odaklanan alan sabit çubukların altında kalmasın.

Yönlü hareket yalnız dekoratif katmanlarda kullanılır.
Metin ve eylem alanları bu hareketle yer değiştirmez.
React Bits hesapları, kaynak atfıyla TypeScript'e uyarlanır.
Kaynak commit ve lisans `THIRD_PARTY_NOTICES.md` dosyasında kayıtlıdır.
Üçüncü taraf lisansını derlenmiş çıktıda da koruyun.
`src/hareket` kaynaklarını değiştirin. `hareket` çıktılarını elle değiştirmeyin.
Derleme damgasını ve gerçek tür denetimini birlikte çalıştırın.
Bütçeler ve kaynak farkları `HAREKET-TASARIMI.md` dosyasındadır.
Normal harekette merkezi pozitif süreyi ve Cubic eğrisini kullanın.
Hareket paketi azaltılmış hareket ve veri tasarrufunda indirilmez.
Three.js veya başka grafik bağımlılığı eklenmez.
Hareket azaltmada yüzeyler sabit kalır.
Gizli sekmede ve ekran dışındaki yüzeylerde hareket hesaplanmaz.

Bölüm denetimi için `--bolge` seçeneğini kullanın.
Tek motor için `--motor=chromium` veya `--motor=webkit` seçin.
Bu seçenekler `tarayici-testi.mjs` komutuna eklenir.
Yükleme sorunu varsa sonucu `not_run` olarak kaydedin.
Çalışmayan kontrolü geçmiş saymayın.
