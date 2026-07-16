import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, shadow } from "../../theme/theme";

interface ManageItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  background: string;
  available: boolean;
}

const ITEMS: ManageItem[] = [
  {
    icon: "users",
    title: "Employee Management",
    description: "Add, edit, and deactivate employee accounts",
    color: colors.accentDeep,
    background: colors.accentSoft,
    available: false,
  },
  {
    icon: "calendar",
    title: "Attendance Management",
    description: "Review and correct attendance records",
    color: colors.amber,
    background: colors.amberSoft,
    available: false,
  },
  {
    icon: "sunrise",
    title: "Shift Management",
    description: "Define working hours and grace periods",
    color: colors.violet,
    background: colors.violetSoft,
    available: false,
  },
  {
    icon: "check-square",
    title: "Leave Approval",
    description: "Approve or reject employee leave requests",
    color: colors.danger,
    background: colors.dangerSoft,
    available: false,
  },
  {
    icon: "megaphone",
    title: "Announcement Management",
    description: "Post updates for all employees to see",
    color: colors.accentDeep,
    background: colors.accentSoft,
    available: false,
  },
  {
    icon: "gift",
    title: "Holiday Management",
    description: "Manage the company holiday calendar",
    color: colors.amber,
    background: colors.amberSoft,
    available: false,
  },
  {
    icon: "settings",
    title: "App Settings",
    description: "Configure QR rotation, notifications, and more",
    color: colors.inkSoft,
    background: colors.surfaceSunken,
    available: false,
  },
];

export default function AdminManageScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage</Text>
        <Text style={styles.subtitle}>Everything for running your team</Text>
      </View>

      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={[styles.card, shadow.card]}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              item.title,
              "This section is coming in a future update.",
            )
          }
        >
          <View style={[styles.iconWrap, { backgroundColor: item.background }]}>
            <Feather name={item.icon} size={20} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          {!item.available && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Soon</Text>
            </View>
          )}
          {item.available && (
            <Feather name="chevron-right" size={18} color={colors.inkFaint} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },
  subtitle: { fontSize: 14, color: colors.inkSoft, marginTop: 2 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  cardDescription: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  badge: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.inkFaint },
});
