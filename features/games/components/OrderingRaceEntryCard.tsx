import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type OrderingRaceEntryCardProps = {
  onPress: () => void;
};

export default function OrderingRaceEntryCard({ onPress }: OrderingRaceEntryCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.secondarySoft, borderColor: theme.secondaryStrong }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: theme.secondary }]}>
          <Ionicons name="trophy" size={spacing.xl} color={theme.onSecondary} />
        </View>
        <View style={styles.copy}>
          <Text style={[textStyles.h4, { color: theme.textPrimary }]}>
            {strings.games.orderingRaceTitle}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {strings.games.orderingRaceEntryBody}
          </Text>
        </View>
      </View>
      <Button
        fullWidth
        label={strings.games.orderingRaceOpen}
        onPress={onPress}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: spacing.xxxl,
    height: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  copy: { flex: 1, gap: spacing.xs },
});
