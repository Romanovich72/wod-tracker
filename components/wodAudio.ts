import { Platform } from 'react-native';

type SoundCue = 'countdown' | 'start' | 'transition' | 'finish';
let context: AudioContext | null = null;

export function prepareWodAudio() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  context = context ?? new AudioContextConstructor();
  if (context.state === 'suspended') void context.resume();
}

export function playWodAudio(cue: SoundCue, count = 0) {
  if (Platform.OS !== 'web' || !context || context.state !== 'running') return;
  if (cue === 'finish') {
    playTone(360, 0.9, 'triangle', 0.2, true);
    playTone(540, 0.72, 'sine', 0.12, true);
    return;
  }
  const frequency = cue === 'countdown' ? 560 + (3 - count) * 110 : cue === 'start' ? 1040 : 720;
  playTone(frequency, cue === 'transition' ? 0.16 : 0.11, 'sine', 0.15, false);
}

function playTone(frequency: number, duration: number, shape: OscillatorType, volume: number, gong: boolean) {
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (gong) oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * 0.35), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}
