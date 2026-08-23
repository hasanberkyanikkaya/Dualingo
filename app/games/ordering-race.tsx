import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrderingRaceGame from '@/features/games/components/OrderingRaceGame';
import { useTheme } from '@/lib/useTheme';

export default function OrderingRaceScreen() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
        <OrderingRaceGame onClose={() => router.back()} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
