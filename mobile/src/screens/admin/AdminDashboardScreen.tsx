import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type {
  AdminTabParamList,
  RootStackParamList,
  Employee,
  AdminAttendanceRecord,
  AdminLeaveRequest,
} from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing, monoFont, shadow } from "../../theme/theme";
import { todayISO, isSameDate, formatLongDate } from "../../utils/date";
import LoadingView from "../../components/LoadingView";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayRecords, setTodayRecords] = useState<AdminAttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<AdminLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meResult, employeesResult, attendanceResult, leaveResult] =
        await Promise.all([
          api.getMe(),
          api.getEmployees(),
          api.getAllAttendance(),
          api.getAllLeaveRequests(),
        ]);
      setMe(meResult);
      setEmployees(employeesResult);
      setTodayRecords(
        attendanceResult.filter((r) => isSameDate(r.date, todayISO())),
      );
      setLeaveRequests(leaveResult);
      // console.log(meResult);
      // console.log(employeesResult);
      // console.log(attendanceResult);
      // console.log(leaveResult);

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

  const activeEmployees = employees.filter((e) => e.is_active === 1);
  const presentToday = todayRecords.filter(
    (r) => r.status === "present",
  ).length;
  const lateToday = todayRecords.filter((r) => r.status === "late").length;
  const absentToday = todayRecords.filter((r) => r.status === "absent").length;

  const today = todayISO();
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");
  const onLeaveToday = leaveRequests.filter(
    (r) =>
      r.status === "approved" && r.start_date <= today && r.end_date >= today,
  ).length;
  const recentPending = pendingRequests.slice(0, 5);

  const soon = (title: string) =>
    Alert.alert(title, "This section is coming in a future update.");

  if (loading) {
    return <LoadingView />;
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.heroDate}>{formatLongDate()}</Text>

        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(me?.full_name ?? "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>
              Welcome, {me?.full_name ?? "..."}
            </Text>
            <Text style={styles.heroTitle}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => soon("Notifications")}
          >
            <Feather name="bell" size={20} color={colors.white} />
            {pendingRequests.length > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {pendingRequests.length > 9 ? "9+" : pendingRequests.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.heroStatsRow}>
          <HeroStat value={activeEmployees.length} label="Employees" />
          <View style={styles.heroDivider} />
          <HeroStat value={presentToday} label="Present" />
          <View style={styles.heroDivider} />
          <HeroStat value={pendingRequests.length} label="Pending Leaves" />
        </View>
      </View>

      {error && !loading && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load dashboard data. Pull to retry.
          </Text>
        </View>
      )}

      {/* Attendance breakdown */}
      <View style={styles.statsGrid}>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="check-circle"
            label="Present"
            value={presentToday}
            color={colors.accentDeep}
            background={colors.accentSoft}
          />
        </View>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="clock"
            label="Late"
            value={lateToday}
            color={colors.amber}
            background={colors.amberSoft}
          />
        </View>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="user-x"
            label="Absent"
            value={absentToday}
            color={colors.danger}
            background={colors.dangerSoft}
          />
        </View>
        <View style={styles.statCardSlot}>
          <StatCard
            icon="calendar"
            label="On Leave"
            value={onLeaveToday}
            color={colors.violet}
            background={colors.violetSoft}
          />
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <ActionCard
          icon="check-square"
          label="Approve Leave Requests"
          color={colors.danger}
          background={colors.dangerSoft}
          badge={pendingRequests.length}
          onPress={() => navigation.navigate("LeaveApproval")}
        />
        <ActionCard
          icon="users"
          label="Employee Management"
          color={colors.accentDeep}
          background={colors.accentSoft}
          onPress={() => navigation.navigate("Employees")}
        />
        <ActionCard
          icon="bar-chart-2"
          label="Attendance Report"
          color={colors.amber}
          background={colors.amberSoft}
          onPress={() => navigation.navigate("Attendance")}
        />
        <ActionCard
          icon="megaphone"
          label="Announcements"
          color={colors.violet}
          background={colors.violetSoft}
          onPress={() => soon("Announcements")}
        />
      </View>

      {/* Recent leave requests */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Leave Requests</Text>
        <TouchableOpacity onPress={() => soon("Leave Requests")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {recentPending.length === 0 ? (
        <View style={[styles.emptyCard, shadow.card]}>
          <Feather name="calendar" size={18} color={colors.inkFaint} />
          <Text style={styles.emptyText}>No leave requests yet.</Text>
        </View>
      ) : (
        recentPending.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.leaveRow, shadow.card]}
            onPress={() => navigation.navigate("LeaveApproval")}
          >
            <View style={styles.activityAvatar}>
              <Text style={styles.activityAvatarText}>
                {r.full_name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityName}>{r.full_name}</Text>
              <Text style={styles.activityCode}>
                {LEAVE_TYPE_LABELS[r.leave_type] ?? r.leave_type} · {r.days}{" "}
                {r.days === 1 ? "day" : "days"}
              </Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
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
        <Feather name={icon} size={22} color={color} />
      </View>

      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  color,
  background,
  badge,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  background: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, shadow.card]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.actionLeft}>
        <View style={[styles.actionIconWrap, { backgroundColor: background }]}>
          <Feather name={icon} size={20} color={color} />
        </View>

        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      <View style={styles.actionRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>
              {badge > 9 ? "9+" : badge}
            </Text>
          </View>
        )}
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },

  hero: {
    backgroundColor: colors.accentDeep,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "700", fontSize: 18 },
  heroGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  heroTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.accentDeep,
  },
  bellBadgeText: { color: colors.white, fontSize: 9, fontWeight: "700" },

  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: {
    fontFamily: monoFont,
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCardSlot: { width: "47%" },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },

  statContent: {
    flex: 1,
    marginLeft: 14,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    marginBottom: spacing.sm,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },

  actionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  actionLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  actionRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
  },

  actionBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },

  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
  },
  emptyText: { color: colors.inkFaint, fontSize: 13 },

  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
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
  activityAvatarText: {
    color: colors.accentDeep,
    fontWeight: "700",
    fontSize: 14,
  },
  activityName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  activityCode: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },

  pendingBadge: {
    backgroundColor: colors.amberSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: "700", color: colors.amber },
});
