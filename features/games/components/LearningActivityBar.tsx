import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

import type { ComponentProps } from 'react';

type LearningActivityBarProps = {
  onOpenOrderingRace: () => void;
  showHeading?: boolean;
};

type LearningActivity = {
  id: string;
  title: string;
  body: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export default function LearningActivityBar({
  onOpenOrderingRace,
  showHeading = true,
}: LearningActivityBarProps) {
  const { theme } = useTheme();
  const activities: readonly LearningActivity[] = [
    {
      id: 'ordering-race',
      title: strings.games.orderingRaceTitle,
      body: strings.games.orderingRaceEntryBody,
      icon: 'trophy',
      onPress: onOpenOrderingRace,
    },
  ];

  return (
    <View style={styles.root}>
      {showHeading ? (
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[textStyles.h4, { color: theme.textPrimary }]}>
            {strings.games.activityBarTitle}
          </Text>
          <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
            {strings.games.activityBarBody}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.activities}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {activities.map((activity) => (
          <Pressable
            key={activity.id}
            accessibilityRole="button"
            onPress={activity.onPress}
            style={({ pressed }) => [
              styles.activity,
              {
                backgroundColor: pressed ? theme.secondary : theme.secondarySoft,
                borderColor: theme.secondaryStrong,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: theme.secondary }]}>
              <Ionicons name={activity.icon} size={spacing.xl} color={theme.onSecondary} />
            </View>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={[textStyles.labelLarge, { color: theme.textPrimary }]}>
                {activity.title}
              </Text>
              <Text numberOfLines={2} style={[textStyles.caption, { color: theme.textSecondary }]}>
                {activity.body}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={spacing.xl} color={theme.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  heading: { gap: spacing.xs },
  activities: { gap: spacing.md, paddingRight: spacing.lg },
  activity: {
    width: layout.minTouchTarget * 6,
    minHeight: layout.minTouchTarget * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: componentRadius.card,
  },
  icon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
  copy: { flex: 1, gap: spacing.xs },
});
