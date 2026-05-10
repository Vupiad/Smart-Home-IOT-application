import { apiClient } from "../../../shared/services/api.client";
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from "../../../shared/constants/api";
import { AuthSession, AuthUser, LoginPayload, SignUpPayload, UpdateProfilePayload, ChangePasswordPayload } from "../types";

/**
 * Login - Call backend /api/v1/auth/login
 * Backend trả về session cookie tự động
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
  interface LoginResponse {
    message: string;
    user: AuthUser;
  }

  const response = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    {
      email: payload.email.trim(),
      password: payload.password,
    }
  );

  return {
    token: `session-${Date.now()}`, // Session được lưu trong cookie
    user: response.user,
  };
}

/**
 * Sign Up - Call backend /api/v1/auth/register
 * Backend trả về session cookie tự động (tự động đăng nhập sau khi register)
 */
export async function signUp(payload: SignUpPayload): Promise<AuthSession> {
  interface SignUpResponse {
    message: string;
    user: AuthUser;
  }

  const response = await apiClient.post<SignUpResponse>(
    AUTH_ENDPOINTS.REGISTER,
    {
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName.trim() || "New User",
      phone: payload.phone?.trim() ?? "",
      dateOfBirth: payload.dateOfBirth?.trim() ?? "",
    }
  );

  return {
    token: `session-${Date.now()}`,
    user: response.user,
  };
}

/**
 * Update Profile - Call backend PUT /api/v1/profile
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const user = await apiClient.put<AuthUser>(
    PROFILE_ENDPOINTS.UPDATE,
    {
      fullName: payload.fullName.trim(),
      phone: payload.phone?.trim() ?? "",
      dateOfBirth: payload.dateOfBirth?.trim() ?? "",
    }
  );

  return user;
}

/**
 * Change Password - Call backend PUT /api/v1/profile/password
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put<{ message: string }>(
    PROFILE_ENDPOINTS.CHANGE_PASSWORD,
    {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    }
  );
}
