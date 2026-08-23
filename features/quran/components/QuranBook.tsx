import { useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { pageTurnMotion, timing } from '@/constants/motion';
import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranBookPage from '@/features/quran/components/QuranBookPage';
import QuranIconButton from '@/features/quran/components/QuranIconButton';
import { formatString } from '@/lib/formatString';

import type { QuranPage, QuranReaderFontSize, QuranVerseKey } from '@/types';

type QuranBookProps = {
  page: QuranPage;
  focusVerseKey: QuranVerseKey;
  pageCount: number;
  fontSize: QuranReaderFontSize;
  showTranslation: boolean;
  onRequestPage: (pageNumber: number) => boolean;
  onVisibleVerses: (keys: readonly QuranVerseKey[]) => void;
};

type PendingPage = { page: QuranPage; focusVerseKey: QuranVerseKey };

export default function QuranBook({
  page,
  focusVerseKey,
  pageCount,
  fontSize,
  showTranslation,
  onRequestPage,
  onVisibleVerses,
}: QuranBookProps) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState<PendingPage>({ page, focusVerseKey });
  const [outgoing, setOutgoing] = useState<PendingPage | null>(null);
  const [incoming, setIncoming] = useState<PendingPage | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [turning, setTurning] = useState(false);
  const pending = useRef<PendingPage | null>(null);
  const requestLocked = useRef(false);
  const requestRef = useRef<(target: number) => void>(() => undefined);
  const currentPageNumberRef = useRef(page.pageNumber);
  const progress = useSharedValue(0);

  const finishTurn = useCallback(() => {
    const next = pending.current;
    if (next !== null) {
      setDisplayed(next);
    }
    pending.current = null;
    setOutgoing(null);
    setIncoming(null);
    setTurning(false);
    requestLocked.current = false;
    progress.value = 0;
  }, [progress]);

  useEffect(() => {
    if (page.pageNumber === displayed.page.pageNumber) {
      if (focusVerseKey !== displayed.focusVerseKey) {
        setDisplayed({ page, focusVerseKey });
      }
      requestLocked.current = false;
      return;
    }

    const next = { page, focusVerseKey };
    if (reduceMotion) {
      setDisplayed(next);
      requestLocked.current = false;
      return;
    }

    pending.current = next;
    setDirection(page.pageNumber > displayed.page.pageNumber ? 1 : -1);
    setOutgoing(displayed);
    setIncoming(next);
    setTurning(true);
    progress.value = 0;
    progress.value = withTiming(1, timing.pageTurn, (finished) => {
      if (finished) {
        runOnJS(finishTurn)();
      }
    });
  }, [displayed, finishTurn, focusVerseKey, page, progress, reduceMotion]);

  function requestPage(target: number): void {
    if (requestLocked.current || turning || target < 1 || target > pageCount) {
      return;
    }
    requestLocked.current = true;
    if (!onRequestPage(target)) {
      requestLocked.current = false;
    }
  }

  requestRef.current = requestPage;
  currentPageNumberRef.current = incoming?.page.pageNumber ?? displayed.page.pageNumber;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > spacing.xl && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > layout.minTouchTarget) {
          requestRef.current(currentPageNumberRef.current + 1);
        } else if (gesture.dx < -layout.minTouchTarget) {
          requestRef.current(currentPageNumberRef.current - 1);
        }
      },
    }),
  ).current;

  const outgoingStyle = useAnimatedStyle(() => {
    const degrees = interpolate(
      progress.value,
      [0, 0.52],
      [0, direction * pageTurnMotion.angle],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(progress.value, [0, 0.5, 0.51], [1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: pageTurnMotion.perspective },
        { rotateY: `${degrees}deg` },
      ],
    };
  });

  const incomingStyle = useAnimatedStyle(() => {
    const degrees = interpolate(
      progress.value,
      [0.48, 1],
      [-direction * pageTurnMotion.angle, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(progress.value, [0.49, 0.5, 1], [0, 1, 1], Extrapolation.CLAMP),
      transform: [
        { perspective: pageTurnMotion.perspective },
        { rotateY: `${degrees}deg` },
      ],
    };
  });

  const currentPage = incoming?.page ?? displayed.page;

  return (
    <View style={styles.root}>
      <View style={styles.bookShadow} {...panResponder.panHandlers}>
        <View style={styles.cover}>
          <View style={styles.pageStack} />
          <View style={styles.pageWindow}>
            {turning && outgoing !== null && incoming !== null ? (
              <>
                <Animated.View pointerEvents="none" style={[styles.animatedPage, incomingStyle]}>
                  <QuranBookPage
                    focusVerseKey={incoming.focusVerseKey}
                    fontSize={fontSize}
                    onVisibleVerses={onVisibleVerses}
                    page={incoming.page}
                    showTranslation={showTranslation}
                    trackVisibility={false}
                  />
                </Animated.View>
                <Animated.View pointerEvents="none" style={[styles.animatedPage, outgoingStyle]}>
                  <QuranBookPage
                    focusVerseKey={outgoing.focusVerseKey}
                    fontSize={fontSize}
                    onVisibleVerses={onVisibleVerses}
                    page={outgoing.page}
                    showTranslation={showTranslation}
                    trackVisibility={false}
                  />
                </Animated.View>
              </>
            ) : (
              <QuranBookPage
                focusVerseKey={displayed.focusVerseKey}
                fontSize={fontSize}
                onVisibleVerses={onVisibleVerses}
                page={displayed.page}
                showTranslation={showTranslation}
                trackVisibility
              />
            )}
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <View style={styles.navigationAction}>
          <QuranIconButton
            accessibilityLabel={strings.a11y.quranPreviousPage}
            disabled={turning || currentPage.pageNumber <= 1}
            icon="arrow-back"
            onPress={() => requestPage(currentPage.pageNumber - 1)}
          />
          <Text style={[textStyles.labelSmall, { color: quranTheme.textMuted }]}>
            {strings.quran.previousPage}
          </Text>
        </View>

        <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
          {formatString(strings.quran.page, { number: currentPage.pageNumber })}
        </Text>

        <View style={styles.navigationAction}>
          <QuranIconButton
            accessibilityLabel={strings.a11y.quranNextPage}
            disabled={turning || currentPage.pageNumber >= pageCount}
            icon="arrow-forward"
            onPress={() => requestPage(currentPage.pageNumber + 1)}
          />
          <Text style={[textStyles.labelSmall, { color: quranTheme.textMuted }]}>
            {strings.quran.nextPage}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.sm,
  },
  bookShadow: {
    flex: 1,
    borderRadius: componentRadius.card,
    shadowColor: quranTheme.bookShadow,
    shadowOffset: { width: 0, height: spacing.sm },
    shadowOpacity: 0.52,
    shadowRadius: spacing.lg,
    elevation: 10,
  },
  cover: {
    flex: 1,
    padding: spacing.xs,
    paddingLeft: spacing.sm,
    backgroundColor: quranTheme.bookCover,
    borderWidth: 1,
    borderColor: quranTheme.bookGold,
    borderRadius: componentRadius.card,
  },
  pageStack: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.none,
    bottom: spacing.sm,
    width: spacing.sm,
    backgroundColor: quranTheme.paperEdge,
    borderTopRightRadius: componentRadius.card,
    borderBottomRightRadius: componentRadius.card,
  },
  pageWindow: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: componentRadius.card,
    backgroundColor: quranTheme.paper,
  },
  animatedPage: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    backgroundColor: quranTheme.paper,
  },
  navigation: {
    minHeight: layout.minTouchTarget + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navigationAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
