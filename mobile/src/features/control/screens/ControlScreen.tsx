import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../shared/components/Header";
import DeviceCard from "../../../shared/components/DeviceCard";

import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";
import { ControlStackParamList } from "../../../navigation/TabNavigator";
import { DeviceType } from "../types";
import { theme } from "../../../theme";
import { addDevice } from "../services/deviceService";

type DeviceFilter = "all" | "fan" | "ac" | "light" | "door";

const ControlScreen: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<DeviceFilter>("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceRoom, setNewDeviceRoom] = useState("Living room");
  const [newDeviceType, setNewDeviceType] = useState<string>("light_bulb");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { devices, setDevicePower, refreshDevices } = useSmartHomeContext();
  const navigation = useNavigation<NativeStackNavigationProp<ControlStackParamList>>();

  const normalizedRoomSearch = searchText.trim().toLowerCase();

  const filteredDevices = devices.filter((device) => {
    const matchesType = activeFilter === "all" || device.type === activeFilter;
    const matchesRoom =
      normalizedRoomSearch.length === 0 ||
      device.room.toLowerCase().includes(normalizedRoomSearch);
    return matchesType && matchesRoom;
  });

  const handleOpenDeviceDetail = (device: (typeof filteredDevices)[number]) => {
    navigation.navigate("DeviceDetail", {
      deviceId: device.id,
      deviceType: device.type as DeviceType,
      title: device.name,
    });
  };

  const handleAddDevice = async () => {
    if (!newDeviceName || !newDeviceRoom) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên và phòng");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalType = newDeviceType;
      let lightStyle: string | undefined;

      if (newDeviceType === "light_bulb") {
        finalType = "light";
        lightStyle = "bulb";
      } else if (newDeviceType === "pendant") {
        finalType = "pendant";
        lightStyle = "pendant";
      } else if (newDeviceType === "lamp") {
        finalType = "lamp";
        lightStyle = "lamp";
      }

      await addDevice({
        name: newDeviceName,
        type: finalType,
        room: newDeviceRoom,
        base_topic: "yolohome/device/yolo_uno_01",
        lightStyle,
      });
      
      Alert.alert("Thành công", "Đã thêm thiết bị mới!");
      setIsAddModalVisible(false);
      setNewDeviceName("");
      
      // Tải lại danh sách thiết bị
      await refreshDevices();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể thêm thiết bị");
    } finally {
      setIsSubmitting(false);
    }
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
          <View style={styles.filterHeaderRow}>
            <Text style={styles.filterLabel}>Filter by device</Text>
            <TouchableOpacity 
              style={styles.addButtonSmall} 
              onPress={() => setIsAddModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#2D5BFF" />
              <Text style={styles.addButtonSmallText}>Thêm thiết bị</Text>
            </TouchableOpacity>
          </View>
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

      {/* Modal Thêm Thiết Bị */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm thiết bị mới</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tên thiết bị</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: Đèn trần"
                value={newDeviceName}
                onChangeText={setNewDeviceName}
              />

              <Text style={styles.inputLabel}>Phòng</Text>
              <View style={styles.typeSelector}>
                {(["Living room", "Bedroom", "Kitchen", "Garage"]).map((room) => (
                  <TouchableOpacity
                    key={room}
                    style={[
                      styles.typeChip,
                      newDeviceRoom === room && styles.typeChipActive,
                    ]}
                    onPress={() => setNewDeviceRoom(room)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        newDeviceRoom === room && styles.typeChipTextActive,
                      ]}
                    >
                      {room}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Loại thiết bị</Text>
              <View style={styles.typeSelector}>
                {(["light_bulb", "pendant", "lamp", "fan", "ac", "door"]).map((type) => {
                  let label = type.toUpperCase();
                  if (type === "light_bulb") label = "LIGHT BULB";
                  if (type === "pendant") label = "PENDANT";
                  if (type === "lamp") label = "LAMP";

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        newDeviceType === type && styles.typeChipActive,
                      ]}
                      onPress={() => setNewDeviceType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          newDeviceType === type && styles.typeChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleAddDevice}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Thêm vào hệ thống</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.modalNote}>
                *Lưu ý: Thiết bị này mới chỉ được tạo trên Database. Bạn cần code firmware kết nối phần cứng thực tế vào MQTT Topic trùng khớp để điều khiển được!
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  filterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  addButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonSmallText: {
    color: "#2D5BFF",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  typeChipActive: {
    borderColor: "#2D5BFF",
    backgroundColor: "#EAF0FF",
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeChipTextActive: {
    color: "#2D5BFF",
  },
  submitButton: {
    backgroundColor: "#2D5BFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalNote: {
    fontSize: 12,
    color: "#EF4444",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  }
});

export default ControlScreen;
