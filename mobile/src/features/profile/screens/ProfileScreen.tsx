import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native";

import Header from "../../../shared/components/Header";
import { theme } from "../../../theme";
import { useAuthContext } from "../../auth/state/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();

  return (
    <View style={styles.container}>
      <Header tabName="Profile" />

      <View style={styles.body}>
        <Text style={styles.title}>Profile Screen</Text>
        <Text style={styles.subtitle}>
          Thong tin ca nhan va cai dat tai khoan.
        </Text>
        <Text style={styles.subtitle}>Current user: {user?.email ?? "N/A"}</Text>
        <View style={styles.buttonWrap}>
          <Button title="Sign out" onPress={signOut} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.textSecondary,
    ...theme.typography.subtitle,
  },
  buttonWrap: {
    marginTop: 18,
    width: 180,
  },
});
