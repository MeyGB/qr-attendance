import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, Shift, Role } from "../../types";
import { api } from "../../services/api";
import { colors, radius, spacing, shadow } from "../../theme/theme";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<RootStackParamList, "EmployeeForm">;
type FormRoute = RouteProp<RootStackParamList, "EmployeeForm">;

export default function EmployeeFormScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<FormRoute>();
  const editing = route.params?.employee ?? null;
  const isEdit = Boolean(editing);

  const [fullName, setFullName] = useState(editing?.full_name ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [employeeCode, setEmployeeCode] = useState(
    editing?.employee_code ?? "",
  );
  const [department, setDepartment] = useState(editing?.department ?? "");
  const [password, setPassword] = useState("");
  const role: Role = editing?.role ?? "employee";
  const [shiftId, setShiftId] = useState<string | null>(
    editing?.shift_id ? String(editing.shift_id) : null,
  );
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [isActive, setIsActive] = useState(editing?.is_active === 1);

  useEffect(() => {
    api
      .getShifts()
      .then(setShifts)
      .catch(() => {});
    console.log("Editing employee:", editing);
  }, []);

  const shiftOptions = [
    { label: "No shift assigned", value: "" },
    ...shifts.map((s) => ({
      label: `${s.name} (${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)})`,
      value: String(s.id),
    })),
  ];

  const handleSave = async () => {
    if (!fullName || !email || !employeeCode) {
      Alert.alert(
        "Missing info",
        "Full name, email, and employee code are required.",
      );
      return;
    }
    if (!isEdit && !password) {
      Alert.alert("Missing info", "Set a password for the new employee.");
      return;
    }

    setSaving(true);
    try {
      const shift_id = shiftId ? Number(shiftId) : null;

      if (isEdit && editing) {
        await api.updateEmployee(editing.id, {
          full_name: fullName,
          email,
          employee_code: employeeCode,
          department: department || null,
          shift_id,
          role,
          ...(password ? { password } : {}),
        });
      } else {
        await api.createEmployee({
          full_name: fullName,
          email,
          employee_code: employeeCode,
          department: department || null,
          shift_id,
          role,
          password,
        });
      }
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Couldn't save", message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    if (!editing) return;
    const willActive = !isActive;
    Alert.alert(
      willActive ? "Reactivate employee?" : "Deactivate employee?",
      willActive
        ? `${editing.full_name} will be able to log in again.`
        : `${editing.full_name} will no longer be able to log in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: willActive ? "Reactivate" : "Deactivate",
          style: willActive ? "default" : "destructive",
          onPress: async () => {
            setTogglingActive(true);
            try {
              await api.updateEmployee(editing.id, { is_active: willActive });
              setIsActive(willActive);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Something went wrong";
              Alert.alert("Couldn't update", message);
            } finally {
              setTogglingActive(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? "Edit Employee" : "New Employee"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isEdit && !isActive && (
          <View style={[styles.inactiveBanner, shadow.card]}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.inactiveBannerText}>
              This account is deactivated.
            </Text>
          </View>
        )}

        <Field
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jane Doe"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Employee code"
          value={employeeCode}
          onChangeText={setEmployeeCode}
          placeholder="EMP-001"
          autoCapitalize="characters"
        />
        <Field
          label="Department"
          value={department ?? ""}
          onChangeText={setDepartment}
          placeholder="e.g. Sales"
        />
        <Field
          label={isEdit ? "New password (optional)" : "Password"}
          value={password}
          onChangeText={setPassword}
          placeholder={
            isEdit ? "Leave blank to keep current" : "Set a password"
          }
          secureTextEntry
        />

        <View style={styles.fieldWrap}>
          <SelectField
            label="Shift"
            value={shiftId ?? ""}
            options={shiftOptions}
            onChange={(v) => setShiftId(v || null)}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label={saving ? "Saving..." : "Save Employee"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        {isEdit && (
          <View>
            <Button
              label={
                togglingActive
                  ? "Please wait..."
                  : isActive
                    ? "Deactivate employee"
                    : "Reactivate employee"
              }
              variant={isActive ? "danger" : "success"}
              onPress={handleToggleActive}
              disabled={togglingActive}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  inactiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  inactiveBannerText: { color: colors.danger, fontSize: 13, fontWeight: "600" },

  fieldWrap: { gap: 6 },
  label: { fontSize: 13, color: colors.inkSoft, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
  },

  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.inkSoft, fontWeight: "600", fontSize: 13 },
  segmentTextActive: { color: colors.white, fontWeight: "700", fontSize: 13 },
});
