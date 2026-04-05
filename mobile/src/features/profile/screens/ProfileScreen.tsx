import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

import Header from "../../../shared/components/Header";
import { theme } from "../../../theme";
import { useAuthContext } from "../../auth/state/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();
  const navigation = useNavigation<any>();

  const handleAvatarPress = () => {
    navigation.getParent()?.navigate("OwnersTab");
  };

  return (
    <View style={styles.container}>
      <Header tabName="Profile" onAvatarPress={handleAvatarPress} />

      <View style={styles.body}>
        <Text style={styles.title}>Profile Screen</Text>
        <Text style={styles.subtitle}>
          Thong tin ca nhan va cai dat tai khoan.
        </Text>
        <Text style={styles.subtitle}>Current user: {user?.email ?? "N/A"}</Text>
        <View style={styles.buttonWrap}>
          <Button title="Sign out" onPress={signOut} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.layout.pagePaddingX,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: theme.layout.titleSubtitleGap,
    textAlign: "center",
    color: theme.colors.textSecondary,
    ...theme.typography.subtitle,
  },
  buttonWrap: {
    marginTop: theme.layout.sectionGap,
    width: 180,
  },
});
