import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LoadingSpinner, SvgIcon, StandardHeader, LoadingState, ErrorBoundary, Button } from '../../components';
import { AnimatedGradientBackground } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { NotificationService } from '../../services/notifications';
import { useSound } from '../../hooks/useSound';

// Import extracted components
import { ProgressCard } from '../../components/dashboard/ProgressCard';
import { LicensesSection } from '../../components/dashboard/LicensesSection';
import { RecentEntriesSection } from '../../components/dashboard/RecentEntriesSection';
import { EventRemindersSection } from '../../components/dashboard/EventRemindersSection';
import { UrgentLicenseWarnings } from '../../components/dashboard/UrgentLicenseWarnings';
import { NoLicensesPlaceholder } from '../../components/dashboard/NoLicensesPlaceholder';

// Import helper functions
import { getGreeting, getUrgentLicenseRenewals, getUpcomingRenewals } from '../../utils/dashboardHelpers';

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const { playButtonTap, playSuccess, playError, playRefresh } = useSound();
  const {
    user,
    currentYearProgress,
    recentCMEEntries,
    totalCredits,
    licenses,
    eventReminders,
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingLicenses,
    isLoadingReminders,
    error,
    refreshAllData,
    clearError,
  } = useAppContext();

  const [refreshing, setRefreshing] = React.useState(false);
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_DEBOUNCE_MS = 5000;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressCardAnim = useRef(new Animated.Value(0)).current;
  const remindersCardAnim = useRef(new Animated.Value(0)).current;
  const recentCardAnim = useRef(new Animated.Value(0)).current;
  const licensesCardAnim = useRef(new Animated.Value(0)).current;

  // Shadow animations
  const progressShadowAnim = useRef(new Animated.Value(0)).current;
  const remindersShadowAnim = useRef(new Animated.Value(0)).current;
  const recentShadowAnim = useRef(new Animated.Value(0)).current;
  const licensesShadowAnim = useRef(new Animated.Value(0)).current;

  // Progress section animated gradient values
  const progressGradient1 = useRef(new Animated.Value(0)).current;
  const progressGradient2 = useRef(new Animated.Value(0)).current;
  const progressGradient3 = useRef(new Animated.Value(0)).current;

  // Debounced refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
        lastRefreshRef.current = now;
        refreshAllData();
      }
    }, [refreshAllData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await playRefresh();
    await refreshAllData();
    setRefreshing(false);
  }, [refreshAllData, playRefresh]);

  // Premium entrance animations
  useEffect(() => {
    if (!isInitializing && user) {
      // Stage 1: Cards appear without shadows
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Stage 2: Staggered card animations
      Animated.sequence([
        Animated.delay(200),
        Animated.stagger(150, [
          Animated.spring(progressCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(remindersCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(recentCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(licensesCardAnim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Stage 3: Add shadows after cards finish
        setTimeout(() => {
          progressShadowAnim.setValue(1);
          remindersShadowAnim.setValue(1);
          recentShadowAnim.setValue(1);
          licensesShadowAnim.setValue(1);
        }, 100);
      });
    }
  }, [isInitializing, user]);

  // Progress section animated gradient loop - stop when screen not visible to save battery
  useFocusEffect(
    useCallback(() => {
      // Start animations when screen is focused
      const animationLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(progressGradient1, {
              toValue: 1,
              duration: 6000,
              useNativeDriver: true,
            }),
            Animated.timing(progressGradient1, {
              toValue: 0,
              duration: 6000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(progressGradient2, {
              toValue: 1,
              duration: 8000,
              delay: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(progressGradient2, {
              toValue: 0,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(progressGradient3, {
              toValue: 1,
              duration: 10000,
              delay: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(progressGradient3, {
              toValue: 0,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animationLoop.start();

      // Stop animations when screen loses focus (cleanup function)
      return () => {
        animationLoop.stop();
      };
    }, [progressGradient1, progressGradient2, progressGradient3])
  );

  // Handle setting license reminders
  const handleSetLicenseReminders = async (license: any) => {
    try {
      const hasPermissions = await NotificationService.ensurePermissions();

      if (!hasPermissions) {
        Alert.alert(
          'Notifications Required',
          'Please enable notifications in Settings to receive license renewal reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => (navigation.getParent() as any).navigate('NotificationSettings')
            }
          ]
        );
        return;
      }

      const currentSettings = await NotificationService.getSettings();
      const updatedSettings = {
        ...currentSettings,
        enabled: true,
        licenseReminders: {
          enabled: true,
          intervals: [90, 60, 30, 14, 7, 1]
        }
      };

      await NotificationService.updateSettings(updatedSettings);

      await NotificationService.refreshAllNotifications(
        user || undefined,
        licenses,
        eventReminders,
        totalCredits
      );

      await playSuccess();
      Alert.alert(
        'Reminders Set!',
        `You'll receive notifications for ${license.licenseType} renewal:\n\n- 90 days before\n- 60 days before\n- 30 days before\n- 14 days before\n- 7 days before\n- 1 day before\n\nYou can customize these in Settings > Notifications.`,
        [{ text: 'Got it!', style: 'default' }]
      );

    } catch (error) {
      __DEV__ && console.error('Error setting license reminders:', error);
      await playError();
      Alert.alert(
        'Error',
        'Failed to set license reminders. Please try again or check Settings > Notifications.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Computed values
  const recentEntries = recentCMEEntries.slice(0, 2);
  const upcomingRenewals = getUpcomingRenewals(licenses).slice(0, 2);
  const urgentRenewals = getUrgentLicenseRenewals(licenses);

  // Loading state
  if (isInitializing || isLoadingUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingSpinner size={40} />
        <Text style={styles.loadingText}>
          {isInitializing ? 'Initializing app...' : 'Loading your data...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SvgIcon name="warning" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <Button
          title="Retry"
          onPress={() => {
            clearError();
            refreshAllData();
          }}
          style={styles.retryButton}
        />
      </View>
    );
  }

  // Dynamic styles based on responsive layout
  const dynamicStyles = {
    container: {
      ...styles.container,
      // Don't add paddingTop - StandardHeader handles safe area insets
      // AnimatedGradientBackground needs to extend into status bar area
    },
    upperSection: {
      ...styles.upperSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: (responsive.isTablet ? 800 : '100%') as any,
      alignSelf: 'center' as const,
      width: '100%',
    },
    sectionContainer: {
      ...styles.sectionContainer,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: (responsive.isTablet ? 800 : '100%') as any,
      alignSelf: 'center' as const,
      width: '100%',
    },
    recentSection: {
      ...styles.recentSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: (responsive.isTablet ? 800 : '100%') as any,
      alignSelf: 'center' as const,
      width: '100%',
    },
    noLicensesSection: {
      ...styles.noLicensesSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: (responsive.isTablet ? 800 : '100%') as any,
      alignSelf: 'center' as const,
      width: '100%',
    },
  };

  return (
    <ErrorBoundary>
      <View style={dynamicStyles.container as any}>
        <AnimatedGradientBackground />

        <StandardHeader
          title={`${getGreeting()}, ${user?.profileName || user?.profession || 'Professional'}`}
          showBackButton={false}
        />

        <LoadingState
          loading={isInitializing}
          error={error}
          retry={refreshAllData}
          loadingText="Loading your CME data..."
          skeleton={true}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Progress Card */}
            <Animated.View
              style={[
                dynamicStyles.upperSection as any,
                {
                  opacity: progressCardAnim,
                  transform: [{
                    translateY: progressCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <ProgressCard
                currentYearProgress={currentYearProgress}
                user={user}
                progressGradient1={progressGradient1}
                progressGradient2={progressGradient2}
                progressGradient3={progressGradient3}
                progressShadowAnim={progressShadowAnim}
                onAddEntry={async () => {
                  await playButtonTap();
                  (navigation.getParent() as any).navigate('AddCME', { editEntry: undefined });
                }}
              />
            </Animated.View>

            {/* Urgent License Warnings */}
            {urgentRenewals.length > 0 && (
              <Animated.View
                style={[
                  dynamicStyles.sectionContainer as any,
                  {
                    opacity: remindersCardAnim,
                    transform: [{
                      translateY: remindersCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <UrgentLicenseWarnings
                  urgentRenewals={urgentRenewals}
                  remindersCardAnim={remindersShadowAnim}
                  remindersShadowAnim={remindersShadowAnim}
                  onRenewLicense={(license: any) =>
                    (navigation.getParent() as any).navigate('AddLicense', { editLicense: license })
                  }
                  onViewAll={() => navigation.navigate('Settings')}
                />
              </Animated.View>
            )}

            {/* Dividing Line */}
            <View style={styles.dividerLine} />

            {/* Event Reminders Section */}
            <Animated.View
              style={[
                dynamicStyles.sectionContainer as any,
                {
                  opacity: remindersCardAnim,
                  transform: [{
                    translateY: remindersCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <EventRemindersSection
                eventReminders={eventReminders}
                remindersCardAnim={remindersCardAnim}
                remindersShadowAnim={remindersShadowAnim}
                onAddReminder={() => (navigation as any).navigate('AddReminder')}
              />
            </Animated.View>

            {/* License Management Section */}
            {licenses && licenses.length > 0 && (
              <Animated.View
                style={[
                  dynamicStyles.sectionContainer as any,
                  {
                    opacity: licensesCardAnim,
                    transform: [{
                      translateY: licensesCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <LicensesSection
                  licenses={licenses}
                  user={user}
                  licensesCardAnim={licensesCardAnim}
                  licensesShadowAnim={licensesShadowAnim}
                  onAddLicense={() => (navigation.getParent() as any).navigate('AddLicense')}
                  onEditLicense={(license) =>
                    (navigation.getParent() as any).navigate('AddLicense', { editLicense: license })
                  }
                  onSetReminders={handleSetLicenseReminders}
                />
              </Animated.View>
            )}

            {/* No Licenses Placeholder */}
            {(!licenses || licenses.length === 0) && (
              <Animated.View
                style={[
                  dynamicStyles.noLicensesSection as any,
                  {
                    opacity: licensesCardAnim,
                    transform: [{
                      translateY: licensesCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <NoLicensesPlaceholder
                  licensesCardAnim={licensesCardAnim}
                  licensesShadowAnim={licensesShadowAnim}
                  onAddLicense={() => (navigation.getParent() as any).navigate('AddLicense')}
                />
              </Animated.View>
            )}

            {/* Recent Activity */}
            {recentEntries.length > 0 && (
              <Animated.View
                style={[
                  dynamicStyles.recentSection as any,
                  {
                    opacity: recentCardAnim,
                    transform: [{
                      translateY: recentCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <RecentEntriesSection
                  recentEntries={recentEntries}
                  user={user}
                  recentCardAnim={recentCardAnim}
                  recentShadowAnim={recentShadowAnim}
                  onViewAll={() => navigation.navigate('CME')}
                  onViewCertificate={(imageUri) =>
                    (navigation.getParent() as any).navigate('CertificateViewer', { imageUri })
                  }
                />
              </Animated.View>
            )}

            {/* Bottom spacer for tab bar */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </LoadingState>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  upperSection: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[6],
    position: 'relative',
    overflow: 'hidden',
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing[2],
  },
  recentSection: {
    paddingHorizontal: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing[3],
  },
  noLicensesSection: {
    paddingHorizontal: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: 'transparent',
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.colors.gray[600],
    marginHorizontal: 0,
    marginBottom: theme.spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bottomSpacer: {
    height: 100,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
  },
  retryButton: {
    minWidth: 120,
  },
});
