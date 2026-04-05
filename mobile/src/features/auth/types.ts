export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  fullName: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};
