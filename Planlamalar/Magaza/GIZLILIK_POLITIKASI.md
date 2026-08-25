# Gizlilik Politikası — TASLAK

> ⚠️ Bu belge hukuki görüş değildir. Faz 7 hesap ve bulut senkronizasyonu
> koduna göre güncellenmiştir; yayın öncesinde hukukçu incelemesi, mağaza
> formlarıyla karşılaştırma ve herkese açık kalıcı bir URL zorunludur.

## Yer tutucular

| Yer tutucu | Bugünkü değer |
| --- | --- |
| `{APP_NAME}` | Dualingo — geçici ad |
| `{YAYINCI_ADI}` | Doldurulacak |
| `{İLETİŞİM_EPOSTA}` | Doldurulacak |
| `{POLİTİKA_URL}` | Doldurulacak |
| `{YÜRÜRLÜK_TARİHİ}` | Doldurulacak |

# {APP_NAME} Gizlilik Politikası

**Yürürlük tarihi:** {YÜRÜRLÜK_TARİHİ}

**Yayıncı:** {YAYINCI_ADI}

**İletişim:** {İLETİŞİM_EPOSTA}

{APP_NAME}, hesap açmadan ve çevrimdışı kullanılabilir. İsteğe bağlı hesap
açarsanız seçtiğiniz uygulama verileri cihazlarınız arasında eşitlenir.

## 1. İşlenen veriler

Hesapsız kullanımda öğrenme, Kur'an ve namaz verileri cihazın uygulama alanında
saklanır. İsteğe bağlı hesap açıldığında:

- E-posta adresi ve kimlik doğrulama bilgileri Supabase Auth tarafından işlenir.
  Parolanın açık metni uygulama veritabanında saklanmaz.
- XP, seviye, seviye tespit sonucu, günlük hedef, seri girdileri, rozetler ve
  benzersiz ders denemeleri bulutla eşitlenir.
- Kur'an son okuma konumu, günlük okuma olayları ve okuma hedefi eşitlenir.
- İşaretlenen namaz kayıtları yalnız “Namaz kayıtlarını senkronize et” seçeneği
  ayrıca açılırsa eşitlenir. Bu seçenek kapalıyken kayıtlar cihazdan çıkmaz.

Ad-soyad, telefon, ödeme bilgisi, rehber, fotoğraf, dosya, ses/görüntü kaydı,
reklam kimliği veya kullanıcılar arası mesaj toplanmaz. Reklam, sosyal paylaşım
ve liderlik tablosu yoktur.

## 2. Yalnız cihazda kalan veriler

Seçilen il/ilçe, indirilen namaz vakti önbelleği, bildirim tercihleri, Kur'an
hatırlatma saati ve arayüz tercihleri bulut senkronuna dahil değildir. Yerel
bildirimler cihazın zamanlayıcısıyla çalışır; push token alınmaz.

“Konumumdan bul” kullanılırsa konum düşük hassasiyetle bir kez okunur ve ilçe
önerisine çevrilir. Koordinat uygulama veritabanında saklanmaz veya bizim
sunucumuza gönderilmez. iOS coğrafi kodlama için Apple hizmetini kullanabilir.

## 3. Ağ bağlantıları ve hizmet sağlayıcılar

- **Supabase:** isteğe bağlı hesap, kimlik doğrulama, bulut senkronizasyonu ve
  hesap silme. Hesapla eşitlenen veriler kullanıcı kimliğiyle ilişkilidir.
- **Expo / EAS Update:** uygulama ve içerik güncelleme kontrolü.
- **ezanvakti.emushaf.net:** seçilen ilçe numarasıyla namaz vakti indirme.
- **İçerik sunucusu:** ders sesi özelliği açıldığında ses dosyası indirme; bugün
  sunucu adresi boş olduğu için bu trafik kapalıdır.
- **Apple:** iOS'ta isteğe bağlı konumdan ilçe bulma sırasında coğrafi kodlama.

Bu hizmetlere yapılan ağ istekleri IP adresi, platform ve sürüm gibi olağan
teknik bilgileri hizmet sağlayıcıya gösterebilir. Veri satılmaz, kiralanmaz,
pazarlama veya uygulamalar arası takip için kullanılmaz.

## 4. İşleme amacı ve tercih

Veriler yalnız giriş, cihazlar arası yedekleme/eşitleme ve kullanıcının seçtiği
uygulama işlevlerini sunmak için işlenir. Hesap açmak zorunlu değildir. Namaz
kayıtlarının bulut aktarımı genel hesap senkronundan ayrı bir tercihtir ve
sonradan kapatılabilir. Tercihi kapatmak yeni aktarımı durdurur; önceden
aktarılmış verinin silinmesi için hesap silme veya destek talebi gerekir.

## 5. Saklama, silme ve kullanıcı hakları

- Hesapsız yerel veriler uygulama silindiğinde cihazdan kaldırılır.
- Çıkış yapıldığında ilgili hesabın bu cihazdaki uygulama verisi temizlenir;
  bulut kopyası hesapta kalır ve tekrar girişte geri alınabilir.
- Uygulamadaki “Hesabı sil” işlemi Auth hesabını ve ona bağlı senkron kayıtlarını
  silmek üzere tasarlanmıştır.
- Erişim, düzeltme, veri dışa aktarma veya silme talepleri
  `{İLETİŞİM_EPOSTA}` adresine gönderilebilir.

Yedeklerin silinme süresi, hesap silme işleminin üretim ortamındaki sonucu ve
yasal saklama istisnaları yayın öncesi kesin sürelerle bu bölüme eklenmelidir.

## 6. Güvenlik ve uluslararası aktarım

Ağ trafiği HTTPS kullanır; her kullanıcı yalnız kendi satırlarına erişecek RLS
politikalarıyla sınırlandırılır; mobil uygulamada yönetici anahtarı bulunmaz;
oturum belirteçleri işletim sisteminin güvenli depolama alanında tutulur.
Bulut verileri uçtan uca şifreli değildir. Supabase proje bölgesi, alt işleyenler
ve olası uluslararası aktarım yayın öncesi açıklanmalıdır.

## 7. Çocuklar

Uygulamanın yaş sınırı henüz kararlaştırılmamıştır. E-posta hesabı kişisel veri
işlediği için çocuklara yönelik dağıtım, ebeveyn izni ve yaş doğrulama yaklaşımı
hukuki inceleme tamamlanmadan hesap özelliği üretimde açılmamalıdır.

## 8. Değişiklikler ve iletişim

Politika değiştiğinde yürürlük tarihi güncellenir ve güncel metin
`{POLİTİKA_URL}` adresinde yayımlanır. Sorular için:
`{İLETİŞİM_EPOSTA}`.

## Hukukçuya sorulacaklar

1. Türkiye ilk pazarı için KVKK aydınlatma/açık rıza, VERBİS ve veri sorumlusu
   yükümlülükleri nelerdir?
2. Namaz takibi ve uygulama kullanımının din/inanç çıkarımı oluşturması özel
   nitelikli veri sayılır mı; ayrı anahtar yeterli midir?
3. Çocuk hedef kitlesi, yaş kapısı ve ebeveyn izni nasıl uygulanmalıdır?
4. Supabase bölgesi, DPA/SCC, alt işleyenler, yedek saklama ve hesap silme süresi
   nasıl beyan edilmelidir?
5. Expo, Apple coğrafi kodlama ve namaz vakti servisinin IP/log işlemesi mağaza
   formlarında hangi kategorilere girer?
6. Kur'an meali ve namaz vakti kaynağının yeniden kullanım izinleri nelerdir?
