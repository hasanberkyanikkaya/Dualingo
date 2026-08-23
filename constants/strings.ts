/**
 * Arayüz metinleri.
 *
 * i18n kütüphanesi yok — düz TypeScript nesnesi. Çoklu dil park edildi;
 * gerekirse bu nesnenin ikinci bir dil kopyası çıkarılır ve seçim mekaniktir.
 *
 * Kurallar:
 *  - Bileşenlerin içine metin gömülmez, hepsi buradan gelir.
 *  - Değişken içeren metinlerde `{ad}` biçiminde yer tutucu kullanılır.
 *    Yerine koyma işini `/lib` altındaki biçimlendirme yardımcısı yapar.
 *  - Dini içerik (ayet, hadis, dua, fıkhi açıklama) BU DOSYADA DURMAZ.
 *    Buradaki metinler yalnızca arayüz metnidir; ders içeriği `/content`ten gelir.
 */

export const strings = {
  /** Uygulama geneli */
  app: {
    // Geçici ad. Bundle identifier bilinçli olarak bu adı taşımaz
    // (`com.hasanberk.ogrenme`) — ad değişse bile kimlik sabit kalsın diye.
    name: 'Dualingo',
  },

  /** Her yerde tekrar eden eylemler */
  common: {
    continue: 'Devam et',
    start: 'Başla',
    next: 'İleri',
    back: 'Geri',
    close: 'Kapat',
    cancel: 'Vazgeç',
    save: 'Kaydet',
    delete: 'Sil',
    ok: 'Tamam',
    yes: 'Evet',
    no: 'Hayır',
    retry: 'Tekrar dene',
    skip: 'Atla',
    done: 'Bitti',
    loading: 'Yükleniyor…',
    soon: 'Yakında',
    seeAll: 'Tümünü gör',
  },

  /** Alt sekmeler */
  tabs: {
    learn: 'Öğren',
    prayer: 'Namaz',
    quran: "Kur'an",
    profile: 'Profil',
  },

  /** Karşılama ve seviye tespiti */
  onboarding: {
    welcomeTitle: 'Hoş geldin',
    welcomeSubtitle: 'Kendi hızında, kendi noktandan başla.',
    getStarted: 'Hadi başlayalım',
    alreadyHaveProgress: 'Daha önce başlamıştım',
    levelTestTitle: 'Nereden başlayalım?',
    levelTestSubtitle:
      'Birkaç kısa soruyla sana uygun başlangıç noktasını bulalım. Yanlış cevap sorun değil.',
    levelTestStart: 'Seviye tespitine başla',
    levelTestSkip: 'En baştan başlamak istiyorum',
    levelTestResultTitle: 'Başlangıç noktan hazır',
    levelTestResultSubtitle: 'Sana uygun görünen yer: {unit}',
    goalTitle: 'Günlük hedefin ne olsun?',
    goalSubtitle: 'İstediğin zaman değiştirebilirsin.',
    goalCasual: 'Rahat — günde 5 dakika',
    goalRegular: 'Düzenli — günde 10 dakika',
    goalSerious: 'Kararlı — günde 20 dakika',

    // Kademe etiketleri. `Difficulty` değerlerinin Türkçe karşılığı; eşleme
    // `types/learning.ts`in söz verdiği gibi düz.
    difficultyBeginner: 'Başlangıç',
    difficultyBeginnerBody: 'Yeni başlıyorum, temelden anlatılsın.',
    difficultyBasic: 'Temeller',
    difficultyBasicBody: 'Temel konuları biliyorum, üstüne koyayım.',
    difficultyAdvanced: 'İleri',
    difficultyAdvancedBody: 'Çoğunu biliyorum, ileri konulara geçeyim.',

    // Sınavdan çıkış onayı. ⚠️ `lesson.quit*` metinleri "bu dersteki ilerlemen"
    // diyor; sınavda kaybedilen şey ders ilerlemesi değil, sınavın kendisi.
    quitTitle: 'Seviye tespitinden çıkılsın mı?',
    quitMessage: 'Cevapların kaybolur ve sınava baştan başlarsın.',
    quitConfirm: 'Çık',
    quitCancel: 'Sınava dön',

    levelTestScore: '{correct} / {total} doğru',
    levelTestTierLabel: 'Kademen: {tier}',
    // Beyan edilen kademe sınavla doğrulanamadığında görünür.
    levelTestLowered:
      'Bu kademede biraz daha çalışman iyi olur — seni bir basamak öncesinden başlatıyoruz.',
    levelTestConfirmed: 'Seçtiğin kademeden başlıyorsun.',
    levelTestResultStart: 'Buradan başla',
    // Sınav atlandığında sonuç ekranı gösterilmez; bu satır haritaya gidişte
    // değil, profildeki tekrar akışının özetinde kullanılır.
    levelTestSkipped: 'Sınav yapılmadı, en baştan başlıyorsun.',
  },

  /** Öğrenme yolu ekranı */
  learn: {
    title: 'Öğren',
    pathSubtitle: 'Adım adım ilerle',
    unitLabel: 'Ünite {number}',
    levelLabel: 'Seviye {number}',
    lockedLevel: 'Bu seviye henüz açılmadı',
    lockedLevelHint: 'Önceki seviyeyi tamamlayınca açılır.',
    skippedLevel: 'Seviye tespitiyle açıldı',
    completedLevel: 'Tamamlandı',
    currentLevel: 'Şu an buradasın',
    reviewLevel: 'Tekrar et',
    startLevel: 'Başla',
    unitCompleted: 'Üniteyi tamamladın',
    emptyPath: 'Burada henüz içerik yok.',
  },

  /** Ders (seviye) ekranı */
  lesson: {
    progressLabel: '{current} / {total}',
    checkAnswer: 'Kontrol et',
    continueAfterAnswer: 'Devam et',
    quitTitle: 'Dersten çıkılsın mı?',
    quitMessage: 'Bu dersteki ilerlemen kaybolacak.',
    quitConfirm: 'Çık',
    quitCancel: 'Derse dön',
    correct: 'Doğru',
    incorrect: 'Yanlış',
    correctAnswerIs: 'Doğru cevap: {answer}',
    yourAnswer: 'Senin cevabın: {answer}',
    explanationTitle: 'Açıklama',
    playAudio: 'Sesi dinle',
    replayAudio: 'Tekrar dinle',
    audioUnavailable: 'Ses şu an kullanılamıyor',
  },

  /** Soru tiplerinin yönergeleri */
  question: {
    multipleChoice: 'Doğru cevabı seç',
    imageMatch: 'Eşleştir',
    ordering: 'Doğru sıraya diz',
    fillBlank: 'Boşluğu doldur',
    audioChoice: 'Dinle ve seç',
    trueFalse: 'Doğru mu, yanlış mı?',
    trueLabel: 'Doğru',
    falseLabel: 'Yanlış',
    selectAnswerHint: 'Devam etmek için bir seçenek seç',

    /* Sıralama sorusu */
    orderingYourOrder: 'Sıralaman',
    orderingPool: 'Öğeler',
    orderingEmpty: 'Aşağıdaki öğelere dokunarak sırala',
    orderAllHint: 'Tüm öğeleri sıraya diz',

    /* Boşluk doldurma */
    fillBlankBank: 'Kelimeler',
    fillAllBlanksHint: 'Tüm boşlukları doldur',

    /* Görsel eşleştirme */
    matchAllHint: 'Tüm eşleşmeleri kur',
  },

  /** Ders bitiş ekranı */
  result: {
    title: 'Ders tamamlandı',
    xpEarned: '+{xp} XP',
    accuracy: 'Doğruluk: %{percent}',
    duration: 'Süre: {duration}',
    perfectTitle: 'Hatasız',
    perfectSubtitle: 'Tek yanlış yapmadın.',
    keepGoing: 'Yola devam',
    reviewMistakes: 'Yanlışları gözden geçir',
    backToPath: 'Yola dön',
    /** ⚠️ Yukarıdaki `keepGoing` ('Yola devam') KULLANILMIYOR: `backToPath`
        ('Yola dön') ile bir harf farkla karışıyor, oysa ikisi farklı yerlere
        gidiyor — biri sonraki derse, öteki haritaya. */
    nextLesson: 'Sonraki ders',
    /** Hata özetinde satır başlığı — örnek sorular hep "ÖRNEK SORU n" olduğu
        için satırları ayırt eden tek şey bu numara. */
    questionIndex: '{index}. soru',
  },

  /** XP, seri, rozetler */
  progress: {
    xp: 'XP',
    totalXp: 'Toplam XP',
    streak: 'Seri',
    streakDays: '{count} gün',
    streakStarted: 'Seri başladı',
    streakContinued: 'Serin devam ediyor',
    streakLost: 'Serin sıfırlandı',
    streakHint: 'Her gün bir ders, seriyi sürdürür.',
    dailyGoal: 'Günlük hedef',
    dailyGoalReached: 'Bugünün hedefini tamamladın',
    badges: 'Rozetler',
    noBadgesYet: 'Henüz rozet yok — ilk dersini tamamla.',
    /** Ders sonunda kazanılan rozetlerin başlığı. Tekil/çoğul ayrı satır. */
    badgeEarned: 'Yeni rozet',
    badgeEarnedPlural: 'Yeni rozetler',
    badgeLocked: 'Kilitli',
    level: 'Seviye',
  },

  /** Profil ve ayarlar */
  profile: {
    title: 'Profil',
    // Faz 1.1 — istatistik ve ayarlar gelene kadarki boş durum metni
    emptyBody: 'İstatistiklerin ve ayarların ilk dersinden sonra burada görünecek.',
    statistics: 'İstatistikler',
    settings: 'Ayarlar',
    theme: 'Görünüm',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    themeSystem: 'Sistem',
    notifications: 'Bildirimler',
    sound: 'Ses',
    dailyReminder: 'Günlük hatırlatma',
    reminderTime: 'Hatırlatma saati',
    about: 'Hakkında',
    version: 'Sürüm {version}',
    resetProgress: 'İlerlemeyi sıfırla',
    resetProgressWarning: 'Tüm ilerlemen silinir. Bu işlem geri alınamaz.',
    placementTitle: 'Seviye tespiti',
    // ⚠️ Cümle "tamamladıkların korunur" diyor ve bu bir SÖZ: `applyPlacement`
    // `completed` kayıtlara hiçbir koşulda dokunmuyor.
    placementBody: 'Kademeni yeniden ölçebilirsin. Tamamladığın dersler korunur.',
    placementAction: 'Tespiti tekrar et',
    /*
     * Namaz bildirimi bölümü (Faz 4.4).
     *
     * ⚠️ Var olan `notifications: 'Bildirimler'` satırı bir AYAR BAŞLIĞI
     * yer tutucusu (Faz 1.1'den kalma) ve hâlâ tüketicisiz; bölüm kendi
     * metinlerini taşıyor ki ileride genel bir "Ayarlar" bölümü gelince ikisi
     * karışmasın.
     */
    prayerNotificationsTitle: 'Namaz vakti bildirimleri',
    prayerNotificationsBody: 'Hangi vakitlerde haber vereceğimizi seçebilirsin.',
    prayerNotificationsAction: 'Bildirimleri ayarla',
  },

  /**
   * Namaz sekmesi (Faz 4.1).
   *
   * ⚠️ `attribution` metni birebir böyle kalmalı. Veri Diyanet İşleri
   * Başkanlığı'nın YAYINLADIĞI tablodur ama uygulama Diyanet'in değildir ve
   * kurumla anlaşması yoktur. "Resmi", "onaylı", "Diyanet'in uygulaması" gibi
   * ifadeler hem hukuki hem mağaza incelemesi riskidir; bu bölümde hiçbir
   * anahtarda geçmez.
   *
   * ⚠️ Konum metinleri "bulunduğun ilçe" der, "en yakın ilçe" DEMEZ: servis
   * ilçe koordinatı vermiyor, mesafe hesabı yok (bkz. `districtMatch.ts`).
   *
   * Vakit adları (İmsak/Güneş/…) yapısal etikettir, dini içerik değildir.
   */
  prayer: {
    title: 'Namaz',

    // Ana ekran
    todayTitle: 'Bugünün vakitleri',
    nextPrayerLabel: 'Sıradaki vakit',
    remaining: '{saat} sa {dakika} dk {saniye} sn',
    remainingShort: '{dakika} dk {saniye} sn',
    /*
     * ⚠️ Metin YARGI TAŞIMAZ: "kılmadın", "eksik", "kaçırdın", "borç" gibi
     * hiçbir ifade kullanılmaz. Ekran sayar, hüküm vermez.
     *
     * ⚠️ **PAYDA YOK** (Faz 4.3). Eskiden burada `'{kilinan} / {toplam} vakit
     * işaretli'` yazıyordu; "2 / 5" hiçbir suçlayıcı kelime kullanmadan bir
     * eksiklik bildiriyor. Yalnızca olumlu kayıt sayılır.
     */
    summaryDone: '{sayi} vakit kılındı olarak işaretli',
    summaryKaza: '{sayi} vakit kaza olarak işaretli',

    // Çizelge (Faz 4.3)
    chartTitle: 'Çizelgem',
    chartWeek: 'Hafta',
    chartMonth: 'Ay',
    chartPrevious: 'Önceki',
    chartNext: 'Sonraki',
    chartToday: 'Bugüne dön',
    chartWeekSummary: 'Bu aralıkta {sayi} vakit işaretledin.',
    chartKazaSummary: '{sayi} vakit kaza olarak işaretlendi.',
    chartEmpty: 'Henüz işaret yok. İstediğin zaman başlayabilirsin.',
    chartHint: 'Bir vakte dokunarak kılındı, tekrar dokunarak kaza olarak işaretleyebilirsin.',
    chartSelectDay: 'Düzenlemek için bir güne dokun.',
    chartFutureDay: 'Bu gün henüz gelmedi.',

    /*
     * Izgara sütun başlıkları. Dar hücrede tam ad sığmıyor.
     * Güneş çizelgeye HİÇ girmiyor (namaz değil) ama eşleme tam olsun diye
     * kısaltması burada duruyor — eksik anahtar tipi kırardı.
     */
    shortImsak: 'İms',
    shortGunes: 'Gün',
    shortOgle: 'Öğl',
    shortIkindi: 'İki',
    shortAksam: 'Akş',
    shortYatsi: 'Yat',

    // Durum adları — teknik değer `kilinmadi` ama ekranda "Kayıt yok" yazar.
    statusNone: 'Kayıt yok',
    statusDone: 'Kılındı',
    statusKaza: 'Kaza',
    changeDistrict: 'İlçeyi değiştir',
    refresh: 'Yenile',
    attribution: "Diyanet İşleri Başkanlığı'nın yayınladığı vakitler",

    // Vakit adları
    imsak: 'İmsak',
    gunes: 'Güneş',
    ogle: 'Öğle',
    ikindi: 'İkindi',
    aksam: 'Akşam',
    yatsi: 'Yatsı',

    // Boş ve hata durumları
    noDistrictTitle: 'Önce ilçeni seç',
    noDistrictBody: 'Namaz vakitlerini gösterebilmek için bulunduğun ilçeyi bilmem gerekiyor.',
    emptyTitle: 'Bugünün vakitleri elimde yok',
    emptyBody: 'İnternete bağlanıp yenilediğinde vakitler indirilecek ve sonrasında çevrimdışı da çalışacak.',
    upstreamError: 'Vakit sunucusuna şu an ulaşılamıyor. Daha sonra yeniden denenecek.',
    offlineNotice: 'İnternet bağlantısı yok. Elimdeki vakitler gösteriliyor.',
    invalidDistrict: 'Seçili ilçe artık tanınmıyor. Lütfen yeniden seç.',

    // İlçe seçimi
    selectDistrictTitle: 'İlçeni seç',
    selectDistrictBody: 'Vakitler seçtiğin ilçeye göre gösterilir.',
    cityStepTitle: 'İl',
    districtStepTitle: 'İlçe',
    backToCities: 'İl listesine dön',
    useLocation: 'Konumumdan bul',
    locationHint: 'Konum isteğe bağlı — listeden elle de seçebilirsin.',
    locationDenied: 'Konum izni verilmedi. Listeden elle seçebilirsin.',
    locationUnavailable: 'Konum alınamadı. Listeden elle seçebilirsin.',
    locationNoMatch: 'Bulunduğun yer listede eşleşmedi. Listeden elle seçebilirsin.',
    locationMatched: 'Bulunduğun ilçe: {ilce}',
    locationUseMatch: 'Bunu kullan',
    turkeyOnly: 'Bu sürümde yalnızca Türkiye içindeki vakitler destekleniyor.',
    listUnavailable: 'İl listesi indirilemedi. İnternet bağlantını kontrol edip tekrar dene.',
    retry: 'Tekrar dene',

    /*
     * Bildirim ayarları (Faz 4.4).
     *
     * ⚠️ **Bildirim HABER VERİR; teşvik etmez, ayıplamaz.** 4.3'ün yasaklı dil
     * kuralı burada daha da bağlayıcı: bildirim kullanıcının izin vermediği bir
     * anda, elinde olmayan bir yerde belirir. "Unutma", "kaçırdın", "hâlâ
     * kılmadın" gibi bir cümle o bağlamda uyarı değil, baskıdır.
     *
     * ⚠️ Metinler DÜZ ARAYÜZ METNİ — ayet, hadis, dua ya da fıkhi ifade
     * içermez (dini içerik politikası). Vaktin girdiğini söyler, gerisini
     * kullanıcıya bırakır.
     */
    notificationsTitle: 'Bildirimler',
    notificationsBody: 'Hangi vakitlerde haber verelim, sen seç.',
    /** Bildirimin kendi başlığı — `{vakit}` yerine vakit adı gelir. */
    notificationTitle: '{vakit} vakti',
    notificationBody: 'Vakit girdi. Hazır olduğunda çizelgene işaretleyebilirsin.',
    notificationTiming: 'Ne zaman haber verelim',
    offsetAtStart: 'Vakit başında',
    offsetLater: '{dakika} dk sonra',
    permissionDeniedTitle: 'Bildirim izni kapalı',
    permissionDeniedBody:
      'Ayarları buradan açtığında hatırlatmalar çalışmaya başlar. Seçimlerin kayıtlı kalır.',
    openSettings: 'Ayarları aç',
    notificationsAllOff: 'Şu an hiçbir vakit için haber vermiyoruz.',
    notificationsHint: 'Vakitler cihazında saklı; hatırlatma için internet gerekmez.',

    /*
     * Kıble pusulası (Faz 4.5).
     *
     * ⚠️ **Hiçbir FIKHİ ifade yok.** Ekran iki noktayı birleştiren açıyı ve
     * cihazın okuduğu yönü söyler; bu yönle ne yapılacağını anlatmaz, bir
     * geçerlilik iddiasında bulunmaz. Dini içerik politikasının bu ekrandaki
     * karşılığı (4.3/4.4'ün yasaklı dil kuralının devamı).
     *
     * ⚠️ `qiblaTimeBody` bir tarif DEĞİL, ASTRONOMİK bir olgudur: o saatte
     * güneşin Kâbe yönünde bulunduğunu söyler. Değer Diyanet'in yayınladığı
     * tablodan geliyor (`prayer_time.kible_saati`), bizim hesabımız değil.
     */
    qiblaTitle: 'Kıble',
    qiblaBody: 'Telefonu yere paralel tut ve Kâbe işareti yukarıdaki oka gelene kadar çevir.',
    qiblaBearing: 'Kıble yönü: {derece}°',
    qiblaAligned: 'Kâbe yönündesin',
    qiblaTurnRight: 'Sağa {derece}° çevir',
    qiblaTurnLeft: 'Sola {derece}° çevir',
    qiblaCalibrateTitle: 'Pusulayı kalibre et',
    qiblaCalibrateBody:
      'Telefonu havada sekiz çizer gibi birkaç kez çevir. Yakındaki metal yüzeyler ve elektronik cihazlar pusulayı şaşırtır.',
    qiblaTimeTitle: 'Bugünün kıble saati',
    qiblaTimeBody: 'Bu saatte güneş Kâbe yönünde bulunur.',
    qiblaLocating: 'Konum alınıyor…',
    qiblaPermissionTitle: 'Konum izni kapalı',
    qiblaPermissionBody:
      'Kıble yönü bulunduğun noktaya göre hesaplanır. Konumun cihazda kalır, hiçbir yere gönderilmez ve saklanmaz.',
    qiblaUnavailable: 'Yön hesaplanamadı. Konum servisinin açık olduğundan emin olup tekrar deneyebilirsin.',
    qiblaHint:
      'Yön cihazın pusula sensöründen okunur; yakındaki metal ve elektronik cihazlar sonucu etkileyebilir.',
  },

  /** Kur'an okuma alanı (Faz 5.2). Dini metin değil, yalnız arayüz dili. */
  quran: {
    title: "Kur'an",
    subtitle: 'Gece sakinliğinde, kaldığın yerden devam et.',
    continueTitle: 'Kaldığın yer',
    continueBody: '{sure}. sure · {ayet}. ayet · {sayfa}. sayfa',
    continueAction: 'Okumaya devam et',
    startTitle: 'Okumaya başla',
    startBody: 'Bir sure seç veya ilk sayfadan başla.',
    startAction: 'İlk sayfayı aç',
    chooseSurah: 'Sure seç',
    changeSurah: 'Sureyi değiştir',
    surahNumber: '{number}. sure',
    surahPickerTitle: 'Sureler',
    surahPickerBody: 'Okumaya başlamak istediğin sureyi seç.',
    readerTitle: 'Okuyucu',
    page: '{number}. sayfa',
    juz: '{number}. cüz',
    juzRange: '{first}–{last}. cüz',
    verse: '{number}. ayet',
    translation: 'Meal',
    fontSize: 'Yazı boyutu',
    fontSmall: 'Küçük',
    fontMedium: 'Orta',
    fontLarge: 'Büyük',
    previousPage: 'Önceki',
    nextPage: 'Sonraki',
    firstPage: 'İlk sayfadasın',
    lastPage: 'Son sayfadasın',
    contentUnavailable: 'Bu sayfa şu anda açılamadı.',
    developmentNotice: 'Geliştirme içeriği · yayın için henüz onaylı değil',
    sourceAttribution: 'Kur’an metni: Tanzil Project · Meal: Elmalılı Hamdi Yazır',
    openSource: 'Kaynak bilgisini aç',
  },

  /** Hata ve boş durumlar */
  errors: {
    genericTitle: 'Bir şeyler ters gitti',
    genericBody: 'Tekrar dene. Sorun sürerse uygulamayı yeniden başlat.',
    contentLoadFailed: 'İçerik yüklenemedi',
    noConnection: 'İnternet bağlantısı yok',
    noConnectionBody: 'Dersler çevrimdışı çalışır, ses dosyaları için bağlantı gerekir.',
    notFound: 'Aradığın şey bulunamadı',
  },

  /** Erişilebilirlik etiketleri (ekran okuyucu) */
  a11y: {
    closeButton: 'Kapat',
    backButton: 'Geri git',
    progressBar: 'İlerleme: {current} / {total}',
    playAudioButton: 'Sesi çal',
    lockedLevelButton: 'Kilitli seviye',
    completedLevelButton: 'Tamamlanmış seviye',
    /** Türkçe sıra: "3 yıldızdan 2" */
    levelStars: '{total} yıldızdan {earned}',

    /*
     * Sıralama sorusu. Ekleme/çıkarma DUYURULMAK zorunda: dokunulan çip
     * listeden kalkıyor, ekran okuyucu odağı kaybedip rastgele bir öğeyi
     * okuyor. "Eklemek için iki kez dokun" ipucu bilerek YOK — `role="button"`
     * o anonsu işletim sisteminin kendi dilinde zaten üretiyor.
     */
    orderingPositionLabel: '{position}. {text}',
    orderingItemAdded: '{text} eklendi, {position}. sıra',
    orderingItemRemoved: '{text} çıkarıldı',
    orderingRemoveHint: 'Sıradan çıkarmak için iki kez dokun',

    /* Boşluk doldurma — yuvalar sırayla numaralı okunur */
    blankEmpty: '{index}. boşluk, boş',
    blankFilled: '{index}. boşluk: {value}',
    blankClearHint: 'Boşaltmak için iki kez dokun',

    /* Görsel eşleştirme */
    matchedPair: '{text} — {number}. eşleşme',

    /* Rozetler — durum RENKLE değil ikon biçimiyle veriliyor, ekran okuyucuya
       da sözle söylenmeli. */
    badgeEarned: '{name} — kazanıldı',
    badgeLocked: '{name} — kilitli',

    /*
     * Namaz geri sayımı. ⚠️ Anons DAKİKA hassasiyetinde ve SANİYE OKUNMAZ:
     * saniyede bir güncellenen bir metin ekran okuyucuyu kullanılamaz hale
     * getirir. 3.3'ün `useCountUp` kararının aynısı — orada da sayan rakam
     * gizlenip etiket son değerden kurulmuştu.
     */
    prayerRemaining: '{vakit} vaktine {saat} saat {dakika} dakika kaldı',
    prayerRemainingSoon: '{vakit} vaktine {dakika} dakika kaldı',
    prayerNext: 'Sıradaki vakit: {vakit}, {saat}',
    /*
     * ⚠️ Durum ADI etikete YAZILIYOR. `accessibilityRole="checkbox"` üç durumu
     * anons edemez ("işaretli/işaretsiz"); rol `button` olunca durumu söyleyen
     * tek şey bu metin (Faz 4.3).
     */
    prayerStatusControl: '{hedef} — {durum}',
    prayerStatusHint: 'Durumu değiştirmek için iki kez dokun',
    /** Izgara hücresi: "18 Ağu, İkindi" gibi bir hedef üretir. */
    prayerChartCell: '{tarih}, {vakit}',
    /*
     * Aylık takvim hücresi. ⚠️ Sayılar SÖZLE yazılıyor: hücredeki 12 dp'lik
     * özet şeridi bu ölçekte biçim ayrımını zayıf taşıyor, ekran okuyucuya
     * giden bilgi ondan bağımsız olmalı. "İşaretsiz" sayısı YOK.
     */
    prayerChartDay: '{tarih}, {kilinan} vakit kılındı, {kaza} vakit kaza',
    /**
     * Bildirim anahtarı (Faz 4.4).
     *
     * ⚠️ Rol `switch` — açık/kapalı bilgisini işletim sistemi kendisi anons
     * ediyor, etikete "açık"/"kapalı" YAZILMAZ (yazılsaydı anons ikiye
     * katlanırdı; Button'ın `accessibilityState` kararının aynısı).
     */
    prayerNotificationToggle: '{vakit} bildirimi',
    prayerOffsetOption: '{vakit} — {secenek}',
    /*
     * Kıble pusulası (Faz 4.5).
     *
     * ⚠️ Kadranın etiketi SABİT bir açı taşır (kıble azimutu), anlık yönü
     * DEĞİL. Anlık yön saniyede onlarca kez değişiyor; etikete bağlansaydı
     * ekran okuyucu durmadan farklı bir sayı anons eder ve ekran kullanılamaz
     * hâle gelirdi (`prayerRemaining`in dakika hassasiyeti kararının devamı).
     */
    qiblaDial: 'Kıble pusulası. Kıble yönü {derece} derece.',
    /** Hizalanma anons metni — yalnızca durum DEĞİŞTİĞİNDE, bir kez okunur. */
    qiblaAligned: 'Kâbe yönüne hizalandın',
    quranSurahOption: '{number}. sure, {name}',
    quranPage: '{page}. sayfa, {juz}',
    quranVerse: '{sure}. sure, {ayet}. ayet',
    quranPreviousPage: 'Önceki sayfaya geç',
    quranNextPage: 'Sonraki sayfaya geç',
  },
} as const;

export type Strings = typeof strings;

export default strings;
