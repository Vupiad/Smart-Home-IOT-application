import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ACDeviceDetail } from "../types";

type ACControlProps = {
  detail: ACDeviceDetail;
  onChangeTemperature: (temperature: number) => void;
  onChangeMode: (mode: ACDeviceDetail["mode"]) => void;
  onChangeFanSpeed: (fanSpeed: 1 | 2 | 3) => void;
  onChangeTimer: (timerMinutes: number) => void;
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

export default function ACControl({
  detail,
  onChangeTemperature,
  onChangeMode,
  onChangeFanSpeed,
  onChangeTimer,
}: ACControlProps) {
  const [activeEditor, setActiveEditor] = useState<
    "humidity" | "sleep" | "fan" | null
  >(null);
  const [sleepClock, setSleepClock] = useState<SleepClock>(() =>
    toSleepClockFromMinutes(detail.timerMinutes),
  );
  const [draftSleepClock, setDraftSleepClock] = useState<SleepClock>(() =>
    toSleepClockFromMinutes(detail.timerMinutes),
  );
  const [draftMode, setDraftMode] = useState<ACDeviceDetail["mode"]>(
    detail.mode,
  );
  const [draftFanSpeed, setDraftFanSpeed] = useState<1 | 2 | 3>(
    detail.fanSpeed,
  );

  useEffect(() => {
    setSleepClock(toSleepClockFromMinutes(detail.timerMinutes));
  }, [detail.timerMinutes]);

  useEffect(() => {
    setDraftMode(detail.mode);
  }, [detail.mode]);

  useEffect(() => {
    setDraftFanSpeed(detail.fanSpeed);
  }, [detail.fanSpeed]);

  const selectedModeLabel = useMemo(() => {
    if (detail.mode === "cool") {
      return "Cool Mode";
    }
    if (detail.mode === "hot") {
      return "Dry Mode";
    }
    return "Auto";
  }, [detail.mode]);

  const openEditor = (editor: "humidity" | "sleep" | "fan") => {
    if (editor === "sleep") {
      setDraftSleepClock(toSleepClockFromMinutes(detail.timerMinutes));
    }
    if (editor === "humidity") {
      setDraftMode(detail.mode);
    }
    if (editor === "fan") {
      setDraftFanSpeed(detail.fanSpeed);
    }
    setActiveEditor(editor);
  };

  const saveEditor = () => {
    if (activeEditor === "sleep") {
      setSleepClock(draftSleepClock);
      onChangeTimer(toTimerMinutes(draftSleepClock));
    }
    if (activeEditor === "humidity") {
      onChangeMode(draftMode);
    }
    if (activeEditor === "fan") {
      onChangeFanSpeed(draftFanSpeed);
    }
    setActiveEditor(null);
  };

  const closeEditor = () => {
    setActiveEditor(null);
  };

  const adjustDraftSleepHour = (delta: number) => {
    const rawHour = ((draftSleepClock.hour - 1 + delta + 12) % 12) + 1;
    setDraftSleepClock((prev) => ({
      ...prev,
      hour: rawHour,
    }));
  };

  const adjustDraftSleepMinute = (delta: number) => {
    const nextMinute = (draftSleepClock.minute + delta + 60) % 60;
    setDraftSleepClock((prev) => ({
      ...prev,
      minute: nextMinute,
    }));
  };

  const modeCards: Array<{
    key: "fan" | "humidity" | "sleep";
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    onValuePress?: () => void;
  }> = [
    {
      key: "fan",
      label: "Fan Speed",
      value: `Level ${detail.fanSpeed}`,
      icon: "speedometer-outline",
      onValuePress: () => {
        openEditor("fan");
      },
    },
    {
      key: "humidity",
      label: "Humidity",
      value: selectedModeLabel,
      icon: "water-outline",
      onValuePress: () => {
        openEditor("humidity");
      },
    },
    {
      key: "sleep",
      label: "Sleep Timer",
      value: formatSleepClock(sleepClock),
      icon: "timer-outline",
      onValuePress: () => {
        openEditor("sleep");
      },
    },
  ];

  const minTemp = 16;
  const maxTemp = 30;
  const tempRatio = Math.min(
    1,
    Math.max(0, (detail.temperature - minTemp) / (maxTemp - minTemp)),
  );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("../../../../assets/air-conditioner-mounted-white-wall.png")}
          style={styles.acImage}
          resizeMode="contain"
        />

        <View style={styles.quickCardsRow}>
          {modeCards.map((card) => {
            const active =
              (card.key === "fan" && activeEditor === "fan") ||
              (card.key === "humidity" && activeEditor === "humidity") ||
              (card.key === "sleep" && activeEditor === "sleep");
            return (
              <View
                key={card.key}
                style={[styles.quickCard, active && styles.quickCardActive]}
              >
                <Ionicons
                  name={card.icon}
                  size={22}
                  color={active ? "#2D5BFF" : "#5477C7"}
                />
                <Text style={styles.quickCardLabel}>{card.label}</Text>
                {card.onValuePress ? (
                  <Pressable onPress={card.onValuePress}>
                    <Text
                      style={[
                        styles.quickCardValue,
                        styles.quickCardValueAction,
                      ]}
                    >
                      {card.value}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.quickCardValue}>{card.value}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Modal transparent visible={activeEditor !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {activeEditor === "sleep" ? (
              <>
                <Text style={styles.editorTitle}>Set Sleep Timer</Text>
                <Text style={styles.sleepTimeValue}>
                  {formatSleepClock(draftSleepClock)}
                </Text>

                <View style={styles.sleepAdjustRow}>
                  <Text style={styles.adjustLabel}>Hour</Text>
                  <Pressable
                    style={styles.smallBtn}
                    onPress={() => {
                      adjustDraftSleepHour(1);
                    }}
                  >
                    <Text style={styles.smallBtnText}>+</Text>
                  </Pressable>
                  <Text style={styles.adjustValue}>{draftSleepClock.hour}</Text>
                  <Pressable
                    style={styles.smallBtn}
                    onPress={() => {
                      adjustDraftSleepHour(-1);
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
                      adjustDraftSleepMinute(5);
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
                      adjustDraftSleepMinute(-5);
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
                          setDraftSleepClock((prev) => ({ ...prev, period }));
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
              </>
            ) : activeEditor === "humidity" ? (
              <>
                <Text style={styles.editorTitle}>Humidity Mode</Text>
                <View style={styles.modeChipRow}>
                  {[
                    { label: "Cool Mode", mode: "cool" as const },
                    { label: "Dry Mode", mode: "hot" as const },
                    { label: "Auto", mode: "auto" as const },
                  ].map((modeOption) => {
                    const isModeActive = draftMode === modeOption.mode;
                    return (
                      <Pressable
                        key={modeOption.label}
                        style={[
                          styles.modeChip,
                          isModeActive && styles.modeChipActive,
                        ]}
                        onPress={() => {
                          setDraftMode(modeOption.mode);
                        }}
                      >
                        <Text
                          style={[
                            styles.modeChipText,
                            isModeActive && styles.modeChipTextActive,
                          ]}
                        >
                          {modeOption.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.editorTitle}>Fan Speed</Text>
                <View style={styles.fanSpeedRow}>
                  {[1, 2, 3].map((speed) => {
                    const isSpeedActive = draftFanSpeed === speed;
                    return (
                      <Pressable
                        key={speed}
                        style={[
                          styles.speedButton,
                          isSpeedActive && styles.speedButtonActive,
                        ]}
                        onPress={() => {
                          setDraftFanSpeed(speed as 1 | 2 | 3);
                        }}
                      >
                        <Text
                          style={[
                            styles.speedText,
                            isSpeedActive && styles.speedTextActive,
                          ]}
                        >
                          {speed}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalSecondaryButton}
                onPress={closeEditor}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={saveEditor}>
                <Text style={styles.modalPrimaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.gaugeCard}>
        <Pressable
          style={[styles.stepButton, styles.stepButtonLeft]}
          onPress={() => {
            onChangeTemperature(detail.temperature - 1);
          }}
        >
          <Text style={styles.stepSymbol}>-</Text>
        </Pressable>
        <Pressable
          style={[styles.stepButton, styles.stepButtonRight]}
          onPress={() => {
            onChangeTemperature(detail.temperature + 1);
          }}
        >
          <Text style={styles.stepSymbol}>+</Text>
        </Pressable>

        <View style={styles.tempCircleWrap}>
          <View style={styles.tempCircleInner}>
            <Text style={styles.tempText}>{detail.temperature}°C</Text>
          </View>
        </View>
        <View style={styles.tempScaleWrap}>
          <LinearGradient
            colors={["#2D5BFF", "#36C279", "#E55747"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.tempGradientBar}
          />
          <View
            style={[
              styles.tempIndicator,
              {
                left: `${tempRatio * 100}%`,
              },
            ]}
          />
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
  acImage: {
    marginTop: 25,
    marginBottom: 25,
    alignSelf: "center",
    width: "100%",
    height: 100,
  },
  quickCardsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  quickCardActive: {
    transform: [{ translateY: -2 }],
  },
  quickCardLabel: {
    marginTop: 6,
    color: "#4E6AA6",
    fontSize: 12,
    fontWeight: "700",
  },
  quickCardValue: {
    marginTop: 3,
    color: "#7D889C",
    fontSize: 12,
    fontWeight: "600",
  },
  quickCardValueAction: {
    color: "#2D5BFF",
    textDecorationLine: "underline",
  },
  editorTitle: {
    color: "#43506A",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 14,
    rowGap: 16,
  },
  gaugeCard: {
    borderRadius: 24,
    backgroundColor: "#F6F7FA",
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: "center",
    overflow: "hidden",
  },
  tempCircleWrap: {
    alignSelf: "center",
    width: 214,
    height: 214,
    borderRadius: 107,
    alignItems: "center",
    justifyContent: "center",
  },
  tempCircleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#EDF1F8",
    alignItems: "center",
    justifyContent: "center",
  },
  modeChipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  modeChip: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#D8DEE8",
    alignItems: "center",
  },
  modeChipActive: {
    backgroundColor: "#2D5BFF",
  },
  modeChipText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4E5A6F",
  },
  modeChipTextActive: {
    color: "#FFFFFF",
  },
  tempText: {
    color: "#2E3440",
    fontSize: 46,
    fontWeight: "700",
  },
  tempScaleWrap: {
    marginTop: 10,
    width: 250,
    justifyContent: "center",
  },
  tempGradientBar: {
    height: 10,
    borderRadius: 999,
  },
  tempIndicator: {
    position: "absolute",
    top: -2.5,
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#6A7488",
  },

  stepButton: {
    position: "absolute",
    top: "45%",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7EBF3",
    zIndex: 2,
  },
  stepButtonLeft: {
    left: 20,
  },
  stepButtonRight: {
    right: 20,
  },
  stepSymbol: {
    fontSize: 28,
    lineHeight: 28,
    color: "#3E4756",
  },
  sleepTimeValue: {
    marginTop: 8,
    fontSize: 28,
    color: "#2D3643",
    fontWeight: "700",
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
  modalActionsRow: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalSecondaryButton: {
    borderRadius: 10,
    backgroundColor: "#E5EAF3",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalSecondaryButtonText: {
    color: "#4B5568",
    fontSize: 15,
    fontWeight: "700",
  },
  modalPrimaryButton: {
    borderRadius: 10,
    backgroundColor: "#2D5BFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
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
    fontSize: 20,
    color: "#49505E",
    fontWeight: "700",
  },
  speedTextActive: {
    color: "#FFFFFF",
  },
});
