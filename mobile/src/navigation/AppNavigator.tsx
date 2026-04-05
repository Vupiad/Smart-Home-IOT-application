import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import TabNavigator from "./TabNavigator";
import AuthNavigator from "./AuthNavigator";
import AddAutomationScreen from "../features/automation/screens/AddAutomationScreen";
import { useAuthContext } from "../features/auth/state/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
	const { isAuthenticated, isHydrating } = useAuthContext();

	if (isHydrating) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{ }
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				{!isAuthenticated ? (
					<Stack.Screen name="Auth" component={AuthNavigator} />
				) : (
					<>
						<Stack.Screen name="MainTabs" component={TabNavigator} />

						<Stack.Screen
							name="AddAutomation"
							component={AddAutomationScreen}
							options={{
								animation: 'slide_from_right',
							}}
						/>
					</>
				)}

			</Stack.Navigator>
		</NavigationContainer>
	);
}