import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          paddingTop: theme.spacing[2],
          paddingBottom: insets.bottom,
          elevation: 8,
          shadowColor: theme.colors.text.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          marginTop: theme.spacing[1],
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarItemStyle: {
          paddingVertical: theme.spacing[1],
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CME"
        component={CMEHistoryScreen}
        options={{
          tabBarLabel: 'CME History',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={CertificateVaultScreen}
        options={{
          tabBarLabel: 'Certificates',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};