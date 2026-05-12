import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { ControlStackParamList } from "../../../navigation/TabNavigator";
import ACControl from "../components/ACControl";
import DoorControl from "../components/DoorControl";
import FanControl from "../components/FanControl";
import LightControl from "../components/LightControl";
import {
  deleteDevice,
  getDeviceDetail,
  setACFanSpeed,
  setACMode,
  setACTemperature,
  setACTimer,
  setFanLevel,
  setFanTimer,
  setLightBrightness,
  setLightColor,
  setLightTimer,
  toggleDevicePower,
  updateDeviceInfo,
} from "../services/deviceService";
import {
  ACDeviceDetail,
  DeviceDetail,
  DoorDeviceDetail,
  FanDeviceDetail,
  LightDeviceDetail,
} from "../types";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";

type Props = NativeStackScreenProps<ControlStackParamList, "DeviceDetail">;

const DOOR_ACCESS_PASSWORD =
  process.env.EXPO_PUBLIC_DOOR_PASSWORD ?? "123456";

export default function DeviceDetailScreen({ navigation, route }: Props) {
  const { deviceId, title } = route.params;
  const { refreshDevices, updateDeviceById, removeDeviceById } =
    useSmartHomeContext();
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Delete modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Door unlock password state
  const [isDoorPasswordModalVisible, setIsDoorPasswordModalVisible] =
    useState(false);
  const [doorPassword, setDoorPassword] = useState("");
  const [pendingDoorPowerState, setPendingDoorPowerState] = useState<
    boolean | null
  >(null);

  // Menu state
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDeviceDetail(deviceId);
      setDetail(response);
      // Initialize edit fields
      setEditName(response.name);
      setEditRoom((response as any)?.state?.room || "");
      setEditSubtitle((response as any)?.state?.subtitle || "");
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

    if (detail.type === "door" && isOn) {
      setPendingDoorPowerState(true);
      setDoorPassword("");
      setIsDoorPasswordModalVisible(true);
      return;
    }

    let nextDetail: DeviceDetail = { ...detail, isOn } as DeviceDetail;
    if (detail.type === "door") {
      const d = detail as DoorDeviceDetail;
      nextDetail = {
        ...d,
        isOn,
        lockStatus: isOn ? "unlocked" : "locked",
      };
    }

    void runUpdate(async () => {
      await toggleDevicePower(nextDetail, isOn);
    }, nextDetail);
  };

  const closeDoorPasswordModal = () => {
    setIsDoorPasswordModalVisible(false);
    setDoorPassword("");
    setPendingDoorPowerState(null);
  };

  const confirmDoorUnlock = async () => {
    if (!detail || pendingDoorPowerState !== true) {
      closeDoorPasswordModal();
      return;
    }

    if (doorPassword.trim() !== DOOR_ACCESS_PASSWORD) {
      Alert.alert("Error", "Incorrect password. The door remains locked.");
      return;
    }

    closeDoorPasswordModal();

    const nextDetail: DoorDeviceDetail = {
      ...(detail as DoorDeviceDetail),
      isOn: true,
      lockStatus: "unlocked",
    };

    void runUpdate(async () => {
      await toggleDevicePower(nextDetail, true);
    }, nextDetail);
  };

  const openEditModal = () => {
    setIsMenuVisible(false);
    setIsEditModalVisible(true);
  };

  const openDeleteModal = () => {
    setIsMenuVisible(false);
    setIsDeleteModalVisible(true);
  };

  const saveDeviceInfo = async () => {
    if (!detail || !editName.trim()) {
      Alert.alert("Error", "Device name is required");
      return;
    }

    setIsEditSaving(true);
    try {
      await updateDeviceInfo(deviceId, {
        name: editName.trim(),
        room: editRoom.trim(),
        subtitle: editSubtitle.trim(),
      });

      // Reload device detail
      await loadDetail();
      updateDeviceById(deviceId, {
        name: editName.trim(),
        room: editRoom.trim(),
        subtitle: editSubtitle.trim(),
      });
      await refreshDevices();
      setIsEditModalVisible(false);
      Alert.alert("Success", "Device updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update device";
      Alert.alert("Error", message);
    } finally {
      setIsEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDevice(deviceId);
      removeDeviceById(deviceId);
      await refreshDevices();
      setIsDeleteModalVisible(false);
      Alert.alert("Success", "Device deleted successfully");
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete device";
      Alert.alert("Error", message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !detail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2D5BFF" />
        <Text style={styles.loadingText}>Loading detail...</Text>
      </View>
    );
  }

  const displayTitle = detail.name || title;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={navigation.goBack}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>

        <Text style={styles.title}>{displayTitle}</Text>

        <View style={styles.headerActions}>
          <Switch
            trackColor={{ false: "#D6DBE3", true: "blue" }}
            thumbColor={detail.isOn ? "#FFFFFF" : "#F2F2F2"}
            ios_backgroundColor="#D6DBE3"
            value={detail.isOn}
            onValueChange={onTogglePower}
            disabled={saving}
          />
          <Pressable
            style={styles.menuButton}
            onPress={() => setIsMenuVisible(!isMenuVisible)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Menu Dropdown */}
      {isMenuVisible && (
        <View style={styles.menuDropdown}>
          <Pressable style={styles.menuItem} onPress={openEditModal}>
            <Ionicons name="pencil" size={18} color="#2D5BFF" />
            <Text style={styles.menuItemText}>Edit Info</Text>
          </Pressable>
          <Pressable
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={openDeleteModal}
          >
            <Ionicons name="trash" size={18} color="#FF6B6B" />
            <Text style={[styles.menuItemText, { color: "#FF6B6B" }]}>
              Delete Device
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        {detail.type === "fan" && (
          <FanControl
            detail={detail}
            onChangeLevel={(level) => {
              const nextState: FanDeviceDetail = { ...detail, level };
              void runUpdate(async () => {
                await setFanLevel(nextState, level);
              }, nextState);
            }}
            onChangeTimer={(timerMinutes) => {
              const nextState: FanDeviceDetail = { ...detail, timerMinutes };
              void runUpdate(async () => {
                await setFanTimer(nextState, timerMinutes);
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
                await setACTemperature(nextState, safeTemperature);
              }, nextState);
            }}
            onChangeMode={(mode) => {
              const nextState: ACDeviceDetail = { ...detail, mode };
              void runUpdate(async () => {
                await setACMode(nextState, mode);
              }, nextState);
            }}
            onChangeFanSpeed={(fanSpeed) => {
              const nextState: ACDeviceDetail = { ...detail, fanSpeed };
              void runUpdate(async () => {
                await setACFanSpeed(nextState, fanSpeed);
              }, nextState);
            }}
            onChangeTimer={(timerMinutes) => {
              const safeTimer = Math.max(0, timerMinutes);
              const nextState: ACDeviceDetail = {
                ...detail,
                timerMinutes: safeTimer,
              };
              void runUpdate(async () => {
                await setACTimer(nextState, safeTimer);
              }, nextState);
            }}
          />
        )}

        {detail.type === "door" && (
          <DoorControl detail={detail as DoorDeviceDetail} />
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
                await setLightBrightness(nextState, safeBrightness);
              }, nextState);
            }}
            onChangeColor={(colorHex) => {
              const nextState: LightDeviceDetail = { ...detail, colorHex };
              void runUpdate(async () => {
                await setLightColor(nextState, colorHex);
              }, nextState);
            }}
            onChangeTimer={(timerMinutes) => {
              const safeTimer = Math.max(0, timerMinutes);
              const nextState: LightDeviceDetail = {
                ...detail,
                timerMinutes: safeTimer,
              };
              void runUpdate(async () => {
                await setLightTimer(nextState, safeTimer);
              }, nextState);
            }}
          />
        )}
      </ScrollView>

      {/* Edit Device Info Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Details</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalBody}
            >
              <Text style={styles.inputLabel}>Device Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ceiling Light"
                value={editName}
                onChangeText={setEditName}
                editable={!isEditSaving}
              />

              <Text style={styles.inputLabel}>Room</Text>
              <View style={styles.typeSelector}>
                {["Living room", "Bedroom", "Kitchen", "Garage"].map((room) => (
                  <TouchableOpacity
                    key={room}
                    style={[
                      styles.typeChip,
                      editRoom === room && styles.typeChipActive,
                    ]}
                    onPress={() => setEditRoom(room)}
                    disabled={isEditSaving}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        editRoom === room && styles.typeChipTextActive,
                      ]}
                    >
                      {room}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="e.g. Main light"
                value={editSubtitle}
                onChangeText={setEditSubtitle}
                editable={!isEditSaving}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isEditSaving && styles.submitButtonDisabled,
                ]}
                onPress={saveDeviceInfo}
                disabled={isEditSaving}
              >
                {isEditSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Door Unlock Password Modal */}
      <Modal
        visible={isDoorPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDoorPasswordModal}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconWrapper}>
              <Ionicons name="key" size={48} color="#2D5BFF" />
            </View>

            <Text style={styles.confirmModalTitle}>Enter Door Password</Text>
            <Text style={styles.confirmModalText}>
              A password is required before unlocking the door.
            </Text>

            <TextInput
              style={styles.doorPasswordInput}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={doorPassword}
              onChangeText={setDoorPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={closeDoorPasswordModal}
                disabled={saving}
              >
                <Text style={styles.confirmButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmButtonPrimary,
                  saving && styles.confirmButtonPrimaryDisabled,
                ]}
                onPress={confirmDoorUnlock}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonDeleteText}>Unlock Door</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Device Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconWrapper}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
            </View>

            <Text style={styles.confirmModalTitle}>Delete Device?</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete "{detail.name}"? This action
              cannot be undone.
            </Text>

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmButtonDelete,
                  isDeleting && styles.confirmButtonDeleteDisabled,
                ]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: "#DCE1E9",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
    backgroundColor: "#2D5BFF",
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
    textAlign: "left",
    fontSize: 25,
    lineHeight: 34,
    color: "#ffffff",
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  menuDropdown: {
    position: "absolute",
    top: 58 + 36 + 8,
    right: 18,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 14,
    color: "#2D5BFF",
    fontWeight: "600",
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
  modalBody: {
    paddingHorizontal: 0,
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
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  doorPasswordInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    color: "#111827",
    marginBottom: 24,
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
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 420,
    alignItems: "center",
  },
  confirmIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  confirmModalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonCancel: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  confirmButtonCancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButtonDelete: {
    backgroundColor: "#FF6B6B",
  },
  confirmButtonDeleteDisabled: {
    opacity: 0.7,
  },
  confirmButtonDeleteText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButtonPrimary: {
    backgroundColor: "#2D5BFF",
  },
  confirmButtonPrimaryDisabled: {
    opacity: 0.7,
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
});
