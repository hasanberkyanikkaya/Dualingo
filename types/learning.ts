/**
 * Öğrenme modülü — içerik tipleri.
 *
 * Bu dosya pakete gömülü, salt okunur veriyi tarif eder: öğrenme yolu, üniteler,
 * seviyeler ve sorular. Veri `/content` altındaki JSON dosyalarından gelir ve
 * `expo-updates` ile mağazasız güncellenir.
 *
 * Kullanıcının cihazında yazılan ilerleme verisi burada değil, `progress.ts` içinde.
 *
 * Sadece tip tanımı — fonksiyon, sabit, doğrulama yok.
 */

// ── Kimlikler ────────────────────────────────────────────────────────────────
// Okunabilirlik için takma ad; markalı (branded) tip kullanılmaz, çünkü veri
// JSON'dan geliyor ve marka her okumada tip dönüşümü zorlardı.

export type LearningPathId = string;
export type UnitId = string;
export type LevelId = string;
export type QuestionId = string;

// ── Ortak parçalar ───────────────────────────────────────────────────────────

/**
 * Zorluk kademesi.
 * Seviye tespit sınavındaki seçimle (Başlangıç / Temeller / İleri) aynı haznedir;
 * test sonucu doğrudan bu değere eşlenir.
 */
export type Difficulty = 'beginner' | 'basic' | 'advanced';

/**
 * Uzak ses dosyası referansı.
 * Ses dosyaları pakete gömülmez; indirilip cihazda önbelleğe alınır.
 * Dosya yoksa uygulama sessiz çalışır — referansın varlığı dosyanın varlığını
 * garanti etmez.
 */
export type AudioRef = {
  /** Uzak dosya adı. Adlandırma düzeni Oturum 2.5'te belirlenip belgelenecek. */
  key: string;
  /** Bilinmesi hâlinde süre — ilerleme göstergesi için, zorunlu değil. */
  durationMs?: number;
};

/** Görsel referansı. */
export type ImageRef = {
  key: string;
  /** Ekran okuyucu metni. Zorunlu — boş geçilmemesi için opsiyonel yapılmadı. */
  alt: string;
};

/** Seçenek — çoktan seçmeli ve sesli tanıma sorularında kullanılır. */
export type Choice = {
  id: string;
  text: string;
  image?: ImageRef;
};

// ── Hiyerarşi ────────────────────────────────────────────────────────────────

/** Öğrenme yolu — üniteleri taşıyan en dış kap. */
export type LearningPath = {
  id: LearningPathId;
  title: string;
  description: string;
  units: Unit[];
};

/** Ünite — konu başlığı, içinde seviyeler. */
export type Unit = {
  id: UnitId;
  title: string;
  description?: string;
  /** Yoldaki sıra. Dizi sırasına güvenilmez; JSON elle düzenlenecek. */
  order: number;
  /** @expo/vector-icons ikon adı — haritada ünite başlığında görünür. */
  icon?: string;
  levels: Level[];
};

/** Seviye — bir derse karşılık gelir; haritadaki tek bir düğüm. */
export type Level = {
  id: LevelId;
  title: string;
  /** Ünite içindeki sıra. */
  order: number;
  difficulty: Difficulty;
  /** Seviye ilk kez tamamlandığında kazanılan XP. */
  xpReward: number;
  questions: Question[];
};

// ── Sorular ──────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'multiple_choice'
  | 'image_match'
  | 'ordering'
  | 'fill_blank'
  | 'audio_choice'
  | 'true_false';

/** Tüm soru tiplerinin ortak alanları. */
export type QuestionBase = {
  id: QuestionId;
  /** Soru metni / yönerge. */
  prompt: string;
  /** Cevaptan sonra gösterilen açıklama. */
  explanation?: string;
  hint?: string;
  image?: ImageRef;
  /**
   * Sorunun seslendirmesi. Dosya yoksa ses butonu görünmez, soru yazılı çalışır.
   * `audio_choice` bu alanı zorunlu hâle getirir.
   */
  audio?: AudioRef;
};

/** Çoktan seçmeli — tek doğru cevap. */
export type MultipleChoiceQuestion = QuestionBase & {
  type: 'multiple_choice';
  options: Choice[];
  correctOptionId: string;
};

/**
 * Görsel eşleştirme — görselleri metinlerle eşler.
 * Doğru eşleşme çiftin kimliğinden okunur: aynı `id`ye ait görsel ve metin eşleşir.
 */
export type ImageMatchQuestion = QuestionBase & {
  type: 'image_match';
  pairs: ImageMatchPair[];
};

export type ImageMatchPair = {
  id: string;
  image: ImageRef;
  text: string;
};

/** Sıralama — öğeleri doğru sıraya dizme. */
export type OrderingQuestion = QuestionBase & {
  type: 'ordering';
  items: OrderingItem[];
  /** Doğru sıra — `items` öğelerinin kimlikleri, doğru sırayla. */
  correctOrder: string[];
};

export type OrderingItem = {
  id: string;
  text: string;
};

/**
 * Boşluk doldurma.
 *
 * Metin `segments` ile parçalara ayrılır, parçaların arasına boşluklar girer:
 * `segments.length === blanks.length + 1` olmalıdır. Bu kural tipte ifade
 * edilemez; doğrulaması Faz 2'deki içerik kontrolünün işidir.
 *
 * Örnek: segments ["Abdest alırken önce ", " yıkanır."] + 1 boşluk.
 */
export type FillBlankQuestion = QuestionBase & {
  type: 'fill_blank';
  segments: string[];
  blanks: Blank[];
};

export type Blank = {
  id: string;
  /** Kabul edilen cevaplar — eş değerli yazımlar için birden fazla olabilir. */
  correctAnswers: string[];
  /**
   * Doluysa kelime havuzundan seçilir; boşsa klavyeyle yazılır.
   * Çocuk kullanıcıda yazım hatası sorununu önlemek için havuz tercih edilir.
   */
  choices?: string[];
};

/**
 * Sesli tanıma — dinle ve seç.
 *
 * `audio` zorunlu, ama ses dosyası cihazda bulunamayabilir. O durumda
 * `fallbackPrompt` gösterilir ve soru yazılı bir çoktan seçmeliye dönüşür;
 * soru ders akışından çıkarılmaz, böylece ders uzunluğu ve XP sabit kalır.
 */
export type AudioChoiceQuestion = QuestionBase & {
  type: 'audio_choice';
  audio: AudioRef;
  /** Ses çalınamadığında sorunun yerine geçen metin. */
  fallbackPrompt: string;
  options: Choice[];
  correctOptionId: string;
};

/** Doğru / yanlış. */
export type TrueFalseQuestion = QuestionBase & {
  type: 'true_false';
  correctAnswer: boolean;
};

/** Soru — birleşik tip. Ayırt edici alan: `type`. */
export type Question =
  | MultipleChoiceQuestion
  | ImageMatchQuestion
  | OrderingQuestion
  | FillBlankQuestion
  | AudioChoiceQuestion
  | TrueFalseQuestion;

/** Belirli bir soru tipini ismiyle seçmek için yardımcı. */
export type QuestionOfType<T extends QuestionType> = Extract<Question, { type: T }>;

// ── Cevaplar ─────────────────────────────────────────────────────────────────
// Soru bileşenlerinin (Faz 2.2) `onAnswer` geri çağrımıyla ilettiği şekil.
// Doğruluk kontrolü burada değil, ders motorunda yapılır.

export type MultipleChoiceAnswer = {
  questionId: QuestionId;
  type: 'multiple_choice';
  selectedOptionId: string;
};

export type ImageMatchAnswer = {
  questionId: QuestionId;
  type: 'image_match';
  /** Kullanıcının kurduğu eşleşmeler — görselin çifti ile metnin çifti. */
  matches: { imagePairId: string; textPairId: string }[];
};

export type OrderingAnswer = {
  questionId: QuestionId;
  type: 'ordering';
  /** Kullanıcının dizdiği sıra — öğe kimlikleri. */
  order: string[];
};

export type FillBlankAnswer = {
  questionId: QuestionId;
  type: 'fill_blank';
  entries: { blankId: string; value: string }[];
};

export type AudioChoiceAnswer = {
  questionId: QuestionId;
  type: 'audio_choice';
  selectedOptionId: string;
  /** Ses dosyası yokken metin yedeğiyle mi cevaplandı — istatistik için. */
  answeredWithFallback: boolean;
};

export type TrueFalseAnswer = {
  questionId: QuestionId;
  type: 'true_false';
  value: boolean;
};

/** Cevap — birleşik tip. Soru tipiyle aynı ayırt edici alanı taşır. */
export type QuestionAnswer =
  | MultipleChoiceAnswer
  | ImageMatchAnswer
  | OrderingAnswer
  | FillBlankAnswer
  | AudioChoiceAnswer
  | TrueFalseAnswer;

/** Belirli bir soru tipine ait cevabı seçmek için yardımcı. */
export type AnswerOfType<T extends QuestionType> = Extract<QuestionAnswer, { type: T }>;

// ── İçerik dosyası zarfı ─────────────────────────────────────────────────────

/**
 * `/content` altındaki her JSON dosyasının dış kabı.
 *
 * `schemaVersion` — OTA ile gelen içerik eski şemaya aitse ayırt edebilmek için.
 * `isSampleData` — "ÖRNEK VERİ — GERÇEK DEĞİL" işaretinin makine tarafından
 * okunabilir hâli; Faz 2.5'teki yer tutucu taraması bunu arar. Gerçek içerikte
 * `false` olur.
 */
export type ContentEnvelope<T> = {
  /**
   * Dosyayı açan insanın ilk gördüğü not.
   * Örnek veride: "ÖRNEK VERİ — GERÇEK DEĞİL".
   */
  note?: string;
  schemaVersion: number;
  /** Dosyanın üretildiği an (epoch ms). */
  generatedAt?: number;
  isSampleData: boolean;
  data: T;
};

/** Öğrenme yolu içeren içerik dosyası. */
export type LearningPathContent = ContentEnvelope<LearningPath>;

/** Tek bir ünite içeren içerik dosyası. */
export type UnitContent = ContentEnvelope<Unit>;

/** Yol listesindeki bir ünite girdisi — üniteyi kendi dosyasına bağlar. */
export type UnitRef = {
  id: UnitId;
  title: string;
  order: number;
  /** `/content/lessons/` içindeki dosya adı. */
  file: string;
};

/**
 * Öğrenme yolunun diskteki şekli.
 *
 * Üniteler ayrı dosyalarda durur, burada sadece sıraları ve dosya adları tutulur;
 * yeni ünite eklemek var olan dosyalara dokunmadan mümkün olsun diye.
 * Yükleyici dosyaları okuyup birleştirdikten sonraki bellek içi şekil `LearningPath`.
 */
export type LearningPathIndex = {
  id: LearningPathId;
  title: string;
  description: string;
  unitRefs: UnitRef[];
};

/** Yol listesi içeren içerik dosyası. */
export type LearningPathIndexContent = ContentEnvelope<LearningPathIndex>;
