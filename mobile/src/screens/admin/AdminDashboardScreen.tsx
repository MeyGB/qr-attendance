import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, Employee, AdminAttendanceRecord } from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing, monoFont, shadow, statusStyles } from "../../theme/theme";
import { getGreeting, todayISO, isSameDate } from "../../utils/date";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [me, setMe] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayRecords, setTodayRecords] = useState<AdminAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meResult, employeesResult, attendanceResult] = await Promise.all([
        api.getMe(),
        api.getEmployees(),
        api.getAllAttendance(),
      ]);
      setMe(meResult);
      setEmployees(employeesResult);
      setTodayRecords(
        attendanceResult.filter((r) => isSameDate(r.date, todayISO())),
      );
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

  const activeEmployees = employees.filter((e) => e.is_active !== false);
  const checkedInToday = todayRecords.filter((r) => r.check_in_time).length;
  const lateToday = todayRecords.filter((r) => r.status === "late").length;
  const notYetInToday = Math.max(activeEmployees.length - todayRecords.length, 0);
  const recent = [...todayRecords]
    .filter((r) => r.check_in_time)
    .sort((a, b) => (b.check_in_time ?? "").localeCompare(a.check_in_time ?? ""))
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{me?.full_name ?? "..."}</Text>
      </View>

      {error && !loading && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>Couldn't load dashboard data. Pull to retry.</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCardSlot} onPress={() => navigation.navigate("EmployeeList")}>
          <StatCard
            icon="users"
            label="Employees"
            value={activeEmployees.length}
            color={colors.accent}
            background={colors.accentSoft}
          />
        </TouchableOpacity>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="check-circle"
            label="Checked in today"
            value={checkedInToday}
            color={statusStyles.present.fg}
            background={statusStyles.present.bg}
          />
        </View>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="clock"
            label="Late today"
            value={lateToday}
            color={statusStyles.late.fg}
            background={statusStyles.late.bg}
          />
        </View>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="user-x"
            label="Not checked in"
            value={notYetInToday}
            color={statusStyles.absent.fg}
            background={statusStyles.absent.bg}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent check-ins today</Text>
      {!loading && recent.length === 0 && (
        <Text style={styles.emptyText}>No check-ins yet today.</Text>
      )}
      {recent.map((r) => (
        <View key={r.id} style={[styles.activityRow, shadow.card]}>
          <View style={styles.activityAvatar}>
            <Text style={styles.activityAvatarText}>
              {r.full_name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>{r.full_name}</Text>
            <Text style={styles.activityCode}>{r.employee_code}</Text>
          </View>
          <Text
            style={[
              styles.activityTime,
              { color: statusStyles[r.status].fg },
            ]}
          >
            {r.check_in_time
              ? new Date(r.check_in_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  background,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.statCard, shadow.card]}>
      <View style={[styles.statIconWrap, { backgroundColor: background }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 16, color: colors.inkSoft },
  name: { fontSize: 26, fontWeight: "700", color: colors.ink, marginTop: 2 },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCardSlot: { width: "47%" },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: monoFont,
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
  },
  statLabel: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  emptyText: { color: colors.inkFaint, fontSize: 14 },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  activityAvatarText: { color: colors.accentDeep, fontWeight: "700", fontSize: 14 },
  activityName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  activityCode: { fontSize: 12, color: colors.inkFaint, fontFamily: monoFont },
  activityTime: { fontFamily: monoFont, fontSize: 13, fontWeight: "700" },
});