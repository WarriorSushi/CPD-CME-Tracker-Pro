import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { MainTabParamList, TabParamList } from '../types/navigation';

// Import screens and navigators
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CMENavigator } from './CMENavigator';
import { CertificateVaultScreen } from '../screens/vault/CertificateVaultScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AddCMEScreen } from '../screens/cme/AddCMEScreen';
import { AddLicenseScreen } from '../screens/settings/AddLicenseScreen';
import { AddReminderScreen } from '../screens/dashboard/AddReminderScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainTabParamList>();

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 70 + insets.bottom,
          paddingTop: 0,
          paddingBottom: Math.max(insets.bottom, 0),
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 8,
        },
        tabBarActiveTintColor: '#003087',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelPosition: 'below-icon',
        tabBarButton: (props) => <CustomTabButton {...props} />,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CME"
        component={CMENavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>📚</Text>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            console.log('📚 MainTabNavigator: History tab pressed!');
            // Let the CMENavigator handle the initial route logic
          },
        }}
      />
      <Tab.Screen
        name="Vault"
        component={CertificateVaultScreen}
        options={{
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Custom Tab Button Component for pressed column effect
const CustomTabButton: React.FC<{
  children: React.ReactNode;
  onPress?: (event?: any) => void;
  accessibilityState?: { selected?: boolean };
}> = ({ children, onPress, accessibilityState }) => {
  const focused = accessibilityState?.selected;
  
  return (
    <TouchableOpacity
      style={[
        styles.tabColumn,
        focused && styles.tabColumnPressed
      ]}
      onPress={(e) => {
        console.log('🖱️ MainTabNavigator: Tab button pressed');
        onPress?.(e);
      }}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddCME"
        component={AddCMEScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddLicense"
        component={AddLicenseScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddReminder"
        component={AddReminderScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabColumnPressed: {
    backgroundColor: '#F8F9FF',
    borderTopWidth: 3,
    borderTopColor: '#003087',
    shadowColor: '#003087',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 20,
  },
});