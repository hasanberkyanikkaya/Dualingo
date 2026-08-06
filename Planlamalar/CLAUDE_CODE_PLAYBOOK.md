# Claude Code Prompt Kılavuzu — v2.0

Faz faz kopyala-yapıştır promptlar + token verimliliği rehberi.

> v1.0'dan farkı: Faz 0 kısaldı (içerik yazımı artık bloklamıyor, örnek veriyle ilerleniyor),
> Faz 1'e dev build ve Sentry eklendi, Faz 2.5 yayın hazırlığı eklendi,
> testler ve Diyanet araştırması ilgili fazlara yerleştirildi.

---

# BÖLÜM 1 — Token Verimliliği (Önce Bunu Oku)

Claude Code'un her oturumda sınırlı bir "hafızası" (context window) var. Doldukça hem kalite düşer hem kotanı hızlı tüketirsin. Aşağıdakiler pratikte en çok fark yaratan alışkanlıklar.

## 1.1 En büyük tasarruf: CLAUDE.md

Projenin kurallarını her prompt'ta tekrar anlatmak, aynı bilgiyi defalarca ödemek demektir. CLAUDE.md bir kere okunur ve orada durur.

❌ "React Native + Expo kullanıyoruz, TypeScript ile, klasör yapımız şöyle... şimdi bir buton yap"
✅ "Bir birincil buton bileşeni yap"

## 1.2 Oturum hijyeni: /clear ve /compact

| Durum | Komut |
|---|---|
| Yeni ve ilgisiz bir işe geçiyorsun | `/clear` — hafızayı tamamen sıfırlar |
| Aynı iş uzadı, context doluyor | `/compact` — geçmişi özetleyip yer açar |

**Kural:** Her yeni özellik = yeni oturum. Ders motorunu bitirdin, namaz modülüne geçiyorsun → `/clear`.

## 1.3 @ ile hedef göster, arama yaptırma

❌ "Login ekranındaki hatayı düzelt"
✅ "@app/(tabs)/ogren.tsx dosyasındaki seviye kartı tıklanmıyor, düzelt"

## 1.4 Küçük parçalar halinde iste

❌ "Öğrenme modülünü yap"
✅ "Sadece MultipleChoiceQuestion bileşenini yap. Diğer soru tiplerine dokunma."

## 1.5 Plan Mode'u büyük işlerde kullan

Karmaşık bir özellikte önce plan iste, planı onayla, sonra parça parça uygulat. Yanlış yönde 500 satır kod yazılmasını engeller — bu en pahalı hatadır.

## 1.6 İçerik klasörünü okutma

`/content` altındaki JSON dosyaları büyür. Claude'un hepsini okumasına asla izin verme.

❌ "@content klasörünü incele"
✅ "@content/lessons/namaz-01.json şemasına bakarak yeni bir ders dosyası oluştur"

## 1.7 Tam dosya yeniden yazdırma

❌ "Bu dosyayı baştan yaz, şu değişiklikle"
✅ "Bu dosyada sadece handleSubmit fonksiyonunu değiştir"

## 1.8 Model seçimi

`/model` ile geçiş yaparsın.
- **Mimari kararlar, karmaşık hata ayıklama, plan çıkarma** → güçlü model
- **Basit bileşen, stil düzeltme, tekrarlayan iş** → hafif model

## 1.9 Hata mesajını yapıştır, tarif etme

❌ "Uygulama açılmıyor, bir hata veriyor sanırım navigasyonla ilgili"
✅ (hatanın tam metnini yapıştır) + "bunu düzelt"

## 1.10 Onaylamadan önce oku

Yanlış giden bir şeyi hemen durdurmak, 10 dosya sonra fark etmekten çok daha ucuz.

---

# BÖLÜM 2 — Faz Faz Promptlar

Sıra: **önce öğrenme platformu.** İlk yayın (v0.1) sadece öğrenme modülüdür.

---

## FAZ 0 — Kurulum ve Şema (1 hafta)

> İçerik yazımı artık bu fazı bloklamıyor. Claude yapısal örnek veri üretecek,
> sen sonra elle gerçek içerikle değiştireceksin.

### Oturum 0.1 — Proje kurulumu ✅ TAMAMLANDI
Expo iskeleti kuruldu, klasör yapısı CLAUDE.md'ye uygun hâle getirildi.

### Oturum 0.2 — Bağımlılıklar ✅ TAMAMLANDI
Yığın kuruldu, `expo-doctor` 20/20 geçiyor.

### Oturum 0.3 — Tasarım sistemi

```
/constants altında tasarım sistemini oluştur:
- colors.ts: birincil, ikincil, başarı, hata, nötr renkler + açık/koyu tema
- typography.ts: başlık/gövde/etiket font boyutları ve ağırlıkları
- spacing.ts: 4'ün katları şeklinde boşluk ölçeği
- radius.ts: köşe yuvarlaklığı değerleri
- strings.ts: arayüz metinleri (düz TypeScript nesnesi, i18n kütüphanesi yok)

Uygulama tonu: sıcak, davetkâr, çocuk dahil her yaşa uygun.
Renk paleti için önce 2-3 alternatif öner, ben seçeyim; sonra kodu yaz.
```

### Oturum 0.4 — Tip tanımları

```
/types altında öğrenme modülünün TypeScript tiplerini yaz:
- LearningPath (id, başlık, açıklama, üniteler)
- Unit (id, başlık, seviyeler)
- Level (id, başlık, sıra, zorluk, xpÖdül, sorular)
- Question — birleşik tip (union), alt tipler:
  multiple_choice, image_match, ordering, fill_blank, audio_choice, true_false
- UserProgress (tamamlanan seviyeler, XP, streak)

Ses alanları opsiyonel olsun — dosya yoksa uygulama sessiz çalışabilmeli.
Sadece tip tanımı yaz, implementasyon yok.
```

### Oturum 0.5 — Örnek içerik ve şema

```
@types/learning.ts tiplerine uygun örnek ders JSON dosyaları oluştur:
/content/lessons/ altında ilk 2 ünite, gerçekçi seviye ve soru sayısıyla.

İçerik kuralı: yapı gerçek, metin yer tutucu.
- Ünite ve ders başlıkları gerçek olabilir (Abdest, İmanın Şartları gibi)
- Soru metni, cevaplar, açıklamalar "ÖRNEK SORU 1", "ÖRNEK CEVAP A" olsun
- Ayet/hadis/dua metni YAZMA, oraya TODO bırak
- Her dosyanın başında: ÖRNEK VERİ — GERÇEK DEĞİL

Her soru tipinden en az bir örnek içersin.
```

### Faz 0 kararları — sen vereceksin
- [ ] **Uygulama adı ve bundle identifier.** Yayından sonra değiştirilemez. Faz 1'deki ilk derlemeden önce kararlaşmalı.

---

## FAZ 1 — İskelet, Navigasyon ve Cihazda Çalışan Uygulama (2 hafta)

> Faz sonunda uygulama **kendi telefonunda kurulu** olacak. Bu, motivasyonun en ucuz sigortası.

### Oturum 1.1 — Sekme yapısı

```
Expo Router ile 4 sekmeli alt navigasyon kur:
Öğren, Namaz, Kur'an, Profil.

Şimdilik her sekme sadece başlığını gösteren boş bir ekran olsun.
Namaz ve Kur'an sekmeleri "Yakında" durumunda görünsün — ilk yayında dolu olmayacaklar.
İkonları @expo/vector-icons'tan seç.
Renkler, tipografi ve metinler /constants'tan gelsin.
```

### Oturum 1.2 — Temel bileşenler

Her birini **ayrı oturumda** yaptır.

```
/components altında Button bileşeni yap.
Varyantlar: primary, secondary, ghost.
Boyutlar: small, medium, large.
Durumlar: normal, disabled, loading.
Basılma animasyonu olsun (Reanimated ile hafif küçülme).
Renkler /constants/colors.ts'ten gelsin.
```

```
/components altında ProgressBar bileşeni yap.
Props: current, total, renk varyantı.
Değer değiştiğinde yumuşak animasyonla dolsun.
```

```
/components altında Card bileşeni yap.
Props: children, onPress (opsiyonel), varyant.
Gölge ve köşe yuvarlaklığı /constants'tan.
```

### Oturum 1.3 — Geliştirme derlemesi (dev build)

```
EAS Build ile geliştirme derlemesi almayı kur:
- eas.json yapılandırması (development, preview, production profilleri)
- app.json'da bundle identifier ve uygulama adının doğrulanması
- Android için ilk dev build'i alma adımlarını sırayla anlat

Expo Go'nun neden yetmediğini ve dev build'i telefonuma nasıl kuracağımı adım adım yaz.
Komutları tek tek çalıştır, hata varsa dur.
```

### Oturum 1.4 — Hata izleme

```
Sentry'yi kur ve yapılandır:
- Sadece production ve preview derlemelerinde aktif olsun, geliştirmede sussun
- DSN'i ortam değişkeninden oku, koda gömme
- Kaynak haritası yüklemesini derleme akışına bağla
Kurulumdan sonra kasıtlı bir hata fırlatıp Sentry'de göründüğünü doğrulayalım.
```

---

## FAZ 2 — Öğrenme Motoru (5-6 hafta)

### Oturum 2.1 — Seviye haritası ekranı

```
Önce plan çıkar, kod yazma:

Duolingo tarzı seviye haritası ekranı yapacağız.
- Dikey kaydırmalı, zikzak ilerleyen patika
- Her seviye bir daire buton: kilitli / açık / tamamlandı durumları
- Tamamlananlarda yıldız sayısı görünür
- Üniteler arası başlık ayırıcıları

Hangi dosyalar oluşacak, hangi bileşenler gerekecek, veri nereden gelecek?
```

Planı onayladıktan sonra:
```
Planı uygula. /content'teki örnek veriyle çalışsın, ilerleme kaydı henüz olmasın.
```

### Oturum 2.2 — Soru bileşenleri

Her soru tipini **ayrı oturumda**:

```
/features/learning/components altında MultipleChoiceQuestion bileşeni yap.
Props: question (Question tipinden), onAnswer callback.
- Seçenekler dikey liste, her biri dokunulabilir kart
- Seçildiğinde vurgulanır ama henüz doğru/yanlış gösterilmez
- Alt kısımda "Kontrol Et" butonu
İçerik yazma, sadece bileşen.
```

Aynı kalıpla sırayla: `TrueFalseQuestion`, `OrderingQuestion`, `FillBlankQuestion`, `ImageMatchQuestion`, `AudioChoiceQuestion`.

### Oturum 2.3 — Ders akışı ekranı

```
Önce plan çıkar:

/app/lesson/[id].tsx ders ekranı:
- Üstte ilerleme çubuğu ve kapat butonu
- Ortada soru bileşeni (tipe göre dinamik render)
- Cevap sonrası alt panel: doğru/yanlış geri bildirimi + açıklama + Devam
- Sonda seviye tamamlama ekranı: kazanılan XP, yıldız

Veri akışı ve state yönetimi nasıl olmalı?
```

### Oturum 2.4 — İlerleme kaydı

```
Zustand ile ilerleme store'u yap: /features/progress/store.ts
- Tamamlanan seviyeler, toplam XP, streak
- Kalıcı kayıt
- Seviye tamamlandığında sonraki seviyenin kilidini açan mantık

Kilit açma mantığı saf fonksiyon olsun ve birim testi yaz —
yanlış kilit kullanıcıyı tıkar, gözle fark edilmez.

Sadece store ve test, UI'a dokunma.
```

### Oturum 2.5 — Ses altyapısı

```
expo-audio ile ses çalma altyapısını kur: /features/learning/audio.ts
- Ses dosyaları pakete gömülmez; uzaktan indirilip cihazda önbelleğe alınır
- Dosya yoksa uygulama sessiz çalışır, hata vermez, ses butonu görünmez
- Dosya adlandırma düzenini belirle ve belgele

Ses dosyası ekleme, sadece altyapı.
```

### Oturum 2.6 — Seviye tespit sınavı

```
Önce plan çıkar:

İlk açılışta gösterilecek seviye tespit akışı:
- Karşılama ekranı
- "Ne kadar biliyorsun?" seçimi: Başlangıç / Temeller / İleri
- Seçime göre kısa test (5-8 soru)
- Sonuca göre öğrenme yolunda başlangıç noktası belirleme
- Kullanıcı istediğinde geri dönüp atlanan üniteleri açabilmeli

İlerleme modeli "test ile açıldı" ile "tamamlandı" durumlarını ayırt etmeli.
```

---

## FAZ 2.5 — Yayın Hazırlığı (1 hafta) → **v0.1 İLK YAYIN**

### Oturum 2.5.1 — Yer tutucu taraması

```
Tüm projede ve /content altında yayına kaçmaması gereken işaretleri tara:
ÖRNEK, TODO, GERÇEK DEĞİL, placeholder, lorem.
Bulduklarını dosya ve satır numarasıyla listele. Düzeltme yapma, sadece rapor et.
```

### Oturum 2.5.2 — OTA güncelleme

```
expo-updates'i kur ve yapılandır:
- Kanal yapısı: preview ve production
- Güncellemenin ne zaman kontrol edileceği ve uygulanacağı
- İçerik JSON'u güncellendiğinde eas update ile nasıl yayınlanacağını belgele

Kurulumdan sonra bir OTA güncellemesi deneyip cihazda göründüğünü doğrulayalım.
```

### Oturum 2.5.3 — Mağaza materyalleri

```
Mağaza yayını için gereken metinleri hazırla:
- Gizlilik politikası taslağı (uygulama hangi veriyi topluyor, nerede duruyor)
- Mağaza açıklaması (kısa ve uzun)
- Veri güvenliği formu için hangi soruya ne cevap verileceği

Dini içerik ÜRETME — bunlar ürün metinleri, dini metin değil.
Gizlilik politikasının hukuki gözden geçirme gerektirdiğini not düş.
```

Sonra elle: ikon, ekran görüntüleri, yaş derecelendirmesi, TestFlight / Internal Testing dağıtımı.

---

## FAZ 3 — Oyunlaştırma (3-4 hafta) → v0.2

### Oturum 3.1 — Streak sistemi
```
/features/progress altında streak (seri) mantığını yaz.
- Günlük aktivite kaydı, SQLite'ta tarih bazlı
- Tablolarda updatedAt ve deletedAt alanları olsun (Faz 7 senkronizasyonu için)
- Ardışık gün hesabı
- Gün atlanınca sıfırlanma
- "Seri dondurma" hakkı (haftada 1)

Hesap mantığı saf fonksiyon olsun ve birim testi yaz:
gün dönümü, saat dilimi, dondurma hakkı, uzun boşluk senaryoları.

Sadece mantık ve test, UI sonra.
```

### Oturum 3.2 — Rozet sistemi
```
Rozet/başarım sistemi:
- /content/badges.json içinde rozet tanımları (id, isim, koşul tipi, eşik)
- Koşul kontrolcüsü: XP eşiği, seviye sayısı, streak günü, ünite tamamlama
- Kazanıldığında tetiklenecek olay
Rozet isimlerini ve açıklamalarını YER TUTUCU bırak, ben dolduracağım.
```

### Oturum 3.3 — Maskot ve kutlama
```
Seviye tamamlama kutlama ekranı:
- Lottie animasyonu için yer (dosyayı sonra ekleyeceğim)
- Kazanılan XP sayacı animasyonlu artsın
- Yıldız gösterimi sırayla belirsin
- Devam / Ana sayfa butonları
```

---

## FAZ 4 — Namaz Modülü (4-5 hafta) → v0.3

### Oturum 4.0 — Kaynak araştırması ⚠️ BLOKLAYICI

```
Namaz vakti veri kaynağını araştır ve rapor et. Kod yazma.

- Diyanet'in resmi bir public API'si var mı?
- Yoksa yıllık vakit verisine yasal olarak nasıl ulaşılır?
- Üçüncü parti API seçenekleri neler, kullanım şartları ve süreklilik riski ne?
- Her seçenek için: erişim yöntemi, şartlar, risk, uygulama maliyeti

Sonunda bir öneri sun. Bu araştırmanın sonucu Faz 4'ün tasarımını belirleyecek.
```

### Oturum 4.1 — Vakit veri katmanı
```
Önce plan çıkar (4.0'ın sonucuna göre):
- Şehir/ilçe seçimi
- Yıllık vakit verisinin yerelde saklanması (SQLite, updatedAt/deletedAt ile)
- Konumdan en yakın ilçeyi bulma
- Yurt dışı için yedek: adhan-js hesaplaması

Veri modeli ve akış nasıl olmalı?
```

### Oturum 4.2 — Vakit ekranı
```
Namaz sekmesi ana ekranı:
- Bir sonraki vakit ve geri sayım (büyük, merkezde)
- 5 vaktin listesi, geçmiş olanlar soluk
- Tarih ve hicri tarih

Geri sayım ve "sıradaki vakit" hesabı saf fonksiyon olsun ve birim testi yaz:
gün dönümü, yatsı sonrası, saat dilimi değişimi.
```

### Oturum 4.3 — Namaz çizelgesi
```
Önce plan çıkar:

Namaz takip çizelgesi:
- Günlük 5 vakit için 3 durum: kıldım / kılmadım / kaza
- Haftalık ızgara görünümü
- Aylık takvim görünümü
- SQLite'ta saklama (updatedAt/deletedAt ile)

ÖNEMLİ TASARIM KURALI: Dil teşvik edici ve affedici olmalı.
"Kaçırdın", "başarısız", "seri bozuldu" gibi suçlayıcı ifadeler KULLANMA.
```

### Oturum 4.4 — Bildirimler
```
expo-notifications ile namaz vakti hatırlatıcı:
- Her vakit için ayrı açma/kapama
- Zamanlama: vaktin girişinde / X dk sonra
- Bildirim metinleri yumuşak ve teşvik edici tonda
- Uygulama kapalıyken de çalışacak şekilde zamanla
```

### Oturum 4.5 — Kıble pusulası
```
expo-sensors ile kıble yönü pusulası:
- Manyetometre okuması
- Konumdan Kabe'ye yön hesabı
- Dönen pusula arayüzü
- Kalibrasyon uyarısı
```

---

## FAZ 5 — Kur'an Modülü (5-6 hafta) → v0.4

> ⚠️ Bu faza başlamadan önce meal telif durumunu netleştirmiş olmalısın.

### Oturum 5.1 — Veri yapısı
```
Kur'an veri katmanı planı çıkar:
- Sure ve ayet veri modeli
- Arapça metin + meal + transkripsiyon alanları
- Yer imi (kaldığın yer) kaydı
- Okuma geçmişi (hangi gün ne kadar)
```

### Oturum 5.2 — Okuma ekranı
```
Kur'an okuma arayüzü:
- Sure seçimi
- Ayet ayet gösterim, Arapça sağdan sola
- Meal açma/kapama
- Font boyutu ayarı
- Kaldığın yeri otomatik kaydet
```

### Oturum 5.3 — Hedef sistemi
```
Kur'an okuma hedefleri:
- Hedef tipleri: günde X sayfa / ayda X cüz / X tarihine kadar hatim
- İlerleme yüzdesi ve tahmini bitiş tarihi
- Günlük hatırlatma
- Görsel ilerleme (cüz bazlı ızgara)

Tarih ve hedef hesapları saf fonksiyon olsun, birim testi yaz.
```

---

## FAZ 6 — Mini Oyunlar (4-5 hafta) → v0.5

Her oyun ayrı oturum:
```
/features/games altında "Sıralama Yarışı" mini oyunu:
- Karışık verilen adımları süreye karşı doğru sıraya diz
- İçerik /content/games/ altından JSON olarak gelsin
- 60 saniye süre, doğru sıralama = puan
- Oyun sonu ekranı

İçerik yazma, örnek veri yer tutucu olsun.
```

---

## FAZ 7 — Hesap ve Senkronizasyon (3-4 hafta) → v1.0

```
Supabase entegrasyonu planı çıkar:
- E-posta ile giriş/kayıt
- Mevcut yerel verinin buluta taşınması
- İki yönlü senkronizasyon, çakışma çözümü (updatedAt/deletedAt zaten var)
- Çevrimdışı öncelikli çalışma (offline-first)

ÖNEMLİ: Namaz verisi hassas kişisel veridir.
Sosyal paylaşım, liderlik tablosu YOK.
```

---

## FAZ 8+ — Park Edilenler

- **Hafızlık çizelgesi** — ezberlenen sure/cüz takibi, tekrar programı, unutma eğrisine göre hatırlatma
- Çoklu dil desteği
- Aile hesabı / ebeveyn paneli
- Sosyal özellikler (dikkatli tasarlanmalı)

---

# BÖLÜM 3 — Her Oturum İçin Kontrol Listesi

Yeni bir oturuma başlarken:
1. [ ] Önceki işle ilgisiz mi? → `/clear`
2. [ ] Doğru model seçili mi? → `/model`
3. [ ] Değiştirilecek dosyayı @ ile belirttim mi?
4. [ ] İstek tek bir işe odaklı mı?
5. [ ] Büyük bir iş mi? → önce plan iste

Oturum sırasında:
6. [ ] Her değişikliği okuyup onaylıyor muyum?
7. [ ] Context doluyor mu? → `/compact`

Oturum sonunda:
8. [ ] Uygulamayı çalıştırıp test ettim mi?
9. [ ] `npx tsc --noEmit` temiz mi?
10. [ ] Git commit attım mı?
11. [ ] CLAUDE.md'deki "Şu Anki Faz" bölümünü güncellemem gerekiyor mu?
