import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../features/auth/screens/LoginScreen";
import SignUpScreen from "../features/auth/screens/SignUpScreen";

export type AuthStackParamList = {
	Login: undefined;
	SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="SignUp" component={SignUpScreen} />
		</Stack.Navigator>
	);
}

