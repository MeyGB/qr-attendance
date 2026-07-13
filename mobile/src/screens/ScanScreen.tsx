import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList, ScanMode } from "../types";
import { api } from "../services/api";
import { colors, radius, spacing } from "../theme/theme";
import Button from "../components/Button";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

export default function ScanScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<ScanMode>(route.params?.mode ?? "check-in");
  const insets = useSafeAreaInsets();
  // A ref (not state) blocks duplicate scans immediately. The camera can fire
  // several detections for the same code within milliseconds — faster than
  // React can re-render to disable the callback via state alone.
  const scanLockRef = useRef(false);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Feather name="camera" size={40} color={colors.inkFaint} />
        <Text style={styles.permissionText}>
          We need camera access to scan the entrance QR code.
        </Text>
        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const handleScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setScanned(true);

    try {
      const result =
        mode === "check-in"
          ? await api.checkIn(data)
          : await api.checkOut(data);
      Alert.alert("Success", result.message, [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Scan failed", message, [
        {
          text: "Try Again",
          onPress: () => {
            scanLockRef.current = false;
            setScanned(false);
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 14 }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={22} color={colors.white} />
      </TouchableOpacity>

      <View style={[styles.modeSwitch, { top: insets.top + 14 }]}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "check-in" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("check-in")}
        >
          <Text
            style={
              mode === "check-in" ? styles.modeTextActive : styles.modeText
            }
          >
            Check In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "check-out" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("check-out")}
        >
          <Text
            style={
              mode === "check-out" ? styles.modeTextActive : styles.modeText
            }
          >
            Check Out
          </Text>
        </TouchableOpacity>
      </View>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScanned}
      />

      <View style={styles.viewfinderWrap} pointerEvents="none">
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      <View
        style={[styles.overlay, { bottom: insets.bottom + 40 }]}
        pointerEvents="none"
      >
        <Text style={styles.overlayText}>
          Point camera at the entrance QR code
        </Text>
      </View>
    </View>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  permissionText: {
    textAlign: "center",
    color: colors.inkSoft,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { position: "absolute", width: "100%", alignItems: "center" },
  overlayText: {
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    fontSize: 13,
    fontWeight: "600",
  },
  modeSwitch: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radius.pill,
    zIndex: 10,
    padding: 4,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  modeButtonActive: { backgroundColor: colors.accent },
  modeText: { color: colors.ink, fontWeight: "600" },
  modeTextActive: { color: colors.white, fontWeight: "600" },
  viewfinderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: { width: FRAME, height: FRAME },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
});
