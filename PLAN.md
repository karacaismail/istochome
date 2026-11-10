# iStoc ana sayfa: tasarım planı (4. sürüm)

Bu belge ana sayfanın neden bu sırayla, bu renklerle ve bu bileşenlerle kurulduğunu anlatır. Renk, güven ve piktogram kararlarının kaynakları `ARASTIRMA.md` dosyasındadır.

## 1. Kapsam

- **Yalnız ana sayfa.** Bu görevde tek sayfa üretilir: `index.html`.
- **Kategori sayfaları üretilmez.** Kullanıcı bu işi 10 Kasım 2026'da iptal etti. Kategoriler sayfa değil, menü öğesidir. Menü öğeleri üç yerde durur. Birincisi üst bölümdeki kategori menüsüdür. İkincisi ana sayfadaki kategori modülüdür. Üçüncüsü alt bölümdeki kategori sütunudur. Menü öğeleri canlı sitedeki kategori listesine gider.
- **Sayfa bir tasarım önerisidir.** Canlı siteye yüklenmedi. Arama canlı sitedeki sonuç sayfasını açar. Teklif formu ve sepet veri göndermez. Önizleme derlemesi arama motorlarına kapalıdır.

## 2. Kimin için, ne vaat ediyor?

Sayfanın iki okuyucusu var. Her biri "bu platformu kullanırım, çünkü" cümlesini kendi gerekçesiyle tamamlar. Sayfa bu gerekçeleri açıkça yazar.

**Alıcı.** İşletmesi ya da mağazası için toptan alım yapar. İstanbul'a, Ankara'ya, Antep'e gitmeden almak ister.

| "iStoc'tan alırım, çünkü" | Sayfadaki kanıtı |
|---|---|
| Yola çıkmam gerekmez. | Arama, teklif isteği ve üreticiye mesaj ekrandan yapılır. |
| Üreticiyi tanırım. | Üretici kartında işletme doğrulaması, kuruluş yılı, şehir ve ürün sayısı yazar. |
| Koşulu önceden görürüm. | Ürün kartında birim fiyat, KDV hariç fiyat, en az sipariş adedi ve hazırlık süresi yazar. |
| Siparişim kayıt altındadır. | Sipariş süreci modülü dört adımı anlatır. iStoc sipariş koşullarını saklar. |

**Satıcı.** Üreticidir. Yeni alıcıya ulaşmak ister.

| "iStoc'ta satarım, çünkü" | Kaynağı |
|---|---|
| Şu an satış komisyonu yok. | Canlı sitedeki satıcı sayfası. Ücretler Satıcı Hizmet Sözleşmesi'ndeki tabloya göredir. |
| Alıcıya aracısız ulaşırım. | Canlı sitedeki satıcı sayfası. |
| Başvuru 4 dakika sürer. | Canlı sitedeki satıcı sayfası. Onay ortalama 2 iş günüdür, başvuru ücretsizdir. |
| Mağazam doğrulanmış görünür. | Paket verisi. İşletme doğrulaması rozeti bütün paketlerde vardır. |

Sayfanın değer önerisi şu cümledir: "Çarşıya gitmeden toptan alın." Alıcı, üreticinin birim fiyatını ve en az sipariş adedini ekranında görür. Hazırlık süresini de görür. Sipariş teslimata kadar kayıt altında kalır.

## 3. Huni: modül sırası

Her modül alıcının bir sorusunu yanıtlar ve bir eyleme götürür.

| Sıra | Modül | Yanıtladığı soru | Eylem |
|---|---|---|---|
| 1 | Karşılama | Burası ne işe yarar? | Ürün ya da üretici ara |
| 1 | Hızlı teklif isteği | Aradığımı bulamazsam ne olur? | Teklif isteği oluştur |
| 2 | Güven şeridi | Buraya güvenebilir miyim? | Okumaya devam |
| 3 | Alıcılar için | Neden buradan alayım? | Ürünleri incele |
| 3 | Satıcılar için | Neden burada satayım? | Satıcı başvurusu yap |
| 4 | Kategoriler | Benim sektörüm var mı? | Kategoriye git |
| 5 | Ürünler | Fiyatlar ve koşullar nasıl? | En az sipariş adedini sepete ekle |
| 6 | Üreticiler | Karşımdaki kim? | Mağazaya git, mesaj yaz |
| 7 | Sipariş süreci | Param ve siparişim ne olur? | Örnek siparişi dene |
| 8 | Sık sorulanlar | Aklımdaki son itiraz ne? | Yardım Merkezi |
| 9 | Kapanış | Şimdi ne yapayım? | Ücretsiz kaydol |

Huniyi her ekranda destekleyen sabit öğeler:

- Geniş ekranda üst bölümde **Teklif isteyin** düğmesi durur.
- Dar ekranda aynı eylem mobil alt menünün ortasındadır. Aynı eylem ekranda iki kez durmaz.
- Karşılama araması ekranın üstünden çıkınca üst bölümde arama belirir.
- Karşılama araması henüz ekranın altındaysa üst arama belirmez. Belirseydi kısa ekranda gezinme satırını örterdi.
- Sepete ürün eklenince **sipariş özeti çubuğu** belirir. Çubuk ürün sayısını, adedi ve toplamı gösterir.

## 4. Modül sistemi: bileşen nerede başlar, nerede biter?

Sayfa, sayfa zemininin üstünde duran modüllerden oluşur. Her modül tek bir işi yapar.

**Dört yüzey basamağı:**

| Basamak | Renk | Ne için? |
|---|---|---|
| Sayfa zemini | `#e9eff6` | Modüllerin arasında görünen zemin |
| Modül | Beyaz, hafif gölgeli | Bir işi yapan bölüm |
| Kart | `#eef3f9` | Modülün içindeki tek bir öğe (ürün, üretici, gerekçe, kategori) |
| Kartın içindeki alan | Beyaz | Görsel ya da form alanı |

**Kurallar:**

1. Her grubun tek bir yüzeyi vardır. Göz, yüzeyin bittiği yerde grubun bittiğini anlar.
2. Bir grubun iç boşluğu, komşu grupla arasındaki boşluktan küçüktür.
3. Her modül aynı başlıkla başlar: etiket, başlık, açıklama, eylem.
4. Kenarlık yalnız işlev için kullanılır: form alanında ve satır ayırıcıda.
5. Koyu modül bir vurgudur. Art arda iki koyu modül gelmez.

**Boşluk tokenları:**

| Token | 320 px | 600 px | 1024 px | Görevi |
|---|---|---|---|---|
| `--gutter` | 20 px | 24 px | 32 px | Sayfa kenar payı |
| `--mod-gap` | 10 px | 16 px | 20 px | İki modül arasındaki boşluk |
| `--mod-pad` | 20 px | 32 px | 48 px | Modülün yan iç boşluğu |
| `--mod-pad-y` | 32 px | 40 px | 56 px | Modülün üst ve alt iç boşluğu |
| `--head-gap` | 24 px | 32 px | 40 px | Modül başlığı ile içerik arası |
| `--sp-1` ile `--sp-11` | 4 ile 96 px | aynı | aynı | Bileşen içi boşluk ölçeği |

Dar ekranda modül ekranı boydan boya kaplar ve komşusundan 10 piksellik zemin şeridiyle ayrılır. 600 pikselden sonra modülün köşeleri yuvarlanır ve çevresinde zemin görünür.

`tarayici-testi.mjs` bu kuralları dört soruyla ölçer:

1. Modülün yüzeyi sayfa zemininden ayrılıyor mu?
2. Kartın yüzeyi modülünden ayrılıyor mu?
3. Komşu modüller arasında boşluk var mı?
4. Her modülün adı var mı?

## 5. Renk sistemi

Üç renk ailesi, üç rol:

| Aile | Rolü | Nerede? | Hedef pay |
|---|---|---|---|
| Nötr yüzeyler | Zemin | Sayfa zemini, modül, kart | Yaklaşık yüzde 65 |
| Lacivert (`--a-50` ile `--a-950`) | Güven rengi, vurgu ailesi | Koyu modüller, güçlü düğme, bağlantı, piktogram, alt bölüm | Yaklaşık yüzde 30 |
| Turuncu (`--brand`) | Marka rengi, yalnız vurgu | Ana eylem düğmesi, arama düğmesi, sepet sayacı, başlık vurgusu | En çok yüzde 5 |

- Lacivert, turuncunun renk çemberindeki karşıtından türetildi. Turuncunun açısı 32 derece, lacivert ailesinin açısı 212 derecedir.
- Lacivert daha çok alan kaplar. Turuncu az kullanıldığı için göz önce onu görür. Baskın görünen renk yine turuncudur.
- Yeşil yalnız doğrulama ve tamamlanma anlamı taşır. Kırmızı yalnız hata anlamı taşır.
- Renk tek başına anlam taşımaz. Her durum piktogram ve metinle birlikte gösterilir.
- Saf siyah kullanılmaz. En koyu yüzey lacivertin en koyu tonudur.

**Düğmeler:**

| Tür | Renk | Ne zaman? | Örnek |
|---|---|---|---|
| Ana eylem | Turuncu | Kullanıcıyı ilerleten eylem. Bir bileşende en çok bir tane. | Karşılamadaki Arayın düğmesi, Teklif isteği oluşturun, Ücretsiz kaydolun |
| Güçlü eylem | Lacivert | Bağlayıcı adım ve bileşenin önemli ikinci eylemi | Sepete ekleyin, Mağazaya gidin, üst bölümdeki Arayın düğmesi |
| Koyu zeminde ikincil | Beyaz | Koyu modüldeki ikinci eylem | Üreticileri keşfedin |
| Bağlantı | Altı çizili lacivert metin | Başka sayfaya götüren ikincil yol | Ticaret güvencesini inceleyin |

Bir bileşende en çok bir turuncu düğme durur. Üst bölüm ve alt bölüm de birer bileşendir. Bu yüzden üst bölümdeki arama düğmesi laciverttir. Üst bölümde turuncu yalnız **Teklif isteyin** düğmesindedir.

`kapi.mjs` turuncuyu izinli yerlerin dışında reddeder. Kapı rengin tonunu ölçer. Bu yüzden turuncuya yakın bir renk kodunu da reddeder.

`tarayici-testi.mjs` üç şeyi ekrandan ölçer:

1. Turuncunun ilk ekrandaki payı yüzde 5'in altında mı?
2. Her bileşende en çok bir turuncu düğme mi var?
3. İzinli öğelerin dışında turuncu bir öğe var mı?

## 6. Güven dili

### 6.1 Ana sayfadaki güven öğeleri

- **Güven şeridi.** Dört güvence, her biri piktogram, başlık ve tek cümle.
- **Doğrulama rozeti.** Yeşil onay simgesi ve metin birlikte durur. Ürün kartında, üretici kartında ve örnek siparişte bulunur.
- **Açık koşul.** Fiyat, KDV hariç fiyat, en az sipariş adedi ve hazırlık süresi her ürün kartında yazar.
- **Sipariş süreci.** Dört adım. Ödemeyi kimin aldığı açıkça yazılır. Alıcı ödemeyi satıcının sunduğu yöntemle doğrudan satıcıya yapar. Tek ödeme seçeneği sunulursa bütün sepeti Thoptan.com'a öder. iStoc ödemeyi tutmaz ve ödemeye aracılık etmez.
- **Gerçek ve tarihli sayılar.** Ürün, kategori ve mağaza sayıları canlı veriden gelir. Sayıların altında verinin alındığı gün yazar.
- **Kimlik.** Alt bölümde şirket adı, ödeme yöntemleri, para birimleri, diller ve sosyal hesaplar yazar.
- **Ölü bağlantı yok.** Her bağlantının gerçek bir hedefi vardır. Hedefi olmayan öğe sayfaya konmaz.
- **Kaynaklı cümle.** Sayfadaki her kaynaklı cümle kanıt defterinde durur. Defter cümlenin kaynağını ve kaynakta aranan ifadeyi tutar. Ayrıntı 12. bölümdedir.
- **Sınıfı bilinen metin.** Sayfada görünen, en az iki kelimeli her metnin sınıfı bilinir. Sınıf kaynak, veri, tasarım metni ya da etikettir. Sınıfı bilinmeyen metin sayfaya giremez.
- **Hitap.** Sayfa okura "siz" diye seslenir. Düğme etiketleri de bu biçimdedir. Örneğin "Sepete ekleyin" ve "Giriş yapın".

### 6.2 Güvenli eylem kalıbı

Kullanıcıyı bir adıma bağlayan düğme, altındaki güvence satırıyla tek bir gruptur (`.secure`). Satır, düğmeye basınca ne olacağını ve ne olmayacağını söyler.

- Düğme metni fiille biter ve sonucu söyler: "Devam" yerine "Teklif isteği oluşturun".
- "Sepete ekleyin" düğmesinin altında şu yazar: "Bu sepet bir örnektir. Sepete eklemek ödeme başlatmaz. Ödemeyi, satıcıyla siparişte anlaşınca yaparsınız."
- Kilit piktogramı yalnız gerçek ödeme ve belge adımında kullanılır. Ana sayfada kilit yoktur. Kilit her düğmeye konursa anlamını yitirir.
- Sahte başarı gösterilmez. Teklif formu bu öneride veri göndermez. Form bunu gönderimden sonra açıkça yazar.
- Sepet bu öneride canlı siteye bağlı değildir. Sipariş özeti çubuğu, sepet bağlantısının etiketi ve sesli duyuru bunu açıkça söyler.
- Dil seçici bu öneride sayfanın dilini değiştirmez. Seçicinin altında bu yazar.

### 6.3 Sonraki sayfalar için süreç kuralları

Bu sayfalar bu görevin kapsamında değildir. Kurallar, o sayfalar tasarlanırken aynı güven dilini sürdürmek içindir.

| Süreç | Güven veren tasarım kararı |
|---|---|
| Sipariş ver, satın al | Sipariş özeti düğmenin hemen üstünde durur. Bilinmeyen maliyet gizlenmez, "satıcıyla belirlenir" yazılır. Düğmenin altında sonraki adım yazar. |
| Ödeme yap | Kart alanları ayrı bir yüzeyde ve kilit başlığıyla durur. Düğmede tutar yazar. Ödemeyi kimin aldığı söylenir. |
| Belge yükle | Hangi belgenin neden istendiği yüklemeden önce yazar. Her belgenin durumu ayrı satırda, piktogram ve metinle gösterilir. Reddedilen belgede neden ve sonraki adım yazar. Belgeyi kimin göreceği söylenir. |
| Kimlik ve işletme doğrulaması (KYC, KYB) | Önce değer gösterilir, sonra belge istenir. Adım sayısı, sıradaki adım ve tahmini süre baştan yazılır. Süreç yarıda bırakılıp sürdürülebilir. Bekleme sırasında kullanıcının ne yapabileceği söylenir. |
| Abonelik paketi satın al | Fiyatın dönemi, vergi durumu ve iptal koşulu düğmenin yanında yazar. Deneme süresi bitince ne olacağı söylenir. |

### 6.4 Renk ve simge dışında güveni kuranlar

1. **Sürpriz maliyet olmaz.** KDV, en az sipariş adedi ve kargo koşulu baştan görünür.
2. **Sonra ne olacağı bellidir.** Her bağlayıcı adımın altında sonraki adım yazar.
3. **Durum hep görünür.** Siparişin, ödemenin ve doğrulamanın durumu tarihle birlikte yazar.
4. **Karşıdaki gerçek bir işletmedir.** Mağazada doğrulama, kuruluş yılı ve şehir yazar.
5. **Sorun anında muhatap vardır.** Hata mesajı nedeni ve çözümü söyler. Her süreçte desteğe giden bir yol bulunur.
6. **Veri gerektiği kadar istenir.** Bilgi, gerektiği adımda ve nedeniyle birlikte istenir. Fiyat ve koşul kayıt olmadan görünür.
7. **Söylenen her şey doğrudur.** Sahte sayaç, sahte stok uyarısı ve uydurma yorum kullanılmaz.
8. **Arayüz tutarlı ve hızlıdır.** Aynı öğe her yerde aynı görünür ve aynı işi yapar. Sayfa yüklenirken ve üzerine gelince kaymaz.

## 7. Piktogram sistemi

Setin tamamı `piktogramlar.svg` dosyasındadır: 41 piktogram, 7 grup. Kaynağı `piktogram.py` dosyasıdır.

- **Her zaman etiketli.** Piktogram metnin yerine geçmez, metni hızlandırır. Yer darsa piktogram değil, ayrıntı metni kısalır.
- **Bir kavram, bir piktogram.** Doğrulama her yerde kalkandır. Kilit yalnız güvenli adım demektir.
- **Tek ızgara, tek çizgi.** 24 birimlik ızgara, 1,75 birimlik çizgi, yuvarlak uç. İkinci ton aynı rengin yüzde 16 dolgusudur.
- **Zeminli kutu.** Piktogram 48 piksellik açık mavi kutuda durur. Kutu, piktogramın yerini ve boyutunu her yerde aynı tutar.
- **Turuncu piktogram yok.** Piktogramlar lacivert çizilir. Doğrulama piktogramı yeşil zeminde durur.
- **Okuyucudan gizli.** Anlamı yanındaki metin taşıdığı için piktogram ekran okuyucuya okutulmaz.
- **Hareket.** Piktogram, bulunduğu modül ekrana girince çizilerek tamamlanır.

Set yedi gruba ayrılır. Gruplar şunlardır: güven ve doğrulama, belge ve kayıt, sipariş süreci, ticari koşullar, taraflar, durum, kategoriler. Bazı piktogramlar ana sayfada kullanılmaz. Örneğin belge yükleme, kimlik doğrulama ve güvenli ödeme piktogramları sonraki sayfalar içindir.

Bu set kullanıcılarla sınanmadı. Ayrıntı `ARASTIRMA.md` dosyasının beşinci bölümündedir.

## 8. Üst ve alt bölüm

**Üst bölüm üç katmandır.** Her katmanın tek bir işi vardır.

| Katman | İçerik | Ne zaman görünür? |
|---|---|---|
| Yardımcı şerit | Solda dil ve para birimi. Sağda sipariş takibi, ticaret güvencesi ve Yardım Merkezi. | Yalnız geniş ekranda |
| Ana satır | Logo, arama, mesajlar, sepet, giriş, **Teklif isteyin** | Her zaman. Ekranın üstünde sabit kalır, yatay telefonda sabit kalmaz. Dar ekranda mesajlar, sepet ve teklif eylemi mobil alt menüdedir. |
| Gezinme satırı | Kategori menüsü, bölüm bağlantıları, satıcı bağlantısı | Sayfanın başında. Dar ekranda iki satırdır. |

**Dar ekranda gezinme satırı ikiye bölünür.** Üst satırda kategori düğmesi ve satıcı bağlantısı durur. Alt satırda bölüm bağlantıları bütün genişlikte kayar. Tek satırda bölüm bağlantılarına 100 piksel kadar yer kalıyordu. O genişlikte ok düğmeleri bağlantıların üstünü örtüyordu.

**Kategori menüsü** canlı kategori ağacından üretilir. Ürünü en çok olan 10 üst kategoriyi ve her birinin alt menü öğelerini içerir.

- Düğmeyle açılır. Üzerine gelmekle açılmaz, çünkü dokunmatik ekranda üzerine gelme yoktur.
- Geniş ekranda iki bölmedir: solda üst kategoriler, sağda seçili kategorinin menü öğeleri.
- Dar ekranda akordeondur: üst kategoriye dokununca menü öğeleri altında açılır.
- Escape tuşu menüyü kapatır ve odağı düğmeye geri verir.
- Ok tuşları üst kategoriler arasında odağı taşır. Sayfa kaymaz.
- Menünün dışına dokunmak menüyü kapatır. Odak menünün dışındaki bir öğeye geçince de menü kapanır.
- Menü öğeleri durağan halde altı çizilidir. Grup adının yanında ok simgesi durur.
- JavaScript kapalıysa düğmenin yerinde sayfadaki kategori modülüne giden bir bağlantı görünür.

**Alt bölüm dört katmandır.**

| Katman | İçerik |
|---|---|
| Bağlantı sütunları | Alıcılar için, Satıcılar için, Ticaret güvencesi, Destek, Kategoriler |
| Ticari bilgiler | Ödeme yöntemleri, para birimleri, diller |
| Araçlar | Dil ve para birimi seçici, sosyal hesaplar |
| Yasal satır | Şirket adı, kullanım koşulları, gizlilik, çerez tercihleri |

Dar ekranda bağlantı sütunları açılır kapanır gruplara döner.

**Hedef boyutu.** Dokunma hedefi en az 44 pikseldir. Sıkı yoğunluk yalnız fareyle kullanılan geniş ekranda geçerlidir. Orada yardımcı şerit ve menü öğeleri 40, alt bölüm bağlantıları 36 pikseldir. Dokunmatik ekranı olan cihazda hedef 44 piksel kalır. Ölçüt ekran genişliği değil, işaretçidir.

**Sabit çubuklar.** Odaklanan öğe mobil alt menünün ya da sipariş özeti çubuğunun arkasında kalmaz. Sayfa, öğeyi çubuğun üstüne kaydırır.

**Üst arama.** Karşılama araması ekranın üstünden çıkınca üst bölümde arama belirir. Sayfa bir bağlantıyla aniden sıçrasa da durum doğru kalır. Kullanıcı üst aramada yazarken alan kapanmaz. Odak alandan çıkınca alan kapanır.

**Klavye odağı.** Çevreleyen halka yoktur. Odaklanan öğenin dolgusu ters döner ve metninin altı çizilir. Zaten dolgulu olan düğme kendi odak dolgusunu bildirir. Örneğin lacivert düğme vurgu mavisine, turuncu düğme laciverte döner. Odak dolgusu, öğenin durağan dolgusundan en az 3:1 karşıtlıkla ayrılır. Böylece yalnız simgesi görünen düğmede de odak seçilir. Metin alanında dolgu değişmez, yazının altında düz bir çizgi belirir.

Odakla ilgili dört ayrıntı daha vardır:

1. Fare odaklanan düğmenin üzerinde dursa da odak dolgusu görünür. Üzerine gelme rengi odak dolgusunu ezemez.
2. "İçeriğe atlayın" bağlantısı odağı ana bölüme taşır. Ana bölüm bir denetim değildir, içindeki piktogramlar renk değiştirmez.
3. Bağlantının görünmesi ve kaybolması geçişsizdir. Böylece bağlantı bir sonraki durağın üstünü örtmez.
4. Kayan şeritte ok düğmesi içeriğin üstünde durur. Şerit, klavyeyle odaklanan öğeyi okun altından çıkarır.
5. Şerit bunu yalnız klavye modunda yapar. Parmakla basılan bağlantı yerinden oynamaz, böylece dokunuş kaybolmaz.
6. JavaScript yoksa da odak görünür. O durumda göstergeyi tarayıcının kendi odak kararı açar.

## 9. Gösterge kuralı: yapı durağan halde anlaşılır

**Sorunun adı.** Alan etkileşim tasarımı ve kullanılabilirliktir. Kavram göstergedir (İngilizcesi signifier). Öğenin sunduğu imkâna "affordance", o imkânı kullanıcıya gösteren işarete "signifier" denir. İmkân var ama işaret yoksa kullanıcı özelliği bulamaz. Bu duruma keşfedilebilirlik sorunu denir.

**Kural.** Sayfanın yapısı, fare üzerine gelmeden çekilmiş durağan bir ekran görüntüsünde anlaşılmalıdır. Üzerine gelme yalnız onay verir, bilgi taşımaz. Dokunmatik ekranda üzerine gelme hiç yoktur.

| Soru | Gösterge | Bu sayfadaki uygulama |
|---|---|---|
| Burası kayıyor mu? | Kenar solması, ok düğmesi, konum çubuğu | Kaydırma şeridi sistemi (`[data-scroller]`) |
| Burası nerede bitiyor? | Ayırıcı çizgi, boşluk, yüzey farkı | Gezinme satırındaki ayırıcılar, modül ve kart yüzeyleri |
| Buna tıklanır mı? | Alt çizgi, düğme biçimi, ok, etiket | Altı çizili bağlantılar, altı çizili menü ve alt bölüm öğeleri, etiketli simgeler |
| Şu an hangi durumda? | Dolgu, işaret, soluk simge | Seçili süzgeç, sepetteki ürün, açık menü |

Ters yöndeki hata da aynı kuralın parçasıdır: tıklanamayan öğe tıklanabilir görünmemelidir.

Gösterge gözle seçilmelidir. Liste bağlantısının alt çizgisi zemine karşı en az 3:1 karşıtlık taşır. Daha soluk bir çizgi var sayılmaz.

## 10. Hareket

Tüm geçişler tek eğriyi kullanır: `cubic-bezier(0.65, 0, 0.35, 1)`. Süreler, sıralama gecikmesi ve bekleme süresi tokendır. Betik süre tokenını olduğu gibi kullanır, çarpmaz ve bölmez. Hareketin her biri bir şey anlatır.

| Hareket | Nerede? | Ne anlatır? |
|---|---|---|
| Sıralı açılış | Karşılama | Başlık, açıklama, arama ve teklif kutusu okuma sırasıyla gelir |
| Dönen örnek arama | Arama alanı | Ne aranabileceğini gösterir. Dokununca durur. |
| Kayan gösterge | Arama sekmeleri | Seçimin yer değiştirdiğini gösterir |
| Sayaç | Karşılama sayıları | Sayılara dikkat çeker |
| Beliren öğeler | Tüm modüller | İçerik, ekrana girdikçe sırayla gelir |
| Çizilen piktogram | Güven şeridi, gerekçeler | Piktogram ekrana girince çizilir |
| Açılan menü | Kategori menüsü | Menünün düğmeden çıktığını gösterir |
| Kayan kartlar | Ürün süzgeci | Kartlar yeni yerine kayar |
| Dolan adım çizgisi | Sipariş süreci | Kaydırdıkça ilerleme gösterir |
| Akan toplam | Örnek sipariş, sipariş özeti | Adet değişince toplamın değiştiğini gösterir |
| Beliren çubuk | Sipariş özeti | Sepete eklemeyi onaylar |
| Yumuşak açılma | Sık sorulanlar | Yanıt yüksekliği açılır |

Durum (değer, ARIA, odak) her zaman anında güncellenir. Yalnız görsel sunum yumuşak geçer. Üzerine gelince hiçbir kutu yerinden oynamaz. Hareket azaltma tercihi açıksa geçişler kapanır.

Kâğıtta hareket yoktur. Sayfa yazdırılınca gizli başlayan her içerik görünür. Kapalı yanıtlar açılır, sabit çubuklar basılmaz.

## 11. Ana sayfanın arama motoru hazırlığı

Kategori sayfalarının toplu üretimi iptal edildi. Ana sayfanın kendi hazırlığı duruyor:

- Tek bir `h1`, sıralı başlık düzeyleri ve anlamlı bölüm adları.
- Başlık, açıklama, kalıcı adres ve paylaşım etiketleri.
- Sayfada dört yapısal veri vardır. Bunlar kuruluş, site içi arama, ürün listesi ve sık sorulanlardır. Ürün listesi yalnız ad ve adres taşır, fiyat taşımaz.
- Dil bağlantısı canlı sitedeki gibi yalnız Türkçe için bildirilir.
- Menü ve dizin öğeleri gerçek bağlantıdır. Arama motoru bunları izleyebilir.
- Önizleme derlemesi `noindex` taşır, çünkü bir tasarım önerisi dizine girmemelidir.
- Yayın derlemesi `python3 build.py --yayin` komutuyla üretilir. Yayın derlemesi dizine açıktır.

## 12. Veri kaynağı

Kural şudur: sayfadaki her sayı ve her olgu `data` klasöründen gelir. `build.py` içinde olgu yazmaz.

- `veri.py` olguları istoc.com açık uçlarından alır ve `data` klasörüne yazar. Verinin alındığı günü de yazar.
- `secim.py` yalnız seçimi tutar. Hangi ürünün, hangi üreticinin ve hangi görselin yer alacağını söyler.
- `build.py` bu iki kaynağı birleştirir. Ağa çıkmaz.

10 Kasım 2026 günü alınan veri şunları söylüyor:

- 2.412 ürün, 52 üst kategori ve 751 alt kategori var.
- 19 mağaza var. 18 mağazanın işletme doğrulaması tamamlandı.
- Para birimleri GBP, USD, EUR ve TRY'dir.
- Seçilen 8 ürünün fiyatı, en az sipariş adedi, hazırlık süresi ve üreticisi ürün ayrıntısından geldi.
- Doğrulama rozeti yalnız üreticisi doğrulanmış üründe görünür. Bunu veri belirler.
- Fiyatlar TRY'den USD'ye iStoc'un o günkü kuruyla çevrildi (1 TRY = 0,019929 USD). KDV oranı yüzde 20'dir.

Bazı cümleler elle yazıldı. Bunların kaynağı canlı sitedeki sayfalardır. Bu cümleler kanıt defterinde durur.

- Kanıt defteri `data/kaynaklar.json` dosyasıdır. Defterde 56 cümle var.
- Her cümlenin yanında kaynağın adresi ve kaynakta aranan ifade yazar. İfadenin kaynaktaki çevresi de yazar.
- `veri.py` her ifadeyi kaynağında arar. Bir ifadeyi bulamazsa durur ve hiçbir dosyayı yazmaz.
- `build.py` her cümlenin sayfada birebir geçtiğini denetler. `kapi.mjs` aynı denetimi üretilen sayfada yineler.

Denetim ters yönde de çalışır. `metin.py` sayfada görünen, en az iki kelimeli her metni çıkarır. Her metnin sınıfı bilinmelidir:

| Sınıf | Ne demek? | Sayfadaki sayısı |
|---|---|---|
| Kaynak | Canlı sitedeki bir sayfaya dayanan cümle. Kanıt defterinde durur. Eşleşme birebirdir. | 56 |
| Veri | Sayısı ya da dayanağı `data` klasöründen gelen metin. | 42 |
| Tasarım | Bu sayfanın kendi sözü: değer önerisi, başlık, soru, yönerge ve öneri notu. | 45 |
| Etiket | Düğme, bağlantı ve alan adı. Canlı sitedeki bir sayfanın adı da etikettir. | 58 |

Kurallar şunlardır:

- Şablona yeni bir metin eklenirse ve sınıfı yazılmazsa `build.py` sayfayı üretmez.
- Canlı site hakkında olgu bildiren cümle tasarım sınıfına yazılmaz. O cümle kanıtıyla birlikte kanıt defterine girer.
- Kaynaklı cümlenin sayısı değişirse cümle başka bir cümle sayılır ve reddedilir.
- Ürün, kategori ve mağaza adları veriden gelir. Sayfada işaretlenir ve sınıflandırılmaz.
- `app.js` içindeki kullanıcı metinleri de kayıtlıdır. Kayıtsız bir metin eklenirse `kapi.mjs` reddeder.

Kaynaklar şunlardır:

| Kaynak | Hangi cümleler? |
|---|---|
| Satıcı sayfası (`/satici-ol`) | Komisyon, başvuru süresi, onay süresi, başvuru ücreti, aracısız buluşma |
| Paket verisi (açık uç) | Hiçbir pakette komisyon yok. Doğrulama rozeti üç paketin üçünde var. |
| Ticaret güvencesi sayfası (`/ticaret-guvencesi`) | Ödeme yolu, ödeme yöntemleri, sipariş kaydı, destek, iade, teslimat |
| Sitenin dil paketi | Diller, ücretsiz üyelik, teklif isteği, en az adet uyarısı |

Kaynak sayfa iki ödeme yolu sayar. Birincisi doğrudan satıcıya ödemedir. İkincisi, sunulduğunda, bütün sepetin tek ödemeyle Thoptan.com'a ödenmesidir. Sayfa iki yolu da yazar. Önceki sürüm yalnız birinci yolu yazıyordu, bu eksikti.

Sosyal hesap adresleri canlı sitenin alt bölümünden alındı. Solingen Bıçak'ın kuruluş yılı alanı boştur. "1992'den beri" bilgisi mağazanın kendi açıklamasından alındı. `veri.py` bu bilgiyi açıklamada arar ve bulamazsa durur.

Veride bir tutarsızlık var. 2.412 ürünün 647'si bir kategoriye bağlıdır. Kalan 1.765 ürün canlı sitede kategorisizdir. Bu yüzden kategori kartlarındaki sayıların toplamı 647 eder. Sayfa iki sayıyı da veride olduğu gibi gösterir. Ürünler kategoriye bağlanınca kart sayıları kendiliğinden düzelir.

Dört içerik sitede yoktur, onları ben ekledim:

- Değer önerisi cümleleri
- Alıcı gerekçelerinin ifadesi
- Ürün süzgeci grupları
- Aramadaki örnek kelimeler

## 13. Dosyalar ve doğrulama

| Dosya | İçerik |
|---|---|
| `index.html` | Üretilen ana sayfa |
| `sablon/` | Sayfa iskeleti: baş, üst bölüm, gövde, alt bölüm |
| `build.py` | Veriyi iskelete yerleştirir. Önizleme: `python3 build.py`. Yayın: `python3 build.py --yayin` |
| `veri.py` | Olguları canlı siteden alır. Çalıştırma: `python3 veri.py` |
| `secim.py` | Seçki: ana sayfada yer alan ürünler ve üreticiler. Cümlelerin sınıfları da buradadır. |
| `metin.py` | Sayfadaki cümleleri çıkarır ve sınıflandırır |
| `data/` | Canlı siteden alınan veri, kanıt defteri ve alındıkları gün |
| `piktogram.py` | Piktogram seti. Çalıştırma: `python3 piktogram.py` |
| `piktogramlar.svg` | Piktogram başvuru sayfası |
| `styles.css` | Tokenlar ve bileşenler |
| `app.js` | Davranış |
| `kapi.mjs` | Kural kapısı: hareket, odak, metin, kenar, renk rolü, ana sayfa yapısı. Çalıştırma: `node kapi.mjs` |
| `tarayici-testi.mjs` | Chromium ve WebKit denetimi. Çalıştırma: `node tarayici-testi.mjs http://localhost:4391/` |
| `--sinama` | Kapı ve test kendini sınar. Bilinen her bozulmanın reddedildiğini gösterir. |
| `goruntu.mjs` | Modül modül ekran görüntüsü alır |
| `serve.mjs` | Önizleme sunucusu |

### Doğrulama durumu (10 Kasım 2026)

| Denetim | Durum | Not |
|---|---|---|
| Kural kapısı | pass | 547 stil kuralı ve 1 sayfa denetlendi. |
| Kapının kendini sınaması | pass | 72 ihlal örneğinin hepsi reddedildi. |
| Chromium (Playwright) | pass | 439 denetimin hepsi geçti. |
| WebKit (Playwright, Safari ailesi) | pass | 439 denetimin hepsi geçti. |
| Testin kendini sınaması | pass | 31 bozulmanın hepsi yakalandı. Biri WebKit'te, diğerleri Chromium'da denendi. |
| Kaynak denetimi | pass | 56 kaynaklı cümlenin hepsi canlı sitede bulundu. |
| Bağımsız inceleme | pass | Bu sürüm dört kez incelendi. İncelemeler sekiz ciddi hata buldu, sekizi de düzeltildi. |
| Son turun bağımsız incelemesi | not_run | Son düzeltmeleri kapı ve test doğruladı, bağımsız inceleme görmedi. |
| Firefox | not_run | Kullanıcının kararıyla çalıştırılmaz. |
| Gerçek Safari, iOS ve Android cihaz | not_run | Öykünme gerçek cihazın yerini tutmaz. |
| Ekran okuyucu | not_run | Sesli okuma denenmedi. |
| Gerçek yazıcı çıktısı | not_run | Yazdırma kuralları yalnız öykünmeyle sınandı. |
| Piktogramların kullanıcıyla sınanması | not_run | Ayrıntı `ARASTIRMA.md` dosyasındadır. |
| Metnin gerçek okurla denenmesi | not_run | Gerçek okurla denenmedi. |

Yerleşim denetimleri dokuz ekran boyutunda çalışır. Dar boyutlar 320, 360, 375 ve 390 piksel genişliktedir. 320 piksel iki ayrı yükseklikte sınanır. Diğer boyutlar yatay telefon, tablet, dizüstü ve masaüstüdür. Dokunmatik geniş ekran ayrıca sınanır.

Davranış denetimleri ve klavye turu 320, 390 ve 1440 piksel genişlikte çalışır. Tur, sayfayı Tab tuşuyla baştan sona dolaşır. Tur açık durumları da dolaşır: üst arama, kategori menüsü ve sepet çubuğu. JavaScript kapalı durum ayrıca sınanır.

## 14. Açık konular

1. **Yasal bilgiler.** 2022 tarihli yönetmelik pazaryerlerinden ticaret unvanı, MERSİS numarası, adres ve KEP adresi göstermesini istiyor. Bu kuralın iStoc için geçerli olup olmadığına hukuk karar vermelidir. Değerleri bilmediğim için alt bölüme eklemedim.
2. **Piktogram sınaması.** Set kullanıcılarla sınanmadı.
3. **Metin onayı.** Değer önerisi ve gerekçe cümleleri ürün ekibince onaylanmalıdır. Düğme etiketleri "siz" biçimine çevrildi. Canlı sitedeki etiketler farklıdır, bu da onay ister.
4. **Gerçek cihaz.** Sayfa gerçek telefonda ve gerçek Safari'de denenmedi.
5. **Bağlantı.** Teklif formu ve sepet canlı siteye bağlı değildir.
6. **Uygulama bağlantıları.** Canlı sitedeki App Store ve Google Play bağlantıları boştur. Bu yüzden alt bölüme konmadı. Uygulama adresi gelince eklenir.
7. **Teslimat ülkesi.** Canlı sitedeki teslimat ülkesi seçicisi bu öneride yoktur. Seçici tasarlanınca yardımcı şeride eklenir.
8. **Kategorisiz ürünler.** 1.765 ürün canlı sitede bir kategoriye bağlı değildir. Ayrıntı 12. bölümdedir.
9. **Thoptan.com.** Kaynak sayfa tek ödeme seçeneğini Thoptan.com üzerinden sayar. Bu adın ana sayfada nasıl anılacağına ürün ekibi karar vermelidir.
10. **Sepet ve dil seçici.** İkisi de bu öneride örnektir. Canlı siteye bağlanınca örnek notları kaldırılır.
