import AsyncStorage from '@react-native-async-storage/async-storage';
import { WardrobeItem, Moodboard } from '../types';
import { getInitialWardrobe, getInitialBoards } from './starterData';

const STORAGE_KEYS = {
  WARDROBE: '@styleboard_wardrobe_v1',
  BOARDS: '@styleboard_boards_v1',
  ACTIVE_BOARD_ID: '@styleboard_active_board_id_v1',
};

export const loadStoredWardrobe = async (): Promise<WardrobeItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE);
    if (!raw) {
      const initial = getInitialWardrobe();
      await saveStoredWardrobe(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load wardrobe:', err);
    return getInitialWardrobe();
  }
};

export const saveStoredWardrobe = async (wardrobe: WardrobeItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(wardrobe));
  } catch (err) {
    console.error('Failed to save wardrobe:', err);
  }
};

export const loadStoredBoards = async (wardrobe: WardrobeItem[]): Promise<Moodboard[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOARDS);
    if (!raw) {
      const initial = getInitialBoards(wardrobe);
      await saveStoredBoards(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load boards:', err);
    return getInitialBoards(wardrobe);
  }
};

export const saveStoredBoards = async (boards: Moodboard[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
  } catch (err) {
    console.error('Failed to save boards:', err);
  }
};

export const loadActiveBoardId = async (defaultId?: string): Promise<string | null> => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_BOARD_ID);
    return val || defaultId || null;
  } catch {
    return defaultId || null;
  }
};

export const saveActiveBoardId = async (id: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BOARD_ID, id);
  } catch (err) {
    console.error('Failed to save active board id:', err);
  }
};
