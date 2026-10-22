import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";

import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";

export default function LoginScreen() {
  const { token, signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (token) {
    router.replace("/dashboard");
    return null;
  }

  async function sendOtp() {
    setError("");
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      setError("Enter a valid international number, such as +919876543210.");
      return;
    }
    setBusy(true);
    try {
      await api.sendOtp(phone.trim());
      setOtpSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send OTP.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit OTP printed in the backend terminal.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.verifyOtp(phone.trim(), otp);
      await signIn(result.token);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not verify OTP.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.card}>
          <Text style={styles.brand}>MINILEDGER</Text>
          <Text style={styles.title}>Keep lending simple.</Text>
          <Text style={styles.subtitle}>
            Sign in with your phone to manage loans with friends.
          </Text>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            autoComplete="tel"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder="+919876543210"
            style={styles.input}
            value={phone}
          />
          <Pressable disabled={busy} onPress={sendOtp} style={styles.button}>
            {busy && !otpSent ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </Pressable>
          <Text style={styles.hint}>
            The mock OTP will appear in the backend terminal.
          </Text>
          {otpSent && (
            <>
              <Text style={styles.label}>Six-digit OTP</Text>
              <TextInput
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={setOtp}
                placeholder="123456"
                style={styles.input}
                value={otp}
              />
              <Pressable
                disabled={busy}
                onPress={verifyOtp}
                style={styles.button}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify and continue</Text>
                )}
              </Pressable>
            </>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fc",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    elevation: 3,
    padding: 24,
    shadowColor: "#16213e",
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  brand: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: "#172033", fontSize: 30, fontWeight: "800", marginTop: 12 },
  subtitle: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    marginTop: 8,
  },
  label: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#f2f4f7",
    borderColor: "#e4e7ec",
    borderRadius: 12,
    borderWidth: 1,
    color: "#172033",
    fontSize: 17,
    padding: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 52,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  hint: { color: "#667085", fontSize: 12, lineHeight: 18, marginTop: 12 },
  error: { color: "#b42318", fontSize: 13, lineHeight: 19, marginTop: 16 },
});
