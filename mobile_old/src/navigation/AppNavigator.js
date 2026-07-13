import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'QR Attendance' }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan QR' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'My Attendance' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
