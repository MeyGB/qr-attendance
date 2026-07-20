import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { RootStackParamList, LeaveType } from "../types";
import { api } from "../services/api";
import { colors, radius, spacing } from "../theme/theme";
import { todayISO } from "../utils/date";
import Button from "../components/Button";
import SelectField from "../components/SelectField";
import DatePickerField from "../components/DatePickerField";

type Nav = NativeStackNavigationProp<RootStackParamList, "LeaveForm">;

const LEAVE_TYPE_OPTIONS: { label: string; value: LeaveType }[] = [
  { label: "Annual Leave", value: "annual" },
  { label: "Sick Leave", value: "sick" },
  { label: "Unpaid Leave", value: "unpaid" },
  { label: "Other", value: "other" },
];

function daysInclusive(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function LeaveFormScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days =
    startDate && endDate && endDate >= startDate
      ? daysInclusive(startDate, endDate)
      : null;

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Missing dates", "Please select a start and end date.");
      return;
    }
    if (endDate < startDate) {
      Alert.alert("Invalid dates", "End date can't be before the start date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason || undefined,
      });
      Alert.alert(
        "Request submitted",
        "Your leave request has been sent for approval.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Couldn't submit request", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Request Leave</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SelectField
          label="Leave type"
          value={leaveType}
          options={LEAVE_TYPE_OPTIONS}
          onChange={(v) => setLeaveType(v as LeaveType)}
        />

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <DatePickerField
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              minDate={todayISO()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerField
              label="End date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate ?? todayISO()}
            />
          </View>
        </View>

        {days !== null && (
          <View style={styles.daysBadge}>
            <Feather name="calendar" size={14} color={colors.accentDeep} />
            <Text style={styles.daysText}>
              {days} {days === 1 ? "day" : "days"}
            </Text>
          </View>
        )}

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={reason}
            onChangeText={setReason}
            placeholder="Add any details for your manager..."
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button
            label={submitting ? "Submitting..." : "Submit Request"}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  dateRow: { flexDirection: "row", gap: spacing.md },

  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  daysText: { fontSize: 13, fontWeight: "700", color: colors.accentDeep },

  fieldWrap: { gap: 6 },
  label: { fontSize: 13, color: colors.inkSoft, fontWeight: "600" },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: "top",
  },
});
