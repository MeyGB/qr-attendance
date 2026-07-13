import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api, saveSession } from '../services/api';

export default function LoginScreen({ navigation }) {
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
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Attendance</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 14, marginBottom: 14, fontSize: 16,
  },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 16, marginTop: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
