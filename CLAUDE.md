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

**Faz 0 — Kurulum ve Şema.**
İskelet ve bağımlılıklar tamam (Oturum 0.1, 0.2). Sırada: tasarım sistemi (0.3),
tip tanımları (0.4), örnek içerik (0.5).

İlk yayın (v0.1) **sadece öğrenme modülüdür** — namaz ve Kur'an Faz 4-5'te.

Detaylı plan: `Planlamalar/PROJE_PLANI_FINAL.md`
Faz promptları: `Planlamalar/CLAUDE_CODE_PLAYBOOK.md`
