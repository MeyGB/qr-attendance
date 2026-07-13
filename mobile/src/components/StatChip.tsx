import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, monoFont } from '../theme/theme';

interface Props {
  label: string;
  value: number;
  color: string;
  background: string;
}

export default function StatChip({ label, value, color, background }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  value: {
    fontFamily: monoFont,
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
