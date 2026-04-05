import { AuthSession, AuthUser, LoginPayload, SignUpPayload } from "../types";

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
  };

  mockUsers.push(record);
  return buildSession(sanitizeUser(record));
}
