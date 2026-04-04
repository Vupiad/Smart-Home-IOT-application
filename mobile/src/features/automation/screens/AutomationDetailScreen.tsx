import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Header from "../../../shared/components/Header";
import DeviceCard from "../../../shared/components/DeviceCard";
import { theme } from "../../../theme";

// Dữ liệu mẫu (Có thể đưa vào route.params nếu muốn truyền từ trang trước)
const INITIAL_DEVICES = [
  { id: "1", name: "Air condition", status: "22 degree", isActive: true, icon: "snow-outline" },
  { id: "2", name: "Smart Light", status: "Warm White", isActive: true, icon: "sunny-outline" },
  { id: "3", name: "Curtains", status: "Open 80%", isActive: true, icon: "unfold-more-outline" },
];

export default function AutomationDetailScreen({ navigation, route }: any) {
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  // Lấy tên kịch bản từ màn hình trước truyền sang
  const automationName = route.params?.automationName || "Automation Detail";

  // Hàm xử lý khi bật/tắt thiết bị trong danh sách
  const handleToggleDevice = (id: string) => {
    setDevices(prev => prev.map(dev =>
      dev.id === id ? { ...dev, isActive: !dev.isActive } : dev
    ));
  };

  // Hàm xử lý khi nhấn Save
  const handleSave = () => {
    Alert.alert("Success", "Automation updated successfully!", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        tabName="Automation"
        onBackPress={() => navigation.goBack()} // Nếu Header của bạn có hỗ trợ nút Back
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* INFO SECTION */}
        <View style={styles.infoSection}>
          <View>
            <Text style={styles.detailTitle}>{automationName}</Text>
            <Text style={styles.detailSubtitle}>
              {devices.filter(d => d.isActive).length} devices active in this automation
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => Alert.alert("Delete", "Are you sure you want to delete this automation?")}
          >
            <Ionicons name="trash-outline" size={22} color={theme.colors.dateIcon} />
          </TouchableOpacity>
        </View>

        {/* LIST HEADER */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>Devices & Actions</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AddAutomation")}>
            <Text style={styles.addMoreText}>+ Add more</Text>
          </TouchableOpacity>
        </View>

        {/* GRID THIẾT BỊ */}
        <View style={styles.grid}>
          {devices.map((device) => (
            <View key={device.id} style={styles.gridItem}>
              <DeviceCard
                name={device.name}
                subtitle={device.status}
                isOn={device.isActive}
                icon={device.icon as any}
                // Giả sử DeviceCard của bạn có prop xử lý khi nhấn Switch
                onToggle={() => handleToggleDevice(device.id)}
              />
            </View>
          ))}
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  detailTitle: {
    ...theme.typography.title,
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  detailSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FFEBE8",
    justifyContent: "center",
    alignItems: "center",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  addMoreText: {
    color: theme.colors.headerBlue,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: theme.colors.headerBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
    shadowColor: theme.colors.headerBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});