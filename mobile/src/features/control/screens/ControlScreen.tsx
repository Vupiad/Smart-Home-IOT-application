import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../shared/components/Header";
import DeviceCard from "../../../shared/components/DeviceCard";
import { CONTROL_DEVICE_IDS } from "../../../shared/constants/devices";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";
import { ControlStackParamList } from "../../../navigation/TabNavigator";
import { DeviceType } from "../types";
import { theme } from "../../../theme";

type DeviceFilter = "all" | "fan" | "ac" | "light" | "door";

const ControlScreen: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<DeviceFilter>("all");
  const { selectDevicesByIds, setDevicePower } = useSmartHomeContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<ControlStackParamList>>();

  const devices = selectDevicesByIds(CONTROL_DEVICE_IDS);

  const normalizedRoomSearch = searchText.trim().toLowerCase();

  const filteredDevices = devices.filter((device) => {
    const matchesType = activeFilter === "all" || device.type === activeFilter;
    const matchesRoom =
      normalizedRoomSearch.length === 0 ||
      device.room.toLowerCase().includes(normalizedRoomSearch);
    return matchesType && matchesRoom;
  });

  const handleOpenDeviceDetail = (device: (typeof filteredDevices)[number]) => {
    if (device.type === "door") {
      Alert.alert("Not supported yet", "Door detail screen is not implemented yet.");
      return;
    }

    navigation.navigate("DeviceDetail", {
      deviceId: device.id,
      deviceType: device.type as DeviceType,
      title: device.name,
    });
  };

  return (
    <View style={styles.container}>
      <Header tabName="Control" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by room (living room, kitchen...)"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by device</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { key: "all", label: "All" },
                { key: "fan", label: "Fan" },
                { key: "ac", label: "AC" },
                { key: "light", label: "Light" },
                { key: "door", label: "Door" },
              ].map((option) => {
                const key = option.key as DeviceFilter;
                const isActive = activeFilter === key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveFilter(key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Device List */}
        <View style={styles.section}>
          <View style={styles.deviceGrid}>
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                name={device.name}
                icon={device.icon}
                isOn={device.isOn}
                subtitle={device.room}
                onToggle={(isOn) => setDevicePower(device.id, isOn)}
                onPress={() => handleOpenDeviceDetail(device)}
              />
            ))}
          </View>
          {filteredDevices.length === 0 && (
            <Text style={styles.emptyText}>No devices found for this filter.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingTop: theme.layout.sectionGap,
    paddingBottom: theme.layout.sectionGap,
  },
  searchContainer: {
    marginBottom: theme.layout.contentGap,
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  filterSection: {
    marginBottom: theme.layout.sectionGap,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    borderColor: "#2D5BFF",
    backgroundColor: "#EAF0FF",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#2D5BFF",
  },
  section: {
    marginBottom: theme.layout.sectionGap,
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
  },
});

export default ControlScreen;
