import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../../../shared/components/Header";
import SceneModeCard from "../../../shared/components/SceneModeCard";
import DeviceCard from "../../../shared/components/DeviceCard";
import DailyEnvironmentChart from "../../../shared/components/DailyEnvironmentChart";
import { HOME_QUICK_ACCESS_IDS, HOME_SCENE_IDS } from "../../../shared/constants/devices";
import { useSmartHomeContext } from "../../../shared/state/SmartHomeContext";
import { ControlStackParamList } from "../../../navigation/TabNavigator";
import { DeviceType } from "../../control/types";
import { theme } from "../../../theme";

const HomeScreen: React.FC = () => {
  const {
    selectDevicesByIds,
    selectScenesByIds,
    setDevicePower,
    setSceneActive,
  } = useSmartHomeContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<ControlStackParamList>>();

  const quickAccessDevices = selectDevicesByIds(HOME_QUICK_ACCESS_IDS);
  const homeScenes = selectScenesByIds(HOME_SCENE_IDS);

  const handleOpenControl = () => {
    navigation.getParent()?.navigate("ControlTab" as never);
  };

  const handleOpenDeviceDetail = (device: (typeof quickAccessDevices)[number]) => {
    navigation.getParent()?.navigate("ControlTab" as never, {
      screen: "DeviceDetail",
      params: {
        deviceId: device.id,
        deviceType: device.type as DeviceType,
        title: device.name,
      },
    } as never);
  };

  return (
    <View style={styles.container}>
      <Header tabName="Home" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.bodyContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>Hi, Hoang Trang</Text>
            <Text style={styles.subtitle}>
              Welcome to "Smart Living"! Take control as you begin your
              seamless journey of home automation
            </Text>
          </View>

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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quick access</Text>
              <TouchableOpacity onPress={handleOpenControl}>
                <Text style={styles.viewMoreText}>Xem them</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAccessList}
            >
              {quickAccessDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  name={device.name}
                  icon={device.icon}
                  isOn={device.isOn}
                  subtitle={device.room}
                  onToggle={(value) => setDevicePower(device.id, value)}
                  onPress={() => handleOpenDeviceDetail(device)}
                  cardStyle={styles.quickAccessCard}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <DailyEnvironmentChart title="Bieu do nhiet do, do am" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  bodyContent: {
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingTop: theme.layout.sectionGap,
    paddingBottom: theme.layout.sectionGap,
  },
  welcomeSection: {
    marginBottom: theme.layout.sectionGap,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: theme.layout.titleSubtitleGap,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  sceneModes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.layout.sectionGap,
    gap: theme.layout.cardGap,
  },
  section: {
    marginBottom: theme.layout.sectionGap,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.layout.contentGap,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D5BFF",
  },
  quickAccessList: {
    paddingRight: 4,
  },
  quickAccessCard: {
    width: 170,
    marginRight: 12,
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default HomeScreen;
