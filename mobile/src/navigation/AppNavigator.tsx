import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InfrastructureScreen } from '../screens/InfrastructureScreen';
import { EC2DetailScreen } from '../screens/EC2DetailScreen';
import { AlarmsScreen } from '../screens/AlarmsScreen';
import { AlarmDetailScreen } from '../screens/AlarmDetailScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { ConnectAccountScreen } from '../screens/ConnectAccountScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceDark,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarActiveTintColor: colors.awsOrange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600'
        }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Infrastructure"
        component={InfrastructureScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="server-outline" size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size - 2} color={color} />
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size - 2} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgDark } }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="EC2Detail" component={EC2DetailScreen} />
          <Stack.Screen name="AlarmDetail" component={AlarmDetailScreen} />
          <Stack.Screen name="ConnectAccount" component={ConnectAccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

