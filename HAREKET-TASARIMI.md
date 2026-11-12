# Kurumsal arka plan hareketleri

Amaç, toptan ticaretin akışını bölüm arka planlarında görünür kılmaktır.
Metin, form, düğme ve ürün kartları yerinde kalır.
Lacivert ve mavi yüzeyler hareket taşır. Turuncu eylemleri vurgular.
Hareket, güvence veya çalışan ödeme hizmeti anlamına gelmez.

## Altı ayrı sahne

| Bölüm | Görsel davranış | React Bits bağlantısı |
|---|---|---|
| Karşılama | Kavisli şeritler ve küçük paketler karşıt katmanlarda ilerler. | Waves dalga hesabı |
| Üreticiler | Eğik ızgaranın satırları sırayla ters yöne gider. | GridMotion satır hızları ve kenar maskesi |
| Sipariş süreci | Düğümler kavisli yol üzerinde ilerler ve geri döner. | Bu siteye ait Bezier yolu |
| Satıcılar | Geometrik katmanlar yükselir ve ters yönlerde döner. | MagnetLines sabit tohum hesabı |
| Hesaplama araçları | Noktalar merkezden büyür. İnce işaretçiden uzaklaşır. | DotGrid yakınlık hesabı |
| Ticaret merkezleri | Çizgiler çekim noktasına döner. Bağlantılar çapraz ilerler. | MagnetLines yön hesabı |

Bu çalışma yalnız benzer çizimler kullanmaz.
Seçilen kaynak hesapları TypeScript'e uyarlanmıştır.
React bileşenleri ve WebGL çizim altyapısı alınmamıştır.
Bu nedenle kaynak demoların bütün özelliklerini birebir taşıdığı söylenmez.
Kaynak, satır ve lisans bilgileri [bildirim dosyasındadır](THIRD_PARTY_NOTICES.md).

## Hafif uygulama

Sayfa önce durağan SVG ve HTML ile açılır.
Küçük önyükleyici, hareket paketi için kullanıcı tercihlerini denetler.
Hareket azaltma veya veri tasarrufu açıksa ana paketi indirmez.
Tarayıcı veri tasarrufu bilgisini sunmuyorsa bu tercih bilinemez.
Tercih sonradan değişirse hareket başlar veya durur.

TypeScript 5.9.3 sürümü kilit dosyasında sabittir.
`src/hareket` dosyaları `hareket` klasörüne JavaScript olarak derlenir.
Tarayıcı TypeScript kaynağını çalıştırmaz.
React, Three.js, WebGL, Canvas, GSAP veya OGL eklenmez.

Denetleyici tek kare zamanlayıcısı kullanır.
Önce görünen sahneleri ölçer. Sonra dekoratif katmanları günceller.
Gizli sekmede ve ekran dışındaki sahnede çizim yapılmaz.
Sürekli çalışan boşta döngü kurulmaz.

## Hareket sınırları

Kaydırma yön değiştirince sahne mevcut konumundan geri döner.
Sunum merkezi süre ve simetrik Cubic eğrisiyle yumuşar.
Her yeni hedef farkı, merkezi eğriyi kullanan sonlu bir geçiş başlatır.
Bu geçişler birlikte hesaplanır. Biten geçişler kuyruktan çıkarılır.
Böylece sürekli kaydırmada hareket tekrar tekrar yavaşlayıp başlamaz.
Girdi durunca son geçiş de merkezi süre içinde biter.
İşlev, ARIA ve odak hareketin bitmesini beklemez.
İşaretçi etkisi yalnız uygun fare veya kalem girdisinde çalışır.
Telefon deneyimi fareyle üzerine gelmeye bağlı değildir.

Ana kayma masaüstünde en çok 160 CSS px olur.
640 CSS px altında bu sınır 56 CSS px olur.
Ek işaretçi kayması en çok 8 CSS px olur.
Bu sınırlar, yol üzerindeki düğümlerin mutlak koordinatları değildir.
Derinlik sahnesi 0,65 ölçekten başlayabilir.
Diğer katmanlarda ölçek 0,78 ile 1,08 arasındadır.

Masaüstünde sahne, uzun bölüm boyunca görünür alanda kalır.
Telefonda dekorasyon başlığın çevresinde hareket eder.
İlerleme hesabı, bu görünür alanın yüksekliğini kullanır.
Liste uzasa da başlıktaki hareket yavaşlamaz.
Baskıda ve zorlanmış renklerde dekorasyon gizlenir.
Eski tarayıcı yapışkan yüzeyi desteklemiyorsa durağan yerleşim korunur.
Dekorasyon tıklanamaz ve ekran okuyucudan gizlidir.
Metin arkasındaki yoğunluk maskeyle azaltılır.

## Proje bütçesi

Bu sınırlar bu uygulama için seçilmiştir.
Gerçek cihaz performansı garantisi değildir.

| Kaynak | Sınır |
|---|---|
| Önyükleyici | Gzip ile en çok 2 KiB |
| Üç hareket betiğinin toplamı | Gzip ile en çok 16 KiB |
| Ek hareket stilleri | Gzip ile en çok 6 KiB |
| Altı sahnedeki dekoratif öğeler | En çok 240 |
| Dar ekranda bir sahnedeki görünür öğeler | En çok 64 |
| Ek resim, yazı tipi ve çalışma zamanı kütüphanesi | Yok |

Gzip dosya ölçümü, sunucunun aktardığı baytlarla aynı olmayabilir.
Tarayıcı isteği ile yerel boyut ölçümü ayrı değerlendirilir.

## Denetim

`npm run build` kaynakları derler ve sayfayı üretir.
`npm run check` türleri, damgayı, kuralları ve bozulma örneklerini denetler.
Damga kaynak, çıktı, derleme ayarı ve kilit değişikliklerini denetler.
Damga güvenlik veya bütünlük garantisi değildir.
Lisans atfı da kapı tarafından denetlenir.

`motion-testi.mjs` hareketi, geri dönüşü ve koşullu yüklemeyi sınar.
`tarayici-testi.mjs --bolge` bölümün metin, kaynak, form ve odak davranışını sınar.
Sonuçlar [PLAN.md](PLAN.md) dosyasında ayrı kaydedilir.
Ekran görüntüsü tek başına hareketin akıcı olduğunu kanıtlamaz.
Gerçek Safari, iOS ve Android sonuçları öykünmeyle eşit sayılmaz.
Gerçek okurla denenmedi.
