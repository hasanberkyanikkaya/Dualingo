# OTA Güncelleme — `expo-updates`

Bu belge, uygulamanın **mağazasız güncelleme** düzenini tarif eder: ne
güncellenebilir, ne güncellenemez, hangi komutla yayınlanır ve kullanıcının
cihazında ne zaman uygulanır.

Mimari kural 7'nin ayakta durduğu yer burasıdır: *"İçerik gömülü, güncellemesi
OTA."* Ders JSON'ları pakete gömülür (çevrimdışı çalışsın diye), düzeltmesi
mağaza incelemesi beklemeden gider.

> ⚠️ **Bu yapılandırma HENÜZ DOĞRULANMADI.** OTA Expo Go'da hiç çalışmaz;
> gerçek bir güncellemenin cihaza indiğini görmek **dev build** ister
> (Faz 1.3, ertelendi — gerekçesi `Planlamalar/KARAR_GECMISI.md` içindeki
> "Dev Build Borcu" bölümünde). Aşağıdaki
> her şey yapılandırılmış ama **hiçbiri çalıştırılmamıştır.**

---

## 1. Ne güncellenir, ne güncellenmez

`expo-updates` yalnızca **JavaScript paketini ve varlıkları** değiştirir.

| Değişiklik | OTA yeter mi |
| --- | --- |
| Ders içeriği (`/content/**.json`), metin, soru, sıralama | ✅ Evet |
| Arayüz, bileşen, iş mantığı, hata düzeltmesi | ✅ Evet |
| Görsel/font gibi pakete gömülü varlıklar | ✅ Evet |
| Yeni yerel modül (`expo-sensors`, Sentry, MMKV…) | ❌ Hayır — yeni derleme |
| `app.json`'daki izin, ikon, splash, bundle kimliği | ❌ Hayır — yeni derleme |
| SDK yükseltmesi | ❌ Hayır — yeni derleme |

**Ses dosyaları bu tablonun DIŞINDA.** Onlar pakete hiç girmiyor; `audio.ts`
uzaktan indirip cihazda önbelleğe alıyor. Yeni bir ses yayınlamak OTA
gerektirmez, CDN'e dosya koymak yeterlidir (bkz. `features/learning/audioKey.ts`).

---

## 2. Kanal yapısı

Kanallar `eas.json`'da zaten tanımlıydı; OTA onları ilk kez gerçekten kullanıyor.

| Kanal | Derleme profili | Kim kullanır |
| --- | --- | --- |
| `development` | `development` (dev client, APK) | Geliştirme cihazı |
| `preview` | `preview` (dahili dağıtım, APK) | Test edenler, TestFlight öncesi |
| `production` | `production` (app-bundle) | Mağazadaki kullanıcılar |

Bir derleme **hangi kanalla üretildiyse ömrü boyunca o kanalı dinler.** Kanal
bir dala değil, bir *izleyici kitlesine* karşılık gelir.

---

## 3. Çalışma anı politikası — bilinçli olarak sessiz

`app.json`:

```json
"updates": {
  "url": "https://u.expo.dev/cd757927-032e-41ff-ad6a-8d3269d0d057",
  "fallbackToCacheTimeout": 0,
  "checkAutomatically": "ON_LOAD"
},
"runtimeVersion": { "policy": "fingerprint" }
```

**`fallbackToCacheTimeout: 0` — açılış hiçbir zaman beklemez.** Uygulama
elindeki paketle hemen açılır, güncellemeyi arka planda indirir ve **bir sonraki
açılışta** uygular.

Alternatif (birkaç saniye bekleyip yeni sürümle açmak) bilerek elendi: bu bir
ders uygulaması, kullanıcı onu boş bir dakikasında açıyor ve açılıştaki her
saniye doğrudan kayıp. Güncellenen şey ders metni; bir oturum gecikmesi kimseyi
yaralamaz.

**Kodda `expo-updates` çağrısı YOK ve bu da bilinçli.** "Güncelleme hazır,
yeniden başlat" düğmesi (`Updates.reloadAsync()`) eklenmedi, çünkü ders
ortasında yeniden başlatmak oturumu siler: `useReducer` ile tutulan ders durumu
kalıcı değil (Oturum 2.3 kararı) ve kullanıcı cevapladığı soruları kaybeder.
Gerekirse eklenecek yer bellidir — ders **dışındaki** bir ekran, ders akışı değil.

**`runtimeVersion` politikası `fingerprint`.** Yerel bağımlılıkların parmak
izinden hesaplanır: içerik/JS değişince aynı kalır, yeni bir yerel modül girince
kendiliğinden değişir. `appVersion` politikası elendi — orada `version` alanını
elle yükseltmek unutulabilir ve **uyumsuz bir OTA eski bir ikiliye düşerek
uygulamayı açılmaz hâle getirebilir.** Parmak izi bu hatayı yapısal olarak
imkânsız kılıyor.

---

## 4. İçerik güncellemesi yayınlama

```bash
# 0. Önce denetim — yer tutucu ve yapısal hata yayına kaçmasın
npm run check:content
npm test
npx tsc --noEmit

# 1. Test kitlesine
eas update --channel preview --message "Ünite 3 soru metinleri düzeltildi"

# 2. Cihazda doğrula: uygulamayı tamamen kapat, iki kez aç
#    (ilk açılış indirir, ikinci açılış uygular)

# 3. Yayına
eas update --channel production --message "Ünite 3 soru metinleri düzeltildi"
```

`--message` isteğe bağlı değil sayılmalı: `expo.dev` panosunda bir güncellemeyi
geri almak gerektiğinde okunacak tek şey odur.

**Geri alma:** yeni bir güncelleme yayınlamak yerine önceki güncellemeyi tekrar
yayına al —

```bash
eas update:list --branch production      # yayınlanmışları gör
eas update:republish --group <GROUP_ID>  # eskisini geri getir
```

---

## 5. Dev build alındığı gün yapılacak doğrulama

`Planlamalar/KARAR_GECMISI.md` içindeki "Dev Build Borcu" listesinin OTA maddesi
bu adımlarla kapanır:

1. `eas build --profile preview --platform android`
2. Derlemeyi cihaza kur, aç, kapat.
3. Bir ders metnini görünür biçimde değiştir (örneğin bir başlığa `TEST` ekle).
4. `eas update --channel preview --message "OTA denemesi"`
5. Uygulamayı **tamamen kapat**, aç (indirir), **tekrar kapat**, aç (uygular).
6. Değişikliğin göründüğünü doğrula, sonra `TEST`i geri al ve yeniden yayınla.

Beşinci adımdaki iki kapanış politika gereğidir, hata değil — `fallbackToCacheTimeout: 0`
güncellemeyi bir sonraki açılışa bırakır. Tek kapanışta görünmemesi **beklenen**
davranıştır; buna bakıp "OTA çalışmıyor" denmemelidir.
