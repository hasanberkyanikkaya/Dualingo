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
  },

  /** Namaz sekmesi — ilk yayında boş */
  prayer: {
    title: 'Namaz',
    comingSoonTitle: 'Namaz takibi yakında',
    comingSoonBody: 'Namaz vakitleri ve günlük çizelge sonraki güncellemelerde gelecek.',
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
  },
} as const;

export type Strings = typeof strings;

export default strings;
