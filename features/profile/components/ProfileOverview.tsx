import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useAccountStore } from '@/features/account/store';
import { useProgressStore } from '@/features/progress/store';
import { useTheme } from '@/lib/useTheme';

import type { User } from '@supabase/supabase-js';
import type { ComponentProps } from 'react';

type ProfileIdentity = {
  name: string;
  detail: string;
};

function metadataName(user: User): string | null {
  const metadata: unknown = user.user_metadata;
  if (typeof metadata !== 'object' || metadata === null) {
    return null;
  }

  const fields = metadata as Record<string, unknown>;
  for (const key of ['display_name', 'full_name', 'name']) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

function resolveIdentity(user: User | null): ProfileIdentity {
  if (user === null) {
    return { name: strings.profile.guestName, detail: strings.profile.localProfile };
  }

  const name = metadataName(user) ?? user.email ?? strings.profile.guestName;
  const detail = name !== user.email && user.email !== undefined
    ? user.email
    : strings.profile.connectedProfile;
  return { name, detail };
}

/** Profilin varsayılan özeti; yalnız gerçek hesap ve ilerleme verisini gösterir. */
export default function ProfileOverview() {
  const { theme } = useTheme();
  const user = useAccountStore((state) => state.user);
  const xpTotal = useProgressStore((state) => state.xpTotal);
  const streakDays = useProgressStore((state) => state.streak.currentDays);
  const earnedBadges = useProgressStore((state) => state.badges.length);
  const completedLevels = useProgressStore(
    (state) =>
      Object.values(state.levels).filter(
        (level) => level.status === 'completed' && level.deletedAt === null,
      ).length,
  );

  const identity = resolveIdentity(user);
  const initial = Array.from(identity.name)[0]?.toLocaleUpperCase('tr-TR') ?? '•';
  const stats: readonly {
    id: string;
    label: string;
    value: number;
    icon: ComponentProps<typeof Ionicons>['name'];
    background: string;
  }[] = [
    {
      id: 'xp',
      label: strings.progress.totalXp,
      value: xpTotal,
      icon: 'sparkles',
      background: theme.secondarySoft,
    },
    {
      id: 'streak',
      label: strings.progress.streak,
      value: streakDays,
      icon: 'flame',
      background: theme.primarySoft,
    },
    {
      id: 'badges',
      label: strings.profile.earnedBadges,
      value: earnedBadges,
      icon: 'ribbon',
      background: theme.successSoft,
    },
    {
      id: 'levels',
      label: strings.profile.completedLevels,
      value: completedLevels,
      icon: 'checkmark-circle',
      background: theme.surfaceAlt,
    },
  ];

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.identityCard,
          theme.elevation.card,
          { backgroundColor: theme.surface, borderColor: theme.textPrimary },
        ]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.avatar,
            { backgroundColor: theme.primaryBright, borderColor: theme.textPrimary },
          ]}
        >
          <Text style={[textStyles.h2, { color: theme.textPrimary }]}>{initial}</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
            {identity.name}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {identity.detail}
          </Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
        {strings.profile.achievementsTitle}
      </Text>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View
            key={stat.id}
            accessibilityLabel={`${stat.label}: ${stat.value}`}
            style={[
              styles.statCard,
              { backgroundColor: stat.background, borderColor: theme.textPrimary },
            ]}
          >
            <Ionicons name={stat.icon} size={spacing.xl} color={theme.textPrimary} />
            <Text style={[textStyles.h3, { color: theme.textPrimary }]}>{stat.value}</Text>
            <Text style={[textStyles.labelSmall, styles.statLabel, { color: theme.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  identityCard: {
    minHeight: layout.minTouchTarget * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  avatar: {
    width: layout.minTouchTarget + spacing.lg,
    height: layout.minTouchTarget + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: componentRadius.button,
  },
  identityCopy: { flex: 1, gap: spacing.xs },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '48%',
    minHeight: layout.minTouchTarget * 2,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  statLabel: { flexShrink: 1 },
});
