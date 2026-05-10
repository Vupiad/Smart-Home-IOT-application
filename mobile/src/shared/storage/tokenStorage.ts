import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "userToken";

/** JWT persistence: AsyncStorage hoạt động ổn trên Expo (iOS/Android/web), tránh lỗi native "SecureStore doesn't exist". */
export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
