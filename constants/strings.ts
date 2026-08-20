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
    // ⚠️ Metin YARGI TAŞIMAZ: "kılmadın", "eksik", "kaçırdın" gibi hiçbir
    // ifade kullanılmaz. Ekran sayar, hüküm vermez (dini içerik politikası).
    markedSummary: '{kilinan} / {toplam} vakit işaretli',
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
  },

  /** Kur'an sekmesi — ilk yayında boş */
  quran: {
    title: "Kur'an",
    comingSoonTitle: 'Okuma takibi yakında',
    comingSoonBody: 'Okuma hedefi ve ilerleme takibi sonraki güncellemelerde gelecek.',
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
    prayerMarkToggle: '{vakit} — kılındı işareti',
  },
} as const;

export type Strings = typeof strings;

export default strings;
