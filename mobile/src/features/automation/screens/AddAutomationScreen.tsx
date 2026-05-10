import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme";
// Hardcode
import { 
  DEVICE_CATALOG, 
  DeviceCatalogItem 
} from "../../../shared/constants/devices";
import { SafeAreaView } from "react-native-safe-area-context";

export type AutomationDeviceState = {
  status: string;
  color?: { r: number; g: number; b: number };
  speed?: string;
  temp?: number;
  brightness?: number;
  mode?: string;
  fanSpeed?: string;
};

export type AutomationDeviceItem = {
  id: string;
  name: string;
  type: string;
  icon: string;
  state: AutomationDeviceState;
  isActive?: boolean;
};

export type Automation = {
  id: string | number;
  user_id: number;
  name: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  devices: AutomationDeviceItem[];
  created_at: string;
};

export default function AddAutomationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { isEdit, automation } = route.params || {};

  const [name, setName] = useState(automation?.name || "");
  const [isActive, setIsActive] = useState(automation?.isActive ?? true);
  const normalizeDevices = (items: any[]): AutomationDeviceItem[] => {
    return items.map((item) => {
      // If the item already has type and state, return it
      if (item.type && item.state) return item as AutomationDeviceItem;

      // Otherwise, try to find it in the catalog to get the correct type
      const catalogInfo = DEVICE_CATALOG.find((d) => d.id === item.id);
      const type = item.type || catalogInfo?.type || "light";
      const icon = item.icon || catalogInfo?.icon || "bulb-outline";

      // Reconstruct the structured state from legacy status
      let state: AutomationDeviceState = { status: item.status?.toLowerCase() || "off" };
      if (type === "fan") {
        const speedMatch = item.status?.match(/Speed (\d+)/i);
        state = {
          status: state.status.includes("off") ? "off" : "on",
          speed: speedMatch ? speedMatch[1] : "50"
        };
      } else if (type === "ac") {
        const tempMatch = item.status?.match(/(\d+) degree/i);
        state = {
          status: state.status.includes("off") ? "off" : "on",
          temp: tempMatch ? parseInt(tempMatch[1]) : 24
        };
      } else if (type === "light") {
        state = {
          status: state.status.includes("off") ? "off" : "on",
          // Hardcode
          color: { r: 255, g: 255, b: 255 },
          // Hardcode
          brightness: 100
        } as any;
      }

      return {
        ...item,
        type,
        icon,
        state,
      };
    });
  };

  const [devices, setDevices] = useState<AutomationDeviceItem[]>(
    normalizeDevices(automation?.devices || [])
  );

  const [selectedDevice, setSelectedDevice] =
    useState<AutomationDeviceItem | null>(null);
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isConfigModalVisible, setConfigModalVisible] = useState(false);
  const [isErrorVisible, setErrorVisible] = useState(false);

  const [tempColor, setTempColor] = useState({ r: 255, g: 255, b: 255 });
  const [tempBrightness, setTempBrightness] = useState(100);
  const [tempACTemp, setTempACTemp] = useState(24);
  const [tempACMode, setTempACMode] = useState("cool");
  const [tempACFan, setTempACFan] = useState("1");
  const [tempIsActive, setTempIsActive] = useState(true);

  const parseTime = (timeStr: string) => {
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    return { hour: h || 0, minute: m || 0 };
  };

  const [startTime, setStartTime] = useState(
    // Hardcode
    parseTime(automation?.startTime || "06:00")
  );
  const [endTime, setEndTime] = useState(
    // Hardcode
    parseTime(automation?.endTime || "08:00")
  );

  const formatTime = (time: { hour: number; minute: number }) =>
    `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(
      2,
      "0"
    )}`;

  const [timePickerConfig, setTimePickerConfig] = useState<{
    visible: boolean;
    type: "start" | "end";
    unit: "hour" | "minute";
  }>({ visible: false, type: "start", unit: "hour" });

  const openTimePicker = (type: "start" | "end", unit: "hour" | "minute") => {
    setTimePickerConfig({ visible: true, type, unit });
  };
  const [brightnessTrackWidth, setBrightnessTrackWidth] = useState(0);

  const handleBrightnessDrag = (x: number) => {
    if (brightnessTrackWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / brightnessTrackWidth));
    setTempBrightness(Math.round(ratio * 100));
  };

  const selectTimeValue = (value: number) => {
    const { type, unit } = timePickerConfig;
    const setter = type === "start" ? setStartTime : setEndTime;
    setter((prev) => ({ ...prev, [unit]: value }));
    setTimePickerConfig((prev) => ({ ...prev, visible: false }));
  };

  const renderScheduleSection = () => (
    <View style={[styles.premiumConfigCard, { marginTop: 15, marginBottom: 20 }]}>
      <View style={styles.tabContainer}>
        <View style={styles.timeInputWrapper}>
          <Text style={styles.tabLabel}>FROM</Text>
          <View style={styles.timeSplitRow}>
            <TouchableOpacity
              style={styles.timePartBox}
              onPress={() => openTimePicker("start", "hour")}
            >
              <Text style={styles.timePartLabel}>H</Text>
              <Text style={styles.timePartValue}>{String(startTime.hour).padStart(2, "0")}</Text>
            </TouchableOpacity>

            <Text style={styles.timeColon}>:</Text>

            <TouchableOpacity
              style={styles.timePartBox}
              onPress={() => openTimePicker("start", "minute")}
            >
              <Text style={styles.timePartLabel}>M</Text>
              <Text style={styles.timePartValue}>{String(startTime.minute).padStart(2, "0")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: 15 }} />

        <View style={styles.timeInputWrapper}>
          <Text style={styles.tabLabel}>TO</Text>
          <View style={styles.timeSplitRow}>
            <TouchableOpacity
              style={styles.timePartBox}
              onPress={() => openTimePicker("end", "hour")}
            >
              <Text style={styles.timePartLabel}>H</Text>
              <Text style={styles.timePartValue}>{String(endTime.hour).padStart(2, "0")}</Text>
            </TouchableOpacity>

            <Text style={styles.timeColon}>:</Text>

            <TouchableOpacity
              style={styles.timePartBox}
              onPress={() => openTimePicker("end", "minute")}
            >
              <Text style={styles.timePartLabel}>M</Text>
              <Text style={styles.timePartValue}>{String(endTime.minute).padStart(2, "0")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const handleSave = () => {
    if (!name.trim()) {
      setErrorVisible(true);
      return;
    }

    const finalData = {
      ...automation,
      name,
      isActive,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      devices,
    };

    // Hardcode
    console.log("Saving Automation:", JSON.stringify(finalData, null, 2));
    navigation.goBack();
  };

  const handleSaveDeviceSettings = () => {
    if (selectedDevice) {
      const updatedDevices = [...devices];
      const idx = updatedDevices.findIndex(d => d.id === selectedDevice.id);

      if (idx !== -1) {
        updatedDevices[idx].isActive = tempIsActive;
        if (selectedDevice.type === "light") {
          updatedDevices[idx].state = {
            ...updatedDevices[idx].state,
            status: tempACMode === "on" ? "on" : "off",
            color: tempColor,
            brightness: tempBrightness,
          };
        } else if (selectedDevice.type === "fan") {
          updatedDevices[idx].state = {
            ...updatedDevices[idx].state,
            status: tempACFan === "0" ? "off" : "on",
            speed: tempACFan,
          };
        } else if (selectedDevice.type === "ac") {
          updatedDevices[idx].state = {
            ...updatedDevices[idx].state,
            status: "on",
            temp: tempACTemp,
            mode: tempACMode,
            fanSpeed: tempACFan,
          };
        } else if (selectedDevice.type === "door") {
          updatedDevices[idx].state = {
            ...updatedDevices[idx].state,
            status: tempACMode === "locked" ? "locked" : "unlocked",
          };
        }
        setDevices(updatedDevices);
      }
    }
    setConfigModalVisible(false);
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  const handleAddNewDevice = (device: DeviceCatalogItem) => {
    const newAutomationDevice: AutomationDeviceItem = {
      id: device.id,
      name: `${device.room} ${device.name}`,
      type: device.type,
      icon: device.icon,
      state: { status: "off" },
      isActive: false,
    };

    setDevices((prev) => [...prev, newAutomationDevice]);
    setAddDeviceModalVisible(false);
  };

  const handleDevicePress = (device: AutomationDeviceItem) => {
    setSelectedDevice(device);

    if (device.type === "light") {
      setTempColor(device.state?.color || { r: 255, g: 255, b: 255 });
      setTempACMode(device.state?.status === "on" ? "on" : "off");
      setTempBrightness((device.state as any).brightness || 100);
    } else if (device.type === "fan") {
      setTempACFan(device.state?.speed || "1");
      setTempACMode(device.state?.status === "off" ? "0" : device.state?.speed || "1");
    } else if (device.type === "ac") {
      setTempACTemp(device.state?.temp || 24);
      setTempACMode((device.state as any).mode || "cool");
      setTempACFan((device.state as any).fanSpeed || "1");
    } else if (device.type === "door") {
      setTempACMode(
        device.state?.status?.toLowerCase() === "locked" ? "locked" : "unlocked"
      );
    }

    setTempIsActive(device.isActive ?? true);
    setConfigModalVisible(true);
  };

  const handleDeleteAutomation = () => {
    setDeleteConfirmVisible(true);
  };

  const availableDevicesToAdd = DEVICE_CATALOG.filter(
    (catalogDevice) => !devices.some((d) => d.id === catalogDevice.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerTitleRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navBtn}
        >
          <Ionicons
            name="close-outline"
            size={28}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>
            {isEdit ? "Edit Automation" : "New Automation"}
          </Text>
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Automation Name</Text>
          <TextInput
            style={[styles.input, { opacity: isEdit ? 1 : 0.5 }]}
            value={name}
            onChangeText={setName}
            // Hardcode
            placeholder="e.g. Movie Time"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Automation</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: theme.colors.grayMedium, true: theme.colors.headerBlue }}
            />
          </View>
        </View>

        {renderScheduleSection()}

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
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={theme.colors.headerBlue}
                />
              </View>

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  {(item as any).room ? `${(item as any).room} ${item.name}` : item.name}
                </Text>
                <Text style={styles.deviceStatus}>
                  {!item.isActive ? "Disabled • " : "Active • "}
                  {item.type === "light"
                    ? `${(item as any).state?.status === "on" ? "On" : "Off"} • ${(item as any).state?.brightness || 0}%`
                    : item.type === "ac"
                      ? `${(item as any).state?.temp || 24}°C • ${(item as any).state?.mode?.charAt(0).toUpperCase() + (item as any).state?.mode?.slice(1) || "Cool"} • Fan ${(item as any).state?.fanSpeed || "1"}`
                      : item.type === "fan"
                        ? `Speed ${(item as any).state?.speed === "0" ? "Off" : (item as any).state?.speed || "1"}`
                        : item.type === "door"
                          ? (item as any).state?.status?.charAt(0).toUpperCase() + (item as any).state?.status?.slice(1) || "Locked"
                          : "No settings"}
                </Text>
              </View>

              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveDevice(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No devices added yet.</Text>
        )}
      </ScrollView>

      <Modal visible={timePickerConfig.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitle}>
              Select {timePickerConfig.unit === "hour" ? "Hour" : "Minute"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerVerticalList}>
              {Array.from({ length: timePickerConfig.unit === "hour" ? 24 : 60 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.pickerListItem}
                  onPress={() => selectTimeValue(i)}
                >
                  <Text style={styles.pickerItemText}>{String(i).padStart(2, "0")}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setTimePickerConfig(prev => ({ ...prev, visible: false }))}
              style={styles.closePickerBtn}
            >
              <Text style={styles.closePickerText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isConfigModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDevice?.name}</Text>

            {selectedDevice ? (
              <View style={{ width: "100%", marginBottom: 20 }}>
                <View style={styles.premiumConfigCard}>
                  <View style={{ alignItems: 'center', marginBottom: 15 }}>
                    <Text style={styles.configLabel}>Device State</Text>
                  </View>

                  <View style={styles.powerToggleRow}>
                    <TouchableOpacity
                      style={[styles.powerToggleBtn, !tempIsActive && styles.powerToggleBtnOffActive]}
                      onPress={() => setTempIsActive(false)}
                    >
                      <Text style={[styles.powerToggleText, !tempIsActive && styles.powerToggleTextOffActive]}>OFF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.powerToggleBtn, tempIsActive && styles.powerToggleBtnOnActive]}
                      onPress={() => setTempIsActive(true)}
                    >
                      <Text style={[styles.powerToggleText, tempIsActive && styles.powerToggleTextOnActive]}>ON</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            {selectedDevice?.type === "light" ? (
              <View style={{ width: "100%" }}>
                <View style={styles.premiumConfigCard}>

                  <Text style={[styles.configLabel, { marginBottom: 10 }]}>Brightness</Text>
                  <Text style={styles.brightnessValueLarge}>{tempBrightness}%</Text>
                  <View style={styles.brightnessControlRow}>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => setTempBrightness((b) => Math.max(0, b - 10))}
                    >
                      <Ionicons name="remove" size={20} color={theme.colors.headerBlue} />
                    </TouchableOpacity>

                    <View
                      style={styles.progressTrack}
                      onLayout={(e) => setBrightnessTrackWidth(e.nativeEvent.layout.width)}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(e) => handleBrightnessDrag(e.nativeEvent.locationX)}
                      onResponderMove={(e) => handleBrightnessDrag(e.nativeEvent.locationX)}
                    >
                      <View style={[styles.progressFill, { width: `${tempBrightness}%` }]} />
                    </View>

                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => setTempBrightness((b) => Math.min(100, b + 10))}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.headerBlue} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.configLabel, { marginTop: 20, marginBottom: 10 }]}>Color Light</Text>
                  <View style={styles.colorRow}>
                    {[
                      { r: 198, g: 0, b: 201, hex: "#c600c9" },
                      { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
                      { r: 246, g: 193, b: 38, hex: "#F6C126" },
                      { r: 226, g: 76, b: 76, hex: "#E24C4C" }
                    ].map((color) => (
                      <TouchableOpacity
                        key={color.hex}
                        style={[
                          styles.colorDot,
                          { backgroundColor: color.hex },
                          tempColor.r === color.r &&
                          tempColor.g === color.g &&
                          tempColor.b === color.b &&
                          styles.colorActive,
                        ]}
                        onPress={() => setTempColor({ r: color.r, g: color.g, b: color.b })}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : selectedDevice?.type === "ac" ? (
              <View style={{ width: "100%" }}>
                <View style={styles.premiumConfigCard}>
                  <Text style={styles.configLabel}>Temperature</Text>
                  <View style={styles.acTempRow}>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => setTempACTemp((t) => Math.max(16, t - 1))}
                    >
                      <Ionicons name="remove" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.tempValueLarge}>{tempACTemp}°C</Text>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => setTempACTemp((t) => Math.min(30, t + 1))}
                    >
                      <Ionicons name="add" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.configLabel, { marginTop: 20 }]}>Mode</Text>
                  <View style={styles.modeChipRow}>
                    {[
                      { label: "Cool", value: "cool" },
                      { label: "Dry", value: "dry" },
                      { label: "Auto", value: "auto" },
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.value}
                        style={[styles.modeChip, tempACMode === m.value && styles.modeChipActive]}
                        onPress={() => setTempACMode(m.value)}
                      >
                        <Text style={[styles.modeChipText, tempACMode === m.value && styles.modeChipTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.configLabel, { marginTop: 20 }]}>Fan Speed</Text>
                  <View style={styles.modeChipRow}>
                    {["1", "2", "3"].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.modeChip, tempACFan === s && styles.modeChipActive]}
                        onPress={() => setTempACFan(s)}
                      >
                        <Text style={[styles.modeChipText, tempACFan === s && styles.modeChipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : selectedDevice?.type === "fan" ? (
              <View style={{ width: "100%" }}>
                <View style={styles.premiumConfigCard}>
                  <Text style={styles.configLabel}>Speed Level</Text>
                  <View style={styles.modeChipRow}>
                    {["1", "2", "3"].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.modeChip, tempACFan === s && styles.modeChipActive]}
                        onPress={() => setTempACFan(s)}
                      >
                        <Text style={[styles.modeChipText, tempACFan === s && styles.modeChipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : selectedDevice?.type === "door" ? (
              <View style={{ width: "100%" }}>
                <View style={styles.premiumConfigCard}>
                  <Text style={styles.configLabel}>Security Control</Text>

                  <View style={{ alignItems: "center", marginVertical: 30 }}>
                    <View style={[
                      styles.lockCircle,
                      { backgroundColor: tempACMode === "locked" ? "rgba(255, 59, 48, 0.1)" : "rgba(52, 199, 89, 0.1)" }
                    ]}>
                      <Ionicons
                        name={tempACMode === "locked" ? "lock-closed" : "lock-open"}
                        size={60}
                        color={tempACMode === "locked" ? "#FF3B30" : "#34C759"}
                      />
                    </View>
                    <Text style={styles.lockStatusText}>
                      {tempACMode === "locked" ? "System Locked" : "System Unlocked"}
                    </Text>
                  </View>

                  <View style={styles.modeChipRow}>
                    {["locked", "unlocked"].map((state) => (
                      <TouchableOpacity
                        key={state}
                        style={[
                          styles.modeChip,
                          tempACMode === state && {
                            backgroundColor: state === "locked" ? "#FF3B30" : "#34C759",
                          },
                        ]}
                        onPress={() => setTempACMode(state)}
                      >
                        <Text
                          style={[
                            styles.modeChipText,
                            tempACMode === state && styles.modeChipTextActive,
                          ]}
                        >
                          {state.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.modalActions, { marginTop: 20 }]}>
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveDeviceSettings}
                style={styles.saveModalBtn}
              >
                <Text style={styles.saveModalText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAddDeviceModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalActions}>
              <Text style={styles.modalTitle}>Select Device</Text>
              <TouchableOpacity onPress={() => setAddDeviceModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
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
                      <Ionicons
                        name={device.icon as any}
                        size={22}
                        color={theme.colors.headerBlue}
                      />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>
                        {(device as any).room ? `${(device as any).room} ${device.name}` : device.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  All devices are already in this automation.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isDeleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={{ textAlign: "center", marginVertical: 20 }}>
              Are you sure you want to delete this automation?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setDeleteConfirmVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: "#FF3B30" }]}
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

      <Modal visible={isErrorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: "center" }]}>
            <Ionicons
              name="warning"
              size={60}
              color="#FF3B30"
              style={{ marginBottom: 15 }}
            />
            <Text style={styles.modalTitle}>Action Required</Text>
            <Text
              style={{
                textAlign: "center",
                marginBottom: 25,
                fontSize: 16,
                color: theme.colors.textSecondary,
              }}
            >
              Please enter a name for the automation.
            </Text>

            <TouchableOpacity
              style={[
                styles.saveModalBtn,
                {
                  width: "100%",
                  alignItems: "center",
                  backgroundColor: "#FF3B30",
                },
              ]}
              onPress={() => setErrorVisible(false)}
            >
              <Text style={styles.saveModalText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isEdit && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.deleteAutomationBtn}
            onPress={handleDeleteAutomation}
          >
            <Text style={styles.deleteAutomationText}>Delete Automation</Text>
          </TouchableOpacity>
        </View>
      )}
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
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
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grayLight,
    marginVertical: 15,
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
    fontSize: 18,
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  deviceIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  deviceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  removeBtn: {
    padding: 4,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginTop: 20,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.error,
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
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
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
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingVertical: theme.spacing.md,
    zIndex: 10,
    backgroundColor: theme.colors.background,
  },
  pageTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
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
  gaugeCard: {
    backgroundColor: "#F8F9FB",
    padding: 15,
    borderRadius: 12,
    width: "100%",
  },
  gaugeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelButton: {
    flex: 1,
    height: 45,
    backgroundColor: "#FFF",
    marginHorizontal: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  levelButtonActive: {
    backgroundColor: theme.colors.headerBlue,
    borderColor: theme.colors.headerBlue,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  levelTextActive: {
    color: "#FFF",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 18,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#CCD3E1",
  },
  colorActive: {
    borderColor: theme.colors.headerBlue,
    transform: [{ scale: 1.06 }],
  },
  stepText: { fontSize: 20, color: theme.colors.headerBlue },
  tabContainer: {
    flexDirection: "row",
    width: "100%",
  },
  tabLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "bold",
    marginBottom: 4,
  },
  timeInputWrapper: {
    flex: 1,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  timePartBox: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  timePartLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#CCC",
    marginBottom: 2,
  },
  timePartValue: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  timeColon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DDD",
    marginHorizontal: 2,
    marginTop: 10,
  },
  pickerVerticalList: {
    paddingVertical: 10,
  },
  pickerListItem: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  pickerItemText: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  closePickerBtn: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: theme.colors.headerBlue,
    borderRadius: 12,
    alignItems: "center",
  },
  closePickerText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  premiumConfigCard: {
    backgroundColor: theme.colors.cardBg,
    padding: 24,
    borderRadius: 24,
    width: "100%",
  },
  brightnessValueLarge: {
    fontSize: 44,
    color: theme.colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  brightnessControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E6EBF2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.headerBlue,
  },
  statusIndicator: {
    fontSize: 13,
    fontWeight: "700",
  },
  powerToggleRow: {
    flexDirection: "row",
    backgroundColor: "#E8ECF2",
    borderRadius: 14,
    padding: 4,
  },
  powerToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  powerToggleBtnOffActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  powerToggleBtnOnActive: {
    backgroundColor: theme.colors.headerBlue,
    shadowColor: theme.colors.headerBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  powerToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#657086",
  },
  powerToggleTextOffActive: {
    color: theme.colors.textPrimary,
  },
  powerToggleTextOnActive: {
    color: "#FFF",
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E4E9F1",
    alignItems: "center",
    justifyContent: "center",
  },
  acTempRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  tempValueLarge: {
    fontSize: 42,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  modeChipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    justifyContent: "space-between",
  },
  modeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#D8DEE8",
    alignItems: "center",
  },
  modeChipActive: {
    backgroundColor: theme.colors.headerBlue,
  },
  modeChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4E5A6F",
  },
  modeChipTextActive: {
    color: "#FFFFFF",
  },
  modalSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tempValueText: {
    fontSize: 64,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  tempUnitText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginTop: -10,
  },
  lockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lockStatusText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 15,
  },
});