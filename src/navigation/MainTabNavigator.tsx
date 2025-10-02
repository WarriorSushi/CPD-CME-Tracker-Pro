import React, { useRef, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import { MainTabParamList, TabParamList } from '../types/navigation';
import { SvgIcon } from '../components';
import { HapticsUtils } from '../utils/HapticsUtils';
import { useNavigationSounds } from '../hooks/useNavigationSounds';

const { width: screenWidth } = Dimensions.get('window');

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

// Custom slide-in transition for smooth animations
const slideInTransition: StackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
          extrapolate: 'clamp',
        }),
      },
    };
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      },
    },
  },
};

// Modal transition for form screens
const modalTransition: StackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: 'vertical',
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.6],
          extrapolate: 'clamp',
        }),
      },
    };
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // CSS ease-out
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // CSS ease-in
      },
    },
  },
};

// Custom Animated Tab Bar Component
const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Responsive tab calculations
  const effectiveWidth = responsive.isTablet
    ? Math.min(responsive.width, 800) // Max width for tablets
    : responsive.width;
  const tabWidth = effectiveWidth / state.routes.length;
  const indicatorWidth = responsive.isTablet ? 48 : 40; // Larger indicator for tablets
  const indicatorOffset = (tabWidth - indicatorWidth) / 2; // Center the indicator

  useEffect(() => {
    // Animate the blob to the active tab position with blob-like effect
    const toValue = state.index * tabWidth + indicatorOffset;
    
    Animated.parallel([
      // Main translation with overshoot for blob effect
      Animated.spring(translateX, {
        toValue,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Scale animation for blob squish effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Subtle opacity pulse
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, tabWidth, indicatorOffset, translateX, scaleAnim, opacityAnim]);

  // Dynamic styles for responsive tab bar
  const dynamicTabBarStyle = {
    ...styles.tabBar,
    height: (responsive.isTablet ? 80 : 70) + Math.max(insets.bottom, responsive.edgeToEdgeStyles.paddingBottom),
    paddingBottom: Math.max(insets.bottom, responsive.edgeToEdgeStyles.paddingBottom),
    maxWidth: responsive.isTablet ? 800 : '100%',
    alignSelf: 'center' as const,
    width: responsive.isTablet ? Math.min(responsive.width, 800) : '100%',
    marginHorizontal: responsive.isTablet ? 'auto' : 0,
  };

  return (
    <View style={dynamicTabBarStyle}>
      {/* Animated Blob Indicator */}
      <Animated.View
        style={[
          styles.blobIndicator,
          {
            width: indicatorWidth,
            transform: [
              { translateX },
              { scaleX: scaleAnim },
              { scaleY: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      />
      
      {/* Tab Buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;
        
        const isFocused = state.index === index;
        
        const onPress = () => {
          HapticsUtils.light();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        const IconComponent = options.tabBarIcon;
        
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabButton,
              pressed && styles.tabButtonPressed
            ]}
          >
            {({ pressed }) => (
              <Animated.View style={[
                styles.tabContent,
                pressed && { transform: [{ scale: 0.92 }] }
              ]}>
                {IconComponent && (
                  <IconComponent
                    focused={isFocused}
                    color={isFocused ? '#003087' : '#374151'}
                    size={isFocused ? 26 : 20}
                  />
                )}
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? '#003087' : '#374151' }
                ]}>
                  {label}
                </Text>
              </Animated.View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

// Tab Navigator Component
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    paddingTop: 0,
    paddingHorizontal: 0,
    position: 'relative',
  },
  blobIndicator: {
    position: 'absolute',
    top: 4,
    height: 3,
    backgroundColor: '#003087',
    borderRadius: 1.5,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 56, // Accessibility: minimum touch target (standard tab bar height)
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 4,
  },
});

export const MainTabNavigator: React.FC = () => {
  // Enable navigation sounds for main navigation
  useNavigationSounds({ enabled: true });
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...slideInTransition, // Default slide transition for all screens
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ 
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress, // Simple fade for main tabs
            },
          }),
        }}
      />
      <Stack.Screen
        name="AddCME"
        component={AddCMEScreen}
        options={{
          headerShown: false,
          ...modalTransition, // Modal slide-up transition
        }}
      />
      <Stack.Screen
        name="AddLicense"
        component={AddLicenseScreen}
        options={{
          headerShown: false,
          ...modalTransition, // Modal slide-up transition
        }}
      />
      <Stack.Screen
        name="AddReminder"
        component={AddReminderScreen}
        options={{
          headerShown: false,
          ...modalTransition, // Modal slide-up transition
        }}
      />
      <Stack.Screen
        name="CertificateViewer"
        component={CertificateViewerScreen}
        options={{
          headerShown: false,
          ...slideInTransition, // Horizontal slide for viewer
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          headerShown: false,
          ...modalTransition, // Modal slide-up transition
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerShown: false,
          ...slideInTransition, // Horizontal slide for settings
        }}
      />
    </Stack.Navigator>
  );
};

