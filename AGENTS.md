# AGENTS.md

Bu dosya, Codex'un bu projede uyması gereken **aktif** kuralları ve güncel durumu
tanımlar. Ayrıntılı karar geçmişi `Planlamalar/KARAR_GECMISI.md` dosyasındadır.
Tarihsel belge bir karar arşividir; bu dosyadaki aktif kurallarla çelişirse bu
dosya geçerlidir.

## Proje

Türkçe İslami öğrenme ve ibadet takip mobil uygulaması. Duolingo tarzı öğrenme
yolu, namaz takibi, Kur'an okuma takibi ve mini oyunlar içerir. İlk pazar
Türkiye'dir; yaş sınırı yoktur ve kullanıcı seviye tespitiyle uygun noktadan
başlar.

Görünen geçici ad **Dualingo**. Bundle identifier iOS ve Android için
`com.hasanberk.ogrenme`. “Dualingo” adı Duolingo'ya yakınlığı nedeniyle yayın
öncesinde yeniden değerlendirilecek; bundle identifier yayınlandıktan sonra
değiştirilmeyecek.

## Teknoloji yığını

- React Native + Expo managed workflow, TypeScript
- Expo Router, Zustand
- Tarihsel/kalıcı veri: `expo-sqlite`
- Küçük ve hızlı veri: MMKV v4
- Reanimated + Lottie, `react-native-svg`
- Ses: `expo-audio`; `expo-av` kullanma
- Konum ve pusula: `expo-location`
- Bildirim: `expo-notifications`
- OTA: `expo-updates`
- Hata izleme: Sentry planlı fakat henüz kurulu değil

Proje bilinçli olarak Expo SDK 54'te sabit. Geliştirme telefonu yalnız SDK 54
Expo Go çalıştırıyor. SDK yükseltme, dev build alındıktan sonra ayrı ve planlı
bir oturumdur.

⚠️ `expo-sensors` **kurulmadı ve kurulmamalı**. Kıble yönü
`expo-location.watchHeadingAsync` ile alınır; gerekçe karar arşivindeki “Kıble
kararları” bölümündedir.

⚠️ `babel.config.js` ve `metro.config.js` oluşturma. Mevcut Expo/Reanimated
kurulumu bunlara ihtiyaç duymuyor. `StyleSheet.absoluteFillObject` kullan;
`absoluteFill` kullanma.

## Klasör sorumlulukları

```text
/app                    Expo Router ekranları; ince düzen ve veri bağlama
/components             Ortak UI bileşenleri
/features               İş mantığı ve özellik bileşenleri
  /learning             Ders motoru ve soru tipleri
  /prayer               Namaz vakti, çizelge, bildirim ve kıble
  /quran                Kur'an okuma ve hedef takibi
  /games                Mini oyunlar
  /progress             XP, rozet, seri ve ilerleme
/content                Pakete gömülü JSON içerik
/lib                    Yardımcılar ve SQLite göçleri
/constants              Renk, tipografi, hareket, metin ve sabitler
/types                  Paylaşılan TypeScript tipleri
/Planlamalar            Plan, karar, yayın ve devir belgeleri
```

## Mimari kurallar

1. Dini ve eğitsel içerik koda gömülmez; `/content` altında JSON olur. Yeni ders
   eklemek kod değişikliği gerektirmemeli.
2. `/app` ekranları ince kalır; iş mantığı `/features` altında yaşar.
3. Yeni UI yazmadan önce `/components` içinde benzeri aranır; varsa kullanılır
   veya genişletilir.
4. Renk, boşluk, font, köşe ve hareket değerleri doğrudan yazılmaz;
   `/constants` jetonları kullanılır. Bileşenler ham `palette` değil anlamsal tema
   jetonlarını okur.
5. Arayüz metinleri `/constants/strings.ts` içinden gelir. i18n kurulmaz.
6. Yeni SQLite tabloları `updatedAt`/`updated_at` ve nullable
   `deletedAt`/`deleted_at` taşır. Sert silme yapılmaz.
7. İçerik JSON'u pakete gömülür ve OTA ile güncellenir. Ses dosyaları pakete
   gömülmez; uzaktan indirilip önbelleğe alınır.
8. TypeScript'te `any` kullanma; açık tipler ve ayrıştırılmış birleşimler kullan.
9. Fonksiyonel bileşen ve hook kullan; class component yazma.
10. Bileşen dosyaları `PascalCase.tsx`, diğer dosyalar `camelCase.ts` olur. Her
    bileşen kendi dosyasında ve default export edilir.
11. Kod adları İngilizce, kod yorumları Türkçe olur. 50 satırı geçen fonksiyon
    bölünmek üzere gözden geçirilir.
12. Erişilebilirlikte durum yalnız renkle aktarılmaz. Dokunma hedefleri ve
    kontrast mevcut tasarım sistemi kararlarına uyar.

## Dini içerik politikası — istisnasız

**Codex bu projede dini içerik üretmez veya yorumlamaz.**

- Ayet, hadis veya dua metnini hafızadan yazma.
- Fıkhi hüküm ya da dini açıklama üretme.
- Ders sorusu, cevap veya açıklama uydurma.
- Dini metin gereken yere `TODO: ... — uzman tarafından yazılacak` bırak.
- Yapısal örnek veri gerekiyorsa açıkça `ÖRNEK VERİ — GERÇEK DEĞİL` işaretle;
  metinlerde `ÖRNEK SORU`, `ÖRNEK CEVAP`, `ÖRNEK AÇIKLAMA` kullan.
- Tüm gerçek dini içerik insan uzman tarafından yazılır ve onaylanır.

Faz 5 geliştirme içeriği Tanzil Uthmani Arapça metni ve `tr.yazir` mealidir.
İçerik manifestte `development_only` ve `expertApproved: false` taşır.
Ticari yeniden dağıtım izni ile uzman/kurul onayı geliştirmeyi değil, yayını
bloklar; bu durum çözülmeden içerik yayınlanamaz.

## Çalışma şekli

- Cevaplar Türkçe olur; kullanıcı İngilizce prompt verse de bu değişmez.
- Büyük değişiklikten önce plan sun ve kullanıcı onayını bekle.
- Aynı anda tek özellik üzerinde çalış.
- Bir dosyayı değiştirmeden önce oku.
- Test edilebilir küçük adımlarla ilerle.
- Emin olunmayan ve sonucu değiştirecek konuda varsayım yapma; sor.
- Kullanıcının mevcut ve ilişkisiz değişikliklerini koru.
- Kullanıcı özellikle istemedikçe commit oluşturma.
- İş bitince ilgili doğrulamaları çalıştır, sonucu ve elle sınanacakları bildir.

## Oturum başlangıcı ve devri

Her yeni özellik oturumunda:

1. Bu dosyadaki “Şu anki durum” ve “Açık borçlar” bölümlerini oku.
2. `git status` ve son commit mesajlarını kontrol et.
3. Ayrıntı gerekiyorsa `Planlamalar/Yapılacaklar.txt` ve ilgili karar belgesini
   oku; bütün karar arşivini gereksiz yere yükleme.
4. Büyük işse kapsam ve planı kullanıcıya sun.

İş tamamlandığında:

1. Bu dosyadaki güncel fazı ve açık borçları gerekiyorsa düzelt.
2. `Planlamalar/Yapılacaklar.txt` içindeki ilgili maddeyi güncelle.
3. Alınan ayrıntılı ve kalıcı kararı uygun plan belgesine veya
   `Planlamalar/KARAR_GECMISI.md` dosyasına ekle.
4. Kullanıcı commit isterse mesajı tamamlanan oturumu söyleyecek biçimde yaz:
   `Faz 5.1 — Kur'an veri modeli` gibi.

## Doğrulama komutları

```bash
npx tsc --noEmit
npm test
npm run lint
npm run check:content
npx expo-doctor
npx expo start
npx expo start --clear
```

Yapılan değişikliğe uygun en küçük doğrulama kümesini çalıştır. Yerel modül veya
cihaz davranışı otomatik test edilemiyorsa bunu açıkça söyle ve elle doğrulama
listesi ver.

## Şu anki durum

- Faz 0 — tamam
- Faz 1.1 navigasyon — tamam
- Faz 1.2 Button — tamam
- Faz 1.2b ProgressBar — tamam
- Faz 2.1–2.6 öğrenme yolu, soru tipleri, ders akışı, ilerleme, ses/OTA
  altyapısı ve seviye tespiti — tamam
- Faz 2.5.3 mağaza metinleri — tamam; yayın hazır değil
- Faz 3.1 seri veri sistemi — tamam; **görünür seri arayüzü yok**
- Faz 3.2 rozet sistemi — tamam
- Faz 3.3 maskot ve kutlama — tamam
- Faz 4.0–4.5 namaz modülü — tamam
  - Bildirim kodu tamam fakat gerçek tetiklenme dev build'de doğrulanmadı.
  - Kıble pusulası Expo Go'da uçtan uca elle doğrulanabilir.
- Faz 5.1 Kur'an veri katmanı — tamam
  - Arapça metin + meal gömülü; transkripsiyon ertelendi.
  - Yer imi ve günlük benzersiz ayet geçmişi SQLite'ta.
- Faz 5.2 Kur'an okuma ekranı — tamam
  - Kur'an modülüne özel gece arka planı ve tek sayfalı kitap görünümü var.
  - Sure seçimi, RTL Arapça, meal anahtarı, üç yazı boyutu ve sayfa çevirme var.
  - Görünür ayetler son konumu ve günlük okuma geçmişini otomatik kaydeder.
- Faz 5.3 Kur'an hedef sistemi — tamam
  - Günlük sayfa, aylık cüz ve tarihe kadar bitirme hedefleri SQLite'ta kalıcıdır.
  - Saf hesaplama motoru, tahmini bitiş, günlük yerel hatırlatma ve 30 cüz ızgarası var.
- Faz 6 Sıralama Yarışı — tamam
  - Öğren sekmesinden açılan, 60 saniyelik ve oturumluk puan tutan ilk mini oyun var.
  - İçerik `/content/games` altında açıkça örnek işaretlidir; gerçek içerik yoktur.

Sıradaki mantıklı ürün işi **seri arayüzü**. Alternatifler Faz 6'nın diğer mini
oyunları veya ertelenmiş Faz 1.2c Card bileşenidir.

## Açık borçlar ve sınırlar

### Dev build borcu

Faz 1.3 bilinçli olarak ertelendi: Windows geliştirme makinesi, iPhone test
cihazı ve ücretli Apple Developer hesabı gereksinimi. `eas.json` development
profili ve `expo-dev-client` hazırdır.

Dev build geldiğinde ayrı planla:

- `react-native-nitro-modules` doğrudan bağımlılık yapılacak.
- MMKV ile XP, seviye ve placement kalıcılığı doğrulanacak.
- OTA güncelleme doğrulanacak.
- Namaz ve Kur'an hedef bildirimlerinin doğru dakikada ve uygulama kapalıyken
  tetiklenmesi doğrulanacak.
- Tema tercihi kalıcılığı doğrulanacak.
- Sentry ayrı oturumda kurulacak.
- `npx expo-doctor` tam geçmeli.
- SDK yükseltme ancak bunlardan sonra ayrıca değerlendirilecek.

Bugün Expo Go'da XP/seviye/placement ile Kur'an okuyucu yazı/meal ayarı belleğe
düşer ve soğuk açılışta sıfırlanır; bu bilinen MMKV sınırıdır. Buna karşılık
Kur'an son konumu, okuma geçmişi ve hedefi ile seri, rozet, namaz ilçesi,
vakitleri, çizelgesi ve bildirim tercihleri SQLite ile kalıcıdır.

### İçerik ve yayın borcu

- Gerçek ders/mini oyun içeriği ve uzman onayı yok; örnek içerikle yayın yapılmaz.
- Kur'an içeriği geliştirme amaçlıdır; mealin ticari yeniden dağıtım izni,
  metadata şartları, uzman karşılaştırması ve ilgili kurul süreci yayın öncesi
  açıktır.
- Gizlilik politikası taslaktır ve hukuki inceleme gerekir.
- Apple/Google mağaza hesapları tamamlanmadı.
- Uygulama adı geçici ve marka riski taşıyor.
- `icon.png` ve `splash-icon.png` Expo şablonudur; maskot henüz uygulanmadı.
- Kutlama Lottie dosyası yok; `CelebrationMascot.tsx` maskot PNG'ye düşer.
- `extra.audioBaseUrl` boş ve gerçek ses dosyaları yok; yazılı yedek çalışır.
- OTA ve bildirim tetiklenmesi dev build olmadan doğrulanamaz.

### Ertelenmiş kod işleri

- Faz 1.2c Card bileşeni
- Faz 1.3 EAS dev build
- Faz 1.4 Sentry
- Seri sisteminin görünür arayüzü
- Faz 6'nın diğer mini oyunları

## Belge haritası

- Aktif iş listesi: `Planlamalar/Yapılacaklar.txt`
- Ayrıntılı tarihsel kararlar: `Planlamalar/KARAR_GECMISI.md`
- Genel yol haritası: `Planlamalar/PROJE_PLANI_FINAL.md`
- Codex oturum kılavuzu: `Planlamalar/CODEX_PLAYBOOK.md`
- İngilizce oturum promptları: `Planlamalar/PROMPTS_EN.md`
- Namaz veri kaynağı: `Planlamalar/NAMAZ_VERI_KAYNAGI.md`
- OTA doğrulaması: `Planlamalar/OTA_GUNCELLEME.md`
- Mağaza ve yayın belgeleri: `Planlamalar/Magaza/`

Karar arşivini baştan sona her oturumda okuma. Yalnız aktif işle ilgili başlığı
ara ve gerekli bölümü oku.
