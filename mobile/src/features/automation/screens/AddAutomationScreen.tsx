import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import DeviceCard from "../../../shared/components/DeviceCard";
import { theme } from "../../../theme";

const FILTERS = ["Get Up", "Goodnight", "Go out", "Hot weather"];

const OTHER_DEVICES = [
  {
    id: "5",
    name: "Front Door",
    status: "Locked",
    isActive: true,
    icon: "lock-closed-outline"
  },
  {
    id: "6",
    name: "Heater",
    status: "22 degree",
    isActive: false,
    icon: "thermometer-outline"
  },
  {
    id: "7",
    name: "Ceiling Fan",
    status: "Off",
    isActive: false,
    icon: "aperture-outline"
  },
  {
    id: "8",
    name: "Window Blinds",
    status: "Closed",
    isActive: false,
    icon: "reorder-four-outline"
  },
];

// Khai báo kiểu dữ liệu để TypeScript không báo lỗi
type Device = { id: string; name: string; status: string; isActive: boolean; icon: string };

const MOCK_AVAILABLE_SCENES: Record<string, Device[]> = {
  "Get Up": [
    { id: "g1", name: "Window Blinds", status: "Open 100%", isActive: true, icon: "reorder-four-outline" },
    { id: "g2", name: "Living Room Light", status: "Warm White", isActive: true, icon: "sunny-outline" },
    { id: "g3", name: "Air Conditioner", status: "Turning Off", isActive: false, icon: "snow-outline" },
    { id: "g4", name: "Coffee Maker", status: "Brewing", isActive: true, icon: "cafe-outline" },
  ],
  "Goodnight": [
    { id: "n1", name: "Front Door", status: "Locked", isActive: true, icon: "lock-closed-outline" },
    { id: "n2", name: "Bedroom Light", status: "Dim 10%", isActive: true, icon: "sunny-outline" },
    { id: "n3", name: "Air Conditioner", status: "Sleep Mode 27°C", isActive: true, icon: "snow-outline" },
    { id: "n4", name: "Curtains", status: "Closed", isActive: false, icon: "albums-outline" },
  ],
  "Go out": [
    { id: "o1", name: "Front Door", status: "Locked", isActive: true, icon: "lock-closed-outline" },
    { id: "o2", name: "All Lights", status: "Off", isActive: false, icon: "sunny-outline" },
    { id: "o3", name: "Air Conditioner", status: "Off", isActive: false, icon: "snow-outline" },
    { id: "o4", name: "Security Camera", status: "Active", isActive: true, icon: "videocam-outline" },
  ],
  "Hot weather": [
    { id: "h1", name: "Air Conditioner", status: "Cooling 18°C", isActive: true, icon: "snow-outline" },
    { id: "h2", name: "Ceiling Fan", status: "Speed 3", isActive: true, icon: "aperture-outline" },
    { id: "h3", name: "Window Blinds", status: "Closed", isActive: false, icon: "reorder-four-outline" },
    { id: "h4", name: "Air Purifier", status: "High Mode", isActive: true, icon: "leaf-outline" },
  ],
};

export default function AddAutomationScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState("Available");
  const [selectedFilter, setSelectedFilter] = useState("Get Up");
  const automationName = route.params?.automationName || "New Automation";
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. HEADER */}
      <View style={styles.whiteHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{automationName}</Text>
        {/* Nút Save ở góc phải */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.headerBlue, fontWeight: 'bold' }}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 2. TAB ĐIỀU HƯỚNG NỘI BỘ (Pills) */}
        <View style={styles.tabContainer}>
          <View style={styles.tabWrapper}>
            {["Available", "Add new"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === "Available" ? (
          <>
            {/* 3. THANH LỌC TRẠNG THÁI (Filter Chips) - Chỉ hiện ở Available */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, selectedFilter === filter && styles.activeFilterChip]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 4. LƯỚI THIẾT BỊ ĐÃ CÓ TRONG KỊCH BẢN */}
            {/* 4. LƯỚI THIẾT BỊ ĐÃ CÓ TRONG KỊCH BẢN */}
            <View style={styles.deviceList}>
              <View style={styles.grid}>
                {/* LẤY DỮ LIỆU ĐỘNG THEO FILTER ĐANG ĐƯỢC CHỌN */}
                {(MOCK_AVAILABLE_SCENES[selectedFilter] || []).map((device) => (
                  <DeviceCard
                    key={device.id}
                    name={device.name}
                    subtitle={device.status}
                    isOn={device.isActive}
                    icon={device.icon as any}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          /* GIAO DIỆN TAB "ADD NEW" - Hiển thị các thiết bị có thể thêm */
          <View style={[styles.deviceList, { marginTop: 20 }]}>
            {/* margin top để bù lại khoảng trống của Filter Chips */}
            <View style={styles.grid}>
              {OTHER_DEVICES.map((device) => (
                <DeviceCard
                  key={device.id}
                  name={device.name}
                  subtitle={device.status}
                  isOn={device.isActive}
                  icon={device.icon as any}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },

  // Header Styles
  whiteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: "#E8ECF2" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: theme.colors.textPrimary },

  // Tab Styles
  tabContainer: { alignItems: "center", marginVertical: theme.spacing.lg },
  tabWrapper: { flexDirection: "row", backgroundColor: "#E8ECF2", borderRadius: theme.radius.round, padding: 4, width: "70%" },
  tabButton: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: "center", borderRadius: theme.radius.round },
  activeTabButton: { backgroundColor: theme.colors.headerBlue },
  tabText: { color: theme.colors.textSecondary, fontWeight: "600" },
  activeTabText: { color: theme.colors.white },

  // Filter Styles
  filterScroll: { paddingLeft: theme.spacing.lg, paddingBottom: theme.spacing.md },
  filterChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.white, borderRadius: 8, marginRight: theme.spacing.sm, borderWidth: 1, borderColor: "#DDE4EE" },
  activeFilterChip: { backgroundColor: theme.colors.headerBlue, borderColor: theme.colors.headerBlue },
  filterText: { color: theme.colors.textPrimary, fontSize: 13 },
  activeFilterText: { color: theme.colors.white, fontWeight: "bold" },

  // Grid Styles
  deviceList: {
    paddingHorizontal: 12,
    paddingBottom: 40
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
    alignItems: 'stretch',
  },
  //Add New
  addNewSection: { paddingHorizontal: 20, paddingBottom: 40 },
  scanBox: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 30,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderStyle: 'dashed' // Tạo viền nét đứt nhìn giống khu vực đang quét
  },
  scanTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginTop: 12, marginBottom: 6 },
  scanSubtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  sectionLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },

  discoveredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  discoveredInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  discoveredText: { justifyContent: 'center' },
  discoveredName: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
  discoveredType: { fontSize: 12, color: theme.colors.textSecondary },

  addButton: { backgroundColor: theme.colors.headerBlue, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

});