import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { MainTabParamList, TabParamList } from '../types/navigation';
import { SvgIcon } from '../components';

// Import screens and navigators
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CMENavigator } from './CMENavigator';
import { CertificateVaultScreen } from '../screens/vault/CertificateVaultScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AddCMEScreen } from '../screens/cme/AddCMEScreen';
import { AddLicenseScreen } from '../screens/settings/AddLicenseScreen';
import { AddReminderScreen } from '../screens/dashboard/AddReminderScreen';
import { CertificateViewerScreen } from '../screens/cme/CertificateViewerScreen';
import { ProfileEditScreen } from '../screens/settings/ProfileEditScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainTabParamList>();

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
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
        tabBarActiveTintColor: '#003087', // Blue color from top bar
        tabBarInactiveTintColor: '#374151', // Charcoal color
        tabBarLabelPosition: 'below-icon',
        tabBarButton: (props) => {
          const { delayLongPress, ...restProps } = props;
          return (
            <TouchableOpacity
              {...restProps}
              style={[props.style, { flex: 1 }]}
              activeOpacity={0.7} // Add press effect for better feedback
              delayLongPress={delayLongPress || undefined}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <SvgIcon 
              name="dashboard" 
              size={focused ? 26 : 20} 
              color={color}
              accessibilityLabel="Dashboard"
            />
          ),
        }}
      />
      <Tab.Screen
        name="CME"
        component={CMENavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <SvgIcon 
              name="history" 
              size={focused ? 26 : 20} 
              color={color}
              accessibilityLabel="History"
            />
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
          tabBarIcon: ({ color, focused }) => (
            <SvgIcon 
              name="vault" 
              size={focused ? 26 : 20} 
              color={color}
              accessibilityLabel="Vault"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <SvgIcon 
              name="settings" 
              size={focused ? 26 : 20} 
              color={color}
              accessibilityLabel="Settings"
            />
          ),
        }}
      />
    </Tab.Navigator>
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
      <Stack.Screen
        name="CertificateViewer"
        component={CertificateViewerScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

