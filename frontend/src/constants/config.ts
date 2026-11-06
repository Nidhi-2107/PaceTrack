import { Platform } from 'react-native';

const getDevApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator maps host machine localhost to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }
  // Web and iOS simulator map to standard localhost
  return 'http://localhost:8080/api/v1';
};

export const Config = {
  appName: 'PaceTrack',
  tagline: 'Move More. Track Better. Compete Together.',
  version: '1.0.0',
  apiBaseUrl: getDevApiUrl(),
};

