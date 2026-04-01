import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Header from "../../../shared/components/Header";
import { theme } from "../../../theme";
import DeviceCard from "../components/DeviceCard";
import { getDevices, toggleDevicePower } from "../services/device.service";
import { DeviceSummary } from "../types";
import type { ControlStackParamList } from "../../../navigation/TabNavigator";

type Props = NativeStackScreenProps<ControlStackParamList, "ControlMain">;

export default function ControlScreen({ navigation }: Props) {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDevices();
      setDevices(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Load devices failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const onToggle = async (deviceId: string, nextValue: boolean) => {
    const previous = devices;
    setDevices((current) =>
      current.map((device) =>
        device.id === deviceId ? { ...device, isOn: nextValue } : device,
      ),
    );

    try {
      await toggleDevicePower(deviceId, nextValue);
    } catch (error) {
      setDevices(previous);
      const message = error instanceof Error ? error.message : "Toggle failed";
      Alert.alert("Error", message);
    }
  };

  return (
    <View style={styles.container}>
      <Header tabName="Control" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2D5BFF" />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <DeviceCard
              device={item}
              onToggle={(nextValue) => {
                onToggle(item.id, nextValue);
              }}
              onPress={() => {
                navigation.navigate("DeviceDetail", {
                  deviceId: item.id,
                  deviceType: item.type,
                  title: item.name,
                });
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#6D7482",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  row: {
    gap: 12,
    //justifyContent: "center",
  },
});
