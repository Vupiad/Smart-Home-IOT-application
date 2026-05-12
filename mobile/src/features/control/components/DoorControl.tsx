import { StyleSheet, Text, View } from "react-native";

import { DoorDeviceDetail } from "../types";

type Props = {
  detail: DoorDeviceDetail;
};

export default function DoorControl({ detail }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Door</Text>
      <Text style={styles.hint}>
        Use the switch above to lock or unlock the door. Current status:{" "}
        <Text style={styles.emph}>
          {detail.lockStatus === "unlocked" ? "Unlocked" : "Locked"}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
  },
  emph: {
    fontWeight: "700",
    color: "#2D5BFF",
  },
});
