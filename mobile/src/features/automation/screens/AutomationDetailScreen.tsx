import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import {
  AUTOMATION_AVAILABLE_SCENES,
  AutomationDeviceItem,
} from "../../../shared/constants/automations";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AutomationDetailScreen({ navigation, route }: any) {
  const { automation: passedAutomation, automationName: passedName } = route.params || {};

  const automationName = passedName || passedAutomation?.name || "Get Up";

  const [devices, setDevices] = useState<AutomationDeviceItem[]>(() => {
    if (passedAutomation?.devices) return passedAutomation.devices;

    const data = AUTOMATION_AVAILABLE_SCENES[automationName as keyof typeof AUTOMATION_AVAILABLE_SCENES];

    return data || [];
  });

  const [isActive, setIsActive] = useState(passedAutomation?.isActive ?? true);

  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id ? { ...device, isActive: !device.isActive } : device
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* DÒNG TIÊU ĐỀ TRANG */}
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Detail Automation</Text>
        </View>
        {/* THẺ THÔNG TIN CHUNG */}
        <View style={styles.mainInfoCard}>
          <Text style={styles.label}>Automation Name</Text>
          <Text style={styles.detailTitle}>{automationName}</Text>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Automation</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#D1D5DB", true: theme.colors.headerBlue }}
            />
          </View>
        </View>

        {/* HÀNG NÚT BẤM (RUN - EDIT) */}
        <View style={styles.actionRow}>
          {/* <TouchableOpacity
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
            onPress={handleRunNow}
            disabled={isRunning}
          >
            {isRunning ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.runButtonText}>Run Now</Text>
              </>
            )}
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              const currentAutomationData = {
                ...passedAutomation,
                name: automationName,
                devices: devices,
                isActive: isActive,
              };

              navigation.navigate("AddAutomation", {
                isEdit: true,
                automation: currentAutomationData
              });
            }}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.headerBlue} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        {/* DANH SÁCH THIẾT BỊ DẠNG ROW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Devices ({devices.length})</Text>
        </View>
        {devices.map((item) => (
          <View key={item.id} style={styles.deviceRow}>
            <View style={styles.deviceIconWrapper}>
              <Ionicons name={item.icon as any} size={24} color={theme.colors.headerBlue} />
            </View>

            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceStatus}>{item.status}</Text>
            </View>

            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleDevice(item.id)}
              trackColor={{ false: "#D1D5DB", true: theme.colors.headerBlue }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
  mainInfoCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailTitle: {
    ...theme.typography.title,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F2F5",
    marginVertical: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  runButton: {
    flex: 2.5,
    backgroundColor: theme.colors.headerBlue,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  runButtonDisabled: { opacity: 0.7 },
  runButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  editButton: {
    flex: 1.5,
    backgroundColor: "#FFF",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8ECF2",
  },
  backButton: {
    position: 'absolute',
    left: 3,
    zIndex: 1,
    alignItems: 'center'
  },
  editButtonText: { color: theme.colors.headerBlue, fontSize: 16, fontWeight: "600" },
  deleteButtonAction: {
    width: 56,
    height: 56,
    backgroundColor: "#FFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  deviceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deviceStatus: {
    fontSize: 13,
    color: theme.colors.headerBlue,
    marginTop: 2,
    fontWeight: '500',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 10,
    minHeight: 40,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: theme.colors.textPrimary,
  },
});