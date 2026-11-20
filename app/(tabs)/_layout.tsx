import { Tabs } from 'expo-router';
import AppIcon from '@/components/AppIcon';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      sceneStyle: styles.scene,
      tabBarStyle: styles.bar,
      tabBarActiveTintColor: '#C5FF68',
      tabBarInactiveTintColor: '#A2A8B3',
      tabBarLabelStyle: styles.label,
      tabBarItemStyle: styles.item,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Таймер WOD', tabBarIcon: ({ color, size }) => <AppIcon name="timer-outline" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Питание и Замеры', tabBarIcon: ({ color, size }) => <AppIcon name="nutrition-outline" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="history" options={{ title: 'История', tabBarIcon: ({ color, size }) => <AppIcon name="bar-chart-outline" size={size} color={String(color)} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: '#0F1115' },
  bar: {
    backgroundColor: '#14171D',
    borderTopColor: '#292E37',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 76,
    paddingTop: 9,
    paddingBottom: 9,
    elevation: 0,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.15 },
  item: { paddingVertical: 2 },
});
