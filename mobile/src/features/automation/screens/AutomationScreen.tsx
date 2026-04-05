import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../../../shared/components/Header";
import SceneModeCard from "../../../shared/components/SceneModeCard";
import { theme } from "../../../theme";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";

// 2. Dữ liệu Biểu đồ (Sẵn sàng nhận từ API thực tế)
const CHART_DATA = [
  { id: "1", label: "1 May", value: 12 },
  { id: "2", label: "8 May", value: 18 },
  { id: "3", label: "15 May", value: 14 },
  { id: "4", label: "22 May", value: 21.8, isHighlight: true },
  { id: "5", label: "29 May", value: 16 },
];

// 3. Dữ liệu Danh sách tiêu thụ
const CONSUMPTION_LIST = [
  {
    id: "1",
    name: "Light",
    count: "4 devices",
    kwh: "326 kWh",
    icon: "bulb-outline",
    color: theme.colors.weatherIcon,
  },
  {
    id: "2",
    name: "Air Conditioner",
    count: "2 devices",
    kwh: "126 kWh",
    icon: "snow-outline",
    color: theme.colors.humidityIcon,
  },
  {
    id: "3",
    name: "Washing Machine",
    count: "1 device",
    kwh: "56 kWh",
    icon: "shirt-outline",
    color: theme.colors.headerGrid,
  },
  {
    id: "4",
    name: "Smart Door",
    count: "1 device",
    kwh: "12 kWh",
    icon: "lock-closed-outline",
    color: theme.colors.dateIcon,
  },
];

export default function AutomationScreen() {
  const { scenes, setSceneActive } = useSmartHomeContext();
  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const navigation = useNavigation<any>();
  const handleToggleScene = (id: string, newValue: boolean) => {
    setSceneActive(id, newValue);
  };
  const maxChartValue = Math.max(...CHART_DATA.map((d) => d.value));
  const MAX_BAR_HEIGHT = 120;

  return (
    <View style={styles.container}>
      <Header tabName="Automation" onAddPress={() => setModalVisible(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AUTOMATION MODE */}
        <View style={styles.gridContainer}>
          {scenes.map((item) => (
            <SceneModeCard
              key={item.id}
              name={item.name}
              icon={item.icon}
              iconColor={item.iconColor}
              isActive={item.isActive}
              onToggle={(val) => handleToggleScene(item.id, val)}
            />
          ))}
        </View>

        {/* BIỂU ĐỒ ĐIỆN NĂNG (CONSUMPTION) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consumption</Text>
            <TouchableOpacity style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>This Month</Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartWrapper}>
              {CHART_DATA.map((item) => {
                // Tự động chia tỷ lệ chiều cao
                const barHeight = (item.value / maxChartValue) * MAX_BAR_HEIGHT;

                return (
                  <View key={item.id} style={styles.barCol}>
                    {item.isHighlight && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{item.value} kW</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: item.isHighlight
                            ? theme.colors.headerBlue
                            : "#DDE4EE",
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* DANH SÁCH THIẾT BỊ TIÊU THỤ */}
        <View style={styles.sectionContainer}>
          {/* Thêm dòng Text tiêu đề này vào ngay trên hàm map */}
          <Text
            style={[styles.sectionTitle, { marginBottom: theme.spacing.md }]}
          >
            Device Power Consumption
          </Text>

          {CONSUMPTION_LIST.map((item) => (
            <View key={item.id} style={styles.deviceRow}>
              <View
                style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color}
                />
              </View>

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceCount}>{item.count}</Text>
              </View>

              <Text style={styles.kwhText}>{item.kwh}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL THÊM KỊCH BẢN MỚI */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set name for new automation</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter automation name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.makeAutoBtn}
                onPress={() => {
                  if (newName.trim()) {
                    setModalVisible(false);
                    // Ép kiểu any để tránh lỗi TypeScript lặt vặt
                    (navigation as any).navigate("AddAutomation", {
                      automationName: newName,
                    });
                    setNewName("");
                  }
                }}
              >
                <Text style={styles.makeAutoText}>Make auto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.title,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dropdownText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginRight: 4,
    fontWeight: "500",
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  deviceCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  kwhText: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.headerBlue,
  },

  barLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  tooltip: {
    backgroundColor: theme.colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: "absolute",
    top: -25,
    zIndex: 10,
  },
  tooltipText: { color: theme.colors.white, fontSize: 10, fontWeight: "bold" },
  chartWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingTop: 20,
  },
  barCol: { alignItems: "center", width: 40 },
  bar: { width: 12, borderRadius: 6, marginBottom: 8 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    ...theme.typography.title,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: "#F9FAFC",
    marginBottom: theme.spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 15 },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  makeAutoBtn: {
    backgroundColor: theme.colors.headerBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.round,
  },
  makeAutoText: { color: theme.colors.white, fontSize: 16, fontWeight: "600" },
});
