import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { quranTheme } from '@/constants/quranTheme';
import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { getQuranCatalog } from '@/features/quran/contentLoader';
import { formatString } from '@/lib/formatString';

import type { QuranSurahSummary } from '@/types';

type SurahPickerModalProps = {
  visible: boolean;
  selectedSurahId: number | null;
  onClose: () => void;
  onSelect: (surah: QuranSurahSummary) => void;
};

const surahs = getQuranCatalog().surahs;

export default function SurahPickerModal({
  visible,
  selectedSurahId,
  onClose,
  onSelect,
}: SurahPickerModalProps) {
  function renderSurah({ item }: { item: QuranSurahSummary }) {
    const selected = item.id === selectedSurahId;
    const numberLabel = formatString(strings.quran.surahNumber, { number: item.id });

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={formatString(strings.a11y.quranSurahOption, {
          number: item.id,
          name: item.nameTurkish ?? item.nameArabic,
        })}
        accessibilityState={{ selected }}
        onPress={() => onSelect(item)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: pressed ? quranTheme.glassPressed : quranTheme.glass,
            borderColor: selected ? quranTheme.accent : quranTheme.glassBorder,
          },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[textStyles.labelMedium, { color: quranTheme.textMuted }]}>
            {numberLabel}
          </Text>
          <Text style={[textStyles.bodyLarge, { color: quranTheme.text }]}>
            {item.nameTurkish ?? item.nameArabic}
          </Text>
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'chevron-forward'}
          size={spacing.xl}
          color={selected ? quranTheme.accent : quranTheme.textMuted}
        />
      </Pressable>
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text accessibilityRole="header" style={[textStyles.h3, { color: quranTheme.text }]}>
                {strings.quran.surahPickerTitle}
              </Text>
              <Text style={[textStyles.bodySmall, { color: quranTheme.textMuted }]}>
                {strings.quran.surahPickerBody}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={strings.a11y.closeButton}
              hitSlop={spacing.md}
              onPress={onClose}
              style={styles.close}
            >
              <Ionicons name="close" size={spacing.xl} color={quranTheme.text} />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={styles.list}
            data={surahs}
            initialNumToRender={12}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSurah}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: quranTheme.overlay,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: quranTheme.glassStrong,
    borderTopLeftRadius: componentRadius.modal,
    borderTopRightRadius: componentRadius.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
    borderWidth: 1,
    borderColor: quranTheme.glassBorder,
    backgroundColor: quranTheme.glass,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.xxl,
  },
  row: {
    minHeight: layout.minTouchTarget + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: componentRadius.card,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
});
