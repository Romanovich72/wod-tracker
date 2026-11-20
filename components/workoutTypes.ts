export type WorkoutMode = 'EMOM' | 'AMRAP' | 'Табата' | 'На время';
export type WorkoutSplit = { round: number; seconds: number };
export type WorkoutRecord = {
  id: string;
  date: string;
  mode: WorkoutMode;
  durationSeconds: number;
  rounds: number;
  splits: WorkoutSplit[];
  title?: string;
};
