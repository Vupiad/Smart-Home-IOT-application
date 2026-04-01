import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import type { ControlStackParamList } from "../../../navigation/TabNavigator";
import ACControl from "../components/ACControl";
import FanControl from "../components/FanControl";
import LightControl from "../components/LightControl";
import {
  getDeviceDetail,
  setACFanSpeed,
  setACMode,
  setACTemperature,
  //setACTimer,
  setFanLevel,
  setFanTimer,
  setLightBrightness,
  setLightColor,
  //setLightSchedule,
  toggleDevicePower,
} from "../services/device.service";
import {
  ACDeviceDetail,
  DeviceDetail,
  FanDeviceDetail,
  LightDeviceDetail,
} from "../types";

type Props = NativeStackScreenProps<ControlStackParamList, "DeviceDetail">;

export default function DeviceDetailScreen({ navigation, route }: Props) {
  const { deviceId, title } = route.params;
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDeviceDetail(deviceId);
      setDetail(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Load device detail failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const runUpdate = async (
    task: () => Promise<void>,
    nextState: DeviceDetail,
  ) => {
    if (!detail) {
      return;
    }

    const previous = detail;
    setDetail(nextState);
    setSaving(true);

    try {
      await task();
    } catch (error) {
      setDetail(previous);
      const message = error instanceof Error ? error.message : "Update failed";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const onTogglePower = (isOn: boolean) => {
    if (!detail) {
      return;
    }

    void runUpdate(
      async () => {
        await toggleDevicePower(detail.id, isOn);
      },
      { ...detail, isOn },
    );
  };

  if (loading || !detail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2D5BFF" />
        <Text style={styles.loadingText}>Loading detail...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={navigation.goBack}>
          <Ionicons name="chevron-back" size={24} color="#202736" />
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        <Switch
          trackColor={{ false: "#D6DBE3", true: "#23C3EA" }}
          thumbColor={detail.isOn ? "#FFFFFF" : "#F2F2F2"}
          ios_backgroundColor="#D6DBE3"
          value={detail.isOn}
          onValueChange={onTogglePower}
          disabled={saving}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {detail.type === "fan" && (
          <FanControl
            detail={detail}
            onChangeLevel={(level) => {
              const nextState: FanDeviceDetail = { ...detail, level };
              void runUpdate(async () => {
                await setFanLevel(detail.id, level);
              }, nextState);
            }}
            onChangeTimer={(timerMinutes) => {
              const nextState: FanDeviceDetail = { ...detail, timerMinutes };
              void runUpdate(async () => {
                await setFanTimer(detail.id, timerMinutes);
              }, nextState);
            }}
          />
        )}

        {detail.type === "ac" && (
          <ACControl
            detail={detail}
            onChangeTemperature={(temperature) => {
              const safeTemperature = Math.min(30, Math.max(16, temperature));
              const nextState: ACDeviceDetail = {
                ...detail,
                temperature: safeTemperature,
              };

              void runUpdate(async () => {
                await setACTemperature(detail.id, safeTemperature);
              }, nextState);
            }}
            onChangeMode={(mode) => {
              const nextState: ACDeviceDetail = { ...detail, mode };
              void runUpdate(async () => {
                await setACMode(detail.id, mode);
              }, nextState);
            }}
            onChangeFanSpeed={(fanSpeed) => {
              const nextState: ACDeviceDetail = { ...detail, fanSpeed };
              void runUpdate(async () => {
                await setACFanSpeed(detail.id, fanSpeed);
              }, nextState);
            }}
            // onChangeTimer={(timerMinutes) => {
            //   const safeTimer = Math.max(0, timerMinutes);
            //   const nextState: ACDeviceDetail = {
            //     ...detail,
            //     timerMinutes: safeTimer,
            //   };
            //   void runUpdate(async () => {
            //     await setACTimer(detail.id, safeTimer);
            //   }, nextState);
            // }}
          />
        )}

        {detail.type === "light" && (
          <LightControl
            detail={detail}
            onChangeBrightness={(brightness) => {
              const safeBrightness = Math.min(100, Math.max(0, brightness));
              const nextState: LightDeviceDetail = {
                ...detail,
                brightness: safeBrightness,
              };

              void runUpdate(async () => {
                await setLightBrightness(detail.id, safeBrightness);
              }, nextState);
            }}
            onChangeColor={(colorHex) => {
              const nextState: LightDeviceDetail = { ...detail, colorHex };
              void runUpdate(async () => {
                await setLightColor(detail.id, colorHex);
              }, nextState);
            }}
            // onApplySchedule={(scheduleFrom, scheduleTo) => {
            //   const nextState: LightDeviceDetail = {
            //     ...detail,
            //     scheduleFrom,
            //     scheduleTo,
            //   };

            //   void runUpdate(async () => {
            //     await setLightSchedule(detail.id, { scheduleFrom, scheduleTo });
            //   }, nextState);
            // }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DCE1E9",
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: "#DCE1E9",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#5D6777",
    fontSize: 16,
  },
  headerRow: {
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
    fontSize: 30,
    lineHeight: 34,
    color: "#2E3440",
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 32,
  },
});
