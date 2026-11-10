# iStoc ana sayfa tasarım önerisi

Bu depo, istoc.com ana sayfası için bir tasarım önerisi içerir. Sayfa canlı site değildir.

- Önizleme adresi: https://karacaismail.github.io/istochome/
- Tasarımın gerekçesi [PLAN.md](PLAN.md) dosyasındadır.
- Renk, güven ve piktogram kararlarının kaynakları [ARASTIRMA.md](ARASTIRMA.md) dosyasındadır.

## Sayfada ne var?

- Değer önerisi, arama ve hızlı teklif isteği ilk ekrandadır.
- Sekiz numaralı bölüm alıcının soru sırasını izler.
- Dizin bölümü, ürünleri dokuz ayrı yoldan bulur. Her öğe canlı sitede çalışan bir adrese gider.
- Alt bölüm beş katmandır. Dil, para birimi ve ödeme yöntemleri görsel kutularla durur.
- Para birimi seçimi sayfadaki fiyatları değiştirir.
- Yazı tipi Ubuntu'dur.

## Sayfa nasıl üretilir?

1. `python3 veri.py` komutunu çalıştırın. Komut olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar.
2. `python3 build.py` komutunu çalıştırın. Komut `index.html` dosyasını üretir.

Önizleme derlemesi arama motorlarına kapalıdır. Yayın derlemesi için `python3 build.py --yayin` komutunu kullanın.

`veri.py` üç şeyi de denetler. Bir denetim başarısız olursa hiçbir dosyayı yazmaz.

- Sayfadaki her kaynaklı cümlenin kanıtı canlı sitede duruyor mu?
- Sayfanın bağlantı verdiği her canlı sayfa açılıyor mu?
- Dizindeki her arama sonuç veriyor mu?

## Sayfa nasıl denetlenir?

1. `node kapi.mjs` komutunu çalıştırın. Komut kaynak kurallarını denetler.
2. `node serve.mjs` komutunu çalıştırın. Komut önizleme sunucusunu açar.
3. `node tarayici-testi.mjs http://localhost:4391/` komutunu çalıştırın. Komut sayfayı Chromium ve WebKit'te sınar.

Tarayıcı testi Playwright ister. Test Playwright'ı önce bu klasörde arar.

Kapı ve test kendini de sınar. Bunun için iki komuta `--sinama` seçeneğini ekleyin.

## Notlar

- Ürün görselleri ve mağaza logoları istoc.com'daki ilanlardan alındı. Bu görsellerin hakları sahiplerine aittir.
- Sayfadaki sayılar `data` klasöründeki veriden gelir. Verinin alındığı gün sayfada yazar.
- Teklif formu, sepet ve dil seçimi canlı siteye bağlı değildir.
- Ödeme yöntemlerinde marka logosu kullanılmadı. Her yöntem bir piktogramla ve adıyla durur.
- Bu depo için henüz bir lisans seçilmedi.
