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
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type {
  MainTabParamList,
  RootStackParamList,
  Employee,
  AttendanceRecord,
  Announcement,
} from "../types";
import { api } from "../services/api";
import {
  colors,
  radius,
  spacing,
  monoFont,
  shadow,
  statusStyles,
} from "../theme/theme";
import {
  todayISO,
  formatTime,
  formatRelativeDate,
  formatLongDate,
  monthStats,
  isSameDate,
} from "../utils/date";
import StatChip from "../components/StatChip";
import TicketCard from "../components/TicketCard";
import LoadingView from "../components/LoadingView";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState<Employee | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meResult, historyResult, announcementsResult] = await Promise.all([
        api.getMe(),
        api.getHistory(),
        api.getAnnouncements().catch(() => []),
      ]);
      setMe(meResult);
      setHistory(historyResult);
      setAnnouncements(announcementsResult);
    } catch {
      // Silently ignore — the user will notice via empty states.
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

  const today = history.find((r) => isSameDate(r.date, todayISO()));
  const stats = monthStats(history);
  const recent = history.slice(0, 3);
  const isCheckedIn = Boolean(today?.check_in_time && !today?.check_out_time);
  const isDoneForToday = Boolean(today?.check_in_time && today?.check_out_time);
  const isNotStarted = !today?.check_in_time;

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
      <View style={[styles.hero, shadow.card]}>
        <Text style={styles.heroDate}>{formatLongDate()}</Text>

        <View style={styles.heroTopRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(me?.full_name ?? "?").slice(0, 1).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>Welcome back,</Text>
            <Text style={styles.heroName}>{me?.full_name ?? "..."} 👋</Text>
            {/* {me?.employee_code && (
              <Text style={styles.heroMeta}>
                {me.employee_code}
                {me.department ? ` · ${me.department}` : ""}
              </Text>
            )} */}
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => soon("Notifications")}
          >
            <Feather name="bell" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today status */}
      <View style={[styles.todayCard, shadow.card]}>
        <Text style={styles.todayLabel}>TODAY</Text>
        <View style={styles.todayTimesRow}>
          <View style={styles.todayTimeBlock}>
            <Text style={styles.todayTimeLabel}>Checked in</Text>
            <Text style={styles.todayTimeValue}>
              {formatTime(today?.check_in_time ?? null)}
            </Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayTimeBlock}>
            <Text style={styles.todayTimeLabel}>Checked out</Text>
            <Text style={styles.todayTimeValue}>
              {formatTime(today?.check_out_time ?? null)}
            </Text>
          </View>
        </View>

        {isDoneForToday && (
          <View style={[styles.statusBanner, styles.bannerDone]}>
            <Feather name="check-circle" size={16} color={colors.accentDeep} />
            <Text
              style={[styles.statusBannerText, { color: colors.accentDeep }]}
            >
              All done for today
            </Text>
          </View>
        )}
        {isCheckedIn && (
          <View style={[styles.statusBanner, styles.bannerActive]}>
            <Feather name="clock" size={16} color={colors.amber} />
            <Text style={[styles.statusBannerText, { color: colors.amber }]}>
              Checked in — tap QR Scan to check out
            </Text>
          </View>
        )}
        {isNotStarted && (
          <View style={[styles.statusBanner, styles.bannerPending]}>
            <Feather name="camera" size={16} color={colors.inkSoft} />
            <Text style={[styles.statusBannerText, { color: colors.inkSoft }]}>
              Tap QR Scan to check in
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>This month</Text>
      <View style={styles.statsRow}>
        <StatChip
          label="Present"
          value={stats.present}
          color={statusStyles.present.fg}
          background={statusStyles.present.bg}
        />
        <StatChip
          label="Late"
          value={stats.late}
          color={statusStyles.late.fg}
          background={statusStyles.late.bg}
        />
        <StatChip
          label="Absent"
          value={stats.absent}
          color={statusStyles.absent.fg}
          background={statusStyles.absent.bg}
        />
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <ActionButton
          icon="calendar"
          label="Attendance"
          color={colors.accentDeep}
          background={colors.accentSoft}
          onPress={() => navigation.navigate("History")}
        />
        <ActionButton
          icon="clipboard"
          label="Leave"
          color={colors.amber}
          background={colors.amberSoft}
          onPress={() => navigation.navigate("Leave")}
        />
        <ActionButton
          icon="megaphone"
          label="Announce"
          color={colors.violet}
          background={colors.violetSoft}
          onPress={() => navigation.navigate("AnnouncementList")}
        />
        <ActionButton
          icon="gift"
          label="Holiday"
          color={colors.danger}
          background={colors.dangerSoft}
          onPress={() => soon("Holidays")}
        />
      </View>

      {announcements.length > 0 && (
        <>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <Text
              style={styles.seeAll}
              onPress={() => navigation.navigate("AnnouncementList")}
            >
              See all
            </Text>
          </View>
          {announcements.slice(0, 2).map((a) => (
            <View key={a.id} style={[styles.announcementCard, shadow.card]}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementMeta}>
                {formatRelativeDate(a.created_at)}
              </Text>
              <Text style={styles.announcementBody} numberOfLines={2}>
                {a.body}
              </Text>
            </View>
          ))}
        </>
      )}

      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Text
          style={styles.seeAll}
          onPress={() => navigation.navigate("History")}
        >
          See all
        </Text>
      </View>

      {recent.length === 0 && (
        <Text style={styles.emptyText}>No attendance recorded yet.</Text>
      )}

      <View style={{ marginHorizontal: spacing.lg }}>
        {recent.map((r) => (
          <TicketCard key={r.id} record={r} />
        ))}
      </View>
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  color,
  background,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: background }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
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
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "700", fontSize: 18 },
  heroGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  heroName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  heroMeta: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.inkFaint,
    marginBottom: spacing.md,
  },
  todayTimesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  todayTimeBlock: { flex: 1 },
  todayTimeLabel: { fontSize: 13, color: colors.inkSoft, marginBottom: 4 },
  todayTimeValue: {
    fontFamily: monoFont,
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  todayDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  bannerDone: { backgroundColor: colors.accentSoft },
  bannerActive: { backgroundColor: colors.amberSoft },
  bannerPending: { backgroundColor: colors.surfaceSunken },
  statusBannerText: { fontWeight: "700", fontSize: 13 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionButton: { alignItems: "center", width: "23%" },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
  },

  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.lg,
  },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.accent },
  emptyText: {
    color: colors.inkFaint,
    fontSize: 14,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },

  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  announcementTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  announcementMeta: {
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
    marginBottom: 6,
  },
  announcementBody: { fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
});
