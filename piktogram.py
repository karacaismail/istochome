# Piktogram seti. 24 x 24 ızgara, 1,75 çizgi, yuvarlak uç. Tek kavram, tek piktogram.
# "f" sınıflı parça ikinci tondur (aynı rengin yüzde 16 dolgusu). Turuncu kullanılmaz.
# Kural: piktogram tek başına anlam taşımaz, her zaman etiketiyle birlikte durur.
import re

SCALLOP = "a2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0 2.125 2.125 0 0 0 4.25 0"

# ad -> (anlam, svg içeriği)
PICTO = {
    # Güven ve doğrulama
    "kalkan": ("Doğrulanmış, korunan", '<path class="f" d="M12 3 5 6v5.5c0 4.3 2.9 7.7 7 9.5 4.1-1.8 7-5.2 7-9.5V6z"/><path d="M12 3 5 6v5.5c0 4.3 2.9 7.7 7 9.5 4.1-1.8 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15 10.3"/>'),
    "isletme": ("İşletme doğrulaması (KYB)", '<path class="f" d="M5 4.5h14l1.5 5h-17z"/><path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5' + SCALLOP + '"/><path d="M5 12.5V20h6.5"/><circle cx="17" cy="17" r="4"/><path d="m15.3 17 1.3 1.3 2.2-2.5"/>'),
    "kimlik": ("Kimlik doğrulaması (KYC)", '<rect class="f" x="3" y="5" width="18" height="14" rx="2.5"/><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.6 16c.5-1.5 1.6-2.3 2.9-2.3s2.4.8 2.9 2.3"/><path d="M14 9.5h4M14 13h3"/>'),
    "kilit": ("Güvenli adım", '<rect class="f" x="5" y="10.5" width="14" height="10" rx="2.2"/><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.2"/>'),
    "gizlilik": ("Gizli tutulur", '<path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="m4.5 4.5 15 15"/>'),
    # Belge ve kayıt
    "belge-yukle": ("Belge yükle", '<path class="f" d="M7 3h7l4 4v14H7z"/><path d="M12.5 21H7V3h7l4 4v5.5"/><path d="M14 3v4h4"/><path d="M17.5 21.5V15M15 17.3l2.5-2.5 2.5 2.5"/>'),
    "belge-onay": ("Belge onaylandı", '<path class="f" d="M6 3h8l4 4v14H6z"/><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="m9 13.5 2 2 4-4.2"/>'),
    "kayit": ("Kayıt altında", '<circle class="f" cx="17" cy="17" r="2.6"/><path d="M12 21H6V3h8l4 4v6"/><path d="M14 3v4h4"/><path d="M9 11h5M9 14.5h2.5"/><circle cx="17" cy="17" r="2.6"/><path d="m15.6 19.3-.8 2.7 2.2-1.1 2.2 1.1-.8-2.7"/>'),
    "fatura": ("Fatura", '<path class="f" d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3"/>'),
    # Sipariş süreci
    "teklif": ("Teklif isteği", '<path class="f" d="M5 3h9l4 4v6H13v8H5z"/><path d="M12 21H5V3h9l4 4v5"/><path d="M14 3v4h4"/><path d="M8.5 11h6M8.5 14.5h3"/><path d="M14.5 17.5H21M18.5 15l2.5 2.5-2.5 2.5"/>'),
    "mesaj": ("Üreticiye yaz", '<path class="f" d="M4 5h16v11H9.5L5 19.5V16H4z"/><path d="M4 5h16v11H9.5L5 19.5V16H4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    "siparis": ("Sipariş", '<rect class="f" x="5" y="4.5" width="14" height="16" rx="2"/><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5"/><path d="m8.8 12.8 2.2 2.2 4.4-4.8"/>'),
    "guvenli-odeme": ("Güvenli ödeme", '<path class="f" d="M4.5 5h13a2 2 0 0 1 2 2v2.500h-17V7a2 2 0 0 1 2-2z"/><path d="M12.5 16h-8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4"/><path d="M2.5 9.5h17"/><rect x="14.5" y="15" width="7" height="5.5" rx="1.3"/><path d="M16.2 15v-1.3a1.8 1.8 0 0 1 3.6 0V15"/>'),
    "kart": ("Ödeme yöntemi", '<rect class="f" x="3" y="5.5" width="18" height="13" rx="2.2"/><rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18M6.5 14.5h4"/>'),
    "takip": ("Sipariş takibi", '<path class="f" d="M3 7h11v9H3z"/><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/>'),
    "destek": ("Destek", '<rect class="f" x="3.5" y="12.5" width="3.5" height="5.5" rx="1.5"/><rect class="f" x="17" y="12.5" width="3.5" height="5.5" rx="1.5"/><path d="M5 13.5V12a7 7 0 0 1 14 0v1.500"/><rect x="3.5" y="12.5" width="3.5" height="5.5" rx="1.5"/><rect x="17" y="12.5" width="3.5" height="5.5" rx="1.5"/><path d="M18.8 18c0 1.900-1.700 2.800-4.300 2.800"/><circle cx="13.3" cy="20.800" r="1"/>'),
    "iade": ("İade", '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 5v4h4"/><path class="f" d="M9.5 10.800 12 9.500l2.500 1.300v3L12 15.100l-2.500-1.300z"/><path d="M9.5 10.800 12 9.500l2.500 1.300v3L12 15.100l-2.500-1.300z"/><path d="M9.5 10.800 12 12.100l2.500-1.300M12 12.100v3"/>'),
    # Ödeme yöntemleri. Marka logosu kullanılmaz. Piktogram yöntemin türünü gösterir.
    "banka": ("Banka havalesi (EFT)", '<path class="f" d="M4 9.500 12 4l8 5.500z"/><path d="M4 9.500 12 4l8 5.500z"/><path d="M6.500 12.500v5M10.200 12.500v5M13.800 12.500v5M17.500 12.500v5"/><path d="M3.500 20.500h17"/>'),
    "cuzdan": ("Dijital cüzdan", '<path class="f" d="M4 7.500h14.500A1.500 1.500 0 0 1 20 9v9.500a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 18.500z"/><path d="M4 7.500V6.300a1.800 1.800 0 0 1 1.800-1.800H17v3"/><path d="M4 7.500h14.500A1.500 1.500 0 0 1 20 9v9.500a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 18.500z"/><circle cx="16" cy="13.800" r="1.200"/>'),
    "cek": ("Çek ve senet", '<rect class="f" x="3" y="6.500" width="18" height="11" rx="1.800"/><rect x="3" y="6.500" width="18" height="11" rx="1.800"/><path d="M6.500 10.500h6M6.500 14h3"/><path d="M13.500 14.200c1-1.600 1.800-1.600 2.300 0s1.300 1.300 2.200-.400"/>'),
    "taksit": ("Taksitli ödeme", '<rect class="f" x="4" y="5.500" width="16" height="14.500" rx="2"/><rect x="4" y="5.500" width="16" height="14.500" rx="2"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/><path d="M8 14.500h.010M12 14.500h.010M16 14.500h.010"/>'),
    "tek-odeme": ("Tek ödeme", '<path d="M3 6h3.500c3 0 3.500 6 6.500 6M3 18h3.500c3 0 3.500-6 6.500-6M3 12h18M17.500 8.500 21 12l-3.500 3.500"/>'),
    # Ticari koşullar
    "fiyat": ("Birim fiyat", '<path class="f" d="M4 4h7.5L20 12.5 12.5 20 4 11.5z"/><path d="M4 4h7.5L20 12.5 12.5 20 4 11.5z"/><circle cx="8.3" cy="8.3" r="1.3"/>'),
    "adet": ("En az sipariş adedi", '<rect class="f" x="8" y="5" width="8" height="7" rx="1"/><rect x="3.5" y="13" width="8" height="7" rx="1"/><rect x="12.5" y="13" width="8" height="7" rx="1"/><rect x="8" y="5" width="8" height="7" rx="1"/><path d="M7.5 13v2.500M16.500 13v2.500M12 5v2.500"/>'),
    "sure": ("Hazırlık süresi", '<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    "koli": ("Koli", '<path class="f" d="m4 8 8-4 8 4v8l-8 4-8-4z"/><path d="m4 8 8-4 8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>'),
    # Taraflar
    "uretici": ("Üretici", '<path class="f" d="M3 20V11l5 3v-3l5 3V5h3.5L18 20z"/><path d="M3 20V11l5 3v-3l5 3V5h3.5L18 20"/><path d="M2 20h20"/><path d="M7 17h1.500M11.500 17H13"/>'),
    "magaza": ("Mağaza", '<path class="f" d="M5 4.5h14l1.5 5h-17z"/><path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5' + SCALLOP + '"/><path d="M5 12.5V20h14v-7.500"/><path d="M10 20v-4.500h4V20"/>'),
    "ekran-carsi": ("Çarşı ekranınızda", '<rect class="f" x="3" y="4" width="18" height="12.5" rx="2"/><rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M9 20.500h6M12 16.500v4"/><path d="M7.5 9 8.500 7h7l1 2"/><path d="M7.5 9a1.500 1.500 0 0 0 3 0 1.500 1.500 0 0 0 3 0 1.500 1.500 0 0 0 3 0"/><path d="M8.500 11v2.500h7V11"/>'),
    # Durum
    "onay-daire": ("Tamamlandı", '<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.5 2.5 4.9-5.200"/>'),
    "uyari": ("Dikkat", '<path class="f" d="M12 4 3 19.500h18z"/><path d="M12 4 3 19.500h18z"/><path d="M12 10v4.500M12 17v.100"/>'),
    "bilgi": ("Bilgi", '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.100"/>'),
    # Kategoriler
    "tencere": ("Ev ve mutfak", '<path class="f" d="M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M3 10h18M9.500 6.500c0-1 1-1 1-2.200M13.500 6.500c0-1 1-1 1-2.200"/>'),
    "fincan": ("Gıda ve içecek", '<path class="f" d="M6 8h10v6a5 5 0 0 1-10 0z"/><path d="M6 8h10v6a5 5 0 0 1-10 0z"/><path d="M16 9.500h1.500a2.500 2.500 0 0 1 0 5H16M5 20.500h12"/>'),
    "sprey": ("Temizlik ve hijyen", '<path class="f" d="M9 10h5l1 3v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-6z"/><path d="M9 10h5l1 3v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-6z"/><path d="M10 10V5.500h4v2h-2M17.500 5h.010M19.500 7.500h.010M19.500 3h.010"/>'),
    "bina": ("İnşaat ve yapı", '<path class="f" d="M10 10h10v10H10z"/><path d="M4 20V9l6-4v15M10 20V10h10v10M3 20h18M14 13.500h2M14 16.500h2M6.500 12h1M6.500 15h1"/>'),
    "hediye": ("Promosyon", '<rect class="f" x="4" y="9" width="16" height="11" rx="1.5"/><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.500-3-5-3.500-5-1.500S9.500 9 12 9zM12 9c1.500-3 5-3.500 5-1.500S14.500 9 12 9z"/>'),
    "simsek": ("Elektrik", '<path class="f" d="M13 3 5 13.500h6L10 21l8-10.500h-6z"/><path d="M13 3 5 13.500h6L10 21l8-10.500h-6z"/>'),
    "anahtar": ("Hırdavat", '<path d="M15 5a4.500 4.500 0 0 0-4.300 5.800L4.500 17A1.800 1.800 0 0 0 7 19.500l6.200-6.200A4.500 4.500 0 0 0 19 9l-3 1.500L14.500 8 16 5.200A4.500 4.500 0 0 0 15 5z"/>'),
    "damla": ("Kozmetik ve bakım", '<path class="f" d="M12 3.500c3 3.600 5.500 6.500 5.500 9.700a5.500 5.500 0 0 1-11 0C6.500 10 9 7.100 12 3.500z"/><path d="M12 3.500c3 3.600 5.500 6.500 5.500 9.700a5.500 5.500 0 0 1-11 0C6.500 10 9 7.100 12 3.500z"/>'),
    "alev": ("Endüstriyel mutfak", '<path class="f" d="M12 3c1 3 4.500 4.500 4.500 9a4.500 4.500 0 0 1-9 0c0-1.500.600-2.700 1.500-3.500.300 1.500 1 2.200 2 2.500C10.500 8.500 11 5.500 12 3z"/><path d="M12 3c1 3 4.500 4.500 4.500 9a4.500 4.500 0 0 1-9 0c0-1.500.600-2.700 1.500-3.500.300 1.500 1 2.200 2 2.500C10.500 8.500 11 5.500 12 3zM7 21h10"/>'),
    "zil": ("Otel, restoran, kafe", '<path class="f" d="M5 17a7 7 0 0 1 14 0z"/><path d="M5 17a7 7 0 0 1 14 0zM3 17h18M12 10V7.500M10.500 7.500h3"/>'),
    "koltuk": ("Mobilya", '<path class="f" d="M4 12.500a1.500 1.500 0 0 1 3 0V15h10v-2.500a1.500 1.500 0 0 1 3 0V18H4z"/><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M4 12.500a1.500 1.500 0 0 1 3 0V15h10v-2.500a1.500 1.500 0 0 1 3 0V18H4z"/><path d="M6 18v2M18 18v2"/>'),
    "filiz": ("Tarım ve hayvancılık", '<path class="f" d="M12 13c0-3-2-5-6-5 0 3.500 2 5 6 5z"/><path d="M12 21v-8"/><path d="M12 13c0-3-2-5-6-5 0 3.500 2 5 6 5z"/><path d="M12 11c0-3.500 2.500-6 6.500-6 0 4-2.500 6-6.500 6z"/>'),
    "araba": ("Otomotiv", '<path class="f" d="M3.500 17v-4l2-5h13l2 5v4z"/><path d="M3.500 17v-4l2-5h13l2 5v4z"/><path d="M5 12.500h14"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/>'),
    "kalem": ("Kırtasiye ve ofis", '<path class="f" d="m4 20 1-4L16 5l3 3L8 19z"/><path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3"/>'),
    # Dizin ve içerik türleri
    "malzeme": ("Malzeme", '<path class="f" d="m12 4 8 4-8 4-8-4z"/><path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/>'),
    "kullanim": ("Kullanım yeri", '<circle class="f" cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.500"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3"/>'),
    "ozellik": ("Özellik", '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle class="f" cx="15" cy="7" r="2"/><circle cx="15" cy="7" r="2"/><circle class="f" cx="9" cy="12" r="2"/><circle cx="9" cy="12" r="2"/><circle class="f" cx="17" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'),
    "gorunum": ("Desen ve görünüm", '<rect class="f" x="4" y="4" width="16" height="16" rx="2.500"/><rect x="4" y="4" width="16" height="16" rx="2.500"/><path d="M4.500 12 12 4.500M4.500 19 19 4.500M12 19.500l7.500-7.500"/>'),
    "matris": ("İki özellik birlikte", '<rect class="f" x="9.500" y="9.500" width="5" height="5"/><rect x="3.500" y="3.500" width="11" height="11" rx="2"/><rect x="9.500" y="9.500" width="11" height="11" rx="2"/>'),
    "liste": ("Sıralı liste", '<path d="M4.500 6.500h.010M4.500 12h.010M4.500 17.500h.010"/><path d="M9 6.500h11M9 12h8M9 17.500h5"/>'),
    "rehber": ("Rehber", '<path class="f" d="M3.500 6c3-1 5.500-.800 8.500.800v12c-3-1.600-5.500-1.800-8.500-.800z"/><path d="M12 6.800C9 5.200 6.500 5 3.500 6v12c3-1 5.500-.800 8.500.800 3-1.600 5.500-1.800 8.500-.800V6c-3-1-5.500-.800-8.500.800zM12 6.800v12"/>'),
    "soru": ("Soru ve yanıt", '<path class="f" d="M4 5h16v11H9.500L5 19.500V16H4z"/><path d="M4 5h16v11H9.500L5 19.500V16H4z"/><path d="M10 9.200a2 2 0 1 1 2.800 1.900c-.500.300-.800.700-.800 1.200M12 14.200v.100"/>'),
    "dizin": ("Dizin", '<rect class="f" x="8.500" y="3.500" width="7" height="4.500" rx="1"/><rect x="8.500" y="3.500" width="7" height="4.500" rx="1"/><rect x="3" y="15.500" width="6" height="4.500" rx="1"/><rect x="15" y="15.500" width="6" height="4.500" rx="1"/><path d="M12 8v4M6 15.500V12h12v3.500"/>'),
    "kural": ("Kural ve sözleşme", '<path d="M12 4v16M7.500 20h9M5 7.500h14"/><path class="f" d="M2.500 13.500 5 7.500l2.500 6a2.500 2.500 0 0 1-5 0z"/><path d="M2.500 13.500 5 7.500l2.500 6a2.500 2.500 0 0 1-5 0zM16.500 13.500 19 7.500l2.500 6a2.500 2.500 0 0 1-5 0z"/>'),
    "arac": ("Araç", '<rect class="f" x="5" y="3" width="14" height="18" rx="2.200"/><rect x="5" y="3" width="14" height="18" rx="2.200"/><path d="M8.500 7h7"/><path d="M8.500 11.500h.010M12 11.500h.010M15.500 11.500h.010M8.500 14.800h.010M12 14.800h.010M15.500 14.800h.010M8.500 18h.010M12 18h.010M15.500 18h.010"/>'),
    # Arayüz simgeleri
    "ara": ("Ara", '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>'),
    "sepet": ("Sepet", '<path d="M3 4h2.500l2.200 11h10.600L20.500 7H7"/><circle cx="9.500" cy="19" r="1.400"/><circle cx="17" cy="19" r="1.400"/>'),
    "kisi": ("Hesap", '<circle cx="12" cy="8" r="4"/><path d="M4.500 20c1.200-3.600 4-5.200 7.500-5.200s6.300 1.600 7.500 5.200"/>'),
    "belge": ("Belge", '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'),
    "konum": ("Teslimat ülkesi", '<path d="M12 21s7-6.200 7-11.500a7 7 0 0 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    "kure": ("Dil ve para birimi", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.800 3 2.800 15 0 18M12 3c-2.800 3-2.800 15 0 18"/>'),
    "izgara": ("Kategoriler", '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
    "ev": ("Ana sayfa", '<path d="M4 11 12 4l8 7v9h-5.500v-5.500h-5V20H4z"/>'),
    "asagi": ("Aç", '<path d="m6 9 6 6 6-6"/>'),
    "ok": ("İlerle", '<path d="M5 12h14M13 6l6 6-6 6"/>'),
    "sol": ("Geri", '<path d="m15 6-6 6 6 6"/>'),
    "sag": ("İleri", '<path d="m9 6 6 6-6 6"/>'),
    "onay": ("Tamam", '<path d="m5 12.500 4.500 4.500L19 7.500"/>'),
    "arti": ("Ekle", '<path d="M12 5v14M5 12h14"/>'),
    "eksi": ("Azalt", '<path d="M5 12h14"/>'),
    "yukari": ("Başa dön", '<path d="M12 19V5M6 11l6-6 6 6"/>'),
}


def _tidy(svg):
    # Yazım kolaylığı için kullanılan ".500" gibi sondaki sıfırları temizler.
    return re.sub(r"(\.\d*?[1-9])0+(?=[^\d]|$)", r"\1", svg)


def icon(name, size=24, cls=""):
    """Çıplak simge. Düğme ve bağlantı içinde, etiketin yanında kullanılır."""
    body = _tidy(PICTO[name][1])
    c = ' class="%s"' % cls if cls else ""
    return (
        '<svg%s width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>' % (c, size, size, body)
    )


def picto(name, size="md", tone=""):
    """Zeminli piktogram. Anlamı her zaman yanındaki metin taşır, bu yüzden okuyucudan gizlidir.
    size: sm, md, lg. tone: "", ok, ink."""
    px = {"sm": 20, "md": 24, "lg": 32}[size]
    cls = "picto picto--%s%s" % (size, " picto--" + tone if tone else "")
    # Çizilerek belirme hareketi için her çizgi parçasına birim uzunluk ve "s" sınıfı verilir.
    # Seçici sınıfı kullanır. Büyük harfli SVG özniteliğine ([pathLength]) bağlı seçici,
    # Chromium'da üst öğenin sınıfı değişince yeniden hesaplanmıyor.
    body = re.sub(r"<(path|circle|rect)(?! class=\"f\")", r'<\1 class="s" pathLength="1"', _tidy(PICTO[name][1]))
    return (
        '<span class="%s" aria-hidden="true"><svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" focusable="false">%s</svg></span>' % (cls, px, px, body)
    )


# Başvuru sayfası için gruplar. Sıra, alıcının ve satıcının süreçteki sırasını izler.
GROUPS = [
    ("Güven ve doğrulama", ["kalkan", "isletme", "kimlik", "kilit", "gizlilik"]),
    ("Belge ve kayıt", ["belge-yukle", "belge-onay", "kayit", "fatura"]),
    ("Sipariş süreci", ["teklif", "mesaj", "siparis", "guvenli-odeme", "takip", "destek", "iade"]),
    ("Ödeme yöntemleri", ["kart", "cuzdan", "banka", "cek", "taksit", "tek-odeme"]),
    ("Ticari koşullar", ["fiyat", "adet", "sure", "koli"]),
    ("Taraflar", ["uretici", "magaza", "ekran-carsi"]),
    ("Durum", ["onay-daire", "uyari", "bilgi"]),
    ("Dizin ve içerik türleri", ["malzeme", "kullanim", "ozellik", "gorunum", "matris", "liste", "rehber", "soru", "dizin", "kural", "arac"]),
    ("Kategoriler", ["tencere", "fincan", "sprey", "bina", "hediye", "simsek", "anahtar", "damla", "alev", "zil", "koltuk", "filiz", "araba", "kalem"]),
]


def sheet():
    """Bütün piktogramları etiketleriyle gösteren tek bir SVG başvuru sayfası üretir."""
    cols, cell_w, cell_h, pad, head_h = 4, 230, 132, 40, 56
    parts, y = [], pad + 108
    for title, keys in GROUPS:
        parts.append('<text x="%d" y="%d" class="g">%s</text>' % (pad, y, title))
        y += head_h - 24
        for i, key in enumerate(keys):
            cx = pad + (i % cols) * cell_w
            cy = y + (i // cols) * cell_h
            ok = key in ("kalkan", "belge-onay", "onay-daire")
            body = _tidy(PICTO[key][1])
            parts.append(
                '<g transform="translate(%d %d)"><rect width="56" height="56" rx="14" fill="%s"/>'
                '<g transform="translate(14 14) scale(1.1667)" fill="none" stroke="%s" color="%s" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">%s</g>'
                '<text x="0" y="82" class="n">%s</text><text x="0" y="102" class="k">%s</text></g>'
                % (cx, cy, "#e0f2e9" if ok else "#e3edf7", "#0a6b48" if ok else "#204a79", "#0a6b48" if ok else "#204a79", body, PICTO[key][0], key)
            )
        y += ((len(keys) - 1) // cols + 1) * cell_h + 28
    width, height = pad * 2 + cols * cell_w, y
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" lang="tr" xml:lang="tr" width="%d" height="%d" viewBox="0 0 %d %d" role="img" aria-labelledby="t d">'
        '<title id="t">iStoc piktogram seti</title><desc id="d">Her piktogram anlamı ve adıyla birlikte gösterilir.</desc>'
        "<style>text{font-family:Ubuntu,system-ui,-apple-system,'Segoe UI',sans-serif;fill:#0a1829}"
        ".h{font-size:28px;font-weight:700}.s{font-size:16px;fill:#3b4a5d}.g{font-size:14px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;fill:#255d9d}"
        ".n{font-size:15px;font-weight:500}.k{font-size:14px;fill:#586679}.f{fill:currentColor;fill-opacity:.16;stroke:none}</style>"
        '<rect width="100%%" height="100%%" fill="#ffffff"/>'
        '<text x="%d" y="%d" class="h">iStoc piktogram seti</text>'
        '<text x="%d" y="%d" class="s">24 birimlik ızgara, 1,75 birimlik çizgi, yuvarlak uç. Her piktogram etiketiyle birlikte kullanılır.</text>'
        "%s</svg>\n" % (width, height, width, height, pad, pad + 20, pad, pad + 48, "".join(parts))
    )


if __name__ == "__main__":
    import io
    import os

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "piktogramlar.svg")
    io.open(out, "w", encoding="utf-8").write(sheet())
    print("piktogramlar.svg yazıldı: %d piktogram, %d grup" % (sum(len(k) for _, k in GROUPS), len(GROUPS)))
