import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockComplaints } from './mockComplaints';

const STORAGE_KEY = 'demo_complaints';

export async function initDemoData() {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);

    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockComplaints));
    }
  } catch {
    // Ignore errors in demo init
  }
}

