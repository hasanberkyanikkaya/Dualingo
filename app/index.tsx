import { StyleSheet, Text, View } from 'react-native';

// Geçici açılış ekranı — Faz 1'de sekme yapısıyla değiştirilecek.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kurulum tamam</Text>
      <Text style={styles.subtitle}>Faz 0 — proje iskeleti hazır.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
  },
});
