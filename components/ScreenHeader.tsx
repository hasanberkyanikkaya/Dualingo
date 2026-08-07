import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type ScreenHeaderProps = {
  title: string;
  /** Başlığın altındaki açıklama satırı — opsiyonel */
  subtitle?: string;
};

/** Ekranın üstündeki başlık bloğu. Metin bileşene gömülmez, prop olarak gelir. */
export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { theme } = useTheme();

  return (
    <View>
      <Text accessibilityRole="header" style={[textStyles.h2, { color: theme.textPrimary }]}>
        {title}
      </Text>

      {subtitle !== undefined ? (
        <Text style={[textStyles.bodyMedium, styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: spacing.xs,
  },
});
