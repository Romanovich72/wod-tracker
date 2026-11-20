import type { WorkoutRecord } from './workoutTypes';

export type ShareFormat = 'story' | 'post';

export function renderWorkoutCard(record: WorkoutRecord, format: ShareFormat) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = format === 'story' ? 1920 : 1080;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const ctx = context;
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.78, height * 0.2, 0, width * 0.65, height * 0.26, width * 0.78);
  glow.addColorStop(0, 'rgba(125, 171, 43, 0.24)');
  glow.addColorStop(0.48, 'rgba(59, 78, 33, 0.10)');
  glow.addColorStop(1, 'rgba(11, 14, 20, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = 'rgba(210, 228, 189, 0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  const pad = 86;
  ctx.fillStyle = '#E9EDF2';
  ctx.font = '800 27px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('WOD  /  TRAINING LOG', pad, height * 0.085);
  ctx.fillStyle = '#CCFF00';
  ctx.fillRect(pad, height * 0.102, 68, 6);

  const modeLabel = record.mode === 'На время' ? 'FOR TIME' : record.mode === 'Табата' ? 'ТАБАТА' : record.mode;
  const badgeY = height * 0.205;
  ctx.font = '800 25px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  const badgeWidth = ctx.measureText(modeLabel).width + 48;
  ctx.fillStyle = 'rgba(204,255,0,0.12)';
  roundRect(ctx, pad, badgeY - 38, badgeWidth, 58, 19);
  ctx.fill();
  ctx.fillStyle = '#CCFF00';
  ctx.fillText(modeLabel, pad + 24, badgeY);

  const title = (record.title || 'ТРЕНИРОВКА').toLocaleUpperCase('ru-RU');
  let titleSize = format === 'story' ? 59 : 52;
  ctx.letterSpacing = '0px';
  ctx.font = '700 ' + titleSize + 'px system-ui, -apple-system, sans-serif';
  while (ctx.measureText(title).width > width - pad * 2 && titleSize > 30) {
    titleSize -= 2;
    ctx.font = '700 ' + titleSize + 'px system-ui, -apple-system, sans-serif';
  }
  ctx.fillStyle = '#F4F6F9';
  ctx.fillText(title, pad, height * 0.315);

  const timeY = height * 0.51;
  ctx.fillStyle = '#CCFF00';
  ctx.font = '800 ' + (format === 'story' ? 184 : 162) + 'px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '-6px';
  ctx.fillText(formatDuration(record.durationSeconds), pad - 7, timeY);

  const dividerY = height * 0.59;
  ctx.strokeStyle = 'rgba(214,221,230,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, dividerY);
  ctx.lineTo(width - pad, dividerY);
  ctx.stroke();

  ctx.letterSpacing = '2px';
  ctx.fillStyle = '#929AA6';
  ctx.font = '800 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('РАУНДЫ', pad, height * 0.68);
  ctx.fillText('СПЛИТЫ', width * 0.54, height * 0.68);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#F4F6F9';
  ctx.font = '700 56px system-ui, -apple-system, sans-serif';
  ctx.fillText(String(record.rounds), pad, height * 0.73);
  ctx.fillStyle = '#CCFF00';
  ctx.font = '700 32px system-ui, -apple-system, sans-serif';
  ctx.fillText(String(record.splits.length), width * 0.54, height * 0.73);

  const splitStart = height * 0.785;
  const splitGap = format === 'story' ? 62 : 48;
  const visibleSplits = record.splits.slice(-4).reverse();
  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  visibleSplits.forEach((split, index) => {
    const y = splitStart + index * splitGap;
    ctx.fillStyle = '#B7BEC8';
    ctx.fillText('КРУГ ' + String(split.round).padStart(2, '0'), width * 0.54, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#F4F6F9';
    ctx.fillText(formatDuration(split.seconds), width - pad, y);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(214,221,230,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.54, y + 17);
    ctx.lineTo(width - pad, y + 17);
    ctx.stroke();
  });

  ctx.fillStyle = '#929AA6';
  ctx.font = '600 23px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(formatDate(record.date), pad, height * 0.94);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#CCFF00';
  ctx.font = '800 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('MOVE WITH INTENT', width - pad, height * 0.94);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

export function downloadWorkoutCard(record: WorkoutRecord, format: ShareFormat) {
  const dataUrl = renderWorkoutCard(record, format);
  if (!dataUrl || typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'wod-' + record.mode.toLowerCase().replaceAll(' ', '-') + '-' + format + '.png';
  link.click();
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes >= 60) {
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
  }
  return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(date).toUpperCase();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
