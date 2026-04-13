import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import Header from "../../../shared/components/Header";
import DailyEnvironmentChart from "../../../shared/components/DailyEnvironmentChart";
import { theme } from "../../../theme";
import { useAuthContext } from "../../auth/state/AuthContext";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";

type ProfileOptionProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  isLast?: boolean;
};

function ProfileOption({
  iconName,
  label,
  onPress,
  color = theme.colors.textPrimary,
  isLast,
}: ProfileOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, !isLast && styles.optionBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={styles.optionIconWrap}>
          <Ionicons name={iconName} size={20} color={color} />
        </View>
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Header tabName="Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: DEFAULT_AVATAR }} style={styles.avatar} />
          <Text style={styles.userName}>{user?.fullName || "Demo User"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "user@example.com"}
          </Text>
          {!!user?.phone && (
            <Text style={styles.userInfoText}>Phone: {user.phone}</Text>
          )}
          {!!user?.dateOfBirth && (
            <Text style={styles.userInfoText}>DOB: {user.dateOfBirth}</Text>
          )}
        </View>

        {/* Settings Group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.card}>
            <ProfileOption
              iconName="person-outline"
              label="Edit Profile"
              onPress={() => navigation.navigate("EditProfile")}
            />
            <ProfileOption
              iconName="lock-closed-outline"
              label="Change Password"
              onPress={() => navigation.navigate("ChangePassword")}
              isLast
            />
          </View>
        </View>

        {/* Other Group */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <ProfileOption
              iconName="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            <ProfileOption
              iconName="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <ProfileOption
              iconName="information-circle-outline"
              label="About App"
              onPress={() => {}}
              isLast
            />
          </View>
        </View> */}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#EF4444"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Daily Temperature & Humidity  */}
        <View style={styles.section}>
          <DailyEnvironmentChart showFootnote />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingTop: theme.layout.sectionGap,
    paddingBottom: 60,
  },
  userCard: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
