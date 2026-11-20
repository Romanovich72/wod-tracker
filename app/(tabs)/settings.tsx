import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from '@/components/AppIcon';

type Meal = { id: string; name: string; calories: number; protein: number; fat: number; carbs: number };
type FoodState = { meals: Meal[]; weight: string };
const STORAGE_KEY = 'wod-food-tracker-v1';
const targets = { calories: 2200, protein: 160, fat: 70, carbs: 240 };
const quickMeals: Omit<Meal, 'id'>[] = [
  { name: 'Протеин', calories: 130, protein: 25, fat: 2, carbs: 4 },
  { name: 'Курица с гречкой', calories: 450, protein: 38, fat: 10, carbs: 50 },
];

export default function NutritionScreen() {
  const [data, setData] = useState<FoodState>({ meals: [], weight: '' });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setData(JSON.parse(saved) as FoodState);
    }).catch(() => undefined).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
  }, [data, ready]);

  const totals = data.meals.reduce((a, meal) => ({
    calories: a.calories + meal.calories,
    protein: a.protein + meal.protein,
    fat: a.fat + meal.fat,
    carbs: a.carbs + meal.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

  function addMeal(meal: Omit<Meal, 'id'>) {
    setData((current) => ({ ...current, meals: [...current.meals, { ...meal, id: String(Date.now()) + Math.random() }] }));
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>ВОССТАНОВЛЕНИЕ · ПИТАНИЕ</Text>
        <View style={styles.headingRow}><View><Text style={styles.title}>Питание</Text><Text style={styles.subtitle}>Твой дневной баланс</Text></View><View style={styles.dateIcon}><AppIcon name="calendar-outline" size={19} color="#C5FF68" /></View></View>

        <View style={styles.calorieCard}>
          <View style={styles.calorieHead}><View><Text style={styles.cardEyebrow}>КАЛОРИИ СЕГОДНЯ</Text><Text style={styles.calorieValue}>{totals.calories}<Text style={styles.calorieTarget}> / {targets.calories}</Text></Text></View><View style={styles.flame}><AppIcon name="flame" size={22} color="#FF9C5C" /></View></View>
          <ProgressBar value={totals.calories} target={targets.calories} color="#C5FF68" />
          <Text style={styles.remaining}>{Math.max(0, targets.calories - totals.calories)} ккал осталось</Text>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Макронутриенты</Text><Text style={styles.unit}>граммы</Text></View>
        <View style={styles.macroCard}>
          <MacroRow label="Белки" value={totals.protein} target={targets.protein} color="#77C8FF" icon="fitness-outline" />
          <MacroRow label="Жиры" value={totals.fat} target={targets.fat} color="#FFB45F" icon="water-outline" />
          <MacroRow label="Углеводы" value={totals.carbs} target={targets.carbs} color="#C78AFF" icon="flash-outline" last />
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Быстро добавить</Text><Text style={styles.unit}>выбери приём пищи</Text></View>
        <View style={styles.quickList}>
          {quickMeals.map((meal) => (
            <Pressable key={meal.name} accessibilityRole="button" onPress={() => addMeal(meal)} style={({ pressed }) => [styles.mealButton, { opacity: pressed ? 0.72 : 1 }]}>
              <View style={styles.mealIcon}><AppIcon name={meal.name === 'Протеин' ? 'barbell-outline' : 'restaurant-outline'} size={18} color="#C5FF68" /></View>
              <View style={styles.mealInfo}><Text style={styles.mealName}>{meal.name}</Text><Text style={styles.mealMeta}>Б {meal.protein} · Ж {meal.fat} · У {meal.carbs} г</Text></View>
              <View style={styles.mealCalories}><Text style={styles.mealKcal}>+{meal.calories}</Text><Text style={styles.kcalUnit}>ккал</Text></View>
              <AppIcon name="add-circle" size={22} color="#C5FF68" />
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Замеры</Text><Text style={styles.unit}>сегодня</Text></View>
        <View style={styles.weightCard}>
          <View style={styles.weightIcon}><AppIcon name="scale-outline" size={20} color="#C5FF68" /></View>
          <View style={styles.weightInfo}><Text style={styles.weightTitle}>Вес тела</Text><Text style={styles.weightHint}>Запиши текущий результат</Text></View>
          <TextInput value={data.weight} onChangeText={(weight) => setData((current) => ({ ...current, weight }))} placeholder="—" placeholderTextColor="#737C89" keyboardType="decimal-pad" accessibilityLabel="Вес тела в килограммах" style={styles.weightInput} />
          <Text style={styles.kg}>кг</Text>
        </View>

        {data.meals.length > 0 && <View style={styles.logCard}><Text style={styles.logTitle}>Добавлено сегодня · {data.meals.length}</Text>{data.meals.slice(-3).reverse().map((meal) => <View key={meal.id} style={styles.logRow}><Text style={styles.logName}>{meal.name}</Text><Text style={styles.logCalories}>+{meal.calories} ккал</Text></View>)}</View>}
        {!ready && <Text style={styles.loading}>Загружаем сохранённые данные…</Text>}
        <Text style={styles.disclaimer}>ЦЕЛИ МОЖНО НАСТРОИТЬ ПОД СВОЮ ПРОГРАММУ</Text>
      </ScrollView>
    </View>
  );
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const width = Math.min(100, target ? value / target * 100 : 0) + '%';
  return <View style={styles.track}><View style={[styles.fill, { width, backgroundColor: color }]} /></View>;
}

function MacroRow({ label, value, target, color, icon, last }: { label: string; value: number; target: number; color: string; icon: React.ComponentProps<typeof AppIcon>['name']; last?: boolean }) {
  return <View style={[styles.macroRow, !last && styles.macroDivider]}><View style={[styles.macroIcon, { backgroundColor: color + '1A' }]}><AppIcon name={icon} size={16} color={color} /></View><View style={styles.macroBody}><View style={styles.macroTop}><Text style={styles.macroName}>{label}</Text><Text style={styles.macroValue}>{value}<Text style={styles.macroTarget}> / {target} г</Text></Text></View><ProgressBar value={value} target={target} color={color} /></View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 23, paddingBottom: 30 },
  kicker: { color: '#9AA3AF', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#F6F7F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#AAB1BC', fontSize: 13, marginTop: 4 },
  dateIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#20251D', alignItems: 'center', justifyContent: 'center' },
  calorieCard: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 22, padding: 18, marginBottom: 23 },
  calorieHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardEyebrow: { color: '#A3ABB7', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  calorieValue: { color: '#F6F7F9', fontSize: 30, fontWeight: '800', marginTop: 5, letterSpacing: -0.7 },
  calorieTarget: { color: '#929AA6', fontSize: 14, fontWeight: '600', letterSpacing: 0 },
  flame: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#30251E', alignItems: 'center', justifyContent: 'center' },
  track: { height: 7, backgroundColor: '#2B3039', borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  remaining: { color: '#AAB1BC', fontSize: 11, marginTop: 9 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 },
  sectionTitle: { color: '#F4F6F9', fontSize: 16, fontWeight: '800' },
  unit: { color: '#929AA6', fontSize: 10 },
  macroCard: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 19, paddingHorizontal: 14, marginBottom: 23 },
  macroRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 },
  macroDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B3039' },
  macroIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  macroBody: { flex: 1, gap: 9 },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroName: { color: '#EDF0F4', fontSize: 12, fontWeight: '700' },
  macroValue: { color: '#F6F7F9', fontSize: 11, fontWeight: '700' },
  macroTarget: { color: '#929AA6', fontWeight: '500' },
  quickList: { gap: 9, marginBottom: 23 },
  mealButton: { minHeight: 66, backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 16, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealIcon: { width: 36, height: 36, backgroundColor: '#20251D', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealInfo: { flex: 1 },
  mealName: { color: '#F4F6F9', fontSize: 12, fontWeight: '700' },
  mealMeta: { color: '#A2AAB5', fontSize: 9, marginTop: 4 },
  mealCalories: { alignItems: 'flex-end' },
  mealKcal: { color: '#C5FF68', fontSize: 12, fontWeight: '800' },
  kcalUnit: { color: '#A2AAB5', fontSize: 9, marginTop: 2 },
  weightCard: { minHeight: 70, backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  weightIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#20251D', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  weightInfo: { flex: 1 },
  weightTitle: { color: '#F4F6F9', fontSize: 12, fontWeight: '700' },
  weightHint: { color: '#A2AAB5', fontSize: 9, marginTop: 4 },
  weightInput: { width: 56, color: '#F6F7F9', fontSize: 17, fontWeight: '800', textAlign: 'right', paddingVertical: 8 },
  kg: { color: '#A2AAB5', fontSize: 11, marginLeft: 5 },
  logCard: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 17, padding: 14, marginBottom: 16 },
  logTitle: { color: '#F4F6F9', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  logRow: { minHeight: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logName: { color: '#BFC5CE', fontSize: 11 },
  logCalories: { color: '#C5FF68', fontSize: 11, fontWeight: '700' },
  loading: { color: '#929AA6', fontSize: 10, marginBottom: 8 },
  disclaimer: { color: '#737C89', fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 7 },
});
