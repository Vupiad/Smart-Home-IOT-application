import React, { createContext, useContext, useMemo, useState } from "react";

import { login, signUp, updateProfile, changePassword } from "../services/auth.service";
import { AuthUser, LoginPayload, SignUpPayload, UpdateProfilePayload, ChangePasswordPayload } from "../types";

type AuthContextValue = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: AuthUser | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUpAndSignIn: (payload: SignUpPayload) => Promise<void>;
  updateUser: (payload: UpdateProfilePayload) => Promise<void>;
  updateUserPassword: (payload: ChangePasswordPayload) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(() => {
    const signIn = async (payload: LoginPayload) => {
      const session = await login(payload);
      setUser(session.user);
    };

    const signUpAndSignIn = async (payload: SignUpPayload) => {
      const session = await signUp(payload);
      setUser(session.user);
    };

    const updateUser = async (payload: UpdateProfilePayload) => {
      const updatedUser = await updateProfile(payload);
      setUser(updatedUser);
    };

    const updateUserPassword = async (payload: ChangePasswordPayload) => {
      await changePassword(payload);
    };

    const signOut = () => {
      setUser(null);
    };

    return {
      isAuthenticated: Boolean(user),
      isHydrating: false,
      user,
      signIn,
      signUpAndSignIn,
      updateUser,
      updateUserPassword,
      signOut,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}
