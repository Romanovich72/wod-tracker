
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { WorkoutRecord } from './workoutTypes';

const STORAGE_KEY = 'wod-training-history-v1';
type HistoryContextValue = {
  records: WorkoutRecord[];
  loaded: boolean;
  addRecord: (record: WorkoutRecord) => void;
  removeRecord: (id: string) => void;
};
const HistoryContext = createContext<HistoryContextValue | null>(null);

export function WorkoutHistoryProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setRecords(JSON.parse(stored) as WorkoutRecord[]);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records)).catch(() => undefined);
  }, [records, loaded]);

  const addRecord = useCallback((record: WorkoutRecord) => setRecords((current) => [record, ...current]), []);
  const removeRecord = useCallback((id: string) => setRecords((current) => current.filter((record) => record.id !== id)), []);
  const value = useMemo(() => ({ records, loaded, addRecord, removeRecord }), [records, loaded, addRecord, removeRecord]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useWorkoutHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('WorkoutHistoryProvider не подключён');
  return context;
}
