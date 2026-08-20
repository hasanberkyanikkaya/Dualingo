# Namaz Vakti Veri Kaynağı — Araştırma ve Karar

**Oturum 4.0 · 20.08.2026 · BLOKLAYICI araştırma, kod yazılmadı**

Bu belge Faz 4'ün (namaz modülü) veri kaynağı kararını ve o kararın dayandığı
araştırmayı kayıt altına alır. Sağlayıcı ileride değiştirilmek istenirse
araştırma sıfırdan yapılmasın diye elenen seçenekler de gerekçeleriyle duruyor.

---

## 0. Kararı belirleyen kısıtlar

- **Çevrimdışı çalışmak zorunda.** Mimari kural 7: içerik pakete gömülü.
  Namaz vakti internetsiz görünmüyorsa modül kırık demektir.
- **Bildirim geleceği bilmek ister.** Zamanlanmış bildirim, uygulama kapalıyken
  tetiklenecek. "Bugünün vaktini çek" yeterli değil; ileri veri şart.
- **Türkiye pazarı Diyanet'e bakıyor.** Kullanıcı vakti
  namazvakitleri.diyanet.gov.tr ile karşılaştırır; 3 dakikalık fark hatadır.
- **Sunucumuz yok.** Bulut Faz 7'de. API anahtarını istemciye gömmek onu ifşa
  etmektir.

---

## 1. Diyanet'in resmi API'si — VAR, ama istemciden kullanılamaz

**Awqat Salah REST API Servisi** (Din İşleri Yüksek Kurulu)

| | |
|---|---|
| Adres | `https://awqatsalah.diyanet.gov.tr/` |
| Kimlik doğrulama | `POST /Auth/Login` (e-posta + parola) → JWT. Erişim jetonu 45 dk, yenileme 15 dk |
| Kayıt | **Self-servis DEĞİL.** Sitedeki form doldurulup belirtilen adrese gönderilir, hesap açılması beklenir |
| Kapsam | Ülke → eyalet → şehir, şehir detayı (kıble açısı, Kâbe uzaklığı), günlük/haftalık/aylık/Ramazan vakitleri, tarih aralığı (yıllık), günün içeriği |
| Resmi örnek proje | `github.com/DinIsleriYuksekKurulu/AwqatSalah` (MIT, .NET) |

### Kullanımı bloke eden şey: istek limitleri

> "Awqat Salah Rest Api Servisi herkesin eş zamanlı ve sürekli faydalanabilmesi
> için **servis bazında 5 (beş) erişim** ile sınırlandırılmıştır."

- Hesap açıldıktan sonraki **ilk 15 gün** limit 5 yerine **100**.
- **Tarih aralığı (yıllık) endpoint'i ayrıca aylık 10 istek** ile sınırlı.
- ⚠️ Limitin **periyodu** (günlük mü aylık mı) resmi metinde yazmıyor; bakılan
  altı bağımsız kaynağın hiçbiri netleştirmiyor.

Periyot ne olursa olsun sonuç aynı: **mobil istemciden doğrudan çağrılamaz.**
Kullanmak için önbellekli bir proxy sunucu gerekir — yani Faz 7'yi Faz 4'e çekmek.

---

## 2. Yıllık veriyi yasal olarak almanın yolları

**a) Resmi başvuru — temiz yol.** Awqat Salah formu zaten bir başvuru kanalı.
Aynı kanaldan "tabloların uygulamaya gömülmesi" için yazılı izin ve daha yüksek
kota talep edilebilir. Maliyet: bir dilekçe + belirsiz bekleme.

**b) Siteden toplu kazıma — ⚠️ HUKUKİ RİSK, YAPILMAYACAK.**
FSEK **Ek Madde 8** (sui generis veritabanı koruması) veritabanı yapımcısına,
içeriğin *"önemli bir kısmının veya tamamının başka bir ortama aktarılması,
dağıtılması, satılması veya topluma iletilmesine izin verme veya yasaklama"*
hakkı veriyor. **Eser niteliği aranmıyor, "büyük emek ve yatırım" yeterli.**
973 ilçe × 365 günlük tablonun tamamını çekip pakete gömmek tam olarak
"tamamının aktarılması"dır. Ek olarak:
- Verinin kamuya açık olması yeniden yayın hakkı vermiyor.
- Kurum adının kullanımı mağaza tarafında ayrı bir risk (impersonation).

**c) Veriyi değil, yayınlanan yöntemi kullanmak.** Hukuken en temiz yol (bkz. §4).

---

## 3. Üçüncü taraf seçenekler

| Kaynak | Veri | Anahtar | Limit | Şartlar | Risk |
|---|---|---|---|---|---|
| **ezanvakti.emushaf.net** | **Diyanet'in yayınladığı tablolar** | Yok | Belgelenmemiş | **Yazılı şart / lisans YOK** | Tek kişilik gönüllü proje (Furkan Tektaş). SLA yok, kapanabilir. Diyanet'i proxy'lediği için `502` dönebilir |
| **vakit.vercel.app** (`canbax/namaz-vakti-api`) | **Hesaplanmış** (`adhan-js`) | Yok | 33 istek / 15 dk | MIT, kendin barındırabilirsin | Vercel'de kişisel proje |
| **Aladhan** (`api.aladhan.com`) | Hesaplanmış (praytimes.org), `method=13` Diyanet | Yok | Yayımlanmış limit yok | **Garantisiz** ("WITHOUT ANY WARRANTY") | Yaygın ve uzun ömürlü ama sözleşmesiz |
| **CollectAPI** | Ticari toplayıcı | **Var** | Ücretsiz 1.000 istek/ay | Ticari şartlar | Anahtar istemciye gömülemez → sunucu gerektirir |

---

## 4. Cihazda hesaplama (`adhan`) — elenmedi ama seçilmedi

`adhan` (npm v4.4.4, MIT, **saf JavaScript**, TS tipleri dahil, yerel modül yok
→ Expo Go'da çalışır).

### Kayda değer bulgu: `adhan`'ın Turkey yöntemi = Diyanet'in yayınladığı temkin

`adhan-js/src/CalculationMethod.ts`:

```
Turkey() {
  const params = new CalculationParameters('Turkey', 18, 17);
  params.methodAdjustments = { sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7 };
}
```

Diyanet'in kendi temkin sayfasıyla (`vakithesaplama.diyanet.gov.tr/temkin.php`):

| Vakit | Diyanet'in yayınladığı temkin | `adhan` Turkey |
|---|---|---|
| İmsak | temkin **yok** | 18° (düzeltme yok) ✅ |
| Güneş | doğuştan **7 dk önce** | `sunrise: -7` ✅ |
| Öğle | zevalden **5 dk sonra** | `dhuhr: +5` ✅ |
| İkindi | **4 dk** | `asr: +4` ✅ |
| Akşam | batıştan **7 dk sonra** | `maghrib: +7` ✅ |
| Yatsı | temkin **yok** | 17° (düzeltme yok) ✅ |

İkindi mezhep ayarı da uyuyor: Diyanet Takvimi ikindiyi **asr-ı evvel** (gölge
bir misli) esasına göre veriyor — `adhan`'ın **varsayılan** `Madhab.Shafi`
davranışı. Ayar gerekmiyor.

**Bilinen sapmalar:** imsak derecesi 18° mi 19° mu tartışmalı · rakım düzeltmesi
yok (1500 m'de ≥1 dk) · Diyanet ilçe **merkezinden** hesaplıyor, GPS'ten
hesaplarsak küçük farklar çıkar · `Turkey()` Türkiye dışında güvenilmiyor
(kütüphanenin kendi uyarısı). Üçünün de çözümü `PrayerAdjustments` ile ucuz.

---

## 5. Karşılaştırma

| | Erişim | Çevrimdışı | Şartlar | Uzun vadeli risk | Uygulama maliyeti |
|---|---|---|---|---|---|
| **A. Diyanet resmi API** | Form ile başvuru, JWT | ❌ | Resmi, net | Düşük ama **kota ölümcül** | **Yüksek** — proxy sunucu şart |
| **B. Üçüncü taraf mirror** | Anahtarsız HTTP | ⚠️ önbellekle | **Yazılı şart yok** | **Yüksek** — kişisel proje | Orta |
| **C. Cihazda hesaplama** | npm paketi | ✅ | MIT | Çok düşük | Orta |
| **D. Yıllık tabloyu gömmek** | Kazıma | ✅ | **FSEK Ek m.8 riski** | Hukuki + ~4 MB paket | Yüksek |

---

## 6. KARAR

> ### Kaynak: **B — `ezanvakti.emushaf.net`** (Diyanet tablolarının mirror'ı)
> ### Kapsam: **yalnızca Türkiye** (v0.3)

Araştırmanın önerisi **C** idi (`adhan` ile cihazda hesaplama). **Kullanıcı B'yi
seçti**; gerekçe: B **hesaplanmış değil, Diyanet'in fiilen yayınladığı
rakamlar** — kullanıcı uygulamayı Diyanet sitesiyle karşılaştırdığında sapma
ihtimali sıfır.

### ⚠️ Bu kararla bilerek üstlenilen iki risk

1. **Servis tek kişilik gönüllü bir projedir ve yazılı kullanım şartı yoktur.**
   Kapanabilir, adres değiştirebilir; veriyi yeniden yayınlama izni belirsizdir.
   → Karşı önlem: kaynak **tek bir arayüzün arkasına** kapatılacak, sağlayıcı
   değişimi tek dosyalık iş olacak (§9).
2. **Servis Diyanet'i proxy'liyor; `502` dönebilir.**
   → Karşı önlem: SQLite önbelleği (§8).

### Kararı uygulanabilir kılan bulgu (canlı doğrulandı, 20.08.2026)

`GET /vakitler/{ilceID}` **tek gün değil, bir aylık pencere** döndürüyor
(ölçülen: 32 kayıt). Bu, B'nin "çevrimdışı çalışmaz" kusurunu ortadan kaldırıyor:
bir istek bir aylık veri getiriyor, SQLite'a yazılıyor, uygulama aradaki bütün
gün boyunca **internetsiz** çalışıyor ve bildirimler önden kurulabiliyor.

#### ⚠️ Ama pencere BUGÜNDEN BAŞLAMIYOR — servis ilçe başına önbellekli

20.08.2026'da üç ilçe için ölçüldü:

| İlçe | Kayıt | Pencere | Bugünden sonrası |
|---|---|---|---|
| 9541 | 32 | 15.08.2026 → 15.09.2026 | 26 gün |
| 9206 | 32 | 16.08.2026 → 16.09.2026 | 27 gün |
| 9335 | 32 | 17.08.2026 → 17.09.2026 | 28 gün |

Başlangıç tarihi **ilçeye göre değişiyor** ve hiçbiri bugün değil. Yani mirror,
her ilçe için Diyanet'ten en son ne zaman çektiyse o pencereyi saklıyor ve aynen
sunuyor. Faz 4.1 için üç bağlayıcı sonuç:

1. **`data[0]` bugün DEĞİLDİR.** Bugünün kaydı tarih eşleşmesiyle aranmalı.
2. **Yanıt GEÇMİŞ günler içerir** — yazmadan önce süzülmeli ya da geçmiş günler
   de yazılıp okuma tarafında filtrelenmeli.
3. **Yenileme eşiği kayıt SAYISINDAN hesaplanamaz.** Ölçüt, yanıttaki **en son
   tarih** ile bugün arasındaki fark olmalı. Kayıt sayısı da sabit değil: aynı
   ilçe 15 dakika arayla 34 ve 32 kayıt döndürdü.
4. **En kötü hâl:** önbellek yeterince bayatlarsa pencere tamamen geçmişte kalır
   ve **bugünün kaydı hiç gelmez.** Bu durum bir hata gibi değil, boş durum gibi
   ele alınmalı.

Canlı örnek (ilçe 9541, penceresinin ilk günü olan 15.08.2026):

```json
{"MiladiTarihKisaIso8601":"15.08.2026","GreenwichOrtalamaZamani":3.0,
 "Imsak":"04:29","Gunes":"06:07","Ogle":"13:14","Ikindi":"17:03",
 "Aksam":"20:11","Yatsi":"21:41",
 "GunesDogus":"06:14","GunesBatis":"20:04","KibleSaati":"12:13"}
```

**Verinin gerçekten Diyanet olduğunun kanıtı bu yanıtın içinde:**
`Gunes` (06:07) ile `GunesDogus` (06:14) arası tam **7 dk**; `Aksam` (20:11) ile
`GunesBatis` (20:04) arası tam **7 dk** — §4'teki temkin tablosunun birebir
kendisi. Yani veri hesaplanmış değil, kurumun yayınladığı tablo.

### `adhan` neden tamamen elenmedi

Yedek olarak düşünülebilir (önbellek boş + ağ yok + hiç veri görülmemiş ilk
açılış). Ama iki kaynağın rakamları farklı olacağı için bu **Faz 4.1'de ayrıca
karar verilecek bir konudur.** Varsayılan tutum: **yedek koymamak**, boş durumu
dürüstçe göstermek. İki sayı arasında sessizce gidip gelmek, kullanıcının
güvenini kaybettiren türden bir hatadır.

---

## 7. Servis sözleşmesi (OpenAPI 0.6.0, doğrulandı)

Taban adres: `https://ezanvakti.emushaf.net`

| Endpoint | Döndürdüğü |
|---|---|
| `GET /ulkeler` | 209 ülke — `{UlkeAdi, UlkeAdiEn, UlkeID}`. **Türkiye: `UlkeID: "2"`** |
| `GET /sehirler/{ulkeID}` | `{SehirAdi, SehirAdiEn, SehirID}` |
| `GET /ilceler/{sehirID}` | `{IlceAdi, IlceAdiEn, IlceID}` |
| `GET /vakitler/{ilceID}` | ~1 aylık dizi (ölçülen 32 kayıt). ⚠️ **Bugünden başlamaz**, bkz. §6 |

Vakit kaydının alanları:
`Imsak · Gunes · Ogle · Ikindi · Aksam · Yatsi · GunesDogus · GunesBatis ·
KibleSaati · MiladiTarihKisa · MiladiTarihKisaIso8601 · MiladiTarihUzun ·
MiladiTarihUzunIso8601 · HicriTarihKisa · HicriTarihUzun ·
HicriTarihKisaIso8601 · HicriTarihUzunIso8601 · AyinSekliURL ·
GreenwichOrtalamaZamani`

Hata kodları: `422` (geçersiz parametre), `502` (Diyanet'e ulaşılamıyor).

### ⚠️ İki tuzak

- **`HicriTarih*Iso8601` alanları `null` geliyor.** Güvenilmemeli; Hicri tarih
  gerekiyorsa `HicriTarihKisa` (`"2.3.1448"`) ayrıştırılır.
- **`MiladiTarihKisaIso8601`'in adı yanıltıcı: içeriği ISO değil**, `"15.08.2026"`
  biçiminde. Projenin `'YYYY-MM-DD'` yerel tarih kuralına (Faz 3.1) çevrilmesi
  gerekiyor.

---

## 8. Çevrimdışı stratejisi — kararın zorunlu tamamlayıcısı

Mirror API tek başına çevrimdışını çözmüyor; çözen şey **önbellek**:

- Vakitler `lib/database.ts`'teki **aynı `.db`'ye** yazılır; yeni tablo
  `MIGRATIONS` dizisinin **SONUNA** eklenir (Faz 3.1'in değişmez kuralı —
  `PRAGMA user_version` veritabanı başına tek sayaç, aradan madde silinmez).
- Tablo `updatedAt` + `deletedAt` taşır (mimari kural 6), sert silme yok.
- Anahtar `(ilceId, date)`; `date` `'YYYY-MM-DD'` — Faz 3.1'in `toLocalIsoDate`
  kuralı, **`toISOString()` kullanılmaz** (akşam 23:30'da gün kayar).
- Yenileme eşiği **kalan GÜN sayısına** göre (ör. < 7 gün), kayıt sayısına göre
  değil — §6'daki önbellek bulgusu yüzünden. Uygulama her açılışta ağa çıkmaz.
- ⚠️ **Yenileme her zaman ileri gitmeyebilir.** Mirror'ın o ilçe için önbelleği
  bayatsa, yenileme isteği **aynı eski pencereyi** geri getirir. Bu bir hata
  değil; ısrarla yeniden denemek yerine bir sonraki açılışa bırakılmalı.
- Ağ yok + önbellek dolu → **hiçbir şey değişmez**, kullanıcı farkı görmez.
- Ağ yok + önbellek boş (ya da penceresi tamamen geçmişte) → boş durum
  gösterilir (§6 sonu).

---

## 9. Faz 4.1 ve sonrası için bağlayıcı sonuçlar

- **Sağlayıcı tek arayüzün arkasında.** `features/prayer/` içinde saf çekirdek
  (ayrıştırma, tarih dönüşümü, sonraki vakit hesabı — `expo-*` bilmez, Node
  testleriyle kapsanır) + ince ağ katmanı. Faz 3.1'deki `dayLog` / `activityDb`
  ayrımının aynısı; **saf dosya ağ/DB dosyasını asla import etmez.**
- **İlçe seçimi kullanıcıdan.** `expo-location` **zorunlu değil**, yalnızca
  "konumumu bul" kısayolu. Konum izni istemeden çalışan bir yol kalmalı.
- **Kıble için ekstra kaynak gerekmiyor:** yanıt zaten `KibleSaati` taşıyor.
  Pusula açısı için `expo-sensors` ayrı madde.
- ⚠️ **Mağaza metni "Diyanet onaylı / resmi" DEMEZ.** Veri Diyanet'in yayınladığı
  tablodur ama uygulama Diyanet'in değildir ve kurumla anlaşması yoktur. Doğru
  ifade: *"Diyanet İşleri Başkanlığı'nın yayınladığı vakitler"*, ekranda
  **atıfla**. Hem hukuki hem mağaza incelemesi meselesi.
- **`app.json` izin temizliği burada çözülür** (mağaza raporundaki yayın engeli):
  konum ve bildirim ilk kez gerçekten kullanılacağı için kalır; `RECORD_AUDIO`
  ve ön plan servisi hâlâ kullanılmıyorsa kaldırılır.
- ⚠️ **Gizlilik politikası ve veri güvenliği formu güncellenecek.**
  `Planlamalar/Magaza/` altındaki belgeler bugün "cihazdan çıkan iki istek"
  diyor; namaz modülü **üçüncü bir uzak sunucu** (`emushaf.net`) ekliyor ve
  **konum** devreye giriyor. İkisi de formu geçersiz kılan değişiklik
  listesinde zaten yazılı.

---

## 10. Açık kalan sorular

1. **Awqat Salah limitinin periyodu** (günlük/aylık/toplam) — yalnızca hesap
   açtırılırsa öğrenilebilir.
2. **`adhan` yedeği konacak mı** — Faz 4.1 kararı, varsayılan "hayır" (§6).
3. **Yurt dışı kullanıcılar** — v0.3 kapsamı yalnızca Türkiye. Genişletilirse
   mirror zaten 209 ülke taşıyor, ama saat dilimi sorunları belgelenmiş.
4. **Rakım düzeltmesi** — B seçildiği için bugün konu dışı; yalnız C'ye
   dönülürse gündeme gelir.

---

## Kaynaklar

- [Diyanet Awqat Salah API](https://awqatsalah.diyanet.gov.tr/index.html) · [resmi örnek proje](https://github.com/DinIsleriYuksekKurulu/AwqatSalah) · [REST servis PDF](https://awqatsalah.diyanet.gov.tr/files/56d83ac4-f7f5-4f6e-9b9e-b1ffeebf1b6a.pdf)
- [ezanvakti API](https://ezanvakti.emushaf.net/) — **seçilen kaynak**
- [Diyanet — Temkin](https://vakithesaplama.diyanet.gov.tr/temkin.php) · [Din İşleri Yüksek Kurulu — asr-ı evvel / asr-ı sani](https://kurul.diyanet.gov.tr/tr/fetva/-asr-i-evvel--ve--asr-i-sani--ne-demektir-/0193c42d-4d64-7acf-2961-12b0db4e1723)
- [adhan-js](https://github.com/batoulapps/adhan-js) · [METHODS.md](https://github.com/batoulapps/adhan-js/blob/master/METHODS.md) · [npm: adhan](https://www.npmjs.com/package/adhan)
- [namaz-vakti-api](https://github.com/canbax/namaz-vakti-api) · [Aladhan şartlar](https://aladhan.com/credits-and-terms) · [CollectAPI](https://collectapi.com/tr/api/pray/namaz-vakitleri-api)
- [FSEK 5846 tam metin](https://mevzuat.gov.tr/mevzuatmetin/1.3.5846.pdf) · [Web kazıma ve veritabanı koruması](https://www.guleryuz.av.tr/tr/news-publications/detail/https-wwwguleryuzavtr-tr-news-publications-detail-web-kazima-web-scraping-ve-internet-sitelerine-yonelik-koruma)
