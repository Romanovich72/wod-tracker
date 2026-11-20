import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import PresetEditorModal from '@/components/PresetEditorModal';
import { FOOD_CATEGORIES, localDateKey, NUTRITION_TARGETS, parseNumber, totalsForDate, useTrainingData, type BodyMeasurement, type FoodCategory, type FoodPreset } from '@/components/TrainingDataContext';

export default function NutritionScreen() {
  const { data, loaded, addMeal, removeMeal, savePreset, updateMeasurement, repeatYesterday } = useTrainingData();
  const [category, setCategory] = useState<FoodCategory>('Завтрак');
  const [gramsByPreset, setGramsByPreset] = useState<Record<string, string>>({});
  const [editingPreset, setEditingPreset] = useState<FoodPreset | null>(null);
  const [newPreset, setNewPreset] = useState(false);
  const [notice, setNotice] = useState('');
  const today = localDateKey();
  const totals = totalsForDate(data.meals, today);
  const mealsToday = data.meals.filter((meal) => meal.dateKey === today);
  const measurement = data.measurements.find((item) => item.dateKey === today);

  function addPreset(preset: FoodPreset) {
    const portion = parseNumber(gramsByPreset[preset.id] ?? String(preset.baseGrams)) ?? preset.baseGrams;
    addMeal(preset, category, portion);
    setNotice(preset.name + ' добавлено в раздел «' + category.toLocaleLowerCase('ru-RU') + '»');
  }

  function repeatPriorDay() {
    const count = repeatYesterday();
    setNotice(count ? 'Добавлено блюд из вчерашнего рациона: ' + count : 'За вчера нет записей для копирования');
  }

  function updateMetric(field: 'weight' | 'waist', raw: string) {
    updateMeasurement(today, field, raw.trim() ? parseNumber(raw) : null);
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.kicker}>ВОССТАНОВЛЕНИЕ · ПИТАНИЕ</Text>
        <View style={s.headingRow}><View><Text style={s.title}>Питание</Text><Text style={s.subtitle}>Твой дневной баланс</Text></View><View style={s.dateIcon}><AppIcon name="calendar-outline" size={19} color="#C5FF68" /></View></View>

        <View style={s.calorieCard}>
          <View style={s.calorieHead}><View><Text style={s.cardEyebrow}>КАЛОРИИ СЕГОДНЯ</Text><Text style={s.calorieValue}>{Math.round(totals.calories)}<Text style={s.calorieTarget}> / {NUTRITION_TARGETS.calories}</Text></Text></View><View style={s.flame}><AppIcon name="flame" size={22} color="#FF9C5C" /></View></View>
          <ProgressBar value={totals.calories} target={NUTRITION_TARGETS.calories} color="#C5FF68" />
          <Text style={s.remaining}>{Math.max(0, NUTRITION_TARGETS.calories - Math.round(totals.calories))} ккал осталось</Text>
        </View>

        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Макронутриенты</Text><Text style={s.unit}>граммы</Text></View>
        <View style={s.macroCard}>
          <MacroRow label="Белки" value={totals.protein} target={NUTRITION_TARGETS.protein} color="#77C8FF" icon="fitness-outline" />
          <MacroRow label="Жиры" value={totals.fat} target={NUTRITION_TARGETS.fat} color="#FFB45F" icon="water-outline" />
          <MacroRow label="Углеводы" value={totals.carbs} target={NUTRITION_TARGETS.carbs} color="#C78AFF" icon="flash-outline" />
          <MacroRow label="Клетчатка" value={totals.fiber} target={NUTRITION_TARGETS.fiber} color="#C5FF68" icon="leaf-outline" last />
        </View>

        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Быстро добавить</Text><Text style={s.unit}>выбери приём пищи</Text></View>
        <View style={s.categoryPicker}>
          {FOOD_CATEGORIES.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[s.categoryButton, category === item && s.categoryActive]}><Text style={[s.categoryText, category === item && s.categoryTextActive]}>{item}</Text></Pressable>)}
        </View>
        <Pressable accessibilityRole="button" onPress={repeatPriorDay} style={s.repeatButton}><AppIcon name="copy-outline" size={17} color="#C5FF68" /><Text style={s.repeatText}>Повторить вчерашний рацион</Text></Pressable>
        <View style={s.quickList}>
          {data.presets.map((preset) => (
            <View key={preset.id} style={s.mealButton}>
              <View style={s.mealIcon}><AppIcon name={preset.name.toLocaleLowerCase('ru-RU').includes('протеин') ? 'barbell-outline' : 'restaurant-outline'} size={18} color="#C5FF68" /></View>
              <View style={s.mealInfo}><Text numberOfLines={1} style={s.mealName}>{preset.name}</Text><Text style={s.mealMeta}>основа {preset.baseGrams} г · Б {preset.protein} · Ж {preset.fat} · У {preset.carbs} · Кл {preset.fiber}</Text></View>
              <View style={s.portion}><Text style={s.portionLabel}>ПОРЦИЯ, Г</Text><TextInput accessibilityLabel={'Вес порции в граммах: ' + preset.name} value={gramsByPreset[preset.id] ?? String(preset.baseGrams)} onChangeText={(value) => setGramsByPreset((current) => ({ ...current, [preset.id]: value }))} keyboardType="decimal-pad" style={s.gramsInput} /></View>
              <Pressable accessibilityRole="button" accessibilityLabel={'Добавить ' + preset.name} onPress={() => addPreset(preset)} style={s.addMealButton}><AppIcon name="add" size={18} color="#11150D" /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={'Изменить ' + preset.name} onPress={() => { setEditingPreset(preset); setNewPreset(false); }} style={s.editMealButton}><AppIcon name="create-outline" size={17} color="#AAB3C1" /></Pressable>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => { setEditingPreset(null); setNewPreset(true); }} style={s.newPresetButton}><AppIcon name="add-circle-outline" size={18} color="#C5FF68" /><Text style={s.newPresetText}>Создать своё блюдо</Text></Pressable>
        </View>
        {notice ? <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text> : null}

        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Съедено сегодня</Text><Text style={s.unit}>{mealsToday.length} блюд</Text></View>
        {FOOD_CATEGORIES.map((mealCategory) => {
          const items = mealsToday.filter((meal) => meal.category === mealCategory);
          if (!items.length) return null;
          const categoryKcal = items.reduce((sum, meal) => sum + meal.calories, 0);
          return <View key={mealCategory} style={s.mealGroup}><View style={s.groupHead}><Text style={s.groupTitle}>{mealCategory}</Text><Text style={s.groupTotal}>{Math.round(categoryKcal)} ккал</Text></View>{items.map((meal) => <View key={meal.id} style={s.logRow}><View style={s.logInfo}><Text style={s.logName}>{meal.name} · {meal.grams} г</Text><Text style={s.logMeta}>Б {meal.protein} · Ж {meal.fat} · У {meal.carbs} · Кл {meal.fiber} г</Text></View><Text style={s.logCalories}>{meal.calories} ккал</Text><Pressable accessibilityRole="button" accessibilityLabel={'Удалить ' + meal.name} onPress={() => removeMeal(meal.id)} style={s.removeMeal}><AppIcon name="close" size={15} color="#8792A1" /></Pressable></View>)}</View>;
        })}
        {!mealsToday.length && <View style={s.emptyCard}><Text style={s.emptyTitle}>Пока ничего не записано</Text><Text style={s.emptyHint}>Выбери приём пищи и добавь блюдо из быстрых кнопок.</Text></View>}

        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Замеры</Text><Text style={s.unit}>сегодня</Text></View>
        <View style={s.measurementCard}>
          <MeasurementField icon="scale-outline" label="Вес" unit="кг" value={measurement?.weight} onChange={(value) => updateMetric('weight', value)} accessibilityLabel="Вес тела в килограммах" />
          <View style={s.measureDivider} />
          <MeasurementField icon="body-outline" label="Талия" unit="см" value={measurement?.waist} onChange={(value) => updateMetric('waist', value)} accessibilityLabel="Талия в сантиметрах" />
        </View>
        <MeasurementChart measurements={data.measurements.slice(-7)} />

        {!loaded && <Text style={s.loading}>Загружаем сохранённые данные…</Text>}
        <Text style={s.disclaimer}>ЦЕЛИ МОЖНО НАСТРОИТЬ ПОД СВОЮ ПРОГРАММУ</Text>
      </ScrollView>
      <PresetEditorModal key={editingPreset?.id ?? (newPreset ? 'new-preset' : 'closed')} visible={newPreset || editingPreset !== null} preset={editingPreset} onClose={() => { setNewPreset(false); setEditingPreset(null); }} onSave={savePreset} />
    </View>
  );
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const width = Math.min(100, target ? value / target * 100 : 0) + '%';
  return <View style={s.track}><View style={[s.fill, { width, backgroundColor: color }]} /></View>;
}

function MacroRow({ label, value, target, color, icon, last }: { label: string; value: number; target: number; color: string; icon: React.ComponentProps<typeof AppIcon>['name']; last?: boolean }) {
  return <View style={[s.macroRow, !last && s.macroDivider]}><View style={[s.macroIcon, { backgroundColor: color + '1A' }]}><AppIcon name={icon} size={16} color={color} /></View><View style={s.macroBody}><View style={s.macroTop}><Text style={s.macroName}>{label}</Text><Text style={s.macroValue}>{Math.round(value * 10) / 10}<Text style={s.macroTarget}> / {target} г</Text></Text></View><ProgressBar value={value} target={target} color={color} /></View></View>;
}

function MeasurementField({ icon, label, unit, value, onChange, accessibilityLabel }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; unit: string; value?: number | null; onChange: (value: string) => void; accessibilityLabel: string }) {
  return <View style={s.measurementRow}><View style={s.measureIcon}><AppIcon name={icon} size={18} color="#C5FF68" /></View><Text style={s.measureName}>{label}</Text><TextInput accessibilityLabel={accessibilityLabel} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder="—" placeholderTextColor="#737C89" keyboardType="decimal-pad" style={s.measureInput} /><Text style={s.kg}>{unit}</Text></View>;
}

function MeasurementChart({ measurements }: { measurements: BodyMeasurement[] }) {
  if (!measurements.length) return <View style={s.chartEmpty}><Text style={s.chartEmptyText}>График появится после первых замеров</Text></View>;
  const recent = measurements.slice(-7);
  const weights = recent.map((item) => item.weight).filter((item): item is number => item !== null);
  const waists = recent.map((item) => item.waist).filter((item): item is number => item !== null);
  const barHeight = (value: number | null, values: number[]) => value === null ? 4 : 8 + (values.length > 1 && Math.max(...values) !== Math.min(...values) ? ((value - Math.min(...values)) / (Math.max(...values) - Math.min(...values))) * 30 : 20);
  return <View style={s.chartCard}>
    <View style={s.chartHead}><Text style={s.chartTitle}>Динамика замеров</Text><View style={s.chartLegend}><Text style={s.weightLegend}>● кг</Text><Text style={s.waistLegend}>● см</Text></View></View>
    <View style={s.chartBars}>{recent.map((item) => <View key={item.dateKey} style={s.chartColumn}><View style={s.barValues}><Text style={s.chartValue}>{item.weight ?? '—'}</Text><Text style={s.chartValue}>{item.waist ?? '—'}</Text></View><View style={s.barPair}><View style={[s.chartBar, { height: barHeight(item.weight, weights), backgroundColor: '#77C8FF' }]} /><View style={[s.chartBar, { height: barHeight(item.waist, waists), backgroundColor: '#C5FF68' }]} /></View><Text style={s.chartDate}>{item.dateKey.slice(5)}</Text></View>)}</View>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0E14' },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 23, paddingBottom: 32 },
  kicker: { color: '#9AA3AF', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#F6F7F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#AAB1BC', fontSize: 13, marginTop: 4 },
  dateIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#20251D', alignItems: 'center', justifyContent: 'center' },
  calorieCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 22, padding: 18, marginBottom: 23 },
  calorieHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardEyebrow: { color: '#A3ABB7', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  calorieValue: { color: '#F6F7F9', fontSize: 30, fontWeight: '800', marginTop: 5, letterSpacing: -0.7 },
  calorieTarget: { color: '#929AA6', fontSize: 14, fontWeight: '600', letterSpacing: 0 },
  flame: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#30251E', alignItems: 'center', justifyContent: 'center' },
  track: { height: 7, backgroundColor: '#28313D', borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  remaining: { color: '#AAB1BC', fontSize: 11, marginTop: 9 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11, marginTop: 2 },
  sectionTitle: { color: '#F4F6F9', fontSize: 16, fontWeight: '800' },
  unit: { color: '#929AA6', fontSize: 10 },
  macroCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 19, paddingHorizontal: 14, marginBottom: 23 },
  macroRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
  macroDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#28313D' },
  macroIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  macroBody: { flex: 1, gap: 8 },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroName: { color: '#EDF0F4', fontSize: 12, fontWeight: '700' },
  macroValue: { color: '#F6F7F9', fontSize: 11, fontWeight: '700' },
  macroTarget: { color: '#929AA6', fontWeight: '500' },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  categoryButton: { flexGrow: 1, minWidth: 74, borderRadius: 10, borderWidth: 1, borderColor: '#303A48', backgroundColor: '#131923', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 9 },
  categoryActive: { backgroundColor: '#26331D', borderColor: '#637F3F' },
  categoryText: { color: '#AAB3C1', fontSize: 10, fontWeight: '700' },
  categoryTextActive: { color: '#D5FFA0' },
  repeatButton: { minHeight: 42, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#141B15', borderWidth: 1, borderColor: '#34442A', borderRadius: 12, marginBottom: 10 },
  repeatText: { color: '#D3F5A0', fontSize: 11, fontWeight: '700' },
  quickList: { gap: 8, marginBottom: 10 },
  mealButton: { minHeight: 68, backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 15, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mealIcon: { width: 32, height: 32, backgroundColor: '#202A1D', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealInfo: { flex: 1, minWidth: 55 },
  mealName: { color: '#F4F6F9', fontSize: 11, fontWeight: '700' },
  mealMeta: { color: '#9DA7B5', fontSize: 8, marginTop: 3 },
  portion: { alignItems: 'center', width: 43 },
  portionLabel: { color: '#7F8A99', fontSize: 6, fontWeight: '800', letterSpacing: 0.3 },
  gramsInput: { width: 42, color: '#F4F6F9', fontSize: 12, fontWeight: '800', textAlign: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#46515F' },
  addMealButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#C5FF68', alignItems: 'center', justifyContent: 'center' },
  editMealButton: { width: 25, height: 30, alignItems: 'center', justifyContent: 'center' },
  newPresetButton: { minHeight: 41, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: '#475437', borderRadius: 12 },
  newPresetText: { color: '#C5FF68', fontSize: 11, fontWeight: '700' },
  notice: { color: '#C5FF68', fontSize: 10, textAlign: 'center', marginBottom: 14 },
  mealGroup: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 9 },
  groupHead: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#303A48' },
  groupTitle: { color: '#E7EBF0', fontSize: 11, fontWeight: '800' },
  groupTotal: { color: '#C5FF68', fontSize: 10, fontWeight: '700' },
  logRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#222B36' },
  logInfo: { flex: 1 },
  logName: { color: '#DDE2E9', fontSize: 10, fontWeight: '600' },
  logMeta: { color: '#7F8A99', fontSize: 8, marginTop: 3 },
  logCalories: { color: '#C5FF68', fontSize: 9, fontWeight: '700' },
  removeMeal: { width: 23, height: 28, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 15, padding: 17, marginBottom: 17, alignItems: 'center' },
  emptyTitle: { color: '#E7EBF0', fontSize: 12, fontWeight: '700' },
  emptyHint: { color: '#8994A3', fontSize: 10, textAlign: 'center', marginTop: 5 },
  measurementCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 16, paddingHorizontal: 12, marginBottom: 10 },
  measurementRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 8 },
  measureIcon: { width: 31, height: 31, backgroundColor: '#202A1D', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  measureName: { flex: 1, color: '#E9EDF2', fontSize: 11, fontWeight: '700' },
  measureInput: { width: 65, color: '#F6F7F9', fontSize: 16, fontWeight: '800', textAlign: 'right', paddingVertical: 7 },
  kg: { color: '#A2AAB5', fontSize: 10, marginLeft: -3 },
  measureDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#2B3440' },
  chartCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 15, padding: 12, marginBottom: 17 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartTitle: { color: '#E9EDF2', fontSize: 10, fontWeight: '800' },
  chartLegend: { flexDirection: 'row', gap: 8 },
  weightLegend: { color: '#77C8FF', fontSize: 8, fontWeight: '700' },
  waistLegend: { color: '#C5FF68', fontSize: 8, fontWeight: '700' },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  chartColumn: { flex: 1, alignItems: 'center' },
  barValues: { alignItems: 'center', marginBottom: 3 },
  chartValue: { color: '#8994A3', fontSize: 7, lineHeight: 10 },
  barPair: { height: 43, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartBar: { width: 8, minHeight: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartDate: { color: '#788392', fontSize: 7, marginTop: 3 },
  chartEmpty: { height: 52, backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  chartEmptyText: { color: '#7F8A99', fontSize: 9 },
  loading: { color: '#929AA6', fontSize: 10, marginBottom: 8 },
  disclaimer: { color: '#737C89', fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 7 },
});
