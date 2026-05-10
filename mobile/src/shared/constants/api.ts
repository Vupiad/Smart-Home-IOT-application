/**
 * API Configuration & Constants
 * 
 * Kết nối đến Smart Home IoT Backend API
 * Base URL: http://localhost:8000/api/v1
 */

// Environment detection
const isDev = __DEV__; // Expo development mode indicator

// API Base URL - Update dựa vào môi trường
// CÁCH 1: Local development với localhost (chỉ work trên web/emulator)
// CÁCH 2: Local development với IP máy backend (work trên physical device)
export const API_BASE_URL = isDev
  ? "http://localhost:8000/api/v1" // Update nếu backend không ở localhost:8000
  : "https://api.smarthome.app/api/v1"; // Production

/**
 * Thay đổi API_BASE_URL nếu backend chạy ở port khác hoặc IP khác
 * 
 * Ví dụ, nếu backend ở máy khác với IP 192.168.1.100:
 * export const API_BASE_URL = isDev
 *   ? "http://192.168.1.100:8000/api/v1"
 *   : "https://api.smarthome.app/api/v1";
 */

/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
};

/**
 * Profile Endpoints
 */
export const PROFILE_ENDPOINTS = {
  GET: "/profile",
  UPDATE: "/profile",
  CHANGE_PASSWORD: "/profile/password",
};

/**
 * Devices Endpoints
 */
export const DEVICES_ENDPOINTS = {
  LIST: "/devices",
  CREATE: "/devices",
  UPDATE: (deviceId: number) => `/devices/${deviceId}`,
  DELETE: (deviceId: number) => `/devices/${deviceId}`,
  CONTROL: (deviceId: number) => `/device-control/${deviceId}/state`,
};

/**
 * Modes Endpoints
 */
export const MODES_ENDPOINTS = {
  LIST: "/modes",
  CREATE: "/modes",
  GET: (modeId: number) => `/modes/${modeId}`,
  UPDATE: (modeId: number) => `/modes/${modeId}`,
  DELETE: (modeId: number) => `/modes/${modeId}`,
  TOGGLE: (modeId: number) => `/modes/${modeId}/toggle`,
};

/**
 * Sensors Endpoints
 */
export const SENSORS_ENDPOINTS = {
  CURRENT: "/sensors/current",
  HISTORY: (topic: string) => `/sensors/${topic}/history`,
};

/**
 * WebSocket Endpoint
 */
export const WS_BASE_URL = isDev
  ? "ws://192.168.1.100:8000/ws" // thay 192.168.1.100 bằng IP máy backend
  : "wss://api.smarthome.app/ws";
