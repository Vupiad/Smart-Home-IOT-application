import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuthContext } from "../state/AuthContext";
import { AuthStackParamList } from "../../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export default function SignUpScreen({ navigation }: Props) {
  const { signUpAndSignIn } = useAuthContext();
  const [fullName, setFullName] = useState("New User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSignUp = async () => {
    try {
      setSubmitting(true);
      await signUpAndSignIn({ fullName, email, password });
    } catch (error) {
      Alert.alert("Sign up failed", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full name"
      />
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
        title={submitting ? "Creating..." : "Create account"}
        onPress={onSignUp}
        disabled={submitting}
      />
      <View style={styles.gap} />
      <Button
        title="Back to Login"
        onPress={() => navigation.navigate("Login")}
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
