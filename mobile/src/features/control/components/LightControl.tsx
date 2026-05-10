import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { LightDeviceDetail } from "../types";

type LightControlProps = {
  detail: LightDeviceDetail;
  onChangeBrightness: (brightness: number) => void;
  onChangeColor: (colorHex: string) => void;
  onChangeTimer: (nextTimerMinutes: number) => void;
};

type SleepClock = {
  hour: number;
  minute: number;
  period: "AM" | "PM";
};

const COLORS = ["#c600c9", "#FFFFFF", "#F6C126", "#E24C4C"];

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

export default function LightControl({
  detail,
  onChangeBrightness,
  onChangeColor,
  onChangeTimer,
}: LightControlProps) {
  const [brightnessTrackWidth, setBrightnessTrackWidth] = useState(0);
  const brightnessRatio = Math.min(1, Math.max(0, detail.brightness / 100));
  const lightOnFactor = detail.isOn ? 1 : 0;
  const glowLayers = [
    { size: 340, top: -24, factor: 0.12 },
    { size: 300, top: -4, factor: 0.18 },
    { size: 260, top: 16, factor: 0.24 },
    { size: 220, top: 36, factor: 0.31 },
    { size: 180, top: 56, factor: 0.39 },
  ];
  const lampOpacity = 0.35 + brightnessRatio * 0.65 * lightOnFactor;

  const [sleepClock, setSleepClock] = useState<SleepClock>(() =>
    toSleepClockFromMinutes(detail.timerMinutes),
  );

  useEffect(() => {
    setSleepClock(toSleepClockFromMinutes(detail.timerMinutes));
  }, [detail.timerMinutes]);

  const lightImageSource = useMemo(() => {
    if (detail.id.includes("kitchen")) {
      return require("../../../../assets/lightbulb-kitchen.png");
    }
    if (detail.id.includes("living-room")) {
      return require("../../../../assets/pendant-light-living-room.png");
    }
    return require("../../../../assets/lamp-bedroom.png");
  }, [detail.id]);

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

  const handleBrightnessDrag = (x: number) => {
    if (brightnessTrackWidth <= 0) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, x / brightnessTrackWidth));
    onChangeBrightness(Math.round(ratio * 100));
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        {glowLayers.map((layer, index) => {
          const opacity =
            (0.02 + brightnessRatio * layer.factor) * lightOnFactor;
          return (
            <View
              key={index}
              style={[
                styles.lightGlowLayer,
                {
                  width: layer.size,
                  height: layer.size,
                  borderRadius: layer.size / 2,
                  top: layer.top,
                  backgroundColor: detail.colorHex,
                  opacity,
                },
              ]}
            />
          );
        })}
        <Image
          source={lightImageSource}
          style={[styles.lightImage, { opacity: lampOpacity }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>Brightness</Text>
        <Text style={styles.brightnessValue}>{detail.brightness}%</Text>

        <View style={styles.brightnessControlRow}>
          <Pressable
            style={styles.stepButton}
            onPress={() => {
              onChangeBrightness(Math.max(0, detail.brightness - 5));
            }}
          >
            <Text style={styles.stepText}>-</Text>
          </Pressable>

          <View
            style={styles.progressTrack}
            onLayout={(event) => {
              setBrightnessTrackWidth(event.nativeEvent.layout.width);
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => {
              handleBrightnessDrag(event.nativeEvent.locationX);
            }}
            onResponderMove={(event) => {
              handleBrightnessDrag(event.nativeEvent.locationX);
            }}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${detail.brightness}%`,
                  backgroundColor: detail.colorHex,
                },
              ]}
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

        <View style={styles.colorRow}>
          {COLORS.map((color) => {
            const active =
              detail.colorHex.toLowerCase() === color.toLowerCase();
            return (
              <Pressable
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  color === "#FFFFFF" && styles.colorDotWhite,
                  active && styles.colorActive,
                ]}
                onPress={() => {
                  onChangeColor(color);
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeTitle}>Scheduler</Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  lightGlowLayer: {
    position: "absolute",
    alignSelf: "center",
  },
  lightImage: {
    marginTop: 15,
    marginBottom: 15,
    alignSelf: "center",
    height: 220,
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
  brightnessValue: {
    fontSize: 44,
    color: "#303744",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
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
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 18,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#CCD3E1",
  },
  colorDotWhite: {
    borderColor: "#AAB4C8",
  },
  colorActive: {
    borderColor: "#2D5BFF",
    transform: [{ scale: 1.06 }],
  },
  sleepDisplayValue: {
    marginBottom: 20,
    fontSize: 32,
    fontWeight: "700",
    color: "#2E3440",
    textAlign: "center",
  },
  sleepAdjustRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  adjustLabel: {
    fontSize: 15,
    color: "#657086",
    minWidth: 52,
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
