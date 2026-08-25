# Faz 7 — Supabase hesap ve senkronizasyon işletim notu

Bu belge Faz 7 kodunun kurulumu, güvenlik sınırları ve elle doğrulamasıdır.
Uygulama Supabase değişkenleri verilmediğinde hesap ekranında yapılandırma
uyarısı gösterir; mevcut çevrimdışı özellikler çalışmaya devam eder.

## Mimari

- E-posta/parola hesabı Supabase Auth kullanır. Oturum cihazda
  `expo-secure-store` içinde, cihazdan taşınamayan parçalı kayıtlar hâlinde
  tutulur.
- SQLite her zaman yerel doğruluk kaynağıdır. Her değişiklik aynı işlemde
  `sync_outbox` kuyruğuna yazılır; ağ yokken uygulama normal çalışır.
- İlk giriş, hesapsız cihaz verisini `user:<auth uid>` sahibine atomik olarak
  geçirir ve tam bir başlangıç kuyruğu üretir.
- Gönderimler benzersiz `mutation_id` ile idempotenttir. Çekme işlemi monoton
  `server_version` imlecini kullanır.
- Genel çatışma kuralı son sunucu sürümüdür. Gün etkinliği maksimum sayaçları,
  rozet en erken kazanımı ve Kur'an okuma olayı birleşim semantiğiyle korunur.
  Ders denemeleri benzersiz olaylardır; aynı deneme ikinci kez XP üretmez.
- Namaz çizelgesi hassas kabul edilir ve ayrı kullanıcı onayı olmadan ne
  gönderilir ne de sunucudan çekilir. İl/ilçe, vakit önbelleği, bildirim
  ayarları ve Kur'an hatırlatma saati yalnız cihazda kalır.
- Sosyal paylaşım ve liderlik tablosu yoktur.

## Supabase projesini hazırlama

1. Yayın bölgesini ve veri aktarımını hukukçu ile netleştirip Supabase
   projesini oluştur.
2. `.env.example` dosyasını `.env.local` olarak kopyala ve gerçek
   `EXPO_PUBLIC_SUPABASE_URL` ile `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   değerlerini gir. Service role anahtarını mobil uygulamaya koyma.
3. Supabase CLI oturumuyla bağlantıyı kur ve veritabanını gönder:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   npx supabase functions deploy delete-account
   ```

4. Edge Function için `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` sırlarını
   yalnız Supabase Function ortamında tanımla.
5. Auth URL Configuration bölümüne üretim HTTPS adresini ve geliştirme için
   `ogrenme://account/callback` yönlendirmesini ekle. E-posta doğrulamasını ve
   parola sıfırlamayı gerçek SMTP sağlayıcısıyla sınamadan yayına çıkma.

## Güvenlik doğrulaması

Docker açıkken:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

`supabase/tests/phase_7_rls.test.sql` iki farklı kullanıcının birbirinin
kayıtlarını okuyamadığını ve anonim istemcinin RPC'leri çağıramadığını sınar.
Bu test geçmeden uzak proje üretim verisi kabul etmemelidir.

## Cihazda elle sınama

1. Çevrimdışıyken ders, Kur'an ve namaz kaydı oluştur; uygulamayı kapatıp aç ve
   kayıtların kaldığını doğrula.
2. Hesap açıp giriş yap; mevcut yerel ilerlemenin kaybolmadan yüklendiğini ve ağ
   gelince senkronlandığını doğrula.
3. Aynı hesapla ikinci cihazda giriş yap; iki cihazda farklı ders/okuma kaydı
   oluştur, ikisinin de birleştiğini doğrula.
4. Namaz senkronu kapalıyken uzak `prayer_logs` tablosunun boş kaldığını;
   onaydan sonra dolduğunu doğrula. Onayı kapatmanın yeni aktarımları durdurup
   geçmiş bulut verisini otomatik silmediğini kullanıcı metniyle karşılaştır.
5. Çıkış yap; hesabın cihaz kopyasının temizlendiğini ve yeni yerel profilin boş
   açıldığını doğrula. Tekrar girişte buluttan geri geldiğini doğrula.
6. “Hesabı sil” işleminin Auth kullanıcısını ve `ON DELETE CASCADE` ile bütün
   senkron kayıtlarını sildiğini doğrula.

## Yayın engelleri

- Gizlilik politikası, mağaza veri güvenliği formları, çocuk kullanıcı kararı
  ve namaz verisinin açık rıza metni hukuki incelemeden geçmelidir.
- Supabase bölgesi, veri işleme sözleşmesi, saklama/yedek politikası ve kullanıcı
  veri dışa aktarma süreci kararlaştırılmalıdır.
- Yerel pgTAP/RLS testleri, iki gerçek cihaz testi, SMTP ve hesap silme Edge
  Function testi tamamlanmalıdır.
