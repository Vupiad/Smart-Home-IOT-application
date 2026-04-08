import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { DEVICE_CATALOG, DeviceCatalogItem } from "../../../shared/constants/devices";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUTOMATION_SCENES, AUTOMATION_AVAILABLE_SCENES, AutomationDeviceItem } from "../../../shared/constants/automations";

export default function AddAutomationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { isEdit, sceneId, automationName } = route.params || {};

  const [name, setName] = useState(automationName || "");
  const [isActive, setIsActive] = useState(true);
  const [devices, setDevices] = useState<AutomationDeviceItem[]>([]);

  const [selectedDevice, setSelectedDevice] = useState<AutomationDeviceItem | null>(null);
  const [tempStatus, setTempStatus] = useState("");
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isConfigModalVisible, setConfigModalVisible] = useState(false);
  const [isErrorVisible, setErrorVisible] = useState(false);
  useEffect(() => {
    if (isEdit && sceneId) {
      const currentScene = AUTOMATION_SCENES.find((s) => s.id === sceneId);
      if (currentScene) {
        setName(currentScene.name);
        setIsActive(currentScene.isActive);

        const filterKey = currentScene.name === "Get up" ? "Get Up" : currentScene.name;
        const sceneDevices = AUTOMATION_AVAILABLE_SCENES[filterKey as keyof typeof AUTOMATION_AVAILABLE_SCENES];

        if (sceneDevices) {
          setDevices(sceneDevices);
        }
      }
    }
  }, [isEdit, sceneId]);

  const handleSave = () => {
    if (!name.trim()) {
      setErrorVisible(true); // Chỉ bật popup khi lỗi
      return;
    }

    // Nếu nhập tên đàng hoàng -> Lưu và chuyển trang ngay lập tức
    console.log("=> Đã lưu thành công:", name);
    navigation.goBack();
  };


  const handleOpenDeviceConfig = (device: AutomationDeviceItem) => {
    setSelectedDevice(device);
    setTempStatus(device.status);
  };

  const handleSaveDeviceSettings = () => {
    if (selectedDevice) {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === selectedDevice.id ? { ...d, status: tempStatus } : d
        )
      );
    }
    setConfigModalVisible(false);

  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };
  const availableDevicesToAdd = DEVICE_CATALOG.filter(
    (catalogDevice) => !devices.some((d) => d.id === catalogDevice.id)
  );

  const handleAddNewDevice = (device: DeviceCatalogItem) => {
    const newAutomationDevice: AutomationDeviceItem = {
      id: device.id,
      name: `${device.room} ${device.name}`,
      status: device.subtitle || "OFF",
      isActive: true,
      icon: device.icon,
    };

    setDevices((prev) => [...prev, newAutomationDevice]);
    setAddDeviceModalVisible(false);
  };
  const handleDevicePress = (device: AutomationDeviceItem) => {
    setSelectedDevice(device);
    setTempStatus(device.status);
    setConfigModalVisible(true);
  };

  const handleDeleteAutomation = () => {
    setDeleteConfirmVisible(true);
    console.log("Delete Automation")
    Alert.alert(
      "Confirm Delete", // Tiêu đề
      "Are you sure you want to delete this automation?", // Nội dung hỏi
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Deleted:", sceneId);
            navigation.goBack();
          }
        }
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="close-outline" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>
          {isEdit ? "Edit Automation" : "New Automation"}
        </Text>

        <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KHU VỰC THÔNG TIN CHUNG */}
        <View style={styles.card}>
          <Text style={styles.label}>Automation Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Movie Time"
            placeholderTextColor={theme.colors.textSecondary}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Automation</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#D1D5DB", true: theme.colors.headerBlue }}
            />
          </View>
        </View>

        {/* KHU VỰC DANH SÁCH THIẾT BỊ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Devices ({devices.length})</Text>
          <TouchableOpacity onPress={() => setAddDeviceModalVisible(true)}>
            <Text style={styles.addDeviceText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {devices.length > 0 ? (
          devices.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.deviceRow}
              onPress={() => handleDevicePress(item)}
            >
              <View style={styles.deviceIconWrapper}>
                <Ionicons name={item.icon as any} size={24} color={theme.colors.headerBlue} />
              </View>

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceStatus}>{item.status}</Text>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveDevice(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No devices added yet.</Text>
        )}

        {/* NÚT XÓA KỊCH BẢN (Chỉ hiện khi Edit) */}
        {isEdit && (
          <TouchableOpacity
            style={styles.deleteAutomationBtn}
            onPress={handleDeleteAutomation}
          >
            <Text style={styles.deleteAutomationText}>Delete Automation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* KHU VỰC CHỨA MODAL CẤU HÌNH THIẾT BỊ */}
      <Modal visible={isConfigModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure {selectedDevice?.name}</Text>

            <Ionicons
              name={selectedDevice?.icon as any}
              size={40}
              color={theme.colors.headerBlue}
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />
            <Text style={[styles.label, { textAlign: 'center', marginBottom: 20 }]}>
              Current Mode: {selectedDevice?.status}
            </Text>

            <View style={{ padding: 20, backgroundColor: '#F0F4FF', borderRadius: 12, marginBottom: 20 }}>
              <Text style={{ textAlign: 'center', color: theme.colors.headerBlue, fontWeight: 'bold' }}>
                Incoming features for this device...
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveDeviceSettings}             >
                <Text style={styles.saveModalText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MODAL CHỌN THÊM THIẾT BỊ MỚI */}
      <Modal visible={isAddDeviceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalActions}>
              <Text style={styles.modalTitle}>Select Device</Text>
              <TouchableOpacity onPress={() => setAddDeviceModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableDevicesToAdd.length > 0 ? (
                availableDevicesToAdd.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={styles.deviceRow}
                    onPress={() => handleAddNewDevice(device)}
                  >
                    <View style={styles.deviceIconWrapper}>
                      <Ionicons name={device.icon as any} size={24} color={theme.colors.headerBlue} />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceStatus}>{device.room}</Text>
                    </View>
                    <Ionicons name="add-circle" size={28} color={theme.colors.headerBlue} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>All devices are already in this automation.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={isDeleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>
              Are you sure you want to delete this automation?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setDeleteConfirmVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.saveModalText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MODAL BÁO LỖI CHƯA NHẬP TÊN Cho Automation*/}
      <Modal visible={isErrorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>

            <Ionicons name="warning" size={60} color="#FF3B30" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Action Required</Text>
            <Text style={{ textAlign: 'center', marginBottom: 25, fontSize: 16, color: theme.colors.textSecondary }}>
              Please enter a name for the automation.
            </Text>

            <TouchableOpacity
              style={[styles.saveModalBtn, { width: '100%', alignItems: 'center', backgroundColor: '#FF3B30' }]}
              onPress={() => setErrorVisible(false)} // Chỉ cần tắt popup đi để người dùng nhập tiếp
            >
              <Text style={styles.saveModalText}>Got it</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.layout.pagePaddingX,
  },
  saveBtnText: {
    color: theme.colors.headerBlue,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.layout.sectionGap,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF2",
    paddingVertical: 8,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.title,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  addDeviceText: {
    color: theme.colors.headerBlue,
    fontSize: 15,
    fontWeight: "600",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  deviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(45, 91, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  deviceStatus: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  removeBtn: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
  deleteAutomationBtn: {
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    alignItems: "center",
  },
  deleteAutomationText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: theme.layout.pagePaddingX,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.layout.sectionGap,
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
    marginBottom: theme.layout.contentGap,
    textAlign: "center",
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
  saveModalBtn: {
    backgroundColor: theme.colors.headerBlue,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.round,
  },
  saveModalText: { color: theme.colors.white, fontSize: 16, fontWeight: "600" },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    backgroundColor: '#F8F9FB'
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  navBtn: {
    padding: 20,
    minWidth: 44,
    alignItems: "center",
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.headerBlue,
  },
  nameInput: { fontSize: 22, fontWeight: "bold", color: theme.colors.textPrimary, marginVertical: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(45, 91, 255, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: theme.colors.headerBlue, fontWeight: "600", marginLeft: 4 },
  incomingBox: { padding: 20, backgroundColor: "#F0F4FF", borderRadius: 15, marginVertical: 20 },
  incomingText: { textAlign: "center", color: theme.colors.headerBlue, fontWeight: "bold" },
  applyBtn: { backgroundColor: theme.colors.headerBlue, padding: 15, borderRadius: 30, alignItems: "center" },
  applyText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  deleteBtn: { marginTop: 30, marginBottom: 50, padding: 16, borderRadius: 16, backgroundColor: "rgba(255, 59, 48, 0.05)", alignItems: "center" },
  deleteBtnText: { color: "#FF3B30", fontWeight: "600" },
});