import { Platform } from 'react-native';

/**
 * Backend base URL.
 * - iOS simulator: localhost works
 * - Android emulator: 10.0.2.2 maps to host loopback
 * - Physical device: set EXPO_PUBLIC_API_URL to your machine's LAN IP
 */
function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
}

export const API_BASE_URL = defaultBaseUrl();
export const API_PREFIX = '/api';
