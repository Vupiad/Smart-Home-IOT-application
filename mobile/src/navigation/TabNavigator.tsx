import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import HomeScreen from "../features/home/HomeScreen";
import ControlScreen from "../features/control/screens/ControlScreen";
import DeviceDetailScreen from "../features/control/screens/DeviceDetailScreen";
import AutomationScreen from "../features/automation/screens/AutomationScreen";
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import { DeviceType } from "../features/control/types";

type HomeStackParamList = {
  HomeMain: undefined;
};

export type ControlStackParamList = {
  ControlMain: undefined;
  DeviceDetail: {
    deviceId: string;
    deviceType: DeviceType;
    title: string;
  };
};

type AutomationStackParamList = {
  AutomationMain: undefined;
};

type OwnersStackParamList = {
  OwnersMain: undefined;
};

type TabParamList = {
  HomeTab: undefined;
  ControlTab: undefined;
  AutomationTab: undefined;
  OwnersTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ControlStack = createNativeStackNavigator<ControlStackParamList>();
const AutomationStack = createNativeStackNavigator<AutomationStackParamList>();
const OwnersStack = createNativeStackNavigator<OwnersStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function ControlStackNavigator() {
  return (
    <ControlStack.Navigator screenOptions={{ headerShown: false }}>
      <ControlStack.Screen name="ControlMain" component={ControlScreen} />
      <ControlStack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
    </ControlStack.Navigator>
  );
}

function AutomationStackNavigator() {
  return (
    <AutomationStack.Navigator screenOptions={{ headerShown: false }}>
      <AutomationStack.Screen
        name="AutomationMain"
        component={AutomationScreen}
      />
    </AutomationStack.Navigator>
  );
}

function OwnersStackNavigator() {
  return (
    <OwnersStack.Navigator screenOptions={{ headerShown: false }}>
      <OwnersStack.Screen name="OwnersMain" component={ProfileScreen} />
    </OwnersStack.Navigator>
  );
}

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        paddingTop: 8,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          width: 72,
          borderTopWidth: 3,
          borderTopColor: focused ? "#2D5BFF" : "transparent",
        }}
      />
      {children}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2D5BFF",
        tabBarInactiveTintColor: "#3E434B",
        tabBarStyle: {
          height: 78,
          backgroundColor: "#E7ECF2",
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={30}
                color={color}
              />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="ControlTab"
        component={ControlStackNavigator}
        options={{
          tabBarLabel: "Control",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons
                name={focused ? "sun-wireless" : "sun-wireless-outline"}
                size={30}
                color={color}
              />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="AutomationTab"
        component={AutomationStackNavigator}
        options={{
          tabBarLabel: "Automation",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Text
                style={{
                  color,
                  fontSize: 30,
                  lineHeight: 30,
                  fontWeight: focused ? "700" : "500",
                }}
              >
                101
              </Text>
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="OwnersTab"
        component={OwnersStackNavigator}
        options={{
          tabBarLabel: "Owners",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={30}
                color={color}
              />
            </TabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
