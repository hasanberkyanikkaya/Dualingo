# CLAUDE.md

Bu dosya, Claude Code'un bu projede nasıl çalışması gerektiğini tanımlar.
Her oturumda otomatik okunur — buradaki bilgileri tekrar açıklamaya gerek yoktur.

---

## Proje

Türkçe İslami öğrenme ve ibadet takip mobil uygulaması.
Duolingo tarzı seviye seviye öğrenme yolu + namaz takibi + Kur'an okuma takibi + mini oyunlar.
Hedef kitle: yaş sınırı yok, seviye tespitiyle herkes kendi noktasından başlar.
İlk pazar: Türkiye.

## Teknoloji Yığını

- **Framework:** React Native + Expo (managed workflow)
- **Dil:** TypeScript — `any` kullanma, tipleri açıkça yaz
- **Navigasyon:** Expo Router (dosya bazlı)
- **State:** Zustand
- **Yerel DB:** expo-sqlite (tarihsel veriler: namaz çizelgesi, Kur'an ilerlemesi)
- **Hızlı depolama:** MMKV (ayarlar, küçük veriler)
- **Animasyon:** React Native Reanimated + Lottie
- **Ses:** expo-audio (expo-av SDK 54'te kaldırıldı)
- **Konum:** expo-location
- **Bildirim:** expo-notifications
- **Pusula:** `expo-location` `watchHeadingAsync` (kıble — Faz 4.5'te kuruldu)
  ⚠️ **`expo-sensors` KURULMADI ve kurulmamalı** — gerekçe "Kıble kararları"nda.
- **Hata izleme:** Sentry (Faz 1'de kurulacak)
- **OTA güncelleme:** expo-updates (Faz 2.5'te kurulacak)

**Expo Go yeterli değil.** Bildirimler ve MMKV v4 Expo Go'da çalışmaz; EAS ile
geliştirme derlemesi (dev build) gerekir.

## Klasör Yapısı

```
/app                    Expo Router ekranları
  /(tabs)               ana sekmeler
  /lesson/[id].tsx      ders ekranı
/components             ortak UI bileşenleri (buton, kart, ilerleme çubuğu)
/features
  /learning             ders motoru, soru tipleri
    /components         harita (/map) + soru tipi (/question) bileşenleri
  /prayer               namaz vakti, çizelge, bildirim
  /quran                Kur'an okuma, hedef takibi
  /games                mini oyunlar
  /progress             XP, rozet, streak
/content                JSON içerik dosyaları (kod değil, veri)
/lib                    yardımcı fonksiyonlar
/constants              renk, tipografi, sabitler
/types                  paylaşılan TypeScript tipleri
```

## Mimari Kurallar

1. **İçerik koda gömülmez.** Tüm dersler, sorular, metinler `/content` altında JSON olarak durur. Yeni ders eklemek kod değişikliği gerektirmemeli.
2. **Ekran dosyaları ince olur.** `/app` altındaki dosyalar sadece düzen ve veri bağlama yapar; iş mantığı `/features` altında yaşar.
3. **Bileşenler önce aranır.** Yeni bir UI parçası yazmadan önce `/components` içinde benzeri var mı kontrol et, varsa onu kullan veya genişlet.
4. **Sabitler merkezi.** Renk, boşluk, font boyutu doğrudan yazılmaz — `/constants` içinden gelir.
5. **Metinler merkezi.** Arayüz metinleri bileşenin içine gömülmez, `/constants/strings.ts` içinden gelir. i18n kütüphanesi kurulmaz — çoklu dil park edildi, gerekirse geçiş mekaniktir.
6. **Veri modeli sync'e hazır.** Her SQLite tablosu `updatedAt` (epoch ms) ve `deletedAt` (nullable) taşır. Sert silme yok, yumuşak silme var. Faz 7'deki bulut senkronizasyonu buna dayanacak.
7. **İçerik gömülü, güncellemesi OTA.** İçerik JSON'u pakete gömülür (çevrimdışı çalışsın diye), `expo-updates` ile mağazasız güncellenir. **İstisna: ses dosyaları pakete gömülmez** — uzaktan indirilip cihazda önbelleğe alınır.

## Kod Stili

- Fonksiyonel bileşenler, hooks. Class component yok.
- Dosya adları: bileşenler `PascalCase.tsx`, diğerleri `camelCase.ts`
- Her bileşen kendi dosyasında, default export
- Yorumlar Türkçe, kod (değişken/fonksiyon adları) İngilizce
- Uzun fonksiyonları böl; 50 satırı geçen fonksiyon gözden geçirilmeli

## Dini İçerik Politikası — ÖNEMLİ

**Claude bu projede dini içerik ÜRETMEZ.**

- Ayet, hadis, dua metni **hafızadan yazma**. Yer tutucu (`"TODO: içerik eklenecek"`) bırak.
- Fıkhi hüküm, dini bilgi **üretme veya yorumlama**.
- Ders sorularının içeriğini **uydurma**. Şema ve yapı senin işin; içeriği kullanıcı sağlar.
- Örnek/test verisi gerekiyorsa açıkça `ÖRNEK VERİ — GERÇEK DEĞİL` diye işaretle.

**Örnek veri üretimi (izin verilen):** Yapı, seviye ve soru sayısı, tip dağılımı gerçekçi
olur. Ünite/ders **başlıkları** yapısal olduğu için gerçek olabilir ("Abdest", "İmanın
Şartları"). Soru metni, cevaplar ve açıklamalar `ÖRNEK SORU 1` / `ÖRNEK CEVAP A` yer
tutucusudur. Ayet, hadis, dua veya fıkhi açıklama gereken her yere `TODO` bırakılır.

Tüm dini içerik insan uzman tarafından yazılır ve onaylanır. Bu kural istisnasızdır.

## Çalışma Şekli

- Büyük değişikliklerden önce plan sun, onay bekle.
- Aynı anda tek bir özellik üzerinde çalış.
- Bir dosyayı değiştirmeden önce oku.
- Test edilebilir küçük adımlarla ilerle.
- Emin olmadığın yerde varsayım yapma, sor.

## Oturum Devri — ÖNEMLİ

Her oturum sıfırdan başlar. Önceki konuşma hatırlanmaz. Devir bu dosya üzerinden olur.

**Oturum başında:**
1. Bu dosyadaki "Şu Anki Faz" bölümünü oku — nerede olduğumuz orada yazar
2. Son commit mesajlarına bak
3. Detay gerekiyorsa `Planlamalar/Yapılacaklar.txt` dosyasını aç

**Oturum sonunda, iş bittiğinde:**
1. Aşağıdaki "Şu Anki Faz" bölümünü güncelle — tamamlanan oturumu işaretle, sıradakini yaz
2. `Planlamalar/Yapılacaklar.txt` içindeki ilgili maddeyi işaretle
3. Commit mesajını hangi oturumun bittiğini söyleyecek şekilde yaz:
   `Faz 0.4 — öğrenme modülü tipleri` gibi

Bir karar alındıysa ve bu dosyadaki kurallarla çelişiyorsa, kararı buraya yaz.
Sadece konuşmada kalan karar, bir sonraki oturumda yok sayılır.

## Dil

Kullanıcı promptları İngilizce girebilir (bkz. `Planlamalar/PROMPTS_EN.md`).
Bu durumda bile: **cevaplar Türkçe**, kod yorumları Türkçe, arayüz metinleri Türkçe.
Sadece değişken/fonksiyon adları İngilizce.

## Komutlar

```bash
npx expo start          # geliştirme sunucusu
npx expo start --clear  # cache temizleyerek başlat
npx tsc --noEmit        # tip kontrolü
```

## Şu Anki Faz

**Faz 0 — TAMAM** (Oturum 0.1–0.5). **Faz 1.1 — TAMAM. Faz 1.2 Button — TAMAM.
Faz 1.2b ProgressBar — TAMAM. Faz 2.1 Seviye haritası — TAMAM.
Faz 2.2 soru bileşenleri (altı tipin altısı) — TAMAM.
Faz 2.3 ders akışı ekranı — TAMAM.
Faz 2.4 ilerleme kaydı — TAMAM.
Faz 2.5 ses altyapısı + içerik doğrulama + OTA yapılandırma — TAMAM.
Faz 2.6 seviye tespit sınavı — TAMAM.
Faz 2.5.3 mağaza materyalleri — TAMAM.
Faz 3.1 seri (streak) sistemi — TAMAM.
Faz 3.2 rozet sistemi — TAMAM.
Faz 3.3 maskot ve kutlama — TAMAM.
Faz 4.0 namaz veri kaynağı araştırması — TAMAM (kod yok, karar belgesi).
Faz 4.1 namaz veri katmanı + asgari ekran — TAMAM.
Faz 4.2 namaz ekranı + kılınan namaz çizelgesi — TAMAM.
Faz 4.3 namaz çizelgesi (üç durum + hafta/ay görünümü) — TAMAM.
Faz 4.4 namaz vakti bildirimleri — TAMAM (kod tam, TETİKLENME DOĞRULANMADI).
Faz 4.5 kıble pusulası — TAMAM.**
Sırada **seri arayüzü** (3.1'in görünen yüzü hâlâ yok) ya da **Faz 5 (Kur'an)**
ya da ertelenmiş 1.2c / 1.3 / 1.4.

⚠️ **Namaz modülü (Faz 4) BİTTİ.** 4.0 araştırma, 4.1 veri, 4.2 ekran + çizelge,
4.3 üç durum + hafta/ay, 4.4 bildirimler, 4.5 kıble. Açık kalan tek borç 4.4'ün
tetiklenme doğrulaması ve o dev build'e bağlı.

⚠️ **KIBLE DEV BUILD BEKLEMİYOR.** 4.4'ün aksine 4.5'in her parçası Expo Go'da
uçtan uca sınanabilir: `expo-location` Expo Go'nun içinde geliyor ve
`expo-sensors` hiç kurulmadı. Elle doğrulama listesi "Kıble kararları"nın
sonunda.

⚠️ **BİLDİRİMLER KURULDU AMA TETİKLENDİĞİ GÖRÜLMEDİ.** 4.4'ten sonra beş
vakit için yerel zamanlanmış bildirim kuruluyor (`features/prayer/
notifications.ts`), ayar ekranı profilde. Expo Go'da izin istemi, ayar
kalıcılığı ve zamanlama çağrıları çalışıyor; **vakit doğruluğu ve uygulama
kapalıyken tetiklenme yalnız dev build'de sınanabilir.** Buna bakıp "çalışıyor"
denmemeli — Dev Build Borcu B maddesinin açık kalan tek parçası bu.

⚠️ **Kutlama sahnesi kurulu ama LOTTIE DOSYASI YOK.** 3.3'ten sonra ders sonu
ekranı bir kutlama slotu taşıyor; `CelebrationMascot.tsx`'teki
`CELEBRATION_SOURCE` **bilerek `null`** ve slot `mascot.png`'ye düşüyor. Dosya
geldiği gün değişecek **tek satır** orada; çağrı yeri değişmez.

⚠️ **Mağaza metinleri hazır ama YAYIN YAKIN DEĞİL.** `Planlamalar/Magaza/`
altında dört belge var (politika taslağı, mağaza metinleri, veri güvenliği
formu, kontrol listesi). **Gizlilik politikası bir TASLAKTIR — hukuki inceleme
şart.** Metinle çözülemeyen yedi yayın engeli `Magaza/README.md`'de toplandı;
en büyüğü içeriğin tamamının hâlâ örnek veri olması.

⚠️ **OTA yapılandırıldı ama DOĞRULANMADI.** `expo-updates` kurulu, `app.json`
ve kanallar hazır, `Planlamalar/OTA_GUNCELLEME.md` yazılı — ama Expo Go OTA
çalıştırmıyor. Gerçek "mağazasız güncelleme" testi dev build ister.

⚠️ **Ses sistemi uçtan uca kurulu ama tek bir ağ isteği YAPMIYOR.**
`app.json` → `extra.audioBaseUrl` boş, `/content` altı ses anahtarı taşıyor ama
karşılığında dosya yok. Sorular yazılı yedekleriyle çalışıyor. Gerçek adres
girildiği gün **kod değişmez.**

⚠️ **2.4'te `/app`, `/components` ve altı soru bileşenine HİÇ dokunulmadı.**
2.3'ün bıraktığı iki kanca dikişi tuttu; değişen tek şey gövdeleri oldu.
Ayrıntı "İlerleme kaydı kararları"nda.

⚠️ **NAMAZ DA KALICI.** Faz 4.1'den sonra seçili ilçe (`prayer_district`) ve
indirilmiş vakitler (`prayer_time`) SQLite'ta; kalıcılık duvarını delen
**ÜÇÜNCÜ** özellik. İlçe soğuk açılışta duruyor, XP hâlâ durmuyor.
⚠️ **4.2'den sonra kılınan namaz işaretleri de (`prayer_log`) kalıcı** — aynı
`.db`de, ilçeden bağımsız. Namaz sekmesinde soğuk açılıştan sonra duran şey
artık üç tane: ilçe, vakitler ve çizelge.
⚠️ **4.3'ten sonra işaret ÜÇ DURUMLU** (kayıt yok / kılındı / kaza) ve geçmiş
günler `app/prayer/chart.tsx` üzerinden düzenlenebiliyor — aynı tablo, yeni bir
`status` sütunu (`MIGRATIONS[5]`).

⚠️ **ROZET DE KALICI.** Faz 3.2'den sonra kazanımlar `badge_unlock`
tablosunda; seriden sonra kalıcılık duvarını delen ikinci özellik. Rozet
**arayüzü var** (profilde koleksiyon, ders sonunda kutlama) ama **seri
arayüzü hâlâ yok** — 3.1'in görünen yüzü yazılmadı.

⚠️ **SERİ ARTIK KALICI, GERİSİ DEĞİL.** Faz 3.1'den sonra gün kayıtları
**SQLite**'ta (`activity_day`) ve SQLite **Expo Go'da çalışıyor** — seri,
kalıcılık duvarını delen ilk özellik. **XP ve seviyeler hâlâ MMKV'de ve kalıcı
değil.** Soğuk açılışta serinin durup XP'nin sıfırlanması **beklenen
davranıştır**, hata değil; MMKV duvarının görünür kanıtı.

⚠️ **KALICILIK BUGÜN KAPALI.** MMKV Expo Go'da yok; `features/progress/storage.ts`
bellek içi yedeğe düşüyor ve konsola uyarı basıyor. İlerleme oturum boyunca doğru
çalışıyor, uygulama kapanınca sıfırlanıyor. **Faz 1.3 (dev build) alındığı gün
kod değişmeden açılır.**
⚠️ **2.6'dan sonra bunun görünen bir yüzü var:** `placement` de kalıcı olmadığı
için **her soğuk açılışta karşılama akışı yeniden çıkıyor.** Bir hata değil, aynı
MMKV duvarı — ama artık ilk ekranda görülüyor, sessiz değil.

---

## Dev Build Borcu — Faz 1.3 gelince YAPILACAKLAR

**Faz 1.3 (EAS geliştirme derlemesi) bilinçli olarak ERTELENDİ** (Oturum 2.4
sonrası kullanıcı kararı). Sebep teknik değil, **para ve donanım**: iOS dev build
ad hoc provisioning istiyor → **ücretli Apple Developer Program ($99/yıl)**;
simulator derlemesi macOS istiyor, geliştirme makinesi Windows; geliştirme
telefonu iPhone. Android tarafı ücretsiz ve mümkün ama elde Android cihaz yok.

⚠️ **Bu bölüm bir KONTROL LİSTESİDİR.** Dev build alındığı gün baştan sona
okunacak. Buradaki maddeler başka yerlerde dağınık halde de duruyor; burası
onların tek toplandığı yer. Bir madde bitince başındaki kutu işaretlenir.

**Hazır olan (tekrar kurulmasına gerek yok):** `eas.json` `development` profili
duruyor (`developmentClient: true`, Android `apk`), `expo-dev-client@6.0.21`
kurulu, EAS'a `hasanberk` hesabıyla giriş yapılmış, `projectId` `app.json`'da.
**Eksik olan tek şey derlemeyi çalıştırmak:** `eas build --profile development`.

### A. Tamamen BLOKE — dev build olmadan hiç çalışmıyor

- [ ] **MMKV / kalıcı ilerleme.** `features/progress/storage.ts` bugün bellek içi
      yedeğe düşüyor. Dev build'de **kod değişmeden** açılır; yapılacak iş
      *doğrulama*: dersi bitir → uygulamayı tamamen kapat → aç → ilerleme duruyor
      mu, konsolda MMKV uyarısı KAYBOLDU mu.
- [ ] **`react-native-nitro-modules` açık bağımlılığa çevrilecek.** Bugün
      `node_modules`'da var (`0.36.5`) ama `package.json`'da **yazılı değil** —
      geçici bağımlılık olarak geliyor. MMKV'nin çalışma anı gereksinimi;
      geçici bağımlılığa dayanmak `@react-navigation/native`'de bir kez ısırdı.
      `npx expo install react-native-nitro-modules`.
- [ ] **OTA güncelleme (`expo-updates`).** ✅ Paket **kuruldu** (`~29.0.20`),
      `app.json`'da `updates` + `runtimeVersion` (`fingerprint`) yazılı, kanallar
      `eas.json`'da hazır, belgesi `Planlamalar/OTA_GUNCELLEME.md`. **Kalan iş
      yalnızca DOĞRULAMA** — Expo Go OTA çalıştırmıyor. Adım adım doğrulama
      yordamı belgenin 5. bölümünde. ⚠️ Orada yazan "iki kez kapat aç" politika
      gereğidir, hata değil: `fallbackToCacheTimeout: 0` güncellemeyi bir sonraki
      açılışa bırakır. Tek kapanışta görünmemesine bakıp "çalışmıyor" denmemeli.
- [ ] **Sentry (Faz 1.4).** ⚠️ `@sentry/react-native` **kurulu değil.** Yerel
      modül; Expo Go'da kurulamaz. Yayından önce şart.

### B. KISITLI — çalışıyor ama güvenilmez, dev build'de yeniden sınanmalı

- [ ] **Bildirimlerin TETİKLENMESİ (Faz 4.4 — namaz vakti hatırlatıcıları).**
      ⚠️ **KOD TAMAM, kalan iş yalnızca DOĞRULAMA.** 4.4'te yazıldı: beş vakit
      için ayrı açma/kapama, beş gecikme seçeneği, `DATE` tetikleyicili yerel
      zamanlanmış bildirim, Android kanalı, kayan 60 kayıtlık pencere.
      ⚠️ Ama SDK 53'ten beri **Expo Go'da Android uzak bildirim kaldırıldı**;
      yerel zamanlanmış bildirim kısmen çalışıyor ve Expo uyarı basıyor.
      Expo Go'da *bir şeyler* görünür — **ona bakıp "çalışıyor" denmemeli.**
      Dev build'de sınanacaklar, sırayla:
      (1) izin istemi ve reddedildikten sonra ayarlardan açma yolu;
      (2) bir vaktin TAM dakikasında bildirimin gelmesi (vakit doğruluğu);
      (3) gecikme seçeneğinin gerçekten uygulanması (5 dk seç, 5 dk sonra gelsin);
      (4) **uygulama tamamen kapalıyken** tetiklenme — 4.4'ün bütün varlık sebebi;
      (5) Android kanalının (`prayer-times`) sesli ve yüksek öncelikli çıkması;
      (6) iOS'ta 60 kaydın hepsinin kurulduğu (`getAllScheduledNotificationsAsync`
          uzunluğu) — 64 sınırının altında kaldığımızın tek gerçek kanıtı.
      ⚠️ **Push jetonu HİÇ alınmıyor ve alınmamalı** — `getExpoPushTokenAsync`
      çağrıldığı gün mağaza veri güvenliği formu yeniden doldurulur.
- [ ] **Tema tercihi kalıcılığı (Faz 3).** `lib/useTheme.ts`'in yorumu "Faz 3'te
      MMKV'ye bağlı Açık/Koyu/Sistem tercihi" diyor. Aynı MMKV duvarı. Faz 3'e
      dev build'siz girilirse tercih uygulama kapanınca unutulur.

### C. Dev build gelince AÇILAN kısıt (madde değil, kazanç)

- [ ] **SDK 54 çivisi düşer.** "SDK sürümü kararı"ndaki *tek* gerekçe telefondaki
      Expo Go'nun en fazla SDK 54 desteklemesiydi. Dev build'de Expo Go devre dışı
      kalır ve **SDK yükseltmenin önü açılır.** ⚠️ Yükseltmeye geçmeden önce o
      bölümdeki üç kırılma noktası (`expo-router/js-tabs`, `absoluteFill`,
      `ThemeProvider` kaynağı) ve `npx expo install --fix` tuzağı tekrar okunmalı.

### D. Etkilenmiyor — yanlışlıkla ertelenmesin

Aşağıdakiler Expo Go'nun İÇİNDE geliyor; dev build beklemeye gerek YOK:
`expo-sqlite` (namaz çizelgesi, Kur'an ilerlemesi), `expo-audio`, `expo-location`,
`react-native-svg`, Reanimated + worklets, `expo-location` (kıble pusulası —
⚠️ **`expo-sensors` gerekmedi ve kurulmadı**; pusula yönü `watchHeadingAsync`ten
geliyor, gerekçe "Kıble kararları"nda). **Faz 4.5'in hiçbir parçası dev build
beklemiyor** — uçtan uca Expo Go'da sınanabilir.

### Dev build alındığı gün, sırayla

1. `npx expo install react-native-nitro-modules` (+ Sentry ayrı oturum;
   `expo-updates` ve `expo-file-system` **Oturum 2.5'te kuruldu**)
2. `eas build --profile development --platform android` (ya da iOS, hesap alındıysa)
3. Derlemeyi cihaza kur, `npx expo start --dev-client` ile bağlan
4. Yukarıdaki A ve B kutularını tek tek doğrula ve işaretle
5. `npx expo-doctor` — 18/18 geçmeli
6. Bu bölümü güncelle; tamamı bitince **sil** ve yerine tek satır bırak

---

⚠️ **Faz 1.2c (Card) ATLANDI, silinmedi.** Ne 2.1 ne 2.2a Card'a ihtiyaç duydu
(ünite başlığı kart değil; şık kartı seçilebilir bir KONTROL, pasif yüzey değil).
Card kendi oturumunda yazılabilir ve artık kolay: kenarlık kararı 2.2a'da ölçüldü
(`borderControl` 2px + `componentRadius.card`), gölge seçeneği elendi.
**1.3 (dev build) ve 1.4 (Sentry) de yapılmadı** — ikisi de öğrenme motorunu
bloklamıyor ama yayından önce şart. Neyin beklediği "Dev Build Borcu"nda.

**SDK sürümü kararı — SDK 54, bilinçli olarak sabit:**
- Proje SDK 57'de başladı, **SDK 54'e indirildi.** Sebep: geliştirme telefonu
  (iPhone) App Store'dan en fazla **SDK 54 destekleyen Expo Go**'yu alabiliyor.
  Cihaz daha yeni Expo Go'yu çalıştıramıyor.
- Alternatifler elendi: dev build iOS'ta **ad hoc provisioning** gerektiriyor,
  o da **ücretli Apple Developer Program ($99/yıl)** demek. Simulator derlemesi
  macOS istiyor, geliştirme makinesi Windows.
- **SDK yükseltmeden önce** telefondaki Expo Go'nun desteklediği sürüme bak.
  Yükseltmek Expo Go bağlantısını koparır.
- Sürüm indirmede kırılan üç yer (hepsi düzeltildi):
  `expo-router/js-tabs` → `expo-router` · `StyleSheet.absoluteFill` →
  `absoluteFillObject` · `ThemeProvider`/`DarkTheme`/`DefaultTheme`/`Theme`
  expo-router'dan değil **`@react-navigation/native`**'den (açık bağımlılık
  olarak eklendi, geçici bağımlılığa dayanmasın diye).
- ⚠️ **`npx expo install --fix` paketleri İNDİRMEZ**, sadece `package.json`'ı
  yeniden yazar. Sürüm değiştirdikten sonra `node_modules` + `package-lock.json`
  silinip `npm install` çalıştırılmalı; yoksa proje kendini 54 sanırken 57
  paketleriyle çalışır ve hatalar anlamsızlaşır. Bu tuzağa bir kez düşüldü.
- Doğrulama komutu: `npx expo-doctor` (18/18 geçmeli).

**Ad ve kimlik kararı:**
- Görünen ad: **Dualingo** — *geçici*. `app.json` `name`/`slug`/`scheme` ve
  `strings.app.name` bu adı taşır; değiştirmek serbest.
- Bundle identifier: **`com.hasanberk.ogrenme`** (iOS + Android aynı).
  **Yayından sonra değişmez.** Bilinçli olarak uygulama adını taşımaz — ad
  değişince kimlik tutarsız kalmasın ve mağaza adresinde marka izi olmasın diye.
- ⚠️ "Dualingo" adı Duolingo'ya çok yakın; mağaza incelemesinde veya marka
  itirazında sorun çıkabilir. Yayın öncesi (Faz 2.5) yeniden değerlendirilmeli.
  Bundle identifier bu riskten etkilenmez.

**Maskot ve palet kararı — "Aksolotl" (Oturum 1.2 sonrası):**
- Uygulamanın ana maskotu bir **aksolotl**: `assets/images/mascot.png`.
  **Adı henüz yok**, kullanıcı sonra koyacak.
- Palet maskottan **ölçülerek** türetildi, gözle seçilmedi. Maskotun dört
  rengi palette aynen duruyor: gövde `#FFE1EC` (`rose100` → `primarySoft`),
  karın `#FFF5F8` (`rose50`), solungaç `#FF8FBF` (`rose400` → `primaryBright`),
  kontur `#3A2B33` (`neutral900` → `textPrimary`). Metin rengiyle maskotun
  çizgi renginin aynı olması kimliği bir arada tutan şey.
- ⚠️ **Pembe beyaz metin taşıyamaz.** `rose400` üzerine beyaz **2.11:1**.
  Beyaz metni taşıyan en açık pembe `rose600 #C9306F` (5.08:1); bir basamak
  açığı `#D63B7B` 4.40 ile kalıyor. Buton dolgusu bu yüzden `rose600`,
  maskotun canlı pembesi yalnızca grafik ve ikon.
  ⚠️ Bu satır eskiden "grafik/ilerleme/ikon" diyordu — **ilerleme çubuğu
  listeden ÇIKTI**, sebebi "ProgressBar kararları"nda.
  ⚠️ **Seviye düğümü de listeden ÇIKTI** (Oturum 2.1): `primaryBright` düğümün
  DOLGUSU değil, geçerli düğümün **süs halkasıdır**. Dolgu olsaydı üzerindeki
  ikon iki temanın birinde 3:1'in altına düşerdi. Gerekçe "Seviye haritası
  kararları"nda.
- İkincil renk **güneş sarısı** `sun400 #FFC53D` (ödül, XP, rozet) — üzerine
  koyu metin gelir. Nötr skala erik tonlu; pembeyle soğuk gri kirli duruyor.
- **Jeton ADLARI hiç değişmedi**, sadece değerleri. Bu yüzden hiçbir bileşen
  düzenlenmedi — mimari kural 4'ün (renkler merkezi) somut kazancı.
- Ghost varyantının basılınca metin değiştirme kararı yeni palette **daha da
  gerekli**: naif hâli 4.17:1 (zümrütte 4.46'ydı), düzeltilmiş hâli 5.63:1.
- `app.json`'daki açılış ekranı (`#208AEF` maviydi → `#FFF5F8`) ve Android
  adaptif ikon zemini (`#E6F4FE` → `#FFE1EC`) da palete çekildi.
- Doğrulama: 30 renk kombinasyonu (açık + koyu) hesaplandı, **hepsi AA geçiyor**.
  Palet değiştirilirse bu hesap tekrarlanmalı.
- ⚠️ Maskot henüz **açılış ekranı ve uygulama ikonu olarak kullanılmıyor** —
  `splash-icon.png` ve `icon.png` hâlâ Expo şablonundan. Yayın öncesi değişmeli.

**Tasarım sistemi kararları (Oturum 0.3):**
- Renk paleti: **"Aksolotl"** — Oturum 1.2 sonrası "Zümrüt & Bal"ın yerini aldı,
  bkz. "Maskot ve palet kararı".
- Ham renkler (`palette`) bileşende doğrudan kullanılmaz; bileşenler
  anlamsal jetonları okur (`lightTheme` / `darkTheme`, tip: `ColorTheme`).
- Metin taşıyan dolgular WCAG AA (4.5:1) sağlar. Bu yüzden buton dolgusu
  `#C9306F`; parlak `#FF8FBF` sadece grafik/ilerleme çubuğu/ikon içindir
  (`primaryBright`), üzerine küçük metin konmaz.
- Gölge jetonları temaya bağlı: `theme.elevation.card / raised / modal`.
- Metin stilleri tekil font boyutu yerine hazır jetonlardan gelir:
  `textStyles.h1…h4 / bodyLarge…bodyStrong / labelLarge…labelSmall / button / caption`.
- Boşluk ölçeği 4'ün katları (`spacing`), ekran/dokunma ölçüleri `layout` içinde.
- Köşe yuvarlaklığı: `radius` ölçeği + bileşen varsayılanları `componentRadius`.
- `strings.ts` düz nesne; değişkenli metinlerde `{ad}` yer tutucusu var,
  yerine koyma yardımcısı Faz 1'de `/lib` altına yazılacak.

**Tip kararları (Oturum 0.4):**
- `/types` ikiye ayrıldı: `learning.ts` pakete gömülü salt okunur içeriği,
  `progress.ts` cihazda yazılan senkronize edilecek veriyi tarif eder.
  `index.ts` barrel — her yerden `@/types` ile okunur.
- `Difficulty = 'beginner' | 'basic' | 'advanced'` — seviye tespit sınavındaki
  Başlangıç/Temeller/İleri ile aynı hazne, Faz 2.6'da düz eşleme olsun diye.
- `Question` birleşik tipi `type` alanıyla ayrışır. Altı varyant.
  Cevap tarafı ayrı birleşik tip: `QuestionAnswer` (soru bileşenlerinin
  `onAnswer` geri çağrımı bunu döndürür).
- **Ses:** `QuestionBase.audio` opsiyonel. `audio_choice`'ta `audio` zorunlu ama
  yanında zorunlu `fallbackPrompt` var — dosya cihazda yoksa soru yazılı çalışır,
  ders akışından çıkarılmaz (ders uzunluğu ve XP sabit kalsın diye).
- `fill_blank`: `Blank.choices` doluysa kelime havuzu, boşsa klavye.
  `segments.length === blanks.length + 1` kuralı tipte ifade edilemiyor,
  doğrulaması Faz 2'nin işi.
- `LevelStatus = 'locked' | 'available' | 'skipped' | 'completed'`.
  `skipped` = tespit sınavıyla atlanıp açıldı, çalışılmadı — haritada farklı görünür.
- İlerleme kayıtları `updatedAt` + `deletedAt` taşır (kural 6).
  Zaman damgaları epoch ms; seri günü `'YYYY-MM-DD'` yerel tarih (saat dilimi
  kayması gün sınırını bozmasın diye).
- Her içerik JSON'u `ContentEnvelope` ile sarılır: `schemaVersion`, `isSampleData`.
  `isSampleData` Faz 2.5'teki yer tutucu taramasının arayacağı işarettir.

**İçerik kararları (Oturum 0.5):**
- Dosya düzeni: `/content/lessons/path.json` ünite sırasını ve dosya adlarını tutar
  (`LearningPathIndex`), her ünite kendi dosyasında (`UnitContent`).
  Yeni ünite = yeni dosya + `path.json`'a bir satır; var olan dosyalara dokunulmaz.
- `LearningPathIndex` diskteki şekil, `LearningPath` yükleyici birleştirdikten
  sonraki bellek içi şekil. İkisi bilinçli ayrı.
- Her içerik dosyasının ilk satırı: `"note": "ÖRNEK VERİ — GERÇEK DEĞİL"`.
  Gerçek içerikte bu alan kalkar, `isSampleData` false olur.
- Yer tutucu düzeni: soru metni `ÖRNEK SORU n`, şıklar `ÖRNEK CEVAP A/B/C/D`,
  açıklama `ÖRNEK AÇIKLAMA`. Dini metin gereken her yerde bunun yerine
  `TODO: <ne gerekli> — uzman tarafından yazılacak` durur.
- Ses dosyaları **kasten yok** (`ornek/placeholder-01.m4a` gibi anahtarlar var,
  dosya yok) — Oturum 2.5'te "dosya yoksa sessiz çalış" davranışının hazır vakası.
- ⚠️ **JSON import tipleri genişletir.** `import u from './01-....json'` ile gelen
  veride `"type": "multiple_choice"` değeri `string`e genişler, `Question` birleşik
  tipine doğrudan atanamaz. Yükleyici **tek bir noktada** `as UnitContent` dönüşümü
  yapacak ve doğrulamayı çalışma anında üstlenecek; bu dönüşüm başka yere dağıtılmaz.
  (Oturum 2.1'in planına girecek.)

**Navigasyon kararları (Oturum 1.1):**
- **Rota dosya adları İngilizce:** `app/(tabs)/index.tsx` (Öğren), `prayer.tsx`,
  `quran.tsx`, `profile.tsx`. Rota adı koddur ve derin bağlantı yolu olur
  (`dualingo://profile`). Görünen etiketler `strings.tabs.*`'tan Türkçe gelir.
- **Tema `lib/useTheme.ts` kancasından okunur, provider yok.** Bileşenler
  `lightTheme`/`darkTheme`'i doğrudan import **etmez**. Faz 3'te MMKV'ye bağlı
  Açık/Koyu/Sistem tercihi gelince sadece bu dosyanın içi değişir.
- `lib/navigationTheme.ts` react-navigation köprüsü: navigatörün kendi çizdiği
  yüzeyler (sekme çubuğu zemini, sahne arka planı) bizim jetonlarımızı bilmez,
  kendi `Theme` nesnesinden okur. Köprü olmadan koyu temada çubuk beyaz kalır.
- **`Tabs` `expo-router` kökünden gelir.** (SDK 57'de bu `expo-router/js-tabs`'e
  taşınmıştı; SDK 54'e dönülünce geri alındı — bkz. "SDK sürümü" kararı.)
- ⚠️ **`tabBarStyle.height`'a `insets.bottom` elle eklenir.** Özel yükseklik
  verildiğinde navigatör güvenli alanı eklemiyor ama alt dolguyu uygulamaya
  devam ediyor; toplanmazsa çentikli cihazlarda ikon ve etiket kırpılır.
- **`SafeAreaProvider` kök yerleşime eklenmez** — expo-router (`ExpoRoot`)
  uygulamayı zaten sarıyor, ikincisi insets ölçümünü bozar.
- İlk ortak bileşenler yazıldı: `Screen` (güvenli alan + zemin + kenar boşluğu;
  ⚠️ sonradan `TopBar`'ı da çizer oldu, üst güvenli alan payı ona geçti),
  `ScreenHeader` (başlık + opsiyonel alt satır), `ComingSoon` (yayına girmeyen
  sekmelerin boş durumu). Faz 1.2'nin Button/Card/ProgressBar'ından ayrıdır.
- Sekme ikonları Ionicons: `school` / `moon` / `book` / `person` (+`-outline`).
  Ionicons'ta cami ikonu yok; Namaz için hilal seçildi, Faz 4'te tekrar bakılır.

**Bileşen kararları (Oturum 1.2 — Button):**
- **Ghost varyantının kendi jetonu yok**, birincil jetonlardan bestelendi:
  zemin şeffaf, basılınca `primarySoft`, metin `primary` → basılınca
  `primaryPressed`. Metin de değişiyor çünkü açık temada `primary`/`primarySoft`
  kontrastı **4.46:1** ile AA'nın (4.5:1) altında kalıyor; `primaryPressed` iki
  temada da `primarySoft`'tan uzaklaştığı için 6.30:1 / 5.89:1 veriyor.
  Pasif ghost dolgusuz kalır. **`colors.ts`'e yeni jeton EKLENMEDİ.**
- **Buton boyutları `layout.minTouchTarget` (48) etrafında aritmetik yazılır:**
  small 48−8=40 (+`hitSlop` 4/4 → etkin 48), medium 48, large 48+8=56.
  `small` metni `labelLarge` — tek `textStyles.button` jetonu 40px hapta sığmıyor.
  `height` değil `minHeight`: OS yazı boyutu büyüyünce buton büyür, metin kırpılmaz.
- ⚠️ **Reanimated ilk kez kullanıldı. `babel.config.js` YOK ve OLMAYACAK** —
  `babel-preset-expo` worklets eklentisini paket çözüldüğü için kendisi ekliyor
  (`configs/expo.js:107-119`). Dosya yaratmak eklentiyi iki kez uygular.
  `metro.config.js` de gereksiz. (SDK 54'te de aynı — `build/index.js:284-291`.)
  Reanimated + worklets Expo Go'nun içinde geliyor.
- **Hareket azaltma `useReducedMotion()` ile JS tarafında** kesiliyor,
  `ReduceMotion` ile değil: `ReduceMotion.System` tween'i kaldırıyor ama değeri
  anında sıçratıyor — animasyondan daha rahatsız edici.
- **Dıştaki `Pressable` asla ölçeklenmez**, sadece içindeki `Animated.View`.
  Hedef küçülseydi basılıyken alan daralır, kenardan basan parmak istemsizce
  bırakmış sayılırdı. `createAnimatedComponent(Pressable)` kullanılmadı —
  `Pressable.style`'ın fonksiyon biçimini Reanimated anlamıyor.
- **Yükleniyorken etiket sökülmez, `opacity: 0` ile durur**, spinner üstüne
  mutlak konumlanır. Genişlik kıpırdamasın diye. `loading` basılamaz yapar ama
  grileştirmez — soluk görünüm sadece `disabled`'a bağlı.
- **`strings.ts`'e ekleme yapılmadı.** Durum bildirimi `accessibilityState`
  `{disabled, busy}` ile; işletim sistemi kendi yerelleştirilmiş anonsunu
  üretiyor, ayrıca metin koymak anonsu ikiye katlar.
- **Animasyon sabitleri şimdilik `Button.tsx` içinde yerel.** İkinci tüketici
  (ProgressBar) geldiğinde `constants/motion.ts`'e çıkarılacak — ikinci
  kullanımda soyutla, birincide değil.
- **Buton API'si bilerek dar:** `icon`, `style`, `testID` yok. `style` kaçış
  kapağı ham hex'in sisteme sızdığı deliktir. İç yerleşim `flexDirection: 'row'`
  + `gap` olduğu için ikon eklemek ileride kırıcı olmayan bir değişiklik.
- ⚠️ **`StyleSheet.absoluteFillObject` kullanılır, `absoluteFill` DEĞİL.**
  RN 0.81'de `absoluteFill` kayıtlı stil (çalışma anında bir sayı); spread
  edilirse sessizce `{}` verir ve gösterge mutlak konumunu kaybeder.
  (RN 0.86'da tam tersiydi — sürüm değişiminde ilk bakılacak yerlerden biri.)

**Görsel kabuk kararları (ÖrnekResim.jpeg uyarlaması):**
- Uygulama üç şeride bölündü: **pembe tavan → beyaz orta → beyaz sekme çubuğu.**
  Referans `ÖrnekResim.jpeg` (kök dizinde). Renkler gözle değil **pikselden
  ölçülerek** alındı.
- **Tavan `#FEA3A2`** (`palette.coral300` → `appBar`). ⚠️ Bu renk gül
  skalasından **farklı bir hüe**: gülde mavi yeşilden yüksek (magentaya çalar),
  mercanda ikisi eşit (kırmızıya çalar). Yani palette artık **iki ayrı pembe**
  var — maskotun magenta pembesi ve tavanın somonu. Bilinçli, çünkü referans
  görüntü bunu istiyor; ama maskot tavana konursa iki pembe yan yana gelir ve
  o noktada biri feda edilmeli.
- **Alt sekme çubuğu BEYAZ, pembe değil.** Kullanıcının ilk tarifi "alt kısım
  pembe, seçilince beyaz" diyordu; referans görüntüde ölçülen değer `#FFFFFF`
  ve seçili sekme `#C1446E`. Sorulup **resimdeki hâli** seçildi. Ek gerekçe:
  somon üzerine beyaz metin **1.91:1** — seçili sekme diğerlerinden daha zor
  okunurdu. Sekme çubuğu zaten `theme.surface` okuduğu için **kod değişmedi.**
- **`lightTheme.background` `neutral50` → `neutral0` (saf beyaz).** Orta alan
  "beyaz" istendi, `#FFF7FA` beyaz değil. ⚠️ **Sonuç: açık temada `background`
  ile `surface` artık AYNI renk.** Faz 1.2c'deki Card zeminden kendi rengiyle
  ayrışamaz.
  ⚠️ **Bu satır eskiden "kenarlık VEYA `elevation.card` gölgesi" diyordu — "veya"
  YANLIŞTI.** Oturum 2.2a gölgeyi ölçtü: `shadowOpacity: 0.08` ile beyaz üzerinde
  üretilebilecek en koyu piksel `#EFEEEF`, yani **1.16:1**, üstelik bulanıklık
  yayılmadan önceki tavan. Gölge sınır çizemez. Sınır `borderControl` kenarlığıyla
  çizilir; karar verildi, Card oturumu tekrar ölçmesin.
- **`TopBar` bileşeni** (`components/TopBar.tsx`): tam genişlikte renk şeridi.
  **Durum çubuğunun arkasını da boyar** — güvenli alan payı dolgu olarak
  ekleniyor, zemin tepeye kadar uzanıyor; yoksa çentikli cihazda üstte beyaz
  bant kalıyor. İçi şimdilik boş, `children` alıyor (logo/ikonlar sonra).
  Yükseklik `layout.topBarHeight` (56) + inset, `height` değil `minHeight`.
- **Güvenli alan payları üçe bölündü:** ÜST payı `TopBar`, ALT payı sekme
  çubuğu, YATAY paylar `Screen` üstleniyor. `Screen` artık `edges={['top',…]}`
  kullanmıyor — top payı TopBar'a geçti, yoksa pay iki kez uygulanırdı.
- `StatusBar style="auto"` değişmedi ve doğru: açık temada koyu ikon (somon
  üzerinde okunur), koyu temada açık ikon (koyu mercan üzerinde okunur).

**Bileşen kararları (Oturum 1.2b — ProgressBar):**
- ⚠️ **Maskotun canlı pembesi (`primaryBright`) çubukta KULLANILMADI**, paletin
  önceki notu aksini söylemesine rağmen. Ölçüm: açık temada yol rengiyle
  (`border` #F2DFE7) arasında **1.81:1**. WCAG 1.4.11 metin taşımayan arayüz
  parçaları için 3:1 istiyor ve dolu/boş sınırı ilerlemeyi anlatan **tek** şey.
  Açık temada yolu açmak kurtarmıyor (bembeyaz yol bile 2.11:1). İkisinden biri
  koyulaşmalıydı; **dolgu koyulaştı, yol açık kaldı** (kullanıcı kararı).
  Ölçülen değerler — açık: 4.34 / 3.15 / 3.95, koyu: 7.03 / 8.46 / 7.31.
- **Üç varyant:** `primary` (ders ilerlemesi) · `secondary` (XP, günlük hedef) ·
  `success` (tamamlandı). **Yol her varyantta aynı** (`border`) — boş kısım her
  yerde aynı görünsün ki doluluk varyanttan bağımsız okunsun.
- **`colors.ts`'e bir jeton eklendi: `secondaryStrong`** (açık `sun600`, koyu
  `sun400`). Button hiç jeton eklememişti; burada mecburdu, çünkü `secondary`
  (sun400) açık temada yola karşı 1.35:1, `secondaryPressed` (sun500) 1.91:1 —
  ikisi de metin dolgusu için seçilmişti, grafik dolgusu için değil.
- **İlk çizimde animasyon YOK, değer değişince VAR.** Paylaşılan değer ilk
  oranla başlatılıyor. Ekrana her girişte sıfırdan dolan çubuk (profildeki
  günlük hedef) ilerlemeyi anlatmaz, sadece dikkat dağıtır.
- **Genişlik yüzdeyle animasyonlanıyor, `scaleX` ile değil:** ölçekleme dolgunun
  hap köşesini yatayda gererek düşük değerlerde ucu yamultuyor.
  `` width: `${progress.value * 100}%` `` TypeScript'te geçiyor — şablon değişmez
  (template literal) tipi RN'in `DimensionValue`'suna oturuyor, dönüşüm gerekmedi.
- **Bozuk girdi sessizce boş çubuk:** `total <= 0`, `NaN`, `Infinity` → 0 oran.
  Bölme hiç yapılmaz, `NaN` genişliğe sızmaz. `current` taşarsa dolu görünür.
- Erişilebilirlik: `accessibilityRole="progressbar"` + `accessibilityValue`.
  Ekran okuyucuya giden sayı **görünen dolulukla aynı kaynaktan** türetiliyor
  (kırpılmış orandan geri hesaplanıyor), ikisi ayrışmasın diye.
- **API dar tutuldu** (Button'ın izinde): kalınlık, etiket, yüzde metni, `style`
  yok. Kalınlık `spacing.md` (12) sabiti.

**Yan ürünler (Oturum 1.2b):**
- **`constants/motion.ts` yaratıldı** — Button'ın yerel süre/yumuşatma
  değerleri buraya taşındı (Oturum 1.2'de "ikinci tüketici gelince çıkar"
  denmişti, ProgressBar o tüketici). `timing.pressIn / pressOut / progress`.
  Button davranışsal olarak değişmedi, sadece sabitleri dışarıdan okuyor.
  ⚠️ Hiçbir yapılandırma "hareketi azalt"ı kendi dinlemez; kesme kararı
  bileşende `useReducedMotion()` ile (Button'daki gerekçe geçerli).
- **`lib/formatString.ts` yaratıldı** — Faz 0.3'te söz verilen `{ad}` yer
  tutucusu doldurma yardımcısı. İlk tüketici ProgressBar'ın erişilebilirlik
  etiketi. **Karşılığı olmayan yer tutucu silinmez, olduğu gibi bırakılır** —
  ekranda `{total}` görmek sessiz boşluktan daha hızlı fark edilir.
  `strings.ts`'e hiçbir metin eklenmedi; `a11y.progressBar` zaten vardı.

**Seviye haritası kararları (Oturum 2.1):**
- **`react-native-svg@15.12.1` eklendi.** SDK 54'ün *paketli yerel modülü*
  (`expo/bundledNativeModules.json`), yani **Expo Go içinde geliyor**, dev build
  gerektirmiyor. ⚠️ Sürümü asla `npm install` ile değiştirme — sadece
  `npx expo install`. Bu bileşenlerde **Reanimated ile SVG özelliği
  animasyonlanmıyor** (`createAnimatedComponent(Path)` + `d`/`strokeDashoffset`,
  RN 0.81 + Reanimated 4 + worklets 0.5 üçlüsünde pürüzlü); şerit durağan.
- ⚠️ **`primary` ile `success` arasında 1.10:1 var.** Yani "açık" pembe düğüm ile
  "tamamlandı" yeşil düğüm neredeyse aynı parlaklıkta. **Durum bilgisini daire
  RENGİ taşıyamaz**; taşıyan şey ikonun BİÇİMİ: dolu tik / dolu üçgen / boş
  üçgen / asma kilit. Projede yeni bir hata sınıfı — bu WCAG **1.4.1** (bilgiyi
  yalnız renkle verme), daha önce çarpılan 1.4.3 ve 1.4.11 değil.
- `skipped` düğümün dolgusu **opak `background`**, şeffaf değil: 32px'lik şerit
  düğümün altından geçiyor, şeffaf bırakılsa ikonun içinden akardı.
- Kilit ikonu **`textMuted`**, `disabledText` değil — `disabledText` kendi zemini
  üzerinde **1.97:1** ve asma kilit görünmüyor. ⚠️ **Aynı oran var olan pasif
  Button etiketinde de geçerli**; WCAG pasif öğeleri muaf tutuyor ama ileride
  bakılmalı.
- Şerit **dekoratif** `borderStrong`, 32px (zemine 1.52 açık / 1.69 koyu).
  Bilgi taşımadığı için 1.4.11 kapsamına girmiyor: durumu düğüm ikonları,
  ilerlemeyi ünite başlığındaki `ProgressBar` anlatıyor. `border` (1.27)
  elendi — 32px'te bile görünmüyor. **Algıda alan önemli**: 1.5:1'de 32px'lik
  bant görünür, aynı orandaki 1px çizgi hiçbir şey (ünite ayraç çizgileri de
  bu yüzden elendi).
  → Şerit ileride ilerleme taşırsa ölçüm hazır: `success`/`borderStrong` =
  **3.04 açık / 5.94 koyu**, `primary`/`borderStrong` = 3.33 / 5.72.
- Yıldızlar: dolu `secondaryStrong` (3.69 / 11.63), boş `textDisabled`
  (2.31 / 2.86). `secondary` elendi (1.58); boş için `textMuted` elendi —
  kazanılan yıldızdan gür çıkıp hiyerarşiyi ters çeviriyordu.
- **`colors.ts`'e jeton EKLENMEDİ** (Button'ın izinde; ProgressBar mecbur kalmıştı).
- **İlerleme ekrana KANCA ile ulaşır**: `features/learning/useLevelProgress.ts`.
  Bugün `mockProgress.ts`'i döndürüyor, Faz 2.4'te gövdesi store'a bağlanacak ve
  sahte dosya silinecek. Düz fonksiyon olsaydı 2.4'te her çağrı yeri değişirdi.
- **`deletedAt !== null` kaydı YOK sayılır → `locked`** (mimari kural 6). Kural
  tek bir yerde: `levelStatus.ts`. Sahte veride bilerek bir silinmiş kayıt var.
- **"Geçerli seviye" bir `LevelStatus` DEĞİL**, türetilmiş bayrak: yol sırasında
  `available` olan İLK seviye. Tespit sınavından sonra birden çok açık olabilir.
- ⚠️ **Kural 1'e istisna:** Metro değişken yollu `require` yapamıyor, bu yüzden
  yeni bir *ünite dosyası* `contentLoader.ts`'teki statik kayda bir satır ister.
  Var olan ünitelere *seviye ve soru* eklemek saf veri olmayı sürdürüyor.
  Kaçış yolu Faz 2.5'teki uzaktan içerik.
- ⚠️ **Seviye kimlikleri yolun tamamında benzersiz olmalı** — `UserProgress.levels`
  ünite başına değil, düz bir sözlük. Yükleyici `__DEV__` altında uyarıyor.
- ⚠️ **İçe aktarılan JSON `sort()` ile karıştırılmaz**, `[...arr].sort()` kullanılır:
  Metro modülü önbelleğe alıyor, doğrudan sıralama kalıcı bozulma bırakıyor.
- Geometri saf ve ölçümsüz (`pathLayout.ts`): genişlik ekrandan hesaplanıyor,
  `onLayout` yok, ilk karede doğru çiziliyor. Zikzak `[0,+1,0,-1]` döngüsü (düz
  `±` testere dişi verirdi). Genlik `clamp(w*0.22, 32, min(96, safeMax))` —
  **mutlak 96 tavanı** tablette şeridi yatay yılana dönmekten kurtaran şey.
  Eğri **Catmull-Rom → kübik Bézier**; "kontrol noktasını dikey orta noktaya koy"
  yöntemi denendi ve elendi, her düğümde kırık bırakıyordu.
- `trailSegments` tek dizge değil **aralık başına bir `d` dizisi** — 2.4'te
  geçilmiş parçaları renklendirmek geometri işi çıkarmasın diye.
- ⚠️ `useWindowDimensions()` yatay güvenli alan payını bilmez; `mapWidth`
  hesabından `insets.left/right` çıkarılıyor, yoksa yatay modda düğümler taşıyor.
- **`Screen`'e `padded` prop'u EKLENMEDİ** ve bu bilinçli: içerik kutusunun kendi
  zemini olmadığı için 16/24 dolgu görünmeyen bir boşluk. Kabuğa kalıcı kaçış
  kapağı açmaya değmedi (Button'da kapatılan `style` deliğinin aynısı).
- Dokunma **hiçbir yere gitmiyor** — `app/lesson/[id].tsx` yaratılmadı, o 2.3'ün
  dosyası. Ekranın ölü hissetmemesini basma animasyonu, "Şu an buradasın" yazısı
  ve ünite ilerleme çubukları sağlıyor.
- `strings.ts`'e **iki metin** eklendi: `learn.skippedLevel`, `a11y.levelStars`.

**Soru bileşenleri kararları (Oturum 2.2a — MultipleChoiceQuestion):**
- **`colors.ts`'e bir jeton eklendi: `borderControl`** (açık `neutral500`,
  koyu `neutral600`). Dokunulabilir bir öğenin SINIRINI çizer — şık kartı, girdi
  alanı, Card. Zemine karşı **3.64 / 3.46**, WCAG 1.4.11'in istediği 3:1 sağlanıyor.
  Elenenler: `borderStrong` **1.52**, `surfaceAlt` dolgu **1.10**, gölge **1.16**.
  ⚠️ **`borderStrong` koyulaştırılarak çözülemezdi** — o jeton `LevelNode`'un
  kilitli halkasında ve `PathTrail`'in 32px şeridinde yük taşıyor; şeridin bütün
  gerekçesi "1.5:1'de 32px'lik bant görünür"dü, 3.6'ya çekmek yolu gri yılana çevirirdi.
- ⚠️ **Seçili ve seçilmemiş kenarlık arasında yalnızca 1.40:1 var** (`primary` /
  `borderControl`); fark neredeyse tamamen hüe. Durumu renk taşıyamaz →
  **radyo göstergesinin BİÇİMİ taşıyor** (`radio-button-off` → `radio-button-on`).
  2.1'deki `primary`/`success` 1.10:1 dersinin ikinci kez uygulanması.
- ⚠️ **Gösterge olarak `checkmark-circle` KULLANILMAZ.** Henüz kontrol edilmemiş
  bir şıkta tik doğruluğu önceden ima eder; ayrıca tik dağarcığı Faz 2.3'ün
  gerçek doğru/yanlış işaretine ait.
- Şık etiketi iki durumda da `textPrimary` — seçilince `primary`'ye çevrilmez:
  `primary` üzerine `primarySoft` **4.17**, ghost butonu düzelten sayının aynısı.
- Kenarlık kalınlığı her durumda **2px**; 1→2 değişimi etiketi kaydırıp listeyi titretir.
- `OptionCard` basma ölçeği **0.98**, Button'ın 0.96'sı değil: yer değiştirme
  genişlikle büyüyor, tam genişlik kartta 0.96 kenar başına 6.9px ediyor.
- `disabled` basmayı engeller ama **grileştirmez** (`disabledText`/`disabledBackground`
  1.97) — geri bildirim paneli açıklarken şık okunur kalmalı. Button'ın `loading`'i gibi.
- **`QuestionShell` altı tipin ortak kabuğu.** "Kontrol et" onun içinde, altı
  bileşende tekrarlanmıyor. Tek tüketiciyle yazıldı çünkü şekil tahmin değil:
  playbook altı tip için aynı iskeleti tarif ediyor.
- **Soru bileşenleri `QuestionOfType<'…'>` / `AnswerOfType<'…'>` alır**, birleşik
  `Question` değil. Playbook "Question tipinden" diyor ama birleşik tip her
  bileşeni içeride daraltmaya zorlardı. Daraltma 2.3'te `switch` ile bir kez.
  Oturum 0.4'te tam bu iş için yazılan yardımcıların ilk tüketicisi.
- ⚠️ **Soru değişince seçim sıfırlanır** — ders ekranı soruyu sabit yuvada
  çizecek, React örneği yeniden kullanır ve sıradaki soru şıkkı seçili açılırdı.
  Bileşen kendi içinde koruyor; ders ekranı ayrıca `key={question.id}` vermeli.

**Kalan beş soru tipi kararları (Oturum 2.2b–f, tek oturumda yapıldı):**
- ⚠️ **Örnek sorular KONUMDAN çözülebiliyordu.** Denetlendi: `choices` taşıyan
  beş boşluğun **beşinde de** doğru cevap ilk sırada; bir sıralama sorusunun
  `correctOrder`'ı kimlik permutasyonu (`i1..i5`); `image_match` eşleşmesi tipte
  yapısal olarak konumsal (`pairs[i].image` ↔ `pairs[i].text`). İçerik hatası
  değil — doğru cevap gerçekten dizi konumunun fonksiyonu, dolayısıyla **bunu
  bozmak SUNUMUN işi.** `lib/shuffle.ts` yazıldı.
- ⚠️ **Karıştırma `question.id`'den TOHUMLU, `Math.random()` değil.**
  `app.json`'da `reactCompiler: true`; derleyicinin belleklemesi ve StrictMode'un
  çift çizimi saf çizim varsayıyor. Rastgele karıştırma her çizimde şıkları
  yerinden oynatırdı. Kimlik permutasyonu çıkarsa bir kaydırılıyor.
  Doğrulandı: sıralamada 6/6 soru artık sırayla açılmıyor; boşluk doldurmada
  sistematik desen kırıldı (kalan 1/4 rastlantı ve **düzeltilmemeli** — bileşen
  cevap anahtarını okumuyor, okusa yeni bir desen üretirdi).
- **`Chip` üç yerde**: sıralama, kelime havuzu, eşleştirmenin metin listesi.
  `badge` süs değil — sıralamada 5 öğe büyük yazıda satır sardığında okuma
  sırasını, eşleştirmede dört eşzamanlı eşleşmeyi taşıyan tek şey
  (`primary`/`success` 1.10:1, renk ayıramaz).
- **Sıralama boş bölgesi KUTU DEĞİL**: `surfaceAlt` 1.10, `border` 1.27,
  `borderStrong` 1.52, `disabledBackground` 1.18 — hiçbiri görünmüyor. Görünen
  tek jeton `borderControl` ama o "dokunulabilir öğenin sınırı" diye tanımlandı;
  cevap bölgesi dokunulabilir değil. Bölgeyi başlığı + `textMuted` yer tutucu
  satırı taşıyor.
- ⚠️ **`surfaceAlt` bu palette DEKORATİF bir dolgudur, hiçbir zaman bir dokunma
  göstergesi taşıyamaz.** `borderControl`'ün `surfaceAlt` üzerindeki oranı
  3.30 açık / **2.85 koyu**. Görsel yer tutucusu bu yüzden **şeffaf dolgulu** —
  kenarlığın komşusu sayfa zemini olunca 3.64/3.46 ile sorun ortadan kalkıyor.
- **Boşluk doldurma: segmentler KELİME KELİME parçalanıyor.** Satır içinde
  `<View>` (yuva) barındırdığı için `flexWrap` gerekiyor, o da çocuk sınırında
  sarıyor; segmentin tamamı tek çocuk olsaydı uzun Türkçe cümle kırılamaz blok
  olup taşardı. `<Text>` içine `<View>` gömme yolu elendi (Android'de açık ölçü
  istiyor, taban hizası güvenilmez). ⚠️ `alignItems: 'center'`, `'baseline'` değil.
- **Odak saklanmıyor, TÜRETİLİYOR**: soldan ilk boş yuva. Dolu yuvaya dokunmak
  boşaltıyor, yani odak değiştirmek = boşaltmak. Odaklı yuvada `primary` kenarlık
  **+ imleç çubuğu** — `primary`/`borderControl` 1.40:1, renk tek başına yine
  1.4.1'e takılırdı.
- **Kip soru başına**, boşluk başına değil: bir boşlukta `choices` varsa tüm soru
  kelime havuzu. Sekiz örnek soruda hiç karışık yok (denetlendi).
- ⚠️ **Bileşen `value.trim()` verir, BAŞKA HİÇBİR ŞEY.** Türkçe harf katlaması
  yerele bağlı: `'I'.toLowerCase()` → `'i'`, `'ı'` değil.
- **`QuestionShell`'e üç eklemeli prop**: `submitHint` (varsayılan cümle
  "seçenek seç" sıralama/boşluk/eşleştirme için yanlış), `keyboardAware`
  (yalnız iOS; Android'de Expo varsayılanı `resize` zaten hallediyor),
  ve `keyboardShouldPersistTaps="handled"` (⚠️ olmazsa iki boşluklu klavye
  sorusunda ikinci yuvaya dokunuş yutuluyor).
- **Ses yokken oynat butonu ÇİZİLMİYOR**, pasif de durmuyor — `types/learning.ts`
  zaten öyle karar vermiş. Pasif buton "ses var ama bozuk" der.
  ⚠️ **`fallbackPrompt`, `prompt`'un yerine GEÇMEZ** — ses uyaranının yerine
  geçer; ikisi birbirini tamamlıyor. `answeredWithFallback` sabit yazılmıyor,
  `useQuestionAudio`'dan `!available` olarak geliyor.
- **`imageRegistry.ts` mimari mayını çözdü.** Anahtar = `assets/content/` altına
  göreli yol. ⚠️ Kayıt **boş ve boş olmak zorunda**: var olmayan dosya için
  `require` yazmak çalışma anı `null`'ı değil **Metro derleme hatası** verir.
  Uyarı anahtar başına bir kez (çizimden çağrılıyor, `contentLoader` gibi
  önbellek arkasında değil).
- `useQuestionState` (5 tüketici), `questionValidation` (5), `ChoiceList` (2)
  ortaklaştırıldı; MC de bunlara taşındı.

**Faz 2.3'ün uyması gereken sözleşmeler (şimdiden yazıldı):**
- `<QuestionShell>` **sınırlı yükseklik ister**, asla bir `ScrollView` içine konmaz —
  `flex: 1` çöker, alt bölüm içerikten ayrılır.
- Kabuk **güvenli alan payı okumaz**; ders ekranı sarmalı.
  ⚠️ **DÜZELTME (2.3):** bu satır `edges={['bottom']}` diyordu ve YANLIŞTI —
  ekranın bir `TopBar` taşıdığı varsayılmıştı. Ders ekranı `Screen`
  kullanmıyor (odaklanmış bağlam, mercan şerit yok), dolayısıyla üst payı da
  kimse çizmiyor. Doğrusu **dört kenar**: `['top','bottom','left','right']`.
- Soru bileşenine **`key={question.id}`** verilmeli.
- Kabuğa `isAnswered?: boolean` eklenip alt bölüm geri bildirim paneline
  bırakılacak — ~10 satır, tek dosya.
- ⚠️ Cevaplanmış şıkkı yeşile/kırmızıya boyamak **tek başına görünmez**:
  `primary`/`success` **1.10**, `primary`/`error` **1.06**. Gösterge ikonu da
  biçim değiştirmeli. Kenarlıkların kendisi sorunsuz (`success` 4.63, `error` 4.81).
- ⚠️ **`image_match` cevabı KÜME olarak karşılaştırılmalı**, dizi olarak değil —
  `matches` sırası kullanıcının eşleştirme sırası, içerik sırası değil.
- ⚠️ **`fill_blank` karşılaştırması Türkçe duyarlı olmalı**: `toLocaleLowerCase('tr')`,
  ve `I`/`ı`/`İ` tuzağına dikkat. Motorda, **tek yerde**. Bileşen ham `trim()`
  veriyor. `entries` `blankId` ile aranmalı, sıraya güvenilmemeli.
- ⚠️ **Cevaplanamayan soru kullanıcıyı KİLİTLER.** İçerik yeterince bozuksa hiç
  şık/boşluk çizilmiyor, `canSubmit` sonsuza dek `false` kalıyor ve dersten
  çıkış yok. 2.2a'dan beri var. Ders ekranının atlama yolu olmalı ya da yükleyici
  cevaplanamayan soruyu düşürmeli.
- `isAnswered` geldiğinde `Chip` / `ImageTile` / `BlankSlot`'a `disabled` olarak
  inecek.
  ⚠️ **DÜZELTME (2.3):** bu satır "dördü de `disabled?` taşıyor" diyordu ve
  YANLIŞTI — **`BlankSlot` taşımıyordu.** Üstelik orada `editable` adı zaten
  "klavye kipi" anlamındaydı. 2.3 `BlankSlot`'a `disabled` ekledi ve iki dala da
  geçirdi (`Pressable.disabled`, `TextInput.editable={!disabled}`); `editable`
  kip bayrağı olarak kaldı.
- ⚠️ Klavye açıkken alt bölüm fazla yükselirse çözüm: `KeyboardAvoidingView`'ı
  ders ekranına, `SafeAreaView`'ın **dışına** taşı ve `keyboardAware` prop'unu sil.

⚠️ **Mimari mayın — Faz 2.2e (ImageMatch) buna çarpacak:** `ImageRef.key` düz
dizge ve anahtar→varlık eşlemesi hiçbir yerde yok. Metro değişken yollu `require`
yapamıyor (`contentLoader`'ı statik kayda zorlayan duvarın aynısı). `expo-image`
zaten bağımlılıkta. Görsel çizimi 2.2a'da bilerek atlandı; ImageMatch oturumu
İLK İŞ olarak bu eşlemeyi çözmeli, yoksa tıkanarak açılır.

**Ders akışı kararları (Oturum 2.3):**
- **Üç saf dosya**: `answerEngine.ts` (değerlendirme), `lessonScoring.ts`
  (yıldız/XP), `lessonSession.ts` (indirgeyici). React/RN/tema import etmiyorlar
  — 2.4 test koşucusunu kurunca sıfır ek maliyetle kapsanacaklar.
- ⚠️ **`normalizeTr` — Türkçe harf tuzağı ölçüldü ve gerçek.** `'ISLAM'` naif
  `toLowerCase()` ile `'islam'` oluyor, `'ıslam'` değil; doğru cevap yanlış
  işaretleniyor. `toLocaleLowerCase('tr')` de yetmiyor: Hermes'in tam ICU
  içermeyen Android derlemesinde sessizce köke düşebiliyor. Bu yüzden `İ→i` ve
  `I→ı` **önce elle** eşleniyor, sonra yerel küçültme. Aksan soyulmuyor —
  varyant kararı `Blank.correctAnswers`'la içerik yazarının.
- **Puanlama tam sayı aritmetiğiyle**: `correct*100 >= total*80` gibi. Kayan
  nokta eşiğin tam üstündeki sonucu yanlış yöne yuvarlayabilirdi.
  Eşikler %60/%80/%100 → 1/2/3; 3 yıldız kusursuzluk istiyor.
- **XP yordayıcısı `status`, `attemptCount` DEĞİL**: tespit sınavıyla açılmış
  seviye `attemptCount: 0` ama `status: 'skipped'` taşıyor, ilk gerçek denemesi
  tam XP almalı. Tekrarda %25. ⚠️ `wasCompletedBefore` oturum BAŞINDA okunup
  saklanıyor — canlı okunsaydı 2.4 kaydettiği anda XP gözün önünde düşerdi.
- ⚠️ **Tamamlanma sinyali `advance` işleyicisinden gidiyor, `useEffect`'ten
  DEĞİL.** `reactCompiler` + StrictMode etkileri iki kez çalıştırıyor; 2.4 dikişi
  doldurduğu anda XP iki kez verilirdi. Sonuç dizisi `feedback` fazında zaten
  kesinleştiği için işleyiciden çağırmak yapısal çözüm.
- **Oturum durumu `useReducer`, Zustand DEĞİL.** 2.4 yazmadığı bir store'u
  devralmasın; ayrıca store tekil ve 2.6'da tespit sınavı ile ders çakışırdı.
  Çıkış zaten ilerlemeyi siliyor, saklanacak bir şey yok.
- **Cevaplanamayan soru tuzağı iki katmanla çözüldü**: `isAnswerable` oturum
  başında bir kez eliyor (ders uzunluğu sabit kalsın diye), ve X butonu koşulsuz
  kaçış yolu. **Atla düğmesi EKLENMEDİ** — ürün kuralı "ders soru sayısı kadar
  sürer" ve atlama yıldız puanlamasını anlamsızlaştırırdı. `contentLoader`'da
  ayıklamak da elendi: yükleme anında ders uzunluğunu sessizce değiştirirdi.
- **Geri bildirim paneli kabuğun ALT BÖLÜMÜNÜN YERİNE geçiyor** (`QuestionShell`
  `+isAnswered` `+footer`), kardeşi olarak altına değil — kardeş olsaydı kaydırma
  alanı iki kez sıçrardı. 2.4/2.6 için değişecek yer hâlâ tek dosya.
- **Doğru/yanlış işareti sorunun ÜSTÜNE konmadı**, panelde anlatılıyor: bunu
  altı tipin yalnızca üçünde yapmak mümkün (tek işaretlenebilir satırı olanlar),
  yarısı işaretli bir model tekdüze metinden kötü. Gerekirse sonra
  `ChoiceList`'e `resultById?` eklemek eklemeli bir değişiklik.
- Renkler ölçüldü: yumuşak dolgu panelin sınırını çizemiyor (`successSoft` 1.14,
  `errorSoft` 1.18); sınırı 2px `success` (4.63/10.05) ve `error` (4.81/6.92)
  çiziyor. Durum ikonu biçim değiştiriyor (`checkmark-circle`/`close-circle`) —
  `success`/`error` arası yalnızca 1.04 açık / 1.45 koyu.
- ⚠️ **YENİ KURAL — panel içinde `textMuted` kullanılmaz**:
  `textMuted`/`successSoft` koyu temada **4.16**, AA altı. İkincil satırlar
  `textSecondary`.
- ⚠️ **YENİ KURAL — `borderControl` yumuşak dolgu üzerine çizilmez**
  (3.19 açık / **2.39 koyu**). 2.2e'nin `borderControl`/`surfaceAlt` bulgusuyla
  aynı sınıf: **renkli yumuşak dolgular kontrol kenarlığı barındıramaz.**
- **`Screen` kullanılmıyor**, ders kendi kabını kuruyor; `Screen`'e `hideTopBar`
  prop'u da EKLENMEDİ (2.1'in `padded` reddiyle aynı gerekçe).
- ⚠️ **iOS'ta kenardan kaydırarak geri, `BackHandler`'ın göremediği bir yol.**
  Kullanıcı kaydırır, ders sessizce kaybolur, onay çıkmaz. Rota dosyasının
  içinde `<Stack.Screen options={{ gestureEnabled: false }} />`.
- ⚠️ RN 0.81'de `BackHandler.addEventListener` **abonelik döndürüyor**
  (`sub.remove()`); `removeEventListener` kaldırıldı.
- Çıkış onayı `Alert` (kullanıcı kararı). Sistem görünümü paleti kullanmıyor;
  `theme.overlay`, `componentRadius.modal`, `elevation.modal` hâlâ tüketicisiz.
  Özel pencereye geçmek tek çağrı yeri değişikliği.
- ⚠️ **Kilitli seviye derin bağlantıyla engelleniyor**: `scheme: "dualingo"` +
  typed routes ile `dualingo://lesson/level-u2-05` erişilebilir ve 2.4'ün kilit
  mantığını atlatırdı.
- ⚠️ `typedRoutes` tipleri (`.expo/types`) **yalnızca dev sunucusu çalışırken**
  üretiliyor; `expo export` üretmiyor. Yeni rota eklendiğinde `npx expo start`
  bir kez çalıştırılmadan `tsc` hata verir.
- `strings.ts`'e **iki metin**: `lesson.yourAnswer`, `result.questionIndex`.
  `colors.ts` değişmedi.

**İlerleme kaydı kararları (Oturum 2.4):**
- **İki kanca gövdesi doldu, çağrı yerleri değişmedi**: `useLevelProgress` →
  `useProgressStore((s) => s.levels)`, `useCompleteLevel` →
  `useProgressStore((s) => s.completeLevel)`. `mockProgress.ts` silindi.
  2.1 ve 2.3'ün bunları düz fonksiyon yerine kanca yazmasının bütün kazancı bu.
- **Karar mantığı store'un İÇİNDE DEĞİL.** Üç saf dosya: `unlock.ts` (kilit),
  `streak.ts` (seri), `levelRecord.ts` (kayıt birleştirme). Store yalnızca onları
  sırayla uygulayıp sonucu kalıcı hale getiriyor. `levelRecord.ts` bilerek store'dan
  ÇIKARILDI: "kötü tekrar yıldızı geri almaz" kuralı kilit hatasıyla aynı sınıftan —
  sessiz, elle görülmez, tek satırlık testle yakalanır.
- ⚠️ **`ensureEntryPoint` olmadan temiz kurulum TAMAMEN KİLİTLİ açılır.** Hiç kayıt
  yok → her seviye `locked` → tamamlanacak bir şey yok → `unlockNext` hiç
  tetiklenmez. Mock veri bunu gizliyordu (elle yazılmış kayıtlar ilk seviyeyi zaten
  açık gösteriyordu); gerçek boş durum 2.4'te ilk kez ortaya çıktı.
- **`unlockNext` asla geri düşürmez**: sıradaki seviyenin yaşayan kaydı varsa
  (`available`/`skipped`/`completed`) sözlük **aynı referansla** döner. Tespit
  sınavıyla açılmış seviye, önceki seviyenin tekrarı yüzünden `available`'a inmemeli.
  Aynı referans kuralı ayrıca haritayı gereksiz yeniden çizmekten koruyor.
- **Yumuşak silinmiş kayıt DİRİLTİLİR**, atlanmaz: `deletedAt !== null` kayıt
  `levelStatus.ts`'e göre "hiç açılmamış" demek, dolayısıyla üzerine taze
  `available` yazılır.
- **Zaman kaynağı `summary.completedAt`, `Date.now()` DEĞİL** — tamamlama
  ekranındaki özet ile diske yazılan kayıt aynı anı göstermeli.
- **`completedAt` ilk tamamlamada sabitlenir**, tekrarda korunur; her denemede
  değişen alan `lastAttemptAt`. `bestAccuracy` ile `summary.accuracy` **aynı
  birimde** (0–1), dönüştürme yok.
- ⚠️ **Seri hesabı epoch farkını 86.400.000'e BÖLMEZ.** Yaz saati geçişinin olduğu
  gün 23 ya da 25 saat sürer ve bölme o gün seriyi kırar. Tarih parçaları
  `Date.UTC` ile gece yarısına sabitlenip karşılaştırılıyor. `toLocalIsoDate` de
  `toISOString()` kullanmıyor — akşam 23:30'da bitirilen ders UTC'de ertesi güne
  düşerdi.
- **Store API'si dar**: `completeLevel` + `resetProgress`. `placement` alanı
  durumda duruyor ama **yazıcısı yok** — o 2.6'nın işi.
- **Depolama senkron olmak ZORUNDA.** MMKV senkron olduğu için `persist` ilk
  çizimden önce hidre oluyor ve harita tek bir kare bile "her şey kilitli"
  görünmüyor. Asenkron depolama seçilseydi `/app` altına bir yükleme durumu
  gerekirdi — 2.4'ün "arayüze dokunma" kuralının ihlali.
- ⚠️ **MMKV `require` ile TEMBEL yükleniyor, statik `import` ile değil.** Nitro
  import ANINDA da fırlatabiliyor, yalnızca çağrı anında değil; statik import
  yeterli olmazdı ve uygulama Expo Go'da hiç açılmazdı.
- ⚠️ **MMKV v4 API'si `new MMKV()` DEĞİL**: `createMMKV({ id })`, ve silme metodu
  `delete` değil **`remove`**. v3 örnekleri kopyalanırsa çalışmaz.
- ⚠️ `react-native-nitro-modules` (MMKV'nin çalışma anı gereksinimi) `package.json`'da
  **açık bağımlılık değil**, geçici olarak duruyor. Dev build kurulurken açık
  bağımlılığa çevrilmeli.

**Test altyapısı kararları (Oturum 2.4):**
- **Sıfır test bağımlılığı.** `npm test` → `node --test` + Node 24'ün yerleşik
  TypeScript tip soyması. Yeni paket yok, babel yok, ikili dosya yok.
- ⚠️ **`tsx` denendi ve ELENDİ.** Bağımlılığı `esbuild`, kurulumda kendi `.exe`sini
  `EBUSY` ile kilitliyor: proje klasörü **OneDrive altında** ve senkronizasyon yeni
  yazılan ikiliyi tutuyor. Her temiz `npm install`ta tekrarlardı.
- ⚠️ **`jest-expo` de elendi**: babel dönüşümü için yapılandırma dosyası ister,
  CLAUDE.md'nin "`babel.config.js` yok ve olmayacak" kuralıyla çatışır.
- `tests/setup.ts` iki iş yapıyor: `@/` takma adını `module.registerHooks` ile
  çözüyor (Node `tsconfig` `paths`ı bilmez) ve `__DEV__`i `false` tanımlıyor
  (Node'da yok, tanımsızsa `ReferenceError`).
- ⚠️ **Tip soyma `enum`, `namespace` ve kurucu parametre özelliklerini
  DESTEKLEMEZ.** Proje bunların hiçbirini kullanmıyor; yeni kod da kullanmamalı,
  yoksa testler çalışmaz. Ayrıca tip importları **`import type`** yazılmalı —
  soyucu değer importunu silmez ve çalışma anında çözülemeyen ad kalır.
- **81 test geçiyor.** 2.4'ün kendi dosyaları (`unlock`, `streak`, `levelRecord`)
  ve bedava kapsam olarak 2.1/2.3'ün saf dosyaları (`levelStatus`,
  `lessonScoring`, `answerEngine` — özellikle `normalizeTr`'nin Türkçe `I`/`İ`
  tuzağı uçtan uca sınandı).

**Ses altyapısı kararları (Oturum 2.5):**
- **Üç dosya, tek karar noktası.** `audioKey.ts` **saf** (adlandırma, uzak adres,
  önbellek dosya adı) — bütün karar mantığı bilerek buraya itildi, çünkü
  `expo-audio` ve `expo-file-system` yerel modül ve Node test koşucusunda
  yüklenemez. `audio.ts` indirme/önbellek/iOS ses oturumu. `useQuestionAudio`
  yalnızca ikisini React'e bağlıyor.
- **Adlandırma düzeni: `<ünite-slug>/<konu>-<nn>.m4a`.** Tam iki parça, alfabe
  `a-z0-9-`. ⚠️ **Türkçe harf ve büyük harf YASAK** ve sebep kozmetik değil:
  iOS dosya sistemi Unicode'u ayrıştırılmış (NFD), sunucu birleşik (NFC) yazar —
  `ş` taşıyan anahtar iki farklı dosyaya çözülür ve hata "bazen çalışıyor" diye
  görünür. Büyük harfte de CDN duyarlı, geliştirme makinesi değil.
- ⚠️ **Yayınlanan anahtar bir daha DEĞİŞMEZ** — anahtar aynı zamanda önbellek
  anahtarı. Kayıt yenilenirse numara artar (`-01` → `-02`), ad korunur.
- ⚠️ **İndirme `.part` dosyasına yapılır, sonra taşınır.** `expo-file-system`
  **Android'de** yanıt gövdesini doğrudan hedefe akıtıyor; indirme ortasında
  koparsa kısmi dosya yerinde kalıyor, `exists` denetimini geçiyor, `expo-audio`
  onu çalamıyor ve durum **kalıcı** oluyor — önbellek zehirlenir. iOS geçici
  konumda tamamlayıp taşıdığı için etkilenmez.
- **Zaman aşımı (3 sn) kancada, `audio.ts`'te DEĞİL**: bırakma kararı arayüze
  ait. İndirme arka planda sürer, tamamlanırsa önbelleğe düşer, soru ikinci kez
  açıldığında ilk karede hazır olur.
- **Önbellek `Paths.cache`, `Paths.document` DEĞİL**: işletim sistemi sıkışınca
  temizleyebilir, biz yeniden indiririz. `document` kullanıcı kotasına yazılır ve
  iCloud'a yedeklenir — yeniden üretilebilir ders sesi için yanlış yer.
- **İlk değer senkron okunuyor** (`File.exists` bir özellik, söz değil): ikinci
  kez görülen soru ilk karede oynat butonuyla açılır, yedek metin parlamaz.
- ⚠️ **`ensureAudioMode` `playsInSilentMode: true` istiyor.** Olmazsa yan
  anahtarı sessizde olan iPhone'da hiçbir şey duyulmaz; uygulama bozuk görünür,
  oysa her şey çalışmaktadır.
- **Bileşenlere DOKUNULMADI.** `AudioChoiceQuestion` 2.2'de yazıldığı gibi
  duruyor: ses yoksa oynat butonu çizilmiyor, `answeredWithFallback` kancadan
  okunuyor. `strings.lesson.audioUnavailable` hâlâ tüketicisiz — "ses var ama
  indirilemiyor" ayrı bir durum ve bugün ayrı bir arayüzü yok.
- `expo-file-system` **açık bağımlılığa çevrildi** (`~19.0.24`): `audio.ts`
  import ediyordu, `package.json`'da yoktu. `react-native-nitro-modules`'ün
  aynı tuzağı — geçici bağımlılığa dayanmak bir kez ısırdı.

**İçerik doğrulama kararları (Oturum 2.5):**
- **`contentValidation.ts` saf ve SESSİZ**: `console` yok, `__DEV__` yok,
  fırlatma yok — yalnızca `ContentIssue[]`. Uyarmak çağıranın kararı. Sessiz
  olduğu için Node test koşucusunda olduğu gibi çalışıyor.
- ⚠️ **Var olan üç denetim de çizim anında konuşuyordu** (`isAnswerable`,
  `buildSentence`, `resolveImage`) — hepsi kullanıcı o soruya VARDIĞINDA.
  Yeni katman bunun tersi: tek seferde, tüm içerik hakkında, kimse ekrana
  bakmadan.
- **Denetimlerin çoğu `isAnswerable`'ın GÖREMEDİĞİ sınıftan.** Somut örnek:
  `correctOrder: ['i1','i1','i2']` üç öğeli bir soruda `isAnswerable`'ı **geçer**
  (uzunluk eşit, her kimlik listede var) ama `i3` doğru sırada hiç geçmez ve soru
  asla doğru cevaplanamaz. İkincisi: kelime havuzu kipinde doğru cevabı
  `choices` içinde olmayan boşluk — kullanıcı yalnızca havuzdan seçebiliyor.
- **Kelime havuzu karşılaştırması `normalizeTr` ile**, motorun kuralıyla aynı.
  Başka bir kural kullanmak doğrulamadan geçen içeriğin derste yanlış
  işaretlenmesine yol açardı.
- **Bulgular içeriği DÜŞÜRMEZ.** Yükleyicide ayıklamak ders uzunluğunu sessizce
  değiştirirdi; o kararı ders oturumu `isAnswerable` ile veriyor (2.3).
  Yükleyicinin işi görünür kılmak.
- **`contentLoader.warnOnDuplicateLevelIds` SİLİNDİ**, kural doğrulayıcıya
  taşındı: tek yerde dursun ve o yer sınanabilir olsun.
- **`npm run check:content`** terminalden aynı denetimi + yer tutucu taramasını
  yapıyor. ⚠️ Yükleyici yeniden kullanılamadı çünkü **kullanılamazdı**:
  `contentLoader` JSON'u `import` ile alıyor, Metro çözüyor, Node çözmüyor.
  Araç dosyaları `readFileSync` ile okuyor ama `path.json`'daki `unitRefs`
  üzerinden gezdiği için **yeni ünite kendiliğinden kapsama giriyor** — statik
  kayıt tutmuyor.
- ⚠️ **Kaynak taramasında "ÖRNEK" BİLEREK aranmıyor**, yalnızca `/content`
  içinde. Kaynakta o kelime yer tutucu değil açıklama; aransaydı rapor kendi
  belgelerini suçlar ve kimse okumazdı. Kaynakta aranan: `TODO`, `FIXME`, `lorem`.
- **Çıkış kodu yalnızca YAPISAL hatada 1.** `isSampleData` ve yer tutucu sayısı
  çıkış kodunu değiştirmiyor: bugün içeriğin tamamı örnek veri ve komutun her
  seferinde kırmızı dönmesi onu bakılmaz hâle getirirdi.
- **Rapor varsayılan olarak dosya başına ÖZET**, satır satır değil (`--tam` ile
  tam liste). Bugünkü tam liste 304 satır; o uzunlukta çıktı okunmaz.
- **Bugünkü durum: örnek içerik 0 hata, 0 uyarı.** Yani doğrulayıcı gerçek
  içerikte sessiz; ilk konuştuğunda söylediği şey gerçek bir hatadır.

**OTA kararları (Oturum 2.5):**
- **`runtimeVersion` politikası `fingerprint`**, `appVersion` DEĞİL. Parmak izi
  yerel bağımlılıklardan hesaplanıyor: içerik/JS değişince aynı kalır, yeni yerel
  modül girince kendiliğinden değişir. `appVersion`'da `version` alanını elle
  yükseltmek unutulabilir ve **uyumsuz bir OTA eski bir ikiliye düşüp uygulamayı
  açılmaz hâle getirebilirdi.**
- **`fallbackToCacheTimeout: 0`** — açılış hiçbir zaman beklemez, güncelleme
  arka planda iner ve **bir sonraki açılışta** uygulanır. Güncellenen şey ders
  metni; bir oturum gecikmesi kimseyi yaralamaz, açılıştaki her saniye kayıptır.
- ⚠️ **Kodda `expo-updates` çağrısı YOK ve bu bilinçli.** "Yeniden başlat"
  düğmesi (`Updates.reloadAsync()`) eklenmedi: ders durumu `useReducer`'da ve
  kalıcı değil (2.3), yeniden başlatmak cevaplanmış soruları siler. Eklenecekse
  yeri ders **dışındaki** bir ekran.
- `eas.json`'daki üç kanal (`development`/`preview`/`production`) zaten vardı;
  OTA onları ilk kez gerçekten kullanıyor.
- **Ses dosyaları OTA'nın dışında** — pakete hiç girmiyorlar. Yeni ses yayınlamak
  güncelleme değil, CDN'e dosya koymak.

**Yan ürün (Oturum 2.5):** `npx expo lint` çalıştırıldığında Expo `eslint.config.js`
dosyasını üretti ve `eslint` + `eslint-config-expo`'yu `package.json`'a **açık
devDependency** olarak yazdı (kuruluydular ama yazılı değildiler). `npm run lint`
artık çalışıyor: **0 hata, 6 uyarı** — altısı da `strings` varsayılan import'uyla
ilgili ve **bu oturumun dosyalarından değil.**

**Seviye tespiti kararları (Oturum 2.6):**
- **Sonuç kuralı: doğrula ya da BİR kademe düşür, asla yükseltme.**
  `correct*100 >= total*70` → kullanıcının beyanı onaylanır, altındaysa bir kademe
  aşağı (`beginner` taban yapar). Tam sayı aritmetiği (`lessonScoring.ts` kalıbı) —
  kayan nokta eşiğin tam üstündeki sonucu yanlış yöne yuvarlayabilirdi.
  Yükseltmemenin gerekçesi ürün: Başlangıç diyen birini altı soruya bakıp İleri'ye
  atmak, kullanıcının kendi hakkındaki bilgisini yok saymak olurdu.
- ⚠️ **`total <= 0` beyanı olduğu gibi kabul eder** ve bu tek satır iki işi birden
  görüyor: "En baştan başlamak istiyorum" yolu ve kademe havuzunun boş olduğu
  durum. **Ayrı bir store eylemi yazılmadı** — `setPlacement('beginner', 0, 0)`.
- **Atlama SIRA tabanlı, kademe tabanlı DEĞİL.** Düz sırada hedef kademenin İLK
  seviyesi giriş noktası; öncesi `skipped`, girişi `available`, **sonrasına hiç
  dokunulmuyor.** ⚠️ Fark içerikte gerçek: kademeler yol sırasında **monoton
  değil** (`beginner×4, basic, beginner×2, basic×2, advanced`). Kademe tabanlı
  kural `basic` sonucunda `u2-01`/`u2-02`'yi de atlar, `u2-03` kilitli kalır ve
  haritada **delik** açılırdı.
- **`applyPlacement` asla geri düşürmez** (`unlock.ts` felsefesi; burada gerekçe
  daha keskin çünkü sınav profilden TEKRAR edilebiliyor): `completed` kayda hiçbir
  koşulda dokunulmuyor, daha düşük bir kademe seçilse bile. `available` → `skipped`
  ileri hareket ("sıran değil, atlandı"); giriş noktasındaki `skipped` → `available`.
  Yumuşak silinmiş kaydın **üzerine** taze kayıt yazılıyor (`levelStatus.ts`'e göre
  o kayıt "hiç açılmamış" demek). Değişiklik yoksa **aynı referans**.
- ⚠️ **Giriş noktası her zaman yaşayan bir kayıt taşır.** Bu garanti olmadan
  `findCurrentLevelId` `null` döner, "Şu an buradasın" kaybolur ve kullanıcının
  gidecek yeri kalmaz. Testte üç kademe için de sınanıyor.
- `skipped` kayıt `stars`/`bestAccuracy`/`attemptCount` sıfır, `completedAt` **yok** —
  `xpForRun`'ın tam XP kuralı (2.3'te tam bu oturum için yazılmıştı) buna dayanıyor.
- **Sınav seri BAŞLATMAZ ve XP VERMEZ.** `advanceStreak` çağrılmıyor: gün serisini
  bir sınavla başlatmak, hiç ders yapmadan seri sahibi olmak demekti.
- ⚠️ **`placement` ile `levels` AYNI `set` çağrısında** yazılıyor. Ayrılsalardı
  arada bir çizim "tespit yapıldı ama harita eski" gösterirdi.
- **Sorular ayrı dosyada: `content/placement.json`**, ders içeriğinden türetilmiyor.
  İki sebep: kullanıcı sınavda gördüğü soruyu birkaç dakika sonra derste tekrar
  görmemeli, ve bir kademenin sınavı o kademede kaç seviye bulunduğuna bağlı
  olmamalı (bugün `advanced` tek seviye taşıyor). Kimlik ön eki `q-plc-<kademe>-nn`.
  ⚠️ Havuz **tekil bir dosya**, `path.json` gibi bir gezinti noktası yok — bölünürse
  hem `contentLoader` hem `scripts/checkContent.ts` öğrenmeli.
- **`validatePlacementContent`**: soru başına denetim ders sorularıyla **birebir
  aynı** (`validateQuestion` yeniden kullanıldı) + kademe başına en az bir soru
  (uyarı) + **ders kimlikleriyle çakışma** (hata). Kimlik listesi doğrulayıcıya
  argüman olarak veriliyor; o dosya saf kalmalı (`contentLoader`u içeri almak
  döngüsel bağımlılık olurdu).
- **`lessonSession.ts` ikiye ayrıldı, DAVRANIŞ DEĞİŞMEDİ**: `createQuestionSession`
  (düz soru listesi) + `createLessonSession` (onun üstünde ince sarmalayıcı).
  2.3'ün "indirgeyici seviyeyi/XP'yi bilmez" kararının karşılığını verdiği yer;
  `buildSummary` sınav tarafında **kullanılmıyor**.
- **Oturum durumu yine `useReducer`**, Zustand değil — store tekil ve sınav ile ders
  aynı anda yaşarsa çakışırlardı (2.4'te yazılmış gerekçe).
- ⚠️ **Sonuç `advance` işleyicisinden yazılıyor, `useEffect`'ten DEĞİL** —
  `reactCompiler` + StrictMode etkileri iki kez çalıştırıyor. `applyPlacement`
  idempotent olduğu için sonuç aynı olurdu ama `placement.completedAt` iki farklı
  an gösterirdi.
- **Kapı `(tabs)/_layout.tsx`'te bildirimsel `<Redirect>`**, `useEffect` +
  `router.replace` değil. ⚠️ Depolama **senkron** olduğu için `placement` daha ilk
  çizimde doğru ve sekme çubuğu tek bir kare bile parlamıyor — 2.4'teki depolama
  kararının ikinci kez karşılığını verdiği yer. Kapı sekmelerin ÖNÜNDE, kök
  yerleşimde değil: `/lesson/[id]` derin bağlantısı buradan geçmiyor ve geçmemeli,
  ders ekranının kendi kilit denetimi zaten yerinde.
- **`OptionCard` `features/learning/components/question/` → `components/` taşındı**
  ve `body?` prop'u aldı (mimari kural 3). Kademe seçimi tam olarak o kontrolü
  istiyordu; yeni bir kart yazmak 2.2a'da ölçülmüş bütün renk kararlarını ikinci
  kez vermek olurdu. ⚠️ `body` satırı `textSecondary`, `textMuted` **değil** —
  seçili kartın dolgusu `primarySoft` ve 2.3'ün "renkli yumuşak dolgu üzerine
  `textMuted` gelmez" kuralı burada da geçerli.
- ⚠️ **`strings.onboarding.alreadyHaveProgress` bilerek ÇİZİLMEDİ.** Bir hesap
  kurtarma akışını ima ediyor; bugün hesap yok, ilerleme yalnızca cihazda (bulut
  Faz 7). Hiçbir yere gitmeyen bir bağlantı, olmayan bir özelliği vaat ederdi.
- **Günlük hedef ATLANABİLİR** ve `dailyGoal` `null` kalabilir: henüz hiçbir yerde
  kullanılmayan bir tercihi (hedef takibi Faz 3) uygulamaya girişin önünde engel
  yapmak yanlıştı. ⚠️ Dakika değerleri **etiketin içinde**, `DailyGoal` değerinin
  yanında değil — diske yazılan şey niyet, o niyetin bugünkü dakika karşılığı değil.
- **`persist` `version: 1 → 2`** (`dailyGoal` için `migrate`). `placement` migrate
  istemedi: yazıcısı 2.6'ya kadar hiç olmadığı için diskteki her kayıtta zaten `null`.
- `contentLoader`'a **`findUnitByLevelId`** eklendi (sonuç ekranı ünite ADI
  gösteriyor; seviye → ünite yönünde eşleme hiçbir yerde yoktu). `findLevelById`
  ile aynı geçişte kuruluyor.
- **148 test geçiyor.** `tests/placement.test.ts` sınama yolunu bilerek **monoton
  olmayan** kademelerle kuruyor; o desen olmadan sıra tabanlı ile kademe tabanlı
  kural aynı sonucu verir ve test kuralı gerçekten sınamaz.
- `strings.ts`: `onboarding` genişletildi (kademe etiketleri, sınava özel çıkış
  onayı — ⚠️ `lesson.quitMessage` "bu dersteki ilerlemen" diyor, sınav için yanlış
  cümle —, sonuç satırları), `profile`'a üç satır. **`colors.ts` değişmedi.**

**Seri kararları (Oturum 3.1):**
- **Üç katman.** `lib/database.ts` (tek `.db`, `PRAGMA user_version` göçleri) ·
  `features/progress/activityDb.ts` (yerel, testsiz, **karar mantığı yok**) ·
  `features/progress/dayLog.ts` (**saf**, testli, `expo-sqlite` bilmez).
  ⚠️ **`dayLog` `activityDb`'yi ASLA import etmez** — ters bağımlılık tüm test
  paketini okunamaz bir hatayla patlatır. 2.5'teki `audioKey`/`audio` ayrımı.
- ⚠️ **`lib/database.ts` bilerek `features/` altında DEĞİL.** `PRAGMA user_version`
  veritabanı başına **tek** sayaç; Faz 4 (namaz) ve Faz 5 (Kur'an) aynı `.db`'yi
  açacak. Sürümü özellik klasörüne gömmek, ilk çakışmada bir özelliğin tablosunun
  hiç yaratılmamasıyla biterdi. `MIGRATIONS` dizisinin **sırası asla değişmez**,
  aradan madde silinmez; yeni tablo listenin SONUNA gelir.
- ⚠️ **`PRAGMA user_version = ?` parametre BAĞLAMAZ** (SQLite pragma'da yer
  tutucu kabul etmiyor); sayı dizgeye gömülü. "Düzeltip" parametreli yapmak göçü
  sessizce kırar — sürüm 0'da kalır ve her açılışta baştan koşar.
- **Dondurma (freeze) KALICILAŞTIRILMIYOR, gün listesinden yeniden oynatılıyor.**
  Diskte freeze tablosu/sütunu yok. Gerekçe Faz 7: freeze bir veri değil, veri
  üzerinde bir **hesap sonucudur**; kalıcılaştırılsaydı çevrimdışı iki cihaz aynı
  boşluğu farklı görür ve sync sonrası "gün kaydı var ama onu çelişkiye düşüren
  freeze satırı da var" durumu doğardı — düzeltmesi ya sert silme (kural 6 ihlali)
  ya da kayan pencerenin kalıcı kirlenmesi. Gün kümesi bir *küme*; birleşimi
  sıradan bağımsız ve tekrara dayanıklı. **Aynı gün kümesi → aynı sonuç.**
  ⚠️ İki bedel kabul edildi: (i) kural değişimi geçmişi geriye yazar (kaçış yolu
  `STREAK_RULES`in parametre olabilmesi), (ii) **yalnız otomatik hak
  türetilebilir** — ileride satın alınan/rozetle kazanılan freeze kalıcı olmak
  zorunda, hiçbir gün verisinden çıkarılamaz.
- **Kayan 7 gün**, takvim haftası değil (kullanıcı kararı): takvim haftasında
  pazar akşamı + pazartesi ard arda iki dondurma mümkün olurdu. Sınır gün
  **dahil** (`>= 7`); iki komşu test (`6. gün hak YOK` / `7. gün hak VAR`) bunu
  çiviliyor.
- ⚠️ **Dondurulan gün sayaca EKLENMEZ**, onu izleyen etkin gün ekler. 5 günlük
  seri + kaçırılan gün + bir ders = **6**, 7 değil. `currentDays` "kaç gün ders
  yaptım"ı anlatır; yan kazanç `currentDays <= totalActiveDays` sınanabilir bir
  değişmez olması (Faz 3.2'nin rozet eşikleri hak edilmeden tetiklenmesin diye).
- **`StreakStatus` beş değerli**: `none` · `active` · `atRisk` · `frozen` ·
  `broken`. ⚠️ `atRisk` ve `frozen`'da **`currentDays` DÜŞMEZ** — "seri 5 gün"
  yazarken "bugün henüz ders yapmadın" demek doğru, sayıyı düşürmek kazanılan
  günleri geri almak olurdu. Ayrım sayıda değil `status` alanında; alanın var
  olma sebebi bu. `none` ile `broken` ayrı çünkü `strings.progress` hem
  `streakStarted` hem `streakLost` taşıyor.
  ⚠️ `status: 'frozen'` iken hak **REZERVE**, tüketilmiş değil → `frozenDates`'e
  girmez: boşluğun ikinci ucu (sonraki etkin gün) henüz yok, kullanıcı bugün de
  oynamazsa boşluk üçe çıkar ve hak harcanmamış olur.
  ⚠️ `enum` **değil** union type — Node tip soyucusu `enum` desteklemiyor.
  ⚠️ `STREAK_RULES`te `as const` **kullanılmaz**: değerler `7`/`2` birebir
  tiplerine daralır ve `Partial<StreakRules>` ile kural geçersiz kılınamazdı.
- **`StreakState` artık türetilmiş ÖNBELLEK.** `advanceStreak` **silindi**;
  `partialize`'dan **`streak` çıkarıldı**, `persist` `version: 2 → 3` (migrate
  alanı atıyor). Türetilmiş alanları düşüren **tek kapı** `toStreakState` —
  store içinde elle nesne kurulsaydı er geç biri `status`u da kopyalardı.
  Testi anahtar sayısı denetimi (`Object.keys().length === 4`).
  ⚠️ Eski `lastActiveDate`'ten tabloya tohum satırı yazmak **elendi**: `migrate`
  saf ve senkron olmalı, içine DB yazması koymak katman ihlali. Bugünkü maliyeti
  sıfır — MMKV kapalı, diskte kayıt yok.
- **`date` birincil anahtar — bu bir SYNC kararı.** Gün, kullanıcı başına doğal
  ve global anahtar; iki cihaz aynı günü yazarsa **aynı satırdır** ve `updated_at`
  ile çözülür. Sentetik kimlik seçilseydi aynı gün için iki satır oluşur ve bu
  tabloya özel bir birleştirme kuralı yazmak gerekirdi.
  ⚠️ UPSERT'te **`deleted_at = NULL`** satırı kritik: yumuşak silinmiş gün
  dirilmeli (`unlock.ts`in aynı kuralı). ⚠️ Silinmiş satırda `lesson_count`
  toplamak "silinmiş sayacı" devralır; bugün kabul edildi çünkü yumuşak silmenin
  tek çağıranı `resetProgress` ve o **tüm** satırları siliyor — kısmi silme
  geldiği gün o satır `CASE`e dönmeli.
  ⚠️ `ORDER BY date ASC` **metinsel** sıralama ama `YYYY-MM-DD` sabit genişlikte
  ve sıfır dolgulu olduğu için takvim sırasıyla aynı.
- ⚠️ **`recordActivity` `set` updater'ının DIŞINDA çağrılıyor.** Zustand updater'ı
  saf sayar; React 19 + `reactCompiler` altında iki kez çalışması `lesson_count`u
  sessizce ikiye katlardı. 2.3'ün "tamamlanma sinyali `useEffect`ten değil
  işleyiciden" kararıyla aynı sınıf.
- ⚠️ **`resetProgress` `softDeleteAllActivity` çağırmalı.** Yoksa "her şeyi
  sıfırla" dedikten sonra seri hayalet gibi geri gelir (MMKV boşalır, tablo
  yerinde durur) ve geliştirme kaçış kapağı elle sınamada yanlış zemin kurar.
- **`refreshStreak()` modül yüklenirken bir kez çağrılıyor** (`openEntryPoint`in
  yanında): `streak` diske yazılmadığı için önbelleğin açılışta kurulması şart.
  İkinci gerekçesi gece yarısı bayatlaması — uygulama açık kalırken gün dönerse
  `status` yalan söyler. `AppState` dinleyicisi **Faz 3.2'nin işi**.
- ⚠️ **`longestDays` artık veriden geliyor; "asla düşmez" garantisi YOK.** Bir gün
  yumuşak silinirse rekor düşebilir. `Math.max(önbellek, hesap)` ile maskeleme
  **YAPILMADI** — gizli durum olurdu ve "SQLite tek kaynak" kararını ilk günde
  delerdi. Kabul edilen sonuç.
- ⚠️ **İKİ DAVRANIŞ BİLİNÇLİ DEĞİŞTİ** (eski `advanceStreak`e göre): biçimi bozuk
  tarih artık seriyi sıfırlamıyor, **o giriş atılıyor**; ileri tarihli gün artık
  seriyi sıfırlamıyor, **yok sayılıyor**. Ayrıca uzun boşlukta `currentDays`
  eskiden `1`di, artık **`0`**.
- **Tüm geçmiş okunuyor, pencere yok**: `longestDays` zaten hepsini istiyor,
  süregelen seri de keyfi uzun olabilir. Günde en fazla bir satır → 10 yıl 3650
  kısa dizge. **10.000 satırın altında optimizasyon yapma** (çözüm hazır:
  `streak_summary` özet tablosu, bugün yazma).
- **177 test geçiyor.** ⚠️ `tests/activityDb.test.ts` **yazılamaz** — Node
  koşucusu yerel modül yükleyemez. ⚠️ `package.json`'a `TZ=... npm test` script'i
  **EKLENMEDİ**: Windows cmd `VAR=x cmd` önekini anlamaz ve sessizce yerel saat
  diliminde koşup yanlış güven verir. Elle doğrulama (PowerShell):
  `$env:TZ='Pacific/Kiritimati'; npm test` ve `$env:TZ='Pacific/Midway'; npm test`
  — ikisi de 177/177 geçti.
- **`features/progress/useStreak.ts` bilerek YAZILMADI** — tüketicisi yok,
  Faz 3.2'de arayüzle birlikte. `strings.ts` ve `colors.ts` **değişmedi**.

**Rozet kararları (Oturum 3.2):**
- **Kazanımlar SQLite'ta** (`badge_unlock`, `MIGRATIONS[1]`), MMKV'de DEĞİL.
  Gerekçe seriden farklı: seri her açılışta `activity_day`den yeniden
  **hesaplanabiliyor** çünkü girdisi kalıcı; rozetin girdisi (`xpTotal`,
  `levels`) MMKV'de ve Expo Go'da yok. Yani yeniden hesaplama yolu KAPALI,
  kalıcı olması gereken şey **sonucun kendisi**. MMKV'ye yazılsaydı her soğuk
  açılışta rozetler silinir ve yeniden kazanılırdı — ders sonu kutlaması her
  açılışta patlardı. Yan kazanç: `partialize` beyaz liste olduğu için persist
  **`version` 3'te kaldı**, `migrate`a satır eklenmedi.
- ⚠️ **`badge_id` içerikten gelen bir VERİTABANI ANAHTARIDIR.** Yayınlanmış bir
  kimliği `badges.json`da değiştirmek eski kazanımı öksüz bırakır ve rozeti
  yeni kimlikle yeniden kazandırır (kutlama da tekrar çıkar). Doğrulayıcı bunu
  **yakalayamaz** — tek dosyaya bakıyor; koruma dosyadaki `note` ve bu satır.
- ⚠️ **GERİ ALMA YOK ve bu imza düzeyinde bir garanti**: `evaluateBadges`
  yalnızca yeni kazanılanları döndürüyor, "kaybedildi" diye bir dönüş değeri
  **yok**. Expo Go'da soğuk açılışta `xpTotal` sıfırlandığı için geri alma
  mümkün olsaydı kullanıcı uygulamayı kapattığı için rozetini kaybederdi.
  Amnezi en kötü ihtimalle "bugün yeni rozet yok" der.
- **"Olay" = store'da boşaltılabilir kuyruk** (`pendingBadges` +
  `drainPendingBadges`), emitter DEĞİL. Projede zaten bir abonelik mekanizması
  var (Zustand); ikincisi dinleyici yaşam döngüsü getirirdi. Belirleyici olan:
  `completeLevel` cevap işleyicisinde çalışıyor, kutlamayı gösterecek yüzey
  SONRA monte oluyor — emitter'ın mesajı boşluğa giderdi, **kuyruk bekler.**
  Diske yazılmıyor: bu bir arayüz sinyali, veri değil.
- **Açılışta geriye dönük tarama VAR ama SESSİZ** (`syncBadges(now, true)`).
  Gerekçe OTA: yarın katalog beş rozet kazanırsa bugünün kullanıcısı onları
  hiç kazanamazdı, eşiği çoktan geçmiş ve o "geçme anı" bir daha yaşanmayacak.
  Sessiz çünkü tarama modül gövdesinde, React monte olmadan çalışıyor ve bir
  katalog güncellemesi on iki rozeti aynı anda kazandırabilir.
- **Koşul `condition.type` üzerinde ayırt edici birleşik tip.** `unitCompleted`
  düz şekle zorlanmadı — doğrulanacak hiçbir şeyi olmayan anlamsız bir
  `threshold: 1` üretirdi. ⚠️ `enum` değil union: Node tip soyucusu `enum`
  desteklemiyor.
- ⚠️ **`skipped` SAYILMAZ** (ne `levelsCompleted` ne `unitCompleted`): tespit
  sınavı rozet dağıtırdı, kullanıcı hiç görmediği içerik için rozet alırdı.
  3.1'in `currentDays <= totalActiveDays` değişmezinin bu oturumdaki karşılığı.
- **`streakDays` ölçütü `longestDays`**, `currentDays` değil: monoton olduğu
  için serisi kırılmış kullanıcı geriye dönük taramada hakkını alıyor.
  ⚠️ Bu bir gün `currentDays`e çevrilirse **`refreshStreak` tetikleyici olmak
  ZORUNDA** (gece yarısı geçişi bugünkü değeri değiştiriyor).
- ⚠️ **`recordBadgeUnlock` `set` updater'ının DIŞINDA ve `setState` nesne
  biçiminde**, updater biçiminde değil: React 19 + `reactCompiler` updater'ı
  iki kez çalıştırıyor ve kuyruk `[...eski, ...yeni]` ile büyütülseydi
  kullanıcı her rozeti iki kez görürdü. İkinci savunma `queueBadges` /
  `mergeAwards` / `ON CONFLICT` üçlüsünün idempotensliği.
- **Boş ünite rozet VERMEZ**: `every` boş dizide `true` döner; koruma olmadan
  seviyesiz bir ünite bedava rozete dönerdi. `threshold <= 0` da elenmiş —
  "herkese hemen ver" demek olurdu.
- **Doğrulama sınırları argüman olarak geliyor** (`BadgeContentLimits`),
  `validatePlacementContent`ın `pathQuestionIds` çözümünün aynısı;
  `contentValidation.ts` saf ve sessiz kaldı. ⚠️ `xpTotal` eşiğinin yolun ilk
  geçiş XP toplamını aşması **`warning`, `error` değil**: XP'nin tavanı yok,
  tekrar çalışma `xpForRun` ile azaltılmış XP veriyor.
- **Arayüz: iki yüzey, kayan toast YOK.** Profilde koleksiyon
  (`BadgeSection`), ders sonunda kutlama (`BadgeEarnedSection`). Portal/overlay
  altyapısı kurulmadı; `theme.overlay` hâlâ tüketicisiz. ⚠️ Kuyruk **`onDone`
  işleyicisinde** boşaltılıyor, `useEffect`te değil.
- **`BadgeCard` `LevelNode`un ölçümlerini devraldı, yeniden ölçmedi**: durumu
  renk değil **ikonun biçimi** taşıyor (WCAG 1.4.1'in dördüncü uygulaması);
  kazanılmış `primarySoft` dolgu + `primary` ikon (**4.17**), kilitli
  `borderStrong` halka + **`textMuted`** kilit (`disabledText` 1.97 ile
  görünmüyor). ⚠️ `borderControl` **kullanılmadı** — jetonun tanımı
  "dokunulabilir öğenin sınırı", rozet kartı dokunulabilir değil.
- ⚠️ **XP rozetleri Expo Go'da pratikte kazanılamaz**: `xpTotal` her soğuk
  açılışta sıfırlanıyor, 100 XP tek oturumda toplanmalı. *Elenen çözüm:*
  `SUM(xp_earned)`i `activity_day`den okumak — o zaman rozet "ömür boyu XP"ye,
  `strings.progress.totalXp` oturumluk XP'ye bakar ve ekranda **"Toplam XP 40"
  ile "100 XP rozeti kazanıldı" yan yana** görünürdü. Dev build geldiği gün
  sorun **kod değişmeden** kaybolur.
- **215 test geçiyor.** `tests/badgeDb.test.ts` **yazılamaz** (yerel modül).
  `strings.ts`e beş satır eklendi (`badgeEarned`, `badgeEarnedPlural`,
  `badgeLocked` + iki a11y), **`colors.ts` değişmedi.**

**Mağaza materyalleri kararları (Oturum 2.5.3):**
- **Dört belge, `Planlamalar/Magaza/` altında**, hepsi Türkçe ürün metni:
  `GIZLILIK_POLITIKASI.md`, `MAGAZA_METINLERI.md`, `VERI_GUVENLIGI_FORMU.md`,
  `README.md` (giriş kapısı + yayın engelleri + elle yapılacaklar).
  **Kaynak kodda tek satır değişmedi.**
- ⚠️ **Politika TASLAK ve öyle kalıyor.** Belgenin ilk satırı hukuki inceleme
  uyarısı; sonunda "Hukukçuya sorulacaklar" başlığı altında yedi açık madde var
  (KVKK/VERBİS, IP'nin durumu, Expo'nun veri işleme şartları, COPPA/GDPR-K,
  dini içeriğin özel nitelikli veri sayılıp sayılmayacağı, yayıncı kimliği).
  Bunlar bilinçli olarak **cevaplanmadan** bırakıldı.
- **Politikanın dayanağı tahmin değil, koddan çıkarılmış envanter.** Diske
  yazılan alanlar `store.ts:132-140` ile birebir eşleşiyor; cihazdan çıkan iki
  isteğin (Expo güncelleme kontrolü, ses indirme) kaynağı gösterildi. Envanter
  değişirse politikanın 2. ve 3. maddesi değişmeli.
- **Yer tutucu düzeni:** `{APP_NAME}` (=**Dualingo**, geçici), `{YAYINCI_ADI}`,
  `{İLETİŞİM_EPOSTA}`, `{POLİTİKA_URL}`, `{YÜRÜRLÜK_TARİHİ}`. Kullanıcı kararı:
  ad geçici olarak Dualingo ama **tek geçişte değişebilsin** diye gövdeye
  gömülmedi. Kişisel e-posta belgeye yazılmadı. Doğrulama komutu `README.md`'de.
- ⚠️ **Namaz ve Kur'an mağaza metinlerinde ÖZELLİK olarak sunulmadı** — bugün
  o sekmeler `ComingSoon`. Olmayan özelliği anlatmak ret sebebi.
- ⚠️ **"Uzman onaylı içerik" iddiası metne KONMADI.** Bugün içerik örnek veri;
  iddia gerçek içerik geldiğinde doğru olacak ve o gün eklenebilir.
- ⚠️ **Anahtar kelimelerde rakip marka adı yok** ("Duolingo tarzı" gibi ifadeler
  iki mağazada da doğrudan ret sebebi).
- Metin uzunlukları **tahmin değil, ölçüldü** ve komut belgede duruyor;
  hepsi sınırın altında (en dar alan: Play kısa açıklaması 73/80).
- ✅ **Bu engel Oturum 4.1'de KAPANDI** (aşağıdaki madde tarihsel kayıt):
  `app.json` izin listesi `ACCESS_COARSE_LOCATION` tek maddesine indirildi ve o
  da artık gerçek bir özelliğe dayanıyor. ⚠️ `ACCESS_FINE_LOCATION`'ın gerçekten
  düştüğü `npx expo prebuild` birleşik manifestinde **doğrulanmalı**.
- ⚠️ **YENİ YAYIN ENGELİ BULUNDU — `app.json` kullanılmayan izin bildiriyor.**
  Konum (+iOS izin metni), `RECORD_AUDIO`, `FOREGROUND_SERVICE*`,
  `expo-notifications`, `expo-sqlite`: hiçbirinin kaynakta **tek kullanımı yok**,
  hepsi Faz 4-5 altyapısı. Play izinlerin açıklanan işlevle eşleşmesini şart
  koşuyor; `RECORD_AUDIO` ve ön plan servisi ayrı gerekçe formu tetikliyor.
  **Kullanıcı kararı: bu oturumda sadece raporlandı, `app.json`'a dokunulmadı.**
  Temizlik yerel yapılandırma değişikliğidir — OTA ile gitmez, yeni derleme
  ister; Faz 4 zaten yeni derleme gerektirdiği için bedeli yok.
- ⚠️ **Veri güvenliği formunun tek gri alanı: güncelleme sunucusuna giden IP.**
  Formu ilk kez dolduranın düşünmeden "hayır" diyeceği yer. Belirleyici olan
  Expo'nun bu isteği loglayıp saklamadığı — **bizim kodumuzdan görülemez**,
  Expo'nun belgesiyle netleşmeli. Kaçış yolu var (`updates.enabled: false`) ama
  bedeli OTA'dan vazgeçmek.
- **Formu geçersiz kılacak değişiklikler listelendi**: Sentry (çökme kaydı =
  toplanan veri), bulut senkronizasyonu (Faz 7), push bildirimi, konum (Faz 4),
  reklam/satın alma. Biri girdiği gün form yeniden doldurulur.
- `assets/images/icon.png` ve `splash-icon.png`'nin **hâlâ Expo şablonu olduğu
  doğrulandı** (`splash-icon.png`, `expo-logo.png` ile aynı dosya, 3317 bayt).

**Kutlama kararları (Oturum 3.3):**
- **Kutlama koşulu `isFirstCompletion || isNewRecord`** (kullanıcı kararı): sıradan
  bir tekrar ekranı son hâlinde, hareketsiz açıyor. Üçüncü kez aynı dersi çalışan
  kullanıcıyı her seferinde aynı sahneyle bekletmek kutlamayı ödül olmaktan çıkarıp
  gecikmeye çevirirdi.
- ⚠️ **`isNewRecord` için `previousStars` oturum BAŞINDA donduruluyor**
  (`LessonSessionState`), `wasCompletedBefore` ile birebir aynı gerekçe: canlı
  okunsaydı `completeLevel` sonucu yazdığı anda değer bu koşunun yıldızına döner ve
  `isNewRecord` **her zaman `false`** çıkardı — kutlama hiçbir tekrarda oynamazdı.
  Donma noktası `useReducer`'ın tembel ilklendiricisi; bu yüzden çağrı yerinde
  ayrıca `useState`e sarmak GEREKMEZ ve sarılmamalı (ikinci bir donma noktası
  yanıltıcı olur). ⚠️ Sıfır yıldızla biten **ilk** koşuda `isNewRecord` false'tur;
  o durumu `isFirstCompletion` taşıyor, ikisi ayrı sorular.
- ⚠️ **`createQuestionSession`'ın `previousStars` varsayılanı 0 ZORUNLU** — tespit
  sınavı onu tek argümanla çağırıyor ve bir seviyesi, dolayısıyla yıldızı yok.
- ⚠️ **"Sonraki ders" `findCurrentLevelId` KULLANAMAZ**, yeni `findNextLevelId`
  yazıldı. Fark gerçek: yolun ortasındaki tamamlanmış bir seviyeyi tekrar eden
  kullanıcıda ilk `available` çok ileride kalır ve buton kullanıcıyı **yol
  atlatarak** ileri fırlatırdı. Test ikisini yan yana koyup farkı çiviliyor.
  `locked` olmayan ilk seviye hedef sayılıyor (`completed`/`skipped` de tekrar
  oynanabilir; `xpForRun` tekrarı zaten ayrıştırıyor).
  `levelStatus.ts` **yalnızca `@/types` import etmeyi sürdürüyor** — `unlock.ts`'in
  `flattenLevelIds`'i buraya çekilmedi, iç içe döngü yerinde yazıldı.
- ⚠️ **`drainPendingBadges()` İKİ çıkışta da çağrılmak ZORUNDA.** 3.3'e kadar tek
  çıkış vardı; "Sonraki ders" kuyruğu boşaltmasaydı **aynı rozet bir sonraki dersin
  sonunda ikinci kez kutlanırdı**, üstelik o ders onu kazandırmamışken. Tek bir
  `leave(go)` yardımcısına bağlandı; üçüncü bir çıkış eklenirse de aynı kapıdan
  geçer. Kuyruk yine **işleyicide** boşalıyor, `useEffect`te değil.
- **Gezinme `router.replace`, `push` DEĞİL**: `push` her derste yığına bir kare
  eklerdi, on ders sonra geri tuşu kullanıcıyı bitirdiği derslerin içinde gezdirirdi.
  ⚠️ Ayrıca `<LessonFlow key={level.id}>` eklendi: bugün `replace` yeni rota anahtarı
  üretip ekranı yeniden monte ediyor, ama oturum durumu tembel ilklendiriciye bağlı —
  o varsayım değişirse kullanıcı yeni derste ESKİ dersin sorularını görürdü. `key`
  bunu yapısal olarak imkânsız kılıyor.
- **Lottie slotu: `CELEBRATION_SOURCE` bilerek `null`.** Var olmayan bir yola
  `require` yazmak çalışma anı `null`'ı değil **Metro derleme hatası** verir
  (`imageRegistry.ts`'in aynı mayını). Yedek `mascot.png`; dosya geldiğinde değişen
  tek şey o sabit. ⚠️ Lottie çizildiğinde oynatılmıyorsa **`progress={1}`** ile SON
  kare gösteriliyor — ilk kare çoğu dosyada boştur ve slot sessizce bomboş kalırdı.
  `lottie-react-native` Expo Go'nun **paketli** modüllerinden, dev build istemiyor.
- **`LevelStars` genişletildi, ikinci bir yıldız bileşeni YAZILMADI** (mimari kural
  3): ölçülmüş renkleri (`secondaryStrong` 3.69/11.63) taşıyan tek yer orası.
  `animateIn` **varsayılan `false`** → haritadaki `LevelNode` davranışsal olarak hiç
  değişmedi (kaydırdıkça patlayan yıldızlar liste boyunca gürültü olurdu).
  ⚠️ Kancalar `.map` içinde çağrılamadığı için her yıldız kendi `Star` çocuk
  bileşenine taşındı. ⚠️ Boş yıldız hiçbir zaman animasyonlanmıyor — kazanılmayan
  bir şeyin belirmesi kutlama değil, yanlış vaat olurdu. Düzen kaymıyor: dolu ve boş
  ikon aynı ölçüde, yuva yerini koruyor.
- ⚠️ **`motion.ts`'e `Easing.back` girdi ve bu bilinçli bir SAPMA.** Dosyanın
  doktrini yayı reddediyor ("hızlı tekrarlanan etkileşimde oturmaya vakit
  bulamıyor") ama o gerekçe **basma geri bildirimine** ait; kutlama ders başına en
  fazla bir kez oynayan bir sahne ve oynarken ekranda başka hareket yok. Gerekçe
  jetonun yorumunda duruyor — bir sonraki oturum onu doktrin ihlali sanıp silmesin.
  Ayrıca yeni `sequence` nesnesi (`starStagger` 160 / `xpStart` 520 /
  `xpDuration` 700): ⚠️ bunlar `withTiming` yapılandırması **değil** düz
  milisaniyeler, o yüzden `timing`den ayrı duruyorlar.
- **XP sayacı `useCountUp` + saf `countUpValue`.** ⚠️ Reanimated paylaşılan değeri
  KULLANILMADI: metne yansıtmanın tek yolu `useAnimatedProps` +
  `createAnimatedComponent(TextInput)`, yani gösterilecek sayıyı bir GİRDİ alanına
  koymak — yanlış erişilebilirlik rolü, tipografi jetonlarını uygulamayan bileşen,
  klavye riski. Tek satır için ödenecek bedel değil.
  ⚠️ **Yuvarlama `floor`, `round` DEĞİL**: `round` son karelerden çok önce hedefi
  yazar ve sayaç bitmeden bitmiş görünürdü. ⚠️ **Bozuk girdi sessizce HEDEFİ verir**
  (`NaN`/`Infinity`/`duration <= 0`) — `ProgressBar`'ın "bozuk girdi sessizce boş
  çubuk" disiplininin tersi yönü, çünkü burada güvenli hâl boş değil TAM: kullanıcı
  kazandığı XP'yi eksik görmemeli.
- ⚠️ **Sayan rakam ekran okuyucuya OKUNMUYOR**: XP satırı `accessible` bir `View`
  ile sarılıp etiket **son** değerden kuruluyor. Olmasaydı ekran okuyucu tek bir
  "+40 XP" yerine onlarca ara değeri arka arkaya anons ederdi. `ProgressBar`'ın
  "anonsa giden sayı görünenle aynı kaynaktan" kuralının bilinçli tersi.
- **242 test geçiyor** (215'ten). `tests/countUp.test.ts` ve `tests/lessonSession.test.ts`
  yeni; `findNextLevelId` `levelStatus` testine eklendi. `colors.ts` **değişmedi**,
  `strings.ts`'e **bir satır**: `result.nextLesson`. ⚠️ Var olan `result.keepGoing`
  ('Yola devam') kullanılmadı — `backToPath` ('Yola dön') ile bir harf farkla
  karışıyor, oysa ikisi farklı yerlere gidiyor.

**Namaz veri kaynağı kararı (Oturum 4.0 — araştırma, kod yazılmadı):**
- **Kaynak: `https://ezanvakti.emushaf.net`** — Diyanet'in yayınladığı tabloların
  üçüncü taraf mirror'ı. Anahtar yok. **Kapsam yalnızca Türkiye** (v0.3).
  Tam araştırma ve elenen seçenekler: **`Planlamalar/NAMAZ_VERI_KAYNAGI.md`**.
- ⚠️ **Araştırmanın önerisi bu DEĞİLDİ.** Öneri `adhan` ile cihazda hesaplamaktı
  (saf JS, MIT, çevrimdışı, hukuken temiz). **Kullanıcı mirror'ı seçti**, gerekçe:
  hesaplanmış değil Diyanet'in fiilen yayınladığı rakamlar olması. Karar bilinçli,
  **iki risk açıkça üstlenildi**: (i) servis tek kişilik gönüllü bir projedir ve
  **yazılı kullanım şartı yoktur**, kapanabilir; (ii) Diyanet'i proxy'lediği için
  `502` dönebilir. Bu yüzden sağlayıcı **tek arayüzün arkasına** kapatılacak —
  değişimi tek dosyalık iş olmalı.
- ⚠️ **Diyanet'in resmi API'si var ama istemciden KULLANILAMAZ**
  (`awqatsalah.diyanet.gov.tr`): **servis başına 5 istek**, yıllık endpoint
  **aylık 10**. Kullanmak önbellekli proxy sunucu ister, yani Faz 7'yi öne çekmek.
  Kayıt da self-servis değil, form doldurup göndermek gerekiyor.
- ⚠️ **Siteden toplu kazıma YAPILMAYACAK** — FSEK **Ek m.8** (sui generis
  veritabanı hakkı) içeriğin "tamamının başka ortama aktarılmasını" yapımcının
  iznine bağlıyor; eser niteliği aranmıyor, "büyük emek ve yatırım" yeterli.
- **Çevrimdışını çözen şey önbellek:** `GET /vakitler/{ilceID}` tek gün değil
  **bir aylık pencere** döndürüyor (ölçülen 32 kayıt). Bir istek bir aylık veri
  getiriyor, SQLite'a yazılıyor, uygulama arada **internetsiz** çalışıyor ve
  bildirimler önden kurulabiliyor. Yeni tablo `lib/database.ts`'teki **aynı
  `.db`'ye**, `MIGRATIONS` listesinin **SONUNA** (Faz 3.1 kuralı). Tarih anahtarı
  `'YYYY-MM-DD'`, `toLocalIsoDate` ile — `toISOString()` **kullanılmaz**.
- ⚠️ **PENCERE BUGÜNDEN BAŞLAMIYOR — servis ilçe başına ÖNBELLEKLİ.** 20.08.2026'da
  ölçüldü: ilçe 9541 → 15.08–15.09, 9206 → 16.08–16.09, 9335 → 17.08–17.09.
  Başlangıç ilçeye göre değişiyor ve hiçbiri bugün değil. Sonuçları:
  (i) **`data[0]` bugün DEĞİLDİR**, bugünün kaydı tarihle aranmalı;
  (ii) yanıt **geçmiş günler içerir**, süzülmeli;
  (iii) yenileme eşiği **kayıt sayısından değil, yanıttaki EN SON TARİHTEN**
  hesaplanmalı (aynı ilçe 15 dk arayla 34 ve 32 kayıt döndürdü);
  (iv) önbellek yeterince bayatsa **bugünün kaydı hiç gelmeyebilir** — bu hata
  değil, boş durumdur, ısrarla yeniden denenmemeli.
- ⚠️ **İki alan tuzağı:** `HicriTarih*Iso8601` alanları **`null` geliyor**,
  güvenilmemeli. `MiladiTarihKisaIso8601`'in **adı yanıltıcı, içeriği ISO değil**
  (`"15.08.2026"`); projenin tarih kuralına çevrilmesi gerekiyor.
- ⚠️ **Mağaza metni "Diyanet onaylı / resmi" DEMEZ.** Veri Diyanet'in yayınladığı
  tablodur ama uygulama Diyanet'in değildir ve kurumla anlaşması yoktur. Doğru
  ifade: *"Diyanet İşleri Başkanlığı'nın yayınladığı vakitler"*, ekranda atıfla.
- **Konum izni ZORUNLU DEĞİL:** kullanıcı ilçe seçebilir, `expo-location` yalnızca
  "konumumu bul" kısayolu. İzin istemeden çalışan bir yol kalmalı.
- **Kıble için ek kaynak gerekmiyor:** yanıt zaten `KibleSaati` taşıyor.
- ⚠️ **Faz 4.1'e devreden açık soru:** önbellek boş + ağ yokken `adhan` yedeği
  konacak mı? **Varsayılan tutum HAYIR** — iki kaynağın rakamları farklı olur ve
  aralarında sessizce gidip gelmek güven kaybettirir. Boş durum dürüstçe gösterilir.
- ⚠️ **Gizlilik politikası ve veri güvenliği formu güncellenecek** — namaz modülü
  **üçüncü bir uzak sunucu** (`emushaf.net`) ekliyor ve **konum** devreye giriyor;
  ikisi de `Planlamalar/Magaza/`'daki "formu geçersiz kılan değişiklikler"de yazılı.

**Namaz modülü kararları (Oturum 4.1):**
- **Dört SAF modül (testli) + üç YEREL modül (testsiz).** `prayerParse` (ham →
  satır), `prayerSchedule` (sıradaki vakit), `prayerCache` (yenileme kararı),
  `districtMatch` (ad eşleme) — hiçbiri `expo-*` import etmiyor. Karşılarında
  `prayerDb`, `prayerApi`, `location`. `dayLog`/`activityDb` (3.1) ve
  `audioKey`/`audio` (2.5) ayrımının üçüncü uygulaması.
- ⚠️ **"YILLIK SAKLAMA" İMKÂNSIZ ÇIKTI.** Prompt yıllık istiyordu ama
  `/vakitler/{ilceID}` **tarih parametresi almıyor** ve tek çağrıda ~1 aylık
  pencere döndürüyor. Kayan aylık önbelleğe geçildi (kullanıcı kararı); yıllık
  veri bu servisten alınamaz, başka bir kaynak ister.
- ⚠️ **`adhan` yedeği KONMADI**, `package.json` değişmedi (4.0'ın varsayılanı,
  kullanıcı onayladı). Önbellek boş + ağ yok → dürüst boş durum. Türkiye dışı
  `strings.prayer.turkeyOnly`. `NAMAZ_VERI_KAYNAGI.md` §10.2 böylece **kapandı**.
- ⚠️ **"EN YAKIN İLÇE" YAPILAMAZ.** `/ilceler` yalnızca ad + kimlik döndürüyor,
  koordinat yok, mesafe hesabı yok. Yapılan iş ters coğrafi kodlama + Türkçe
  duyarlı ad eşleme; etiketler bu yüzden **"bulunduğun ilçe"** der.
  ⚠️ Eşleşme **otomatik seçilmez**, öneri kartı olarak onaya sunulur;
  belirsizlikte (birden fazla aday) `none` döner ve `MERKEZ` asla tahmin
  edilmez. Yanlış ilçe = yanlış vakit, bu modülün tek kabul edilemez hatası.
- ⚠️ **`normalizeTr` `lib/turkishText.ts`e TAŞINDI.** Namaz tarafının
  `answerEngine`den import etmesi cevap motorunun tamamını (`strings`,
  `fillBlankLayout`, `questionValidation`) namaz paketine sokardı. `answerEngine`
  yeniden dışa aktarıyor; **242 test değişmeden geçti.** Fonksiyon burada
  dekoratif değil işin tamamı: Diyanet listesi BÜYÜK HARF ("ISPARTA"), cihaz
  Başlık Biçimi ("Isparta") — naif küçültme eşleşmeyi sessizce kaçırır.
- **Seçili ilçe SQLite'ta (`prayer_district`), MMKV'de DEĞİL** ve bu, store'un
  `persist` KULLANMAMASININ sebebi. MMKV Expo Go'da kapalı; oraya yazılsaydı
  kullanıcı her soğuk açılışta ilçesini yeniden seçerdi. Kalıcılık duvarını
  delen üçüncü özellik.
- ⚠️ **Yenileme ölçütü KALAN GÜN, kayıt sayısı DEĞİL** (`isStale`, eşik 7).
  4.0'da aynı ilçe 15 dk arayla 34 ve 32 kayıt döndürmüştü.
- ⚠️ **İKİ DÖNGÜ KIRICI** (`decideRefresh`) ve ikisi de zorunlu: mirror'ın
  önbelleği bayatsa yenileme **AYNI eski pencereyi** döndürür, `isStale` `true`
  kalır ve koşul yeniden sağlanır. (1) `attemptedThisSession` — otomatik yol
  oturumda bir kez. (2) `MIN_REFRESH_INTERVAL_MS` 6 saat — uygulamayı üst üste
  açan kullanıcı birinciyi sıfırlıyor. `markSynced` **pencere ilerlesin
  ilerlemesin** yazılıyor; yazılmasaydı ikinci kırıcı hiç tetiklenmezdi.
- ⚠️ **`parseDottedDate` ISO görünümlü girdiyi REDDEDER.** Girdi alanı
  `MiladiTarihKisaIso8601` ama **içeriği ISO değil** (`"15.08.2026"`). Adına
  aldanıp değeri doğrudan `IsoDate` saymak sessiz bir hata; test o kapıyı
  kapatıyor. ⚠️ `HicriTarih*Iso8601` alanları **`null` geliyor** →
  `HicriTarihKisa` saklanıyor. (İkisi de 20.08.2026'da canlı yeniden doğrulandı.)
- ⚠️ **Kısmi satır YAZILMAZ**: altı vakitten biri okunamazsa satır düşer. Yarım
  satır diske girse `findNextPrayer` onu "bugünün verisi var" sayar, eksik vakti
  atlar ve kullanıcı bir vakti hiç görmez — boş durumdan kötü.
  ⚠️ **Geçmiş günler DÜŞÜRÜLMEZ** — pencere bugünden başlamıyor ve "ilerledi mi"
  sorusunu cevaplayan veri o. Süzme okuma tarafında (`WHERE date = ?`).
- ⚠️ **`localEpochFor` günün epoch'una dakika EKLEMEZ** —
  `new Date(y, m-1, d, hh, mm)` ile motorun yerel çözümü kullanılıyor.
  ⚠️ Türkiye 2016'dan beri kalıcı UTC+3, yaz saati YOK; bu satırın koruduğu
  kullanıcı yurt dışından bakan kullanıcı ve testin koştuğu makine. Testler
  **mutlak epoch iddia etmez**, saat diliminden bağımsız değişmezler sınar.
  Elle doğrulandı: `TZ=America/New_York` ve `TZ=Pacific/Kiritimati` → 280/280.
- **`findNextPrayer` adayları = bugünün altı vakti + YARININ İmsak'ı.**
  ⚠️ Karşılaştırma **katı `>`**: `>=` olsaydı geri sayım vaktin dakikası boyunca
  sıfırda takılır ve `useCountdown` sürekli `onElapsed` tetiklerdi. Yarının
  İmsak'ının listede olması gece yarısını **kendiliğinden** aşan şey; ayrı bir
  "gece" dalı yok. Adayların hepsi geçmişse `null` — negatif geri sayım yok.
- ⚠️ **Geri sayım YALNIZCA `CountdownLabel`de tik atıyor.** Kanca karta ya da
  ekrana konsaydı saniyede bir tüm tablo yeniden çizilirdi (3.3'ün `Star`
  kararının devamı). Kalan her tikte `Date.now()`dan **yeniden** hesaplanıyor,
  bir sayaçtan düşülmüyor: `setInterval` arka planda kayar ve düşme yöntemi o
  kaymayı biriktirir. ⚠️ Sayan metin **ekran okuyucuya OKUNMUYOR**; dakika
  hassasiyetli tek etiket kartta (3.3'ün `useCountUp` kararının aynısı).
- **Gece yarısı ve arka plandan dönüş `usePrayerTimes`teki `AppState`
  dinleyicisiyle**: gün döndüyse `recompute` tabloyu yeni güne çeviriyor ve
  yenileme kararı yeniden soruluyor. (3.1'de "AppState dinleyicisi sonraki fazın
  işi" denmişti; burada gerçekten gerekti.)
- ⚠️ **İl/ilçe LİSTELERİ SQLite'a YAZILMIYOR** — kullanıcı verisi değil, üçüncü
  tarafın kataloğu; tabloya koymak onlara Faz 7 sync semantiği vermek olurdu.
  Oturum boyu `Map` önbelleği + uçuştaki istek tekilleştirmesi (`audio.ts`
  deseni). **Kabul edilen sonuç:** ilk açılışta ağ yoksa ilçe seçilemez.
- ⚠️ **Ağ uyarısı yalnızca ekran BOŞKEN gösteriliyor.** Dolu ekranda "sunucuya
  ulaşılamadı" demek boşuna telaş — vakitler önbellekte ve doğru.
- ⚠️ **Atıf ZORUNLU:** `strings.prayer.attribution` =
  *"Diyanet İşleri Başkanlığı'nın yayınladığı vakitler"*. **"Resmi", "onaylı",
  "Diyanet'in uygulaması" hiçbir metinde geçmez** — hukuki + mağaza riski.
- **`colors.ts` DEĞİŞMEDİ.** Sıradaki vakit kartı `primarySoft` dolgu,
  **kenarlıksız** (⚠️ `borderControl` yumuşak dolgu üzerine çizilmez, 2.39 koyu),
  ikincil satır **`textSecondary`** (⚠️ `textMuted` değil). Tabloda "sıradaki"
  durumu **renkle taşınmıyor**, ikonun BİÇİMİYLE (`arrow-forward-circle` ↔
  `ellipse-outline`) — 1.4.1'in altıncı uygulaması. İlçe listesi `OptionCard`.
- ⚠️ **ESLint `use` ön ekli bir `useCallback` değişkenini KANCA sanıyor.**
  `useMyLocation` → `findFromLocation` olarak yeniden adlandırıldı
  (`react-hooks/rules-of-hooks` **hatası** veriyordu, uyarı değil).
- ⚠️ **`app/prayer/district.tsx` kapatma düğmesini ELLE çiziyor** — kök yerleşim
  `headerShown: false` veriyor, navigatörün geri düğmesi yok.
- **316 test geçiyor** (242'den). ⚠️ `prayerDb`, `prayerApi`, `location`, `store`
  ve bileşenler için test **yazılamaz** (yerel modül).
- ⚠️ **`npx expo-doctor` 17/18** — kalan madde bu oturumla ilgisiz: yukarı akışta
  `expo` (54.0.36 → ~54.0.37) ve `expo-constants` yama sürümleri ilerlemiş.
  Düzeltme `npx expo install --check` ister; OneDrive/`EBUSY` riski (2.4'te bir
  kez ısırmıştı) yüzünden oturum sonunda kasten yapılmadı.

**Namaz — Faz 4.1'in kod DIŞI çıktıları:**
- `app.json` izin listesi **temizlendi**: `ACCESS_COARSE_LOCATION` dışında hepsi
  kaldırıldı (`ACCESS_FINE_LOCATION`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`,
  iki `FOREGROUND_SERVICE*`). iOS izin metni yeniden yazıldı — eskisi
  "hesaplamak" diyordu, biz hesaplamıyoruz.
  ⚠️ `ACCESS_FINE_LOCATION`'ın gerçekten düştüğü **doğrulanmadı**;
  `expo-location` eklentisi kendi manifestiyle geri birleştirebilir.
  `npx expo prebuild` çıktısındaki birleşik manifest kontrol edilmeli.
- `Magaza/GIZLILIK_POLITIKASI.md`: envanter **ikiden üçe** çıktı, "3b. Konum
  izni — isteğe bağlı" bölümü eklendi, "toplamadıklarımız" listesinden konum
  **çıkarıldı**. ⚠️ **Bulunan gerçek:** `reverseGeocodeAsync` iOS'ta koordinatı
  **Apple'ın sunucusuna** gönderiyor (CLGeocoder); "konum cihazdan çıkmıyor"
  yazılamaz. Hukukçuya sorulacaklara **üç madde** eklendi (8-10).
- `Magaza/VERI_GUVENLIGI_FORMU.md`: konum satırı "Hayır"dan çıkıp hukuki
  incelemeye bırakıldı; Bölüm 3 (izin sorunu) **çözüldü** olarak işaretlendi.
- `Magaza/MAGAZA_METINLERI.md`: namaz artık yazılabilir ama metinler **henüz
  genişletilmedi** — kendi oturumunda, uzunluk sınırları yeniden ölçülerek.
  Yasak ifadeler o dosyanın başında yazılı.

**Namaz ekranı ve çizelge kararları (Oturum 4.2):**
- **İki SAF modül + bir YEREL modül.** `prayerDay.ts` (satır durumu) ve
  `lib/turkishDate.ts` (Türkçe tarih) testli; `prayerLogDb.ts` testsiz.
  4.1'in dört saf / üç yerel ayrımının sürdürülmesi.
- ⚠️ **`prayerDay` "sıradaki vakit"i YENİDEN HESAPLAMAZ**, `findNextPrayer`in
  kararına uyar (`next.isTomorrow` ya da tarih farklıysa tabloda hiçbir satır
  `'next'` olmaz). Bağımsız hesaplansaydı iki tanım bir gün ayrışır ve kart
  "sıradaki: İkindi" derken tablo Akşam'ı işaretlerdi — hiçbir testin
  yakalayamayacağı, yalnızca ekrana bakınca görülen bir çelişki.
  ⚠️ `phase` eşiği `at <= now`, yani **vaktin TAM dakikasında satır geçmiştir**;
  `findNextPrayer`in katı `>`unun aynadaki yüzü. İkisi birlikte gevşerse aynı
  satır hem "geçti" hem "sıradaki" olur.
- ⚠️ **Yatsı'dan sonra altı satırın altısı da `'past'`** ve hiçbiri `'next'`
  değil. Doğru ve dürüst hâl — gün bitmiştir, `next` yarına aittir.
- ⚠️ **Geçmiş satır `textMuted`e düşüyor, `opacity` ile SOLDURULMUYOR.** Opaklık
  iki şeyi birden bozardı: kontrast artık hesaplanamaz olurdu (jetonun zeminle
  oranı ölçülü, yarı saydam hâli değil) ve aynı satırdaki dokunulabilir kutu da
  sönerdi. Ölçüldü: `textMuted` açık temada beyaza **5.30:1**, koyu temada
  `#1A1218`e **5.96:1** — ikisi de AA.
- ⚠️ **Durum yine RENKLE taşınmıyor**, ikonun BİÇİMİYLE: `arrow-forward-circle`
  (sıradaki) · `ellipse` (geçmiş) · `ellipse-outline` (gelecek).
  WCAG **1.4.1**'in bu projedeki **yedinci** uygulaması.
- ⚠️ **İşaret kutusu SÖNMEZ.** Satır soluk olsa da kutu tam kontrastta: o bir
  kontroldür, geçmiş bir bilgi değil. Sınırı `borderControl` çiziyor (jetonun
  tanımı birebir bu; sayfa zeminine 3.64/3.46). Pasif hâli **grileştirilmiyor**
  — `textDisabled` kendi zemininde 1.97 ve görünmez olurdu (2.1 ölçümü).
- ⚠️ **Satırın TAMAMI artık `accessible` bir kutu DEĞİL** (4.1'de öyleydi):
  içine bir kontrol girdiği an satırı tek parça yapmak ekran okuyucunun kutuya
  odaklanmasını engeller. Bilgi kısmı bir odak durağı, kutu ayrı bir odak durağı.
- **`GÜNEŞ` satırı tabloda KALIR ama işaretlenemez.** Diyanet'in yayınladığı
  tablo altı satır ve atıf o tabloya yapılıyor; Güneş ise namaz vakti değil,
  sabah namazının bittiği andır. Kararı `prayerDay.isTrackable` veriyor, yeri
  düzende korunuyor (yoksa saat sütunu tek satırda kayar).
  ⚠️ `markedCount` yalnızca `trackable` satırları sayıyor: diskte bir artık
  `gunes` kaydı bulunsa bile özet `6 / 5` gibi imkânsız bir sayı göstermemeli.
- **İşaret yalnızca `phase === 'past'` satıra konabilir.** Henüz girmemiş bir
  vakti "kıldım" demek anlamsız.
- **`prayer_log` (`MIGRATIONS[4]`, sürüm 5): anahtar `(date, prayer)`.**
  ⚠️ **İlçeye BAĞLI DEĞİL** — `prayer_time` üçüncü tarafın kataloğu, bu tablo
  kullanıcının kendi kaydı; ilçe değiştirmek (seyahat, taşınma) çizelgeyi
  silmemeli. Anahtar `activity_day.date` ile aynı sync kararı (3.1).
  ⚠️ **Satırın VARLIĞI işaretin kendisidir**, ayrı bir `status` sütunu YOK:
  kaldırmak `deleted_at` yazmaktır, yeniden işaretlemek satırı diriltmektir
  (`ON CONFLICT ... deleted_at = NULL`). Durum sütunu olsaydı "silinmiş ama
  işaretli" gibi anlamsız bir bileşim mümkün olurdu.
- ⚠️ **`toggleMark` günü `state.loadedDate`ten DEĞİL `Date.now()`tan okuyor:**
  uygulama gece boyunca açık kaldıysa `loadedDate` dünü gösterir ve işaret
  yanlış güne yazılırdı. DB yazması yine `set` updater'ının **DIŞINDA**
  (React 19 + `reactCompiler` tuzağı; 2.4/3.1/3.2'den sonra dördüncü kez).
  ⚠️ `recompute` çizelgeyi de yeniden okuyor — gün dönünce dünün işaretleri
  bugünün tablosunda kalırdı, yani kullanıcı kılmadığı namazları işaretli
  görürdü. Bu modülün en kötü hata sınıfı.
  ⚠️ `hydrate` artık ilçe `null` iken de erken çıkmıyor: çizelge ilçeden
  bağımsız ve o okuma atlanırsa işaretler ilk `recompute`a kadar görünmezdi.
- **Hicri tarih: `MIGRATIONS[3]` ile `prayer_time.hicri_uzun` (ALTER TABLE).**
  ⚠️ **Hicri ay adları KODA YAZILMADI.** Servisin `HicriTarihUzun` alanı
  Diyanet'in yayınladığı metni taşıyor ve birebir gösteriliyor; kodda bir hicri
  ay adı tablosu tutmak dini takvim adlandırmasını bizim üstlenmemiz olurdu.
  (Elenen yol: `"2.3.1448"`i ayrıştırıp ay adlarını kendimiz yazmak.)
  ⚠️ `HicriTarihUzunIso8601` de **`null` geliyor** — kısa biçimdeki tuzağın
  aynısı, 20.08.2026'da yeniden doğrulandı.
  ⚠️ **4.2'den ÖNCE indirilmiş satırlarda sütun `NULL`**; ekran `hicriShort`a
  düşüyor ve yer tutucu YAZMIYOR. Önbelleği zorla temizlemek çevrimdışı bir
  kullanıcıyı vakitlerinden etmek olurdu.
- ⚠️ **`toLocaleDateString('tr-TR')` KULLANILMADI.** Hermes'in tam ICU
  içermeyen Android derlemesinde yerel biçimlendirme sessizce köke düşebiliyor
  ("20 August 2026") ve hata yalnızca bazı cihazlarda görünürdü —
  `normalizeTr`in (2.3) elle harf eşlemesiyle aynı gerekçe.
  ⚠️ Gün adı **`Date.UTC` üzerinden**: yerel `new Date(y, m, d)` ile saat
  dilimine göre bir gün kayardı. ⚠️ `streak.parseIsoDate`ten bir adım öteye
  gidilip **takvim doğrulaması** da yapılıyor — `Date.UTC(2026, 1, 29)` sessizce
  1 Mart döner ve ekranda "29 Şubat 2026, Pazar" yazardı.
- **Kart ortalandı ve büyüdü** (saat `h2` → `h1`, geri sayım `h3` → `h2`) ama
  **ölçülmüş renk kararlarının hiçbiri değişmedi**: `primarySoft` dolgu,
  **kenarlık yok** (`borderControl` yumuşak dolgu üzerine çizilmez, 2.39 koyu),
  ikincil satır `textSecondary` (`textMuted` orada 4.16, AA altı).
  ⚠️ Geri sayım tiki **hâlâ yalnızca `CountdownLabel`de**; yukarı taşınsa
  saniyede bir tüm tablo yeniden çizilirdi (4.1 kararı).
- **Özet satırı yalnızca en az bir işaret varken görünüyor.** Sıfırdayken
  "0 / 5" yazmak, hiçbir şey söylemediği hâlde bir eksiklik bildirimi gibi
  okunur. ⚠️ Hiçbir metin **yargı taşımıyor** — "kılmadın", "eksik",
  "kaçırdın" yok; ekran sayar, hüküm vermez.
- **343 test geçiyor** (316'dan). `tests/prayerDay.test.ts` +
  `tests/turkishDate.test.ts` yeni; `tests/prayerParse.test.ts` genişledi.
  ⚠️ `prayerLogDb`, `store` ve bileşenler için test **yazılamaz** (yerel modül).
  Elle doğrulandı: `TZ=America/New_York` ve `TZ=Pacific/Kiritimati` → 343/343.
- `strings.ts`e **iki satır** (`prayer.markedSummary`, `a11y.prayerMarkToggle`).
  **`colors.ts` DEĞİŞMEDİ** — yeni jeton gerekmedi.
- `Magaza/GIZLILIK_POLITIKASI.md` envanterine `prayer_log` satırı eklendi.
  ⚠️ **Veri güvenliği formu DEĞİŞMEDİ ve değişmemeli**: yeni uzak sunucu yok,
  yeni izin yok, cihazdan çıkan yeni veri yok.
- ⚠️ **VAKİT BİLDİRİMLERİ HÂLÂ YAPILMADI.** 4.2'nin adında vardı, kapsam dışı
  bırakıldı (kullanıcı kararı). Veri tarafı hazır; bloke olan tek şey
  tetiklenmeyi doğrulamak (Dev Build Borcu, B maddesi).

**Namaz çizelgesi kararları (Oturum 4.3):**
- **İki SAF modül (testli) + var olanların genişlemesi.** `prayerChart.ts`
  (durum döngüsü + hafta/ay geometrisi) ve `lib/turkishDate.ts` (üç yeni
  biçimlendirici) testli; `prayerLogDb.ts` yerel ve testsiz. 4.1'in dört saf /
  üç yerel ayrımının sürdürülmesi.
- ⚠️ **`MIGRATIONS[5]` 4.2'nin "ayrı bir `status` sütunu YOK" kararını BİLEREK
  GERİ ALIR.** O karar iki durumlu bir dünyada doğruydu: satırın varlığı
  işaretin kendisiydi. Üçüncü durum girince yetmiyor — "kılındı" ile "kaza"
  ikisi de YAŞAYAN satır. Eski değişmez korunuyor: **`'kilinmadi'` diske HİÇ
  yazılmaz** (satırın yokluğu ya da `deleted_at`), yani "silinmiş ama işaretli"
  hâlâ imkânsız. `DEFAULT 'kilindi'` bir kolaylık değil GÖÇÜN KENDİSİ: 4.2'de
  yazılmış her satır "kılındı" demekti ve öyle kalmalı.
- **Döngü: kayıt yok → kılındı → kaza → kayıt yok.** Sıralama bilinçli; en sık
  konacak işaret tek dokunuşta geliyor. Döngü `prayerChart.nextStatus`ta ve
  **tek yerde** — hem günlük tablo hem çizelge onu çağırıyor.
- ⚠️ **"Kılmadım" bir KAYIT DEĞİL.** Teknik değer `'kilinmadi'` ama ekranda
  **"Kayıt yok"** yazar. Değer adı teknik, etiketi değil.
- ⚠️ **PAYDA KALKTI.** `strings.prayer.markedSummary` (`'{kilinan} / {toplam}
  vakit işaretli'`) **silindi**, yerine `summaryDone` + `summaryKaza` geldi.
  "2 / 5" hiçbir suçlayıcı kelime kullanmadan bir eksiklik bildiriyor.
  `prayerDay.trackableCount` de bu yüzden **silindi**; `markedCount` →
  `countStatus(rows, status)`. `summarize` bilerek yalnızca iki alan döndürüyor
  ve testi anahtar sayısını çiviliyor — hesaplanabilir olması bile o satırın bir
  gün ekrana çıkmasına davetiye olurdu.
- ⚠️ **Hafta PAZARTESİ başlıyor, çapası `'1970-01-05'`.** `getUTCDay()`
  kullanılsaydı 0 = Pazar olur, her yerde bir kaydırma taşınırdı.
  `((diff % 7) + 7) % 7` iki kez modulo alıyor: JS'te `-3 % 7` **-3**'tür.
- **Hafta HER ZAMAN 7, ay HER ZAMAN 42 hücre.** İkisi de arayüz sözleşmesi:
  ızgara satır sayısını veriden öğrenmiyor ve ay 4/5/6 satır arasında
  zıplamıyor. Ay dışı hücreler **`null`** — komşu ayın günlerini çizmek elendi
  (dokunulabilir olsalar görünmeyen bir aya yazılırdı, olmasalar aynı görünen
  iki hücreden biri çalışır diğeri çalışmazdı).
- ⚠️ **`addMonths` AYIN İLKİNE oturur.** Gün korunsaydı 31 Ocak + 1 ay `Date`
  tarafından 3 Mart'a atılır ve "sonraki ay" düğmesi **Şubat'ı atlardı**.
- ⚠️ **`prayerChart` takvimi de doğruluyor**, `streak.parseIsoDate` gibi yalnızca
  biçimi değil: `'2026-02-29'` biçim olarak geçerli ama takvimde yok.
  (`lib/turkishDate.ts`in aynı gerekçesi; oradaki taşma denetimi artık üç
  biçimlendiricinin ortak `parse`ında.)
- **Düzenleme GÜN hassasiyetinde**: bugün ve geçmiş düzenlenebilir, gelecek
  değil. Günlük tablodaki `phase === 'past'` katılığı çizelgeye taşınmadı —
  taşınsaydı geçmiş bir günü düzeltmeye gelen kullanıcı bugünün yarısından
  mahrum kalırdı.
- ⚠️ **Aylık takvim hücresinde vakitler DOĞRUDAN düzenlenmiyor** — oturumun
  ikinci bilinçli tasarım sapması. Aritmetik: 360 dp ekranda hücre ~51 dp, içine
  beş hedef koymak her birini ~10 dp yapardı (`minTouchTarget` 48'in beşte
  biri). Hücre GÜN seçiyor, düzenleme altındaki `PrayerDayEditor` panelinde tam
  boy kontrollerle yapılıyor. ⚠️ **Gelecek gün de SEÇİLEBİLİR** ama düzenlenemez:
  basılamaz hücre sessiz bir duvar olurdu, panel sebebini söylüyor.
- ⚠️ **Haftalık ızgarada günler SATIR, vakitler SÜTUN** ve bu da ölçülerek
  seçildi: tarih sütunu (72) çıkınca beş vakte ~57 dp kalıyor. Ters yön (yedi
  gün sütun) ~41 dp verir, 48'in ALTINA düşer ve yatay kaydırma gerektirirdi.
- ⚠️ **Durum RENKLE taşınmıyor, ikonun BİÇİMİYLE**: `ellipse-outline` /
  `checkmark-circle` / `refresh-circle`. WCAG **1.4.1**'in bu projedeki
  **sekizinci** uygulaması. ⚠️ Aylık hücrenin özet şeridi **8 dp** ve o ölçekte
  biçim ayrımı zayıf; bilgiyi taşıyan şey hücrenin erişilebilirlik etiketi
  (sayılar SÖZLE yazılıyor) ve panelin kendisi — şerit bir hatırlatma, kayıt
  değil.
- ⚠️ **`accessibilityRole="checkbox"` DEĞİL, `"button"`.** Onay kutusunun iki
  durumu vardır; ekran okuyucu üçüncü durumu (kaza) hiç söyleyemezdi. Rol
  `button` + etikete durum ADININ yazılması üç durumu da duyuran tek yol.
  (4.2'de kutu iki durumluydu ve `checkbox` doğruydu.)
- **`PrayerStatusControl` günlük tablo, haftalık ızgara ve aylık panelin ORTAK
  kontrolü** (mimari kural 3). Üç yerde ayrı yazılsaydı ölçülmüş renk/ikon
  kararları üç kez verilir, biri kayar ve aynı işaret iki ekranda farklı
  görünürdü. Pasif hâli **grileştirilmiyor** (`textDisabled` 1.97, 2.1 ölçümü).
- **Yazma yolu TEK KAPI: `store.setMark`.** `cycleMark` bugünün kısayolu ve
  `setMark`e düşüyor. ⚠️ DB yazması yine `set` updater'ının **DIŞINDA** (React 19
  + `reactCompiler`; beşinci kez) — burada iki kez çalışmak **idempotent DEĞİL**,
  döngü iki adım ilerler ve kullanıcı "kılındı" derken "kaza" görürdü.
- ⚠️ **Aralık okuması store'da DEĞİL `usePrayerChart`te.** Store uygulama ömrü
  boyunca yaşıyor; gezilen hafta/ay ekranla doğup ölen bir arayüz durumu.
  Yazdıktan sonra aralık **diskten yeniden okunuyor** (iyimser güncelleme yok):
  `setPrayerMark` veritabanı açılamamışsa sessizce çıkıyor ve ekran olmayan bir
  işareti gösterirdi. `useFocusEffect` hem gün dönümünü hem günlük tabloda
  yapılan değişikliği yakalıyor.
- **Çizelge AYRI ekranda** (`app/prayer/chart.tsx`), sekmenin altında değil:
  sekmenin işi "şimdi ne zaman", çizelgeninki geçmişe bakmak. Aynı ekranda
  olsalardı sıradaki vakit kartı her gün biraz daha aşağı kayardı. Ekran `Screen`
  kullanmıyor ve kapatma düğmesini ELLE çiziyor (4.1'in ilçe ekranıyla aynı).
- ⚠️ **Yeni rota eklendiği için `.expo/types` yeniden üretilmeliydi** — `npx expo
  start` bir kez çalıştırılmadan `router.push('/prayer/chart')` `tsc` hatası
  veriyor (2.3'te yazılmış tuzak, bu oturumda gerçekleşti).
- **386 test geçiyor** (343'ten). `tests/prayerChart.test.ts` yeni;
  `tests/prayerDay.test.ts` ve `tests/turkishDate.test.ts` genişledi.
  ⚠️ `prayerLogDb`, `usePrayerChart`, `store` ve bileşenler için test
  **yazılamaz** (yerel modül). Elle doğrulandı: `TZ=America/New_York`,
  `TZ=Pacific/Kiritimati`, `TZ=Pacific/Midway` → 386/386.
- `strings.ts`: `prayer`a çizelge metinleri + durum adları + kısa vakit adları,
  `a11y`ye üç satır. ⚠️ `a11y.prayerMarkToggle` **silindi** (iki durumlu kutunun
  etiketiydi). **`colors.ts` DEĞİŞMEDİ** — yeni jeton gerekmedi.
- ⚠️ **Yasaklı dil taraması yapıldı**: "kaçırdın / başarısız / seri bozuldu /
  eksik / kılmadın / ihmal / borç" hiçbir kullanıcı metninde geçmiyor (yalnızca
  bu kararları anlatan yorumlarda).

**Bildirim kararları (Oturum 4.4):**
- **Bir SAF modül (testli) + üç YEREL modül (testsiz).** `prayerNotify.ts`
  (plan üretimi, gecikme daraltması, imza) saf; karşısında
  `prayerNotificationDb.ts`, `notifications.ts`, `notificationSync.ts`.
  4.1'in dört saf / üç yerel ayrımının sürdürülmesi; `notifications.ts` içinde
  **tek bir karar dalı yok**, yalnızca gelen listeyi işletim sistemine yazıyor.
- ⚠️ **`MAX_SCHEDULED = 60` KOZMETİK DEĞİL, iOS'un sert sınırı.** iOS uygulama
  başına en fazla **64** bekleyen yerel bildirim tutar ve fazlasını **sessizce
  atar** — hata yok, günlük yok, sadece hiç gelmeyen bildirimler. Beş vakit ×
  12 gün = 60, kalan dört kayıt ileriki tüketicilere pay. Sınırın sonucu
  mimari: zamanlama "bir kez kur ve unut" OLAMAZ, **her ön plana gelişte
  yeniden kurulan kayan bir pencere** olmak zorunda.
- ⚠️ **Tetikleyici `DATE`, tekrarlayan DEĞİL.** `CALENDAR`/`DAILY` "her gün
  12:58" demek olurdu; vakit her gün kayıyor ve bir hafta sonra bildirim yanlış
  saatte çıkardı. Bu, "veri kaynağı bir aylık pencere döndürüyor" bulgusunun
  (4.0) neden hayati olduğunun yeri: ileri veri olmadan zamanlanacak bir şey yok.
- ⚠️ **`cancelAllScheduledNotificationsAsync()` KULLANILMIYOR.** İptal
  `content.data.kind === 'prayer-time'` süzgecinden geçiyor. Bugün tek tüketici
  namaz modülü ama Faz 3'ün seri hatırlatıcısı geldiği gün toptan iptal onun
  kayıtlarını da sessizce silerdi.
- ⚠️ **Gecikme epoch'a dakika EKLENEREK uygulanıyor ve bu DOĞRU.**
  `localEpochFor`in yasakladığı şey `günEpoch + dakika` ile **duvar saati**
  kurmaktı; burada duvar saati zaten çözülmüş ve kalan iş "o andan X dakika
  sonra" — o da gerçek süredir, yaz saati geçişinden etkilenmez. Test iki mutlak
  değeri değil **farklarını** ölçüyor (saat diliminden bağımsız kalsın diye).
- **Süzgeç katı `>`** — `findNextPrayer`in aynı disiplini: tam o dakikada
  kurulacak bir kayıt ya anında düşer ya da işletim sistemince geçmiş sayılır.
- ⚠️ **Kesme EN GEÇ olanlardan** (önce `at`e göre sırala, sonra `slice`).
  Yakındakiler feda edilseydi kullanıcı bugünü kaçırıp gelecek haftayı alırdı.
- ⚠️ **GÜNEŞ hiç plana girmez** — `TRACKABLE_PRAYERS` üzerinden dönülüyor.
  Güneş namaz değil, sabah namazının bittiği andır (4.2 kararı).
- **Tercihler SQLite'ta (`prayer_notification`, `MIGRATIONS[6]`, sürüm 7)**,
  MMKV'de değil — `prayer_district`in aynı gerekçesi: MMKV Expo Go'da kapalı,
  oraya yazılsaydı kullanıcı kapattığı bildirimi her soğuk açılışta yeniden
  açık bulurdu. Kalıcılık duvarını delen **DÖRDÜNCÜ** namaz verisi.
- ⚠️ **Satırın YOKLUĞU "kapalı" DEĞİL, "dokunulmadı" demek.** Kullanıcı kararı
  "beş vakit açık gelsin"di ve varsayılan **kodda** (`resolvePref`), tabloda
  değil: ilk açılışta beş satır yazmak varsayılanı diske çivilerdi ve varsayılan
  bir gün değişirse eski kurulumlar eskisiyle kalırdı. Tablo, kullanıcı bir şeyi
  değiştirene kadar **boş** duruyor.
- ⚠️ **`enabled = 0` YAŞAYAN bir satır**, `deleted_at` değil — 4.2'nin
  `prayer_log` kararının bilinçli tersi. Orada satırın varlığı işaretin
  kendisiydi; burada satır bir KARARI taşıyor ve "istemiyorum" da bir karardır.
  Silinmiş sayılsaydı `resolvePref` onu varsayılana (açık) çevirir ve kullanıcı
  kapattığı bildirimi geri açık bulurdu.
- ⚠️ **İZİN DURUMU HİÇBİR YERDE SAKLANMIYOR.** Tek doğruluk kaynağı işletim
  sistemi (`getPermissionsAsync`); kullanıcı izni sistem ayarlarından
  kapatabildiği için bir kopya tutmak iki doğru üretirdi. Eşitleme her koşuda
  izni yeniden soruyor ve verilmemişse **kayıtları temizliyor** (yoksa eski
  kayıtlar orada yetim kalırdı).
- **Aynı plan iki kez kurulmuyor:** `planSignature` modül düzeyinde saklanıyor
  (`notificationSync.lastSignature`), değişmemişse hiçbir yerel çağrı yok.
  ⚠️ İmza **süreç ömürlü ve öyle kalmalı** — soğuk açılışta plan her zaman
  yeniden kurulur, çünkü aradan tetiklenmiş bildirimler olabilir ve işletim
  sistemindeki liste bizim hatırladığımızdan kısadır. Ayar ekranı ayrıca
  `invalidateNotificationPlan()` ile imzayı düşürebiliyor.
- **Üç eşitleme noktası:** `app/_layout.tsx` (açılış + `AppState` ön plan),
  `usePrayerTimes` (ilçe/gün/pencere değişimi), ayar ekranı (tercih değişimi).
  ⚠️ **Kök yerleşimdeki çağrı ZORUNLU**: kullanıcı namaz sekmesine hiç girmezse
  `usePrayerTimes` monte olmaz ve pencere kayarken hatırlatmalar tükenirdi.
  Zamanlanmış bildirimin bütün anlamı uygulamanın açılmadığı günlerde çalışması.
- ⚠️ **`store.ts`e HİÇ DOKUNULMADI.** Zamanlama bir yaşam döngüsü işi; store'a
  konsaydı `set` updater'ının iki kez çalışması tuzağı (React 19 +
  `reactCompiler`; projede beş kez ısırdı) bir kez daha sınanmış olurdu.

- **Arayüz: ayarlar PROFİLDE, ekran `app/prayer/` altında** (kullanıcı kararı).
  Bildirim namaz modülünün parçası; profil yalnızca kapıyı açıyor. Ekran
  `Screen` kullanmıyor ve kapatma düğmesini ELLE çiziyor (4.1'in ilçe ve
  4.3'ün çizelge ekranlarıyla aynı desen).
- ⚠️ **İzin ekran AÇILIRKEN isteniyor, bir anahtar açılınca değil.** Varsayılan
  "beş vakit açık" olduğu için izin ilk dokunuşa bırakılsaydı ekran beş anahtarı
  açık gösterir ama hiçbir şey kurulmazdı — kullanıcının göremeyeceği bir yalan.
  `useFocusEffect` ile odak dönüşünde izin yeniden soruluyor: kullanıcı
  "Ayarları aç"a basıp sistem ayarlarından dönebilir.
- ⚠️ **Anahtar için `Switch` kullanıldı ve durum RENKLE taşınıyor — istisna
  değil, kapsam dışı.** `PrayerStatusControl`/`OffsetPicker` ikon biçimine
  başvuruyor çünkü onları biz çiziyoruz; `Switch` platformun kendi kontrolü ve
  açık/kapalı bilgisini işletim sistemi rolü ile başparmağın konumu veriyor.
  Bu yüzden a11y etiketine "açık"/"kapalı" **yazılmadı** (anons ikiye katlanırdı;
  Button'ın `accessibilityState` kararının aynısı).
- **`OffsetPicker` yeni bir bileşen ama ölçülmüş kararları DEVRALDI**: seçili
  durum `primarySoft` dolgu + **ikon biçimi** (`ellipse-outline` →
  `checkmark-circle`) — WCAG **1.4.1**'in bu projedeki **dokuzuncu** uygulaması,
  çünkü `primary`/`borderControl` yalnızca 1.40:1 (2.2a).
  ⚠️ Seçili kutuya `borderControl` **çizilmiyor** (renkli yumuşak dolgu üzerinde
  2.39 koyu, 2.3 kuralı); seçilmemişte aynı jeton sayfa zeminine 3.64/3.46.
  Kenarlık iki durumda da **2px** (1→2 değişimi satırı titretirdi).
  ⚠️ Rol `radio` DEĞİL `button` + `selected`: radyo rolü bir `radiogroup` kabı
  ve konum anonsu bekler, sarmalı bir satırda konum bilgisi yanıltıcı olurdu.
- **`PRAYER_LABELS` `components/NextPrayerCard.tsx` → `prayerLabels.ts` taşındı.**
  Bildirim başlığı onu istiyor ve yerel bir modülün React bileşeni import etmesi
  bütün bileşen ağacını yerel katmana sokardı (4.1'de `normalizeTr`in
  `lib/turkishText.ts`e taşınmasının aynısı). Dört çağrı yeri güncellendi.
- ⚠️ **Bildirim metni YARGI TAŞIMIYOR ve dini içerik DEĞİL.** Başlık
  `'{vakit} vakti'`, gövde "Vakit girdi. Hazır olduğunda çizelgene
  işaretleyebilirsin." — ayet, hadis, dua, fıkhi ifade yok. 4.3'ün yasaklı dil
  kuralı burada daha bağlayıcı: bildirim kullanıcının izin vermediği bir anda,
  elinde olmayan bir yerde belirir; orada "unutma" demek uyarı değil baskıdır.
  Yasaklı dil taraması yeniden yapıldı — geçen tek yer bu kararları anlatan
  yorumlar.
- **404 test geçiyor** (386'dan). `tests/prayerNotify.test.ts` yeni.
  ⚠️ `prayerNotificationDb`, `notifications`, `notificationSync`,
  `usePrayerNotifications` ve bileşenler için test **yazılamaz** (yerel modül).
  Elle doğrulandı: `TZ=America/New_York`, `TZ=Pacific/Kiritimati`,
  `TZ=Pacific/Midway` → 404/404.
- `strings.ts`: `prayer`a bildirim metinleri, `profile`a üç satır, `a11y`ye iki
  satır. **`colors.ts` DEĞİŞMEDİ** — yeni jeton gerekmedi.
- ⚠️ **`app.json` DEĞİŞMEDİ.** `expo-notifications` eklentisi zaten yazılıydı;
  Android 13 `POST_NOTIFICATIONS` iznini eklentinin kendi manifesti katıyor.
  Yeni yerel modül yok, yani 4.4 **OTA ile gidebilir** — 4.1'in izin
  temizliğinin aksine yeni derleme istemiyor.
- **Kapsam dışı bırakılanlar (bilinçli):** işaretli vakti atlamak ("kıldım
  dediysen hatırlatma" — işaret bildirim kurulduktan SONRA konuyor, doğru çözüm
  her işaretlemede yeniden zamanlamak ve bu pil maliyetini bir kullanıcı
  hareketine bağlamak demek); bildirime dokununca namaz sekmesine gitmek; ezan
  sesi (2.5'in "ses dosyaları pakete GİRMEZ" kararına çarpar); seri/ders
  hatırlatıcısı (Faz 3'ün konusu — altyapı onu da taşıyacak biçimde yazıldı ama
  tüketicisi yok).

**Kıble kararları (Oturum 4.5):**
- **Bir SAF modül (testli) + var olan bir yerel modülün genişlemesi.**
  `qibla.ts` (azimut, dikiş açma, kalibrasyon kovaları, yayın eşiği) saf;
  karşısında `location.ts` (koordinat + yön), `useQibla.ts` (bağlantı).
  4.1'in dört saf / üç yerel ayrımının sürdürülmesi.
- ⚠️ **`expo-sensors` KURULMADI ve prompt onu istiyordu.** Sapma bunu ölçülebilir
  bir hataya çeviriyordu: ham manyetometre **manyetik** kuzeyi verir, kıble
  azimutu **gerçek** kuzeye göre hesaplanır ve Türkiye'de ikisi ~5–6° ayrışır.
  Düzeltmek bir dünya manyetik modeli (WMM) tablosu ister — bu projeye girmez.
  `expo-location.watchHeadingAsync` üç şeyi birden çözüyor: `trueHeading`
  (sapma işletim sistemince düzeltilmiş), `accuracy` (kalibrasyon uyarısının
  GERÇEK kaynağı, tahmin değil) ve cihaz yönelimi.
  **Sonuç: `package.json` DEĞİŞMEDİ**, yeni bağımlılık yok.
  ⚠️ `trueHeading` **negatif gelebilir** (iOS henüz gerçek kuzeyi çözemediğinde
  `-1`); o değeri olduğu gibi kullanmak kadranı yanlış yere kilitler,
  `magHeading`e düşülüyor ve kalibrasyon uyarısı zaten çıkıyor.
- ⚠️ **KOORDİNAT DİSKE YAZILMIYOR** (kullanıcı kararı). Yeni göç yok, `MIGRATIONS`
  **yedi maddede kaldı**. Doğrudan sonucu: `Planlamalar/Magaza/` altındaki
  gizlilik politikası ve veri güvenliği formu **DEĞİŞMEDİ** — cihazda kalıcı
  yeni veri yok, yeni uzak sunucu yok, yeni izin yok (`ACCESS_COARSE_LOCATION`
  4.1'de zaten bildirilmişti). Kalıcılaştırılsaydı ikisi de yeniden yazılırdı.
  Kabul edilen bedel: ekran her açılışta konum ister.
- ⚠️ **`lookupCoordinates` ters coğrafi kodlama ÇAĞIRMIYOR** ve bu bir gizlilik
  kazancı: `lookupCurrentPlace` iOS'ta koordinatı Apple'ın sunucusuna gönderiyor
  (CLGeocoder), kıble yolu **hiçbir sunucuya bir şey göndermiyor.**
  `location.ts`in başlık yorumu bu yüzden yeniden yazıldı — eski hâli "cihazdan
  yalnızca AD DİZGELERİ çıkar" diyordu ve 4.5 o sözü bozdu.
  ⚠️ Doğruluk `Balanced`, `Low` DEĞİL: `Low` (~1–3 km) ilçe ADI çözmeye yeter,
  kıble AÇISI için sınırda kalır.
- ⚠️ **`unwrapRotation` — 360/0 dikişi bu oturumun en kritik satırı.** Ham açı
  paylaşılan değere doğrudan yazılsaydı kadran 359°→1° geçişinde **tam tur
  geri** sıçrardı: görünen hata devasa, sebebi tek satır ve yalnızca cihazı elde
  çevirince fark ediliyor. Çözüm ham açıyı değil BİRİKEN açıyı taşımak
  (`önceki + enKısaFark`). ⚠️ Sonuç `[0, 360)` içinde **değildir ve olmamalıdır**;
  kullanıcı dönmeye devam ettikçe değer büyür — sürekliliğin ta kendisi.
  ⚠️ `signedDelta`da **iki kez modulo**: JS'te `-10 % 360` **-10**'dur
  (`prayerChart.startOfWeek`in aynı tuzağı).
- ⚠️ **İKİ KANAL kararı.** Yön verisi saniyede onlarca kez geliyor; hepsini React
  durumuna yazmak ekrandaki her metni, kalibrasyon kartını ve kıble saati
  panelini o hızda yeniden çizerdi. Kadranın açısı **`useSharedValue`**e
  doğrudan yazılıyor (sıfır yeniden çizim, yalnızca `QiblaDial` okuyor);
  `delta`/`aligned`/`quality` **`setState`** ve yalnızca `shouldEmit` 1°'lik
  eşiği geçince. 4.1'in **"geri sayım yalnızca `CountdownLabel`de tik atar"**
  kararının bu modüldeki karşılığı.
  ⚠️ `useQibla`daki üç `ref` (`bearingRef`/`emittedRef`/`alignedRef`) durum
  DEĞİL çünkü değişmeleri yeniden çizim gerektirmiyor; durum olsalardı
  `handleHeading` her ölçümde yeniden kurulur, **abonelik de onunla koparddı**.
- ⚠️ **SVG ÖZELLİĞİ ANİMASYONLANMIYOR** ve tasarım bunu YAPISAL olarak imkânsız
  kılıyor: `bearing` koordinat gelince bir kez sabitleniyor → içerideki `<Svg>`
  tamamen durağan → dönen tek şey onu saran sıradan bir `Animated.View`.
  `PathTrail.tsx`in kuralı (RN 0.81 + Reanimated 4 + worklets 0.5'te
  `createAnimatedComponent(Path)` pürüzlü) böylece hiç sınanmıyor.
  ⚠️ `<Svg>`ye **sayısal** ölçü veriliyor, yüzde değil; ölçü
  `useWindowDimensions()`tan, `onLayout` YOK (2.1'in `pathLayout` disiplini).
  ⚠️ Yumuşatma **bileşende** (`useDerivedValue` + `withTiming`), kancada değil:
  `rotation` ham ölçümü taşıyor ve saf kalmalı.
- **`react-native-svg`in projedeki İKİNCİ tüketicisi** (birincisi `PathTrail`).
  İlk kez `Circle`, `Line` ve `Text` kullanıldı; `createAnimatedComponent`
  yine hiç kullanılmadı.
- ⚠️ **Hizalanma RENKLE taşınmıyor** — WCAG **1.4.1**'in bu projedeki **onuncu**
  uygulaması. Taşıyan üç şey: işaretçi ikonunun BİÇİMİ (`caret-down` →
  `checkmark-circle`), kadranın altındaki metin satırı, ve tek seferlik ekran
  okuyucu anonsu. Kâbe iğnesi bilgi taşıdığı için **`primary`** (1.4.11'in 3:1'i);
  ⚠️ `primaryBright` **kullanılmadı** — jetonun tanımı zaten "yalnızca grafik ve
  ikon, bilgi taşımaz". Halka ve çentikler dekoratif `borderStrong`, ve 2.1'in
  "algıda ALAN önemli" bulgusu gereği ince çizgi değil kalın kısa bantlar.
  **`colors.ts` DEĞİŞMEDİ.**
- ⚠️ **Ekran okuyucuya sürekli açı OKUNMUYOR.** `delta` bir `accessibilityLabel`e
  bağlansaydı ekran okuyucu saniyede birkaç kez farklı bir sayı anons eder ve
  ekran kullanılamaz hâle gelirdi. Kadranın etiketi **sabit** kıble azimutunu
  taşıyor; hizalanma yalnızca DEĞİŞTİĞİNDE ve bir kez anons ediliyor
  (3.3'ün `useCountUp` ve 4.1'in `prayerRemaining` kararlarının üçüncü uygulaması).
- ⚠️ **Hareket azaltma pusulayı DURDURMUYOR**, yalnızca ara kareleri kesiyor.
  Yön bu ekranın tek bilgisi; `Button`ın "hiç oynatma"sı uygulansaydı ekran
  hiçbir işe yaramazdı. `ProgressBar`ın "değeri doğrudan ata" kalıbı.
- **`constants/motion.ts`e bir jeton eklendi: `timing.compass`** (120 ms,
  `Easing.out(Easing.quad)`). ⚠️ Dosyadaki diğer dört jetondan ayrıldığı yer:
  bu bir ANLATI değil **GECİKME BÜTÇESİ**. `progress` (320 ms) denendi ve elendi
  — telefon döndükten üçte bir saniye sonra oturan kadran yön göstermiyor,
  gecikme gösteriyor. Yay yine yok: hedefi aşıp geri gelmek **yanlış yön**
  göstermek olurdu.
- **`prayer_time.kible_saati`nin İLK tüketicisi** (4.1'den beri boştaydı; 4.0
  *"Kıble için ek kaynak gerekmiyor"* demişti ve haklı çıktı). Yeni istek, yeni
  sütun, yeni ayrıştırma yok. ⚠️ Değer yoksa **yer tutucu YAZILMIYOR**, panel hiç
  çizilmiyor (namaz sekmesindeki Hicri tarih kararının aynısı).
- ⚠️ **DİNİ İÇERİK SINIRI.** Ekranda hiçbir fıkhi hüküm, tarif ya da geçerlilik
  ifadesi yok. Kıble saati paneli **yalnızca astronomik olguyu** söylüyor
  ("bu saatte güneş Kâbe yönünde bulunur") ve bununla ne yapılacağını
  anlatmıyor. `ALIGN_TOLERANCE` (5°) bir doğruluk iddiası değil **arayüz
  eşiği** — telefon pusulası bu büyüklükte hata yapabiliyor ve daha darı
  göstergeyi elde titretirdi. `KAABA` koordinatı dini içerik değil coğrafi
  sabit, bu yüzden kodda durabiliyor. Yasaklı dil taraması yeniden yapıldı.
- ⚠️ **`turkeyOnly` kısıtı YOK** — namaz vakitlerinin aksine kıble açısı dünyanın
  her yerinde hesaplanabilir; bu ekran ülke sormuyor.
- ⚠️ **Bozuk girdi sessizce `null`**: `NaN`/`Infinity`, aralık dışı enlem/boylam,
  ve **Kâbe'nin kendisi ile tam karşı ayak noktası** (yön tanımsız —
  `atan2(0,0)` sessizce "kuzey" derdi, uydurma bir cevap). `ProgressBar`ın
  "bozuk girdi sessizce boş çubuk" disiplini; ekran boş durumu dürüstçe gösteriyor.
- **429 test geçiyor** (404'ten). `tests/qibla.test.ts` yeni.
  ⚠️ Testler **kesin ondalık çakmıyor, BANT sınıyor**: bant düz trigonometriye
  kayma gibi gerçek hataları yakalar, ondalık gürültüsünde kırılmaz.
  ⚠️ `location.ts`, `useQibla`, `QiblaDial` ve ekran için test **yazılamaz**
  (yerel modül). Saat dilimi turu **gerekmedi** — modül zaman içermiyor.
- `strings.ts`: `prayer`a kıble metinleri, `a11y`ye iki satır. `npm run lint`
  0 hata / 11 uyarı — hepsi var olan `strings` varsayılan import sınıfı.

⚠️ **4.5 DEV BUILD BEKLEMİYOR — elle doğrulanacaklar (Expo Go'da hepsi mümkün):**
`npx expo start` (⚠️ yeni rota `.expo/types` üretimi ister) → Namaz → Kıble.
(1) izin istemi; (2) reddedip ayarlardan verince ekran düzeliyor mu;
(3) telefonu tam tur çevir — **359→0 geçişinde tam tur sıçrama var mı**
(dikiş hatasının tek görünür kanıtı); (4) iğne işaretçiye gelince ikon biçimi
değişiyor ve anons **bir kez** yapılıyor mu; (5) metal yüzey yanında kalibrasyon
uyarısı; (6) ekrandan çıkınca ısınma/pil yok (abonelik iptali);
(7) İstanbul'da yön güneydoğu (~151°) mu; (8) Hareketi Azalt açıkken kadran
**çalışmaya devam ediyor** mu (durmamalı).

İlk yayın (v0.1) **sadece öğrenme modülüdür** — namaz ve Kur'an Faz 4-5'te.

Detaylı plan: `Planlamalar/PROJE_PLANI_FINAL.md`
Faz promptları: `Planlamalar/CLAUDE_CODE_PLAYBOOK.md`
