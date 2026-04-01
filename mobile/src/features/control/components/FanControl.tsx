import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FanDeviceDetail } from "../types";

type FanControlProps = {
  detail: FanDeviceDetail;
  onChangeLevel: (level: 1 | 2 | 3) => void;
  onChangeTimer: (nextTimerMinutes: number) => void;
};

export default function FanControl({
  detail,
  onChangeLevel,
  //onChangeTimer,
}: FanControlProps) {
  return (
    <View>
      <View style={styles.circleWrap}>
        <View style={styles.circleInner}>
          <MaterialCommunityIcons name="fan" size={86} color="#A9B1C1" />
        </View>
      </View>

      <View style={styles.levelRow}>
        {[1, 2, 3].map((level) => {
          const active = detail.level === level;
          return (
            <Pressable
              key={level}
              style={[styles.levelButton, active && styles.levelButtonActive]}
              onPress={() => {
                onChangeLevel(level as 1 | 2 | 3);
              }}
            >
              <Text
                style={[styles.levelText, active && styles.levelTextActive]}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circleWrap: {
    alignSelf: "center",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 8,
    borderColor: "#B8D2FF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E9ECF3",
    alignItems: "center",
    justifyContent: "center",
  },
  levelRow: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelButton: {
    flex: 1,
    height: 62,
    backgroundColor: "#E5E7ED",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  levelButtonActive: {
    backgroundColor: "#22C0E9",
  },
  levelText: {
    fontSize: 24,
    color: "#2E3440",
    fontWeight: "700",
  },
  levelTextActive: {
    color: "#FFFFFF",
  },
  timerCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
  },
  timerLabel: {
    fontSize: 15,
    color: "#6C7381",
    fontWeight: "600",
  },
  timerControl: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DDE2EC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontSize: 24,
    color: "#303744",
    lineHeight: 24,
  },
  timerValue: {
    fontSize: 20,
    color: "#2F3642",
    fontWeight: "700",
  },
});
