import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, Employee } from "../../types";
import { api, clearSession } from "../../services/api";
import { colors, radius, spacing, shadow } from "../../theme/theme";
import Button from "../../components/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingView from "@/components/LoadingView";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const ITEMS: SettingsItem[] = [
  {
    icon: "refresh-cw",
    title: "QR Rotation",
    description: "How often check-in codes refresh",
  },
  {
    icon: "bell",
    title: "Notifications",
    description: "Alerts for leave requests and more",
  },
  {
    icon: "sunrise",
    title: "Default Shift",
    description: "Working hours for new employees",
  },
];

export default function AdminSettingsScreen() {
  console.log("Setting");

  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again to continue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return <LoadingView />;
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={[styles.accountCard, shadow.card]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(me?.full_name ?? "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{me?.full_name ?? "..."}</Text>
          <Text style={styles.accountEmail}>{me?.email ?? ""}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>App Settings</Text>
      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={[styles.row, shadow.card]}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              item.title,
              "This setting is coming in a future update.",
            )
          }
        >
          <View style={styles.rowIconWrap}>
            <Feather name={item.icon} size={18} color={colors.inkSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowDescription}>{item.description}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Soon</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Log Out" variant="danger" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },

  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accentDeep, fontWeight: "700", fontSize: 18 },
  accountName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  accountEmail: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  adminBadge: {
    backgroundColor: colors.violetSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: colors.violet },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
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
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  rowDescription: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  badge: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.inkFaint },
});
