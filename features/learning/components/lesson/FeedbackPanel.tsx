import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { formatString } from '@/lib/formatString';
import { useTheme } from '@/lib/useTheme';

const STATUS_ICON_SIZE = spacing.xl; // 24

type FeedbackPanelProps = {
  correct: boolean;
  /** Doğru cevabın okunabilir parçaları — `describeCorrectAnswer` */
  correctAnswerParts: string[];
  /** Kullanıcının cevabının parçaları — `describeGivenAnswer` */
  givenAnswerParts: string[];
  explanation?: string;
  onContinue: () => void;
};

/** Tek parçaysa tek satır, değilse liste. */
function joinParts(parts: string[]): string {
  return parts.join(' → ');
}

/**
 * Cevap sonrası alt panel: doğru/yanlış, doğru cevap, açıklama, "Devam et".
 *
 * `QuestionShell`'in alt bölümünün YERİNE çiziliyor (kabuğun `footer` prop'u),
 * kardeşi olarak altına değil — kardeş olsaydı kabuğun kendi butonu üstte
 * kalır ve kaydırma alanı iki kez sıçrardı.
 *
 * **Renkler ölçüldü.** Yumuşak dolgu (`successSoft` 1.14 / `errorSoft` 1.18)
 * panelin sınırını ÇİZEMEZ; sınırı 2px `success` (4.63 / 10.05) ve `error`
 * (4.81 / 6.92) kenarlık çiziyor.
 *
 * ⚠️ **Durumu ikonun BİÇİMİ taşıyor**: `success` ile `error` arasında yalnızca
 * 1.04 açık / 1.45 koyu var, yani renk körü biri ikisini ayıramaz.
 * `checkmark-circle` / `close-circle` ayrımı renkten bağımsız çalışıyor.
 * (2.1'in düğüm ikonları ve 2.2a'nın radyo göstergesiyle aynı doktrin.)
 *
 * ⚠️ **Panelde `textMuted` KULLANILMAZ**: `textMuted`/`successSoft` koyu temada
 * **4.16** — AA altı. İkincil satırlar `textSecondary` (7.28 / 7.54).
 * ⚠️ **`borderControl` yumuşak dolgu üzerine çizilmez** (3.19 açık / **2.39
 * koyu**), yani panelin içinde kenarlıklı alt kart olmaz.
 */
export default function FeedbackPanel({
  correct,
  correctAnswerParts,
  givenAnswerParts,
  explanation,
  onContinue,
}: FeedbackPanelProps) {
  const { theme } = useTheme();

  const accent = correct ? theme.success : theme.error;
  const surface = correct ? theme.successSoft : theme.errorSoft;
  const statusWord = correct ? strings.lesson.correct : strings.lesson.incorrect;

  const correctLine = formatString(strings.lesson.correctAnswerIs, {
    answer: joinParts(correctAnswerParts),
  });
  const givenLine = formatString(strings.lesson.yourAnswer, {
    answer: joinParts(givenAnswerParts),
  });

  // Ekran okuyucuya giden tek cümle. Doğruysa kısa; yanlışsa öğretici olan
  // her şey burada.
  const announcement = correct
    ? `${statusWord}.`
    : [`${statusWord}.`, correctLine, explanation].filter(Boolean).join(' ');

  useEffect(() => {
    // Android'de `accessibilityLiveRegion` işi kendiliğinden yapıyor; iOS'ta
    // karşılığı yok. ⚠️ Koruma olmadan Android'de anons ikiye katlanır.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [announcement]);

  return (
    <View style={[styles.panel, { backgroundColor: surface, borderColor: accent }]}>
      {/*
        Karar bloğu tek erişilebilir öğe ve canlı bölge.
        ⚠️ "Devam et" butonu bu bloğun KARDEŞİ — içine alınsaydı `accessible`
        onu yutar ve ekran okuyucu kullanıcısı derste mahsur kalırdı.
      */}
      <View
        accessible
        accessibilityLiveRegion="assertive"
        accessibilityLabel={announcement}
        style={styles.verdict}
      >
        <View style={styles.statusRow}>
          <Ionicons
            name={correct ? 'checkmark-circle' : 'close-circle'}
            size={STATUS_ICON_SIZE}
            color={accent}
          />
          {/* Durum sözcüğü `textPrimary` (11.70 / 11.09). Renkli hâli h3'te
              yasal ama normal metin eşiğini geçmiyor; başlık jetonu küçülürse
              sessizce kırılırdı. Rengi kenarlık ve ikon zaten taşıyor. */}
          <Text style={[textStyles.h4, { color: theme.textPrimary }]}>{statusWord}</Text>
        </View>

        {correct ? null : (
          <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
            {givenAnswerParts.length > 0 ? (
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {givenLine}
              </Text>
            ) : null}

            {correctAnswerParts.length > 0 ? (
              <Text style={[textStyles.bodyStrong, { color: theme.textPrimary }]}>
                {correctLine}
              </Text>
            ) : null}

            {explanation !== undefined && explanation.trim().length > 0 ? (
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {explanation}
              </Text>
            ) : null}
          </ScrollView>
        )}
      </View>

      <Button label={strings.lesson.continueAfterAnswer} onPress={onContinue} size="large" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  verdict: {
    gap: spacing.sm,
    // Uzun bir açıklama paneli büyütüp soruyu ekrandan itmesin.
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detail: {
    flexGrow: 0,
    maxHeight: 160,
  },
  detailContent: {
    gap: spacing.xs,
  },
});
