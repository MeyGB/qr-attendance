import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme/theme";

interface ScanTabButtonProps {
  onPress: () => void;
}

export default function ScanTabButton({ onPress }: ScanTabButtonProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Ionicons name="qr-code" size={36} color={colors.white} />
      </TouchableOpacity>
      <Text style={styles.label}>QR Scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  button: {
    width: 55,
    height: 55,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 4,
  },
});
