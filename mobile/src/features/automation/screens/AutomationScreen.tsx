import { StyleSheet, Text, View } from "react-native";

export default function AutomationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Automation Screen</Text>
      <Text style={styles.subtitle}>
        Cau hinh cac kich ban tu dong cho he thong.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E2738",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#4A5364",
    fontSize: 15,
  },
});
