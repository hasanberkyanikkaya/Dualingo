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
- **Sensör:** expo-sensors (kıble — Faz 4'te kurulacak)
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
Faz 2.2 soru bileşenleri (altı tipin altısı) — TAMAM.**
Sırada **Faz 2.3 — ders akışı ekranı** (`app/lesson/[id].tsx`). O klasör hâlâ boş.
⚠️ 2.3'e bırakılan sözleşmeler aşağıda ayrı başlıkta; oradan başla.

⚠️ **Faz 1.2c (Card) ATLANDI, silinmedi.** Ne 2.1 ne 2.2a Card'a ihtiyaç duydu
(ünite başlığı kart değil; şık kartı seçilebilir bir KONTROL, pasif yüzey değil).
Card kendi oturumunda yazılabilir ve artık kolay: kenarlık kararı 2.2a'da ölçüldü
(`borderControl` 2px + `componentRadius.card`), gölge seçeneği elendi.
**1.3 (dev build) ve 1.4 (Sentry) de yapılmadı** — ikisi de öğrenme motorunu
bloklamıyor ama yayından önce şart.

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
- Kabuk **güvenli alan payı okumaz**; ders ekranı `SafeAreaView edges={['bottom']}`
  ile sarmalı, yoksa "Kontrol et" ana ekran çizgisine oturur.
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
  inecek — üçü de bugün tüketicisiz `disabled?` taşıyor (`OptionCard`'ın emsali).
- ⚠️ Klavye açıkken alt bölüm fazla yükselirse çözüm: `KeyboardAvoidingView`'ı
  ders ekranına, `SafeAreaView`'ın **dışına** taşı ve `keyboardAware` prop'unu sil.

⚠️ **Mimari mayın — Faz 2.2e (ImageMatch) buna çarpacak:** `ImageRef.key` düz
dizge ve anahtar→varlık eşlemesi hiçbir yerde yok. Metro değişken yollu `require`
yapamıyor (`contentLoader`'ı statik kayda zorlayan duvarın aynısı). `expo-image`
zaten bağımlılıkta. Görsel çizimi 2.2a'da bilerek atlandı; ImageMatch oturumu
İLK İŞ olarak bu eşlemeyi çözmeli, yoksa tıkanarak açılır.

İlk yayın (v0.1) **sadece öğrenme modülüdür** — namaz ve Kur'an Faz 4-5'te.

Detaylı plan: `Planlamalar/PROJE_PLANI_FINAL.md`
Faz promptları: `Planlamalar/CLAUDE_CODE_PLAYBOOK.md`
