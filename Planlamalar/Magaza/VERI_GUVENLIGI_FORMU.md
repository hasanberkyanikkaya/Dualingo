# Veri Güvenliği / Veri Toplama Formları — Faz 7 taslağı

> ⚠️ Bu cevaplar hukuki görüş değildir. Google Play Data safety ve App Store
> App Privacy formları, gerçek Supabase projesi ve hizmet sağlayıcı sözleşmeleri
> incelendikten sonra hukukçu tarafından kesinleştirilmelidir.

## Teknik veri envanteri

| Veri | Hesapsız | Hesaplı | Bulut amacı |
| --- | --- | --- | --- |
| E-posta | Yok | Supabase Auth'a gider | Hesap ve giriş |
| Parola | Yok | Auth'a aktarılır; açık metin uygulama DB'sine yazılmaz | Kimlik doğrulama |
| XP, seviye, placement, hedef | Cihaz | Supabase'a gider | Yedekleme/senkron |
| Gün etkinliği, seri girdileri, rozet | Cihaz | Supabase'a gider | Yedekleme/senkron |
| Benzersiz ders denemesi | Cihaz | Supabase'a gider | Çakışmasız ilerleme |
| Kur'an konumu, okuma olayı, hedef | Cihaz | Supabase'a gider | Yedekleme/senkron |
| İşaretlenen namaz kayıtları | Cihaz | Yalnız ayrı onayla Supabase'a gider | İsteğe bağlı senkron |
| İl/ilçe ve vakit önbelleği | Cihaz | Cihazda kalır | Namaz vakti gösterimi |
| Bildirim ve arayüz tercihleri | Cihaz | Cihazda kalır | Yerel deneyim |
| Tek seferlik yaklaşık konum | Saklanmaz | Saklanmaz | İsteğe bağlı ilçe bulma |

Sosyal paylaşım, liderlik tablosu, reklam, analitik, satın alma, rehber,
fotoğraf, mikrofon kaydı, mesajlaşma ve push token yoktur.

## Google Play — önerilen yön

“Uygulama kullanıcı verisi topluyor mu?” sorusu artık **Evet** olmalıdır.
Hesap açan kullanıcının verisi cihaz dışına çıkar ve kullanıcı kimliğiyle
ilişkilendirilir.

| Kategori | Önerilen beyan | Amaç / not |
| --- | --- | --- |
| Kişisel bilgi → e-posta | Toplanır, paylaşılmaz | Hesap yönetimi |
| Uygulama etkinliği | Toplanır, paylaşılmaz | İlerleme ve bulut senkronu |
| Diğer kullanıcı tarafından oluşturulan içerik | Hukuki sınıflandırma gerekli | Kur'an/namaz işaretlemeleri |
| Konum | Hukuki sınıflandırma gerekli | Tek seferlik yaklaşık konum saklanmıyor; iOS Apple'a iletebilir |
| Cihaz/diğer kimlikler | Hukuki inceleme gerekli | Supabase/Expo ağ günlükleri ve IP |
| Tanılama | Hayır | Sentry henüz kurulu değil |

- Veri aktarımı HTTPS ile şifrelenir.
- Hesap açmak ve namaz senkronu isteğe bağlıdır.
- Uygulama içinde hesap silme bulunur; üretim Edge Function sonucu ayrıca
  sınanmalıdır.
- Veriler reklam, pazarlama veya uygulamalar arası takip için kullanılmaz.

“Paylaşma” tanımı açısından Supabase'ın yalnız hizmet sağlayıcı/veri işleyen mi,
yoksa mağaza formunda üçüncü taraf paylaşımı mı sayılacağı sözleşmeyle
kesinleştirilmelidir.

## App Store — önerilen yön

**Data Not Collected artık kullanılamaz.** En az aşağıdaki kategoriler gerçek
Supabase yapılandırmasına göre beyan edilmelidir:

- Contact Info → Email Address: kullanıcıyla ilişkilendirilmiş, App
  Functionality / Account Management.
- User Content veya App Activity: öğrenme, Kur'an ve isteğe bağlı namaz
  ilerlemesi; kullanıcıyla ilişkilendirilmiş, App Functionality.
- Tracking: Hayır. ATT izni istenmemelidir.
- Diagnostics: Sentry eklenmediği sürece Hayır.

Apple'ın tam kategori eşlemesi ve “optional disclosure” istisnaları hukukçu ve
App Store Connect formundaki güncel tanımlarla doğrulanmalıdır.

## Diğer ağ hizmetleri

1. Expo/EAS Update güncelleme kontrolü yapar.
2. `ezanvakti.emushaf.net` seçilen ilçe numarasıyla vakit tablosu döndürür.
3. iOS coğrafi kodlama isteğe bağlı konum kullanımında Apple hizmetine
   başvurabilir.
4. Ses sunucusu adresi bugün boştur; doldurulduğu gün envanter yenilenmelidir.

Her HTTP isteğinde hizmet sağlayıcı IP ve olağan teknik günlükleri görebilir.
Saklama süresi ve alt işleyenler yalnız koddan belirlenemez.

## İzinler

- Android yaklaşık konum izni, yalnız “Konumumdan bul” özelliği içindir.
- iOS izin metni aynı isteğe bağlı özelliği açıklar.
- Bildirimler yalnız yereldir; uzak push ve push token yoktur.
- Birleşik Android manifestinde gereksiz hassas konum/mikrofon/foreground
  service izinlerinin bulunmadığı release derlemede yeniden kontrol edilmelidir.

## Yayın öncesi kontrol listesi

- [ ] Gizlilik politikası hukukçu tarafından onaylandı ve kalıcı URL'de yayımlandı
- [ ] Supabase bölgesi, DPA, alt işleyenler, log ve yedek saklama süreleri incelendi
- [ ] Çocuk hedef kitlesi, yaş kapısı ve ebeveyn izni kararlaştırıldı
- [ ] Namaz verisi için ayrı onay metni hukuken yeterli bulundu
- [ ] Hesap silme bulut kayıtlarını ve yedek politikasını doğru yansıtıyor
- [ ] Google Play ve App Store kategorileri gerçek üretim sürümüyle eşleştirildi
- [ ] Sentry, push, reklam, satın alma veya yeni bir SDK eklenmediği doğrulandı
- [ ] Release manifest ve PrivacyInfo.xcprivacy çıktısı kontrol edildi
