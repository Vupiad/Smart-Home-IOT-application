import { StyleSheet, Text, View } from "react-native";

export default function ControlScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Control Screen</Text>
			<Text style={styles.subtitle}>Quan ly va dieu khien cac thiet bi trong nha.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F7FB",
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: "700",
		color: "#1E2738",
	},
	subtitle: {
		marginTop: 10,
		textAlign: "center",
		color: "#4A5364",
		fontSize: 15,
	},
});
