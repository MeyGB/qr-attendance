import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { AdminAttendanceRecord, AttendanceStatus } from "../../types";
import { api } from "../../services/api";
import {
  colors,
  radius,
  spacing,
  monoFont,
  shadow,
  statusStyles,
} from "../../theme/theme";
import { formatDayLabel, formatTime, todayISO } from "../../utils/date";
import LoadingView from "../../components/LoadingView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterKey = "all" | AttendanceStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "absent", label: "Absent" },
  { key: "half_day", label: "Half day" },
];

export default function AdminAttendanceScreen() {
  const [records, setRecords] = useState<AdminAttendanceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const result = await api.getAllAttendance();
      setRecords(result);
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

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.employee_code.toLowerCase().includes(q)
      );
    });
  }, [records, filter, q]);

  // Group by date, newest first (records already come sorted DESC from the backend)
  const sections = useMemo(() => {
    const groups = new Map<string, AdminAttendanceRecord[]>();
    for (const r of filtered) {
      const key = r.date.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const today = todayISO();

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather
          name="search"
          size={16}
          color={colors.inkFaint}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or code"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
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

      {error && !loading && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load attendance. Pull to retry.
          </Text>
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No matching records.</Text>
          ) : null
        }
        renderItem={({ item: [date, dayRecords] }) => (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.dateLabel}>
              {date === today ? "Today" : formatDayLabel(date)}
            </Text>
            {dayRecords.map((r) => (
              <View key={r.id} style={[styles.row, shadow.card]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {r.full_name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.full_name}</Text>
                  <Text style={styles.subtext}>
                    {formatTime(r.check_in_time)} –{" "}
                    {formatTime(r.check_out_time)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyles[r.status].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusStyles[r.status].fg },
                    ]}
                  >
                    {statusStyles[r.status].label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
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

  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkFaint,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
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
  subtext: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    fontFamily: monoFont,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
});
