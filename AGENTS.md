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
- Faz 3.1 seri veri sistemi — tamam; seri günü Öğren ekranındaki üst HUD'da görünür
- Faz 3.2 rozet sistemi — tamam
- Faz 3.3 maskot ve kutlama — tamam
- Faz 4.0–4.6 namaz modülü — tamam
  - Bildirim kodu tamam fakat gerçek tetiklenme dev build'de doğrulanmadı.
  - Kıble pusulası Expo Go'da uçtan uca elle doğrulanabilir.
  - Konum seçimi Namaz modülünü kilitlemez; günlük kayıt, çizelge ve Cennet
    Bahçesi konum olmadan çalışır.
  - İl/ilçe seçimi aramalı ve onaylıdır; başarılı katalog yanıtları SQLite'ta
    yerel önbelleğe alınır. Konum eşleşmesi belirsiz ilçeyi tahmin etmez.
  - Namaz kaydı iki durumlu (`kayıt yok` / `kılındı`); kaza durumu kaldırıldı.
  - Cennet Bahçesi toplam işaret ve kayıt günü sayısından türetilir; ayrı hassas
    veri veya sosyal karşılaştırma üretmez ve zaman geçmesiyle gerilemez.
  - Namaz ana ekranında Figma Design ile hazırlanan, tamamı kırpılmadan görünen
    çocuk dostu sarı-turuncu seccade arka planı ve yarı saydam içerik yüzeyleri
    vardır; Sıradaki Vakit kartı kompakt yatay düzendedir.
  - Cennet Bahçesi beş aşamayı katmanlı izometrik adada gösterir; filiz, çiçek,
    ağaç, yol ve gölet mevcut büyüme puanına göre görünür olur.
  - Yeni konum/seçim/bahçe düzenleri gerçek telefonda elle doğrulanacak.
- Faz 5.1 Kur'an veri katmanı — tamam
  - Arapça metin + meal gömülü; transkripsiyon ertelendi.
  - Yer imi ve günlük benzersiz ayet geçmişi SQLite'ta.
- Faz 5.2 Kur'an okuma ekranı — tamam
  - Kur'an modülü sıcak kâğıt/grafit/sarı görsel dilini ve tek sayfalı kitap görünümünü kullanır.
  - Mushaf okuması ile bağımsız sure okuması ayrı modlardır. Bağımsız sure
    okuması son konumu, geçmişi ve hedefleri değiştirmez.
  - Mushaf metni ayet başına satır yerine RTL ve iki yana yaslı sürekli akışta;
    ayet numarası satır içi küçük işarettir. Sayfa içi sure geçişinde Türkçe ad
    ve ayraç görünür.
  - Meal anahtarı, üç yazı boyutu ve sayfa çevirme vardır. Mushaf sayfası
    görüntülendiğinde sayfadaki ayetler son konum ve günlük geçmişe kaydedilir.
- Faz 5.3 Kur'an hedef sistemi — tamam
  - Günlük sayfa, aylık cüz ve tarihe kadar bitirme hedefleri SQLite'ta kalıcıdır.
  - Saf hesaplama motoru, tahmini bitiş, günlük yerel hatırlatma ve 30 cüz ızgarası var.
- Faz 6 Sıralama Yarışı — tamam
  - Öğren sekmesinden açılan, 60 saniyelik ve oturumluk puan tutan ilk mini oyun var.
  - İçerik `/content/games` altında açıkça örnek işaretlidir; gerçek içerik yoktur.
- Faz 7 hesap ve senkronizasyon kodu — tamam; dış hizmet kurulumu açık
  - İsteğe bağlı e-posta hesabı, çevrimdışı outbox/pull, yerel veri taşıma,
    hesap silme ve kullanıcı bazlı SQLite sahipliği var.
  - Namaz kayıtları ayrı açık onay olmadan buluta çıkmaz; sosyal paylaşım ve
    liderlik tablosu yoktur.
  - Supabase migration/RLS testi/Edge Function dosyaları hazır; gerçek proje,
    SMTP, deploy ve iki cihaz sınaması yapılmadı.
- Bakım ve arayüz yenilemesi — 25 Ağustos 2026
  - Profil varsayılan olarak Profilim özetini açar; sol kategori menüsü yalnız
    menü düğmesine dokunulduğunda görünür. Rozetler, Seviye Tespiti, Bildirimler
    ve Hesap ayrı bölümlerdir.
  - Öğren ekranındaki oyunlar ve challenge'lar ana akışta yer kaplamaz; üst HUD'daki
    oyun düğmesinin açtığı pencerede gösterilir. Bugün yalnız Sıralama Yarışı etkindir.
  - Kullanıcının sağladığı 114 Türkçe sure adı içerik kataloğuna işlendi;
    `expertApproved: false` olduğu için yayın öncesi uzman onayı gerekir.
  - Kur'an okuyucusunda sure adları Türkçe gösterilir; ayet ayırıcıları ve tekrar
    eden “x. ayet” yazıları kaldırıldı, yalnız küçük başlangıç numarası bırakıldı.
  - Namaz, Kur'an ana ekranı ve Profil için Öğren sayfasının çizim diline yakın,
    birbirinden farklı ve metinsiz çocuk dostu arka planlar Figma Design'da
    hazırlandı. Uygulamadaki ortak zemin bileşeni görselleri kırpmadan sığdırır;
    Kur'an okuyucusu ve hedef ekranlarının mevcut zemini korunur.
  - Kur'an ana ekranı başlığı “Kur'an-ı Kerim”dir; ikonla tek satırda gösterilir
    ve başlık altında tanıtım metni bulunmaz.
  - Ana navigasyon dört metin sekmesidir; ikon yoktur, seçili sekme küçük nokta ve
    koyu yazıyla belirtilir. İçerik yüzeyi alt bardan yuvarlak köşe ve gölgeyle ayrılır.
  - Genel palet sıcak kâğıt, grafit, sarı, pudra pembe ve açık maviye; uygulama
    tipografisi Nunito'ya taşındı. Kur'an'ın eski lacivert/turkuaz gece paleti kaldırıldı.
  - Öğren ekranında sabit özgün kâğıt illüstrasyonu, ince konturlu sarı yol,
    çıkartma seviyeler, kayan kırtasiye süsleri, gerçek seri/konum HUD'u ve geçerli
    seviyede bayrak vardır. Dini metin veya sembol içeren yeni görsel üretilmedi.

Ana faz planı tamamlandı. Bundan sonraki geliştirme kullanıcıdan gelen hata,
değişiklik ve yenileme talepleri için **incele → planla → geliştir → doğrula →
belgele** döngüsüyle ilerler. Açık borçlar kaybolmaz; ilgili talep geldiğinde ele
alınır.

## Açık borçlar ve sınırlar

### Dev build borcu

Faz 1.3 bilinçli olarak ertelendi: Windows geliştirme makinesi, iPhone test
cihazı ve ücretli Apple Developer hesabı gereksinimi. `eas.json` development
profili ve `expo-dev-client` hazırdır.

Dev build geldiğinde ayrı planla:

- `react-native-nitro-modules` doğrudan bağımlılık yapılacak.
- MMKV ile Kur'an okuyucu ve tema tercihi kalıcılığı doğrulanacak.
- OTA güncelleme doğrulanacak.
- Namaz ve Kur'an hedef bildirimlerinin doğru dakikada ve uygulama kapalıyken
  tetiklenmesi doğrulanacak.
- Tema tercihi kalıcılığı doğrulanacak.
- Sentry ayrı oturumda kurulacak.
- `npx expo-doctor` tam geçmeli.
- SDK yükseltme ancak bunlardan sonra ayrıca değerlendirilecek.

Bugün XP/seviye/placement, Kur'an son konumu/okuma geçmişi/hedefi, seri, rozet,
namaz ilçesi/vakitleri/çizelgesi ve bildirim tercihleri SQLite ile kalıcıdır.
Kur'an okuyucu yazı/meal ayarı ile tema tercihi Expo Go'da MMKV'nin bilinen
bellek yedeğine düşebilir ve soğuk açılışta sıfırlanabilir.

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
- Yeni metin sekmeli kabuk, Nunito yüklemesi, sabit Öğren arka planı, yol
  yerleşimi ve açık renk Kur'an yüzeyleri gerçek telefonda elle doğrulanacak.
- OTA ve bildirim tetiklenmesi dev build olmadan doğrulanamaz.
- Faz 7 Supabase projesi henüz bağlanmadı: migration/Edge Function deploy,
  Auth SMTP ve redirect URL, Docker pgTAP/RLS testi ve iki cihaz E2E açıktır.
- Hesap/e-posta, çocuk kullanıcı ve isteğe bağlı hassas namaz senkronu nedeniyle
  gizlilik politikası ile mağaza beyanları yeniden hukuki inceleme ister.
- `npm audit --omit=dev` bugün 15 orta + 9 yüksek dolaylı Expo/Metro bulgusu
  raporluyor; önerilen otomatik çözüm Expo SDK 57'ye geçiştir. Proje SDK 54'e
  sabit olduğu için `audit fix` uygulanmadı; SDK yükseltme oturumunda ele alınır.

### Ertelenmiş kod işleri

- Faz 1.2c Card bileşeni
- Faz 1.3 EAS dev build
- Faz 1.4 Sentry
- Seri sisteminin görünür arayüzü
- Faz 6'nın diğer mini oyunları
- Faz 7 gerçek Supabase kurulumu ve cihazlar arası E2E doğrulaması
- Kur'an için birebir 15 satırlı QCF Mushaf dizgisi; `open-quran-view` web
  bileşeni React Native'e doğrudan uymaz, sayfa fontu/veri lisansı çözülmeden
  varlıkları projeye kopyalanmaz. Bugünkü okuyucu mevcut doğrulanmış metni RTL
  ve iki yana yaslı yerel akışta gösterir.

## Belge haritası

- Aktif iş listesi: `Planlamalar/Yapılacaklar.txt`
- Ayrıntılı tarihsel kararlar: `Planlamalar/KARAR_GECMISI.md`
- Genel yol haritası: `Planlamalar/PROJE_PLANI_FINAL.md`
- Codex oturum kılavuzu: `Planlamalar/CODEX_PLAYBOOK.md`
- İngilizce oturum promptları: `Planlamalar/PROMPTS_EN.md`
- Namaz veri kaynağı: `Planlamalar/NAMAZ_VERI_KAYNAGI.md`
- OTA doğrulaması: `Planlamalar/OTA_GUNCELLEME.md`
- Supabase kurulum/doğrulaması: `Planlamalar/SUPABASE_SENKRONIZASYON.md`
- Mağaza ve yayın belgeleri: `Planlamalar/Magaza/`

Karar arşivini baştan sona her oturumda okuma. Yalnız aktif işle ilgili başlığı
ara ve gerekli bölümü oku.
