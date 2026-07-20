import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AttendanceRecord } from "../types";
import { api } from "../services/api";
import { colors, spacing } from "../theme/theme";
import { groupByMonth, getMonthLabel } from "../utils/date";
import TicketCard from "../components/TicketCard";
import LoadingView from "../components/LoadingView";

interface Section {
  title: string;
  data: AttendanceRecord[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const records = await api.getHistory();
      const grouped = groupByMonth(records).map(([monthKey, data]) => ({
        title: getMonthLabel(monthKey),
        data,
      }));
      setSections(grouped);
    } catch {
      // Empty state below handles this.
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
        <Text style={styles.title}>My Attendance</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => <TicketCard record={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No attendance records yet.</Text>
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkFaint,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.inkFaint, marginTop: spacing.xl },
});
