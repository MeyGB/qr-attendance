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
import type { RootStackParamList, Announcement } from "../types";
import { api } from "../services/api";
import { colors, radius, spacing, shadow } from "../theme/theme";
import { formatRelativeDate } from "../utils/date";
import LoadingView from "../components/LoadingView";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AnnouncementListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.getAnnouncements();
      setAnnouncements(result);
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Announcements</Text>
        <View style={{ width: 28 }} />
      </View>

      {error && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load announcements. Pull to retry.
          </Text>
        </View>
      )}

      <FlatList
        data={announcements}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Feather
                name="message-square"
                size={28}
                color={colors.accentDeep}
              />
            </View>
            <Text style={styles.emptyHeading}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>
              Company updates will show up here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.author_name} · {formatRelativeDate(item.created_at)}
            </Text>
            <Text style={styles.cardBody}>{item.body}</Text>
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
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardMeta: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  cardBody: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
});
