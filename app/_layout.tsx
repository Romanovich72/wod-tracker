import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { WorkoutHistoryProvider } from '@/components/WorkoutHistoryContext';

export default function RootLayout() {
  const [fontsReady] = useFonts(Ionicons.font);
  if (!fontsReady) return null;
  return (
    <WorkoutHistoryProvider>
      <View style={styles.canvas}>
        <View style={styles.app}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F1115' } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
      </View>
    </WorkoutHistoryProvider>
  );
}
const styles = StyleSheet.create({
  canvas: { flex: 1, width: '100%', alignItems: 'center', backgroundColor: '#080A0E' },
  app: { width: '100%', maxWidth: 430, flex: 1, backgroundColor: '#0F1115' },
});
