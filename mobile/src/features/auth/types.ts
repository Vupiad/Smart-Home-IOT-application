export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type UpdateProfilePayload = {
  userId: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
};

export type ChangePasswordPayload = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};
