import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../types";
import { colors, radius, spacing, shadow } from "../theme/theme";
import { formatRelativeDate } from "../utils/date";
import { ANNOUNCEMENT_TYPE_META } from "../utils/AnnouncementTypes";

type Nav = NativeStackNavigationProp<RootStackParamList, "AnnouncementDetail">;
type DetailRoute = RouteProp<RootStackParamList, "AnnouncementDetail">;

export default function AnnouncementDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const { announcement } = route.params;
  const typeMeta = ANNOUNCEMENT_TYPE_META[announcement.type];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeMeta.fg }]}>
              {typeMeta.label}
            </Text>
          </View>
          {announcement.is_pinned && (
            <View style={styles.pinnedBadge}>
              <MaterialCommunityIcons
                name="pin"
                size={12}
                color={colors.amber}
              />
              <Text style={styles.pinnedBadgeText}>Pinned</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{announcement.title}</Text>

        <Text style={styles.meta}>
          {announcement.author_name} ·{" "}
          {formatRelativeDate(announcement.created_at)}
        </Text>

        <View style={[styles.bodyCard, shadow.card]}>
          <Text style={styles.body}>{announcement.body}</Text>
        </View>
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinnedBadgeText: { fontSize: 11, fontWeight: "700", color: colors.amber },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  meta: { fontSize: 13, color: colors.inkFaint, marginBottom: spacing.lg },

  bodyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  body: { fontSize: 15, color: colors.ink, lineHeight: 23 },
});
