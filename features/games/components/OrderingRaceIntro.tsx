import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { componentRadius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type OrderingRaceIntroProps = {
  title: string;
  description: string;
  onStart: () => void;
};

const rules = [
  { icon: 'timer-outline', text: strings.games.orderingRaceDurationRule },
  { icon: 'trophy-outline', text: strings.games.orderingRaceScoreRule },
  { icon: 'refresh-outline', text: strings.games.orderingRaceNoPenaltyRule },
] as const;

export default function OrderingRaceIntro({
  title,
  description,
  onStart,
}: OrderingRaceIntroProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.heroIcon, { backgroundColor: theme.secondarySoft }]}>
        <Ionicons name="trophy" size={spacing.huge} color={theme.secondaryStrong} />
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[textStyles.h2, { color: theme.textPrimary }]}>
          {title || strings.games.orderingRaceTitle}
        </Text>
        <Text style={[textStyles.h4, { color: theme.textSecondary }]}>
          {strings.games.orderingRaceIntroTitle}
        </Text>
        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>
          {strings.games.orderingRaceIntroBody}
        </Text>
        <Text style={[textStyles.caption, { color: theme.textMuted }]}>{description}</Text>
      </View>

      <View style={[styles.rules, { backgroundColor: theme.surface, borderColor: theme.borderControl }]}>
        {rules.map((rule) => (
          <View key={rule.text} style={styles.ruleRow}>
            <Ionicons name={rule.icon} size={spacing.xl} color={theme.primary} />
            <Text style={[textStyles.bodyMedium, styles.ruleText, { color: theme.textPrimary }]}>
              {rule.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.notice, { backgroundColor: theme.secondarySoft }]}>
        <Ionicons name="flask-outline" size={spacing.lg} color={theme.textSecondary} />
        <Text style={[textStyles.caption, styles.ruleText, { color: theme.textSecondary }]}>
          {strings.games.orderingRaceSampleNotice}
        </Text>
      </View>

      <Button
        fullWidth
        label={strings.games.orderingRaceStart}
        onPress={onStart}
        size="large"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch', gap: spacing.xl },
  heroIcon: {
    width: spacing.huge + spacing.xxl,
    height: spacing.huge + spacing.xxl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.modal,
  },
  copy: { alignItems: 'center', gap: spacing.sm },
  rules: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ruleText: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: componentRadius.card,
  },
});
