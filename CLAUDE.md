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
    /components         soru tipi bileşenleri
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

**Faz 0 — TAMAM** (Oturum 0.1–0.5). **Faz 1.1 — TAMAM. Faz 1.2 Button — TAMAM.**
Sırada **Faz 1.2b — ProgressBar**, sonra **Faz 1.2c — Card** (ayrı oturumlar).

**Ad ve kimlik kararı:**
- Görünen ad: **Dualingo** — *geçici*. `app.json` `name`/`slug`/`scheme` ve
  `strings.app.name` bu adı taşır; değiştirmek serbest.
- Bundle identifier: **`com.hasanberk.ogrenme`** (iOS + Android aynı).
  **Yayından sonra değişmez.** Bilinçli olarak uygulama adını taşımaz — ad
  değişince kimlik tutarsız kalmasın ve mağaza adresinde marka izi olmasın diye.
- ⚠️ "Dualingo" adı Duolingo'ya çok yakın; mağaza incelemesinde veya marka
  itirazında sorun çıkabilir. Yayın öncesi (Faz 2.5) yeniden değerlendirilmeli.
  Bundle identifier bu riskten etkilenmez.

**Tasarım sistemi kararları (Oturum 0.3):**
- Renk paleti: **"Zümrüt & Bal"** — zümrüt `#17A67A`, bal sarısı `#F5B342`,
  sıcak (kahveye çalan) nötr gri skalası. Açık + koyu tema tanımlı.
- Ham renkler (`palette`) bileşende doğrudan kullanılmaz; bileşenler
  anlamsal jetonları okur (`lightTheme` / `darkTheme`, tip: `ColorTheme`).
- Metin taşıyan dolgular WCAG AA (4.5:1) sağlar. Bu yüzden buton dolgusu
  `#0C8059`; parlak `#17A67A` sadece grafik/ilerleme çubuğu/ikon içindir
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
- ⚠️ **`Tabs` artık `expo-router/js-tabs`'ten gelir.** Kökteki
  `import { Tabs } from 'expo-router'` SDK 57'de kullanımdan kaldırıldı.
- ⚠️ **`tabBarStyle.height`'a `insets.bottom` elle eklenir.** Özel yükseklik
  verildiğinde navigatör güvenli alanı eklemiyor ama alt dolguyu uygulamaya
  devam ediyor; toplanmazsa çentikli cihazlarda ikon ve etiket kırpılır.
- **`SafeAreaProvider` kök yerleşime eklenmez** — expo-router (`ExpoRoot`)
  uygulamayı zaten sarıyor, ikincisi insets ölçümünü bozar.
- İlk ortak bileşenler yazıldı: `Screen` (güvenli alan + zemin + kenar boşluğu),
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
  `metro.config.js` de gereksiz. Reanimated + worklets Expo Go SDK 57'nin içinde.
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
- ⚠️ `StyleSheet.absoluteFillObject` RN 0.86 tiplerinden kalktı; yerine
  `absoluteFill` (düz nesne, yayılabilir) kullanılıyor.

İlk yayın (v0.1) **sadece öğrenme modülüdür** — namaz ve Kur'an Faz 4-5'te.

Detaylı plan: `Planlamalar/PROJE_PLANI_FINAL.md`
Faz promptları: `Planlamalar/CLAUDE_CODE_PLAYBOOK.md`
