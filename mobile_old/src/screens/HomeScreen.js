import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { api, clearSession } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.getMe().then(setMe).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {me?.full_name || '...'}</Text>
      <Text style={styles.subtitle}>{me?.employee_code}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.primaryButtonText}>Scan QR to Check In / Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.secondaryButtonText}>View My Attendance History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 8, padding: 18, marginBottom: 14 },
  primaryButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, padding: 18 },
  secondaryButtonText: { color: '#2563eb', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  logout: { marginTop: 40 },
  logoutText: { color: '#999', textAlign: 'center' },
});
