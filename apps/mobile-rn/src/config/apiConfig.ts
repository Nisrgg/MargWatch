/**
 * API configuration for MargWatch mobile app.
 * - Emulator: localhost is fine.
 * - Physical device (e.g. Pixel 7): replace with your computer's IP so the phone can reach the API.
 *   Example: http://192.168.1.7:5000 (find IP via ipconfig on Windows or ifconfig on Mac/Linux).
 * Or set API_BASE_URL in .env / react-native.config.js.
 */
export const apiConfig = {
  /** Base URL without trailing slash. Use your computer IP when testing on a real device. */
  baseURL: process.env.API_BASE_URL || 'http://192.168.137.1:5000',
  /** API prefix - all REST routes are under /api */
  apiPrefix: '/api',
  /** WebSocket path - connect with token in query */
  wsPath: '/ws/notifications',
  /** Request timeout in ms */
  timeout: 30000,
};

/** Full API base URL (baseURL + apiPrefix) for axios */
export const getApiBaseURL = () => `${apiConfig.baseURL}${apiConfig.apiPrefix}`;

/** WebSocket URL - append ?token=<JWT> when connecting */
export const getWebSocketURL = (token: string) => {
  const wsProtocol = apiConfig.baseURL.startsWith('https') ? 'wss' : 'ws';
  const host = apiConfig.baseURL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${host}${apiConfig.wsPath}?token=${encodeURIComponent(token)}`;
};
