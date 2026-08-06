import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Kök yerleşim — sekmeler Faz 1'de eklenecek.
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
