import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { FanDeviceDetail } from "../types";

type FanControlProps = {
  detail: FanDeviceDetail;
  onChangeLevel: (level: 1 | 2 | 3) => void;
  onChangeTimer: (nextTimerMinutes: number) => void;
};

type SleepClock = {
  hour: number;
  minute: number;
  period: "AM" | "PM";
};

function toSleepClockFromMinutes(timerMinutes: number): SleepClock {
  const target = new Date(Date.now() + Math.max(0, timerMinutes) * 60_000);
  const hour24 = target.getHours();
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;

  return {
    hour,
    minute: target.getMinutes(),
    period,
  };
}

function toTimerMinutes(clock: SleepClock): number {
  const now = new Date();
  const target = new Date(now);
  let hour24 = clock.hour % 12;
  if (clock.period === "PM") {
    hour24 += 12;
  }

  target.setHours(hour24, clock.minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
}

function formatSleepClock(clock: SleepClock): string {
  const minute = String(clock.minute).padStart(2, "0");
  return `${clock.hour}:${minute} ${clock.period}`;
}

export default function FanControl({
  detail,
  onChangeLevel,
  onChangeTimer,
}: FanControlProps) {
  const [sleepClock, setSleepClock] = useState<SleepClock>(() =>
    toSleepClockFromMinutes(detail.timerMinutes),
  );

  useEffect(() => {
    setSleepClock(toSleepClockFromMinutes(detail.timerMinutes));
  }, [detail.timerMinutes]);

  const adjustSleepHour = (delta: number) => {
    const rawHour = ((sleepClock.hour - 1 + delta + 12) % 12) + 1;
    const newClock = { ...sleepClock, hour: rawHour };
    setSleepClock(newClock);
    onChangeTimer(toTimerMinutes(newClock));
  };

  const adjustSleepMinute = (delta: number) => {
    const nextMinute = (sleepClock.minute + delta + 60) % 60;
    const newClock = { ...sleepClock, minute: nextMinute };
    setSleepClock(newClock);
    onChangeTimer(toTimerMinutes(newClock));
  };

  const changeSleepPeriod = (period: "AM" | "PM") => {
    const newClock = { ...sleepClock, period };
    setSleepClock(newClock);
    onChangeTimer(toTimerMinutes(newClock));
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("../../../../assets/electric-fan.png")}
          style={styles.fanImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>Fan Speed</Text>
        <View style={styles.levelRow}>
          {[1, 2, 3].map((level) => {
            const isLevelActive = detail.level === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.levelButton,
                  isLevelActive && styles.levelButtonActive,
                ]}
                onPress={() => {
                  onChangeLevel(level as 1 | 2 | 3);
                }}
              >
                <Text
                  style={[
                    styles.levelText,
                    isLevelActive && styles.levelTextActive,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>Sleep Timer</Text>
        <Text style={styles.sleepDisplayValue}>
          {formatSleepClock(sleepClock)}
        </Text>

        <View style={styles.sleepAdjustRow}>
          <Text style={styles.adjustLabel}>Hour</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepHour(1);
            }}
          >
            <Text style={styles.smallBtnText}>+</Text>
          </Pressable>
          <Text style={styles.adjustValue}>{sleepClock.hour}</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepHour(-1);
            }}
          >
            <Text style={styles.smallBtnText}>-</Text>
          </Pressable>
        </View>

        <View style={styles.sleepAdjustRow}>
          <Text style={styles.adjustLabel}>Minute</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepMinute(5);
            }}
          >
            <Text style={styles.smallBtnText}>+</Text>
          </Pressable>
          <Text style={styles.adjustValue}>
            {String(sleepClock.minute).padStart(2, "0")}
          </Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepMinute(-5);
            }}
          >
            <Text style={styles.smallBtnText}>-</Text>
          </Pressable>
        </View>

        <View style={styles.periodToggleRow}>
          {(["AM", "PM"] as const).map((period) => {
            const isPeriodActive = sleepClock.period === period;
            return (
              <Pressable
                key={period}
                style={[
                  styles.periodButton,
                  isPeriodActive && styles.periodButtonActive,
                ]}
                onPress={() => {
                  changeSleepPeriod(period);
                }}
              >
                <Text
                  style={[
                    styles.periodText,
                    isPeriodActive && styles.periodTextActive,
                  ]}
                >
                  {period}
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
  container: {
    gap: 14,
  },
  hero: {
    marginHorizontal: -18,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: "#2D5BFF",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  fanImage: {
    marginTop: 15,
    marginBottom: 15,
    alignSelf: "center",
    width: "80%",
    height: 250,
  },
  gaugeCard: {
    borderRadius: 24,
    backgroundColor: "#F6F7FA",
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 18,
  },
  gaugeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E3440",
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  levelButton: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#D8DEE8",
    alignItems: "center",
  },
  levelButtonActive: {
    backgroundColor: "#2D5BFF",
  },
  levelText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4E5A6F",
  },
  levelTextActive: {
    color: "#FFFFFF",
  },
  sleepDisplayValue: {
    marginBottom: 20,
    fontSize: 32,
    fontWeight: "700",
    color: "#2E3440",
  },
  sleepAdjustRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  adjustLabel: {
    fontSize: 15,
    color: "#657086",
    minWidth: 42,
    fontWeight: "600",
  },
  adjustValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    color: "#2D3643",
    fontWeight: "700",
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
    fontSize: 26,
    lineHeight: 26,
    color: "#384150",
  },
  periodToggleRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#E2E6EE",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonActive: {
    backgroundColor: "#2D5BFF",
  },
  periodText: {
    color: "#505A6E",
    fontSize: 15,
    fontWeight: "700",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
});
