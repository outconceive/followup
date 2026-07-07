import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedRecord, InterviewState } from './types';

const STORAGE_KEY = 'followup_records';
const DRAFT_KEY = 'followup_draft';

export async function saveRecord(record: SavedRecord): Promise<void> {
  try {
    const existing = await getRecords();
    existing.unshift(record);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save record:', e);
    throw e;
  }
}

export async function getRecords(): Promise<SavedRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load records:', e);
    return [];
  }
}

export async function getRecord(id: string): Promise<SavedRecord | null> {
  const records = await getRecords();
  return records.find(r => r.id === id) || null;
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const records = await getRecords();
    const filtered = records.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete record:', e);
    throw e;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function saveDraft(state: InterviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
}

export async function loadDraft(): Promise<InterviewState | null> {
  try {
    const data = await AsyncStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load draft:', e);
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error('Failed to clear draft:', e);
  }
}
