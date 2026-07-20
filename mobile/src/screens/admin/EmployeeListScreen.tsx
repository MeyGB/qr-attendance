import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, Employee } from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing, shadow } from "../../theme/theme";
import LoadingView from "@/components/LoadingView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EmployeeListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.getEmployees();
      setEmployees(result);
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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? employees.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          (e.department ?? "").toLowerCase().includes(q),
      )
    : employees;

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("EmployeeForm", {})}
        >
          <Feather name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Feather
          name="search"
          size={16}
          color={colors.inkFaint}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, code, department"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {error && !loading && (
        <View style={[styles.errorCard, shadow.card]}>
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>
            Couldn't load employees. Pull to retry.
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              {q ? "No employees match your search." : "No employees yet."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, shadow.card]}
            onPress={() =>
              navigation.navigate("EmployeeForm", { employee: item })
            }
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    item.is_active === 0
                      ? colors.surfaceSunken
                      : colors.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color:
                      item.is_active === 0
                        ? colors.inkFaint
                        : colors.accentDeep,
                  },
                ]}
              >
                {item.full_name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.full_name}</Text>
                {item.role === "admin" && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {item.is_active === 0 && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtext}>
                {item.employee_code} · {item.department || "No department"}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: { padding: 4 },
  title: { flex: 1, fontSize: 22, fontWeight: "700", color: colors.ink },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
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
  },
  emptyText: {
    textAlign: "center",
    color: colors.inkFaint,
    marginTop: spacing.xl,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", fontSize: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: colors.ink },
  subtext: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  adminBadge: {
    backgroundColor: colors.violetSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 10, fontWeight: "700", color: colors.violet },
  inactiveBadge: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inactiveBadgeText: { fontSize: 10, fontWeight: "700", color: colors.danger },
});
