# PROJE PLANI — v2.0

**Proje:** Türkçe İslami Öğrenme ve İbadet Takip Uygulaması
**Geliştirici:** Tek kişi + küçük bütçe
**Araç:** VS Code + Claude Code
**Güncelleme:** 6 Ağustos 2026

> v1.0'dan farkı: teknik yığın gerçek duruma göre düzeltildi, üç yeni iş kalemi eklendi
> (test, hata izleme, yayın hazırlığı), içerik dağıtım kararı verildi, faz planı
> "ilk yayın = sadece öğrenme modülü" kararına göre yeniden düzenlendi.

---

## 1. ÜRÜN TANIMI

**Tek cümle:** Müslümanın dinini sıfırdan seviye seviye öğrenebileceği, namazını ve Kur'an okumasını takip edebileceği, oyunlaştırılmış Türkçe mobil uygulama.

| | |
|---|---|
| **Hedef kitle** | Yaş sınırı yok — seviye tespitiyle herkes kendi noktasından başlar |
| **İlk pazar** | Türkiye |
| **Platform** | iOS + Android (React Native / Expo) |
| **Model** | MVP'de ücretsiz, monetizasyon sonraya |
| **Uygulama adı** | ⚠️ **HENÜZ KARARLAŞMADI** — `DieTrying` / `com.dietrying.app` yer tutucu |

**Ayırt edici yön:** Türkiye'de öğrenme + ibadet takibi + Kur'an takibini gerçek bir oyunlaştırma katmanıyla birleştiren uygulama yok. Mevcut uygulamalar ya sadece namaz vakti veriyor, ya sadece Kur'an, ya da kurumsal ve durağan içerik sunuyor.

**Rakip konumlandırma:**

| Rakip | Güçlü yanı | Boşluğu |
|---|---|---|
| e-Diyanet | Güvenilir içerik, geniş kullanıcı | Oyunlaştırma yok, durağan |
| Alifba | İyi oyunlaştırma | İngilizce, sadece çocuk, ibadet takibi yok |
| Namaz vakti uygulamaları | Günlük kullanım | Sadece tek işlev |

---

## 2. MODÜLLER

### A — ÖĞREN (ana değer önerisi, önce bu geliştirilecek)

Duolingo tarzı seviye seviye ilerleyen öğrenme yolu.

**Yol sıralaması:**
1. Temel İnanç — Kelime-i Tevhid, Kelime-i Şehadet, İmanın Şartları
2. İslam'ın Şartları — beş şart, her biri ayrı ünite
3. Temizlik & Abdest — abdest, gusül, teyemmüm
4. Namaz — vakitler, rekâtlar, sureler, dualar, adım adım kılınış
5. Dualar & Sureler — günlük dualar, kısa sureler
6. Oruç
7. Zekât & Sadaka
8. Hac & Umre
9. Ahlak — senaryo bazlı
10. Siyer & Peygamber Kıssaları
11. Elif-Ba — bağımsız yan yol

**Seviye tespiti:** İlk açılışta seçim (Başlangıç / Temeller / İleri) + kısa test. Sonuca göre yolda ileri bir noktadan başlar. Atlanan üniteler her zaman geri dönülüp açılabilir.

**Soru tipleri:** çoktan seçmeli, görsel eşleştirme, sıralama, boşluk doldurma, sesli tanıma, doğru/yanlış

### B — NAMAZ
- Konum bazlı vakit gösterimi + geri sayım
- Namaz çizelgesi: günlük 5 vakit işaretleme (kıldım / kılmadım / kaza), haftalık ve aylık görünüm, kaza sayacı
- Vakit hatırlatıcı bildirimleri (vakit bazında ayarlanabilir)
- Kıble pusulası

### C — KUR'AN
- Okuma arayüzü (Arapça + meal + transkripsiyon)
- Kaldığın yeri otomatik hatırlama
- Hedef koyma: günde X sayfa / ayda X cüz / hatim hedefi
- İlerleme görselleştirme ve okuma serisi

### D — OYUNLAR
Öğrenme yoluna serpiştirilmiş, ödül olarak açılan mini oyunlar: Harf Yakalama, Sıralama Yarışı, Hafıza Kartları, Cami İnşa, Kelime Avı

### E — PARK EDİLENLER (sonraki sürümler)
- **Hafızlık çizelgesi** — ezberlenen sure/cüz takibi, tekrar programı, unutma eğrisine göre hatırlatma
- Çoklu dil / uluslararası yayın
- Aile hesabı ve ebeveyn paneli
- Sosyal özellikler

---

## 3. EKRAN YAPISI

```
Alt Sekme Çubuğu:
├── 📖 Öğren      → seviye haritası, dersler, oyunlar
├── 🕌 Namaz      → vakitler, çizelge, kıble
├── 📗 Kur'an     → okuma, hedefler, ilerleme
└── 👤 Profil     → istatistik, rozetler, ayarlar
```

İlk yayında (v0.1) sadece **Öğren** ve **Profil** dolu olacak; diğer iki sekme ya gizli ya "yakında" durumunda.

---

## 4. TEKNİK MİMARİ

### Yığın (kurulu ve doğrulanmış — SDK 57)

| Katman | Seçim | Not |
|---|---|---|
| Framework | React Native 0.86 + Expo SDK 57 | |
| Dil | TypeScript (strict) | `any` yasak |
| Navigasyon | Expo Router | dosya bazlı, typed routes açık |
| State | Zustand | |
| Yerel DB | expo-sqlite | tarihsel veriler |
| Hızlı depolama | react-native-mmkv v4 | Nitro tabanlı, Expo Go'da çalışmaz |
| Animasyon | Reanimated 4 + Lottie | |
| Ses | **expo-audio** | ⚠️ expo-av SDK 54'te kaldırıldı |
| Konum | expo-location | |
| Bildirim | expo-notifications | Expo Go'da çalışmaz |
| Sensör | expo-sensors | kıble — Faz 4'te kurulacak |
| Arayüz metni | `/constants/strings.ts` | kütüphane yok; çoklu dil park edildi |
| OTA güncelleme | expo-updates | Faz 2.5'te kurulacak |
| Hata izleme | Sentry | Faz 1'de kurulacak |
| Backend | Faz 7'ye kadar YOK, sonra Supabase | |

> **Expo Go yeterli değil.** Bildirimler ve MMKV yüzünden EAS ile **geliştirme derlemesi (dev build)** almak zorunlu. Bu bir iş kalemidir ve Faz 1'e konmuştur.

### Klasör Yapısı

```
/app                    Expo Router ekranları
  /(tabs)               ana sekmeler
  /lesson/[id].tsx      ders ekranı
/components             ortak UI bileşenleri
/features
  /learning             ders motoru, soru tipleri
    /components         soru tipi bileşenleri
  /prayer               vakit, çizelge, bildirim
  /quran                okuma, hedef takibi
  /games                mini oyunlar
  /progress             XP, rozet, streak
/content                JSON içerik dosyaları
/lib                    yardımcı fonksiyonlar
/constants              renk, tipografi, metin, sabitler
/types                  TypeScript tipleri
```

### Üç Mimari Kural

1. **İçerik koda gömülmez.** Dersler ve sorular `/content` altında JSON. Yeni ders eklemek kod değişikliği gerektirmez. *Bu, projenin en önemli kararı.*
2. **Ekranlar ince, mantık features'ta.** `/app` sadece düzen ve veri bağlama yapar.
3. **Sabitler merkezi.** Renk, boşluk, font, arayüz metni doğrudan yazılmaz.

### İçerik Dağıtım Kararı

**Karar: içerik uygulamaya gömülü JSON + `expo-updates` ile OTA güncelleme.**

- İçerik JS paketinin içinde → çevrimdışı tam çalışır, sunucu gerekmez
- Yazım hatası düzeltmesi `eas update` ile dakikalar içinde yayınlanır, mağaza beklenmez
- Backend'i öne çekmenin gerekçesi yok: OTA aynı faydayı bedava veriyor. Backend'in gerçek gerekçesi hesap + cihazlar arası senkronizasyon, o da Faz 7.

**İstisna — ses dosyaları:** Pakete gömülmez. Uzaktan indirilip cihazda önbelleğe alınır. Aksi hâlde uygulama boyutu kontrolden çıkar. Ses altyapısı baştan bu ayrıma göre kurulur.

### Veri Modeli Kararı — Sync'e Hazır Ol

Faz 7'de bulut senkronizasyonu gelecek. Bu yüzden **tüm SQLite tabloları baştan** şu alanları taşır:

- `updatedAt` (epoch ms) — çakışma çözümü için
- `deletedAt` (nullable) — yumuşak silme; sert silme sync'i bozar

Şimdi eklemek bedava, Faz 7'de eklemek tüm veriyi migrate etmek demek.

### Namaz Vakti Kaynağı — Kritik Karar

adhan-js'in Türkiye metodu, Diyanet metodunun **yaklaşımıdır, birebir aynı değildir**. Türkiye'de kullanıcı vakti Diyanet'inkiyle karşılaştırır; küçük fark bile güven kaybettirir.

**Hedef:** Diyanet'in resmi verisini kullan — şehir/ilçe bazlı yıllık veriyi indir, SQLite'ta sakla, çevrimdışı çalış. Konumdan en yakın ilçeyi tespit et. Yurt dışı için yedek: adhan-js.

> ⚠️ **Çözülmemiş sorun:** Diyanet'in resmi public API'si olduğu doğrulanmadı. Pratikte siteden veri çekmek veya üçüncü parti bir API kullanmak gerekebilir; ikisinin de kullanım şartları ve süreklilik riski var. **Faz 4'ün ilk oturumu bu araştırmadır ve bloklayıcıdır** — sonucuna göre Faz 4'ün tamamı yeniden tasarlanabilir.

---

## 5. FAZ PLANI

Her faz **yayınlanabilir** veya **elle tutulur** bir çıktı bırakır.

| Faz | İçerik | Süre | Çıktı |
|---|---|---|---|
| **0** | Kurulum, tasarım sistemi, tipler, örnek içerik | 1 hafta | Şeması netleşmiş boş proje |
| **1** | Navigasyon, temel bileşenler, **dev build**, Sentry | 2 hafta | **Telefonunda kurulu**, gezinilebilir uygulama |
| **2** | Öğrenme motoru, soru tipleri, ilerleme, seviye tespiti, ses altyapısı | 5-6 hafta | Çalışan öğrenme modülü |
| **2.5** | **Yayın hazırlığı** — gizlilik politikası, mağaza materyalleri, OTA, test dağıtımı | 1 hafta | **v0.1 — İLK YAYIN** |
| **3** | Streak, rozet, maskot, kutlamalar | 3-4 hafta | v0.2 |
| **4** | Namaz: kaynak araştırması → vakit + çizelge + bildirim + kıble | 4-5 hafta | v0.3 |
| **5** | Kur'an okuma + hedef takibi | 5-6 hafta | v0.4 |
| **6** | Mini oyunlar | 4-5 hafta | v0.5 |
| **7** | Hesap + bulut senkronizasyon | 3-4 hafta | v1.0 |

**Toplam:** ~29-36 hafta (7-9 ay) tam zamanlı tempoda. Yarı zamanlı çalışıyorsan iki katını varsay — bu normal ve plan buna göre bozulmaz.

### İlk Yayın Kapsamı — Karar

**v0.1 sadece öğrenme modülüdür.** Namaz ve Kur'an sekmeleri ilk yayında yok.

Bilinen risk: kullanıcının uygulamayı her gün açması için bir sebep Faz 4'e kadar oluşmaz. Bunu streak ve rozet sistemi (Faz 3) kısmen telafi eder. Kabul edilmiş bir takas.

### Faz 0 Kontrol Listesi

Kod:
- [x] Expo projesi kuruldu, klasör yapısı CLAUDE.md'ye uygun
- [x] Bağımlılıklar kuruldu, `expo-doctor` 20/20
- [ ] `/constants` — tasarım sistemi (renk, tipografi, boşluk, yarıçap, metin)
- [ ] `/types` — öğrenme modülü tipleri
- [ ] `/content` — örnek veri (yapı gerçek, metinler yer tutucu)

Karar:
- [ ] **Uygulama adı ve bundle identifier** — yayından sonra değiştirilemez
- [x] İçerik dağıtımı: gömülü + OTA
- [x] Veri modeli: `updatedAt` / `deletedAt` baştan
- [x] Arayüz metni: `strings.ts`, kütüphane yok

Sonraya ertelenen (artık Faz 0'ı bloklamıyor):
- [ ] İlk 2 ünitenin gerçek içeriği — örnek veriyle ilerlenecek, sonra elle doldurulacak
- [ ] İlahiyatçı onayı — **yayından önce zorunlu**
- [ ] Maskot tasarımı — yer tutucuyla ilerlenir
- [ ] Kur'an meali telif araştırması — Faz 5'ten önce
- [ ] Diyanet vakit verisi kaynağı — Faz 4'ün ilk oturumu

---

## 6. KALİTE VE İZLEME

v1.0'da hiç yoktu. Tek kişilik ekipte ve AI ile yazılan kodda bunlar lüks değil.

### Test — dar ama zorunlu

Arayüz testi yok. Sadece **saf mantık** test edilir, çünkü hatası sessizdir:

| Ne | Neden | Faz |
|---|---|---|
| Streak hesabı | Gün atlama/dondurma mantığı gözle doğrulanamaz | 3 |
| İlerleme ve kilit açma | Yanlış kilit = kullanıcı ilerleyemez | 2 |
| Namaz vakti / geri sayım | Saat dilimi ve gün dönümü hataları klasik | 4 |
| Hedef ve tarih hesapları | Hatim tahmini yanlışsa güven gider | 5 |

### Hata izleme

Sentry, **Faz 1'de** kurulur. İlk yayında kullanıcı telefonunda çöken bir uygulamanın haberini alamamak kabul edilemez. Ücretsiz katman yeterli.

### Yayın hazırlığı (Faz 2.5)

- [ ] Gizlilik politikası — Apple ve Google zorunlu tutuyor, yoksa reddediyor
- [ ] Veri güvenliği / veri toplama formu (her iki mağaza)
- [ ] Yaş derecelendirmesi
- [ ] Uygulama ikonu, ekran görüntüleri, mağaza açıklaması
- [ ] TestFlight (iOS) / Internal Testing (Android) ile en az 5 kişiye dağıtım
- [ ] `expo-updates` kurulumu ve ilk OTA denemesi

> Dini içerikli uygulamalar Apple incelemesinde daha titiz değerlendiriliyor. Bu adıma bir hafta ayır, "kod bitti ama yayınlayamıyorum" durumuna düşme.

---

## 7. BÜTÇE

| Kalem | Öncelik | Not |
|---|---|---|
| İçerik onayı (ilahiyatçı) | **Zorunlu** | Pazarlık edilemez, yayından önce |
| Apple Developer | Zorunlu | $99/yıl |
| Google Play | Zorunlu | $25 tek seferlik |
| Maskot + karakter tasarımı | Yüksek | Uygulamanın yüzü; Faz 3'e kadar yer tutucu |
| Seslendirme | Orta | Altyapı Faz 2'de kurulur, dosyalar sonra eklenir. AI ses kullanma — telaffuz hatası öğretim hatasına döner |
| EAS Build | Düşük | Ücretsiz kota yetmezse aylık ücretli katman |
| Sentry | Yok | Ücretsiz katman yeterli |
| UI ikon/animasyon | Düşük | Ücretsiz kaynaklarla çözülebilir |
| Backend | Yok | Faz 7'ye kadar gerekmez |

---

## 8. RİSKLER

| Risk | Etki | Önlem |
|---|---|---|
| **Dini içerikte hata** | Kritik — itibar kaybı geri dönülmez | Uzman onayı zorunlu; AI'ya içerik yazdırılmaz; yer tutucular yayından önce temizlenir |
| **Yer tutucu içeriğin yayına kaçması** | Kritik | Yayın öncesi `ÖRNEK` / `TODO` taraması zorunlu adım |
| **Diyanet veri kaynağı bulunamaması** | Yüksek — Faz 4'ü yeniden tasarlatır | Faz 4'ün ilk oturumu araştırma, bloklayıcı |
| **Kur'an meali telifi** | Yüksek — yayını engeller | Faz 5'ten önce netleştir |
| **Kapsam büyümesi** | Yüksek — proje bitmez | Faz planına sadık kal, park listesine ekle |
| **Tek kişi tükenmesi** | Yüksek | Faz 1 sonunda telefonunda çalışan uygulama; erken yayın |
| **İlk yayında günlük kullanım sebebi yok** | Orta | Streak/rozet Faz 3'te; kabul edilmiş takas |
| **Çocuk kullanıcı verisi** | Orta — yasal | Faz 7'ye kadar hesap yok, veri cihazda |

---

## 9. TASARIM İLKELERİ

1. **İbadet takibinde ton yumuşak olur.** "Kaçırdın", "seri bozuldu", "başarısız" gibi suçlayıcı dil kullanılmaz. İbadet stres kaynağına dönüşürse kullanıcı uygulamayı siler.
2. **Namaz verisi asla paylaşılmaz.** Liderlik tablosu, sosyal paylaşım, arkadaş karşılaştırması yok. Bu veri mahremdir.
3. **Her metin seslendirilebilir olur.** *(v1.0 hedefi.)* MVP'de ses altyapısı kurulur ama dosyalar zorunlu değildir — uygulama sessiz de tam çalışır.
4. **Kısa oturumlar hedeflenir.** Günde 5-10 dakika düzenli kullanım, uzun oturumlardan değerlidir.

---

## 10. YAPAY ZEKA POLİTİKASI

**Claude Code KULLANILIR:** kod yazımı, refactor, hata ayıklama, UI bileşenleri, test, içeriği JSON şemasına dönüştürme, **yapısal yer tutucu örnek veri üretimi**

**Claude Code KULLANILMAZ:** dini içerik üretimi, ayet/hadis/dua metni yazımı, fıkhi hüküm belirleme veya yorumlama

Örnek veri üretirken: yapı, soru sayısı ve tip dağılımı gerçekçi olur; ünite/ders **başlıkları** yapısal olduğu için gerçek olabilir; ama soru metni, cevap, açıklama ve her türlü dini metin `ÖRNEK` veya `TODO` yer tutucusudur ve dosya başında `ÖRNEK VERİ — GERÇEK DEĞİL` işaretiyle gelir.

Kod AI'dan gelir, içerik insandan. Bu ayrım istisnasızdır ve CLAUDE.md'de kayıtlıdır.

---

## İLGİLİ DOSYALAR

- `CLAUDE.md` — Claude Code'un proje kuralları (proje kökünde)
- `Planlamalar/CLAUDE_CODE_PLAYBOOK.md` — faz faz promptlar + token verimliliği rehberi
- `Planlamalar/PROMPTS_EN.md` — sadece promptlar, İngilizce, kopyala-yapıştır
- `Planlamalar/Yapılacaklar.txt` — güncel iş listesi
