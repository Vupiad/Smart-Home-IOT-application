import { AuthSession, AuthUser, LoginPayload, SignUpPayload, UpdateProfilePayload, ChangePasswordPayload } from "../types";
import { setStoredToken } from "../../../shared/storage/tokenStorage";

type AuthRecord = AuthUser & { password: string };

const mockUsers: AuthRecord[] = [
  {
    id: "user-1",
    fullName: "Demo User",
    email: "demo@smarthome.app",
    password: "123456",
  },
];

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


function sanitizeUser(record: AuthRecord): AuthUser {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    dateOfBirth: record.dateOfBirth,
  };
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = `${BASE_URL}/api/v1/auth`;

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Sai email hoặc mật khẩu");
  }

  const data = await response.json();
  await setStoredToken(data.token);

  return {
    token: data.token,
    user: {
      id: data.user.id.toString(),
      email: data.user.email,
      fullName: data.user.fullName,
      phone: data.user.phone || "",
      dateOfBirth: data.user.dateOfBirth || "",
    },
  };
}

export async function signUp(payload: SignUpPayload): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName.trim() || "Người dùng mới",
      phone: payload.phone?.trim() || "",
      dateOfBirth: payload.dateOfBirth?.trim() || "",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Email đã tồn tại hoặc lỗi server");
  }

  const data = await response.json();
  await setStoredToken(data.token);

  return {
    token: data.token,
    user: {
      id: data.user.id.toString(),
      email: data.user.email,
      fullName: data.user.fullName,
      phone: data.user.phone || "",
      dateOfBirth: data.user.dateOfBirth || "",
    },
  };
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    console.warn("Logout failed on backend");
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  await wait(240);

  const record = mockUsers.find((item) => item.id === payload.userId);
  if (!record) {
    throw new Error("User not found");
  }

  record.fullName = payload.fullName.trim();
  if (payload.phone !== undefined) record.phone = payload.phone.trim();
  if (payload.dateOfBirth !== undefined) record.dateOfBirth = payload.dateOfBirth.trim();
  
  return sanitizeUser(record);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await wait(240);

  const record = mockUsers.find((item) => item.id === payload.userId);
  if (!record) {
    throw new Error("User not found");
  }

  if (record.password !== payload.currentPassword) {
    throw new Error("Incorrect current password");
  }

  record.password = payload.newPassword;
}
