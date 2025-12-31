import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export const StorageKeys = {
  SESSION_STATE: 'session.state',
  SESSION_ID: 'session.id',
  START_TIME: 'session.startTime', // When the current session started
  LAST_KNOWN_STATE: 'session.lastState', // For resuming after kill
  DURATIONS: 'settings.durations', // Configured durations
  STREAK: 'user.streak',
  TOTAL_TIME: 'user.totalTime', // Total seconds saved
};

// Typed helpers can be added here if needed
export const getNumber = (key: string) => storage.getNumber(key);
export const getString = (key: string) => storage.getString(key);
export const getBoolean = (key: string) => storage.getBoolean(key);

export const set = (key: string, value: string | number | boolean) => storage.set(key, value);
export const clearAll = () => storage.clearAll();
