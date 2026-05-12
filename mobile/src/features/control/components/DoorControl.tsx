import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DoorDeviceDetail } from "../types";

type DoorControlProps = {
  detail: DoorDeviceDetail;
  onChangeStatus: (status: "locked" | "unlocked") => void;
};

export default function DoorControl({ detail, onChangeStatus }: DoorControlProps) {
  const isLocked = detail.status === "locked";

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Security Control</Text>
      
      <View style={styles.card}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.iconCircle,
              isLocked ? styles.iconCircleLocked : styles.iconCircleUnlocked,
            ]}
          >
            <Ionicons
              name={isLocked ? "lock-closed" : "lock-open"}
              size={64}
              color={isLocked ? "#FF3B30" : "#34C759"}
            />
          </View>
          <Text style={styles.statusText}>
            {isLocked ? "System Locked" : "System Unlocked"}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isLocked && styles.actionButtonActiveLocked,
            ]}
            onPress={() => onChangeStatus("locked")}
          >
            <Text
              style={[
                styles.actionButtonText,
                isLocked && styles.actionButtonTextActive,
              ]}
            >
              LOCKED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !isLocked && styles.actionButtonActiveUnlocked,
            ]}
            onPress={() => onChangeStatus("unlocked")}
          >
            <Text
              style={[
                styles.actionButtonText,
                !isLocked && styles.actionButtonTextActive,
              ]}
            >
              UNLOCKED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircleLocked: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  iconCircleUnlocked: {
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  statusText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonActiveLocked: {
    backgroundColor: "#FF3B30",
  },
  actionButtonActiveUnlocked: {
    backgroundColor: "#34C759",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  actionButtonTextActive: {
    color: "#ffffff",
  },
});
