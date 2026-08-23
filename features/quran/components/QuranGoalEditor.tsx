import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import QuranButton from '@/features/quran/components/QuranButton';
import {
  validateQuranGoalInput,
  type QuranGoalValidationIssue,
} from '@/features/quran/goalEngine';
import {
  formatQuranReminderTime,
  parseQuranReminderTime,
} from '@/features/quran/goalReminder';
import { addDays } from '@/features/progress/streak';
import { formatString } from '@/lib/formatString';

import type { QuranGoal, QuranGoalInput, QuranGoalType } from '@/types';

type SaveResult = { saved: boolean; issues: QuranGoalValidationIssue[] };

type QuranGoalEditorProps = {
  goal: QuranGoal | null;
  today: string;
  onSave: (input: QuranGoalInput) => Promise<SaveResult>;
};

const goalTypes: readonly {
  type: QuranGoalType;
  icon: 'today-outline' | 'calendar-outline' | 'flag-outline';
  title: string;
  body: string;
}[] = [
  {
    type: 'daily_pages',
    icon: 'today-outline',
    title: strings.quran.goalDailyTitle,
    body: strings.quran.goalDailyBody,
  },
  {
    type: 'monthly_juz',
    icon: 'calendar-outline',
    title: strings.quran.goalMonthlyTitle,
    body: strings.quran.goalMonthlyBody,
  },
  {
    type: 'finish_by_date',
    icon: 'flag-outline',
    title: strings.quran.goalFinishTitle,
    body: strings.quran.goalFinishBody,
  },
];

function issueText(issue: QuranGoalValidationIssue, type: QuranGoalType): string {
  if (issue === 'invalid_target_value') {
    return type === 'monthly_juz'
      ? strings.quran.goalValidationMonthlyAmount
      : strings.quran.goalValidationDailyAmount;
  }
  if (issue === 'invalid_target_date') {
    return strings.quran.goalValidationDate;
  }
  if (issue === 'invalid_reminder_time') {
    return strings.quran.goalValidationTime;
  }
  return strings.quran.goalSaveFailed;
}

export default function QuranGoalEditor({ goal, today, onSave }: QuranGoalEditorProps) {
  const [type, setType] = useState<QuranGoalType>(goal?.type ?? 'daily_pages');
  const [amount, setAmount] = useState(
    String(goal?.type === 'finish_by_date' ? 2 : (goal?.targetValue ?? 2)),
  );
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ?? addDays(today, 365) ?? today,
  );
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(
    formatQuranReminderTime(goal?.reminderHour ?? 20, goal?.reminderMinute ?? 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedDefinition = useMemo(
    () => goalTypes.find((item) => item.type === type) ?? goalTypes[0],
    [type],
  );

  async function save(): Promise<void> {
    const parsedAmount = Number(amount);
    const time = parseQuranReminderTime(reminderTime);
    const nextTargetValue = type === 'finish_by_date' ? 604 : parsedAmount;
    const definitionChanged =
      goal === null ||
      goal.type !== type ||
      goal.targetValue !== nextTargetValue ||
      goal.targetDate !== (type === 'finish_by_date' ? targetDate : null);
    const input: QuranGoalInput = {
      type,
      targetValue: nextTargetValue,
      targetDate: type === 'finish_by_date' ? targetDate : null,
      startDate: definitionChanged ? today : goal.startDate,
      contentRevision: goal?.contentRevision ?? '',
      reminderEnabled,
      reminderHour: time?.hour ?? (reminderEnabled ? -1 : 20),
      reminderMinute: time?.minute ?? (reminderEnabled ? -1 : 0),
    };
    const issues = validateQuranGoalInput(input, today);
    if (issues.length > 0) {
      setError(issueText(issues[0], type));
      return;
    }

    setSaving(true);
    const result = await onSave(input);
    setSaving(false);
    setError(
      result.saved
        ? null
        : result.issues.length > 0
          ? issueText(result.issues[0], type)
          : strings.quran.goalSaveFailed,
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <Text style={[textStyles.h4, { color: quranTheme.text }]}>{strings.quran.goalType}</Text>
        <View style={styles.typeList}>
          {goalTypes.map((item) => {
            const selected = item.type === type;
            return (
              <Pressable
                key={item.type}
                accessibilityLabel={formatString(strings.a11y.quranGoalType, {
                  title: item.title,
                  body: item.body,
                })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setType(item.type);
                  setError(null);
                }}
                style={({ pressed }) => [
                  styles.typeCard,
                  {
                    backgroundColor: selected
                      ? quranTheme.accentSoft
                      : pressed
                        ? quranTheme.glassPressed
                        : quranTheme.glass,
                    borderColor: selected ? quranTheme.accent : quranTheme.glassBorder,
                  },
                ]}
              >
                <View style={styles.typeIcon}>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : item.icon}
                    size={spacing.xl}
                    color={selected ? quranTheme.accent : quranTheme.textMuted}
                  />
                </View>
                <View style={styles.typeCopy}>
                  <Text style={[textStyles.labelLarge, { color: quranTheme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
                    {item.body}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {type !== 'finish_by_date' ? (
        <View style={styles.fieldGroup}>
          <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
            {type === 'daily_pages' ? strings.quran.goalPageAmount : strings.quran.goalJuzAmount}
          </Text>
          <TextInput
            accessibilityLabel={
              type === 'daily_pages' ? strings.quran.goalPageAmount : strings.quran.goalJuzAmount
            }
            keyboardType="number-pad"
            onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
            selectionColor={quranTheme.accent}
            style={styles.input}
            value={amount}
          />
        </View>
      ) : (
        <View style={styles.fieldGroup}>
          <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
            {strings.quran.goalTargetDate}
          </Text>
          <TextInput
            accessibilityLabel={strings.quran.goalTargetDate}
            autoCapitalize="none"
            onChangeText={setTargetDate}
            placeholder={strings.quran.goalDatePlaceholder}
            placeholderTextColor={quranTheme.textMuted}
            selectionColor={quranTheme.accent}
            style={styles.input}
            value={targetDate}
          />
        </View>
      )}

      <View style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderCopy}>
            <Text style={[textStyles.labelLarge, { color: quranTheme.text }]}>
              {strings.quran.goalReminder}
            </Text>
            <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
              {strings.quran.goalReminderBody}
            </Text>
          </View>
          <Switch
            accessibilityLabel={strings.quran.goalReminder}
            onValueChange={setReminderEnabled}
            thumbColor={reminderEnabled ? quranTheme.onAccent : quranTheme.textMuted}
            trackColor={{ false: quranTheme.glassBorder, true: quranTheme.accent }}
            value={reminderEnabled}
          />
        </View>

        {reminderEnabled ? (
          <View style={styles.fieldGroup}>
            <Text style={[textStyles.labelMedium, { color: quranTheme.text }]}>
              {strings.quran.goalReminderTime}
            </Text>
            <TextInput
              accessibilityLabel={strings.quran.goalReminderTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              onChangeText={setReminderTime}
              placeholder={strings.quran.goalTimePlaceholder}
              placeholderTextColor={quranTheme.textMuted}
              selectionColor={quranTheme.accent}
              style={styles.input}
              value={reminderTime}
            />
          </View>
        ) : null}
      </View>

      {error === null ? null : (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={spacing.lg} color={quranTheme.danger} />
          <Text style={[textStyles.bodySmall, styles.errorText, { color: quranTheme.danger }]}>
            {error}
          </Text>
        </View>
      )}

      <QuranButton
        disabled={saving}
        icon="checkmark-circle-outline"
        label={goal === null ? strings.quran.goalSave : strings.quran.goalUpdate}
        onPress={() => {
          void save();
        }}
        variant="accent"
      />

      <Text style={[textStyles.caption, { color: quranTheme.textMuted }]}>
        {selectedDefinition.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xxl },
  section: { gap: spacing.md },
  typeList: { gap: spacing.sm },
  typeCard: {
    minHeight: layout.minTouchTarget + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  typeIcon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCopy: { flex: 1, gap: spacing.xs },
  fieldGroup: { gap: spacing.sm },
  input: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.input,
    backgroundColor: quranTheme.glass,
    color: quranTheme.text,
    ...textStyles.bodyMedium,
  },
  reminderCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    borderRadius: componentRadius.card,
    backgroundColor: quranTheme.glass,
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderCopy: { flex: 1, gap: spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  errorText: { flex: 1 },
});
