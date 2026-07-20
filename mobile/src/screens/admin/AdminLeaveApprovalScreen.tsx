import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type {
  RootStackParamList,
  AdminLeaveRequest,
  LeaveStatus,
} from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing, shadow } from "../../theme/theme";
import LoadingView from "../../components/LoadingView";
import Button from "../../components/Button";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = "all" | LeaveStatus;

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

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startLabel = new Date(`${start}T00:00:00`).toLocaleDateString([], opts);
  if (start === end) return startLabel;
  const endLabel = new Date(`${end}T00:00:00`).toLocaleDateString([], opts);
  return `${startLabel} – ${endLabel}`;
}

export default function AdminLeaveApprovalScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async (activeFilter: FilterKey) => {
    try {
      const result = await api.getAllLeaveRequests(
        activeFilter === "all" ? undefined : activeFilter,
      );
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
      setLoading(true);
      load(filter);
    }, [load, filter]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(filter);
  };

  const handleReview = (
    request: AdminLeaveRequest,
    status: "approved" | "rejected",
  ) => {
    Alert.alert(
      status === "approved" ? "Approve this request?" : "Reject this request?",
      `${request.full_name} · ${LEAVE_TYPE_LABELS[request.leave_type] ?? request.leave_type} · ${formatRange(request.start_date, request.end_date)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          style: status === "approved" ? "default" : "destructive",
          onPress: async () => {
            setActingId(request.id);
            try {
              await api.reviewLeaveRequest(request.id, status);
              load(filter);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Something went wrong";
              Alert.alert("Couldn't update request", message);
            } finally {
              setActingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Leave Requests</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={
                filter === f.key ? styles.filterTextActive : styles.filterText
              }
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load leave requests. Pull to retry.
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
          <Text style={styles.emptyText}>
            No {filter !== "all" ? filter : ""} leave requests.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, shadow.card]}>
            <View style={styles.cardTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.full_name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.subtext}>{item.employee_code}</Text>
              </View>
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

            <Text style={styles.leaveType}>
              {LEAVE_TYPE_LABELS[item.leave_type] ?? item.leave_type}
            </Text>
            <Text style={styles.dateRange}>
              {formatRange(item.start_date, item.end_date)} · {item.days}{" "}
              {item.days === 1 ? "day" : "days"}
            </Text>
            {item.reason && <Text style={styles.reason}>{item.reason}</Text>}

            {item.status === "pending" && (
              <View style={styles.actionsRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Reject"
                    variant="danger"
                    onPress={() => handleReview(item, "rejected")}
                    disabled={actingId === item.id}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Approve"
                    onPress={() => handleReview(item, "approved")}
                    disabled={actingId === item.id}
                  />
                </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: { padding: 4 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  filterChipActive: { backgroundColor: colors.accent },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.inkSoft },
  filterTextActive: { fontSize: 12, fontWeight: "700", color: colors.white },

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
  },
  emptyText: {
    textAlign: "center",
    color: colors.inkFaint,
    marginTop: spacing.xl,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accentDeep, fontWeight: "700", fontSize: 14 },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink },
  subtext: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },

  leaveType: { fontSize: 14, fontWeight: "600", color: colors.ink },
  dateRange: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
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

  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});
