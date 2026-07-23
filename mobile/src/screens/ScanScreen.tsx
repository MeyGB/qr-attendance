import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
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

interface ScanSuccess {
  mode: ScanMode;
  message: string;
  time: string;
}

export default function ScanScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<ScanMode>(route.params?.mode ?? "check-in");
  const [torchOn, setTorchOn] = useState(false);
  const [success, setSuccess] = useState<ScanSuccess | null>(null);
  const insets = useSafeAreaInsets();
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  // A ref (not state) blocks duplicate scans immediately. The camera can fire
  // several detections for the same code within milliseconds — faster than
  // React can re-render to disable the callback via state alone.
  const scanLockRef = useRef(false);

  // The Scan screen is the final authority on which mode should be
  // selected — it always asks the server directly rather than trusting
  // whatever mode a calling screen (Home, Admin Dashboard, etc.) passed in.
  // This guarantees correctness even if a caller's own status logic is
  // stale or wrong, since there's only one source of truth: the server.
  useEffect(() => {
    let cancelled = false;

    api
      .getToday()
      .then((record) => {
        console.log("record", record);

        if (cancelled) return;

        if (record?.check_in_time && !record.check_out_time) {
          setMode("check-out");
        } else if (!record?.check_in_time) {
          setMode("check-in");
        }
      })
      .catch(() => {
        // Ignore error
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scan line animation — loops up and down inside the viewfinder frame.
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanned) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanned, scanLineAnim]);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, FRAME - 8],
  });

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
      setSuccess({
        mode,
        message: result.message,
        time: result.time,
      });
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

  // Success screen replaces the camera entirely once a scan goes through.
  if (success) {
    return (
      <View
        style={[
          styles.successContainer,
          { paddingTop: insets.top + spacing.xl },
        ]}
      >
        <View style={styles.successIconWrap}>
          <Feather name="check" size={48} color={colors.white} />
        </View>
        <Text style={styles.successHeading}>
          {success.mode === "check-in" ? "Checked In!" : "Checked Out!"}
        </Text>
        <Text style={styles.successMessage}>{success.message}</Text>
        <Text style={styles.successTime}>{success.time}</Text>

        <View style={styles.successButtonWrap}>
          <Button label="Done" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 14 }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={22} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.flashButton,
          { top: insets.top + 14 },
          torchOn && styles.flashButtonActive,
        ]}
        onPress={() => setTorchOn((v) => !v)}
      >
        <Feather
          name={torchOn ? "zap" : "zap-off"}
          size={20}
          color={colors.white}
        />
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
        enableTorch={torchOn}
      />

      <View style={styles.viewfinderWrap} pointerEvents="none">
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {!scanned && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslateY }] },
              ]}
            />
          )}
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
  flashButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashButtonActive: { backgroundColor: colors.accent },
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
  viewfinder: { width: FRAME, height: FRAME, overflow: "hidden" },
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

  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  successTime: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accentDeep,
    marginBottom: spacing.xxl,
  },
  successButtonWrap: {
    width: "100%",
    position: "absolute",
    bottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
