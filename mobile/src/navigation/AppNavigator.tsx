import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import AddAutomationScreen from "../features/automation/screens/AddAutomationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
	return (
		<NavigationContainer>
			{ }
			<Stack.Navigator screenOptions={{ headerShown: false }}>

				{ }
				<Stack.Screen name="MainTabs" component={TabNavigator} />

				{ }
				<Stack.Screen
					name="AddAutomation"
					component={AddAutomationScreen}
					options={{
						animation: 'slide_from_right',
					}}
				/>

			</Stack.Navigator>
		</NavigationContainer>
	);
}