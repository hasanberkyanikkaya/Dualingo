# Gizlilik Politikası — TASLAK

> # ⚠️ BU BİR TASLAKTIR — YAYINDAN ÖNCE HUKUKİ İNCELEME ŞARTTIR
>
> Bu metin, uygulamanın **kodundan çıkarılmış teknik gerçeğe** dayanarak
> yazılmıştır; hukuki bir görüş değildir ve bir avukat tarafından
> yazılmamıştır. Yayına girmeden önce bir hukuk uzmanı tarafından
> incelenmeli ve onaylanmalıdır. Belgenin sonundaki
> "Hukukçuya sorulacaklar" bölümü, incelemeye başlanacak yeri gösterir.

> ⚠️ **Markdown dosyası tek başına yeterli DEĞİL.** App Store ve Google Play,
> gizlilik politikasının **herkese açık, kalıcı bir URL'de** barındırılmasını
> şart koşar. Bu metnin bir web sayfası olarak yayınlanması gerekir
> (`{POLİTİKA_URL}`).

## Yer tutucular

Bu belgedeki yer tutucular yayından önce tek geçişte doldurulur:

| Yer tutucu | Bugünkü değer | Not |
| --- | --- | --- |
| `{APP_NAME}` | **Dualingo** | ⚠️ **Geçici.** Marka riski var, bkz. `README.md` |
| `{YAYINCI_ADI}` | — | Mağaza hesabında görünecek yayıncı adı |
| `{İLETİŞİM_EPOSTA}` | — | ⚠️ Mağaza sayfasında **herkese açık** görünür |
| `{POLİTİKA_URL}` | — | Bu metnin yayınlanacağı adres |
| `{YÜRÜRLÜK_TARİHİ}` | — | Yayın günü |

---

# {APP_NAME} Gizlilik Politikası

**Yürürlük tarihi:** {YÜRÜRLÜK_TARİHİ}
**Yayıncı:** {YAYINCI_ADI}
**İletişim:** {İLETİŞİM_EPOSTA}

{APP_NAME}, kişisel verilerinizi toplamadan çalışacak şekilde tasarlanmıştır.
Bu politika, uygulamanın hangi bilgileri işlediğini ve bu bilgilerin nerede
durduğunu açıklar.

## 1. Toplamadığımız bilgiler

{APP_NAME} aşağıdakilerin **hiçbirini toplamaz, istemez ve saklamaz**:

- Ad, soyad, kullanıcı adı
- E-posta adresi, telefon numarası
- Doğum tarihi, yaş, cinsiyet
- Rehber, fotoğraf, dosya veya takvim erişimi
- Ses veya görüntü kaydı
- Reklam kimliği veya benzersiz cihaz tanımlayıcısı
- Ödeme bilgisi

Uygulamada **hesap açma veya giriş yapma yoktur.** Uygulamayı kullanmak için
kaydolmanız gerekmez.

## 2. Cihazınızda saklanan bilgiler

Öğrenme ilerlemeniz **yalnızca kendi cihazınızda** saklanır. Bu bilgiler bize
veya başka bir tarafa **gönderilmez**. Saklanan veriler şunlardır:

| Veri | Ne işe yarar |
| --- | --- |
| Toplam XP puanı | İlerlemenizi göstermek |
| Tamamlanan seviyeler; her seviye için yıldız, en iyi doğruluk oranı, deneme sayısı ve tarih | Öğrenme haritasında nerede olduğunuzu göstermek |
| Günlük seri bilgisi (süregelen gün sayısı, en uzun seri, son etkin gün) | Düzenli çalışmayı takip etmek |
| Seviye tespit sınavı sonucu (belirlenen kademe, sizin beyanınız, doğruluk oranı) | Size uygun noktadan başlatmak |
| Günlük hedef tercihi | Hedef takibi |
| Seçtiğiniz il ve ilçe | Namaz vakitlerini doğru yere göre göstermek |
| İndirilmiş namaz vakti tablosu (yaklaşık bir aylık) | Vakitleri internet olmadan da gösterebilmek |
| Kıldığınızı işaretlediğiniz namaz vakitleri (tarih + vakit adı) | Günlük namaz çizelgenizi göstermek |

Bu veriler cihazın kendi güvenli uygulama alanında tutulur ve yalnızca
{APP_NAME} tarafından okunabilir.

## 3. İnternet bağlantısı — cihazdan çıkan tek trafik

Uygulama çevrimdışı çalışacak şekilde tasarlanmıştır. Ders içeriği uygulamanın
içinde gömülü gelir. İnternete yalnızca aşağıdaki üç durumda bağlanılır:

**a) Güncelleme kontrolü.** Uygulama açıldığında, ders içeriğinde veya
uygulamada bir düzeltme yayınlanıp yayınlanmadığını kontrol etmek için Expo
(EAS Update) güncelleme sunucusuna bağlanır. Bu istekte kişisel veriniz
gönderilmez; teknik olarak karşı tarafa IP adresiniz, cihaz platformunuz
(iOS/Android) ve uygulamanın sürüm bilgisi ulaşır. İlerleme verileriniz bu
isteğe **dahil edilmez**.

**b) Ders sesleri.** Bazı sorular sesli okuma içerir. Ses dosyaları uygulamanın
içinde gelmez; ihtiyaç duyulduğunda bir içerik sunucusundan indirilir ve
cihazınızda geçici olarak saklanır. Bu istekte de kişisel veriniz gönderilmez.

> ℹ️ **Bu sürümde ses indirme fiilen kapalıdır.** Ses sunucusu adresi henüz
> tanımlanmamıştır; uygulama bu sürümde ses için hiçbir ağ isteği yapmaz.
> Sorular yazılı karşılıklarıyla çalışır. Bu madde, özellik açıldığında
> geçerli olacak durumu tarif eder.

**c) Namaz vakitleri.** Namaz sekmesini kullandığınızda, seçtiğiniz ilçenin
vakitlerini indirmek için `ezanvakti.emushaf.net` adresine bağlanılır. Bu
istekte gönderilen tek bilgi **seçtiğiniz ilçenin numarasıdır**; adınız,
kimliğiniz veya öğrenme ilerlemeniz gönderilmez. İndirilen tablo yaklaşık bir
aylık olduğu için bu istek seyrek yapılır (kalan gün sayısı azaldığında), ve
arada uygulama vakitleri **internetsiz** gösterir.

## 3b. Konum izni — isteğe bağlı

Namaz vakitleri **ilçe seçimine** göre gösterilir ve ilçeyi listeden elle
seçebilirsiniz. Konum izni **zorunlu değildir**; uygulama izin istemeden de tam
olarak çalışır.

"Konumumdan bul" seçeneğini kullanırsanız:

- Cihazınızın konumu **düşük hassasiyetle** ve **yalnızca o an** okunur.
- Konum, bulunduğunuz ilçenin adına çevrilmek üzere **cihazınızın işletim
  sisteminin coğrafi kodlama servisine** verilir. iOS'ta bu işlem Apple'ın
  sunucusunda, Android'de cihaz üzerinde yapılır.
- Konumunuz **bizim sunucumuza gönderilmez**, `ezanvakti.emushaf.net`'e
  gönderilmez ve cihazınızda **saklanmaz**.
- Saklanan tek şey, bulunan ilçeyi **onaylamanız durumunda** o ilçenin
  seçiminizdir.

Bunların dışında uygulama **hiçbir sunucuya bağlanmaz.**

## 4. Üçüncü taraflar

- **Expo (EAS Update)** — yalnızca yukarıda anlatılan güncelleme kontrolü için.
- **İçerik sunucusu** — yalnızca ders seslerini indirmek için (bu sürümde kapalı).
- **ezanvakti.emushaf.net** — yalnızca seçtiğiniz ilçenin namaz vakti tablosunu
  indirmek için. Bu servis, Diyanet İşleri Başkanlığı'nın yayınladığı vakitleri
  yeniden sunan bağımsız bir üçüncü taraftır; uygulamamız Diyanet İşleri
  Başkanlığı'na ait değildir ve kurumla bir bağlantısı yoktur.
- **Apple (iOS'ta konum → adres çevirimi)** — yalnızca "Konumumdan bul"
  seçeneğini kullanırsanız.

Uygulamada **reklam ağı yoktur, analitik/ölçümleme aracı yoktur, sosyal medya
takip kodu yoktur, çerez kullanılmaz.** Verileriniz hiç kimseye satılmaz,
kiralanmaz veya pazarlama amacıyla paylaşılmaz.

## 5. Çocuklar

{APP_NAME}'in yaş sınırı yoktur ve her yaştan kullanıcıya açıktır. Uygulama
hiçbir kullanıcıdan kişisel veri toplamadığı için, çocuklardan da kişisel veri
toplamaz. Hesap, mesajlaşma, kullanıcı içeriği paylaşımı veya başka
kullanıcılarla etkileşim özelliği yoktur.

## 6. Haklarınız ve verinizi silmek

Verilerinizin tamamı cihazınızda olduğu için kontrol tamamen sizdedir:

- **Uygulamayı silmek, sakladığı tüm verileri de siler.** Ayrıca bir talep
  göndermenize gerek yoktur.
- Uygulama içinden **ilerlemeyi sıfırlayabilirsiniz**; bu işlem XP, seviye,
  seri ve seviye tespit sonucunuzu kalıcı olarak siler.

Elimizde sizinle ilişkilendirilebilecek bir veri bulunmadığı için, bize
gönderilecek bir erişim veya silme talebiyle karşılığı olan bir kayıt
bulunmamaktadır.

## 7. Güvenlik

İlerleme veriniz cihazdan çıkmadığı için ağ üzerinde ele geçirilme riski
taşımaz. Güncelleme ve ses indirme istekleri şifreli bağlantı (HTTPS)
üzerinden yapılır.

## 8. Bu politikadaki değişiklikler

Uygulamaya yeni bir özellik eklendiğinde (örneğin namaz vakti hatırlatıcıları
veya bulut yedekleme) bu politika güncellenir ve yürürlük tarihi değiştirilir.
Güncel metin her zaman {POLİTİKA_URL} adresinde yayınlanır.

## 9. İletişim

Sorularınız için: {İLETİŞİM_EPOSTA}

---

# Hukukçuya sorulacaklar

⚠️ Aşağıdaki maddeler bilinçli olarak **cevaplanmadan bırakılmıştır.** Metin
teknik gerçeği doğru anlatıyor; bu maddeler o gerçeğin hukuki karşılığıdır ve
uzman görüşü ister.

1. **KVKK aydınlatma metni.** İlk pazar Türkiye. Kişisel veri "toplanmıyor"
   olması KVKK kapsamında ayrı bir aydınlatma metni gerekliliğini ortadan
   kaldırıyor mu? Veri sorumlusu kaydı (VERBİS) gerekiyor mu?
2. **IP adresinin durumu.** Güncelleme sunucusuna ulaşan IP adresi, KVKK ve
   GDPR kapsamında kişisel veri sayılıyor. Bu isteği biz yapmıyoruz, uygulamanın
   güncelleme altyapısı yapıyor. Politikada "toplamıyoruz" demek doğru mu, yoksa
   ayrı bir başlık mı açılmalı? ⚠️ **Aynı soru mağaza formlarında da karşımıza
   çıkıyor** — bkz. `VERI_GUVENLIGI_FORMU.md`.
3. **Expo'nun veri işleme şartları.** Üçüncü taraf olarak Expo'nun kendi
   sözleşmesine atıf yapılmalı mı, bağlantı verilmeli mi?
4. **Çocuk kullanıcılar.** Yaş sınırı olmayan bir uygulama için COPPA (ABD) ve
   GDPR-K hükümleri; Türkiye dışına açılırsa ne değişir?
5. **Yaş derecelendirmesi ile tutarlılık.** Mağaza yaş derecelendirme anketinde
   verilecek cevaplar bu metinle çelişmemeli.
6. **Dini içerik.** Uygulama dini eğitim içeriği sunuyor. Bu, "özel nitelikli
   kişisel veri" (din/inanç) kapsamında bir yükümlülük doğurur mu? Kullanıcının
   dini hakkında bir veri toplanmıyor, ancak uygulamayı indirmiş olmanın kendisi
   böyle bir çıkarıma açık mı?
7. **Yayıncı kimliği.** Şahıs olarak mı, şirket olarak mı yayınlanacak? Mağazada
   görünecek yayıncı adı ve iletişim adresi buna göre değişir.

⚠️ **Faz 4.1 ile eklenen üç yeni madde:**

8. **Konumun hukuki durumu.** Konum tek seferlik okunuyor, ilçe adına
   çevriliyor ve **saklanmıyor**; saklanan tek şey kullanıcının onayladığı ilçe
   kimliği. KVKK/GDPR açısından bu "konum verisi işleme" sayılır mı, yoksa
   saklanmayan anlık bir işlem olarak mı değerlendirilir? Açık rıza metni
   gerekiyor mu, yoksa işletim sisteminin izin diyaloğu yeterli mi?
9. **iOS'ta konumun Apple'a gitmesi.** `reverseGeocodeAsync` iOS'ta koordinatı
   Apple'ın sunucusuna gönderiyor (CLGeocoder); bu bizim tercihimiz değil,
   platformun uygulaması. Politikada bunu açıklamak yeterli mi, yoksa Apple ayrı
   bir "üçüncü taraf veri işleyen" olarak mı listelenmeli?
10. **Diyanet'in verisinin yeniden kullanımı.** Vakitler
    `ezanvakti.emushaf.net` üzerinden alınıyor; bu servis Diyanet İşleri
    Başkanlığı'nın yayınladığı tabloları yeniden sunan **bağımsız bir üçüncü
    taraf** ve **yazılı bir kullanım şartı yayınlamıyor**. (a) Bu veriyi bir
    mobil uygulamada göstermek FSEK Ek m.8 (sui generis veritabanı hakkı)
    açısından risk taşır mı? (b) Ekranda kullandığımız atıf cümlesi —
    *"Diyanet İşleri Başkanlığı'nın yayınladığı vakitler"* — yeterli mi, yoksa
    kurum adını hiç anmamak mı gerekir? ⚠️ "Resmi" ve "onaylı" ifadeleri zaten
    hiçbir yerde kullanılmıyor. (c) Servis kapanırsa ya da şartlarını
    değiştirirse sorumluluğumuz ne olur?
