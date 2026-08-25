import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

type PrayerActionGridProps = {
  onGarden: () => void;
  onChart: () => void;
  onNotifications: () => void;
  onQibla: () => void;
};

export default function PrayerActionGrid({
  onGarden,
  onChart,
  onNotifications,
  onQibla,
}: PrayerActionGridProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[textStyles.h4, { color: theme.textPrimary }]}> 
        {strings.prayer.quickActions}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={onGarden}
        style={({ pressed }) => [
          styles.garden,
          theme.elevation.card,
          {
            backgroundColor: pressed ? theme.gardenGround : theme.surfaceGlass,
            borderColor: theme.success,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}> 
          <Ionicons name="leaf" size={spacing.xl} color={theme.success} />
        </View>
        <View style={styles.copy}>
          <Text style={[textStyles.h4, { color: theme.textPrimary }]}> 
            {strings.prayer.gardenTitle}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}> 
            {strings.prayer.gardenEntryBody}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={spacing.xl} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.grid}>
        <ActionCard icon="calendar-outline" label={strings.prayer.chartTitle} onPress={onChart} />
        <ActionCard icon="notifications-outline" label={strings.prayer.notificationsTitle} onPress={onNotifications} />
        <ActionCard icon="compass-outline" label={strings.prayer.qiblaTitle} onPress={onQibla} />
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: pressed ? theme.primarySoft : theme.surfaceGlass,
          borderColor: theme.borderControl,
        },
      ]}
    >
      <Ionicons name={icon} size={spacing.xl} color={theme.primary} />
      <Text style={[textStyles.labelLarge, styles.actionLabel, { color: theme.textPrimary }]}> 
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  garden: {
    minHeight: layout.minTouchTarget + spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.cardPadding,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  iconCircle: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  copy: { flex: 1, gap: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: {
    minWidth: layout.minTouchTarget * 2,
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  actionLabel: { textAlign: 'center' },
});
