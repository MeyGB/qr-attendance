import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { api, saveSession } from '../services/api';
import { colors, radius, spacing, monoFont } from '../theme/theme';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      await saveSession(token);
      navigation.replace('Main');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.stamp}>
          <Text style={styles.stampText}>IN{'\n'}OUT</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to clock in and out</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color={colors.inkFaint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color={colors.inkFaint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.inkFaint}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stamp: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '-8deg' }],
  },
  stampText: {
    fontFamily: monoFont,
    fontWeight: '700',
    fontSize: 15,
    color: colors.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
  },
});
