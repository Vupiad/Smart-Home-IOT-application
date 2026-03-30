import { StyleSheet, Text, View } from "react-native";

import Header from "../../../shared/components/Header";
import { theme } from "../../../theme";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Header tabName="Profile" />

      <View style={styles.body}>
        <Text style={styles.title}>Profile Screen</Text>
        <Text style={styles.subtitle}>
          Thong tin ca nhan va cai dat tai khoan.
        </Text>
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
});
