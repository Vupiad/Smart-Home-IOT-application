/**
 * Profile Service - Kết nối với Backend Profile API
 * 
 * Cung cấp thêm các method như:
 * - Lấy profile khi load app
 * - Logout
 */

import { apiClient } from "../../../shared/services/api.client";
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from "../../../shared/constants/api";
import { AuthUser } from "../types";

/**
 * Get current user profile - Call backend GET /api/v1/profile
 * Dùng để refresh profile data hoặc khi load app
 */
export async function getProfile(): Promise<AuthUser> {
  const user = await apiClient.get<AuthUser>(PROFILE_ENDPOINTS.GET);
  return user;
}

/**
 * Logout - Call backend POST /api/v1/auth/logout
 * Backend sẽ xóa session cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post<{ message: string }>(AUTH_ENDPOINTS.LOGOUT);
}
