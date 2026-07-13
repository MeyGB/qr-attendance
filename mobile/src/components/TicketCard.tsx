import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, monoFont, shadow } from "../theme/theme";
import { formatDateBadge, formatTime } from "../utils/date";
import { statusStyles } from "../theme/theme";
import type { AttendanceRecord } from "../types";

interface Props {
  record: AttendanceRecord;
}

// Styled like a punch-clock ticket stub: a date block on the left,
// a perforated divider, and check-in/out details on the right.
export default function TicketCard({ record }: Props) {
  const { day, month } = formatDateBadge(record.date);
  const status = statusStyles[record.status];

  return (
    <View style={[styles.container, shadow.card]}>
      <View style={styles.stub}>
        <Text style={styles.stubMonth}>{month}</Text>
        <Text style={styles.stubDay}>{day}</Text>
      </View>

      <View style={styles.notchTop} />
      <View style={styles.notchBottom} />
      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.timesRow}>
          <View>
            <Text style={styles.timeLabel}>IN</Text>
            <Text style={styles.timeValue}>
              {formatTime(record.check_in_time)}
            </Text>
          </View>
          <View>
            <Text style={styles.timeLabel}>OUT</Text>
            <Text style={styles.timeValue}>
              {formatTime(record.check_out_time)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const NOTCH_SIZE = 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: 14,
    overflow: "hidden",
  },
  stub: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    paddingVertical: 16,
  },
  stubMonth: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentDeep,
    letterSpacing: 1,
  },
  stubDay: {
    fontFamily: monoFont,
    fontSize: 22,
    fontWeight: "700",
    color: colors.accentDeep,
    marginTop: 2,
  },
  divider: {
    width: 1,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
    borderStyle: "dashed",
  },
  notchTop: {
    position: "absolute",
    top: -NOTCH_SIZE / 2,
    left: 68 - NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: colors.background,
  },
  notchBottom: {
    position: "absolute",
    bottom: -NOTCH_SIZE / 2,
    left: 68 - NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timesRow: {
    flexDirection: "row",
    gap: 24,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.inkFaint,
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeValue: {
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
