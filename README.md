# iStoc ana sayfa tasarım önerisi

Bu depo, istoc.com ana sayfası için bir tasarım önerisi içerir. Sayfa canlı site değildir.

- Önizleme adresi: https://karacaismail.github.io/istochome/
- Tasarımın gerekçesi [PLAN.md](PLAN.md) dosyasındadır.
- Renk, güven ve piktogram kararlarının kaynakları [ARASTIRMA.md](ARASTIRMA.md) dosyasındadır.

## Sayfa nasıl üretilir?

1. `python3 veri.py` komutunu çalıştırın. Komut olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar.
2. `python3 build.py` komutunu çalıştırın. Komut `index.html` dosyasını üretir.

Önizleme derlemesi arama motorlarına kapalıdır. Yayın derlemesi için `python3 build.py --yayin` komutunu kullanın.

## Sayfa nasıl denetlenir?

1. `node kapi.mjs` komutunu çalıştırın. Komut kaynak kurallarını denetler.
2. `node serve.mjs` komutunu çalıştırın. Komut önizleme sunucusunu açar.
3. `node tarayici-testi.mjs http://localhost:4391/` komutunu çalıştırın. Komut sayfayı Chromium ve WebKit'te sınar.

Tarayıcı testi Playwright ister. Test Playwright'ı önce bu klasörde arar.

Kapı ve test kendini de sınar. Bunun için iki komuta `--sinama` seçeneğini ekleyin.

## Notlar

- Ürün görselleri ve mağaza logoları istoc.com'daki ilanlardan alındı. Bu görsellerin hakları sahiplerine aittir.
- Sayfadaki sayılar `data` klasöründeki veriden gelir. Verinin alındığı gün sayfada yazar.
- Teklif formu, sepet ve dil seçici canlı siteye bağlı değildir.
- Bu depo için henüz bir lisans seçilmedi.
