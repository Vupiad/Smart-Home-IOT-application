import {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  SignUpPayload,
  UpdateProfilePayload,
} from "../types";
import { apiRequest } from "../../../shared/services/api.client";

type AuthApiResponse = {
  user: AuthUser;
  message: string;
};

type MessageResponse = {
  message: string;
};

function toSession(response: AuthApiResponse): AuthSession {
  return { user: response.user };
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthApiResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  return toSession(response);
}

export async function signUp(payload: SignUpPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthApiResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
  return toSession(response);
}

export async function getProfile(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/profile");
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  return apiRequest<AuthUser>("/profile", {
    method: "PUT",
    body: payload,
  });
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiRequest<MessageResponse>("/profile/password", {
    method: "PUT",
    body: payload,
  });
}

export async function logout(): Promise<void> {
  await apiRequest<MessageResponse>("/auth/logout", { method: "POST" });
}
