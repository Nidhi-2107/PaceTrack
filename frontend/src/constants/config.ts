import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = (): string => {
  // 1. Explicit production or custom environment variable has highest precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Physical Android or iOS device running Expo Go / Dev Client over local Wi-Fi
  // Constants.expoConfig?.hostUri has the format "192.168.x.x:8081"
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && Platform.OS !== 'web') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8080/api/v1`;
    }
  }

  // 3. Android Emulator uses special loopback IP 10.0.2.2 to reach host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }

  // 4. Web browser and iOS simulator default to localhost
  return 'http://localhost:8080/api/v1';
};

export const Config = {
  appName: 'PaceTrack',
  tagline: 'Move More. Track Better. Compete Together.',
  version: '1.0.0',
  apiBaseUrl: getDevApiUrl(),
};
