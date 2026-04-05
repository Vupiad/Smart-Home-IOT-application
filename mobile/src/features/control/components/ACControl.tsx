import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ACDeviceDetail } from "../types";

type ACControlProps = {
  detail: ACDeviceDetail;
  onChangeTemperature: (temperature: number) => void;
  onChangeMode: (mode: ACDeviceDetail["mode"]) => void;
  onChangeFanSpeed: (fanSpeed: 1 | 2 | 3) => void;
  //onChangeTimer: (timerMinutes: number) => void;
};

export default function ACControl({
  detail,
  onChangeTemperature,
  onChangeMode,
  onChangeFanSpeed,
  //onChangeTimer,
}: ACControlProps) {
  return (
    <View>
      <View style={styles.tempCircleWrap}>
        <View style={styles.tempCircleInner}>
          <Text style={styles.humidityText}>{detail.humidity}%</Text>
          <Text style={styles.tempText}>{detail.temperature}°C</Text>
        </View>
      </View>

      <View style={styles.stepRow}>
        <Pressable
          style={styles.stepButton}
          onPress={() => {
            onChangeTemperature(detail.temperature - 1);
          }}
        >
          <Text style={styles.stepSymbol}>-</Text>
        </Pressable>
        <Pressable
          style={styles.stepButton}
          onPress={() => {
            onChangeTemperature(detail.temperature + 1);
          }}
        >
          <Text style={styles.stepSymbol}>+</Text>
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {[
          { key: "cool", label: "Cool", icon: "snow" as const },
          { key: "hot", label: "Hot", icon: "sunny-outline" as const },
          { key: "auto", label: "Auto", icon: "sync" as const },
        ].map((option) => {
          const active = detail.mode === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.modeButton, active && styles.modeButtonActive]}
              onPress={() => {
                onChangeMode(option.key as ACDeviceDetail["mode"]);
              }}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? "#FFFFFF" : "#454C58"}
              />
              <Text style={[styles.modeText, active && styles.modeTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* <View style={styles.card}>
        <Text style={styles.cardLabel}>Timer</Text>
        <View style={styles.cardRow}>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              onChangeTimer(Math.max(0, detail.timerMinutes - 5));
            }}
          >
            <Text style={styles.smallBtnText}>-</Text>
          </Pressable>
          <Text style={styles.cardValue}>{detail.timerMinutes} min</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              onChangeTimer(detail.timerMinutes + 5);
            }}
          >
            <Text style={styles.smallBtnText}>+</Text>
          </Pressable>
        </View>
      </View> */}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Fan speed</Text>
        <View style={styles.fanSpeedRow}>
          {[1, 2, 3].map((speed) => {
            const active = detail.fanSpeed === speed;
            return (
              <Pressable
                key={speed}
                style={[styles.speedButton, active && styles.speedButtonActive]}
                onPress={() => {
                  onChangeFanSpeed(speed as 1 | 2 | 3);
                }}
              >
                <MaterialCommunityIcons
                  name="fan"
                  size={16}
                  color={active ? "#FFFFFF" : "#49505E"}
                />
                <Text
                  style={[styles.speedText, active && styles.speedTextActive]}
                >
                  {speed}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tempCircleWrap: {
    alignSelf: "center",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 8,
    borderColor: "#2D5BFF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  tempCircleInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "#E9ECF1",
    alignItems: "center",
    justifyContent: "center",
  },
  humidityText: {
    color: "#565E6D",
    fontSize: 16,
    marginBottom: 8,
  },
  tempText: {
    color: "#2E3440",
    fontSize: 42,
    fontWeight: "700",
  },
  stepRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECEFF5",
  },
  stepSymbol: {
    fontSize: 28,
    lineHeight: 28,
    color: "#3E4756",
  },
  modeRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#E8EBF1",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: "#2D5BFF",
  },
  modeText: {
    color: "#454C58",
    fontSize: 14,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
  },
  cardLabel: {
    color: "#707787",
    fontSize: 14,
    fontWeight: "600",
  },
  cardRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFE4EE",
  },
  smallBtnText: {
    fontSize: 22,
    lineHeight: 22,
    color: "#384150",
  },
  cardValue: {
    fontSize: 18,
    color: "#2D3643",
    fontWeight: "700",
  },
  fanSpeedRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  speedButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#E3E7EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  speedButtonActive: {
    backgroundColor: "#2D5BFF",
  },
  speedText: {
    fontSize: 15,
    color: "#49505E",
    fontWeight: "700",
  },
  speedTextActive: {
    color: "#FFFFFF",
  },
});
