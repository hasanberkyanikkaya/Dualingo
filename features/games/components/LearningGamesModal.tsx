import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { componentRadius } from '@/constants/radius';
import { layout, spacing } from '@/constants/spacing';
import strings from '@/constants/strings';
import { textStyles } from '@/constants/typography';
import { useTheme } from '@/lib/useTheme';

import LearningActivityBar from './LearningActivityBar';

type LearningGamesModalProps = {
  visible: boolean;
  onClose: () => void;
  onOpenOrderingRace: () => void;
};

export default function LearningGamesModal({
  visible,
  onClose,
  onOpenOrderingRace,
}: LearningGamesModalProps) {
  const { theme } = useTheme();

  function openOrderingRace(): void {
    onClose();
    onOpenOrderingRace();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable
          accessibilityLabel={strings.games.closeActivities}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <SafeAreaView
          accessibilityViewIsModal
          edges={['bottom', 'left', 'right']}
          style={[
            styles.sheet,
            theme.elevation.modal,
            { backgroundColor: theme.surface, borderColor: theme.borderStrong },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headingCopy}>
              <Text accessibilityRole="header" style={[textStyles.h3, { color: theme.textPrimary }]}>
                {strings.games.activityBarTitle}
              </Text>
              <Text style={[textStyles.bodySmall, { color: theme.textSecondary }]}>
                {strings.games.activityBarBody}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={strings.games.closeActivities}
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? theme.secondarySoft : theme.surfaceAlt },
              ]}
            >
              <Ionicons name="close" size={spacing.xl} color={theme.textPrimary} />
            </Pressable>
          </View>

          <LearningActivityBar onOpenOrderingRace={openOrderingRace} showHeading={false} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: '80%',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    borderWidth: 1,
    borderTopLeftRadius: componentRadius.modal,
    borderTopRightRadius: componentRadius.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headingCopy: { flex: 1, gap: spacing.xs },
  closeButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: componentRadius.button,
  },
});
