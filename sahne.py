# Hareketli sahnelerin durağan işaretlemesi. build.py bu modülü kullanır.
# Sahne süstür: okuyucudan gizlidir, tıklanmaz ve içeriğin arkasında durur. Betik yoksa bu hâliyle görünür.
# Geometri burada tek kaynaktadır. TypeScript hareket paketi (src/hareket/sahne.ts) eğri ve noktaları DOM'dan okur.
# Sözleşme: kök data-motion-scene ve data-axis taşır. Hareketli grup data-motion-layer taşır.
# m-off sınıflı öğe 640 CSS px altında gizlenir. Böylece dar ekranda sahne başına en çok 64 öğe görünür.
import math

VIEW = '<svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" focusable="false">%s</svg>'


def bez(p, t):
    u = 1 - t
    a, b, c, d = u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t
    return (a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1])


def d_of(p):
    return "M%d %d C %d %d, %d %d, %d %d" % (p[0] + p[1] + p[2] + p[3])


def b_attr(p):
    return " ".join("%d,%d" % q for q in p)


def off(cond):
    return ' class="m-off"' if cond else ""


# Dar ekranda SVG 70svh yüksekliktedir. Görünen kısım yaklaşık x 360-840 aralığıdır. Bu aralığın dışındaki öğe m-off olur.
def narrow(x):
    return x < 360 or x > 840


def root(name, axis, body):
    return ('<span class="scene scene--%s" aria-hidden="true" data-motion-scene="%s" data-axis="%s"><span class="scene__tilt">%s</span></span>'
            % (name, name, axis, body))


# 1. Karşılama: ticaret akışı. Arka katmanda iki şerit, ön katmanda kalın ve ince şerit ile şerit üstünde paketler.
# Karşılama ekrandan uzundur ve SVG "slice" ile ölçeklenir. Görünen kısım yaklaşık x 220-980 ve y 0-460 aralığıdır.
# Şeritler bu aralıkta çapraz geçer. Metnin arkasındaki kısım maskeyle solar (styles.css, .scene--flow).
FLOW_BACK = [((-80, 150), (380, 40), (760, 300), (1280, 90)), ((-80, 340), (420, 250), (820, 440), (1280, 260))]
FLOW_FRONT = [((-80, 430), (380, 190), (760, 390), (1280, 40)), ((-80, 462), (380, 222), (760, 422), (1280, 72))]
FLOW_PKT = [0.14, 0.3, 0.46, 0.62, 0.78, 0.92]


def flow():
    back = '<path class="rib rib--back" data-b="%s" d="%s"/><path class="rib rib--back m-off" data-b="%s" d="%s"/>' % (
        b_attr(FLOW_BACK[0]), d_of(FLOW_BACK[0]), b_attr(FLOW_BACK[1]), d_of(FLOW_BACK[1]))
    front = '<path class="rib rib--front" data-b="%s" d="%s"/><path class="rib rib--thin" data-b="%s" d="%s"/>' % (
        b_attr(FLOW_FRONT[0]), d_of(FLOW_FRONT[0]), b_attr(FLOW_FRONT[1]), d_of(FLOW_FRONT[1]))
    pkts = ""
    for i, t in enumerate(FLOW_PKT):
        x, y = bez(FLOW_FRONT[0], t)
        pkts += '<rect class="pkt%s" data-t="%.2f" x="-9" y="-6" width="18" height="12" rx="2" transform="translate(%d %d)"/>' % (" m-off" if narrow(x) else "", t, x, y)
    return root("flow", "xy", VIEW % ('<g data-motion-layer="back">%s</g><g data-motion-layer="front">%s%s</g>' % (back, front, pkts)))


# 2. Üreticiler: GridMotion uyarlaması. Eğik düzlemde karşıt yönde kayan dört satır kutu.
def grid():
    rows = ""
    for r in range(4):
        tiles = "".join("<i%s></i>" % (' class="m-off"' if k >= 6 else "") for k in range(10))
        rows += '<span class="grid__row%s" data-motion-layer="row" data-row="%d"><span class="grid__shift">%s</span></span>' % (" m-off" if r == 3 else "", r, tiles)
    return root("grid", "x", '<span class="grid__plane">%s</span>' % rows)


# 3. Süreç: kıvrımlı güzergâh ve üstünde ilerleyen düğümler. Yeni bir anlam eklemez, yalnız süstür.
# Rota, metin sütunu ile sağdaki kart arasındaki boşlukta dikey bir S çizer (1440 px'te görünüm kutusunun x 486-664 aralığı).
ROUTE = ((600, -60), (380, 220), (820, 400), (560, 720))
ROUTE_T = [0.1, 0.3, 0.5, 0.7, 0.9]


def route():
    line = '<path class="route__line" data-b="%s" d="%s"/><path class="route__dash" d="%s" pathLength="1"/>' % (b_attr(ROUTE), d_of(ROUTE), d_of(ROUTE))
    nodes = ""
    for i, t in enumerate(ROUTE_T):
        x, y = bez(ROUTE, t)
        nodes += '<g class="route__node%s" data-t="%.1f" transform="translate(%d %d)"><circle r="11"/><circle class="route__core" r="4"/></g>' % (" m-off" if narrow(x) else "", t, x, y)
    return root("route", "y", VIEW % ('<g data-motion-layer="back">%s</g><g data-motion-layer="front">%s</g>' % (line, nodes)))


# 4. Satıcılar: alt kenardan yükselen küçük geometrik katmanlar. Arka ve ön katman ters yönde döner.
# Şekillerin bir kısmı başlığın sağındaki boşlukta, bir kısmı alt kenarda durur. Kartların arkasında kalan şekil azdır.
RISE = [("kare", 120, 560), ("ucgen", 470, 180), ("altigen", 640, 560), ("kare", 800, 140), ("ucgen", 1080, 520),
        ("altigen", 60, 420), ("kare", 250, 600), ("ucgen", 560, 110), ("altigen", 700, 250), ("kare", 1020, 200), ("ucgen", 1140, 470), ("kare", 900, 600)]


def shape(kind, x, y, size):
    if kind == "kare":
        return '<rect class="rise__s" x="%d" y="%d" width="%d" height="%d" rx="4"/>' % (x - size / 2, y - size / 2, size, size)
    if kind == "ucgen":
        pts = [(x, y - size * 0.6), (x + size * 0.55, y + size * 0.4), (x - size * 0.55, y + size * 0.4)]
    else:
        pts = [(x + size * 0.55 * math.cos(math.pi / 3 * k), y + size * 0.55 * math.sin(math.pi / 3 * k)) for k in range(6)]
    return '<polygon class="rise__s" points="%s"/>' % " ".join("%d,%d" % p for p in pts)


def rise():
    back = "".join(shape(k, x, y, 34).replace('class="rise__s"', 'class="rise__s%s"' % (" m-off" if narrow(x) else "")) for k, x, y in RISE[:5])
    front = "".join(shape(k, x, y, 52).replace('class="rise__s"', 'class="rise__s%s"' % (" m-off" if narrow(x) else "")) for k, x, y in RISE[5:])
    return root("rise", "y", VIEW % ('<g data-motion-layer="back">%s</g><g data-motion-layer="front">%s</g>' % (back, front)))


# 5. Araçlar: DotGrid uyarlaması. İki katman düzenli nokta merkezden ölçeklenir. Ön katman ince işaretçiden itilir.
def depth():
    back = "".join('<circle%s cx="%d" cy="%d" r="4"/>' % (off(narrow(75 + c * 150)), 75 + c * 150, 64 + r * 128) for r in range(5) for c in range(8))
    front = "".join('<circle%s cx="%d" cy="%d" r="7"/>' % (off(narrow(160 + c * 170)), 160 + c * 170, 120 + r * 160) for r in range(4) for c in range(7))
    return root("depth", "y", VIEW % ('<g data-motion-layer="back">%s</g><g data-motion-layer="front" class="depth__front">%s</g>' % (back, front)))


# 6. Bölgesel tedarik: MagnetLines uyarlaması. Kısa çizgiler bir çekim noktasına döner.
# Çekim noktası sağ üstten sol alta giden kübik eğri üstünde, sayfa kaydıkça ilerler. Üst sağ ve alt sol bağlantı eğrileri ters yönde kayar.
MAGNET_PATH = ((1240, -40), (900, 260), (380, 300), (-40, 680))
LINK_A = ((700, -20), (900, 120), (1040, 60), (1240, 220))
LINK_B = ((-40, 420), (160, 560), (320, 500), (520, 660))


def magnet():
    ax, ay = bez(MAGNET_PATH, 0.5)
    lines = ""
    for r in range(5):
        for c in range(9):
            cx, cy = 66 + c * 133, 64 + r * 128
            a = math.degrees(math.atan2(ay - cy, ax - cx) + math.pi / 4)
            lines += '<line%s data-c="%d,%d" x1="-24" y1="0" x2="24" y2="0" transform="translate(%d %d) rotate(%d)"/>' % (off(narrow(cx)), cx, cy, cx, cy, a)
    layers = '<g data-motion-layer="a"><path class="link" d="%s"/></g><g data-motion-layer="b"><path class="link" d="%s"/></g>' % (d_of(LINK_A), d_of(LINK_B))
    return root("magnet", "xy", VIEW % ('%s<g class="magnet__lines" data-b="%s">%s</g>' % (layers, b_attr(MAGNET_PATH), lines)))
