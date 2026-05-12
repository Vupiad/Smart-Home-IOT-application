import AppNavigator from "./navigation/AppNavigator";
import { SmartHomeProvider } from "./shared/state/SmartHomeContext";
import { AuthProvider } from "./features/auth/state/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <SmartHomeProvider>
        <AppNavigator />
      </SmartHomeProvider>
    </AuthProvider>
  );
}
