# Veri Güvenliği / Veri Toplama Formları — önerilen cevaplar

İki mağaza da yayın başvurusunda veri beyanı istiyor: Google Play'de
**Data safety**, App Store'da **App Privacy**. Bu belge, her sorunun bugünkü
koda dayanan cevabını ve o cevabın **hangi dosyadan** çıktığını verir.

> ⚠️ **Bu cevaplar önerilerdir, hukuki görüş değildir.** Formlar bağlayıcıdır:
> yanlış beyan uygulamanın kaldırılmasına yol açabilir. `GIZLILIK_POLITIKASI.md`
> ile birlikte hukuki incelemeden geçirilmelidir.
>
> ⚠️ **Form, gizlilik politikasıyla ve bildirilen izinlerle TUTARLI olmak
> zorundadır.** Üçü birbirini yalanlarsa inceleme buna takılır. Bugün bir
> tutarsızlık var — bkz. "Bölüm 3: İzin sorunu".

---

## Bölüm 0 — Cevapların dayandığı gerçek

Uygulamanın v0.1'de sakladığı ve gönderdiği her şey:

**Cihazda saklanan** (`features/progress/store.ts:132-140`, MMKV üzerinden
`features/progress/storage.ts:31`) — `xpTotal`, `levels` (seviye başına yıldız,
doğruluk, deneme sayısı, zaman damgaları), `streak`, `placement`, `dailyGoal`,
`updatedAt`, `deletedAt`. **Hiçbiri cihazdan çıkmıyor.**

⚠️ **Faz 4.1 ile eklenenler** (`features/prayer/prayerDb.ts`, SQLite
`prayer_district` + `prayer_time` tabloları): seçilen il/ilçe kimliği ve adı,
indirilmiş yaklaşık bir aylık namaz vakti tablosu. **Bunlar da cihazdan
çıkmıyor.**

**Cihazdan çıkan** — üç istek:

1. Açılışta güncelleme kontrolü, `u.expo.dev` (`app.json`)
2. Ders sesi indirme (`features/learning/audio.ts`) — ⚠️ **bu sürümde fiilen
   kapalı**, `app.json` → `extra.audioBaseUrl` boş
3. ⚠️ **Namaz vakti indirme** (`features/prayer/prayerApi.ts`) →
   `ezanvakti.emushaf.net`. Gönderilen tek şey **ilçe numarası**; kişisel veri,
   kimlik ya da ilerleme yok. Yaklaşık bir aylık pencere indiği için istek
   seyrek (kalan gün < 7).

⚠️ **Konum** (`features/prayer/location.ts`): yalnızca kullanıcı "Konumumdan
bul"a basarsa, düşük hassasiyetle, **tek seferlik**. Konum bizim sunucumuza ya
da `emushaf.net`'e **gönderilmiyor** ve **saklanmıyor** — saklanan tek şey
kullanıcının onayladığı ilçe. ⚠️ Ama iOS'ta `reverseGeocodeAsync` koordinatı
**Apple'ın sunucusuna** gönderiyor (CLGeocoder); Android'de cihaz üstünde
çözülüyor. "Konum cihazdan hiç çıkmıyor" **denemez.**

**Bulunmayanlar:** hesap/giriş, analitik, çökme raporlama (Sentry `package.json`'da
**kurulu değil**), reklam ağı, satın alma, kullanıcı içeriği, mesajlaşma.

---

## Bölüm 1 — Google Play: Data safety

### 1.1 Veri toplama ve paylaşma

| Soru | Önerilen cevap | Gerekçe |
| --- | --- | --- |
| Uygulamanız kullanıcı verisi topluyor mu ya da paylaşıyor mu? | **Hayır** | Cihazdan çıkan kullanıcı verisi yok. ⚠️ IP çekincesi için 1.4'e bak |
| Konum | ⚠️ **Hukukçuya sorulacak** | Faz 4.1'de `expo-location` **gerçekten kullanılıyor** (`features/prayer/location.ts`) ama konum *toplanmıyor*: tek seferlik okunuyor, ilçe adına çevriliyor, saklanmıyor, hiçbir sunucumuza gitmiyor. Play'in "collect" tanımı bunu kapsıyor mu, form doldurulmadan netleşmeli. ⚠️ **Bu satır artık "Hayır" olarak bırakılamaz** |
| Kişisel bilgi (ad, e-posta, kimlik) | Hayır | Hesap sistemi yok |
| Finansal bilgi | Hayır | Satın alma yok |
| Sağlık ve fitness | Hayır | — |
| Mesajlar, fotoğraf, video, ses dosyaları | Hayır | Kayıt yok; ses yalnızca **indiriliyor**, gönderilmiyor |
| Kişiler, takvim | Hayır | — |
| Uygulama etkinliği (ekran görüntüleme, arama geçmişi) | Hayır | Analitik yok |
| Web tarama geçmişi | Hayır | — |
| Uygulama içi bilgi ve performans (çökme kayıtları, tanılama) | **Hayır** | ⚠️ Sentry eklenirse **Evet**'e döner — Bölüm 4 |
| Cihaz veya diğer kimlikler | Hayır | Reklam kimliği okunmuyor |

### 1.2 Güvenlik uygulamaları

| Soru | Önerilen cevap | Gerekçe |
| --- | --- | --- |
| Veriler aktarım sırasında şifreleniyor mu? | **Evet** | Giden üç istek de HTTPS (`ezanvakti.emushaf.net` dahil) |
| Kullanıcılar verilerinin silinmesini talep edebiliyor mu? | **Evet** | Uygulamayı silmek tüm veriyi siler; ayrıca uygulama içinde ilerleme sıfırlama var (`resetProgress`, `features/progress/store.ts`) |
| Uygulama bağımsız bir güvenlik denetiminden geçti mi? | Hayır | Geçmedi |
| Play Families politikasına tabi mi? | ⚠️ **Yaş derecelendirmesine bağlı** | Hedef kitlede çocuklar da var. "Çocuklar" hedef kitle olarak seçilirse **Families politikası devreye girer** ve ek yükümlülük doğar. Karar hukukçuyla verilmeli |

### 1.3 Diğer beyanlar

- **Reklam içeriyor mu:** Hayır
- **Uygulama içi satın alma:** Hayır
- **Hedef kitle ve içerik:** ⚠️ Yaş derecelendirme anketiyle (IARC) tutarlı olmalı
- **Gizlilik politikası URL'si:** zorunlu — `{POLİTİKA_URL}`

### 1.4 ⚠️ Tek gri alan: güncelleme sunucusuna giden IP

**Formu ilk kez dolduran birinin düşünmeden "hayır" diyeceği yer burasıdır.**

Uygulama her açılışta Expo'nun güncelleme sunucusuna bağlanıyor. Bu isteği
uygulama kodu değil, `expo-updates` altyapısı yapıyor ve isteğe kullanıcı
verisi konmuyor — ama her HTTP isteği gibi karşı tarafa **IP adresi** ulaşıyor.
IP adresi KVKK ve GDPR kapsamında kişisel veri sayılır.

Google'ın formu, **yalnızca geçici olarak işlenen** ve saklanmayan veriyi
"toplama" saymıyor. Belirleyici olan şey Expo'nun bu isteği loglayıp
loglamadığı ve ne kadar sakladığıdır — bu **bizim kodumuzdan görülemez**.

**Yapılacak:** yayından önce Expo'nun kendi gizlilik/veri işleme belgesi okunmalı
ve cevap ona göre kesinleştirilmeli. Bu, hukuki incelemeye götürülecek
maddelerden biridir (`GIZLILIK_POLITIKASI.md`, "Hukukçuya sorulacaklar", madde 2).

> ℹ️ **Kaçış yolu var ama bedava değil:** `app.json` → `updates.enabled` kapatılırsa
> istek hiç yapılmaz ve soru ortadan kalkar. Bedeli, mağazasız içerik
> güncellemesinden vazgeçmektir — Oturum 2.5'in bütün OTA kurulumu bunun için
> yapıldı (`Planlamalar/OTA_GUNCELLEME.md`).

---

## Bölüm 2 — App Store: App Privacy

Apple üç kova soruyor: veri **sizinle ilişkilendiriliyor mu**, **takip için mi
kullanılıyor**, yoksa **ilişkilendirilmeden mi toplanıyor**.

| Soru | Önerilen cevap | Gerekçe |
| --- | --- | --- |
| Uygulama veri topluyor mu? | **Data Not Collected** | Cihazdan çıkan kullanıcı verisi yok |
| Kullanıcıyı izlemek (tracking) için veri kullanılıyor mu? | **Hayır** | Reklam ağı ve çapraz uygulama takibi yok. ⚠️ Bu cevap **App Tracking Transparency izni istememeyi** de gerektirir; uygulama zaten istemiyor |
| Üçüncü taraf SDK'ları veri topluyor mu? | Hayır | Reklam/analitik SDK'sı yok |
| Gizlilik politikası URL'si | zorunlu | `{POLİTİKA_URL}` |

⚠️ **"Data Not Collected" beyanının şartları — üçü de bugün sağlanıyor,
biri bozulursa beyan değişir:**

1. `extra.audioBaseUrl` boş kaldığı veya dolduğunda bile yalnızca dosya
   indirdiği sürece (kullanıcı verisi göndermediği sürece) sorun yok
2. Sentry eklenmediği sürece (çökme raporu **toplanan veridir**)
3. Bulut senkronizasyonu (Faz 7) gelmediği sürece — o geldiğinde beyan
   **kesinlikle** değişir

⚠️ Bölüm 1.4'teki IP çekincesi Apple tarafında da geçerlidir; Apple da
altyapısal ağ isteklerini "toplama" saymamaya meyillidir ama karar aynı
hukuki incelemeden çıkmalıdır.

⚠️ **Privacy Manifest (`PrivacyInfo.xcprivacy`).** Apple, kullanılan bazı
sistem API'leri için gerekçe beyanı istiyor. Expo/EAS bunu SDK 54'te büyük
ölçüde kendi üretiyor; yine de ilk yüklemede App Store Connect'ten gelecek
uyarılar okunmalı. Bu, kod tarafında ek iş çıkarabilecek tek maddedir.

---

## Bölüm 3 — ⚠️ İzin sorunu: beyan ile gerçek çelişiyor

> ✅ **ÇÖZÜLDÜ — Oturum 4.1.** `app.json`'daki izin listesi
> `ACCESS_COARSE_LOCATION` tek maddesine indirildi; `ACCESS_FINE_LOCATION`,
> `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE` ve
> `FOREGROUND_SERVICE_MEDIA_PLAYBACK` **kaldırıldı.** iOS konum izin metni de
> yeniden yazıldı: artık "hesaplamak" demiyor (biz hesaplamıyoruz), "bulunduğun
> ilçeyi bulmak" diyor ve isteğe bağlı olduğunu söylüyor.
>
> ⚠️ **`ACCESS_COARSE_LOCATION` artık GERÇEK bir kullanıma dayanıyor** — Faz 4.1
> "Konumumdan bul" kısayolu. Gerekçesiz izin sorunu bu satır için ortadan kalktı.
>
> ⚠️ **`ACCESS_FINE_LOCATION`'ın gerçekten düştüğü DOĞRULANMADI.**
> `expo-location` eklentisi kendi manifestiyle onu geri birleştirebilir;
> `npx expo prebuild` çıktısındaki birleşik manifest kontrol edilmeli.
> Kaldırıldığı **varsayılmamalı.**
>
> ⚠️ `expo-notifications` ve `expo-sqlite` eklentileri **duruyor** —
> `expo-sqlite` artık üç özellik tarafından (seri, rozet, namaz) fiilen
> kullanılıyor; `expo-notifications` hâlâ kullanılmıyor ve Faz 4.2'yi bekliyor.

Aşağıdaki tablo sorunun **çözülmeden önceki** hâlini kayda geçiriyor:

| Bildirilen | Nerede | v0.1'de kullanılıyor mu |
| --- | --- | --- |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | `app.json:25-26` | ❌ Hayır |
| `expo-location` + iOS konum izin metni | `app.json:47-52` | ❌ Hayır |
| `RECORD_AUDIO` | `app.json:27` | ❌ Hayır — ses yalnızca çalınıyor, kaydedilmiyor |
| `MODIFY_AUDIO_SETTINGS` | `app.json:28` | ⚠️ Dolaylı — `expo-audio` ses oturumu için |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | `app.json:29-30` | ❌ Hayır — arka planda çalma yok |
| `expo-notifications` | `app.json:53` | ❌ Hayır — bildirim Faz 4 |
| `expo-sqlite` | `app.json:54` | ❌ Hayır — namaz/Kur'an Faz 4-5 |

Bunlar Faz 4-5'in altyapısı olarak eklenmiş, ama **v0.1 hiçbirini
kullanmıyor.**

**Neden sorun:**

- Google Play, izinlerin uygulamanın **açıklanan işleviyle** eşleşmesini
  şart koşar. Öğrenme uygulamasında gerekçesiz konum izni klasik ret sebebidir.
- `RECORD_AUDIO` ve `FOREGROUND_SERVICE*` **ayrı gerekçe formu** tetikler.
  Mikrofonu hiç kullanmayan bir uygulama için doldurulacak bir gerekçe yok.
- iOS'ta `app.json:50`'deki konum izin metni derlemeye giriyor; inceleme
  "bu özelliği göremedik" diye sorabilir.
- Data safety formunda "konum toplamıyoruz" demek ile konum izni bildirmek
  yan yana **tutarsız** görünür.

**Uygulanan çözüm (Oturum 4.1):** kullanılmayan izinler `app.json`'dan
çıkarıldı, konum izni gerçek bir özelliğe bağlandı ve metni düzeltildi.
⚠️ Bu bir **yerel yapılandırma** değişikliğidir — OTA ile gitmez, **yeni
derleme** ister. Faz 4 zaten yeni derleme gerektirdiği için bedeli yok.

---

## Bölüm 4 — Bu cevapları GEÇERSİZ kılacak değişiklikler

Aşağıdakilerden biri yapıldığı gün formlar **yeniden doldurulmalıdır**:

| Değişiklik | Ne değişir |
| --- | --- |
| **Sentry / çökme raporlama** (Faz 1.4) | Play: "Uygulama içi bilgi ve performans → Çökme kayıtları" **Evet**. Apple: artık "Data Not Collected" değil (Diagnostics) |
| **Bulut senkronizasyonu** (Faz 7) | Hesap + sunucuya giden ilerleme verisi. İki formun da tamamı değişir |
| **Bildirimler** (Faz 4.4) | ✅ **Yapıldı ve form DEĞİŞMEDİ.** Yalnızca yerel zamanlanmış bildirim kuruldu; `getExpoPushTokenAsync` **hiç çağrılmıyor**, cihazdan hiçbir şey çıkmıyor. ⚠️ Push eklendiği gün cihaz jetonu = **kimlik** olur ve bu form yeniden doldurulur |
| ✅ **Konum** (Faz 4.1'de GERÇEKLEŞTİ) | Bölüm 1.1'deki konum satırı "Hayır"dan çıktı ve hukuki incelemeye bırakıldı; politikaya "3b. Konum izni — isteğe bağlı" bölümü eklendi. **Form bu değişiklikle yeniden doldurulmalı.** |
| ✅ **Üçüncü uzak sunucu** (Faz 4.1'de GERÇEKLEŞTİ) | `ezanvakti.emushaf.net` envantere girdi. Bu servis **bağımsız bir üçüncü taraftır** ve yazılı kullanım şartı yayınlamıyor — mağaza formunda üçüncü taraf olarak anılması gerekip gerekmediği hukukçuya soruldu |
| **Reklam veya satın alma** | Ek beyanlar, muhtemelen yaş derecelendirmesi |
| `extra.audioBaseUrl` doldurulması | Beyan değişmez ama politikanın 3-b maddesi **fiilen yürürlüğe girer** |

---

## Bölüm 5 — Doldurmadan önce kontrol listesi

- [ ] Gizlilik politikası hukuki incelemeden geçti
- [ ] Politika herkese açık bir URL'de yayınlandı (`{POLİTİKA_URL}`)
- [ ] Bölüm 3'teki izin sorunu çözüldü **ya da** her izin için gerekçe hazır
- [ ] Bölüm 1.4'teki IP sorusu Expo belgesiyle netleştirildi
- [ ] Sentry'nin bu sürümde **olmadığı** doğrulandı (`package.json`)
- [ ] Yaş derecelendirme anketi cevapları bu formla ve açıklama metniyle tutarlı
- [ ] Play "Çocuklar hedef kitle mi" sorusunun cevabı hukukçuyla kararlaştırıldı
