import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";

export default function AddLoanScreen() {
  const { token } = useAuth();
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const numericAmount = Number(amount);
    setError("");
    if (
      !friendName.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ) {
      setError(
        "Enter a friend name, a positive amount, and a valid date in YYYY-MM-DD format.",
      );
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }
    setBusy(true);
    try {
      await api.createLoan(token, {
        friendName: friendName.trim(),
        amount: numericAmount,
        dueDate,
      });
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save the loan.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Add a loan</Text>
      <Text style={styles.subtitle}>
        Keep the details clear so repayment is easy to follow.
      </Text>
      <Text style={styles.label}>Friend name</Text>
      <TextInput
        onChangeText={setFriendName}
        placeholder="e.g. Rahul"
        style={styles.input}
        value={friendName}
      />
      <Text style={styles.label}>Amount</Text>
      <TextInput
        keyboardType="decimal-pad"
        onChangeText={setAmount}
        placeholder="2500"
        style={styles.input}
        value={amount}
      />
      <Text style={styles.label}>Due date</Text>
      <TextInput
        keyboardType="numbers-and-punctuation"
        onChangeText={setDueDate}
        placeholder="2026-10-25"
        style={styles.input}
        value={dueDate}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable disabled={busy} onPress={save} style={styles.button}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save loan</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: "#f7f8fc",
    flexGrow: 1,
    padding: 24,
    paddingTop: 28,
  },
  back: { color: "#4f46e5", fontSize: 15, fontWeight: "800" },
  title: { color: "#172033", fontSize: 30, fontWeight: "800", marginTop: 28 },
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
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#e4e7ec",
    borderRadius: 12,
    borderWidth: 1,
    color: "#172033",
    fontSize: 17,
    padding: 14,
  },
  error: { color: "#b42318", fontSize: 13, lineHeight: 19, marginTop: 18 },
  button: {
    alignItems: "center",
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 52,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
