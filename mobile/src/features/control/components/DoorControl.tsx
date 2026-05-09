import { StyleSheet, Text, View } from "react-native";

import { DoorDeviceDetail } from "../types";

type Props = {
  detail: DoorDeviceDetail;
};

export default function DoorControl({ detail }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cửa</Text>
      <Text style={styles.hint}>
        Bật/tắt công tắc phía trên để khóa hoặc mở khóa. Trạng thái hiện tại:{" "}
        <Text style={styles.emph}>
          {detail.lockStatus === "unlocked" ? "Đang mở khóa" : "Đã khóa"}
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
