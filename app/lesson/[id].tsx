import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { describeCorrectAnswer, describeGivenAnswer } from '@/features/learning/answerEngine';
import FeedbackPanel from '@/features/learning/components/lesson/FeedbackPanel';
import LessonCompleteScreen from '@/features/learning/components/lesson/LessonCompleteScreen';
import LessonErrorState from '@/features/learning/components/lesson/LessonErrorState';
import LessonHeader from '@/features/learning/components/lesson/LessonHeader';
import QuestionRenderer from '@/features/learning/components/lesson/QuestionRenderer';
import { findLevelById, getLearningPath } from '@/features/learning/contentLoader';
import {
  findNextLevelId,
  resolveLevelStatus,
  resolveStars,
} from '@/features/learning/levelStatus';
import { useLessonSession } from '@/features/learning/useLessonSession';
import { useLevelProgress } from '@/features/learning/useLevelProgress';
import { useTheme } from '@/lib/useTheme';

import type { Level, LevelId, LevelStatus, StarCount } from '@/types';

/** Haritaya döner. Derin bağlantıyla gelinmişse geri gidilecek yer olmayabilir. */
function goBackToPath() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

/**
 * Haritaya uğramadan bir sonraki derse geçer.
 *
 * ⚠️ **`replace`, `push` DEĞİL.** `push` her derste yığına bir kare eklerdi;
 * on ders üst üste çalışan kullanıcı geri tuşuna bastığında haritaya değil,
 * bitirdiği derslerin içine düşerdi. (`app/placement/index.tsx` aynı gerekçeyi
 * karşılama akışı için taşıyor.)
 *
 * ⚠️ **Nesne biçimi, dizge birleştirme değil** — `typedRoutes` açık ve üretilen
 * `Href` birleşimine dizge birleştirmesi kırılgan oturuyor.
 */
function openLesson(levelId: LevelId) {
  router.replace({ pathname: '/lesson/[id]', params: { id: levelId } });
}

export default function LessonScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const progress = useLevelProgress();
  const level = typeof id === 'string' ? findLevelById(id) : null;
  const status = typeof id === 'string' ? resolveLevelStatus(id, progress) : 'locked';
  const stars = typeof id === 'string' ? resolveStars(id, progress) : 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/*
        ⚠️ iOS'ta kenardan kaydırarak geri gitme VARSAYILAN OLARAK AÇIK ve
        `BackHandler` onu göremiyor — kullanıcı kaydırır, ders sessizce
        kaybolur, çıkış onayı hiç çıkmaz. Seçenek rota dosyasının içinde
        duruyor ki ona bağımlı olan kodun yanında kalsın.
      */}
      <Stack.Screen options={{ gestureEnabled: false }} />

      {/*
        ⚠️ Dört kenarın PAYINI DA bu ekran üstleniyor. Projenin "payları üçe böl"
        kuralı sekme kabuğuna ait (ÜST → TopBar, ALT → sekme çubuğu); dersin ne
        TopBar'ı ne sekme çubuğu var. `Screen` bileşeni kullanılmıyor çünkü o
        koşulsuz TopBar çiziyor ve ders odaklanmış bir bağlam.
      */}
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
        <View style={styles.content}>
          {level === null ? (
            <LessonErrorState title={strings.errors.notFound} onBack={goBackToPath} />
          ) : status === 'locked' ? (
            // Yalnızca derin bağlantıda tetiklenir (haritada kilitli düğüm zaten
            // basılamıyor) — ama `scheme: "dualingo"` yüzünden erişilebilir ve
            // Faz 2.4'ün kilit mantığını atlatmasına izin verilemez.
            <LessonErrorState
              title={strings.learn.lockedLevel}
              body={strings.learn.lockedLevelHint}
              onBack={goBackToPath}
            />
          ) : (
            /*
              ⚠️ `key` bir tazelik güvencesi: "Sonraki ders" aynı rotaya
              `replace` yapıyor. Bugün React Navigation yeni bir rota anahtarı
              üretip ekranı yeniden monte ediyor, ama oturum durumu tembel bir
              ilklendiriciye bağlı — o varsayım bir gün değişirse kullanıcı yeni
              derste ESKİ dersin sorularını görürdü. `key` bunu yapısal olarak
              imkânsız kılıyor. (Soru bileşenlerine `key={question.id}` verme
              kararının aynısı.)
            */
            <LessonFlow
              key={level.id}
              level={level}
              previousStatus={status}
              previousStars={stars}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

type LessonFlowProps = {
  level: Level;
  previousStatus: LevelStatus;
  previousStars: StarCount;
};

/**
 * Asıl akış. Ayrı bir bileşen çünkü `useLessonSession` bir seviye gerektiriyor;
 * yukarıdaki koşullar kancaları koşullu çağırmaya zorlardı.
 */
function LessonFlow({ level, previousStatus, previousStars }: LessonFlowProps) {
  /*
    ⚠️ `previousStatus` ve `previousStars` CANLI değerler — ders bitince ikisi de
    değişir. Sorun olmamasının sebebi kancanın onları yalnızca ilk çizimde
    okuması; ayrıca `useState`e sarmak ikinci bir donma noktası açar ve
    yanıltıcı olur. Gerekçenin tamamı `useLessonSession` içinde.
  */
  const session = useLessonSession(level, previousStatus, previousStars);

  // Ders bittikten sonraki hedef. `progress` burada CANLI okunmalı: sonraki
  // seviyeyi `completeLevel` az önce açtı, oturum başındaki fotoğrafta o kayıt
  // henüz `locked` görünürdü ve buton hiç çıkmazdı.
  const progress = useLevelProgress();
  const nextLevelId = findNextLevelId(getLearningPath().units, progress, level.id);

  const confirmQuit = useCallback(() => {
    Alert.alert(strings.lesson.quitTitle, strings.lesson.quitMessage, [
      { text: strings.lesson.quitCancel, style: 'cancel' },
      { text: strings.lesson.quitConfirm, style: 'destructive', onPress: goBackToPath },
    ]);
  }, []);

  // Android donanım geri tuşu. ⚠️ RN 0.81'de çağrı bir abonelik döndürüyor;
  // `BackHandler.removeEventListener` kaldırıldı.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        // Ders bittiyse kaybedilecek bir şey yok, geri tuşu doğal işini yapsın.
        if (session.phase === 'complete') {
          return false;
        }
        confirmQuit();
        return true;
      });
      return () => subscription.remove();
    }, [confirmQuit, session.phase]),
  );

  if (session.total === 0) {
    // Seviyede hiç soru yok ya da hepsi cevaplanamaz çıktı.
    return <LessonErrorState title={strings.errors.contentLoadFailed} onBack={goBackToPath} />;
  }

  if (session.phase === 'complete' && session.summary !== null) {
    return (
      <LessonCompleteScreen
        summary={session.summary}
        questions={level.questions}
        onDone={goBackToPath}
        onNext={nextLevelId === null ? null : () => openLesson(nextLevelId)}
      />
    );
  }

  const question = session.question;
  if (question === null) {
    return <LessonErrorState title={strings.errors.contentLoadFailed} onBack={goBackToPath} />;
  }

  const isAnswered = session.phase === 'feedback';
  const lastResult = session.lastResult;

  return (
    <>
      <LessonHeader
        answered={session.answeredCount}
        total={session.total}
        onClose={confirmQuit}
      />

      <QuestionRenderer
        question={question}
        isAnswered={isAnswered}
        onAnswer={session.submitAnswer}
        footer={
          isAnswered && lastResult !== null ? (
            <FeedbackPanel
              correct={lastResult.correct}
              correctAnswerParts={describeCorrectAnswer(question)}
              givenAnswerParts={describeGivenAnswer(question, lastResult.answer)}
              explanation={question.explanation}
              onContinue={session.advance}
            />
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    // `screenPaddingVertical` (24) değil: başlık satırı ve kabuğun alt bölümü
    // kendi nefes paylarını taşıyor.
    paddingVertical: spacing.md,
  },
});
