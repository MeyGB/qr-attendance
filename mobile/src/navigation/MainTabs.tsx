import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { MainTabParamList, RootStackParamList } from "../types";
import { colors } from "../theme/theme";
import ScanTabButton from "../components/ScanTabButton";
import { View } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import LeaveScreen from "../screens/LeaveScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ScanTabPlaceholder from "../screens/ScanTabPlaceholder";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Partial<
  Record<keyof MainTabParamList, keyof typeof Feather.glyphMap>
> = {
  Home: "home",
  History: "clock",
  Leave: "calendar",
  Profile: "user",
};

export default function MainTabs() {
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 12,
          paddingTop: 4,
          // Let the floating Scan button overflow above the bar's top edge.
          overflow: "visible",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) =>
          ICONS[route.name] ? (
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
              <Feather
                name={ICONS[route.name]}
                size={size ?? 22}
                color={color}
              />
            </View>
          ) : null,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen
        name="ScanTab"
        component={ScanTabPlaceholder}
        options={{
          tabBarButton: () => (
            <ScanTabButton onPress={() => rootNavigation.navigate("Scan")} />
          ),
        }}
      />
      <Tab.Screen name="Leave" component={LeaveScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
