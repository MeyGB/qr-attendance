import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/theme";

interface DatePickerFieldProps {
  label: string;
  value: string | null; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toISO(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

export default function DatePickerField({
  label,
  value,
  onChange,
  minDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const initial = value
    ? parseISO(value)
    : parseISO(
        toISO(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
        ),
      );
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const minParsed = minDate ? parseISO(minDate) : null;

  const isBeforeMin = (day: number) => {
    if (!minParsed) return false;
    const cellISO = toISO(viewYear, viewMonth, day);
    return cellISO < minDate!;
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const displayLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text style={value ? styles.fieldText : styles.placeholderText}>
          {displayLabel}
        </Text>
        <Feather name="calendar" size={18} color={colors.inkFaint} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={goPrevMonth} style={styles.monthArrow}>
                <Feather name="chevron-left" size={20} color={colors.ink} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={goNextMonth} style={styles.monthArrow}>
                <Feather name="chevron-right" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={`${w}-${i}`} style={styles.weekdayText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null)
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                const cellISO = toISO(viewYear, viewMonth, day);
                const disabled = isBeforeMin(day);
                const selected = value === cellISO;
                return (
                  <TouchableOpacity
                    key={cellISO}
                    style={[styles.cell, selected && styles.cellSelected]}
                    disabled={disabled}
                    onPress={() => {
                      onChange(cellISO);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        disabled && styles.cellTextDisabled,
                        selected && styles.cellTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
    fontWeight: "600",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldText: { fontSize: 15, color: colors.ink },
  placeholderText: { fontSize: 15, color: colors.inkFaint },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  monthArrow: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: "700", color: colors.ink },

  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  weekdayText: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkFaint,
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: {
    backgroundColor: colors.accent,
    borderRadius: CELL_SIZE / 2,
  },
  cellText: { fontSize: 14, color: colors.ink },
  cellTextDisabled: { color: colors.inkFaint, opacity: 0.4 },
  cellTextSelected: { color: colors.white, fontWeight: "700" },
});
