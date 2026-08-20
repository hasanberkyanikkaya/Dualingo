import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { spacing } from '@/constants/spacing';
import strings from '@/constants/strings';

const MASCOT_SIZE = 160;

type WelcomeStepProps = {
  onStart: () => void;
};

/**
 * Karşılama — akışın ilk adımı.
 *
 * ⚠️ "Daha önce başlamıştım" (`strings.onboarding.alreadyHaveProgress`)
 * **çizilmiyor ve bu bilinçli.** O metin bir hesap kurtarma akışını ima ediyor;
 * bugün hesap yok, ilerleme yalnızca cihazda (bulut senkronizasyonu Faz 7).
 * Hiçbir yere gitmeyen bir bağlantı koymak, olmayan bir özelliği vaat ederdi.
 */
export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image
          // Maskot süs; başlık zaten ne olduğunu söylüyor.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          source={require('@/assets/images/mascot.png')}
          style={styles.mascot}
          contentFit="contain"
        />

        <ScreenHeader
          title={strings.onboarding.welcomeTitle}
          subtitle={strings.onboarding.welcomeSubtitle}
        />
      </View>

      <Button label={strings.onboarding.getStarted} onPress={onStart} size="large" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  mascot: {
    // Yalnız görsel ortalanıyor; başlık bloğu sola dayalı kalıyor. `hero`ya
    // `alignItems: 'center'` vermek `ScreenHeader`ı içeriği kadar daraltır ve
    // uzun başlık erken sarar.
    alignSelf: 'center',
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
});
