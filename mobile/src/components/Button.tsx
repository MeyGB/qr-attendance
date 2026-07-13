import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export default function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const styleForVariant = {
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accent },
    danger: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.danger },
  }[variant];

  const textColorForVariant = {
    primary: colors.white,
    secondary: colors.accent,
    danger: colors.danger,
  }[variant];

  return (
    <TouchableOpacity
      style={[styles.base, styleForVariant, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: textColorForVariant }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
