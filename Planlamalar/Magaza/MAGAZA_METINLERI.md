# Mağaza Metinleri — v0.1

Bu belgedeki metinler **kopyalanıp mağaza panellerine yapıştırılmak** üzere
yazılmıştır. Her metin kendi kod bloğundadır; blok dışındaki her şey nottur.

## Yer tutucular

| Yer tutucu | Bugünkü değer |
| --- | --- |
| `{APP_NAME}` | **Dualingo** — ⚠️ geçici, bkz. aşağıdaki marka uyarısı |

> ⚠️ **Marka uyarısı — yayından önce karar verilmeli.** "Dualingo" adı, alanın
> en büyük uygulaması olan "Duolingo" ile bir harf farkla neredeyse aynıdır.
> Bu, hem mağaza incelemesinde (taklit uygulama şüphesi) hem de marka
> itirazında somut ret riski taşır. Bundle identifier
> (`com.hasanberk.ogrenme`) bu riskten etkilenmez — bilinçli olarak uygulama
> adını taşımıyor.
>
> ⚠️ **Anahtar kelimelerde ve açıklamada rakip marka adı KULLANILMAYACAK.**
> "Duolingo tarzı", "Duolingo gibi" türü ifadeler her iki mağazada da doğrudan
> ret sebebidir. Bu belgedeki metinlerin hiçbirinde geçmiyor.

## Sınırlar ve ölçülen uzunluklar

| Alan | Sınır | Nerede | Ölçülen |
| --- | --- | --- | --- |
| Uygulama adı | 30 | App Store | 8 (`Dualingo`) |
| Alt başlık (subtitle) | 30 | App Store | 24 |
| Tanıtım metni (promotional text) | 170 | App Store | 161 |
| Açıklama | 4000 | App Store | 2133 |
| Anahtar kelimeler | 100 | App Store | 81 |
| Kısa açıklama | 80 | Google Play | 73 |
| Tam açıklama | 4000 | Google Play | 2335 |
| Sürüm notu | 500 (Play) | İkisi de | 213 |

> ℹ️ Uzunluklar bu belge yazılırken **sayılarak** doldurulmuştur, tahmin
> değildir. Metni değiştirirsen tekrar say — özellikle 30 ve 80 karakterlik
> alanlarda tek kelime sınırı aşırır. Sayma komutu `README.md`'de.
>
> ℹ️ **Tanıtım metni (promotional text)** App Store'da inceleme beklemeden
> güncellenebilir; duyuru ve kampanya için ayrılmıştır. Açıklamayı değiştirmek
> yeni bir sürüm incelemesi ister.

---

## Ne anlatılıyor, ne anlatılmıyor

⚠️ **Kur'an okuma takibi hiçbir metinde ÖZELLİK olarak sunulmuyor.** O sekme
bugün "yakında" durumundadır. Olmayan bir özelliği anlatmak hem kullanıcıyı
yanıltır hem de "açıklamayla uyuşmuyor" gerekçesiyle ret sebebidir. Aşağıdaki
metinlerde yalnızca **gerçekten çalışan** şeyler var: öğrenme yolu, seviye
tespit sınavı, altı soru tipi, yıldız/XP/seri, çevrimdışı çalışma,
hesapsızlık, reklamsızlık.

⚠️ **NAMAZ VAKİTLERİ Faz 4.1'de GERÇEKLEŞTİ ve artık yazılabilir** — ama
aşağıdaki metinler **henüz güncellenmedi**; genişletme kendi oturumunda
yapılacak (uzunluk sınırları yeniden ölçülmeli). Yazıldığında uyulacak kurallar:

- İzin verilen ifade: *"Diyanet İşleri Başkanlığı'nın yayınladığı namaz
  vakitleri"*, ekranda atıfla birlikte.
- ⚠️ **YASAK:** "Diyanet onaylı", "resmi", "Diyanet'in uygulaması" ve benzeri
  her ifade. Veri Diyanet'in yayınladığı tablodur ama uygulama Diyanet'e ait
  değildir ve kurumla anlaşması yoktur — hem hukuki hem impersonation riski.
- Kapsam **yalnızca Türkiye** olarak belirtilmeli; yurt dışında çalışmıyor.
- Namaz **çizelgesi** ("kıldım" işaretleme) ve **vakit bildirimleri** hâlâ YOK
  (Faz 4.2). Onlar yazılmamalı.
- Konumun **isteğe bağlı** olduğu söylenmeli — ilçe elle de seçilebiliyor.

⚠️ **"Uzmanlar tarafından hazırlandı / onaylandı" iddiası metinlere
KONMAMIŞTIR.** Bugün uygulamadaki içerik örnek veridir. Gerçek içerik insan
uzman tarafından yazılıp onaylandığında bu iddia **doğru olacak** ve o gün
açıklamaya eklenebilir. Doğrulanamayan iddia yazılmaz.

---

## App Store — Uygulama adı (≤30)

```
{APP_NAME}
```

## App Store — Alt başlık (≤30)

```
Adım adım İslami öğrenme
```

## App Store — Tanıtım metni (≤170)

```
Seviyeni belirle, sana uygun noktadan başla. Kısa dersler, altı farklı soru tipi ve günlük seri takibiyle ilerle. Hesap gerekmez, reklam yok, çevrimdışı çalışır.
```

## App Store — Anahtar kelimeler (≤100)

⚠️ Virgülle ayrılır, **virgülden sonra boşluk bırakılmaz** — boşluk da karakter
sayılır. Uygulama adı ve kategori adı buraya yazılmaz; Apple onları zaten
indeksler.

```
dini,islam,ilmihal,öğrenme,eğitim,ders,quiz,seviye,tekrar,bilgi,test,islami,öğren
```

## App Store — Açıklama (≤4000)

```
Kendi seviyenden başla, adım adım ilerle.

{APP_NAME}, dini bilgileri sıfırdan öğrenmek ya da bildiklerini tazelemek isteyenler için hazırlanmış bir öğrenme uygulamasıdır. Uzun metinler okumak yerine kısa dersler çözerek ilerlersin.

BAŞLANGIÇ NOKTANI SINAV BELİRLER

Uygulamayı ilk açtığında kendini nerede gördüğünü sorarız: Başlangıç, Temeller veya İleri. Ardından kısa bir seviye tespit sınavı gelir. Sınav beyanını doğrularsa oradan başlarsın; doğrulamazsa bir kademe geriden. Böylece ne bildiğin şeyleri yeniden çözersin, ne de hazır olmadığın bir yere atlarsın.

En baştan başlamak istersen sınavı atlayabilirsin.

ÖĞRENME YOLU

Dersler bir yol üzerinde sıralanır. Her ders bitince sıradaki açılır. Nerede olduğunu, hangi dersleri tamamladığını ve sırada ne olduğunu tek bakışta görürsün.

ALTI FARKLI SORU TİPİ

Aynı soru kalıbını tekrarlamak öğrenmeyi değil ezberi güçlendirir. Bu yüzden dersler altı ayrı soru tipiyle kurulur:

- Çoktan seçmeli
- Doğru / yanlış
- Boşluk doldurma (kelime havuzundan seçerek veya yazarak)
- Sıralama
- Görsel eşleştirme
- Sesli soru

Her sorudan sonra doğru mu yanlış mı yaptığını ve açıklamasını görürsün.

İLERLEMENİ GÖRÜRSÜN

- Her dersten performansına göre bir, iki veya üç yıldız kazanırsın
- Çözdüğün her ders XP getirir
- Her gün çalışarak günlük serini büyütürsün
- İstersen kendine bir günlük hedef koyarsın

Bir dersi tekrar çözebilirsin. Daha iyi bir sonuç aldığında yıldızın güncellenir; daha kötü bir sonuç kazandığın yıldızı geri almaz.

HESAP YOK, REKLAM YOK, İNTERNET GEREKMEZ

- Kaydolmana gerek yok. Uygulamayı aç ve başla.
- Adını, e-postanı, telefonunu istemiyoruz.
- İlerlemen yalnızca kendi cihazında saklanır.
- Reklam gösterilmez.
- Dersler internet bağlantısı olmadan çalışır.

ERİŞİLEBİLİRLİK

Arayüz, ekran okuyucularla kullanılabilecek şekilde etiketlenmiştir. Bilgi hiçbir yerde yalnızca renkle verilmez; durumlar simge ve biçimle de anlatılır. Cihazının yazı boyutu ayarını büyüttüğünde metinler kırpılmaz. Cihazında hareketi azaltma ayarı açıksa animasyonlar devre dışı kalır.

YOLUN DEVAMI

{APP_NAME} yeni derslerle ve yeni bölümlerle büyümeye devam edecek.
```

## Google Play — Kısa açıklama (≤80)

```
Kendi seviyenden başla: kısa dersler, seviye tespiti, günlük seri takibi.
```

## Google Play — Tam açıklama (≤4000)

⚠️ Play, açıklamada zengin biçimlendirmeyi desteklemez. Başlıklar bu yüzden
büyük harfle yazılmıştır — aynı düzen App Store metninde de kullanıldı ki iki
mağaza tutarlı görünsün.

```
Kendi seviyenden başla, adım adım ilerle.

{APP_NAME}, dini bilgileri sıfırdan öğrenmek ya da bildiklerini tazelemek isteyenler için hazırlanmış bir öğrenme uygulamasıdır. Uzun metinler okumak yerine kısa dersler çözerek ilerlersin. Yaş sınırı yoktur; herkes kendi noktasından başlar.

NEREDEN BAŞLAYACAĞINI SINAV BELİRLER

Uygulamayı ilk açtığında kendini nerede gördüğünü sorarız: Başlangıç, Temeller veya İleri. Ardından kısa bir seviye tespit sınavı gelir. Sınav beyanını doğrularsa oradan başlarsın; doğrulamazsa bir kademe geriden başlarsın. Böylece bildiğin şeyleri baştan çözmek zorunda kalmazsın, hazır olmadığın bir yere de atlamış olmazsın.

En baştan başlamak istersen sınavı atlayabilirsin. Kararını sonradan değiştirip sınavı tekrar çözebilirsin.

ÖĞRENME YOLU

Dersler bir yol üzerinde sıralanır. Her ders bitince sıradaki açılır. Nerede olduğunu, hangi dersleri tamamladığını ve sırada ne olduğunu tek bakışta görürsün.

ALTI FARKLI SORU TİPİ

Aynı soru kalıbını tekrarlamak öğrenmeyi değil ezberi güçlendirir. Bu yüzden dersler altı ayrı soru tipiyle kurulur:

- Çoktan seçmeli
- Doğru / yanlış
- Boşluk doldurma (kelime havuzundan seçerek veya klavyeyle yazarak)
- Sıralama
- Görsel eşleştirme
- Sesli soru

Her sorudan sonra doğru mu yanlış mı yaptığını ve açıklamasını görürsün.

İLERLEMENİ GÖRÜRSÜN

- Her dersten performansına göre bir, iki veya üç yıldız kazanırsın
- Çözdüğün her ders XP getirir
- Her gün çalışarak günlük serini büyütürsün
- İstersen kendine bir günlük hedef koyarsın

Bir dersi istediğin kadar tekrar çözebilirsin. Daha iyi bir sonuç aldığında yıldızın güncellenir; daha kötü bir sonuç önceden kazandığın yıldızı geri almaz.

HESAP YOK, REKLAM YOK, İNTERNET GEREKMEZ

- Kaydolmana gerek yok. Uygulamayı aç ve başla.
- Adını, e-postanı, telefon numaranı istemiyoruz.
- İlerlemen yalnızca kendi cihazında saklanır, sunucuya gönderilmez.
- Reklam gösterilmez.
- Dersler internet bağlantısı olmadan çalışır.

ERİŞİLEBİLİRLİK

Arayüz, ekran okuyucularla kullanılabilecek şekilde etiketlenmiştir. Bilgi hiçbir yerde yalnızca renkle verilmez; durumlar simge ve biçimle de anlatılır. Cihazının yazı boyutu ayarını büyüttüğünde metinler kırpılmaz. Cihazında hareketi azaltma ayarı açıksa animasyonlar devre dışı kalır.

YOLUN DEVAMI

{APP_NAME} yeni derslerle ve yeni bölümlerle büyümeye devam edecek.
```

---

## Sürüm notu — v0.1 (ilk yayın)

App Store'da "What's New", Play'de "Sürümdeki yenilikler" alanına gider.
⚠️ Play'de bu alan **500 karakterle** sınırlıdır.

```
İlk sürüm.

- Seviye tespit sınavı ile kendi noktandan başlama
- Ders ders ilerleyen öğrenme yolu
- Altı farklı soru tipi
- Yıldız, XP ve günlük seri takibi
- Çevrimdışı çalışma
- Hesap gerektirmez, reklam içermez
```

---

## Yayından önce bu belgede yapılacaklar

- [ ] `{APP_NAME}` yer tutucusu **tek geçişte** gerçek adla değiştirilecek
      (marka kararı verildikten sonra)
- [ ] Ad değişirse **karakter sayıları yeniden ölçülecek** — özellikle
      alt başlık (30) ve Play kısa açıklaması (80)
- [ ] Gerçek içerik yayına girdiğinde uzman onayı ifadesinin eklenip
      eklenmeyeceğine karar verilecek
- [ ] Namaz ve Kur'an modülleri yayına girdiğinde açıklama genişletilecek
      (⚠️ önce özellik, sonra metin — tersi ret sebebi)
