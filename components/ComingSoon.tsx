import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type ComingSoonProps = {
  icon: IoniconName;
  title: string;
  body: string;
};

/**
 * İlk yayında dolmayacak sekmelerin boş durumu.
 * Namaz ve Kur'an birebir aynı düzeni kullanır; ayrım sadece ikon ve metinde.
 */
export default function ComingSoon({ icon, title, body }: ComingSoonProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <View
        // İkon süsleme; ekran okuyucu atlar, bilgi metinlerde duruyor.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}
      >
        <Ionicons name={icon} size={spacing.xxxl} color={theme.primaryBright} />
      </View>

      <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
        <Text style={[textStyles.labelSmall, { color: theme.onSecondary }]}>
          {strings.common.soon}
        </Text>
      </View>

      <Text style={[textStyles.h4, styles.centeredText, { color: theme.textPrimary }]}>{title}</Text>

      <Text style={[textStyles.bodyMedium, styles.centeredText, { color: theme.textSecondary }]}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    padding: spacing.xl,
    borderRadius: radius.full,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  centeredText: {
    textAlign: 'center',
  },
});
