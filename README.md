# iStoc ana sayfa tasarım önerisi

Bu depo, istoc.com ana sayfası için bir tasarım önerisi içerir. Sayfa canlı site değildir.

- Önizleme adresi: https://karacaismail.github.io/istochome/
- Tasarımın gerekçesi [PLAN.md](PLAN.md) dosyasındadır.
- Renk, güven ve piktogram kararlarının kaynakları [ARASTIRMA.md](ARASTIRMA.md) dosyasındadır.

## Sayfada ne var?

- Değer önerisi, alıcı ile satıcının iki yolu, arama ve hızlı teklif isteği ilk ekrandadır.
- Bölümler alıcının soru sırasını izler. Önizlemede planlanan bölümler etiketiyle durur.
- Dizin bölümü, ürünleri dokuz ayrı yoldan bulur. Her öğe canlı sitede çalışan bir adrese gider.
- Alt bölüm beş katmandır. Dil, para birimi ve ödeme yöntemleri görsel kutularla durur.
- Para birimi seçimi sayfadaki fiyatları değiştirir.
- Yazı tipi Ubuntu'dur.
- 12 araç, ne hesaplayacağını sayfa içinde açıklar. Araçlar henüz hesaplama yapmaz.
- Sözlük, hesaplayıcılar, şablonlar, karşılaştırmalar, sektör verileri ve kontrol listeleri menüde yer alır.

## Sayfa nasıl üretilir?

1. `python3 veri.py` komutunu çalıştırın. Komut olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar.
2. `python3 build.py` komutunu çalıştırın. Komut `index.html` dosyasını üretir.

GitHub Pages, planlanan bölümleri içeren önizleme derlemesini sunar. Bu derleme arama motorlarına kapalıdır.

`python3 build.py --yayin` komutu planlanan bölümleri kaldırır. Bu seçenek Pages önizlemesi için kullanılmaz.

`veri.py` üç şeyi de denetler. Bir denetim başarısız olursa hiçbir dosyayı yazmaz.

- Sayfadaki her kaynaklı cümlenin kanıtı canlı sitede duruyor mu?
- Sayfanın bağlantı verdiği her canlı sayfa açılıyor mu?
- Dizindeki her arama sonuç veriyor mu?

## Sayfa nasıl denetlenir?

1. `node kapi.mjs` komutunu çalıştırın. Komut kaynak kurallarını denetler.
2. `node serve.mjs` komutunu çalıştırın. Komut önizleme sunucusunu açar.
3. `node tarayici-testi.mjs http://localhost:4391/` komutunu çalıştırın. Komut sayfayı Chromium ve WebKit'te sınar.

Tarayıcı testi Playwright ister. `PLAYWRIGHT_PACKAGE_DIR` değişkeni verilirse test Playwright'ı önce o klasörde arar. Sonra bu klasörde arar.

Kapı ve test kendini de sınar. Bunun için iki komuta `--sinama` seçeneğini ekleyin.

## Notlar

- Ürün görselleri ve mağaza logoları istoc.com'daki ilanlardan alındı. Bu görsellerin hakları sahiplerine aittir.
- Sayfadaki sayılar `data` klasöründeki veriden gelir. Verinin alındığı gün sayfada yazar.
- Teklif formu, sepet ve dil seçimi canlı siteye bağlı değildir.
- Ödeme yöntemlerinde marka logosu kullanılmadı. Her yöntem bir piktogramla ve adıyla durur.
- Bu depo için henüz bir lisans seçilmedi.
