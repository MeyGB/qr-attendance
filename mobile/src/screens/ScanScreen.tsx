import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../types";
import { api } from "../services/api";
import { colors, radius, spacing } from "../theme/theme";
import Button from "../components/Button";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<"check-in" | "check-out">("check-in");

  const [checking, setChecking] = useState(true);

  const insets = useSafeAreaInsets();

  const scanLockRef = useRef(false);

  // Decide check-in or check-out
  useEffect(() => {
    async function detectMode() {
      try {
        const history = await api.getHistory();

        const today = history.find((item) =>
          item.date.startsWith(new Date().toISOString().slice(0, 10)),
        );

        if (today?.check_in_time && !today?.check_out_time) {
          setMode("check-out");
        } else {
          setMode("check-in");
        }
      } catch (error) {
        console.log("Detect mode error", error);
      } finally {
        setChecking(false);
      }
    }

    detectMode();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Feather name="camera" size={40} color={colors.inkFaint} />

        <Text style={styles.permissionText}>
          We need camera access to scan QR code.
        </Text>

        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />

        <Text style={styles.loadingText}>Checking attendance...</Text>
      </View>
    );
  }

  const handleScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanLockRef.current) return;

    scanLockRef.current = true;

    try {
      let result;

      if (mode === "check-in") {
        result = await api.checkIn(data);
      } else {
        result = await api.checkOut(data);
      }

      Alert.alert("Success", result.message, [
        {
          text: "Done",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      Alert.alert("Scan failed", message, [
        {
          text: "Try Again",
          onPress: () => {
            scanLockRef.current = false;
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.closeButton,
          {
            top: insets.top + 14,
          },
        ]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={22} color={colors.white} />
      </TouchableOpacity>

      <View
        style={[
          styles.actionBadge,
          {
            top: insets.top + 70,
          },
        ]}
      >
        <Text style={styles.actionText}>
          {mode === "check-in" ? "Check In" : "Check Out"}
        </Text>
      </View>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
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
        style={[
          styles.overlay,
          {
            bottom: insets.bottom + 40,
          },
        ]}
      >
        <Text style={styles.overlayText}>Scan entrance QR code</Text>
      </View>
    </View>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  loadingText: {
    color: "#fff",
    fontSize: 16,
  },

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
  },

  closeButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  actionBadge: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,.9)",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },

  actionText: {
    fontWeight: "700",
    color: colors.ink,
  },

  overlay: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },

  overlayText: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },

  viewfinderWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  viewfinder: {
    width: FRAME,
    height: FRAME,
  },

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
  },

  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
});
