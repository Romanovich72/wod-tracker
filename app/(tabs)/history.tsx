import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import ShareCardModal from '@/components/ShareCardModal';
import { useWorkoutHistory } from '@/components/WorkoutHistoryContext';
import { formatDuration } from '@/components/workoutShareCanvas';
import type { WorkoutRecord } from '@/components/workoutTypes';

export default function HistoryScreen() {
  const { records, loaded, removeRecord } = useWorkoutHistory();
  const [shareRecord, setShareRecord] = useState<WorkoutRecord | null>(null);
  const totalMinutes = (records.reduce((total, record) => total + record.durationSeconds, 0) / 60).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.kicker}>ТВОЙ ПРОГРЕСС</Text>
        <Text style={s.heading}>История</Text>
        <View style={s.stats}>
          <Stat label="ТРЕНИРОВОК" value={String(records.length)} icon="fitness-outline" />
          <Stat label="МИНУТ В ДВИЖЕНИИ" value={String(totalMinutes)} icon="time-outline" />
        </View>
        <View style={s.sectionHeading}><Text style={s.sectionTitle}>Недавние тренировки</Text><Text style={s.count}>{records.length}</Text></View>
        {!loaded ? <Text style={s.empty}>Загружаем историю…</Text> : records.length === 0 ? (
          <View style={s.emptyCard}><View style={s.emptyIcon}><AppIcon name="barbell-outline" size={25} color="#C5FF68" /></View><Text style={s.emptyTitle}>Пока нет тренировок</Text><Text style={s.empty}>Заверши WOD и сохрани результат — он появится здесь.</Text></View>
        ) : records.map((record) => (
          <WorkoutCard key={record.id} record={record} onShare={() => setShareRecord(record)} onDelete={() => removeRecord(record.id)} />
        ))}
        <Text style={s.footer}>КАЖДАЯ ТРЕНИРОВКА — ШАГ ВПЕРЁД</Text>
      </ScrollView>
      <ShareCardModal record={shareRecord} onClose={() => setShareRecord(null)} />
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ComponentProps<typeof AppIcon>['name'] }) {
  return <View style={s.stat}><View style={s.statTop}><AppIcon name={icon} size={17} color="#C5FF68" /><Text style={s.statLabel}>{label}</Text></View><Text style={s.statValue}>{value}</Text></View>;
}

function WorkoutCard({ record, onShare, onDelete }: { record: WorkoutRecord; onShare: () => void; onDelete: () => void }) {
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(record.date));
  const mode = record.mode === 'На время' ? 'FOR TIME' : record.mode.toLocaleUpperCase('ru-RU');
  return (
    <View style={s.workout}>
      <View style={s.workoutTop}><View style={s.modeBadge}><Text style={s.modeText}>{mode}</Text></View><Text style={s.date}>{date}</Text></View>
      <Text numberOfLines={1} style={s.workoutTitle}>{record.title || 'Тренировка'}</Text>
      <View style={s.metrics}>
        <Metric label="ВРЕМЯ" value={formatDuration(record.durationSeconds)} />
        <Metric label="РАУНДЫ" value={String(record.rounds)} />
        <Metric label="СПЛИТЫ" value={String(record.splits.length)} />
      </View>
      {record.splits.length > 0 && <Text numberOfLines={1} style={s.splits}>{record.splits.slice(-4).map((split) => 'К' + split.round + ' ' + formatDuration(split.seconds)).join('   ·   ')}</Text>}
      <View style={s.actions}>
        <Pressable accessibilityRole="button" onPress={onShare} style={s.shareButton}><AppIcon name="share-social-outline" size={17} color="#11150D" /><Text style={s.shareText}>Карточка</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Удалить тренировку" onPress={onDelete} style={s.deleteButton}><AppIcon name="trash-outline" size={18} color="#AAB1BC" /><Text style={s.deleteText}>Удалить</Text></Pressable>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 25, paddingBottom: 30 },
  kicker: { color: '#9AA3AF', fontSize: 9, letterSpacing: 1.55, fontWeight: '800', marginBottom: 5 },
  heading: { color: '#F6F7F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginBottom: 18 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  stat: { flex: 1, minHeight: 98, padding: 14, backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 18, justifyContent: 'space-between' },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statLabel: { color: '#929AA6', fontSize: 8, fontWeight: '800', letterSpacing: 0.6, flexShrink: 1 },
  statValue: { color: '#F4F6F9', fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  sectionTitle: { color: '#F4F6F9', fontSize: 16, fontWeight: '800' },
  count: { color: '#C5FF68', fontSize: 11, fontWeight: '800', backgroundColor: '#26311D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  emptyCard: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 20, alignItems: 'center', padding: 24 },
  emptyIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#252D1D', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#F4F6F9', fontSize: 15, fontWeight: '800', marginBottom: 6 },
  empty: { color: '#929AA6', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  workout: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 19, padding: 15, marginBottom: 11 },
  workoutTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  modeBadge: { backgroundColor: '#26311D', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  modeText: { color: '#C5FF68', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  date: { color: '#89919D', fontSize: 10, fontWeight: '600' },
  workoutTitle: { color: '#F4F6F9', fontSize: 16, fontWeight: '800', marginBottom: 13 },
  metrics: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303641', paddingTop: 11 },
  metric: { flex: 1 },
  metricValue: { color: '#C5FF68', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#89919D', fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  splits: { color: '#AAB1BC', fontSize: 10, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  shareButton: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  shareText: { color: '#13170D', fontSize: 12, fontWeight: '800' },
  deleteButton: { paddingHorizontal: 11, minHeight: 40, borderRadius: 12, backgroundColor: '#22262E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  deleteText: { color: '#AAB1BC', fontSize: 11, fontWeight: '700' },
  footer: { color: '#737C89', fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 1, marginTop: 14 },
});
