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
  // Hardcode
  AUTOMATION_AVAILABLE_SCENES,
} from "../../../shared/constants/automations";
import { SafeAreaView } from "react-native-safe-area-context";

export type AutomationDeviceState = {
  status: string;
  color?: { r: number; g: number; b: number };
  speed?: string;
  temp?: number;
};

export type AutomationDeviceItem = {
  id: string;
  name: string;
  type: string;
  icon: string;
  state: AutomationDeviceState;
  isActive?: boolean;
};

export default function AutomationDetailScreen({ navigation, route }: any) {
  const { automation: passedAutomation, automationName: passedName } = route.params || {};

  const automationName = passedName || passedAutomation?.name || "Get Up";

  const [devices] = useState<AutomationDeviceItem[]>(() => {
    if (passedAutomation?.devices) return passedAutomation.devices;

    // Hardcode
    const data = AUTOMATION_AVAILABLE_SCENES[automationName as keyof typeof AUTOMATION_AVAILABLE_SCENES];

    return (data || []) as any[];
  });

  const [isActive, setIsActive] = useState(passedAutomation?.isActive ?? true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>Detail Automation</Text>
          </View>
          
          <View style={{ width: 68 }} />
        </View>

        <View style={styles.mainInfoCard}>
          <Text style={styles.label}>Automation Name</Text>
          <Text style={styles.detailTitle}>{automationName}</Text>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Automation</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: theme.colors.grayMedium, true: theme.colors.headerBlue }}
            />
          </View>
        </View>

        <View style={styles.mainInfoCard}>
          <Text style={styles.label}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>FROM</Text>
              {/* Hardcode */}
              <Text style={styles.scheduleTime}>{passedAutomation?.startTime || "08:00"}</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>TO</Text>
              {/* Hardcode */}
              <Text style={styles.scheduleTime}>{passedAutomation?.endTime || "22:00"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Devices ({devices.length})</Text>
        </View>

        {devices.map((item) => (
          <View key={item.id} style={styles.deviceRow}>
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.layout.sectionGap,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  detailTitle: {
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
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
    alignItems: "center",
  },
  editButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navBtn: {
    padding: 20,
    minWidth: 44,
    alignItems: "center",
  },
  editButtonText: { color: theme.colors.headerBlue, fontSize: 16, fontWeight: "600" },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.grayLighter,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  scheduleItem: {
    flex: 1,
    alignItems: "center",
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 4,
    opacity: 0.6,
  },
  scheduleTime: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  scheduleDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
  },
  deviceIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
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
});