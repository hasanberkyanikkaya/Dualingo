import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type LessonErrorStateProps = {
  title: string;
  body?: string;
  onBack: () => void;
};

/**
 * Ders açılamadığında görünen ekran: bilinmeyen kimlik, kilitli seviye, boş
 * seviye ya da bütün soruların cevaplanamaz çıkması.
 *
 * ⚠️ Dördünün de ortak noktası: **asla boş ekran ve asla sonsuza dek pasif bir
 * "Kontrol et" bırakma.** CLAUDE.md'deki tuzağın tarifi "dersten çıkış yok"tu;
 * buradaki geri butonu o çıkışı koşulsuz sağlıyor.
 */
export default function LessonErrorState({ title, body, onBack }: LessonErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <Text style={[textStyles.h3, styles.centered, { color: theme.textPrimary }]}>{title}</Text>

      {body !== undefined ? (
        <Text style={[textStyles.bodyMedium, styles.centered, { color: theme.textSecondary }]}>
          {body}
        </Text>
      ) : null}

      <Button label={strings.result.backToPath} onPress={onBack} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
});
