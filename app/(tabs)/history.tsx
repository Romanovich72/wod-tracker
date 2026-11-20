import { useMemo, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import ShareCardModal from '@/components/ShareCardModal';
import { useTrainingData, localDateKey, totalsForDate, nutritionGoalMet, type NutritionData } from '@/components/TrainingDataContext';
import { useWorkoutHistory } from '@/components/WorkoutHistoryContext';
import { formatDuration } from '@/components/workoutShareCanvas';
import type { WorkoutRecord } from '@/components/workoutTypes';

const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
export default function HistoryScreen() {
  const { records, loaded, removeRecord, replaceRecords } = useWorkoutHistory();
  const { data, loaded: nutritionLoaded, replaceNutrition } = useTrainingData();
  const [shareRecord, setShareRecord] = useState<WorkoutRecord | null>(null);
  const today = localDateKey();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [backupNotice, setBackupNotice] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);
  const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(month);
  const days = useMemo(() => {
    const firstOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstOffset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [month]);
  const selectedRecords = records.filter((record) => dateKeyFrom(record.date) === selected);
  const selectedMeals = data.meals.filter((meal) => meal.dateKey === selected);
  const totals = totalsForDate(data.meals, selected);
  const measurement = data.measurements.find((item) => item.dateKey === selected);
  const totalMinutes = (records.reduce((total, record) => total + record.durationSeconds, 0) / 60).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

  function moveMonth(delta: number) { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)); }
  function dayKey(day: number) { return localDateKey(new Date(month.getFullYear(), month.getMonth(), day)); }
  function exportBackup() {
    if (Platform.OS !== 'web') { setBackupNotice('Экспорт доступен в веб-версии приложения.'); return; }
    const payload = { format: 'wod-tracker-backup', version: 1, exportedAt: new Date().toISOString(), workouts: records, nutrition: data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'wod-tracker-backup-' + today + '.json'; anchor.click(); URL.revokeObjectURL(url);
    setBackupNotice('Резервная копия подготовлена.');
  }
  async function importBackup(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { format?: string; workouts?: unknown; nutrition?: Partial<NutritionData> };
      const nutrition = parsed.nutrition;
      if (parsed.format !== 'wod-tracker-backup' || !Array.isArray(parsed.workouts) || nutrition?.version !== 2 || !Array.isArray(nutrition.meals) || !Array.isArray(nutrition.presets) || !Array.isArray(nutrition.measurements)) throw new Error('Некорректный формат резервной копии');
      replaceRecords(parsed.workouts as WorkoutRecord[]); replaceNutrition(nutrition as NutritionData); setBackupNotice('Данные успешно восстановлены.');
    } catch { setBackupNotice('Не удалось импортировать файл. Проверьте, что это резервная копия WOD Tracker.'); }
    if (fileInput.current) fileInput.current.value = '';
  }

  return <View style={s.root}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <Text style={s.kicker}>ТВОЙ ПРОГРЕСС</Text><Text style={s.heading}>История</Text>
    <View style={s.stats}><Stat label="ТРЕНИРОВОК" value={String(records.length)} icon="fitness-outline" /><Stat label="МИНУТ В ДВИЖЕНИИ" value={String(totalMinutes)} icon="time-outline" /></View>
    <View style={s.calendar}>
      <View style={s.calendarHead}><Pressable accessibilityRole="button" accessibilityLabel="Предыдущий месяц" onPress={() => moveMonth(-1)} style={s.monthArrow}><AppIcon name="chevron-back" size={18} color="#C5FF68" /></Pressable><Text style={s.monthTitle}>{monthLabel}</Text><Pressable accessibilityRole="button" accessibilityLabel="Следующий месяц" onPress={() => moveMonth(1)} style={s.monthArrow}><AppIcon name="chevron-forward" size={18} color="#C5FF68" /></Pressable></View>
      <View style={s.weekdays}>{weekdays.map((label) => <Text key={label} style={s.weekday}>{label}</Text>)}</View>
      <View style={s.days}>{days.map((day, index) => {
        if (day === null) return <View key={'blank-' + index} style={s.dayCell} />;
        const key = dayKey(day); const hasWod = records.some((record) => dateKeyFrom(record.date) === key); const dayTotals = totalsForDate(data.meals, key); const goalMet = nutritionGoalMet(dayTotals);
        return <Pressable key={key} accessibilityRole="button" accessibilityLabel={new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(month.getFullYear(), month.getMonth(), day))} accessibilityState={{ selected: selected === key }} onPress={() => setSelected(key)} style={[s.dayCell, selected === key && s.daySelected, key === today && s.dayToday]}><Text style={[s.dayText, selected === key && s.dayTextSelected]}>{day}</Text><View style={s.dots}>{hasWod && <View style={[s.dot, s.wodDot]} />}{goalMet && <View style={[s.dot, s.nutritionDot]} />}</View></Pressable>;
      })}</View>
      <View style={s.legend}><Legend color="#C5FF68" label="WOD" /><Legend color="#64BCFF" label="Калории и белок в норме" /></View>
    </View>
    <View style={s.sectionHeading}><Text style={s.sectionTitle}>Сводка за {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(parseDateKey(selected))}</Text></View>
    <View style={s.summaryCard}><Text style={s.summaryHeading}>ПИТАНИЕ</Text><View style={s.nutritionGrid}><DailyMacro label="Ккал" value={Math.round(totals.calories)} unit="" /><DailyMacro label="Белки" value={totals.protein} unit="г" /><DailyMacro label="Жиры" value={totals.fat} unit="г" /><DailyMacro label="Углеводы" value={totals.carbs} unit="г" /><DailyMacro label="Клетчатка" value={totals.fiber} unit="г" /></View><Text style={s.foodCount}>{selectedMeals.length} записей о еде</Text></View>
    <View style={s.summaryCard}><Text style={s.summaryHeading}>ЗАМЕРЫ</Text><View style={s.measureSummary}><Text style={s.measureValue}>{measurement?.weight ?? '—'} <Text style={s.measureUnit}>кг</Text></Text><View style={s.measureDivider} /><Text style={s.measureValue}>{measurement?.waist ?? '—'} <Text style={s.measureUnit}>см талия</Text></Text></View></View>
    <View style={s.sectionHeading}><Text style={s.sectionTitle}>Тренировки</Text><Text style={s.count}>{selectedRecords.length}</Text></View>
    {!loaded || !nutritionLoaded ? <Text style={s.empty}>Загружаем сохранённые записи…</Text> : selectedRecords.length === 0 ? <View style={s.emptyCard}><Text style={s.emptyTitle}>В этот день тренировок нет</Text><Text style={s.empty}>Выбери другую дату или сохрани WOD во вкладке таймера.</Text></View> : selectedRecords.map((record) => <WorkoutCard key={record.id} record={record} onShare={() => setShareRecord(record)} onDelete={() => removeRecord(record.id)} />)}
    <View style={s.backupCard}><View style={s.backupHeading}><View style={s.backupIcon}><AppIcon name="cloud-download-outline" size={19} color="#C5FF68" /></View><View style={s.backupCopy}><Text style={s.backupTitle}>Резервная копия</Text><Text style={s.backupDescription}>Сохрани тренировки, рацион и замеры в JSON-файл.</Text></View></View><View style={s.backupActions}><Pressable accessibilityRole="button" onPress={exportBackup} style={s.exportButton}><AppIcon name="download-outline" size={16} color="#11150D" /><Text style={s.exportText}>Экспорт JSON</Text></Pressable><Pressable accessibilityRole="button" onPress={() => Platform.OS === 'web' && fileInput.current?.click()} style={s.importButton}><AppIcon name="return-down-back-outline" size={16} color="#D4DCE6" /><Text style={s.importText}>Импорт</Text></Pressable></View>{backupNotice ? <Text accessibilityLiveRegion="polite" style={s.backupNotice}>{backupNotice}</Text> : null}{Platform.OS === 'web' && <input ref={fileInput} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(event) => void importBackup(event.currentTarget.files?.[0])} />}</View>
    <Text style={s.footer}>КАЖДАЯ ТРЕНИРОВКА — ШАГ ВПЕРЁД</Text>
  </ScrollView><ShareCardModal record={shareRecord} onClose={() => setShareRecord(null)} /></View>;
}

function dateKeyFrom(value: string) { return localDateKey(new Date(value)); }
function parseDateKey(key: string) { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); }
function Stat({ label, value, icon }: { label: string; value: string; icon: ComponentProps<typeof AppIcon>['name'] }) { return <View style={s.stat}><View style={s.statTop}><AppIcon name={icon} size={17} color="#C5FF68" /><Text style={s.statLabel}>{label}</Text></View><Text style={s.statValue}>{value}</Text></View>; }
function Legend({ color, label }: { color: string; label: string }) { return <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: color }]} /><Text style={s.legendText}>{label}</Text></View>; }
function DailyMacro({ label, value, unit }: { label: string; value: number; unit: string }) { return <View style={s.dailyMacro}><Text style={s.dailyValue}>{value}<Text style={s.measureUnit}>{unit}</Text></Text><Text style={s.dailyLabel}>{label}</Text></View>; }
function WorkoutCard({ record, onShare, onDelete }: { record: WorkoutRecord; onShare: () => void; onDelete: () => void }) {
  const date = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(record.date)); const mode = record.mode === 'На время' ? 'FOR TIME' : record.mode.toLocaleUpperCase('ru-RU');
  return <View style={s.workout}><View style={s.workoutTop}><View style={s.modeBadge}><Text style={s.modeText}>{mode}</Text></View><Text style={s.date}>{date}</Text></View><Text numberOfLines={1} style={s.workoutTitle}>{record.title || 'Тренировка'}</Text><View style={s.metrics}><Metric label="ВРЕМЯ" value={formatDuration(record.durationSeconds)} /><Metric label="РАУНДЫ" value={String(record.rounds)} /><Metric label="СПЛИТЫ" value={String(record.splits.length)} /></View>{record.splits.length > 0 && <Text numberOfLines={1} style={s.splits}>{record.splits.slice(-4).map((split) => 'К' + split.round + ' ' + formatDuration(split.seconds)).join('   ·   ')}</Text>}<View style={s.actions}><Pressable accessibilityRole="button" onPress={onShare} style={s.shareButton}><AppIcon name="share-social-outline" size={17} color="#11150D" /><Text style={s.shareText}>Карточка</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Удалить тренировку" onPress={onDelete} style={s.deleteButton}><AppIcon name="trash-outline" size={18} color="#AAB1BC" /><Text style={s.deleteText}>Удалить</Text></Pressable></View></View>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>; }

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0E14' }, content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 25, paddingBottom: 30 },
  kicker: { color: '#9AA3AF', fontSize: 9, letterSpacing: 1.55, fontWeight: '800', marginBottom: 5 }, heading: { color: '#F6F7F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginBottom: 18 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 17 }, stat: { flex: 1, minHeight: 83, padding: 13, backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 17, justifyContent: 'space-between' }, statTop: { flexDirection: 'row', alignItems: 'center', gap: 7 }, statLabel: { color: '#929AA6', fontSize: 8, fontWeight: '800', letterSpacing: 0.5, flexShrink: 1 }, statValue: { color: '#F4F6F9', fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] },
  calendar: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 19, padding: 13, marginBottom: 21 }, calendarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, monthArrow: { width: 33, height: 33, borderRadius: 10, backgroundColor: '#202A1D', alignItems: 'center', justifyContent: 'center' }, monthTitle: { color: '#F2F4F7', textTransform: 'capitalize', fontSize: 15, fontWeight: '800' }, weekdays: { flexDirection: 'row', marginBottom: 3 }, weekday: { width: '14.2857%', textAlign: 'center', color: '#7F8A99', fontSize: 8, fontWeight: '800', paddingVertical: 5 }, days: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.2857%', height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginVertical: 1 }, daySelected: { backgroundColor: '#29351F' }, dayToday: { borderWidth: 1, borderColor: '#617A3C' }, dayText: { color: '#D6DCE4', fontSize: 11, fontWeight: '600' }, dayTextSelected: { color: '#D6FFA1', fontWeight: '900' }, dots: { height: 5, flexDirection: 'row', gap: 3, marginTop: 1 }, dot: { width: 4, height: 4, borderRadius: 3 }, wodDot: { backgroundColor: '#C5FF68' }, nutritionDot: { backgroundColor: '#64BCFF' }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'center' }, legendItem: { flexDirection: 'row', gap: 5, alignItems: 'center' }, legendDot: { width: 6, height: 6, borderRadius: 4 }, legendText: { color: '#939DAB', fontSize: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }, sectionTitle: { color: '#F4F6F9', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' }, count: { color: '#C5FF68', fontSize: 10, fontWeight: '800', backgroundColor: '#26311D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 }, summaryCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 16, padding: 13, marginBottom: 9 }, summaryHeading: { color: '#8D98A7', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 10 }, nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }, dailyMacro: { width: '33.33%' }, dailyValue: { color: '#EAF0F5', fontSize: 13, fontWeight: '800' }, dailyLabel: { color: '#8792A1', fontSize: 8, marginTop: 3 }, measureSummary: { flexDirection: 'row', alignItems: 'center', gap: 14 }, measureValue: { color: '#F0F3F6', fontSize: 16, fontWeight: '800' }, measureUnit: { color: '#929EAD', fontSize: 9, fontWeight: '600' }, measureDivider: { height: 23, width: 1, backgroundColor: '#303A48' }, foodCount: { color: '#7D8998', fontSize: 8, marginTop: 10 },
  emptyCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 17, alignItems: 'center', padding: 20, marginBottom: 14 }, emptyTitle: { color: '#F4F6F9', fontSize: 13, fontWeight: '800', marginBottom: 5 }, empty: { color: '#929AA6', fontSize: 10, lineHeight: 16, textAlign: 'center' },
  workout: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#262F3B', borderRadius: 17, padding: 14, marginBottom: 10 }, workoutTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, modeBadge: { backgroundColor: '#26311D', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 }, modeText: { color: '#C5FF68', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, date: { color: '#89919D', fontSize: 9 }, workoutTitle: { color: '#F4F6F9', fontSize: 15, fontWeight: '800', marginBottom: 11 }, metrics: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303641', paddingTop: 10 }, metric: { flex: 1 }, metricValue: { color: '#C5FF68', fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] }, metricLabel: { color: '#89919D', fontSize: 7, fontWeight: '800', letterSpacing: 0.7, marginTop: 3 }, splits: { color: '#AAB1BC', fontSize: 9, marginTop: 9 }, actions: { flexDirection: 'row', gap: 8, marginTop: 12 }, shareButton: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, shareText: { color: '#13170D', fontSize: 11, fontWeight: '800' }, deleteButton: { paddingHorizontal: 11, minHeight: 38, borderRadius: 11, backgroundColor: '#22262E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, deleteText: { color: '#AAB1BC', fontSize: 10, fontWeight: '700' },
  backupCard: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#303A48', borderRadius: 17, padding: 14, marginTop: 15 }, backupHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, backupIcon: { width: 35, height: 35, backgroundColor: '#202A1D', borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, backupCopy: { flex: 1 }, backupTitle: { color: '#F0F3F6', fontSize: 13, fontWeight: '800' }, backupDescription: { color: '#929EAD', fontSize: 9, lineHeight: 14, marginTop: 3 }, backupActions: { flexDirection: 'row', gap: 8, marginTop: 13 }, exportButton: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: '#C5FF68', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }, exportText: { color: '#13170D', fontSize: 10, fontWeight: '800' }, importButton: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: '#222934', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }, importText: { color: '#D4DCE6', fontSize: 10, fontWeight: '700' }, backupNotice: { color: '#C5FF68', fontSize: 9, marginTop: 9, textAlign: 'center' }, footer: { color: '#737C89', fontSize: 8, fontWeight: '800', textAlign: 'center', letterSpacing: 0.9, marginTop: 14 },
});
