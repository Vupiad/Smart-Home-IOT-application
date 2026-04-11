import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthContext } from "../state/AuthContext";
import { AuthStackParamList } from "../../../navigation/AuthNavigator";
import { StatusBar } from "expo-status-bar";
import { theme } from "../../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({ navigation }: Props) {
  const { signUpAndSignIn } = useAuthContext();
  const [familyName, setFamilyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignUp = async () => {
    try {
      setSubmitting(true);
      const fullName = `${firstName} ${familyName}`.trim();
      await signUpAndSignIn({ fullName: fullName || "New User", email, password, phone, dateOfBirth: date });
    } catch (error) {
      Alert.alert("Sign up failed", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Blue Background Top Half */}
      <View style={styles.blueBackground} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
              </TouchableOpacity>
              
              <Text style={styles.title}>Sign Up</Text>
              
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitleText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <View style={styles.nameRow}>
                <View style={styles.halfInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="Family Name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.halfInputContainer, { marginLeft: 12 }]}>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.iconRight}>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                </View>
              </View>

              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.countryCodePicker}>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.phoneInputContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.iconRight}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onSignUp}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? "Signing up..." : "Log In"}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  blueBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: theme.colors.headerBlue,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.pagePaddingX,
    paddingTop: 80,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 5,
    padding: 5,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: "bold",
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitleText: {
    fontSize: theme.typography.subtitle.fontSize,
    color: theme.colors.headerGrid,
  },
  loginLink: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: "600",
    color: theme.colors.white,
    textDecorationLine: "underline",
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfInputContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  iconRight: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  phoneRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  countryCodePicker: {
    width: 60,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.white,
  },
  phoneInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: theme.colors.white,
  },
  phoneInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    borderLeftWidth: 1,
    borderLeftColor: "#E5E7EB",
  },
  primaryButton: {
    backgroundColor: theme.colors.headerBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginLeft: 10,
  },
});
