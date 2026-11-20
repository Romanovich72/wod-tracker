import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import { parseNumber, type FoodPreset } from '@/components/TrainingDataContext';

type Props = { visible: boolean; preset: FoodPreset | null; onClose: () => void; onSave: (preset: FoodPreset) => void };

export default function PresetEditorModal({ visible, preset, onClose, onSave }: Props) {
  const [name, setName] = useState(preset?.name ?? '');
  const [grams, setGrams] = useState(String(preset?.baseGrams ?? 100));
  const [calories, setCalories] = useState(String(preset?.calories ?? ''));
  const [protein, setProtein] = useState(String(preset?.protein ?? ''));
  const [fat, setFat] = useState(String(preset?.fat ?? ''));
  const [carbs, setCarbs] = useState(String(preset?.carbs ?? ''));
  const [fiber, setFiber] = useState(String(preset?.fiber ?? ''));
  const [error, setError] = useState('');

  function save() {
    const numeric = [grams, calories, protein, fat, carbs, fiber].map(parseNumber);
    if (!name.trim() || numeric.some((value) => value === null) || (numeric[0] ?? 0) <= 0) {
      setError('Заполни название и все значения. Вес должен быть больше нуля.');
      return;
    }
    const [baseGrams, kcal, p, f, c, fibre] = numeric as number[];
    onSave({ id: preset?.id ?? 'preset-' + Date.now() + Math.random(), name: name.trim(), baseGrams, calories: kcal, protein: p, fat: f, carbs: c, fiber: fibre });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}><View><Text style={s.eyebrow}>БЫСТРЫЕ КНОПКИ</Text><Text style={s.title}>{preset ? 'Изменить блюдо' : 'Новое блюдо'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Закрыть редактор блюда" onPress={onClose} style={s.close}><AppIcon name="close" size={19} color="#E8EBF0" /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field label="Название" value={name} onChangeText={setName} placeholder="Например, Овсянка" />
            <Field label="Вес основы, г" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" />
            <View style={s.grid}><Field label="Ккал" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" /><Field label="Белки, г" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" /></View>
            <View style={s.grid}><Field label="Жиры, г" value={fat} onChangeText={setFat} keyboardType="decimal-pad" /><Field label="Углеводы, г" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" /></View>
            <Field label="Клетчатка, г" value={fiber} onChangeText={setFiber} keyboardType="decimal-pad" />
            <Text style={s.hint}>Пищевая ценность указана для веса основы. При добавлении можно задать другой вес порции — значения пересчитаются автоматически.</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={save} style={s.save}><AppIcon name="checkmark" size={19} color="#10140B" /><Text style={s.saveText}>Сохранить блюдо</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'decimal-pad' }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#697383" keyboardType={keyboardType} style={s.input} /></View>;
}

const s = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: 'rgba(0,0,0,0.76)' },
  sheet: { width: '100%', maxWidth: 430, maxHeight: '94%', backgroundColor: '#141923', borderWidth: 1, borderColor: '#303846', borderRadius: 23, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { color: '#98A3B3', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#F4F6F9', fontSize: 21, fontWeight: '800', marginTop: 4 },
  close: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#242B36', alignItems: 'center', justifyContent: 'center' },
  field: { flex: 1, marginBottom: 11 },
  grid: { flexDirection: 'row', gap: 9 },
  label: { color: '#AAB3C1', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  input: { height: 43, borderRadius: 11, borderWidth: 1, borderColor: '#353E4B', backgroundColor: '#0D1118', paddingHorizontal: 11, color: '#F4F6F9', fontSize: 13 },
  hint: { color: '#7F8A99', fontSize: 10, lineHeight: 15, marginVertical: 4 },
  error: { color: '#FF9C8A', fontSize: 11, marginTop: 8 },
  save: { height: 47, borderRadius: 13, backgroundColor: '#C5FF68', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 13 },
  saveText: { color: '#12160C', fontSize: 13, fontWeight: '800' },
});
