import { colors, radius, shadow, spacing } from "@/theme/theme";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ActionButton({
  icon,
  label,
  color,
  background,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, shadow.card]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: background }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    width: "23%",
  },

  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
});
