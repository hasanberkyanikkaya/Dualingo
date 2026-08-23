# Mağaza Materyalleri — giriş kapısı

Faz 2.5.3'te üretilen yayın metinleri burada. **Bu klasörde kod yok**, yalnızca
ürün metni ve kontrol listesi var.

| Dosya | Ne içerir |
| --- | --- |
| `GIZLILIK_POLITIKASI.md` | Gizlilik politikası **taslağı** + hukukçuya sorulacaklar |
| `MAGAZA_METINLERI.md` | Ad, alt başlık, kısa/uzun açıklama, anahtar kelimeler, sürüm notu |
| `VERI_GUVENLIGI_FORMU.md` | Play "Data safety" ve App Store "App Privacy" için önerilen cevaplar |

> ⚠️ **Gizlilik politikası bir taslaktır ve yayına girmeden önce hukuki
> incelemeden geçmelidir.** Bu, belgenin kendi ilk satırında da yazar.

---

## Yer tutucular — yayından önce tek geçişte doldurulur

| Yer tutucu | Bugünkü değer | Not |
| --- | --- | --- |
| `{APP_NAME}` | **Dualingo** | ⚠️ Geçici; marka riski aşağıda |
| `{YAYINCI_ADI}` | — | Mağazada görünecek yayıncı |
| `{İLETİŞİM_EPOSTA}` | — | ⚠️ Mağaza sayfasında herkese açık görünür |
| `{POLİTİKA_URL}` | — | Politikanın yayınlanacağı adres |
| `{YÜRÜRLÜK_TARİHİ}` | — | Yayın günü |

Unutulmuş yer tutucu kalmadığını doğrulamak için:

```bash
grep -rhoP "\{[A-ZÇĞİÖŞÜ_]+\}" Planlamalar/Magaza/ | sort | uniq -c
```

Çıktıda yalnızca yukarıdaki beş ad görünmelidir.

Metin uzunluklarını yeniden ölçmek için (`MAGAZA_METINLERI.md` içindeki
kod bloklarını sayar):

```bash
node -e "const f=require('fs');let i=0,b=[],h='',L='';for(const l of f.readFileSync('Planlamalar/Magaza/MAGAZA_METINLERI.md','utf8').split(/\r?\n/)){if(/^#{2,3} /.test(l))L=l.replace(/^#+ /,'');if(l.trim()==='\`\`\`'){if(i){console.log(String([...b.join('\n')].length).padStart(5),'|',h);b=[];i=0}else{i=1;h=L}continue}if(i)b.push(l)}"
```

---

## ⛔ Yayın engelleri — metinle çözülemeyenler

Bu maddeler kapanmadan v0.1 yayınlanamaz. Hiçbiri bu oturumda çözülemezdi.

1. **İçeriğin tamamı örnek veri.** `/content` altındaki dört dosyanın dördü de
   `isSampleData: true` ve `"ÖRNEK VERİ — GERÇEK DEĞİL"` işaretini taşıyor;
   19 yerde `TODO` bekliyor. Tam döküm: Faz 2.5.1 yer tutucu tarama raporu.
   Doğrulama komutu: `npm run check:content`.
   ⚠️ **Bu bir içerik işidir, kod işi değil** — dini içeriği insan uzman yazar.
2. ✅ **ÇÖZÜLDÜ (Oturum 4.1) — kullanılmayan izinler temizlendi.**
   `app.json` izin listesi tek maddeye indi (`ACCESS_COARSE_LOCATION`) ve o da
   artık gerçek bir özelliğe dayanıyor ("Konumumdan bul"). `ACCESS_FINE_LOCATION`,
   `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` ve iki `FOREGROUND_SERVICE*` izni
   kaldırıldı; iOS konum izin metni yeniden yazıldı.
   ⚠️ **Kalan iki iş:** (a) `ACCESS_FINE_LOCATION`'ın gerçekten düştüğü
   `npx expo prebuild` çıktısındaki birleşik manifestte **doğrulanmalı** —
   `expo-location` eklentisi onu geri birleştirebilir.
   ✅ **(b) ÇÖZÜLDÜ (Oturum 4.4):** `expo-notifications` eklentisi artık
   gerçekten kullanılıyor — namaz vakti hatırlatmaları. Bildirilmiş ama
   kullanılmayan yetenek kalmadı. ⚠️ Yalnızca **yerel zamanlanmış** bildirim;
   push jetonu alınmıyor, yani veri güvenliği formu değişmiyor.
   Ayrıntı: `VERI_GUVENLIGI_FORMU.md` Bölüm 3.
3. **Uygulama ikonu ve açılış ekranı hâlâ Expo şablonundan.**
   `assets/images/icon.png` ve `splash-icon.png` şablon dosyaları
   (`splash-icon.png`, `expo-logo.png` ile aynı dosya). Maskot
   (`assets/images/mascot.png`) hazır ama ikona hiç uygulanmadı.
4. **Hata izleme yok.** `@sentry/react-native` kurulu değil (Faz 1.4). Yayında
   çöken bir uygulamadan haber alınamaz.
5. **Dev build alınmadı** (Faz 1.3). Kalıcı ilerleme (MMKV), OTA ve bildirimler
   gerçek cihazda **hiç doğrulanmadı**. Ayrıntı:
   `Planlamalar/KARAR_GECMISI.md` → "Dev Build Borcu".
   ⚠️ Bugünkü Expo Go'da ilerleme **uygulama kapanınca sıfırlanıyor**; bu hâliyle
   yayınlanamaz.
6. **Mağaza hesapları açılmadı.** Apple Developer Program ($99/yıl) ve Google
   Play Console ($25 tek seferlik) — `Planlamalar/Yapılacaklar.txt:9-10`,
   ikisi de hâlâ açık.
7. **Uygulama adı riski.** "Dualingo" ↔ "Duolingo" benzerliği; inceleme ve marka
   itirazı riski. Karar yayından önce verilmeli — `MAGAZA_METINLERI.md`.

---

## ✋ Elle yapılacaklar (kod işi değil)

### 1. Uygulama ikonu

- Kaynak: `assets/images/mascot.png` (aksolotl maskot)
- iOS: 1024×1024 PNG, **şeffaflık yok, yuvarlatılmış köşe yok** — Apple kendisi
  yuvarlatır
- Android adaptif ikon: ön plan + zemin ayrı. Zemin rengi `app.json:18`'de
  zaten palete çekilmiş (`#FFE1EC`)
- ⚠️ Play ayrıca **512×512 mağaza ikonu** ister (uygulama içindekinden ayrı)
- Değiştirilecek dosyalar: `assets/images/icon.png`,
  `assets/images/splash-icon.png`, `assets/images/android-icon-*.png`

### 2. Ekran görüntüleri

⚠️ **Boyut listeleri değişiyor** — güncel listeyi App Store Connect ve Play
Console panelinden doğrula. Bugünkü kabaca gereksinim:

- **App Store:** en büyük iPhone boyutu zorunlu; diğerleri ondan türetiliyor.
  ⚠️ `app.json:12` → `supportsTablet: true` olduğu için **iPad ekran
  görüntüleri de zorunlu.** Tablet desteği verilmeyecekse o satır kaldırılmalı —
  yoksa iPad'de test edilmemiş bir arayüz incelemeye gider.
- **Google Play:** en az 2 telefon görüntüsü + **1024×500 öne çıkan grafik**
  (feature graphic) zorunlu. Tablet ekran görüntüsü, tablet desteği
  bildiriliyorsa istenir.

Gösterilmesi anlamlı ekranlar: seviye haritası, bir ders sorusu, doğru/yanlış
geri bildirim paneli, ders sonu (yıldız + XP), seviye tespiti karşılama akışı.
⚠️ **Ekran görüntüsünde `ÖRNEK SORU 1` görünmemeli** — gerçek içerik girmeden
alınan görüntüler kullanılamaz. Bu, 1 numaralı yayın engeline bağlı.

### 3. Yaş derecelendirmesi

- Play tarafında **IARC anketi**, App Store tarafında Apple'ın kendi anketi.
- ⚠️ Anket **dini içerik / dini temalar** sorusunu içerir; bu uygulama için
  dürüst cevap verilecek yer burasıdır.
- ⚠️ Cevaplar `VERI_GUVENLIGI_FORMU.md` ve açıklama metniyle **tutarlı** olmalı.
- ⚠️ Play'de "çocuklar hedef kitle mi" sorusu ayrı bir politika zinciri
  (Families) açar — `VERI_GUVENLIGI_FORMU.md` Bölüm 1.2.

### 4. Test dağıtımı

- **iOS — TestFlight:** `eas build --profile preview --platform ios` →
  App Store Connect'e yükleme. ⚠️ Apple Developer hesabı gerektirir.
- **Android — Internal Testing:** `eas build --profile preview --platform android`
  → Play Console'da dahili test kanalı.
- ⚠️ `eas.json` `preview` profili **hazır ve kanalı tanımlı** (`preview`), yani
  OTA da bu derlemeye çalışır. Dev build borcundaki OTA doğrulaması
  (`Planlamalar/OTA_GUNCELLEME.md` §5) tam olarak bu derlemeyle kapanır —
  **iki iş tek derlemeyle görülür.**

---

## Kapsam dışı bırakılanlar

- **İngilizce yerelleştirme.** İlk pazar Türkiye; metinler Türkçe. Gerekirse
  ayrı oturum — mağaza panelinde her dil ayrı alan, kod değişikliği gerekmez.
- **Tanıtım videosu / mağaza grafikleri.** Zorunlu değil.
- **`app.json` izin temizliği.** ✅ Oturum 4.1'de yapıldı (yukarıdaki 2. madde).
- **Mağaza metinlerine namaz modülünün eklenmesi.** Faz 4.1 ile namaz vakitleri
  gerçek bir özellik oldu; `MAGAZA_METINLERI.md` henüz genişletilmedi ve
  uzunluk sınırları yeniden ölçülmeli. Kurallar o dosyanın başında yazılı —
  ⚠️ özellikle "Diyanet onaylı / resmi" ifadelerinin yasak olduğu.
