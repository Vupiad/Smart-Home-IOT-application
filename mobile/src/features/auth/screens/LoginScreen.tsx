import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthContext } from "../state/AuthContext";
import { AuthStackParamList } from "../../../navigation/AuthNavigator";
import { StatusBar } from "expo-status-bar";
import { theme } from "../../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("demo@smarthome.app");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onLogin = async () => {
    try {
      setSubmitting(true);
      await signIn({ email, password });
    } catch (error) {
      Alert.alert("Login failed", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Blue Background Top Half */}
      <View style={styles.blueBackground}>
        {/* Decorative dots could go here */}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="shield-checkmark" size={32} color={theme.colors.headerBlue} />
              </View>
              <Text style={styles.title}>Sign in to your{"\n"}Account</Text>
              <Text style={styles.subtitle}>Enter your email and password to log in</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <TouchableOpacity style={styles.googleButton}>
                <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or login with</Text>
                <View style={styles.dividerLine} />
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
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.rememberMenu} 
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                    color={rememberMe ? theme.colors.headerBlue : "#6B7280"}
                  />
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={onLogin}
                disabled={submitting}
              >
                <Text style={styles.loginButtonText}>
                  {submitting ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.linkText}>Sign Up</Text>
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
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: "bold",
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: theme.typography.subtitle.fontSize,
    color: theme.colors.headerGrid,
    textAlign: "center",
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
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginLeft: 10,
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
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  rememberMenu: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.headerBlue,
  },
  loginButton: {
    backgroundColor: theme.colors.headerBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.headerBlue,
  },
});

