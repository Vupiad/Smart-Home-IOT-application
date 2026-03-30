import { StyleSheet, Text, View } from "react-native";

import Header from "../../../shared/components/Header";
import { theme } from "../../../theme";

export default function ControlScreen() {
  return (
    <View style={styles.container}>
      <Header tabName="Control" />

      <View style={styles.body}>
        <Text style={styles.title}>Control Screen</Text>
        <Text style={styles.subtitle}>
          Quan ly va dieu khien cac thiet bi trong nha.
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
