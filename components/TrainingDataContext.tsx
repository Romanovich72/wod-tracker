import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const FOOD_STORAGE_KEY = 'wod-food-tracker-v1';
export const FOOD_CATEGORIES = ['Завтрак', 'Обед', 'Ужин', 'Перекус'] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
export type FoodMacros = { calories: number; protein: number; fat: number; carbs: number; fiber: number };
export type FoodPreset = FoodMacros & { id: string; name: string; baseGrams: number };
export type MealEntry = FoodMacros & { id: string; presetId: string; name: string; category: FoodCategory; dateKey: string; grams: number };
export type BodyMeasurement = { dateKey: string; weight: number | null; waist: number | null };
export type NutritionData = { version: 2; meals: MealEntry[]; presets: FoodPreset[]; measurements: BodyMeasurement[] };

export const NUTRITION_TARGETS: FoodMacros = { calories: 2200, protein: 160, fat: 70, carbs: 240, fiber: 30 };

export const DEFAULT_PRESETS: FoodPreset[] = [
  { id: 'preset-protein', name: 'Протеин', baseGrams: 30, calories: 130, protein: 25, fat: 2, carbs: 4, fiber: 0 },
  { id: 'preset-chicken-buckwheat', name: 'Курица с гречкой', baseGrams: 300, calories: 450, protein: 38, fat: 10, carbs: 50, fiber: 5 },
];

const TrainingDataContext = createContext<{
  data: NutritionData;
  loaded: boolean;
  addMeal: (preset: FoodPreset, category: FoodCategory, grams: number, dateKey?: string) => void;
  removeMeal: (id: string) => void;
  savePreset: (preset: FoodPreset) => void;
  updateMeasurement: (dateKey: string, field: 'weight' | 'waist', value: number | null) => void;
  repeatYesterday: () => number;
  replaceNutrition: (data: NutritionData) => void;
} | null>(null);

export function localDateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function dateKeyFromIso(value: string) {
  return localDateKey(new Date(value));
}

export function emptyNutritionData(): NutritionData {
  return { version: 2, meals: [], presets: DEFAULT_PRESETS.map((preset) => ({ ...preset })), measurements: [] };
}

function migrateNutrition(raw: unknown): NutritionData {
  const fallback = emptyNutritionData();
  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Record<string, unknown>;
  if (value.version === 2) {
    const saved = value as Partial<NutritionData>;
    return {
      version: 2,
      meals: Array.isArray(saved.meals) ? saved.meals as MealEntry[] : [],
      presets: Array.isArray(saved.presets) && saved.presets.length ? saved.presets as FoodPreset[] : fallback.presets,
      measurements: Array.isArray(saved.measurements) ? saved.measurements as BodyMeasurement[] : [],
    };
  }

  const legacy = Array.isArray(value.meals) ? value.meals as Record<string, unknown>[] : [];
  const dateKey = localDateKey();
  const meals: MealEntry[] = legacy.map((meal, index) => ({
    id: String(meal.id ?? 'migrated-' + index),
    presetId: '',
    name: String(meal.name ?? 'Блюдо'),
    category: 'Перекус',
    dateKey,
    grams: 100,
    calories: numberValue(meal.calories),
    protein: numberValue(meal.protein),
    fat: numberValue(meal.fat),
    carbs: numberValue(meal.carbs),
    fiber: 0,
  }));
  const legacyWeight = typeof value.weight === 'string' ? parseNumber(value.weight) : null;
  return {
    version: 2,
    meals,
    presets: fallback.presets,
    measurements: legacyWeight === null ? [] : [{ dateKey, weight: legacyWeight, waist: null }],
  };
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function totalsForDate(meals: MealEntry[], dateKey: string): FoodMacros {
  return meals.filter((meal) => meal.dateKey === dateKey).reduce((total, meal) => ({
    calories: total.calories + meal.calories,
    protein: total.protein + meal.protein,
    fat: total.fat + meal.fat,
    carbs: total.carbs + meal.carbs,
    fiber: total.fiber + meal.fiber,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
}

export function nutritionGoalMet(totals: FoodMacros) {
  return totals.calories >= NUTRITION_TARGETS.calories * 0.9
    && totals.calories <= NUTRITION_TARGETS.calories * 1.1
    && totals.protein >= NUTRITION_TARGETS.protein;
}

export function TrainingDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<NutritionData>(() => emptyNutritionData());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FOOD_STORAGE_KEY)
      .then((saved) => { if (saved) setData(migrateNutrition(JSON.parse(saved) as unknown)); })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
  }, [data, loaded]);

  const addMeal = useCallback((preset: FoodPreset, category: FoodCategory, grams: number, dateKey = localDateKey()) => {
    const amount = Math.max(1, grams) / Math.max(1, preset.baseGrams);
    const entry: MealEntry = {
      id: String(Date.now()) + Math.random(),
      presetId: preset.id,
      name: preset.name,
      category,
      dateKey,
      grams: Math.max(1, grams),
      calories: Math.round(preset.calories * amount),
      protein: roundMacro(preset.protein * amount),
      fat: roundMacro(preset.fat * amount),
      carbs: roundMacro(preset.carbs * amount),
      fiber: roundMacro(preset.fiber * amount),
    };
    setData((current) => ({ ...current, meals: [...current.meals, entry] }));
  }, []);

  const removeMeal = useCallback((id: string) => setData((current) => ({ ...current, meals: current.meals.filter((meal) => meal.id !== id) })), []);
  const savePreset = useCallback((preset: FoodPreset) => setData((current) => ({
    ...current,
    presets: current.presets.some((item) => item.id === preset.id)
      ? current.presets.map((item) => item.id === preset.id ? preset : item)
      : [...current.presets, preset],
  })), []);
  const updateMeasurement = useCallback((dateKey: string, field: 'weight' | 'waist', value: number | null) => setData((current) => {
    const existing = current.measurements.find((measurement) => measurement.dateKey === dateKey);
    const next: BodyMeasurement = { dateKey, weight: existing?.weight ?? null, waist: existing?.waist ?? null, [field]: value };
    const hasValues = next.weight !== null || next.waist !== null;
    return {
      ...current,
      measurements: hasValues
        ? [...current.measurements.filter((measurement) => measurement.dateKey !== dateKey), next].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        : current.measurements.filter((measurement) => measurement.dateKey !== dateKey),
    };
  }), []);
  const repeatYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const sourceDate = localDateKey(yesterday);
    const targetDate = localDateKey();
    const copies = data.meals.filter((meal) => meal.dateKey === sourceDate).map((meal) => ({ ...meal, id: String(Date.now()) + Math.random(), dateKey: targetDate }));
    if (copies.length) setData((current) => ({ ...current, meals: [...current.meals, ...copies] }));
    return copies.length;
  }, [data.meals]);
  const replaceNutrition = useCallback((next: NutritionData) => setData({ ...next, version: 2 }), []);

  const value = useMemo(() => ({ data, loaded, addMeal, removeMeal, savePreset, updateMeasurement, repeatYesterday, replaceNutrition }), [data, loaded, addMeal, removeMeal, savePreset, updateMeasurement, repeatYesterday, replaceNutrition]);
  return <TrainingDataContext.Provider value={value}>{children}</TrainingDataContext.Provider>;
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

export function useTrainingData() {
  const context = useContext(TrainingDataContext);
  if (!context) throw new Error('TrainingDataProvider не подключён');
  return context;
}
