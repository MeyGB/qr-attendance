import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import type { AdminTabParamList } from "../types";
import { colors } from "../theme/theme";
import { View } from "react-native";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import EmployeeListScreen from "../screens/admin/EmployeeListScreen";
import AdminAttendanceScreen from "@/screens/admin/AdminAttendanceScreen";
import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";

const Tab = createBottomTabNavigator<AdminTabParamList>();

const ICONS: Record<keyof AdminTabParamList, keyof typeof Feather.glyphMap> = {
  Dashboard: "grid",
  Employees: "users",
  Attendance: "calendar",
  Settings: "settings",
};

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        // tabBarActiveBackgroundColor: "#f2f2f2",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 12,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => (
          <View
            style={{
              width: 60,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: focused ? colors.accentSoft : "transparent",
            }}
          >
            <Feather name={ICONS[route.name]} size={size ?? 22} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Employees" component={EmployeeListScreen} />
      <Tab.Screen name="Attendance" component={AdminAttendanceScreen} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
}
