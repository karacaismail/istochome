# iStoc ana sayfa: tasarım planı (5. sürüm)

Bu belge ana sayfanın neden bu sırayla, bu renklerle ve bu bileşenlerle kurulduğunu anlatır. Renk, güven ve piktogram kararlarının kaynakları `ARASTIRMA.md` dosyasındadır.

## 1. Kapsam

- **Yalnız ana sayfa.** Bu görevde tek sayfa üretilir: `index.html`.
- **Başka sayfa üretilmez.** Kategori, arama ve mağaza sayfaları bu görevde yoktur. Bunlar menü öğesidir. Her menü öğesi canlı sitede çalışan bir adrese gider.
- **Sayfa bir tasarım önerisidir.** Canlı siteye yüklenmedi. Arama canlı sitedeki sonuç sayfasını açar. Teklif formu ve sepet veri göndermez. Önizleme derlemesi arama motorlarına kapalıdır.
- **Önizleme adresi:** https://karacaismail.github.io/istochome/

## 2. Kimin için, ne vaat ediyor?

Sayfanın iki okuyucusu var. Her biri "bu platformu kullanırım, çünkü" cümlesini kendi gerekçesiyle tamamlar. Sayfa bu gerekçeleri açıkça yazar.

**Alıcı.** İşletmesi ya da mağazası için toptan alım yapar. İstanbul'a, Ankara'ya, Antep'e gitmeden almak ister.

| "iStoc'tan alırım, çünkü" | Sayfadaki kanıtı |
|---|---|
| Yola çıkmam. | Ürünü seçer, satıcıyla anlaşır ve siparişi ekrandan başlatırım. |
| Kimin doğrulandığını görürüm. | Rozetli mağazanın kimlik ve işletme doğrulamasını iStoc yapar. 19 mağazanın 18 tanesi doğrulandı. |
| Koşulu önceden görürüm. | Ürün kartında birim fiyat, KDV hariç fiyat, en az sipariş adedi ve hazırlık süresi yazar. |
| Hangi hesaba ödeyeceğimi bilirim. | Yalnız sipariş sayfamda gösterilen hesaba ödeme yaparım. |
| Siparişim kayıt altındadır. | iStoc kabul ettiğim koşulları saklar ve siparişi teslimata kadar izler. |
| Sorun çıkarsa muhatabım vardır. | Koşullar karşılanmazsa talep açarım. |

**Satıcı.** Üreticidir. Yeni alıcıya ulaşmak ister.

| "iStoc'ta satarım, çünkü" | Kaynağı |
|---|---|
| Şu an satış komisyonu yok. | Canlı sitedeki satıcı sayfası. Ücretler Satıcı Hizmet Sözleşmesi'ndeki tabloya göredir. |
| Alıcıya aracısız ulaşırım. | Canlı sitedeki satıcı sayfası. |
| Başvuru 4 dakika sürer. | Canlı sitedeki satıcı sayfası. Onay ortalama 2 iş günüdür, başvuru ücretsizdir. |
| Mağazam doğrulanmış görünür. | Paket verisi. İşletme doğrulaması rozeti bütün paketlerde vardır. |

Sayfanın değer önerisi şudur: "Çarşıya gitmeyin. Çarşı ekranınızda."

Dil iddialıdır, ama her iddianın dayanağı vardır. Slogan ve başlık sayfanın kendi sözüdür. Canlı site hakkındaki her cümle kanıt defterindedir. Ayrıntı 15. bölümdedir.

Başlık sonuç vaat etmez, okurun ne göreceğini söyler. Örneğin "Karşınızdaki doğrulanmıştır" yazmaz, çünkü 19 mağazanın biri doğrulanmamıştır. Başlık "Kimin doğrulandığını görürsünüz" der.

## 3. Dönüşüm mimarisi: öğe, bileşen, bölüm, sayfa

Bu bölüm üç soruyu yanıtlar. Hangi öğeler birleşince dönüşümü destekleyen bileşen olur? Hangi bileşenler birleşince dönüşümü destekleyen bölüm olur? Hangi bölümler hangi sırayla dizilince dönüşümü destekleyen ana sayfa olur?

### 3.1 Öğe: her öğenin tek bir işi vardır

Sayfadaki her öğe beş işten birini yapar. Bu işlerden birini yapmayan öğe sayfaya girmez.

| Öğe türü | İşi | Nasıl yaratılır? | Örnek |
|---|---|---|---|
| Vaat | Sonucu söyler. | Okurun kelimeleriyle, kısa ve emir kipinde yazılır. | "Fiyatı sormayın. Kartta yazıyor." |
| Kanıt | Vaadi doğrular. | Sayı, rozet ya da kaynaklı cümledir. Günü yazar. | "19 mağazanın 18 tanesi doğrulandı." |
| Eylem | Bir sonraki adıma götürür. | Fiil ve nesneyle yazılır. Ne olacağını söyler. | "Teklif isteği oluşturun" |
| Güvence | Eylem anındaki korkuyu giderir. | Düğmenin hemen altında, tek cümleyle durur. | "Sepete eklemek ödeme başlatmaz." |
| Gösterge | Neye basılacağını ve durumu gösterir. | Alt çizgi, ok, dolgu ve piktogramdır. | Altı çizili bağlantı, seçili kutu |

### 3.2 Bileşen: vaat, kanıt, eylem ve güvence birlikte

Bir bileşen tek bir soruyu yanıtlar ve tek bir ana eylem taşır. İçinde dört öğe birlikte durur. Biri eksikse bileşen dönüştürmez.

| Bileşen | Vaat | Kanıt | Eylem | Güvence |
|---|---|---|---|---|
| Arama kutusu | Değer önerisi | Dört canlı sayı ve günü | "Arayın" | "Örnek aramalar" kısa yolları |
| Teklif kutusu | "Bir istek, birden fazla teklif" | Üç adım | "Teklif isteği oluşturun" | Formun veri göndermediği notu |
| Gerekçe kartı | "Çünkü" ile başlayan başlık | Kaynaklı cümle ve sayı | Bölüm sonu düğmesi | Doğrulama işareti |
| Ürün kartı | Ürün adı ve fiyat | En az adet, en az tutar, hazırlık süresi, rozet | "12 adet ekleyin" | Sepetin örnek olduğu notu |
| Üretici kartı | Mağaza adı | Doğrulama, kuruluş yılı, ürün sayısı | "Mağazaya gidin" | "Mesaj yazın" bağlantısı |
| Örnek sipariş | Koşulları önceden görme | Birim fiyat, koli, toplam | "Sepete ekleyin" | Ödemenin ne zaman yapıldığı |

Bir bileşende en çok bir turuncu düğme durur. Böylece göz tek bir ana eyleme gider.

### 3.3 Bölüm: bir itirazı yanıtlar, bir adım ilerletir

Bir bölüm alıcının tek bir sorusunu yanıtlar. Üç parçası vardır: başlık vaadi söyler, gövde kanıtı gösterir, çıkış bir sonraki adıma götürür. Çıkışı olmayan bölüm huniyi keser.

- Bölüm başlığı sıra numarası ve bölüm adıyla başlar. Okur sayfanın neresinde olduğunu bilir.
- Ekran okuyucu bölüm adını başlığın içinde okur: "Ürünler: Fiyatı sormayın. Kartta yazıyor." Böylece bölümün adı yalnız bir slogan olmaz.
- Çıkışın bağlayıcılığı, bölümün hunideki yerine uyar. Başta arama ve inceleme vardır. Sonda kayıt ve başvuru vardır.
- Aradığını bulamayan okur huniden çıkmaz. Ürünler bölümünün sonunda ve kategori menüsünde teklif isteği kısa yolu durur.

### 3.4 Sayfa: bölümler alıcının soru sırasını izler

Bölümlerin sırası alıcının sorularının sırasıdır. Sıra 4. bölümdeki tablodadır. Dört kural sırayı belirler:

1. **İki yol ilk ekrandadır.** Kendi arayan okur arama kutusunu kullanır. Yardım isteyen okur teklif kutusunu kullanır.
2. **Güven, üründen önce gelir.** Okur ürünlere bakmadan önce neden güveneceğini okur.
3. **Alıcının yolu kesilmez.** Alıcının bölümleri art arda gelir ve kapanış çağrısıyla biter. Satıcının bölümü bundan sonra başlar.
4. **Sabit öğeler huniyi her ekranda tutar.** Dört öğe bu işi yapar. Bunlar teklif düğmesi, mobil alt menü, konum çubuğu ve sipariş özeti çubuğudur.

## 4. Huni: bölüm sırası

| Sıra | Bölüm | Yanıtladığı soru | Çıkış |
|---|---|---|---|
| | Karşılama | Burası ne işe yarar? | Ürün ya da üretici arayın |
| | Hızlı teklif isteği | Aradığımı bulamazsam ne olur? | Teklif isteği oluşturun |
| 01 | Alıcılar için | Neden buradan alayım? | Ürünleri inceleyin |
| 02 | Kategoriler | Benim sektörüm var mı? | Kategoriye gidin |
| 03 | Ürünler | Fiyatlar ve koşullar nasıl? | En az adedi sepete ekleyin, teklif isteyin |
| 04 | Üreticiler | Karşımdaki kim? | Mağazaya gidin, mesaj yazın |
| 05 | Sipariş süreci | Param ve siparişim ne olur? | Örnek siparişi deneyin |
| 06 | Sık sorulanlar | Aklımdaki son itiraz ne? | Yardım Merkezi |
| | Kapanış çağrısı | Şimdi ne yapayım? | Ücretsiz kaydolun, teklif isteyin |
| 07 | Satıcılar için | Neden burada satayım? | Satıcı başvurusu yapın |
| 08 | Dizin | Aradığıma başka hangi yoldan giderim? | Dizin bağlantısına gidin |

Huniyi her ekranda destekleyen sabit öğeler:

- Geniş ekranda üst bölümde **Teklif isteyin** düğmesi durur.
- Dar ekranda aynı eylem mobil alt menünün ortasındadır. Aynı eylem ekranda iki kez durmaz.
- Karşılama araması ekranın üstünden çıkınca üst bölümde arama belirir.
- Üst bölümün altındaki **konum çubuğu** sayfanın ne kadarının geçildiğini gösterir.
- Sepete ürün eklenince **sipariş özeti çubuğu** belirir. Çubuk ürün sayısını, adedi ve toplamı gösterir.

## 5. Bant sistemi: bileşen nerede başlar, nerede biter?

Sayfa boydan boya bantlardan oluşur. Her bant tek bir işi yapar.

**Üç bant zemini sırayla gelir:**

| Zemin | Renk | Hangi bölümler? |
|---|---|---|
| Koyu | Lacivert geçiş | Karşılama, sipariş süreci, kapanış çağrısı |
| Açık | Beyaz | Alıcılar için, ürünler, sık sorulanlar, dizin |
| Tonlu | `#eef3f9` | Kategoriler, üreticiler, satıcılar için |

**Kurallar:**

1. Komşu iki bant aynı zeminde olmaz. Göz, zeminin değiştiği yerde bölümün bittiğini anlar.
2. Kart, içinde durduğu banttan ayrılır. Açık bantta kart tonludur. Tonlu bantta kart beyazdır.
3. Her bölüm aynı başlıkla başlar: sıra numarası, bölüm adı, ayırıcı çizgi, başlık, açıklama ve eylem.
4. Bir grubun iç boşluğu, komşu grupla arasındaki boşluktan küçüktür.
5. Kenarlık yalnız işlev için kullanılır: form alanında ve satır ayırıcıda.
6. Art arda iki koyu bant gelmez.

**Boşluk tokenları:**

| Token | 320 px | 600 px | 1024 px | Görevi |
|---|---|---|---|---|
| `--gutter` | 20 px | 24 px | 32 px | Sayfa kenar payı |
| `--band-y` | 56 px | 72 px | 104 px | Bandın üst ve alt boşluğu |
| `--head-gap` | 28 px | 36 px | 48 px | Bölüm başlığı ile içerik arası |
| `--sp-1` ile `--sp-11` | 4 ile 96 px | aynı | aynı | Bileşen içi boşluk ölçeği |

Boşluk üç basamaklıdır. Bölümler arasındaki boşluk en büyüktür. Kartlar arasındaki boşluk en küçüktür. Böylece göz önce bölümü, sonra kartı seçer.

`tarayici-testi.mjs` bu kuralları beş soruyla ölçer:

1. Komşu iki bant farklı zeminde mi?
2. Kartın yüzeyi bandından ayrılıyor mu?
3. Aynı banttaki iki modül birbirine değiyor mu?
4. Her modülün adı var mı?
5. Bölüm başlıkları sırayla numaralı mı?

## 6. Renk sistemi

Üç renk ailesi, üç rol:

| Aile | Rolü | Nerede? | Hedef pay |
|---|---|---|---|
| Nötr yüzeyler | Zemin | Açık bant, tonlu bant, kart | Yaklaşık yüzde 60 |
| Lacivert (`--a-50` ile `--a-950`) | Güven rengi, vurgu ailesi | Koyu bantlar, güçlü düğme, bağlantı, piktogram, alt bölüm | Yaklaşık yüzde 35 |
| Turuncu (`--brand`) | Marka rengi, yalnız vurgu | Ana eylem düğmesi, arama düğmesi, sepet sayacı, başlık vurgusu | En çok yüzde 5 |

- Lacivert, turuncunun renk çemberindeki karşıtından türetildi. Turuncunun açısı 32 derece, lacivert ailesinin açısı 212 derecedir.
- Lacivert daha çok alan kaplar. Turuncu az kullanıldığı için göz önce onu görür. Baskın görünen renk yine turuncudur.
- Yeşil yalnız doğrulama ve tamamlanma anlamı taşır. Kırmızı yalnız hata anlamı taşır.
- Renk tek başına anlam taşımaz. Her durum piktogram ve metinle birlikte gösterilir.
- Saf siyah kullanılmaz. En koyu yüzey lacivertin en koyu tonudur.

**Düğmeler:**

| Tür | Renk | Ne zaman? | Örnek |
|---|---|---|---|
| Ana eylem | Turuncu | Kullanıcıyı ilerleten eylem. Bir bileşende en çok bir tane. | Karşılamadaki Arayın düğmesi, Teklif isteği oluşturun, Satıcı başvurusu yapın |
| Güçlü eylem | Lacivert | Bağlayıcı adım ve bileşenin önemli ikinci eylemi | Sepete ekleyin, Mağazaya gidin, üst bölümdeki Arayın düğmesi |
| Koyu zeminde ikincil | Beyaz | Koyu banttaki ikinci eylem | Kapanış çağrısındaki Teklif isteyin |
| Bağlantı | Altı çizili lacivert metin | Başka sayfaya götüren ikincil yol | Ticaret güvencesini inceleyin |

Bir bileşende en çok bir turuncu düğme durur. Üst bölüm ve alt bölüm de birer bileşendir. Bu yüzden üst bölümdeki arama düğmesi laciverttir.

`kapi.mjs` turuncuyu izinli yerlerin dışında reddeder. Kapı rengin tonunu ölçer. Bu yüzden turuncuya yakın bir renk kodunu da reddeder.

`tarayici-testi.mjs` üç şeyi ekrandan ölçer:

1. Turuncunun ilk ekrandaki payı yüzde 5'in altında mı?
2. Her bileşende en çok bir turuncu düğme mi var?
3. İzinli öğelerin dışında turuncu bir öğe var mı?

## 7. Yazı tipi: Ubuntu

Kullanıcının kararıyla bu projenin yazı tipi Ubuntu'dur.

- Ubuntu ailesinde dört kalınlık vardır: 300, 400, 500 ve 700.
- Ara bir kalınlık yazılmaz. Örneğin 600 yazılırsa tarayıcı onu sessizce 700 yapar.
- Kalınlıklar tokendır: `--w-light`, `--w-regular`, `--w-medium` ve `--w-bold`.
- Başlıklar 700, etiketler 500, gövde 400 kalınlıktadır. Büyük açıklama metni 300 kalınlıktadır.
- En küçük metin 14 CSS pikseldir. Metin, dar ekrana sığsın diye küçültülmez.

`kapi.mjs` ara kalınlığı ve başka bir yazı tipini reddeder. `tarayici-testi.mjs` ekrandaki kalınlıkları ölçer.

## 8. Güven dili

### 8.1 Ana sayfadaki güven öğeleri

- **Gerekçeler.** Altı gerekçe, her biri piktogram, "çünkü" etiketi, başlık ve kaynaklı cümle.
- **Çift taraflı doğrulama.** Alıcı kimliğini doğrular (KYC). Satıcının işletmesi doğrulanır (KYB). İkisi de sayfada adıyla yazar.
- **Doğrulama rozeti.** Yeşil onay simgesi ve metin birlikte durur. Ürün kartında, üretici kartında ve örnek siparişte bulunur.
- **Açık koşul.** Her ürün kartında beş koşul yazar. Bunlar fiyat, KDV hariç fiyat, en az adet, en az tutar ve hazırlık süresidir.
- **Ödeme güvenliği.** Sayfa şunu açıkça yazar: "Yalnız sipariş sayfanızda gösterilen hesaba ödeme yaparsınız."
- **Gerçek ve tarihli sayılar.** Ürün, kategori ve mağaza sayıları canlı veriden gelir. Sayıların altında verinin alındığı gün yazar.
- **Ölü bağlantı yok.** Sayfadaki her canlı adresin açıldığı denetlenir. Ayrıntı 15. bölümdedir.
- **Kaynaklı cümle.** Canlı site hakkındaki her cümle kanıt defterinde durur.
- **Sınıfı bilinen metin.** Sayfada görünen, en az iki kelimeli her metnin sınıfı bilinir. Sınıfı bilinmeyen metin sayfaya giremez.
- **Hitap.** Sayfa okura "siz" diye seslenir. Düğme etiketleri de bu biçimdedir.

### 8.2 Süreçler ve güven işaretleri

Sipariş süreci bölümü beş adımı anlatır. Her adımın yanında o adımın güven işareti durur.

| Adım | Süreç | Güven işareti | Kaynak |
|---|---|---|---|
| 01 | Hesap açma ve kimlik doğrulaması | Kimlik doğrulaması (KYC), belge yükleme | Kimlik doğrulama sayfası |
| 02 | Sipariş verme | Sipariş koşullarında anlaşma | Ticaret güvencesi sayfası |
| 03 | Ödeme yapma | Sipariş sayfasındaki hesap, dekont yükleme | Ödeme seçenekleri sayfası |
| 04 | Sipariş kaydı | Sipariş takibi | Ticaret güvencesi sayfası |
| 05 | Destek | İade talebi | Ticaret güvencesi sayfası |

Ödeme iki yolla yapılır. Alıcı ödemeyi doğrudan satıcıya yapar. Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a öder. iStoc ödemeyi tutmaz ve ödemeye aracılık etmez.

### 8.3 Güvenli eylem kalıbı

Kullanıcıyı bir adıma bağlayan düğme, altındaki güvence satırıyla tek bir gruptur (`.secure`). Satır, düğmeye basınca ne olacağını ve ne olmayacağını söyler.

- Düğme metni fiille biter ve sonucu söyler: "Devam" yerine "Teklif isteği oluşturun".
- Kilit piktogramı yalnız gerçek ödeme ve belge adımında kullanılır. Ana sayfada kilit yoktur. Kilit her yere konursa anlamını yitirir.
- Sahte başarı gösterilmez. Teklif formu bu öneride veri göndermez. Form bunu gönderimden sonra açıkça yazar.
- Sepet bu öneride canlı siteye bağlı değildir. Sipariş özeti çubuğu ve sesli duyuru bunu açıkça söyler.
- Dil seçimi bu öneride sayfayı çevirmez. Seçeneklerin altında bu yazar.
- Para birimi seçimi gerçektir. Sayfadaki fiyatlar seçilen para birimine döner.

### 8.4 Sonraki sayfalar için süreç kuralları

Bu sayfalar bu görevin kapsamında değildir. Kurallar, o sayfalar tasarlanırken aynı güven dilini sürdürmek içindir.

| Süreç | Güven veren tasarım kararı |
|---|---|
| Sipariş ver, satın al | Sipariş özeti düğmenin hemen üstünde durur. Bilinmeyen maliyet gizlenmez, "satıcıyla belirlenir" yazılır. Düğmenin altında sonraki adım yazar. |
| Ödeme yap | Ödeme alanları ayrı bir yüzeyde ve kilit başlığıyla durur. Düğmede tutar yazar. Ödemeyi kimin aldığı ve hesabın nerede göründüğü söylenir. |
| Belge yükle | Hangi belgenin neden istendiği yüklemeden önce yazar. Her belgenin durumu ayrı satırda, piktogram ve metinle gösterilir. Reddedilen belgede neden ve sonraki adım yazar. |
| Kimlik ve işletme doğrulaması (KYC, KYB) | Önce değer gösterilir, sonra belge istenir. Adım sayısı, sıradaki adım ve tahmini süre baştan yazılır. Süreç yarıda bırakılıp sürdürülebilir. |
| Abonelik paketi satın al | Fiyatın dönemi, vergi durumu ve iptal koşulu düğmenin yanında yazar. Deneme süresi bitince ne olacağı söylenir. |

### 8.5 Renk ve simge dışında güveni kuranlar

1. **Sürpriz maliyet olmaz.** KDV, en az sipariş adedi ve en az sipariş tutarı baştan görünür.
2. **Sonra ne olacağı bellidir.** Her bağlayıcı adımın altında sonraki adım yazar.
3. **Durum hep görünür.** Siparişin, ödemenin ve doğrulamanın durumu tarihle birlikte yazar.
4. **Karşıdaki gerçek bir işletmedir.** Mağazada doğrulama, kuruluş yılı ve şehir yazar.
5. **Sorun anında muhatap vardır.** Hata mesajı nedeni ve çözümü söyler. Her süreçte desteğe giden bir yol bulunur.
6. **Veri gerektiği kadar istenir.** Bilgi, gerektiği adımda ve nedeniyle birlikte istenir.
7. **Söylenen her şey doğrudur.** Sahte sayaç, sahte stok uyarısı ve uydurma yorum kullanılmaz.
8. **Arayüz tutarlı ve hızlıdır.** Aynı öğe her yerde aynı görünür ve aynı işi yapar.

## 9. Piktogram sistemi

Setin tamamı `piktogramlar.svg` dosyasındadır: 57 piktogram, 9 grup. Kaynağı `piktogram.py` dosyasıdır.

- **Her zaman etiketli.** Piktogram metnin yerine geçmez, metni hızlandırır.
- **Bir kavram, bir piktogram.** Doğrulama her yerde kalkandır. Kilit yalnız güvenli adım demektir.
- **Tek ızgara, tek çizgi.** 24 birimlik ızgara, 1,75 birimlik çizgi, yuvarlak uç. İkinci ton aynı rengin yüzde 16 dolgusudur.
- **Zeminli kutu.** Piktogram açık mavi bir kutuda durur. Kutu, piktogramın yerini ve boyutunu her yerde aynı tutar.
- **Turuncu piktogram yok.** Piktogramlar lacivert çizilir. Doğrulama piktogramı yeşil zeminde durur.
- **Okuyucudan gizli.** Anlamı yanındaki metin taşıdığı için piktogram ekran okuyucuya okutulmaz.
- **Hareket.** Piktogram, bulunduğu bölüm ekrana girince çizilerek tamamlanır.

Bu sürümde iki grup eklendi:

- **Ödeme yöntemleri.** Kart, dijital cüzdan, banka, çek ve senet, taksit, tek ödeme.
- **Dizin ve içerik türleri.** Malzeme, kullanım yeri, özellik, görünüm, iki özellik, liste, rehber, soru, dizin, kural, araç.

**Marka logosu kullanılmaz.** Ödeme yöntemi kutusunda kart ağının ya da ödeme şirketinin logosu yoktur. Piktogram yöntemin türünü gösterir, ad yazıyla durur. Logolar marka sahiplerinindir ve kullanım kuralları vardır. Canlı sitede logo kullanılacaksa resmi görseller marka kurallarına göre eklenir.

Bu set kullanıcılarla sınanmadı. Ayrıntı `ARASTIRMA.md` dosyasının beşinci bölümündedir.

## 10. Üst ve alt bölüm

**Üst bölüm üç katmandır.** Her katmanın tek bir işi vardır.

| Katman | İçerik | Ne zaman görünür? |
|---|---|---|
| Yardımcı şerit | Solda dil ve para birimi ile doğrulanmış mağaza sayısı. Sağda Satıcı Merkezi, sipariş takibi, ticaret güvencesi ve Yardım Merkezi. | Yalnız geniş ekranda |
| Ana satır | Logo, arama, mesajlar, sepet, giriş, **Teklif isteyin**, konum çubuğu | Her zaman. Ekranın üstünde sabit kalır, yatay telefonda sabit kalmaz. |
| Gezinme satırı | Kategori menüsü, bölüm bağlantıları, satıcı bağlantısı | Sayfanın başında. Dar ekranda iki satırdır. |

**Kategori menüsü** canlı kategori ağacından üretilir. Ürünü en çok olan 10 üst kategoriyi ve her birinin alt menü öğelerini içerir.

- Düğmeyle açılır. Üzerine gelmekle açılmaz, çünkü dokunmatik ekranda üzerine gelme yoktur.
- Geniş ekranda iki bölmedir. Dar ekranda akordeondur.
- Escape tuşu menüyü kapatır ve odağı düğmeye geri verir.
- Menünün altında teklif isteği kısa yolu durur. Aradığını bulamayan okur huniden çıkmaz.
- JavaScript kapalıysa düğmenin yerinde sayfadaki kategori bölümüne giden bir bağlantı görünür.

**Üst arama** yalnız ürün arar. Etiketi de "Ürün arayın" der. Üretici araması karşılamadaki sekmededir.

**Alt bölüm beş katmandır.**

| Katman | İçerik |
|---|---|
| 1. Marka ve tercihler | Logo, tanım, sosyal hesaplar. Dil ve para birimi kutuları. |
| 2. Kişiye göre bağlantılar | Alıcılar için, Satıcılar için, Destek |
| 3. İçerik türüne göre bağlantılar | Rehberler, Soru ve yanıt, Listeler, Dizinler, Kurallar ve sözleşmeler, Araçlar |
| 4. Ödeme yöntemleri | Altı yöntem, her biri piktogramı ve adıyla |
| 5. Yasal satır | Şirket adı, kullanım koşulları, gizlilik, çerez tercihleri, başa dönüş |

- **Dil ve para birimi kutuları** görseldir. Her seçenek bir kutudur: kısaltma ya da simge, ad ve seçili işareti.
- Her grup bir radyo grubudur. Ok tuşları seçimi ve odağı birlikte taşır.
- Para birimi seçimi sayfadaki bütün fiyatları değiştirir. Tutarlar dört para biriminde hazır durur.
- Canlı sitede fiyat Türk lirasıdır. `build.py` diğer tutarları canlı sitenin kuruyla çevirir. Sayfa bunu yazar.
- Toplam, yuvarlanmamış birim tutardan hesaplanır. Bu yüzden karttaki en az sipariş tutarı, sepetin toplamıyla aynıdır.
- Kutu iki satırdır: üstte kısaltma ile seçili işareti, altta ad durur. Böylece 320 piksel genişlikte de ad işarete değmez.
- Kutular JavaScript ile çalışır. JavaScript yoksa kutular görünmez. Yerine fiyatların ABD doları olarak gösterildiğini söyleyen cümle görünür.
- Dar ekranda bağlantı sütunları katlanan gruplara döner. Katlanan grubun yapısı 11.2 bölümündedir.

**İçerik türüne göre katman** günlük yazısı dışındaki içerik türlerini düzenler. Ayrıntı 11.3 bölümündedir.

**Hedef boyutu.** Dokunma hedefi en az 44 pikseldir. Sıkı yoğunluk yalnız fareyle kullanılan geniş ekranda geçerlidir. Ölçüt ekran genişliği değil, işaretçidir.

**Klavye odağı.** Çevreleyen halka yoktur. Odaklanan öğenin dolgusu ters döner ve metninin altı çizilir. Zaten dolgulu olan düğme kendi odak dolgusunu bildirir. Odak dolgusu, öğenin durağan dolgusundan en az 3:1 karşıtlıkla ayrılır. Metin alanında dolgu değişmez, yazının altında düz bir çizgi belirir. JavaScript yoksa da odak görünür.

**Görünen etiket erişilebilir adın içindedir.** Ekran okuyucunun okuduğu ad, ekranda yazan etiketle başlar. Örneğin sepet düğmesinin adı "12 adet ekleyin: Ürünün adı" olur. Sesle komut veren kullanıcı ekranda gördüğü etiketi söyler ve düğme bulunur. Tarayıcı testi bunu bütün adlandırılmış denetimlerde ölçer.

Kendi kutusu olan simge odakta da kendi renklerini korur. Örneğin sık sorulanlardaki artı simgesi ve alt gezinmedeki teklif simgesi böyledir. Tarayıcı testi odaktaki simgenin zemininden en az 3:1 karşıtlıkla ayrıldığını ölçer.

**Zorlanmış renkler.** Windows yüksek karşıtlık gibi modlarda tarayıcı sayfanın renklerini sistem renkleriyle değiştirir. Bu modda odak, klavye modunda çerçeveyle gösterilir. Çevreleyen çerçevenin izinli olduğu tek durum budur. Seçili süzgeç, seçili sekme ve seçili seçenek sistemin seçim rengini alır. Yalnız dolgudan oluşan çubuklar da bu renkle çizilir.

Tarayıcı bu modda her yazının arkasına sayfa zemini renginde bir levha çizer. Seçili öğede o levha yazıyı örterdi. Bu yüzden seçili öğenin renklerini tarayıcı değil sayfa belirler. Sayfa bunu yalnız sistem renkleriyle yapar, böylece kullanıcının renk düzeni korunur.

**Büyütülen yazı.** Kullanıcı tarayıcıda yazıyı büyütebilir. O durumda gövde metni büyür. Bazı yerleşim sınırları yazı boyutuna bağlıdır (em birimi). Örneğin yazı büyüyünce kategori kutusunda piktogram üste geçer, ödeme yöntemleri tek sütuna iner.

- **Alt gezinme.** Büyük yazıda beş etiket dar ekrana sığmaz. O zaman bulunulan sayfanın öğesi gizlenir, çünkü okur zaten o sayfadadır. Kalan dört etiket kullanıcının seçtiği boyutta durur. Çubuğun yan payı kalkar, böylece etiketler birbirine değmez. Tarayıcı testi etiketin küçülmediğini ve etiketler arasında boşluk kaldığını ölçer.
- **Büyük başlıklar.** Büyük başlık ekran genişliğiyle de sınırlanır. Sınır olmasaydı uzun bir kelime dar ekranda satırdan taşardı. Başlık yine de gövde metninden küçük olmaz. Bu bir uzlaşmadır, karar 17. bölümdedir.

**Yatay telefon.** Ekranın yüksekliği 480 pikselin altındaysa sabit çubuklar incelir. Alt gezinmede simge ile etiket yan yana durur. Sepet çubuğu tek satıra iner.

## 11. Dizin: programatik arama motoru stratejileri

Programatik strateji şudur: bir veri boyutundaki her değer için bir sayfa üretilir. Bu görevde sayfa üretilmez. Her strateji ana sayfada bir menü grubudur. Her öğe canlı sitede çalışan bir adrese gider.

### 11.1 Dokuz strateji

Hiçbir strateji konuma bağlı değildir. Hiçbiri günlük yazısına dayanmaz.

| Strateji | Veri boyutu | Örnek öğe | Canlı adres |
|---|---|---|---|
| Ürün grubuna göre | Kategori ağacı | Saklama Kabı | `/kategori/<adres>` |
| Malzemeye göre | Ürünün malzemesi | Plastik ürünler | `/urunler?q=plastik` |
| Kullanım yerine göre | Ürünün kullanıldığı yer | Otel ürünleri | `/urunler?q=otel` |
| Özelliğe göre | Ürünü ayıran özellik | Kilitli ürünler | `/urunler?q=kilitli` |
| Görünüme göre | Desen ve görünüm | Rattan görünümlü ürünler | `/urunler?q=rattan görünümlü` |
| Takıma ve pakete göre | Paketteki parça sayısı | 3'lü paketler | `/urunler?q=3'lü` |
| Özellik ve ürüne göre | İki boyutun çarpımı | Plastik saklama kabı | `/urunler?q=plastik saklama kabı` |
| Üreticiye ve markaya göre | Mağaza ve marka kaydı | Urve Plastik | `/magaza/<adres>`, `/marka/<adres>` |
| Listeye ve sipariş adedine göre | Hazır liste, en az sipariş adedi | En az 100 adetle satılanlar | `/cok-satanlar`, `/urunler?min_order=100` |

### 11.2 Kurallar

- **Sayısı olan öğenin yanında canlı sonuç sayısı yazar.** `veri.py` sayıyı canlı siteden alır. Hazır listelerin (çok satanlar, fırsatlar, yeni ürünler) sayısı yoktur. Onların yanında ok durur.
- **Boş öğe sayfaya girmez.** Sonucu 5'in altında kalan öğe atılır. Bir grupta 3 öğe kalmazsa sayfa üretilmez.
- **Çubuk yalnız orandır.** Çubuk, sayının gruptaki en büyük sayıya oranını gösterir. Sayı yazıyla da durur.
- **Arama sonucu bulanıktır.** Canlı sitenin araması kelimeyi geniş eşler. Bu yüzden belirsiz kelimeler seçilmedi. Örneğin "cam" kelimesi cam sileceğini de getirir.
- **Dar ekranda gruplar katlanır.** İlk grup açık başlar. Diğer gruplar başlığına dokununca açılır.
- **Katlanan grubun başlığı dar ekranda ve kısa ekranda bir düğmedir.** Düğme grubun açık olup olmadığını bildirir. Grup açılırken yüksekliği yumuşak değişir. Yatay telefon kısa bir ekrandır. Bu yüzden telefon yatay çevrilince de gruplar katlanır kalır.
- **Kapanan grubun içi hemen gizlenir.** Yükseklik bir süre daha azalarak kapanır, ama bölümün içine o sürede de odak giremez. Ekran okuyucu da kapalı bölümü okumaz.
- **Başlığın metni sayfada bir kez yazılıdır.** Düğme metni betikle kopyalar. Böylece arama motoru ve okuma modu başlığı bir kez okur.
- **Geniş ekranda başlık düz yazıdır.** Grup hep açıktır. Ekranda işe yaramayan bir düğme durmaz. Kâğıtta ve JavaScript yokken de grup açıktır.
- **Açılan grup yerinde kalır.** Kullanıcının açtığı grup, ekran dönüp yeniden daralınca da açık kalır. Odak kaybolmaz. Örneğin odak düğmedeyken ekran genişlerse odak grubun ilk bağlantısına geçer.
- **Gruplar bölüm başlığı taşır.** Her grubun adı bir başlıktır. Arama motoru grubu konusuyla birlikte okur.

### 11.3 Günlük yazısı dışındaki içerik türleri

Alt bölümün üçüncü katmanı içeriği türüne göre düzenler. Her öğe canlı sitede var olan bir sayfaya gider.

| İçerik türü | Ne işe yarar? | Canlı sitedeki örnekleri |
|---|---|---|
| Rehber | Bir süreci adım adım anlatır. | Ticaret güvencesi, ödeme seçenekleri, kargo ve teslimat |
| Soru ve yanıt | Tek bir soruyu yanıtlar. | Sık sorulan sorular, yardım makaleleri |
| Liste | Ürünleri bir ölçüte göre sıralar. | Çok satanlar, haftanın fırsatları, yeni ürünler |
| Dizin | Kayıtları toplu gösterir. | Kategori dizini, üretici dizini, ürün dizini |
| Kural ve sözleşme | Tarafların uyacağı koşulu yazar. | Ürün listeleme kuralları, iade koşulları |
| Araç | Okurun bir işini gördürür. | Teklif isteği formu, kimlik doğrulaması |

**Planlanan içerik türleri.** Altı türün canlı sitede karşılığı yoktur, bunlar öneridir. Türler şunlardır: sözlük, hesaplayıcılar, şablonlar, karşılaştırmalar, sektör verileri ve kontrol listeleri. Bunlar yalnız önizleme derlemesinde görünür. Bağlantı değildir, çünkü hedefleri yoktur.

### 11.4 Sayfa üretimi için yol haritası

Bu tablo bir öneridir. Sayfalar üretilirse her strateji kendi kalıcı adresini alır.

| Strateji | Önerilen adres kalıbı | Sayfanın dayanağı |
|---|---|---|
| Malzeme, kullanım yeri, özellik | `/toptan/<kelime>` | Arama sonucu, sonuç sayısı, doğrulanmış üretici sayısı |
| Özellik ve ürün | `/toptan/<özellik>-<ürün>` | İki boyutun kesişimi. En az 5 ürün varsa üretilir. |
| Sipariş adedi | `/toptan/en-az-<adet>-adet` | En az sipariş adedi süzgeci |
| Sözlük | `/sozluk/<terim>` | Terimin tanımı ve ilgili ürünler |
| Karşılaştırma | `/karsilastir/<a>-ve-<b>` | İki ürün grubunun fiyat ve en az adet aralığı |

Her üretilen sayfa üç koşulu sağlamalıdır. Sayfada gerçek ürün bulunmalıdır. Sayfanın başlığı aramayla aynı kelimeyi taşımalıdır. Boş sayfa dizine kapatılmalıdır.

## 12. Gösterge kuralı: yapı durağan halde anlaşılır

**Kural.** Sayfanın yapısı, fare üzerine gelmeden çekilmiş durağan bir ekran görüntüsünde anlaşılmalıdır. Üzerine gelme yalnız onay verir, bilgi taşımaz. Dokunmatik ekranda üzerine gelme hiç yoktur.

| Soru | Gösterge | Bu sayfadaki uygulama |
|---|---|---|
| Burası kayıyor mu? | Kenar solması, ok düğmesi, konum çubuğu | Kaydırma şeridi sistemi (`[data-scroller]`) |
| Burası nerede bitiyor? | Zemin farkı, sıra numarası, ayırıcı çizgi | Bant zeminleri, numaralı bölüm başlıkları, kart yüzeyleri |
| Buna tıklanır mı? | Alt çizgi, düğme biçimi, ok, etiket | Altı çizili bağlantılar, altı çizili dizin öğeleri, etiketli simgeler |
| Şu an hangi durumda? | Dolgu, işaret, soluk simge | Seçili süzgeç, seçili para birimi, sepetteki ürün |

Ters yöndeki hata da aynı kuralın parçasıdır: tıklanamayan öğe tıklanabilir görünmemelidir.

- Ödeme yöntemleri kutu içinde durmaz, düz satırdır. Koyu zeminde dolgulu kutu yalnız tıklanan öğededir.
- Gerekçe kartları ve ödeme yöntemleri üzerine gelince değişmez. Tarayıcı testi bunu ölçer.
- Planlanan içerik türleri alt çizgisizdir, çünkü bağlantı değildir.

Gösterge gözle seçilmelidir. Liste bağlantısının alt çizgisi zemine karşı en az 3:1 karşıtlık taşır.

## 13. Hareket ve etkileşim

Tüm geçişler tek eğriyi kullanır: `cubic-bezier(0.65, 0, 0.35, 1)`. Süreler, sıralama gecikmesi ve bekleme süresi tokendır.

Hareketin üç kaynağı vardır: sayfanın açılışı, kaydırma ve işaretçi. Kendi kendine dönen hareket yoktur. Böylece hareket okuru yormaz ve durdurma düğmesi gerekmez.

| Kaynak | Hareket | Nerede? | Ne anlatır? |
|---|---|---|---|
| Açılış | Sıralı açılış | Karşılama | Başlık, açıklama, arama ve teklif kutusu okuma sırasıyla gelir |
| Açılış | Çizilen çizgi ve geçen nokta | Kanıt satırı | Sayıların tek bir hat üzerinde durduğunu gösterir |
| Açılış | Sayaç | Karşılama sayıları | Sayılara dikkat çeker |
| Açılış | Dönen örnek arama | Arama alanı | Ne aranabileceğini gösterir. Dokununca durur. |
| Kaydırma | Konum çubuğu | Üst bölüm | Sayfanın ne kadarının geçildiğini gösterir |
| Kaydırma | Beliren öğeler | Tüm bölümler | İçerik, ekrana girdikçe sırayla gelir |
| Kaydırma | Çizilen piktogram ve çizgi | Gerekçeler, bölüm başlıkları | Bölümün başladığını gösterir |
| Kaydırma | Uzayan çubuk | Dizin | Sonuç sayısının oranını gösterir |
| Kaydırma | Dolan adım çizgisi | Sipariş süreci | Kaydırdıkça ilerleme gösterir |
| Kaydırma | Kayan ızgara | Koyu bantlar | Zemine derinlik verir |
| İşaretçi | İşaretçi ışığı | Koyu bantlar, alt bölüm | Işık işaretçiyi izler ve altındaki ızgarayı aydınlatır |
| İşaretçi | Kart ışığı | Ürün, üretici ve kategori kartları | İşaretçinin hangi kartta olduğunu gösterir. Kart oynamaz. Tıklanmayan kartta ışık yoktur. |
| Dokunuş | Kayan gösterge, açılan menü, kayan kartlar | Sekmeler, menü, süzgeç | Durumun değiştiğini gösterir |
| Dokunuş | Akan toplam | Örnek sipariş, sipariş özeti | Adet değişince toplam akarak değişir. Para birimi değişince toplam geçişsiz yazılır. |
| Dokunuş | Açılan grup | Dizin ve alt bölüm | Grubun yüksekliği yumuşak değişir |

Durum (değer, ARIA, odak) her zaman anında güncellenir. Yalnız görsel sunum yumuşak geçer. Üzerine gelince hiçbir kutu yerinden oynamaz.

**Işık ve ızgara sayfayı yormaz.** Işığın yeri bandın bütününe değil, ışık katmanına yazılır. Böylece her karede yalnız bu katman yeniden boyanır. Işık dönüşümle (transform) yer değiştirir ve yerleşimi etkilemez. Kaydırmaya bağlı bütün işler tek bir karede çalışır: önce hepsi ölçer, sonra hepsi yazar.

**Işık metni soldurmaz.** Işığın saydamlığı en çok 0,24'tür. Bu değerde koyu bandın en soluk metni de 4,5:1 karşıtlığı korur. Tarayıcı testi karşıtlığı ışığın en parlak yerine göre ölçer. Sipariş adımlarının metni her zaman tam görünür. Önceki sürümde geçilmemiş adım soluk başlıyordu ve ışığın altında okunmuyordu.

Hareket azaltma tercihi açıksa geçişler kapanır ve ışık sabit durur. Tercih sayfa açıkken değişirse ızgara da durur. Dokunmatik ekranda ışık sabit durur. Kâğıtta hareket yoktur.

**Lottie kullanılmadı.** Hareketli çizimler SVG ve CSS ile yapıldı. Bunun üç nedeni var:

1. Lottie dosyası kendi eğrisini taşır. Bu proje tek eğri kullanır ve `kapi.mjs` başka eğriyi reddeder.
2. Lottie oynatıcısı sayfaya ek bir betik yükler. SVG ve CSS ek yük getirmez.
3. SVG çizimi renk tokenlarını kullanır. Renk değişince çizim de değişir.

Lottie istenirse aynı sahneler Lottie biçimine aktarılabilir. O durumda oynatıcı eklenir ve kapıya Lottie eğrisi denetimi yazılır.

## 14. Ana sayfanın arama motoru hazırlığı

- Tek bir `h1` var. İçinde "Global B2B toptan pazaryeri" tanımı da durur.
- Başlık düzeyleri sıralıdır. Dizin gruplarının adları da başlıktır.
- Başlık, açıklama, kalıcı adres ve paylaşım etiketleri var.
- Sayfada dört yapısal veri vardır: kuruluş, site içi arama, ürün listesi ve sık sorulanlar. Yapısal verideki soru ve yanıtlar sayfadaki metnin aynısıdır. `build.py` bunu denetler.
- Bölgenin adı başlığın içindedir. Örneğin ürünler bölümünün başlığı ekran okuyucuda "Ürünler: Fiyatı sormayın. Kartta yazıyor." diye okunur.
- Kategori bağlantıları canlı sitenin site haritasındaki adresi kullanır: `/kategori/<adres>`.
- Dizin 54, alt bölüm 36 canlı site bağlantısı taşır. Her birinin hedefi denetlenmiştir.
- Dil bağlantısı canlı sitedeki gibi yalnız Türkçe için bildirilir.
- Önizleme derlemesi `noindex` taşır, çünkü bir tasarım önerisi dizine girmemelidir.
- Yayın derlemesi `python3 build.py --yayin` komutuyla üretilir. Yayın derlemesi dizine açıktır.

## 15. Veri kaynağı ve kanıt defteri

Kural şudur: sayfadaki her sayı ve her olgu `data` klasöründen gelir. `build.py` içinde olgu yazmaz.

- `veri.py` olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar. Verinin alındığı günü de yazar.
- `secim.py` seçimi ve metin sınıflarını tutar.
- `build.py` bu iki kaynağı birleştirir. Ağa çıkmaz.

12 Kasım 2026 günü alınan veri şunları söylüyor:

- 2.412 ürün, 52 üst kategori ve 751 alt kategori var.
- 19 mağaza var. 18 mağazanın işletme doğrulaması tamamlandı.
- Para birimleri GBP, USD, EUR ve TRY'dir. Kur da aynı veriden gelir.
- Seçilen 8 ürünün fiyatı, en az sipariş adedi, hazırlık süresi ve üreticisi ürün ayrıntısından geldi.
- Dizindeki 45 aramanın sonuç sayısı canlı siteden alındı.

**Veri dosyaları tek koşudan gelir.** `veri.py` dosyaları önce geçici adla yazar, sonra yerine koyar. En son koşunun özetini yazar (`data/kosu.json`). Özet her dosyanın parmak izini taşır. Bir dosya sonradan değiştiyse ya da yazma yarıda kaldıysa `build.py` sayfayı üretmez.

**Fiyat varsayımı denetlenir.** Sayfa, ürün ayrıntısındaki fiyatı Türk lirası ve KDV hariç sayar. `veri.py` bunu her ürün için canlı sitenin liste kaydıyla karşılaştırır. Liste kaydındaki KDV dahil fiyat, KDV hariç fiyat ile KDV oranının çarpımına eşit olmalıdır. Eşit değilse betik durur.

**Mağaza listesi eksiksiz alınır.** Liste tek sayfada istenir. Gelen mağaza sayısı toplamla aynı değilse betik durur. Böylece doğrulanmış mağaza sayısı eksik çıkmaz.

### 15.1 Kanıt defteri

Canlı site hakkındaki her cümle `data/kaynaklar.json` dosyasındadır. Defterde 77 cümle var.

- Her cümlenin yanında kaynağın adresi, aranan ifade ve ifadenin bulunduğu yer yazar.
- `veri.py` her ifadeyi kaynağında arar. Bir ifadeyi bulamazsa durur ve hiçbir dosyayı yazmaz.
- `build.py` her cümlenin sayfada birebir geçtiğini denetler. `kapi.mjs` aynı denetimi üretilen sayfada yineler.

**Bu sürümde kanıt kuralı sıkılaştı.** Canlı sitenin bazı sayfaları tarayıcıda kurulur. Bu sayfaların metni sitenin dil paketinde durur. Dil paketinde hiçbir sayfanın göstermediği metin de vardır. Önceki sürüm, dil paketindeki her metni kanıt sayıyordu.

Yeni kural şudur. Sayfanın kodu bir metnin anahtarını adıyla çağırıyorsa o metin kanıt sayılır. Çağırmıyorsa sayılmaz. Örneğin satıcı sayfasının kodu `sellPage.feeNote` anahtarını çağırır. O anahtarın metni kanıttır.

Bu kural dört cümleyi eledi. O cümlelerin kanıtı dil paketindeydi, ama hiçbir sayfa onları çağırmıyordu. Cümleler sayfadan çıkarıldı ya da başka bir kaynağa bağlandı.

Kanıtın arandığı yerlerin sırası da kuraldır. Önce sayfanın çağırdığı dil anahtarına bakılır. Sonra sayfanın görünen metnine bakılır. En son sayfanın koduna bakılır. Kodda bulunan ifade ya yapısal veridir (`name:"Türkçe"` gibi) ya da en az üç kelimedir. Tek kelime kodda kanıt sayılmaz, çünkü o kelime bir denetim dalında da geçebilir. Örneğin "Bireysel" kelimesi artık kimlik sayfasının çağırdığı `kycUi.individual` anahtarında bulunur.

Sunucunun gönderdiği sayfalarda yorum satırları artık kanıt sayılmaz. Yalnız görünen metin aranır.

Tek kelimelik adlar da kaynaklıdır. Ödeme yöntemi, para birimi ve dil adlarının her biri kanıt defterindedir. `build.py` bunu ayrıca denetler, çünkü tek kelimelik metin metin sınıflarının dışında kalır.

| Kaynak | Hangi cümleler? |
|---|---|
| Ticaret güvencesi sayfası | Ödeme yolu, sipariş kaydı, destek, iade, teslimat, PayPal |
| Ödeme seçenekleri sayfası | Hesap güvenliği, dekont, ödeme yöntemleri, para birimi adları |
| Satıcı sayfası | Komisyon, başvuru süresi, onay süresi, aracısız buluşma |
| Üreticiler sayfası | Teklif isteği sözü, ücretsiz kayıt, satıcı doğrulaması |
| Kimlik doğrulama sayfası | Satın almadan önceki kimlik doğrulaması, belge yükleme, inceleme süresi |
| Sepet sayfası | En az sipariş adedi uyarısı |
| Ana sayfa | Diller, sitenin tanımı, şirket adı, alt bölümdeki bölüm adları (Canlı destek, Haftanın fırsatları, Alıcı Koruma Programı) |
| Paket verisi (açık uç) | Hiçbir pakette komisyon yok. Doğrulama rozeti üç paketin üçünde var. |

### 15.2 Metin sınıfları

`metin.py` sayfada görünen, en az iki kelimeli her metni çıkarır. Her metnin sınıfı bilinmelidir:

| Sınıf | Ne demek? | Sayfadaki sayısı |
|---|---|---|
| Kaynak | Canlı sitedeki bir sayfaya dayanan cümle. Kanıt defterinde durur. Eşleşme birebirdir. | 71 |
| Veri | Sayısı ya da dayanağı `data` klasöründen gelen metin. | 34 |
| Tasarım | Bu sayfanın kendi sözü: değer önerisi, başlık, soru, yönerge ve öneri notu. | 70 |
| Etiket | Düğme, bağlantı, alan ve bölüm adı. | 134 |
| Görünmeyen metin | Sayfa başlığı, ekran okuyucunun okuduğu adlar, alan içi örnekler ve yalnız ekran okuyucuya okunan metinler. | 31 |

- Şablona yeni bir metin eklenirse ve sınıfı yazılmazsa `build.py` sayfayı üretmez.
- Canlı site hakkında olgu bildiren cümle tasarım sınıfına yazılmaz.
- Ürün, kategori ve mağaza adları veriden gelir. Sayfada işaretlenir ve sınıflandırılmaz.
- `app.js` içindeki kullanıcı metinleri de kayıtlıdır.
- Görünmeyen metinler `secim.py` içindeki `OZNITELIK_METNI` listesinde kayıtlıdır. Kayıtsız bir görünmeyen metin bulunursa sayfa üretilmez.
- Canlı sitedeki bir bölümün adını taşıyan bağlantı etiketi kaynaklıdır. Örneğin "Alıcı Koruma Programı" kanıt defterindedir.

### 15.3 Bağlantı denetimi

Sayfadaki her adres denetlenir: bağlantılar, form hedefleri, paylaşım görseli ve yapısal verideki adresler. Sunucu adı birebir karşılaştırılır. Örneğin "istoc.com.baska.site" adresi istoc.com sayılmaz.

- **Sabit sayfa.** `veri.py` adresi açar. Sayfa açılmalı ve başka bir sayfaya yönlenmemelidir. 34 sayfa bu yolla denetlendi.
- **Karşı denetim.** Var olmayan bir adres açılmamalıdır. Açılsaydı "sayfa açıldı" denetimi hiçbir şey kanıtlamazdı.
- **Kayıt sayfası.** Ürün, mağaza ve marka adresleri canlı sitenin site haritasında bulunmalıdır. Kategori adresleri canlı kategori ağacında bulunmalıdır. Mağaza adresi ayrıca işletmesi doğrulanmış bir mağazaya gitmelidir.
- **Adres kalıbı.** Bağlantıdaki değişken adlarını canlı sayfanın kodu tanımalıdır. Bu adlar `q`, `min_order` ve `sort` değerleridir. Satıcı sayfasının kodu `#paketler` bölümünü de tanımalıdır.
- **Dış adres.** Sosyal hesap adresleri canlı sitenin kodunda geçmelidir. Paylaşım görseli ve logo açılmalıdır.

`build.py` denetlenmemiş bir adres bulursa sayfayı üretmez. `kapi.mjs` aynı denetimi üretilen sayfada yineler. Son derlemede 252 ayrı adres denetlendi. Bunların 243'ü istoc.com adresidir.

Bu denetim adresin var olduğunu gösterir. Giriş isteyen sayfanın girişten sonra ne gösterdiğini göstermez.

**Uygulama kabuğu.** Bazı yolların altında var olmayan adres de açılır. Örneğin `/panel/` altındaki her adres satıcı panelinin kabuğunu açar. `veri.py` her alt yolu ayrı ayrı dener ve bu yolları kaydeder. Bu yoldaki bağlantının denetimi yalnız sunucunun yanıt verdiğini gösterir. Ürün, mağaza, marka ve kategori yolları da böyledir. Bu yüzden onların adresleri açılarak değil, site haritasıyla ve veriyle denetlenir.

### 15.4 Bilinen veri sorunları

- 2.412 ürünün 647'si bir kategoriye bağlıdır. Kalan 1.765 ürün canlı sitede kategorisizdir. Kategori kartlarındaki sayılar bu yüzden küçük görünür.
- Canlı sitede teklif isteği ve kimlik doğrulama sayfaları giriş ister. Giriş yapmayan ziyaretçi giriş sayfasına yönlenir.
- Canlı sitenin araması kelimeyi geniş eşler. Dizindeki sayı, o aramanın sonuç sayısıdır.

## 16. Dosyalar ve doğrulama

| Dosya | İçerik |
|---|---|
| `index.html` | Üretilen ana sayfa |
| `sablon/` | Sayfa iskeleti: baş, üst bölüm, gövde, alt bölüm |
| `build.py` | Veriyi iskelete yerleştirir. Önizleme: `python3 build.py`. Yayın: `python3 build.py --yayin` |
| `veri.py` | Olguları canlı siteden alır. Çalıştırma: `python3 veri.py` |
| `secim.py` | Seçki: ürünler, üreticiler, dizin öğeleri, alt bölüm öğeleri ve metin sınıfları |
| `metin.py` | Sayfadaki metinleri çıkarır ve sınıflandırır |
| `data/` | Canlı siteden alınan veri, kanıt defteri ve alındıkları gün |
| `piktogram.py` | Piktogram seti. Çalıştırma: `python3 piktogram.py` |
| `piktogramlar.svg` | Piktogram başvuru sayfası |
| `styles.css` | Tokenlar ve bileşenler |
| `app.js` | Davranış |
| `kapi.mjs` | Kural kapısı. Çalıştırma: `node kapi.mjs` |
| `tarayici-testi.mjs` | Chromium ve WebKit denetimi. Çalıştırma: `node tarayici-testi.mjs http://localhost:4391/` |
| `--sinama` | Kapı ve test kendini sınar. Bilinen her bozulmanın reddedildiğini gösterir. |
| `goruntu.mjs` | Bölüm bölüm ekran görüntüsü alır |
| `serve.mjs` | Önizleme sunucusu |

### Doğrulama durumu (12 Kasım 2026)

| Denetim | Durum | Not |
|---|---|---|
| Kural kapısı | pass | 663 stil kuralı ve 1 sayfa denetlendi. Önizleme ve yayın derlemesi ayrı ayrı denetlendi. |
| Kapının kendini sınaması | pass | 93 ihlal örneğinin hepsi reddedildi. |
| Chromium (Playwright) | pass | 596 denetimin hepsi geçti. |
| WebKit (Playwright, Safari ailesi) | pass | 572 denetimin hepsi geçti. |
| Büyütülmüş yazı | pass | Yalnız Chromium'da çalışır. Kök yazı boyutu 20 ve 24 piksel, genişlik 320 ve 390 piksel. |
| Zorlanmış renkler | pass | Yalnız Chromium'da çalışır. Klavye çerçevesi, seçili durum ve seçili öğenin yazısı sınandı. |
| Büyütülmüş yazı ve zorlanmış renkler, WebKit | not_run | WebKit bu iki ayarı öykünmez. |
| Testin kendini sınaması | pass | 67 bozulmanın hepsi yakalandı. |
| Kaynak denetimi | pass | 77 kaynaklı cümlenin hepsi canlı sitede bulundu. |
| Bağlantı denetimi | pass | 34 canlı sayfa açıldı. Var olmayan adres açılmadı. Sayfadaki 252 ayrı adres denetlendi. |
| Bağımsız inceleme, 1. tur | pass | 3 zorunlu ve 24 önerilen bulgu bildirdi. Hepsi düzeltildi. |
| Bağımsız inceleme, 2. tur | pass | Düzeltmeleri denetledi. 1 zorunlu, 3 önerilen ve 10 küçük bulgu daha buldu. Hepsi düzeltildi ya da 17. bölümde karara bırakıldı. |
| Son düzeltmelerin bağımsız incelemesi | not_run | İkinci turdan sonraki düzeltmeleri yalnız testler denetledi. |
| Firefox | not_run | Kullanıcının kararıyla çalıştırılmaz. |
| Gerçek Safari, iOS ve Android cihaz | not_run | Öykünme gerçek cihazın yerini tutmaz. |
| Ekran okuyucu | not_run | Sesli okuma denenmedi. |
| Gerçek yazıcı çıktısı | not_run | Yazdırma kuralları yalnız öykünmeyle sınandı. |
| Piktogramların kullanıcıyla sınanması | not_run | Ayrıntı `ARASTIRMA.md` dosyasındadır. |
| Metnin gerçek okurla denenmesi | not_run | Gerçek okurla denenmedi. |

Alt gezinmenin büyük yazıdaki boşluk düzeltmesi tam koşudan sonra yapıldı. Değişen dört büyük yazı denetimi ayrıca çalıştırıldı ve geçti. Son tam koşu sürüyor.

Yerleşim denetimleri dokuz ekran boyutunda çalışır. Dar boyutlar 320, 360, 375 ve 390 piksel genişliktedir. 320 piksel iki ayrı yükseklikte sınanır. Diğer boyutlar yatay telefon, tablet, dizüstü ve masaüstüdür. Dar ekranda kapalı başlayan gruplar açılır ve sayfa bir kez daha ölçülür.

Davranış denetimleri ve klavye turu 320, 390 ve 1440 piksel genişlikte çalışır. Tur, sayfayı Tab tuşuyla baştan sona dolaşır. Yatay telefon 844 x 390 ve 568 x 320 boyutunda ayrıca sınanır. JavaScript kapalı durum ve dokunmatik geniş ekran da ayrıca sınanır.

## 17. Açık konular

1. **Lisans.** Depo herkese açıktır, ama lisansı seçilmedi. Lisansı kullanıcı seçer.
2. **Lottie.** Hareketli çizimler SVG ve CSS ile yapıldı. Gerekçe 13. bölümdedir. Karar kullanıcınındır.
3. **Marka logoları.** Ödeme yöntemlerinde logo yerine piktogram var. Gerekçe 9. bölümdedir.
4. **Yasal bilgiler.** Ticaret unvanı, MERSİS numarası ve KEP adresi değerlerini bilmiyorum. Bu yüzden alt bölüme eklemedim.
5. **Metin onayı.** Değer önerisi ve başlıklar iddialı yazıldı. Ürün ekibi onaylamalıdır. Düğme etiketleri "siz" biçimindedir.
6. **Thoptan.com.** Kaynak sayfa tek ödeme seçeneğini Thoptan.com üzerinden sayar. Bu adın ana sayfada nasıl anılacağına ürün ekibi karar vermelidir.
7. **Gerçek cihaz.** Sayfa gerçek telefonda ve gerçek Safari'de denenmedi.
8. **Piktogram sınaması.** Set kullanıcılarla sınanmadı.
9. **Bağlantı.** Teklif formu, sepet ve dil seçimi canlı siteye bağlı değildir.
10. **Uygulama bağlantıları.** Canlı sitedeki App Store ve Google Play bağlantıları boştur. Bu yüzden alt bölüme konmadı.
11. **Kategorisiz ürünler.** 1.765 ürün canlı sitede bir kategoriye bağlı değildir.
12. **Planlanan içerik türleri.** Altı içerik türü öneridir. Canlı sitede karşılıkları yoktur.
13. **Büyük başlık sınırı.** İki kural çatışır. Bir kural "metin sığmak için küçültülmez" der. Diğer kural "başlık kelime ortasından bölünmez" der. Kullanıcı yazıyı yüzde 150 büyütürse dar ekranda büyük başlık küçülür. Küçülmeseydi uzun kelime ekrandan taşardı. Başlık yine de gövde metninden küçük olmaz. Bu uzlaşmayı kullanıcı onaylamalıdır.
