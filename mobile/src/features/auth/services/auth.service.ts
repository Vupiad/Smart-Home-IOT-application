import { AuthSession, AuthUser, LoginPayload, SignUpPayload, UpdateProfilePayload, ChangePasswordPayload } from "../types";

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

function buildSession(user: AuthUser): AuthSession {
  return {
    token: `token-${user.id}-${Date.now()}`,
    user,
  };
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

export async function login(payload: LoginPayload): Promise<AuthSession> {
  await wait(200);

  const record = mockUsers.find(
    (item) =>
      item.email.toLowerCase() === payload.email.trim().toLowerCase() &&
      item.password === payload.password,
  );

  if (!record) {
    throw new Error("Invalid email or password");
  }

  return buildSession(sanitizeUser(record));
}

export async function signUp(payload: SignUpPayload): Promise<AuthSession> {
  await wait(240);

  const exists = mockUsers.some(
    (item) => item.email.toLowerCase() === payload.email.trim().toLowerCase(),
  );

  if (exists) {
    throw new Error("Email already exists");
  }

  const record: AuthRecord = {
    id: `user-${mockUsers.length + 1}`,
    email: payload.email.trim(),
    password: payload.password,
    fullName: payload.fullName.trim() || "New User",
    phone: payload.phone?.trim() ?? "",
    dateOfBirth: payload.dateOfBirth?.trim() ?? "",
  };

  mockUsers.push(record);
  return buildSession(sanitizeUser(record));
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
