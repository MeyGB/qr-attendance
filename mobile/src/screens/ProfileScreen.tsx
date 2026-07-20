import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, Employee } from "../types";
import { api, clearSession } from "../services/api";
import { colors, radius, spacing, monoFont, shadow } from "../theme/theme";
import Button from "../components/Button";
import LoadingView from "../components/LoadingView";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {me ? initials(me.full_name) : "—"}
          </Text>
        </View>
        <Text style={styles.name}>{me?.full_name ?? "Loading..."}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{me?.employee_code}</Text>
        </View>
      </View>

      <View style={[styles.infoCard, shadow.card]}>
        <InfoRow icon="mail" label="Email" value={me?.email ?? "—"} />
        <View style={styles.rowDivider} />
        <InfoRow
          icon="briefcase"
          label="Department"
          value={me?.department ?? "Not set"}
        />
        <View style={styles.rowDivider} />
        <InfoRow icon="shield" label="Role" value={me?.role ?? "—"} />
      </View>

      <Button label="Log Out" variant="danger" onPress={handleLogout} />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather
        name={icon}
        size={18}
        color={colors.inkFaint}
        style={{ width: 28 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: "700" },
  name: { fontSize: 19, fontWeight: "700", color: colors.ink },
  codeBadge: {
    marginTop: 8,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  codeText: {
    fontFamily: monoFont,
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  infoLabel: { fontSize: 12, color: colors.inkFaint },
  infoValue: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  rowDivider: { height: 1, backgroundColor: colors.border },
});
