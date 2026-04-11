import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { DeviceSummary } from "../types";

type DeviceCardProps = {
  device: DeviceSummary;
  onPress: () => void;
  onToggle: (isOn: boolean) => void;
};

function iconByType(type: DeviceSummary["type"]) {
  if (type === "ac") {
    return (
      <MaterialCommunityIcons
        name="air-conditioner"
        size={54}
        color="#8A93A3"
      />
    );
  }

  if (type === "light") {
    return <Ionicons name="bulb-outline" size={50} color="#8A93A3" />;
  }

  return <MaterialCommunityIcons name="fan" size={50} color="#8A93A3" />;
}

export default function DeviceCard({
  device,
  onPress,
  onToggle,
}: DeviceCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>{iconByType(device.type)}</View>
      <Text style={styles.name}>{device.name}</Text>
      {/* <Text style={styles.room}>{device.room}</Text> */}
      <View style={styles.footer}>
        <Switch
          trackColor={{ false: "#FFFFFF", true: "#2D5BFF" }}
          thumbColor={device.isOn ? "#FFFFFF" : "#F2F2F2"}
          ios_backgroundColor="#FFFFFF"
          value={device.isOn}
          onValueChange={onToggle}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 195,
    height: 220,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignSelf: "center",
  },
  iconWrap: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
    color: "#2D5BFF",
    textAlign: "left",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 28,
    color: "#343A44",
    fontWeight: "400",
  },
  room: {
    marginTop: 4,
    fontSize: 14,
    color: "#8B91A0",
    textAlign: "center",
  },
  footer: {
    marginTop: 14,
    alignItems: "center",
  },
});
