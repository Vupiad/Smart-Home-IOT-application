import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import WeatherBar from "../../../shared/components/WeatherBar";
import SceneModeCard from "../../../shared/components/SceneModeCard";
import DeviceCard from "../../../shared/components/DeviceCard";
import { HOME_QUICK_ACCESS_IDS, HOME_SCENE_IDS } from "../../../shared/constants/devices";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";
import { theme } from "../../../theme";

const HomeScreen: React.FC = () => {
  const {
    selectDevicesByIds,
    selectScenesByIds,
    setDevicePower,
    setSceneActive,
  } = useSmartHomeContext();

  const quickAccessDevices = selectDevicesByIds(HOME_QUICK_ACCESS_IDS);
  const homeScenes = selectScenesByIds(HOME_SCENE_IDS);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with gradient */}
        <LinearGradient colors={["#3B6DF8", "#2B5CE6"]} style={styles.header}>
          <WeatherBar />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Hi, Hoang Trang</Text>
              <Text style={styles.subtitle}>
                Welcome to "Smart Living"! Take control as you begin your
                seamless journey of home automation
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarContainer}>
              <Ionicons
                name="person-circle"
                size={44}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications" size={22} color="#FFD700" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Scene Modes */}
        <View style={styles.sceneModes}>
          {homeScenes.map((scene) => (
            <SceneModeCard
              key={scene.id}
              name={scene.name}
              icon={scene.icon}
              iconColor={scene.iconColor}
              isActive={scene.isActive}
              onToggle={(value) => setSceneActive(scene.id, value)}
            />
          ))}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.deviceGrid}>
            {quickAccessDevices.map((device) => (
              <DeviceCard
                key={device.id}
                name={device.name}
                icon={device.icon}
                isOn={device.isOn}
                subtitle={device.subtitle ?? device.room}
                onToggle={(value) => setDevicePower(device.id, value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#3B6DF8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    borderBottomLeftRadius: theme.spacing.xl,
    borderBottomRightRadius: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: theme.spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: theme.layout.titleSubtitleGap,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
    maxWidth: "90%",
  },
  avatarContainer: {
    marginLeft: 8,
  },
  bellIcon: {
    position: "absolute",
    right: theme.layout.pagePaddingX,
    top: 80,
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
  },
  sceneModes: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.layout.pagePaddingX,
    marginTop: -16,
    marginBottom: theme.layout.sectionGap,
    gap: theme.layout.cardGap,
  },
  section: {
    paddingHorizontal: theme.layout.pagePaddingX,
    marginBottom: theme.layout.sectionGap,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: theme.layout.contentGap,
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default HomeScreen;
