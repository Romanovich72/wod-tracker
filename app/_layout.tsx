import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { WorkoutHistoryProvider } from '@/components/WorkoutHistoryContext';
import { TrainingDataProvider } from '@/components/TrainingDataContext';

export default function RootLayout() {
  const [fontsReady] = useFonts(Ionicons.font);
  if (!fontsReady) return null;
  return (
    <WorkoutHistoryProvider>
      <TrainingDataProvider>
        <View style={styles.canvas}>
          <View style={styles.app}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0E14' } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </View>
      </TrainingDataProvider>
    </WorkoutHistoryProvider>
  );
}
const styles = StyleSheet.create({
  canvas: { flex: 1, width: '100%', alignItems: 'center', backgroundColor: '#080A0E' },
  app: { width: '100%', maxWidth: 430, flex: 1, backgroundColor: '#0B0E14' },
});
