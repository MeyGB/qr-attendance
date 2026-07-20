import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  MainTabParamList,
  RootStackParamList,
  Employee,
  AttendanceRecord,
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
  getGreeting,
  todayISO,
  formatTime,
  monthStats,
  isSameDate,
} from "../utils/date";
import Button from "../components/Button";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meResult, historyResult] = await Promise.all([
        api.getMe(),
        api.getHistory(),
      ]);
      setMe(meResult);
      setHistory(historyResult);
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

  let ctaLabel = "Check In Now";
  let ctaMode: "check-in" | "check-out" = "check-in";
  if (today?.check_in_time && !today?.check_out_time) {
    ctaLabel = "Check Out Now";
    ctaMode = "check-out";
  }
  const isDoneForToday = Boolean(today?.check_in_time && today?.check_out_time);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{me?.full_name ?? "..."}</Text>
      </View>

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

        {isDoneForToday ? (
          <View style={styles.doneBanner}>
            <Text style={styles.doneBannerText}>✓ All done for today</Text>
          </View>
        ) : (
          <Button
            label={ctaLabel}
            onPress={() => navigation.navigate("Scan", { mode: ctaMode })}
          />
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

      {recent.map((r) => (
        <TicketCard key={r.id} record={r} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 16, color: colors.inkSoft },
  name: { fontSize: 26, fontWeight: "700", color: colors.ink, marginTop: 2 },

  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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

  doneBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneBannerText: { color: colors.accentDeep, fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: spacing.lg },

  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.accent },
  emptyText: { color: colors.inkFaint, fontSize: 14, marginTop: spacing.sm },
});
