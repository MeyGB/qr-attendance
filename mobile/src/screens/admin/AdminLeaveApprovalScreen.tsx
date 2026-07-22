import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
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

// The backend sends DATE columns as full ISO datetime strings (e.g.
// "2026-07-15T00:00:00.000Z"), not plain "YYYY-MM-DD" — always take just the
// date portion before building a local Date, or you get "Invalid Date".
function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function formatShort(value: string): string {
  return new Date(`${dateOnly(value)}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatFull(value: string): string {
  return new Date(`${dateOnly(value)}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRange(start: string, end: string): string {
  const startLabel = formatShort(start);
  if (dateOnly(start) === dateOnly(end)) return startLabel;
  return `${startLabel} – ${formatShort(end)}`;
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
  const [selected, setSelected] = useState<AdminLeaveRequest | null>(null);

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
              setSelected(null);
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
          <TouchableOpacity
            style={[styles.card, shadow.card]}
            activeOpacity={0.7}
            onPress={() => setSelected(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.full_name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.subtext}>
                {LEAVE_TYPE_LABELS[item.leave_type] ?? item.leave_type} ·{" "}
                {item.days} {item.days === 1 ? "day" : "days"}
                {"\n"}
                {formatRange(item.start_date, item.end_date)}
              </Text>
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
            <Feather name="chevron-right" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
        )}
      />

      {/* Detail modal */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />
          {selected && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHeaderRow}>
                  <View style={styles.avatarLg}>
                    <Text style={styles.avatarLgText}>
                      {selected.full_name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetName}>{selected.full_name}</Text>
                    <Text style={styles.sheetSubtext}>
                      {selected.employee_code}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_STYLES[selected.status].bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_STYLES[selected.status].fg },
                      ]}
                    >
                      {STATUS_STYLES[selected.status].label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Leave type</Text>
                  <Text style={styles.detailValue}>
                    {LEAVE_TYPE_LABELS[selected.leave_type] ??
                      selected.leave_type}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Start date</Text>
                  <Text style={styles.detailValue}>
                    {formatFull(selected.start_date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>End date</Text>
                  <Text style={styles.detailValue}>
                    {formatFull(selected.end_date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {selected.days} {selected.days === 1 ? "day" : "days"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>
                    {formatSubmittedAt(selected.created_at)}
                  </Text>
                </View>

                <View style={styles.reasonBlock}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.reasonText}>
                    {selected.reason || "No reason provided."}
                  </Text>
                </View>

                {selected.status !== "pending" && (
                  <View style={styles.reviewBlock}>
                    <Text style={styles.detailLabel}>
                      {selected.status === "approved" ? "Approved" : "Rejected"}
                      {selected.reviewed_at
                        ? ` · ${formatSubmittedAt(selected.reviewed_at)}`
                        : ""}
                    </Text>
                    {selected.review_note && (
                      <Text style={styles.reasonText}>
                        {selected.review_note}
                      </Text>
                    )}
                  </View>
                )}

                {selected.status === "pending" && (
                  <View style={styles.actionsRow}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Reject"
                        variant="danger"
                        onPress={() => handleReview(selected, "rejected")}
                        disabled={actingId === selected.id}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Approve"
                        onPress={() => handleReview(selected, "approved")}
                        disabled={actingId === selected.id}
                      />
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accentDeep, fontWeight: "700", fontSize: 14 },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink },
  subtext: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },

  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarLg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLgText: { color: colors.accentDeep, fontWeight: "700", fontSize: 18 },
  sheetName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  sheetSubtext: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.inkSoft, fontWeight: "600" },
  detailValue: { fontSize: 13, color: colors.ink, fontWeight: "600" },

  reasonBlock: { marginTop: spacing.md },
  reasonText: { fontSize: 14, color: colors.ink, lineHeight: 20, marginTop: 6 },

  reviewBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
