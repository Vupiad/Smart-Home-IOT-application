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

function formatTurnOffLabel(timerMinutes: number): string | null {
  if (timerMinutes <= 0) {
    return null;
  }

  return `Device will turn off at ${formatSleepClock(
    toSleepClockFromMinutes(timerMinutes),
  )}`;
}

export default function FanControl({
  detail,
  onChangeLevel,
  onChangeTimer,
}: FanControlProps) {
  const [draftSleepClock, setDraftSleepClock] = useState<SleepClock>(() =>
    toSleepClockFromMinutes(detail.timerMinutes),
  );
  const [isSchedulerDirty, setIsSchedulerDirty] = useState(false);
  const [turnOffLabel, setTurnOffLabel] = useState<string | null>(() =>
    formatTurnOffLabel(detail.timerMinutes),
  );

  useEffect(() => {
    const nextClock = toSleepClockFromMinutes(detail.timerMinutes);
    setDraftSleepClock(nextClock);
    setTurnOffLabel(formatTurnOffLabel(detail.timerMinutes));
    setIsSchedulerDirty(false);
  }, [detail.timerMinutes]);

  const adjustSleepHour = (delta: number) => {
    const rawHour = ((draftSleepClock.hour - 1 + delta + 12) % 12) + 1;
    const newClock = { ...draftSleepClock, hour: rawHour };
    setDraftSleepClock(newClock);
    setIsSchedulerDirty(true);
    setTurnOffLabel(null);
  };

  const adjustSleepMinute = (delta: number) => {
    const nextMinute = (draftSleepClock.minute + delta + 60) % 60;
    const newClock = { ...draftSleepClock, minute: nextMinute };
    setDraftSleepClock(newClock);
    setIsSchedulerDirty(true);
    setTurnOffLabel(null);
  };

  const changeSleepPeriod = (period: "AM" | "PM") => {
    const newClock = { ...draftSleepClock, period };
    setDraftSleepClock(newClock);
    setIsSchedulerDirty(true);
    setTurnOffLabel(null);
  };

  const confirmSleepTimer = () => {
    const nextTimerMinutes = toTimerMinutes(draftSleepClock);
    onChangeTimer(nextTimerMinutes);
    setTurnOffLabel(formatTurnOffLabel(nextTimerMinutes));
    setIsSchedulerDirty(false);
  };

  const cancelSleepTimer = () => {
    onChangeTimer(0);
    setTurnOffLabel(null);
    setIsSchedulerDirty(false);
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
          {formatSleepClock(draftSleepClock)}
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
          <Text style={styles.adjustValue}>{draftSleepClock.hour}</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepHour(-1);
            }}
          >
            <Text style={styles.smallBtnText}>-</Text>
          </Pressable>
        </View>

        <View style={[styles.sleepAdjustRow, styles.minuteAdjustRow]}>
          <Text style={styles.adjustLabel}>Minute</Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepMinute(1);
            }}
          >
            <Text style={styles.smallBtnText}>+</Text>
          </Pressable>
          <Text style={styles.adjustValue}>
            {String(draftSleepClock.minute).padStart(2, "0")}
          </Text>
          <Pressable
            style={styles.smallBtn}
            onPress={() => {
              adjustSleepMinute(-1);
            }}
          >
            <Text style={styles.smallBtnText}>-</Text>
          </Pressable>
        </View>

        <View style={styles.periodToggleRow}>
          {(["AM", "PM"] as const).map((period) => {
            const isPeriodActive = draftSleepClock.period === period;
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

        <Pressable
          style={[
            styles.schedulerConfirmButton,
            !isSchedulerDirty && styles.schedulerConfirmButtonDisabled,
          ]}
          onPress={confirmSleepTimer}
          disabled={!isSchedulerDirty}
        >
          <Text style={styles.schedulerConfirmButtonText}>
            Confirm Scheduler
          </Text>
        </Pressable>
        {turnOffLabel && (
          <View style={styles.schedulerStatusRow}>
            <Text style={styles.schedulerStatusText}>{turnOffLabel}</Text>
            <Pressable
              style={styles.schedulerCancelButton}
              onPress={cancelSleepTimer}
            >
              <Text style={styles.schedulerCancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
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
  minuteAdjustRow: {
    marginTop: 24,
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
  schedulerConfirmButton: {
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: "#2D5BFF",
    paddingVertical: 10,
    alignItems: "center",
  },
  schedulerConfirmButtonDisabled: {
    backgroundColor: "#AFC0ED",
  },
  schedulerConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  schedulerStatusRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  schedulerStatusText: {
    flex: 1,
    color: "#1E8E3E",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  schedulerCancelButton: {
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  schedulerCancelButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
});
