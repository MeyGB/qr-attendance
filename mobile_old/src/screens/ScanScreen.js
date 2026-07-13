import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../services/api';

// This screen assumes the office entrance displays a rotating QR code
// (served by GET /api/attendance/current-qr on a tablet/monitor).
// Scanning it here submits it to check-in or check-out.

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState('check-in'); // 'check-in' | 'check-out'

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 16 }}>We need camera access to scan the QR code.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const result = mode === 'check-in'
        ? await api.checkIn(data)
        : await api.checkOut(data);

      Alert.alert('Success', result.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message, [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'check-in' && styles.modeButtonActive]}
          onPress={() => setMode('check-in')}
        >
          <Text style={mode === 'check-in' ? styles.modeTextActive : styles.modeText}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'check-out' && styles.modeButtonActive]}
          onPress={() => setMode('check-out')}
        >
          <Text style={mode === 'check-out' ? styles.modeTextActive : styles.modeText}>Check Out</Text>
        </TouchableOpacity>
      </View>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point camera at the entrance QR code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlay: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  overlayText: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 },
  modeSwitch: {
    position: 'absolute', top: 50, alignSelf: 'center', flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, zIndex: 10, padding: 4,
  },
  modeButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 16 },
  modeButtonActive: { backgroundColor: '#2563eb' },
  modeText: { color: '#333', fontWeight: '600' },
  modeTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
