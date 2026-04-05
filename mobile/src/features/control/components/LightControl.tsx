import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LightDeviceDetail } from "../types";

type LightControlProps = {
  detail: LightDeviceDetail;
  onChangeBrightness: (brightness: number) => void;
  onChangeColor: (colorHex: string) => void;
  //onApplySchedule: (scheduleFrom: string, scheduleTo: string) => void;
};

const COLORS = ["#2D5BFF", "#FFFFFF", "#F6C126", "#E24C4C"];

export default function LightControl({
  detail,
  onChangeBrightness,
  onChangeColor,
  //onApplySchedule,
}: LightControlProps) {
  return (
    <View>
      <View style={styles.lampWrap}>
        <Ionicons name="bulb-outline" size={140} color={detail.colorHex} />
      </View>

      <View style={styles.colorRow}>
        {COLORS.map((color) => {
          const active = detail.colorHex.toLowerCase() === color.toLowerCase();
          return (
            <Pressable
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                active && styles.colorActive,
              ]}
              onPress={() => {
                onChangeColor(color);
              }}
            />
          );
        })}
      </View>

      <View style={styles.brightnessCard}>
        <Text style={styles.brightnessValue}>{detail.brightness}%</Text>
        <Text style={styles.brightnessLabel}>Brightness</Text>

        <View style={styles.brightnessControlRow}>
          <Pressable
            style={styles.stepButton}
            onPress={() => {
              onChangeBrightness(Math.max(0, detail.brightness - 5));
            }}
          >
            <Text style={styles.stepText}>-</Text>
          </Pressable>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${detail.brightness}%` }]}
            />
          </View>

          <Pressable
            style={styles.stepButton}
            onPress={() => {
              onChangeBrightness(Math.min(100, detail.brightness + 5));
            }}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* <View style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>Schedule</Text>

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleText}>From: {detail.scheduleFrom}</Text>
          <Text style={styles.scheduleText}>To: {detail.scheduleTo}</Text>
        </View>

        <Pressable
          style={styles.scheduleButton}
          onPress={() => {
            // onApplySchedule(detail.scheduleFrom, detail.scheduleTo);
          }}
        >
          <Text style={styles.scheduleButtonText}>Set Schedule</Text>
        </Pressable>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  lampWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 16,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#CCD3E1",
  },
  colorActive: {
    borderColor: "#2D5BFF",
    transform: [{ scale: 1.06 }],
  },
  brightnessCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  brightnessValue: {
    fontSize: 48,
    color: "#303744",
    fontWeight: "700",
    textAlign: "center",
  },
  brightnessLabel: {
    textAlign: "center",
    color: "#7A8293",
    marginTop: 4,
    marginBottom: 12,
    fontSize: 16,
  },
  brightnessControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E4E9F1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#343C49",
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E6EBF2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2D5BFF",
  },
  scheduleCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  scheduleTitle: {
    color: "#3A4150",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  scheduleText: {
    color: "#4E5665",
    fontSize: 16,
  },
  scheduleButton: {
    backgroundColor: "#3F4348",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
