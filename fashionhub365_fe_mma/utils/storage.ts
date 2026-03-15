import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorageItem = async (key: string, value: string) => {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('Error setting storage item', e);
  }
};

export const getStorageItem = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (e) {
    console.warn('Error getting storage item', e);
    return null;
  }
};

export const removeStorageItem = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Error removing storage item', e);
  }
};
