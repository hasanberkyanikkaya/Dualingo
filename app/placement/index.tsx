import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { describeCorrectAnswer, describeGivenAnswer } from '@/features/learning/answerEngine';
import FeedbackPanel from '@/features/learning/components/lesson/FeedbackPanel';
import LessonErrorState from '@/features/learning/components/lesson/LessonErrorState';
import LessonHeader from '@/features/learning/components/lesson/LessonHeader';
import QuestionRenderer from '@/features/learning/components/lesson/QuestionRenderer';
import {
  findUnitByLevelId,
  getLearningPath,
  getPlacementQuestions,
} from '@/features/learning/contentLoader';
import DifficultyStep from '@/features/onboarding/components/DifficultyStep';
import GoalStep from '@/features/onboarding/components/GoalStep';
import PlacementResultStep from '@/features/onboarding/components/PlacementResultStep';
import WelcomeStep from '@/features/onboarding/components/WelcomeStep';
import { useSetDailyGoal, useSetPlacement } from '@/features/onboarding/usePlacement';
import { usePlacementSession } from '@/features/onboarding/usePlacementSession';
import { findEntryLevelId, resolvePlacementDifficulty } from '@/features/progress/placement';
import { useTheme } from '@/lib/useTheme';

import type { DailyGoal, Difficulty } from '@/types';

/**
 * Karşılama ve seviye tespit akışı — **tek rota, çok fazlı**.
 *
 * Adımlar ayrı rotalara bölünmedi: yarım kalmış bir sınavın üstünde geri gitmek
 * ya sınavı sıfırlar ya da yığında ölü bir ekran bırakır. Ders ekranı da aynı
 * sebeple tek rota içinde faz değiştiriyor.
 *
 * Kabuk `app/lesson/[id].tsx`ten alındı, gerekçeleri de aynı: `Screen`
 * kullanılmıyor (koşulsuz `TopBar` çiziyor, burası odaklanmış bir bağlam), dört
 * kenarın güvenli alan payını bu ekran üstleniyor, kaydırma jesti kapalı.
 */

type Step = 'welcome' | 'choose' | 'test' | 'result' | 'goal';

/** Sınav sonucunun ekrana taşınan hâli. */
type Outcome = {
  difficulty: Difficulty;
  correct: number;
  total: number;
  /** Başlanacak ünitenin adı — bulunamazsa `null`. */
  unitTitle: string | null;
};

/**
 * Sonucu sonuç ekranının anlayacağı şekle çevirir.
 *
 * ⚠️ Kademe kararı burada **yeniden hesaplanıyor** ama ikinci bir kural
 * yazılmıyor: store'un çağırdığı `resolvePlacementDifficulty`'nin aynısı, aynı
 * girdilerle. Alternatif store'a yazıp geri okumaktı; o da yazma ile okuma
 * arasına bir çizim koyup sonuç ekranını bir kare eski değerle gösterirdi.
 */
function buildOutcome(declared: Difficulty, correct: number, total: number): Outcome {
  const difficulty = resolvePlacementDifficulty(declared, correct, total);
  const entryId = findEntryLevelId(getLearningPath().units, difficulty);

  return {
    difficulty,
    correct,
    total,
    unitTitle: entryId === null ? null : (findUnitByLevelId(entryId)?.title ?? null),
  };
}

/** Akışın bittiği yer. */
function leave(isRetake: boolean) {
  if (isRetake && router.canGoBack()) {
    router.back();
    return;
  }

  // ⚠️ `replace`, `push` değil: karşılama akışı yığında kalırsa kullanıcı
  // haritadan geri tuşuyla sınava geri düşer.
  router.replace('/');
}

export default function PlacementScreen() {
  const { theme } = useTheme();
  const { retake } = useLocalSearchParams<{ retake?: string }>();
  const isRetake = retake === '1';

  const setDailyGoal = useSetDailyGoal();
  const setPlacement = useSetPlacement();

  // Tekrar akışında karşılama atlanıyor: kullanıcı zaten uygulamanın içinde ve
  // profilden bilerek geldi.
  const [step, setStep] = useState<Step>(isRetake ? 'choose' : 'welcome');
  const [declared, setDeclared] = useState<Difficulty>('beginner');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const finish = useCallback((tier: Difficulty, correct: number, total: number) => {
    setOutcome(buildOutcome(tier, correct, total));
    setStep('result');
  }, []);

  const handleSkip = useCallback(() => {
    // Sınav yok: `total = 0` beyanı olduğu gibi kabul ettiriyor
    // (`resolvePlacementDifficulty`). Ayrı bir store eylemine gerek kalmıyor.
    setPlacement('beginner', 0, 0);
    setDeclared('beginner');
    finish('beginner', 0, 0);
  }, [finish, setPlacement]);

  const handleGoal = useCallback(
    (goal: DailyGoal | null) => {
      if (goal !== null) {
        setDailyGoal(goal);
      }
      leave(isRetake);
    },
    [isRetake, setDailyGoal],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/*
        ⚠️ iOS'ta kenardan kaydırarak geri gitme varsayılan olarak açık ve
        `BackHandler` onu göremiyor. Burada bedeli dersinkinden ağır: ilk
        açılışta `placement` hâlâ `null` olur, kapı kullanıcıyı bu ekrana geri
        yollar ve akış baştan başlar.
      */}
      <Stack.Screen options={{ gestureEnabled: false }} />

      {/*
        Dört kenarın payını da bu ekran üstleniyor: ne `TopBar` var ne sekme
        çubuğu (kapı, sekmeler çizilmeden önce buraya yönlendiriyor).
      */}
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
        <View style={styles.content}>
          {step === 'welcome' ? (
            <WelcomeStep onStart={() => setStep('choose')} />
          ) : step === 'choose' ? (
            <DifficultyStep
              onStart={(difficulty) => {
                setDeclared(difficulty);
                setStep('test');
              }}
              secondaryLabel={
                isRetake ? strings.common.cancel : strings.onboarding.levelTestSkip
              }
              // ⚠️ Tekrar akışında "en baştan başla" YOK: yolun ortasındaki bir
              // kullanıcıyı kendi isteği dışında başa çekerdi. Orada bu buton
              // vazgeçme yolu — üstelik jest kapalı olduğu için tek çıkış.
              onSecondary={isRetake ? () => leave(true) : handleSkip}
            />
          ) : step === 'test' ? (
            <PlacementTest declared={declared} onQuit={() => setStep('choose')} onFinish={finish} />
          ) : step === 'result' && outcome !== null ? (
            <PlacementResultStep
              difficulty={outcome.difficulty}
              declared={declared}
              correct={outcome.correct}
              total={outcome.total}
              unitTitle={outcome.unitTitle}
              onContinue={() => setStep('goal')}
            />
          ) : (
            <GoalStep onDone={handleGoal} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

type PlacementTestProps = {
  declared: Difficulty;
  /** Sınavdan çıkıldı — kademe seçimine dönülür, sonuç YAZILMAZ. */
  onQuit: () => void;
  onFinish: (declared: Difficulty, correct: number, total: number) => void;
};

/**
 * Sınavın kendisi. Ayrı bir bileşen çünkü `usePlacementSession` bir soru listesi
 * gerektiriyor; yukarıdaki faz dallanması kancayı koşullu çağırmaya zorlardı.
 * (`app/lesson/[id].tsx`teki `LessonFlow` deseninin aynısı.)
 */
function PlacementTest({ declared, onQuit, onFinish }: PlacementTestProps) {
  // Havuz bir kez okunuyor: soru listesi oturum boyunca sabit kalmalı, yoksa
  // `useReducer`'ın ilklendiricisiyle ekranın gördüğü liste ayrışır.
  const [questions] = useState(() => getPlacementQuestions(declared));
  const session = usePlacementSession(questions, declared);

  const confirmQuit = useCallback(() => {
    Alert.alert(strings.onboarding.quitTitle, strings.onboarding.quitMessage, [
      { text: strings.onboarding.quitCancel, style: 'cancel' },
      { text: strings.onboarding.quitConfirm, style: 'destructive', onPress: onQuit },
    ]);
  }, [onQuit]);

  // ⚠️ RN 0.81'de çağrı bir abonelik döndürüyor; `removeEventListener` kaldırıldı.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmQuit();
        return true;
      });
      return () => subscription.remove();
    }, [confirmQuit]),
  );

  /**
   * "Devam et" — sonuncusuysa sınavı bitirir.
   *
   * ⚠️ Sonucun store'a YAZILMASI `usePlacementSession.advance` içinde oluyor;
   * burada yalnızca ekran ilerliyor. İkisi ayrı: yazma kararı "son cevap
   * kesinleşti" anına ait, ekran geçişi bir sonraki kareye.
   *
   * ⚠️ Bitiş `useEffect` ile YAKALANMIYOR — `reactCompiler` + StrictMode
   * etkileri iki kez çalıştırıyor (Oturum 2.3 kararı).
   */
  const handleAdvance = useCallback(() => {
    const isLast = session.phase === 'feedback' && session.answeredCount >= session.total;
    const { correct, total } = session;

    session.advance();

    if (isLast) {
      onFinish(declared, correct, total);
    }
  }, [declared, onFinish, session]);

  if (session.total === 0) {
    /**
     * Bu kademenin havuzu boş ya da tüm sorular cevaplanamaz çıktı. Sınav
     * yapılamıyor ama akış kilitlenmemeli — kullanıcı kademe seçimine döner ve
     * oradan "en baştan başla" ile çıkabilir. (`contentValidation` bu durumu
     * yayın öncesi uyarı olarak da bildiriyor.)
     */
    return (
      <LessonErrorState
        title={strings.errors.contentLoadFailed}
        body={strings.onboarding.levelTestSkipped}
        onBack={onQuit}
      />
    );
  }

  const question = session.question;
  if (question === null) {
    return <LessonErrorState title={strings.errors.contentLoadFailed} onBack={onQuit} />;
  }

  const isAnswered = session.phase === 'feedback';
  const lastResult = session.lastResult;

  return (
    <>
      <LessonHeader answered={session.answeredCount} total={session.total} onClose={confirmQuit} />

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
              onContinue={handleAdvance}
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
    // `screenPaddingVertical` (24) değil: adımların kendi nefes payları var.
    paddingVertical: spacing.md,
  },
});
