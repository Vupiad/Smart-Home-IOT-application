import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuthContext } from "../state/AuthContext";
import { AuthStackParamList } from "../../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("demo@smarthome.app");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);

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
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button
        title={submitting ? "Signing in..." : "Sign in"}
        onPress={onLogin}
        disabled={submitting}
      />
      <View style={styles.gap} />
      <Button
        title="Go to Sign up"
        onPress={() => navigation.navigate("SignUp")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gap: {
    height: 6,
  },
});
