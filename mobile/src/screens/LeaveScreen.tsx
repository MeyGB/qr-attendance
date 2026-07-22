import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, LeaveRequest, LeaveStatus } from "../types";
import { api } from "../services/api";
import { colors, radius, spacing, shadow } from "../theme/theme";
import LoadingView from "../components/LoadingView";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

const STATUS_STYLES: Record<
  LeaveStatus,
  { fg: string; bg: string; label: string }
> = {
  pending: { fg: colors.amber, bg: colors.amberSoft, label: "Pending" },
  approved: { fg: colors.accentDeep, bg: colors.accentSoft, label: "Approved" },
  rejected: { fg: colors.danger, bg: colors.dangerSoft, label: "Rejected" },
};

// function formatRange(start: string, end: string): string {
//   const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
//   const startLabel = new Date(`${start}T00:00:00`).toLocaleDateString([], opts);
//   if (start === end) return startLabel;
//   const endLabel = new Date(`${end}T00:00:00`).toLocaleDateString([], opts);
//   return `${startLabel} – ${endLabel}`;
// }

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startOnly = start.slice(0, 10);
  const endOnly = end.slice(0, 10);
  const startLabel = new Date(`${startOnly}T00:00:00`).toLocaleDateString(
    [],
    opts,
  );
  if (startOnly === endOnly) return startLabel;
  const endLabel = new Date(`${endOnly}T00:00:00`).toLocaleDateString([], opts);
  return `${startLabel} – ${endLabel}`;
}

export default function LeaveScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.getMyLeaveRequests();
      setRequests(result);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("LeaveForm")}
        >
          <Feather name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load your leave requests. Pull to retry.
          </Text>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Feather name="calendar" size={28} color={colors.accentDeep} />
            </View>
            <Text style={styles.emptyHeading}>No leave requests yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to request time off.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, shadow.card]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.leaveType}>
                {LEAVE_TYPE_LABELS[item.leave_type] ?? item.leave_type}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_STYLES[item.status].bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_STYLES[item.status].fg },
                  ]}
                >
                  {STATUS_STYLES[item.status].label}
                </Text>
              </View>
            </View>
            <Text style={styles.dateRange}>
              {formatRange(item.start_date, item.end_date)} · {item.days}{" "}
              {item.days === 1 ? "day" : "days"}
            </Text>
            {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
            {item.status !== "pending" && item.review_note && (
              <View style={styles.noteWrap}>
                <Text style={styles.noteLabel}>Note from admin</Text>
                <Text style={styles.noteText}>{item.review_note}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, fontSize: 26, fontWeight: "700", color: colors.ink },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },

  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  emptySubtext: { fontSize: 13, color: colors.inkSoft },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaveType: { fontSize: 15, fontWeight: "700", color: colors.ink },
  dateRange: { fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  reason: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  noteWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkFaint,
    marginBottom: 2,
  },
  noteText: { fontSize: 13, color: colors.inkSoft },
});
