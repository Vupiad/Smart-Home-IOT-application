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

const parseFanLevel = (status: string): 1 | 2 | 3 => {
  const match = status.match(/Speed (\d)/);
  return match ? (parseInt(match[1]) as 1 | 2 | 3) : 1;
};
const parseLightStatus = (status: string) => {
  const brightnessMatch = status.match(/(\d+)%/);
  const brightness = brightnessMatch ? parseInt(brightnessMatch[1]) : 100;

  const colorMatch = status.match(/#[0-9A-Fa-f]{6}/);
  const color = colorMatch ? colorMatch[0] : "#FFFFFF";

  return { brightness, color };
};
const parseACStatus = (status: string) => {
  const tMatch = status.match(/(\d+)°C/);
  const mMatch = status.match(/(Cool|Dry|Auto|Hot)/i);
  const sMatch = status.match(/Speed (\d)/);

  return {
    temp: tMatch ? parseInt(tMatch[1]) : 24,
    mode: mMatch ? mMatch[0].toLowerCase() : "cool",
    speed: sMatch ? (parseInt(sMatch[1]) as 1 | 2 | 3) : 1,
  };
};

export default function AddAutomationScreen() {

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { isEdit, automation } = route.params || {};

  const [name, setName] = useState(automation?.name || "");
  const [isActive, setIsActive] = useState(automation?.isActive ?? true);
  const [devices, setDevices] = useState<AutomationDeviceItem[]>(automation?.devices || []);

  const [selectedDevice, setSelectedDevice] = useState<AutomationDeviceItem | null>(null);
  const [tempStatus, setTempStatus] = useState("");
  const [isAddDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isConfigModalVisible, setConfigModalVisible] = useState(false);
  const [isErrorVisible, setErrorVisible] = useState(false);
  const COLORS = ["#c600c9", "#FFFFFF", "#F6C126", "#E24C4C"];
  const [tempBrightness, setTempBrightness] = useState(100);
  const [tempColor, setTempColor] = useState("#FFFFFF");
  const [startTime, setStartTime] = useState({ hour: 22, minute: 0 });
  const [endTime, setEndTime] = useState({ hour: 6, minute: 0 });
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');

  const [tempACTemp, setTempACTemp] = useState(24);
  const [tempACMode, setTempACMode] = useState("cool");
  const [tempACFan, setTempACFan] = useState(1);

  const renderScheduleSection = () => (
    <View style={[styles.gaugeCard, { marginTop: 15 }]}>
      <Text style={styles.gaugeTitle}>Schedule Time</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.timeTab, activeTab === 'start' && styles.timeTabActive]}
          onPress={() => setActiveTab('start')}
        >
          <Text style={styles.tabLabel}>FROM</Text>
          <Text style={styles.tabValue}>{formatTime(startTime)}</Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity
          style={[styles.timeTab, activeTab === 'end' && styles.timeTabActive]}
          onPress={() => setActiveTab('end')}
        >
          <Text style={styles.tabLabel}>TO</Text>
          <Text style={styles.tabValue}>{formatTime(endTime)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.wheelMock}>
        <View style={styles.timeUnit}>
          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', 1)}><Ionicons name="chevron-up" size={24} color="#CCC" /></TouchableOpacity>
          <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.hour : endTime.hour).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', -1)}><Ionicons name="chevron-down" size={24} color="#CCC" /></TouchableOpacity>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', 1)}><Ionicons name="chevron-up" size={24} color="#CCC" /></TouchableOpacity>
          <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.minute : endTime.minute).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', -1)}><Ionicons name="chevron-down" size={24} color="#CCC" /></TouchableOpacity>
        </View>
      </View>
    </View>
  );
  const adjustSchedule = (type: 'start' | 'end', unit: 'h' | 'm', delta: number) => {
    const setter = type === 'start' ? setStartTime : setEndTime;
    setter((prev) => {
      if (unit === 'h') {
        return { ...prev, hour: (prev.hour + delta + 24) % 24 };
      } else {

        return { ...prev, minute: (prev.minute + (delta * 5) + 60) % 60 };
      }
    });
  };

  const formatTime = (time: { hour: number, minute: number }) =>
    `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;

  const handleSave = () => {
    if (!name.trim()) {
      setErrorVisible(true);
      return;
    }

    navigation.goBack();
  };


  const handleOpenDeviceConfig = (device: AutomationDeviceItem) => {
    setSelectedDevice(device);
    setTempStatus(device.status);
  };

  const handleSaveDeviceSettings = () => {
    if (selectedDevice) {
      let baseStatus = tempStatus;

      const finalStatus = `${baseStatus} • ${formatTime(startTime)} - ${formatTime(endTime)}`;

      setDevices((prev) =>
        prev.map((d) => (d.id === selectedDevice.id ? { ...d, status: finalStatus } : d))
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

    if (device.icon === "bulb" || device.icon === "flashlight" || device.name.toLowerCase().includes("light")) {
      const { brightness, color } = parseLightStatus(device.status);
      setTempBrightness(brightness);
      setTempColor(color);
    }

    if (device.icon.includes("thermometer") || device.name.toLowerCase().includes("air")) {
      const { temp, mode, speed } = parseACStatus(device.status);
      setTempACTemp(temp);
      setTempACMode(mode);
      setTempACFan(speed);
    }

    if (device.icon === "fan" || device.name.toLowerCase().includes("fan")) {
      const levelMatch = device.status.match(/Speed (\d)/);
      if (levelMatch) setTempACFan(parseInt(levelMatch[1]) as 1 | 2 | 3);
    }

    const scheduleMatch = device.status.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);

    if (scheduleMatch) {
      setStartTime({
        hour: parseInt(scheduleMatch[1]),
        minute: parseInt(scheduleMatch[2]),
      });
      setEndTime({
        hour: parseInt(scheduleMatch[3]),
        minute: parseInt(scheduleMatch[4]),
      });
    } else {
      setStartTime({ hour: 22, minute: 0 });
      setEndTime({ hour: 6, minute: 0 });
    }

    setActiveTab('start');
    setConfigModalVisible(true);
  };

  const handleDeleteAutomation = () => {
    const idToDelete = automation?.id;

    setDeleteConfirmVisible(true);
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this automation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Deleted:", idToDelete);
            navigation.goBack();
          }
        }
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerTitleRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="close-outline" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>
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
            style={[styles.input, isEdit && { marginBottom: 0 }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Movie Time"
            placeholderTextColor={theme.colors.textSecondary}
          />

          {/* CHỈ HIỂN THỊ SWITCH NẾU KHÔNG PHẢI LÀ CHẾ ĐỘ EDIT */}
          {!isEdit && (
            <View style={styles.switchRow}>
              <Text style={styles.label}>Enable Automation</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#D1D5DB", true: theme.colors.headerBlue }}
              />
            </View>
          )}
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

      </ScrollView>

      {/* KHU VỰC CHỨA MODAL CẤU HÌNH THIẾT BỊ */}
      <Modal visible={isConfigModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDevice?.name}</Text>

            {/* FAN */}
            {selectedDevice?.id.includes("fan") ? (
              /* --- GIAO DIỆN QUẠT --- */
              <View style={{ width: '100%' }}>
                <View style={styles.gaugeCard}>
                  <Text style={styles.gaugeTitle}>Fan Speed</Text>
                  <View style={styles.levelRow}>
                    {[1, 2, 3].map((level) => {
                      const isLevelActive = parseFanLevel(tempStatus) === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          style={[styles.levelButton, isLevelActive && styles.levelButtonActive]}
                          onPress={() => setTempStatus(`Speed ${level}`)}
                        >
                          <Text style={[styles.levelText, isLevelActive && styles.levelTextActive]}>{level}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.gaugeCard, { marginTop: 15, padding: 10 }]}>
                  <Text style={styles.gaugeTitle}>Schedule Time</Text>

                  {/* KHU VỰC 2 NÚT FROM - TO */}
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      style={[styles.timeTab, activeTab === 'start' && styles.timeTabActive]}
                      onPress={() => setActiveTab('start')}
                    >
                      <Text style={styles.tabLabel}>FROM</Text>
                      <Text style={styles.tabValue}>{formatTime(startTime)}</Text>
                    </TouchableOpacity>

                    <View style={{ width: 10 }} />

                    <TouchableOpacity
                      style={[styles.timeTab, activeTab === 'end' && styles.timeTabActive]}
                      onPress={() => setActiveTab('end')}
                    >
                      <Text style={styles.tabLabel}>TO</Text>
                      <Text style={styles.tabValue}>{formatTime(endTime)}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* KHU VỰC HIỂN THỊ */}
                  <View style={styles.pickerWrapper}>
                    <View style={styles.wheelMock}>
                      <View style={styles.timeUnit}>
                        <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', 1)}><Ionicons name="chevron-up" size={20} /></TouchableOpacity>
                        <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.hour : endTime.hour).padStart(2, '0')}</Text>
                        <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', -1)}><Ionicons name="chevron-down" size={20} /></TouchableOpacity>
                      </View>
                      <Text style={styles.separator}>:</Text>
                      <View style={styles.timeUnit}>
                        <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', 1)}><Ionicons name="chevron-up" size={20} /></TouchableOpacity>
                        <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.minute : endTime.minute).padStart(2, '0')}</Text>
                        <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', -1)}><Ionicons name="chevron-down" size={20} /></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : /* 2. KIỂM TRA NẾU LÀ Light */
              (selectedDevice?.id.includes("light")) ? (

                <View style={{ width: '100%' }}>

                  <View style={styles.gaugeCard}>
                    <Text style={styles.gaugeTitle}>Brightness: {tempBrightness}%</Text>
                    <View style={styles.brightnessControlRow}>
                      <TouchableOpacity style={styles.stepButton} onPress={() => setTempBrightness(prev => Math.max(0, prev - 10))}>
                        <Text style={styles.stepText}>-</Text>
                      </TouchableOpacity>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${tempBrightness}%`, backgroundColor: tempColor }]} />
                      </View>
                      <TouchableOpacity style={styles.stepButton} onPress={() => setTempBrightness(prev => Math.min(100, prev + 10))}>
                        <Text style={styles.stepText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.gaugeCard, { marginTop: 15 }]}>
                    <Text style={styles.gaugeTitle}>Light Color</Text>
                    <View style={styles.colorRow}>
                      {COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[styles.colorDot, { backgroundColor: color }, tempColor === color && styles.colorActive]}
                          onPress={() => setTempColor(color)}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={[styles.gaugeCard, { marginTop: 15, padding: 10 }]}>
                    <Text style={styles.gaugeTitle}>Schedule Time</Text>

                    <View style={styles.tabContainer}>
                      <TouchableOpacity
                        style={[styles.timeTab, activeTab === 'start' && styles.timeTabActive]}
                        onPress={() => setActiveTab('start')}
                      >
                        <Text style={styles.tabLabel}>FROM</Text>
                        <Text style={styles.tabValue}>{formatTime(startTime)}</Text>
                      </TouchableOpacity>

                      <View style={{ width: 10 }} />

                      <TouchableOpacity
                        style={[styles.timeTab, activeTab === 'end' && styles.timeTabActive]}
                        onPress={() => setActiveTab('end')}
                      >
                        <Text style={styles.tabLabel}>TO</Text>
                        <Text style={styles.tabValue}>{formatTime(endTime)}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.pickerWrapper}>
                      <View style={styles.wheelMock}>
                        <View style={styles.timeUnit}>
                          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', 1)}><Ionicons name="chevron-up" size={20} /></TouchableOpacity>
                          <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.hour : endTime.hour).padStart(2, '0')}</Text>
                          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'h', -1)}><Ionicons name="chevron-down" size={20} /></TouchableOpacity>
                        </View>
                        <Text style={styles.separator}>:</Text>
                        <View style={styles.timeUnit}>
                          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', 1)}><Ionicons name="chevron-up" size={20} /></TouchableOpacity>
                          <Text style={styles.bigTimeText}>{String(activeTab === 'start' ? startTime.minute : endTime.minute).padStart(2, '0')}</Text>
                          <TouchableOpacity onPress={() => adjustSchedule(activeTab, 'm', -1)}><Ionicons name="chevron-down" size={20} /></TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ) :/* 3. KIỂM TRA NẾU LÀ ĐIỀU HÒA (AC) */
                (selectedDevice?.id.includes("ac")) ? (
                  <View>
                    <View style={styles.gaugeCard}>
                      <Text style={styles.gaugeTitle}>Temperature</Text>
                      <View style={styles.brightnessControlRow}>
                        <TouchableOpacity style={styles.stepButton} onPress={() => setTempACTemp(t => Math.max(16, t - 1))}>
                          <Text style={styles.stepText}>-</Text>
                        </TouchableOpacity>
                        <Text style={[styles.bigTimeText, { fontSize: 42, color: '#FF4500' }]}>{tempACTemp}°C</Text>
                        <TouchableOpacity style={styles.stepButton} onPress={() => setTempACTemp(t => Math.min(30, t + 1))}>
                          <Text style={styles.stepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: 15 }}>
                      <View style={[styles.gaugeCard, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.gaugeTitle}>Mode</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                          {['Cool', 'Dry', 'Auto'].map(m => (
                            <TouchableOpacity
                              key={m}
                              style={[styles.smallChip, tempACMode === m.toLowerCase() && styles.smallChipActive]}
                              onPress={() => setTempACMode(m.toLowerCase())}
                            >
                              <Text style={[styles.smallChipText, tempACMode === m.toLowerCase() && styles.smallChipTextActive]}>{m}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={[styles.gaugeCard, { flex: 1 }]}>
                        <Text style={styles.gaugeTitle}>Fan Speed</Text>
                        <View style={styles.levelRow}>
                          {[1, 2, 3].map(s => (
                            <TouchableOpacity
                              key={s}
                              style={[styles.levelButton, { height: 35 }, tempACFan === s && styles.levelButtonActive]}
                              onPress={() => setTempACFan(s as 1 | 2 | 3)}
                            >
                              <Text style={[styles.levelText, tempACFan === s && styles.levelTextActive]}>{s}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                    {renderScheduleSection()}
                  </View>
                ) :
                  /* 4. KIỂM TRA NẾU LÀ CỬA THÔNG MINH (SMART DOOR) */
                  (selectedDevice?.id.includes("door")) ? (
                    <View style={{ width: '100%' }}>
                      <View style={styles.gaugeCard}>
                        <Text style={styles.gaugeTitle}>Door Security</Text>

                        {/* Hiển thị Icon trạng thái khóa lớn ở giữa */}
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                          <Ionicons
                            name={tempStatus === "Locked" ? "lock-closed" : "lock-open"}
                            size={80}
                            color={tempStatus === "Locked" ? theme.colors.dateIcon : theme.colors.headerBlue}
                          />
                          <Text style={[styles.bigTimeText, { marginTop: 10, fontSize: 24 }]}>
                            {tempStatus || "Locked"}
                          </Text>
                        </View>

                        {/* Nút bấm chọn trạng thái */}
                        <View style={styles.levelRow}>
                          {["Locked", "Unlocked"].map((state) => (
                            <TouchableOpacity
                              key={state}
                              style={[
                                styles.levelButton,
                                tempStatus === state && {
                                  backgroundColor: state === "Locked" ? theme.colors.dateIcon : theme.colors.headerBlue
                                }
                              ]}
                              onPress={() => setTempStatus(state)}
                            >
                              <Text style={[styles.levelText, tempStatus === state && styles.levelTextActive]}>
                                {state.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {renderScheduleSection()}
                    </View>
                  ) : null
            }

            {/* NÚT ĐIỀU KHIỂN DƯỚI CÙNG */}
            <View style={[styles.modalActions, { marginTop: 20 }]}>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveDeviceSettings}>
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
    </SafeAreaView >
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
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    backgroundColor: '#F8F9FB'
  },
  pageTitle: {
    fontSize: 20,
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
  gaugeCard: {
    backgroundColor: '#F8F9FB',
    padding: 15,
    borderRadius: 12,
    width: '100%',
  },
  gaugeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    flex: 1,
    height: 45,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  levelButtonActive: {
    backgroundColor: theme.colors.headerBlue,
    borderColor: theme.colors.headerBlue,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  levelTextActive: {
    color: '#FFF',
  },



  brightnessControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8ECF2',
    borderRadius: 4,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  stepText: { fontSize: 20, color: theme.colors.headerBlue },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorDot: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorActive: {
    borderColor: theme.colors.headerBlue,
    transform: [{ scale: 1.1 }],
  },


  timeText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 10,
    minWidth: 50,
    textAlign: 'center',
    color: theme.colors.headerBlue,
  },

  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  timeTab: {
    flex: 1,
    height: 70,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    paddingLeft: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeTabActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFB800',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tabValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
  },
  wheelMock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTimeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  separator: {
    fontSize: 28,
    marginHorizontal: 15,
    fontWeight: 'bold',
    color: '#CCC',
  },
  timeUnit: {
    alignItems: 'center',
  },/* --- STYLES CHO CHIPS (AC MODE) --- */
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    marginRight: 4,
    marginBottom: 4,
  },
  smallChipActive: {
    backgroundColor: theme.colors.headerBlue,
    borderColor: theme.colors.headerBlue,
  },
  smallChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

});