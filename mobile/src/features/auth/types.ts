export type AuthUser = {
  id: number;
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
  user: AuthUser;
};

export type UpdateProfilePayload = {
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
