# iStoc ana sayfa tasarım önerisi

Bu depo, istoc.com ana sayfası için bir tasarım önerisi içerir. Sayfa canlı site değildir.

- Önizleme adresi: https://karacaismail.github.io/istochome/
- Tasarımın gerekçesi [PLAN.md](PLAN.md) dosyasındadır.
- Renk, güven ve piktogram kararlarının kaynakları [ARASTIRMA.md](ARASTIRMA.md) dosyasındadır.

## Sayfada ne var?

- Değer önerisi, alıcı ile satıcının iki yolu, arama ve hızlı teklif isteği ilk ekrandadır.
- Bölümler alıcının soru sırasını izler. Önizlemede planlanan bölümler etiketiyle durur.
- Dizin bölümü, ürünleri dokuz ayrı yoldan bulur. Her öğe canlı sitede çalışan bir adrese gider.
- Alt bölüm beş katmandır. Dil ve para birimi görsel kutularla seçilir. Ödeme yöntemleri piktogramı ve adıyla durur.
- Para birimi seçimi sayfadaki fiyatları değiştirir. `build.py` tutarları Türk lirası fiyatından canlı sitenin kuruyla çevirir.
- Bölgesel tedarik bölümü 45 merkezin alım koşullarını açıklar. Merkez, şehir ve sektör aranabilir.
- Alıcı bölümü 24 bölge için talep hazırlamayı anlatır. Yayımlanmış talepleri göstermez.
- Bölge seçiminin gerekçesi [BOLGE-STRATEJISI.md](BOLGE-STRATEJISI.md) dosyasındadır.
- Altı arka plan sahnesi, kaydırmayla yön değiştirir ve derinlik kazanır.
- React Bits hesaplarının TypeScript uyarlaması [HAREKET-TASARIMI.md](HAREKET-TASARIMI.md) dosyasında açıklanır.
- Yazı tipi Ubuntu'dur.
- 12 araç, ne hesaplayacağını sayfa içinde açıklar. Araçlar henüz hesaplama yapmaz.
- Sözlük, hesaplayıcılar, şablonlar, karşılaştırmalar, sektör verileri ve kontrol listeleri menüde yer alır.

## Sayfa nasıl üretilir?

1. `python3 veri.py` komutunu çalıştırın. Komut olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar.
2. `npm ci --ignore-scripts` komutuyla sabit TypeScript derleyicisini kurun.
3. `npm run build` komutunu çalıştırın. Komut JavaScript çıktılarını ve `index.html` dosyasını üretir.

GitHub Pages, planlanan bölümleri içeren önizleme derlemesini sunar. Bu derleme arama motorlarına kapalıdır.

`python3 build.py --yayin` komutu planlanan bölümleri kaldırır. Bu seçenek Pages önizlemesi için kullanılmaz.

`veri.py` şunları da denetler. Bir denetim başarısız olursa hiçbir dosyayı yazmaz.

- istoc.com kaynağına dayanan cümlelerin kanıtı canlı sitede duruyor mu?
- Sayfanın bağlantı verdiği her canlı sayfa açılıyor mu? Var olmayan bir adres açılmıyor mu?
- Ürün ve mağaza adresleri canlı sitenin site haritasında var mı?
- Bağlantıdaki değişken adlarını canlı sayfanın kodu tanıyor mu?
- Fiyat Türk lirası ve KDV hariç mi?
- Dizindeki her arama sonuç veriyor mu?

`veri.py` dosyaları tek koşuda yazar ve koşunun özetini `data/kosu.json` dosyasına koyar. Özet tutmazsa `build.py` sayfayı üretmez.

## Sayfa nasıl denetlenir?

1. `npm run check` komutunu çalıştırın. Komut türleri, kaynak kurallarını ve kapının bozulma örneklerini denetler.
2. `node serve.mjs` komutunu çalıştırın. Komut önizleme sunucusunu açar.
3. `node tarayici-testi.mjs http://localhost:4391/` komutunu çalıştırın. Komut sayfayı Chromium ve WebKit'te sınar.

Tarayıcı testi Playwright ister. `PLAYWRIGHT_PACKAGE_DIR` değişkeni verilirse test Playwright'ı önce o klasörde arar. Sonra bu klasörde arar.

Tarayıcı testinin bozulma örnekleri için komuta `--sinama` ekleyin.
Hareket davranışını `node motion-testi.mjs <adres> --motor=chromium` komutuyla sınayın.

Bölgesel tedarik için tarayıcı komutuna `--bolge` seçeneğini ekleyin.
Tek motor için `--motor=chromium` veya `--motor=webkit` seçeneğini kullanın.

Büyütülmüş yazı ve zorlanmış renk denetimleri yalnız Chromium'da çalışır. WebKit bu iki ayarı öykünmez. Test çıktısı bunu `NOT_RUN` satırıyla yazar.

## Notlar

- Ürün görselleri ve mağaza logoları istoc.com'daki ilanlardan alındı. Bu görsellerin hakları sahiplerine aittir.
- Sayfadaki sayılar `data` klasöründeki veriden gelir. Verinin alındığı gün sayfada yazar.
- Teklif formu, sepet ve dil seçimi canlı siteye bağlı değildir.
- Ödeme yöntemlerinde marka logosu kullanılmadı. Her yöntem bir piktogramla ve adıyla durur.
- Bu depo için henüz bir lisans seçilmedi.
- React Bits uyarlamasının ayrı lisansı [üçüncü taraf bildirimlerinde](THIRD_PARTY_NOTICES.md) açıklanır.
