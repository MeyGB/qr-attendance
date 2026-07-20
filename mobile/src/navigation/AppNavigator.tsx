import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { hasSession, getStoredRole } from "../services/api";
import { colors } from "../theme/theme";

import LoginScreen from "../screens/LoginScreen";
import ScanScreen from "../screens/ScanScreen";
import MainTabs from "./MainTabs";
import AdminTabs from "./AdminTabs";
import EmployeeFormScreen from "../screens/admin/EmployeeFormScreen";
import LeaveFormScreen from "../screens/LeaveFormScreen";
import AdminLeaveApprovalScreen from "../screens/admin/AdminLeaveApprovalScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [initialRoute, setInitialRoute] = useState<
    "Login" | "Main" | "AdminMain"
  >("Login");

  useEffect(() => {
    (async () => {
      const loggedIn = await hasSession();
      if (!loggedIn) {
        setInitialRoute("Login");
      } else {
        const role = await getStoredRole();
        setInitialRoute(role === "admin" ? "AdminMain" : "Main");
      }
      setCheckingSession(false);
    })();
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AdminMain" component={AdminTabs} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
        <Stack.Screen name="LeaveForm" component={LeaveFormScreen} />
        <Stack.Screen
          name="LeaveApproval"
          component={AdminLeaveApprovalScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
