import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from '@/components/AppIcon';
import { playWodAudio, prepareWodAudio } from '@/components/wodAudio';
import { useWorkoutHistory } from '@/components/WorkoutHistoryContext';
import ShareCardModal from '@/components/ShareCardModal';
import type { WorkoutRecord } from '@/components/workoutTypes';

type Mode = 'EMOM' | 'AMRAP' | 'Табата' | 'На время';
type Phase = 'work' | 'rest';
type Split = { round: number; seconds: number };

export default function WodTimerScreen() {
  const { addRecord } = useWorkoutHistory();
  const [mode, setMode] = useState<Mode>('EMOM');
  const [minutes, setMinutes] = useState(12);
  const [rounds, setRounds] = useState(8);
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splits, setSplits] = useState<Split[]>([]);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState('');
  const [pendingRecord, setPendingRecord] = useState<WorkoutRecord | null>(null);
  const [shareRecord, setShareRecord] = useState<WorkoutRecord | null>(null);
  const previousCue = useRef({ round, phase, mode });
  const finishCuePlayed = useRef(false);
  const finishWorkoutRef = useRef<() => void>(() => {});
  const totalRounds = mode === 'AMRAP' ? minutes : rounds;
  const accent = phase === 'rest' && mode === 'Табата' ? '#65B9FF' : mode === 'Табата' ? '#FF9C5C' : '#B9F36B';

  function reset(nextMode: Mode = mode, nextMinutes = minutes, nextRounds = rounds) {
    setRunning(false);
    setCountdown(null);
    setFinished(false);
    setRound(1);
    setElapsed(0);
    setSplits([]);
    setAmrapRounds(0);
    setPhase('work');
    setRemaining(nextMode === 'AMRAP' ? nextMinutes * 60 : nextMode === 'Табата' ? 20 : 60);
  }

  function startCountdown() {
    if (running || countdown !== null || finished) return;
    if (soundEnabled) prepareWodAudio();
    setCountdown(3);
  }

  function pauseTimer() {
    setCountdown(null);
    setRunning(false);
  }

  function changeMode(next: Mode) {
    setMode(next);
    reset(next);
  }

  function adjustMinutes(delta: number) {
    const next = Math.max(1, Math.min(60, minutes + delta));
    setMinutes(next);
    if (mode === 'AMRAP') reset(mode, next, rounds);
  }

  function adjustRounds(delta: number) {
    const next = Math.max(1, Math.min(30, rounds + delta));
    setRounds(next);
    reset(mode, minutes, next);
  }

  function addSplit() {
    setSplits((current) => [...current, { round: current.length + 1, seconds: elapsed }]);
  }

  const finishWorkout = useCallback(() => {
    setRunning(false);
    setFinished(true);
    setRemaining(0);
    const durationSeconds = mode === 'На время' ? elapsed : mode === 'AMRAP' ? minutes * 60 : mode === 'Табата' ? rounds * 30 : rounds * 60;
    setPendingRecord({
      id: String(Date.now()),
      date: new Date().toISOString(),
      mode,
      durationSeconds,
      rounds: mode === 'На время' ? splits.length : mode === 'AMRAP' ? amrapRounds : rounds,
      splits: [...splits],
    });
    setSummaryTitle('');
    setShowSummary(true);
  }, [mode, elapsed, minutes, rounds, splits, amrapRounds]);
  useEffect(() => {
    finishWorkoutRef.current = finishWorkout;
  }, [finishWorkout]);

  useEffect(() => {
    if (countdown === null) return;
    if (soundEnabled) playWodAudio('countdown', countdown);
    const timeout = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(null);
        if (soundEnabled) playWodAudio('start');
        setRunning(true);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [countdown, soundEnabled]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (mode === 'На время') {
        setElapsed((value) => value + 1);
        return;
      }
      if (remaining > 1) {
        setRemaining(remaining - 1);
        return;
      }
      if (mode === 'Табата' && phase === 'work') {
        setPhase('rest');
        setRemaining(10);
        return;
      }
      if (mode === 'Табата' && round < rounds) {
        setRound(round + 1);
        setPhase('work');
        setRemaining(20);
        return;
      }
      if (mode === 'EMOM' && round < rounds) {
        setRound(round + 1);
        setRemaining(60);
        return;
      }
      finishWorkoutRef.current();
    }, 1000);
    return () => clearInterval(timer);
  }, [running, mode, phase, round, rounds, remaining]);

  useEffect(() => {
    const previous = previousCue.current;
    const changedInterval = round !== previous.round || phase !== previous.phase;
    if (running && soundEnabled && changedInterval && mode !== 'На время') {
      playWodAudio('transition');
    }
    previousCue.current = { round, phase, mode };
  }, [running, round, phase, mode, soundEnabled]);

  useEffect(() => {
    if (!finished) finishCuePlayed.current = false;
    if (finished && soundEnabled && !finishCuePlayed.current) {
      playWodAudio('finish');
      finishCuePlayed.current = true;
    }
  }, [finished, soundEnabled]);

  function saveWorkout() {
    if (!pendingRecord) return;
    const record = { ...pendingRecord, title: summaryTitle.trim() || undefined };
    addRecord(record);
    setShowSummary(false);
    setShareRecord(record);
  }

  useEffect(() => {
    if (mode === 'AMRAP' && running && remaining > 0 && remaining < minutes * 60 && remaining % 60 === 0 && soundEnabled) {
      playWodAudio('transition');
    }
  }, [remaining, running, mode, minutes, soundEnabled]);

  const clockSeconds = countdown !== null ? countdown : mode === 'На время' ? elapsed : remaining;
  const time = formatTime(clockSeconds);
  const progress = mode === 'AMRAP'
    ? (1 - remaining / (minutes * 60)) * 100
    : mode === 'На время'
      ? 0
      : finished ? 100 : Math.max(0, Math.min(100, ((round - 1 + (mode === 'Табата' && phase === 'rest' ? 0.5 : 0)) / rounds) * 100));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topline}>
          <View>
            <Text style={s.kicker}>FUNCTIONAL TRAINING</Text>
            <Text style={s.heading}>Таймер WOD</Text>
          </View>
          <View style={s.headerActions}>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Звуковые сигналы"
              accessibilityState={{ checked: soundEnabled }}
              onPress={() => setSoundEnabled((value) => !value)}
              style={[s.soundButton, soundEnabled && s.soundButtonActive]}
            >
              <AppIcon name={soundEnabled ? 'volume-high' : 'volume-mute'} size={17} color={soundEnabled ? '#C5FF68' : '#A2A8B3'} />
            </Pressable>
            <View style={s.liveBadge}>
              <View style={[s.liveDot, { backgroundColor: running ? '#B9F36B' : '#66707E' }]} />
              <Text style={s.liveText}>{countdown !== null ? 'СТАРТ ЧЕРЕЗ' : running ? 'В РАБОТЕ' : finished ? 'ЗАВЕРШЕНО' : 'ГОТОВ'}</Text>
            </View>
          </View>
        </View>

        <View style={s.modePicker}>
          {(['EMOM', 'AMRAP', 'Табата', 'На время'] as Mode[]).map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item }} onPress={() => changeMode(item)} style={[s.modeButton, mode === item && s.modeButtonActive]}>
              <Text style={[s.modeText, mode === item && s.modeTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.timerCard}>
          <View style={s.timerCardTop}>
            <Text style={[s.timerLabel, { color: mode === 'На время' ? '#C5FF68' : accent }]}>
              {countdown !== null ? 'ПРИГОТОВЬСЯ' : mode === 'На время' ? 'СЕКУНДОМЕР' : mode === 'Табата' && phase === 'rest' ? 'ОТДЫХ' : 'РАБОТА'}
            </Text>
            <View style={s.roundBadge}>
              <Text style={s.roundText}>{mode === 'На время' ? 'КРУГОВ · ' + splits.length : mode === 'AMRAP' ? 'ЛИМИТ · ' + minutes + ' МИН' : 'РАУНД ' + Math.min(round, totalRounds) + ' / ' + totalRounds}</Text>
            </View>
          </View>
          <View style={s.clockWrap}>
            <Text accessibilityLabel={mode === 'На время' ? 'Время тренировки' : 'Осталось времени'} style={[s.clock, { color: countdown !== null ? '#FFFFFF' : accent }]}>{time}</Text>
          </View>
          <Text style={s.timerHint}>{countdown !== null ? 'Займи позицию' : mode === 'EMOM' ? 'Каждую минуту — новое усилие' : mode === 'AMRAP' ? 'Выполни как можно больше раундов' : mode === 'Табата' ? '20 сек работа · 10 сек отдых' : 'Фиксируй время каждого круга'}</Text>
          {mode === 'На время' ? (
            <View style={s.progressMeta}>
              <Text style={s.progressCaption}>ЗАФИКСИРОВАНО КРУГОВ</Text>
              <Text style={s.progressValue}>{splits.length}</Text>
            </View>
          ) : (
            <>
              <View style={s.progressTrack}><View style={[s.progressFill, { width: String(progress) + '%', backgroundColor: accent }]} /></View>
              <View style={s.progressMeta}><Text style={s.progressCaption}>ПРОГРЕСС СЕССИИ</Text><Text style={s.progressValue}>{Math.round(progress)}%</Text></View>
            </>
          )}
        </View>

        <View style={s.controls}>
          <Pressable accessibilityRole="button" onPress={startCountdown} disabled={running || countdown !== null || finished} style={[s.primaryButton, (running || countdown !== null || finished) && s.disabledButton]}>
            <AppIcon name="play" size={18} color="#11150D" /><Text style={s.primaryText}>Старт</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={pauseTimer} disabled={!running && countdown === null} style={[s.secondaryButton, !running && countdown === null && s.disabledButton]}>
            <AppIcon name="pause" size={18} color="#F4F6F9" /><Text style={s.secondaryText}>Пауза</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Сбросить таймер" onPress={() => reset()} style={s.resetButton}><AppIcon name="refresh" size={19} color="#BAC1CC" /></Pressable>
        </View>

        {mode === 'На время' && (
          <View style={s.splitsSection}>
            <Pressable accessibilityRole="button" onPress={addSplit} disabled={!running} style={[s.lapButton, !running && s.disabledButton]}>
              <AppIcon name="add-circle" size={22} color="#11150D" /><Text style={s.lapButtonText}>+ Круг</Text>
            </Pressable>
            {running && <Pressable accessibilityRole="button" onPress={finishWorkout} style={s.finishButton}><AppIcon name="checkmark-circle" size={19} color="#F4F6F9" /><Text style={s.finishButtonText}>Завершить и сохранить</Text></Pressable>}
            {splits.length > 0 && (
              <View style={s.splitList}>
                <View style={s.splitHeader}><Text style={s.splitHeaderText}>КРУГ</Text><Text style={s.splitHeaderText}>ВРЕМЯ</Text></View>
                {[...splits].reverse().map((split) => (
                  <View key={split.round} style={s.splitRow}><Text style={s.splitRound}>Круг {String(split.round).padStart(2, '0')}</Text><Text style={s.splitTime}>{formatTime(split.seconds)}</Text></View>
                ))}
              </View>
            )}
          </View>
        )}

        {mode !== 'На время' && (
          <View style={s.settingsCard}>
            <View style={s.settingsHeading}><Text style={s.cardTitle}>Настройка тренировки</Text><AppIcon name="options-outline" size={19} color="#8D96A3" /></View>
            {mode === 'AMRAP'
              ? <Counter label="ДЛИТЕЛЬНОСТЬ" value={minutes + ' мин'} onMinus={() => adjustMinutes(-1)} onPlus={() => adjustMinutes(1)} disabled={running || countdown !== null} />
              : <Counter label="РАУНДЫ" value={String(rounds)} onMinus={() => adjustRounds(-1)} onPlus={() => adjustRounds(1)} disabled={running || countdown !== null} />}
          </View>
        )}
        {mode === 'AMRAP' && running && <Pressable accessibilityRole="button" onPress={() => setAmrapRounds((value) => value + 1)} style={s.amrapLap}><AppIcon name="add-circle-outline" size={19} color="#C5FF68" /><Text style={s.amrapLapText}>Добавить круг · {amrapRounds}</Text></Pressable>}
        <Text style={s.footer}>НАСТРОЙ НАГРУЗКУ · ДЕРЖИ РИТМ</Text>
      </ScrollView>
      <Modal visible={showSummary} transparent animationType="fade" onRequestClose={() => setShowSummary(false)}>
        <View style={s.modalOverlay}>
          <View style={s.summaryCard}>
            <View style={s.summaryIcon}><AppIcon name="checkmark-done" size={24} color="#C5FF68" /></View>
            <Text style={s.summaryEyebrow}>WOD ЗАВЕРШЁН</Text>
            <Text style={s.summaryHeading}>Отличная работа</Text>
            <Text style={s.summaryDetail}>{pendingRecord?.mode === 'На время' ? 'FOR TIME' : pendingRecord?.mode.toLocaleUpperCase('ru-RU')}  ·  {pendingRecord ? formatTime(pendingRecord.durationSeconds) : '00:00'}  ·  {pendingRecord?.rounds ?? 0} кругов</Text>
            <TextInput accessibilityLabel="Название комплекса (необязательно)" placeholder="Название комплекса (необязательно)" placeholderTextColor="#7D8794" value={summaryTitle} onChangeText={setSummaryTitle} style={s.titleInput} />
            <Pressable accessibilityRole="button" onPress={saveWorkout} style={s.saveButton}><AppIcon name="save-outline" size={18} color="#11150D" /><Text style={s.saveButtonText}>Сохранить и создать карточку</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setShowSummary(false)} style={s.dismissButton}><Text style={s.dismissText}>Позже</Text></Pressable>
          </View>
        </View>
      </Modal>
      <ShareCardModal record={shareRecord} onClose={() => setShareRecord(null)} />
    </View>
  );
}

function Counter({ label, value, onMinus, onPlus, disabled }: { label: string; value: string; onMinus: () => void; onPlus: () => void; disabled: boolean }) {
  return (
    <View style={s.counter}>
      <Text style={s.counterLabel}>{label}</Text>
      <View style={s.counterControl}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Уменьшить ' + label} disabled={disabled} onPress={onMinus} style={s.counterButton}><AppIcon name="remove" size={17} color="#F3F5F8" /></Pressable>
        <Text style={s.counterValue}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={'Увеличить ' + label} disabled={disabled} onPress={onPlus} style={s.counterButton}><AppIcon name="add" size={17} color="#F3F5F8" /></Pressable>
      </View>
    </View>
  );
}

function formatTime(seconds: number) {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 23, paddingBottom: 28 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  kicker: { color: '#9AA3AF', fontSize: 9, letterSpacing: 1.55, fontWeight: '800', marginBottom: 6 },
  heading: { color: '#F6F7F9', fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  soundButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#1A1E25', borderWidth: 1, borderColor: '#303641', alignItems: 'center', justifyContent: 'center' },
  soundButtonActive: { backgroundColor: '#20291B', borderColor: '#405332' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#1A1E25', borderRadius: 30, paddingHorizontal: 11, paddingVertical: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: '#D8DCE2', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  modePicker: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#181B21', marginBottom: 16 },
  modeButton: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#303640' },
  modeText: { color: '#AAB1BC', fontSize: 11, fontWeight: '700' },
  modeTextActive: { color: '#FFFFFF' },
  timerCard: { backgroundColor: '#171A20', borderColor: '#292E37', borderWidth: 1, borderRadius: 23, padding: 20, marginBottom: 14 },
  timerCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { fontSize: 10, letterSpacing: 1.45, fontWeight: '900' },
  roundBadge: { backgroundColor: '#22262E', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  roundText: { color: '#F4F6F9', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  clockWrap: { alignItems: 'center', marginTop: 5 },
  clock: { fontSize: 84, lineHeight: 100, fontWeight: '800', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  timerHint: { color: '#ABB2BD', fontSize: 12, textAlign: 'center', marginTop: -2 },
  progressTrack: { height: 6, borderRadius: 8, backgroundColor: '#2D323B', marginTop: 23, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  progressCaption: { color: '#929AA6', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  progressValue: { color: '#F4F6F9', fontSize: 11, fontWeight: '800' },
  controls: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  primaryButton: { flex: 1, height: 52, borderRadius: 15, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: '#13170D', fontSize: 14, fontWeight: '800' },
  secondaryButton: { flex: 1, height: 52, borderRadius: 15, backgroundColor: '#242932', borderWidth: 1, borderColor: '#343A45', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryText: { color: '#F4F6F9', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.48 },
  resetButton: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#1C2027', borderWidth: 1, borderColor: '#303641', alignItems: 'center', justifyContent: 'center' },
  settingsCard: { backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 20, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 4 },
  settingsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { color: '#F4F6F9', fontSize: 14, fontWeight: '800' },
  counter: { minHeight: 57, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterLabel: { color: '#929AA6', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  counterControl: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  counterButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#282D36', alignItems: 'center', justifyContent: 'center' },
  counterValue: { color: '#F4F6F9', fontSize: 14, fontWeight: '700', minWidth: 54, textAlign: 'center' },
  splitsSection: { marginBottom: 15 },
  lapButton: { minHeight: 62, borderRadius: 17, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  lapButtonText: { color: '#13170D', fontSize: 18, fontWeight: '900' },
  finishButton: { minHeight: 48, marginTop: 9, borderRadius: 14, backgroundColor: '#232832', borderWidth: 1, borderColor: '#353C47', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  finishButtonText: { color: '#F4F6F9', fontSize: 13, fontWeight: '700' },
  splitList: { marginTop: 13, backgroundColor: '#171A20', borderWidth: 1, borderColor: '#292E37', borderRadius: 17, paddingHorizontal: 14, paddingVertical: 5 },
  splitHeader: { height: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#303641' },
  splitHeaderText: { color: '#929AA6', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  splitRow: { height: 43, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2A2F38' },
  splitRound: { color: '#DDE1E7', fontSize: 12, fontWeight: '600' },
  splitTime: { color: '#C5FF68', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  footer: { color: '#737C89', fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 1.2, marginTop: 18 },
  amrapLap: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: '#1E2419', marginBottom: 8 },
  amrapLapText: { color: '#C5FF68', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0,0,0,0.76)' },
  summaryCard: { width: '100%', maxWidth: 390, backgroundColor: '#171A20', borderWidth: 1, borderColor: '#343A45', borderRadius: 24, padding: 22, alignItems: 'center' },
  summaryIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#29351D', alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  summaryEyebrow: { color: '#C5FF68', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  summaryHeading: { color: '#F4F6F9', fontSize: 23, fontWeight: '800', marginTop: 5 },
  summaryDetail: { color: '#AAB1BC', fontSize: 11, fontWeight: '700', marginTop: 7, marginBottom: 18, textAlign: 'center' },
  titleInput: { width: '100%', height: 48, borderRadius: 13, borderWidth: 1, borderColor: '#373E49', backgroundColor: '#101318', color: '#F4F6F9', paddingHorizontal: 13, fontSize: 13, marginBottom: 11 },
  saveButton: { width: '100%', height: 49, borderRadius: 14, backgroundColor: '#C5FF68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveButtonText: { color: '#13170D', fontSize: 13, fontWeight: '800' },
  dismissButton: { padding: 12, marginTop: 4 },
  dismissText: { color: '#AAB1BC', fontSize: 12, fontWeight: '700' },
});
