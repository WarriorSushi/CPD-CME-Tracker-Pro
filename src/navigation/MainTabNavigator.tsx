import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import { MainTabParamList } from '../types/navigation';

// Import screens (we'll create these next)
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CMEHistoryScreen } from '../screens/cme/CMEHistoryScreen';
import { CertificateVaultScreen } from '../screens/vault/CertificateVaultScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

// Import icons (we'll use simple text for now, can add icons later)
const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          height: theme.layout.tabBarHeight,
          paddingBottom: theme.spacing[2],
          paddingTop: theme.spacing[2],
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarIconStyle: {
          marginBottom: theme.spacing[1],
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            // For now, we'll use text. Later we can add proper icons
            <React.Fragment />
          ),
        }}
      />
      <Tab.Screen
        name="CME"
        component={CMEHistoryScreen}
        options={{
          tabBarLabel: 'CME History',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment />
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={CertificateVaultScreen}
        options={{
          tabBarLabel: 'Certificates',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment />
          ),
        }}
      />
    </Tab.Navigator>
  );
};