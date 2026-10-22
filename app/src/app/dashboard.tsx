import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/auth-context";
import { api, Loan, Summary } from "@/services/api";

const zeroSummary: Summary = {
  totalLent: "0",
  totalRepaid: "0",
  overdueAmount: "0",
  totalOutstanding: "0",
};

const money = (value: string) =>
  `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function DashboardScreen() {
  const { token, signOut } = useAuth();

  const [summary, setSummary] = useState(zeroSummary);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [repayingId, setRepayingId] = useState<string | null>(null);

  async function loadData(refresh = false) {
    if (!token) return;

    setError("");
    refresh ? setRefreshing(true) : setLoading(true);

    try {
      const [newSummary, newLoans] = await Promise.all([
        api.getSummary(token),
        api.getLoans(token),
      ]);

      setSummary(newSummary);
      setLoans(newLoans);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load loans."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [token]);

  async function repayLoan(id: string) {
    if (!token) return;

    setRepayingId(id);
    setError("");

    try {
      await api.repayLoan(token, id);
      await loadData(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not repay loan."
      );
    } finally {
      setRepayingId(null);
    }
  }

  if (!token) return null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={loans}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
        />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          No loans yet. Add your first loan!
        </Text>
      }
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR LEDGER</Text>
              <Text style={styles.title}>Dashboard</Text>
            </View>

            <Pressable onPress={signOut}>
              <Text style={styles.logout}>Logout</Text>
            </Pressable>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard label="Total lent" value={money(summary.totalLent)} />
            <SummaryCard label="Total repaid" value={money(summary.totalRepaid)} />
            <SummaryCard
              label="Overdue"
              value={money(summary.overdueAmount)}
              danger
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Loans</Text>

            <Pressable
              onPress={() => router.push("/add-loan")}
              style={styles.addButton}
            >
              <Text style={styles.addText}>+ Add loan</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.loanCard,
            item.isOverdue && styles.overdueCard,
          ]}
        >
          <View style={styles.loanTop}>
            <Text style={styles.friend}>{item.friendName}</Text>

            <Text
              style={[
                styles.status,
                item.isOverdue && styles.overdueText,
              ]}
            >
              {item.isRepaid
                ? "Repaid"
                : item.isOverdue
                  ? "Overdue"
                  : "Unpaid"}
            </Text>
          </View>

          <Text style={styles.amount}>{money(item.amount)}</Text>
          <Text style={styles.due}>Due {item.dueDate}</Text>

          {!item.isRepaid && (
            <Pressable
              disabled={repayingId === item.id}
              onPress={() => repayLoan(item.id)}
              style={styles.repayButton}
            >
              <Text style={styles.repayText}>
                {repayingId === item.id ? "Updating..." : "Mark as repaid"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

function SummaryCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, danger && styles.overdueText]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f7f8fc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f8fc",
  },
  content: { padding: 20, paddingBottom: 36, flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 22,
  },
  eyebrow: {
    color: "#4f46e5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: "#172033", fontSize: 30, fontWeight: "800", marginTop: 4 },
  logout: { color: "#667085", fontSize: 14, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", gap: 8 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flex: 1,
    padding: 13,
  },
  summaryLabel: { color: "#667085", fontSize: 11, fontWeight: "700" },
  summaryValue: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  overdueText: { color: "#b42318" },
  error: { color: "#b42318", fontSize: 13, marginTop: 14 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 12,
  },
  sectionTitle: { color: "#172033", fontSize: 20, fontWeight: "800" },
  addButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  addText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  loanCard: {
    backgroundColor: "#fff",
    borderColor: "#eaecf0",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  overdueCard: { borderColor: "#fecdca", borderWidth: 1.5 },
  loanTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friend: { color: "#172033", fontSize: 17, fontWeight: "800" },
  status: { color: "#027a48", fontSize: 12, fontWeight: "800" },
  amount: { color: "#172033", fontSize: 25, fontWeight: "800", marginTop: 14 },
  due: { color: "#667085", fontSize: 13, marginTop: 4 },
  repayButton: {
    alignSelf: "flex-start",
    borderColor: "#4f46e5",
    borderWidth: 1,
    borderRadius: 9,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  repayText: { color: "#4f46e5", fontSize: 13, fontWeight: "800" },
  empty: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 32,
    textAlign: "center",
  },
});