import { useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import { downloadWorkoutCard, renderWorkoutCard, type ShareFormat } from '@/components/workoutShareCanvas';
import { formatDuration } from '@/components/workoutShareCanvas';
import type { WorkoutRecord } from '@/components/workoutTypes';

export default function ShareCardModal({ record, onClose }: { record: WorkoutRecord | null; onClose: () => void }) {
  const [format, setFormat] = useState<ShareFormat>('story');
  const image = useMemo(() => record && Platform.OS === 'web' ? renderWorkoutCard(record, format) : '', [record, format]);

  if (!record) return null;
  const aspectRatio = format === 'story' ? 9 / 16 : 1;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <View><Text style={s.eyebrow}>ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ</Text><Text style={s.heading}>Карточка WOD</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} style={s.close}><AppIcon name="close" size={20} color="#E8EBF0" /></Pressable>
          </View>
          <View style={s.formats}>
            <FormatButton label="Сторис 9:16" selected={format === 'story'} onPress={() => setFormat('story')} />
            <FormatButton label="Пост 1:1" selected={format === 'post'} onPress={() => setFormat('post')} />
          </View>
          <ScrollView style={s.previewScroll} contentContainerStyle={s.previewArea} showsVerticalScrollIndicator={false}>
            <View style={[s.preview, { aspectRatio }]}>
              {image ? <Image source={{ uri: image }} resizeMode="contain" style={s.previewImage} /> : (
                <View style={s.fallback}>
                  <Text style={s.previewBrand}>WOD / TRAINING LOG</Text><Text style={s.previewMode}>{record.mode === 'На время' ? 'FOR TIME' : record.mode.toLocaleUpperCase('ru-RU')}</Text>
                  <Text numberOfLines={2} style={s.previewTitle}>{record.title || 'ТРЕНИРОВКА'}</Text><Text style={s.previewTime}>{formatDuration(record.durationSeconds)}</Text>
                  <Text style={s.previewMeta}>РАУНДЫ  {record.rounds}     СПЛИТЫ  {record.splits.length}</Text>
                  <Text style={s.previewDate}>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(record.date))}</Text>
                </View>
              )}
            </View>
          </ScrollView>
          {Platform.OS === 'web' ? (
            <Pressable accessibilityRole="button" onPress={() => downloadWorkoutCard(record, format)} style={s.download}><AppIcon name="download-outline" size={19} color="#11150D" /><Text style={s.downloadText}>Скачать PNG</Text></Pressable>
          ) : <Text style={s.nativeNote}>Скачивание PNG доступно в веб-версии</Text>}
        </View>
      </View>
    </Modal>
  );
}

function FormatButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.format, selected && s.formatSelected]}><Text style={[s.formatText, selected && s.formatTextSelected]}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.76)', padding: 14 },
  sheet: { width: '100%', maxWidth: 430, maxHeight: '94%', backgroundColor: '#14171D', borderRadius: 24, borderWidth: 1, borderColor: '#303641', padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { color: '#98A1AE', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  heading: { color: '#F4F6F9', fontSize: 21, fontWeight: '800', marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#242932', alignItems: 'center', justifyContent: 'center' },
  formats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  format: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#343A45', backgroundColor: '#1A1E25', paddingVertical: 10, alignItems: 'center' },
  formatSelected: { borderColor: '#9AC544', backgroundColor: '#26311D' },
  formatText: { color: '#AAB1BC', fontSize: 12, fontWeight: '700' },
  formatTextSelected: { color: '#D7FFA0' },
  previewScroll: { flexShrink: 1 },
  previewArea: { alignItems: 'center', paddingBottom: 12 },
  preview: { width: '100%', maxWidth: 220, overflow: 'hidden', borderRadius: 16, backgroundColor: '#0F1115', borderWidth: 1, borderColor: '#333A43' },
  previewImage: { width: '100%', height: '100%' },
  fallback: { flex: 1, padding: 16, justifyContent: 'space-around', backgroundColor: '#0F1115' },
  previewBrand: { color: '#E9EDF2', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  previewMode: { color: '#CCFF00', fontSize: 10, fontWeight: '800' },
  previewTitle: { color: '#F4F6F9', fontSize: 15, fontWeight: '700' },
  previewTime: { color: '#CCFF00', fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  previewMeta: { color: '#AAB1BC', fontSize: 9, fontWeight: '700' },
  previewDate: { color: '#929AA6', fontSize: 9 },
  download: { height: 48, borderRadius: 14, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  downloadText: { color: '#13170D', fontSize: 14, fontWeight: '800' },
  nativeNote: { color: '#929AA6', fontSize: 11, textAlign: 'center', marginTop: 10 },
});
