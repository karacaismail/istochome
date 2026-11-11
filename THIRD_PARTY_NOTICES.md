# Üçüncü taraf bildirimleri

## React Bits

Kaynak kod [React Bits deposundan](https://github.com/DavidHDev/react-bits) alınmıştır.
10 Kasım 2026 tarihli `9d9c687dc4f55b23539aa5417b703078047efa74` sürümü kullanılmıştır.

Lisans, MIT + Commons Clause License Condition v1.0 koşullarını içerir.
2026 telif hakkı David Haz’a aittir.
[Lisansın tam metni bu dosyadadır.](third_party/react-bits/LICENSE.md)

Bu sitenin arka plan hareketi, React Bits arka planlarından seçilen hesapları uyarlar. Uyarlanan kod `src/hareket/uyarlama.ts` dosyasındadır. Derleme çıktısı `hareket/uyarlama.js` dosyasıdır ve lisans atfını taşır.

Lisans, kodun bir uygulama, web sitesi ya da ürün içinde kullanılmasına izin verir. Bileşenler ayrı olarak satılmaz, alt lisanslanmaz ve tek başına ya da bir paket içinde dağıtılmaz. Bu depo bileşenleri ayrı bir paket olarak sunmaz.

| Kaynak dosya (`src/ts-default/Backgrounds/`) | SHA-256 | Uyarlanan kısım |
|---|---|---|
| `GridMotion/GridMotion.tsx` | `58549965c2444263155ec097c444f93dd8c0758849026b6be6975f6df9e3b541` | `PACE` (satır 62), satır başına karşıt yön (satır 266) ve `feather` kenar maskesi (satır 71-84) |
| `Waves/Waves.tsx` | `eb2d95ad72a82856247ba07a419f0113cc1099198a3e59a136ae43638b7f7400` | Gölgelendiricideki `gradient`, `ease` ve `perlin` (satır 105-131) ile `wave` (satır 177-181). GLSL'den TypeScript'e çevrildi |
| `DotGrid/DotGrid.tsx` | `a2a0050345b96d2311878277e91063b92d548e6f9887438046955f2d18aac50f` | `smootherstep` (satır 138) ve yakınlık itmesi (satır 352-361) |
| `MagnetLines/MagnetLines.tsx` | `7af602a9cc9867e978c682644e1bbc20975f5219e2d78490d3006779bc591b3f` | `seedFor` (satır 296-302) ve `fieldAngle` kipleri (satır 868-884) |

Alınmayan kısımlar şunlardır:

- WebGL ve gölgelendirici hattı
- Fizik çözücü (yay, sönüm ve şok dalgası)
- React bileşen yapısı
- Zamanla süren kare döngüsü

Kaynakta zamanla ilerleyen değerlerin yerini sayfa kaydırma ilerlemesi alır.
