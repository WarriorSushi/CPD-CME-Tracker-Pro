import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Card, Button, LoadingSpinner, SvgIcon, StandardHeader, LoadingState, ErrorBoundary } from '../../components';
import { SimpleProgressRing } from '../../components/charts/SimpleProgressRing';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../onboarding/OnboardingComponents';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { getCreditUnit } from '../../utils/creditTerminology';
import { NotificationService } from '../../services/notifications';
import { useSound } from '../../hooks/useSound';

const { width, height } = Dimensions.get('window');

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
  const REFRESH_DEBOUNCE_MS = 5000; // Only refresh if last refresh was more than 5 seconds ago

  // Premium animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressCardAnim = useRef(new Animated.Value(0)).current;
  const remindersCardAnim = useRef(new Animated.Value(0)).current;
  const recentCardAnim = useRef(new Animated.Value(0)).current;
  const licensesCardAnim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations (to prevent gray flash)
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
        // Stage 3: Add shadows after cards finish (using separate timing to avoid conflicts)
        setTimeout(() => {
          progressShadowAnim.setValue(1);
          remindersShadowAnim.setValue(1);
          recentShadowAnim.setValue(1);
          licensesShadowAnim.setValue(1);
        }, 100);
      });
    }
  }, [isInitializing, user]);
  
  // Progress section animated gradient loop
  useEffect(() => {
    // Create continuous flowing gradient animations for progress section
    Animated.loop(
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
    ).start();
  }, []);

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'on_track':
        return theme.colors.primary;
      case 'behind':
        return theme.colors.warning;
      case 'overdue':
        return theme.colors.error;
      default:
        return theme.colors.gray.medium;
    }
  };

  const getStatusIcon = (status: string, color = theme.colors.success) => {
    switch (status) {
      case 'completed':
        return <SvgIcon name="checkmark" size={16} color={color} />;
      case 'on_track':
        return <SvgIcon name="checkmark" size={16} color={color} />;
      case 'behind':
        return <Text style={{ fontSize: 16 }}>⚠️</Text>;
      case 'overdue':
        return <Text style={{ fontSize: 16 }}>🚨</Text>;
      default:
        return <Text style={{ fontSize: 16 }}>🎯</Text>;
    }
  };

  const getUpcomingRenewals = () => {
    if (!licenses || licenses.length === 0) return [];

    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    return licenses.filter(license => {
      const expirationDate = new Date(license.expirationDate);
      return expirationDate <= threeMonthsFromNow && expirationDate >= today;
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  // Handle setting license reminders
  const handleSetLicenseReminders = async (license: any) => {
    try {
      // First check if notifications are enabled and request permissions
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

      // Enable license reminders with default intervals
      const currentSettings = await NotificationService.getSettings();
      const updatedSettings = {
        ...currentSettings,
        enabled: true,
        licenseReminders: {
          enabled: true,
          intervals: [90, 60, 30, 14, 7, 1] // Default recommended intervals
        }
      };

      await NotificationService.updateSettings(updatedSettings);

      // Refresh all notifications to include this license
      await NotificationService.refreshAllNotifications(
        user || undefined,
        licenses,
        eventReminders,
        totalCredits
      );

      await playSuccess();
      Alert.alert(
        'Reminders Set! 🔔',
        `You'll receive notifications for ${license.licenseType} renewal:\n\n• 90 days before\n• 60 days before\n• 30 days before\n• 14 days before\n• 7 days before\n• 1 day before\n\nYou can customize these in Settings > Notifications.`,
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

  const recentEntries = recentCMEEntries.slice(0, 2);
  const upcomingRenewals = getUpcomingRenewals().slice(0, 2);

  // Get urgent license renewals (expiring within 60 days)
  const getUrgentLicenseRenewals = () => {
    if (!licenses || licenses.length === 0) return [];

    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    return licenses.filter(license => {
      const expirationDate = new Date(license.expirationDate);
      return expirationDate <= sixtyDaysFromNow && expirationDate >= today;
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  const urgentRenewals = getUrgentLicenseRenewals();

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
  
  // Show error state if there's an error
  if (error && !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Progress Section Animated Background Component
  const ProgressAnimatedBackground = () => {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base gradient - modern neutral theme for progress */}
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surface, theme.colors.accent]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Animated gradient orbs */}
        <Animated.View
          style={[
            styles.progressGradientOrb1,
            {
              transform: [
                {
                  translateX: progressGradient1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 120],
                  }),
                },
                {
                  translateY: progressGradient1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 40],
                  }),
                },
                {
                  scale: progressGradient1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.3, 1],
                  }),
                },
              ],
              opacity: 0.6,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.purple + '20', theme.colors.blue + '10']}
            style={styles.progressOrb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.progressGradientOrb2,
            {
              transform: [
                {
                  translateX: progressGradient2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, -80],
                  }),
                },
                {
                  translateY: progressGradient2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, -60],
                  }),
                },
                {
                  scale: progressGradient2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                },
              ],
              opacity: 0.5,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.blue + '18', theme.colors.purple + '08']}
            style={styles.progressOrb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.progressGradientOrb3,
            {
              transform: [
                {
                  translateX: progressGradient3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-60, 100],
                  }),
                },
                {
                  translateY: progressGradient3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, -40],
                  }),
                },
                {
                  scale: progressGradient3.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.15, 1],
                  }),
                },
              ],
              opacity: 0.4,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.purple + '15', theme.colors.emerald + '08']}
            style={styles.progressOrb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>
    );
  };

  // Dynamic styles based on responsive layout
  const dynamicStyles = {
    container: {
      ...styles.container,
      paddingTop: responsive.edgeToEdgeStyles.paddingTop,
    },
    upperSection: {
      ...styles.upperSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: responsive.isTablet ? 800 : '100%',
      alignSelf: 'center' as const,
      width: '100%',
    },
    progressCard: {
      ...styles.progressCard,
      padding: responsive.isTablet ? theme.spacing[6] : theme.spacing[5],
    },
    sectionContainer: {
      ...styles.sectionContainer,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: responsive.isTablet ? 800 : '100%',
      alignSelf: 'center' as const,
      width: '100%',
    },
    recentSection: {
      ...styles.recentSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: responsive.isTablet ? 800 : '100%',
      alignSelf: 'center' as const,
      width: '100%',
    },
    noLicensesSection: {
      ...styles.noLicensesSection,
      paddingHorizontal: responsive.isTablet ? theme.spacing[8] : theme.spacing[5],
      maxWidth: responsive.isTablet ? 800 : '100%',
      alignSelf: 'center' as const,
      width: '100%',
    },
  };

  return (
    <ErrorBoundary>
      <View style={dynamicStyles.container}>
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
        {/* Upper Section - Premium Progress Card */}
        <Animated.View
          style={[
            dynamicStyles.upperSection,
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
          <ProgressAnimatedBackground />
          <PremiumCard style={[
            dynamicStyles.progressCard,
            {
              elevation: progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
              shadowOpacity: progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
            }
          ]}>
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleContainer}>
                <Text style={styles.progressMainTitle}>Your Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {user?.requirementPeriod && user.requirementPeriod > 1 
                    ? `${user.requirementPeriod}-Year Cycle` 
                    : 'Annual Goal'
                  }
                </Text>
              </View>
            </View>

          <View style={styles.progressMainContent}>
            {/* Days remaining moved to left of circle */}
            <View style={styles.progressTimeInfoLeft}>
              <Text style={styles.progressTimeValue}>
                {currentYearProgress?.remainingDays || 0}
              </Text>
              <Text style={styles.progressTimeLabel}>
                days remaining in cycle
              </Text>
            </View>
            
            <View style={styles.progressCircleContainer}>
              <SimpleProgressRing 
                progress={currentYearProgress ? currentYearProgress.percentage / 100 : 0} 
                size={140}
                color={currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium}
                backgroundColor={theme.colors.gray.light + '60'}
                strokeWidth={10}
                duration={2000}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>
                  {currentYearProgress?.totalCompleted?.toFixed(1) || '0'}
                </Text>
                <Text style={styles.progressStatLabel}>{user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'} Earned</Text>
              </View>
              
              <View style={styles.progressStatDivider} />
              
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>
                  {currentYearProgress?.totalRequired || user?.annualRequirement || 0}
                </Text>
                <Text style={styles.progressStatLabel}>Goal
                </Text>
              </View>
              
              <View style={styles.progressStatDivider} />
              
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>
                  {Math.max(
                    (currentYearProgress?.totalRequired || 0) - (currentYearProgress?.totalCompleted || 0), 
                    0
                  ).toFixed(1)}
                </Text>
                <Text style={styles.progressStatLabel}>Remaining</Text>
              </View>
            </View>
          </View>

            {/* Premium Add Entry Button */}
            <View style={styles.addEntryInUpperSection}>
              <PremiumButton
                title="+ Add New Entry"
                onPress={async () => {
                  await playButtonTap();
                  (navigation.getParent() as any).navigate('AddCME', { editEntry: undefined });
                }}
                variant="primary"
                style={styles.addEntryButton}
              />
            </View>
          </PremiumCard>
        </Animated.View>

        {/* Urgent License Renewal Warnings */}
        {urgentRenewals.length > 0 && (
          <Animated.View
            style={[
              dynamicStyles.sectionContainer,
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
            <PremiumCard style={[
              styles.urgentWarningCard,
              {
                elevation: remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
                shadowOpacity: remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
              }
            ]}>
              <View style={styles.urgentWarningHeader}>
                <View style={styles.urgentWarningIcon}>
                  <Text style={styles.urgentWarningEmoji}>⚠️</Text>
                </View>
                <View style={styles.urgentWarningTitleContainer}>
                  <Text style={styles.urgentWarningTitle}>License Renewal Required</Text>
                  <Text style={styles.urgentWarningSubtitle}>
                    {urgentRenewals.length} license{urgentRenewals.length > 1 ? 's' : ''} expiring soon
                  </Text>
                </View>
              </View>

              {urgentRenewals.slice(0, 2).map((license) => {
                const daysUntil = Math.ceil((new Date(license.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                let urgencyColor = theme.colors.error;
                let urgencyText = 'Overdue';

                if (daysUntil < 0) {
                  urgencyColor = theme.colors.error;
                  urgencyText = 'Expired';
                } else if (daysUntil <= 7) {
                  urgencyColor = theme.colors.error;
                  urgencyText = `${daysUntil} days left`;
                } else if (daysUntil <= 30) {
                  urgencyColor = theme.colors.warning;
                  urgencyText = `${daysUntil} days left`;
                } else {
                  urgencyColor = theme.colors.primary;
                  urgencyText = `${daysUntil} days left`;
                }

                return (
                  <View key={license.id} style={styles.urgentLicenseItem}>
                    <View style={styles.urgentLicenseInfo}>
                      <Text style={styles.urgentLicenseType} numberOfLines={1}>
                        {license.licenseType}
                      </Text>
                      <Text style={styles.urgentLicenseAuthority} numberOfLines={1}>
                        {license.issuingAuthority}
                      </Text>
                      <Text style={styles.urgentLicenseExpiry}>
                        Expires: {new Date(license.expirationDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.urgentLicenseActions}>
                      <View style={[styles.urgentLicenseStatus, { backgroundColor: urgencyColor }]}>
                        <Text style={styles.urgentLicenseStatusText}>{urgencyText}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.urgentLicenseButton}
                        onPress={() => (navigation.getParent() as any).navigate('AddLicense', { editLicense: license })}
                      >
                        <Text style={styles.urgentLicenseButtonText}>Renew</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {urgentRenewals.length > 2 && (
                <TouchableOpacity
                  style={styles.viewAllUrgentButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Text style={styles.viewAllUrgentText}>
                    View all {urgentRenewals.length} expiring licenses
                  </Text>
                </TouchableOpacity>
              )}
            </PremiumCard>
          </Animated.View>
        )}

        {/* Dividing Line */}
        <View style={styles.dividerLine} />

        {/* CME Event Reminders Section */}
        <Animated.View
          style={[
            dynamicStyles.sectionContainer,
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
          <PremiumCard style={[
            styles.sectionCard,
            {
              elevation: remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
              shadowOpacity: remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
            }
          ]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Event Reminders</Text>
            <PremiumButton
              title="+ Add Reminder"
              onPress={() => (navigation as any).navigate('AddReminder')}
              variant="secondary"
              style={styles.headerButton}
            />
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.sectionSubtitle}>
              Set reminders for upcoming CME events, conferences, and workshops so you never miss important learning opportunities.
            </Text>
          
          {/* Reminders List or Placeholder */}
          {eventReminders && eventReminders.length > 0 ? (
            <View style={styles.remindersList}>
              {eventReminders.map((reminder) => {
                const eventDate = new Date(reminder.eventDate);
                const today = new Date();
                const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                let statusColor = theme.colors.primary;
                let statusText = 'Upcoming';
                let statusIcon = '📅';

                if (daysUntil < 0) {
                  statusColor = theme.colors.gray.medium;
                  statusText = 'Past';
                  statusIcon = '📋';
                } else if (daysUntil === 0) {
                  statusColor = theme.colors.error;
                  statusText = 'Today';
                  statusIcon = '🔥';
                } else if (daysUntil <= 7) {
                  statusColor = theme.colors.warning;
                  statusText = `${daysUntil} days`;
                  statusIcon = '⏰';
                } else {
                  statusText = `${daysUntil} days`;
                }

                return (
                  <PremiumCard key={reminder.id} style={styles.reminderCard}>
                    <View style={styles.reminderCardHeader}>
                      <View style={styles.reminderCardMain}>
                        <View style={[styles.reminderIcon, { backgroundColor: statusColor + '20' }]}>
                          <Text style={styles.reminderIconText}>{statusIcon}</Text>
                        </View>
                        <View style={styles.reminderInfo}>
                          <Text style={styles.reminderCardTitle} numberOfLines={1}>
                            {reminder.eventName}
                          </Text>
                          <Text style={styles.reminderCardDate}>
                            {eventDate.toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={[styles.reminderStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.reminderStatusText}>{statusText}</Text>
                      </View>
                    </View>
                  </PremiumCard>
                );
              })}
            </View>
          ) : (
            <PremiumCard style={styles.remindersPlaceholder}>
              <View style={styles.remindersPlaceholderContent}>
                <SvgIcon 
                  name="reminder" 
                  size={40} 
                  color={theme.colors.text.secondary}
                  accessibilityLabel="No reminders"
                />
                <Text style={styles.remindersPlaceholderTitle}>No Reminders Set</Text>
                <Text style={styles.remindersPlaceholderSubtitle}>
                  Tap the + button above to add reminders for upcoming CME events
                </Text>
              </View>
            </PremiumCard>
          )}
          
          </View>
          </PremiumCard>
        </Animated.View>

        {/* License Management Section */}
        {licenses && licenses.length > 0 && (
          <Animated.View
            style={[
              dynamicStyles.sectionContainer,
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
            <PremiumCard style={[
              styles.sectionCard,
              {
                elevation: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Your Licenses</Text>
              <PremiumButton
                title="+ Add License"
                onPress={() => (navigation.getParent() as any).navigate('AddLicense')}
                variant="secondary"
                style={styles.headerButton}
              />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.sectionSubtitle}>
                View and manage all your professional licenses here. Tap Edit to update expiration dates after renewal.
              </Text>
            
            {/* Removed confusing status summary - user requested complete removal */}
            
            {/* All License Cards - Show all licenses */}
            {(() => {
              // Helper function to calculate days between dates
              const calculateDaysUntil = (expirationDateString: string): number => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const expDate = new Date(expirationDateString);
                if (isNaN(expDate.getTime())) {
      __DEV__ && console.error('🚨 Invalid date string:', expirationDateString);
                  return 0;
                }
                expDate.setHours(0, 0, 0, 0);
                
                const msPerDay = 1000 * 60 * 60 * 24;
                const diffMs = expDate.getTime() - today.getTime();
                return Math.ceil(diffMs / msPerDay);
              };
              
              // Show ALL licenses, sorted by expiration date (most urgent first)
              const allLicenses = licenses
                .map(license => {
                  const daysUntil = calculateDaysUntil(license.expirationDate);
                  return { ...license, daysUntil };
                })
                .sort((a, b) => a.daysUntil - b.daysUntil);

              return allLicenses.map((license) => {
                const { daysUntil } = license;
                let statusColor = theme.colors.success;
                let statusText = 'Active';
                let statusIcon = <SvgIcon name="tickWithCircle" size={20} />;

                if (daysUntil < 0) {
                  statusColor = theme.colors.error;
                  statusText = 'Expired';
                  statusIcon = <Text style={{ fontSize: 16 }}>🚨</Text>;
                } else if (daysUntil <= 30) {
                  statusColor = theme.colors.error;
                  statusText = `${daysUntil} days left`;
                  statusIcon = <Text style={{ fontSize: 16 }}>⚠️</Text>;
                } else if (daysUntil <= 90) {
                  statusColor = theme.colors.warning;
                  statusText = `${daysUntil} days left`;
                  statusIcon = <Text style={{ fontSize: 16 }}>⏰</Text>;
                } else {
                  statusText = `${daysUntil} days left`;
                }

                return (
                  <PremiumCard key={license.id} style={styles.licenseCard}>
                    <View style={styles.licenseCardHeader}>
                      <View style={styles.licenseCardMain}>
                        {typeof statusIcon === 'string' ? (
                          <Text style={styles.licenseIconText}>{statusIcon}</Text>
                        ) : (
                          statusIcon
                        )}
                        <View style={styles.licenseInfo}>
                          <Text style={styles.licenseCardTitle} numberOfLines={1}>
                            {license.licenseType}
                          </Text>
                          <Text style={styles.licenseCardAuthority} numberOfLines={1}>
                            {license.issuingAuthority}
                          </Text>
                          <Text style={styles.licenseCardExpiry}>
                            Expires: {new Date(license.expirationDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={[styles.licenseStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.licenseStatusText}>{statusText}</Text>
                      </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.licenseCardActions}>
                      <TouchableOpacity 
                        style={styles.licenseActionButton}
                        onPress={() => {
                          // Navigate directly to AddLicense screen with edit data
                          (navigation as any).navigate('AddLicense', { editLicense: license });
                        }}
                      >
                        <View style={styles.licenseActionContent}>
                          <SvgIcon name="edit" size={14} color={theme.colors.text.primary} />
                          <Text style={styles.licenseActionText}>Edit</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.licenseActionButton}
                        onPress={() => {
                          Alert.alert(
                            'Set Reminder',
                            `Would you like to set renewal reminders for ${license.licenseType}?\n\nRecommended reminder schedule:\n• 90 days before\n• 60 days before\n• 30 days before\n• 14 days before\n• 7 days before\n• 1 day before`,
                            [
                              { text: 'Later', style: 'cancel' },
                              {
                                text: 'Set Reminders',
                                onPress: () => handleSetLicenseReminders(license)
                              }
                            ]
                          );
                        }}
                      >
                        <View style={styles.licenseActionContent}>
                          <SvgIcon name="reminder" size={14} color={theme.colors.text.primary} />
                          <Text style={styles.licenseActionText}>Remind</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Progress indicator if credits are tracked */}
                    {license.requiredCredits > 0 && (
                      <View style={styles.licenseProgress}>
                        <Text style={styles.licenseProgressText}>
                          Credits: {license.completedCredits}/{license.requiredCredits} {user?.creditSystem ? getCreditUnit(user.creditSystem) : ''}
                        </Text>
                        <View style={styles.licenseProgressBar}>
                          <View 
                            style={[
                              styles.licenseProgressFill,
                              { 
                                width: `${Math.min((license.completedCredits / license.requiredCredits) * 100, 100)}%`,
                                backgroundColor: license.completedCredits >= license.requiredCredits ? theme.colors.success : theme.colors.primary
                              }
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Renewal Instructions */}
                    <View style={styles.licenseRenewalInstructions}>
                      <Text style={styles.renewalInstructionsText}>
                        💡 Already renewed? Tap "Edit" and update the expiration date.
                      </Text>
                    </View>
                  </PremiumCard>
                );
              });
            })()}
            
            </View>
            </PremiumCard>
          </Animated.View>
        )}

        {/* Show Add License Prompt if no licenses */}
        {(!licenses || licenses.length === 0) && (
          <Animated.View
            style={[
              dynamicStyles.noLicensesSection,
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
            <PremiumCard style={[
              styles.noLicensesCard,
              {
                elevation: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
              <View style={styles.noLicensesContent}>
                <SvgIcon 
                  name="profile" 
                  size={48} 
                  color={theme.colors.text.secondary}
                  accessibilityLabel="No licenses"
                />
                <Text style={styles.noLicensesTitle}>Track Your Licenses</Text>
                <Text style={styles.noLicensesSubtitle}>
                  Add your professional licenses to track renewal deadlines and never miss a renewal date.
                </Text>
                <PremiumButton
                  title="Add Your First License"
                  onPress={() => (navigation.getParent() as any).navigate('AddLicense')}
                  variant="primary"
                  style={styles.addEntryButton}
                />
              </View>
            </PremiumCard>
          </Animated.View>
        )}

        {/* Recent Activity */}
        {recentEntries.length > 0 && (
          <Animated.View
            style={[
              dynamicStyles.recentSection,
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CME')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentEntries.map((entry, index) => (
              <PremiumCard 
                key={entry.id}
                style={[
                  styles.activityItem,
                  {
                    elevation: recentShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }),
                    shadowOpacity: recentShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }),
                  }
                ]}
              >
                <View style={styles.activityContent}>
                  <TouchableOpacity 
                    style={styles.activityIcon}
                    onPress={() => {
                      if (entry.certificatePath) {

                        (navigation.getParent() as any).navigate('CertificateViewer', { imageUri: entry.certificatePath });
                      }
                    }}
                    disabled={!entry.certificatePath}
                  >
                    {entry.certificatePath ? (
                      <Image 
                        source={{ uri: entry.certificatePath }}
                        style={styles.certificateThumbnailDashboard}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.activityEmoji}>📖</Text>
                    )}
                  </TouchableOpacity>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text style={styles.activityProvider} numberOfLines={1}>
                      {entry.provider}
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(entry.dateAttended).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.activityCredits}>
                    <Text style={styles.creditsValue}>{entry.creditsEarned}</Text>
                    <Text style={styles.creditsUnit}>{user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'}</Text>
                  </View>
                </View>
              </PremiumCard>
            ))}
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

  // Header
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    borderBottomLeftRadius: theme.spacing[3],
    borderBottomRightRadius: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background + '90', // Semi-transparent white
    marginBottom: theme.spacing[1],
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 18,
  },

  // ScrollView - background handled by AnimatedGradientBackground
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Upper Section (Your Progress + Add Entry) - Animated gradient background
  upperSection: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[6], // Increased padding below
    position: 'relative', // Allow absolute positioned background
    overflow: 'hidden', // Contain the gradient orbs
  },
  // Premium Progress Card
  progressCard: {
    padding: theme.spacing[5],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing[3],
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  progressHeader: {
    marginBottom: theme.spacing[3],
  },
  progressTitleContainer: {
    alignItems: 'center',
  },
  progressMainTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  progressMainContent: {
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  progressCircleContainer: {
    marginBottom: theme.spacing[3],
    position: 'relative', // Allow positioning of status indicator
    alignItems: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing[1],
  },
  progressStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing[2],
  },
  progressFooter: {
    alignItems: 'center', // Center the remaining days info
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  progressTimeInfo: {
    alignItems: 'center', // Center align the time info
  },
  progressTimeInfoLeft: {
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  progressTimeValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  progressTimeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },
  progressStatusIndicator: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.spacing[4],
  },
  progressStatusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
  
  // Status Indicator beside circle
  statusIndicatorBesideCircle: {
    position: 'absolute',
    top: -10, // Position it at top right of circle
    right: -20,
    minWidth: 80, // Ensure consistent width
  },

  // Card gradient common styles
  cardGradient: {
    borderRadius: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section Title
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  // Add Entry Button within Upper Section
  addEntryInUpperSection: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[5], // Increased padding below button
    alignItems: 'center',
  },
  addEntryButton: {
    width: '100%', // Full width
  },
  
  // Dividing Line
  dividerLine: {
    height: 1, // 1 pixel wide
    backgroundColor: theme.colors.gray[600],
    marginHorizontal: 0, // Full width line
    marginBottom: theme.spacing[8], // Increased padding below the line
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[6],
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing[3],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing[3],
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    marginHorizontal: theme.spacing[1],
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing[2],
  },
  quickActionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },

  // Sections with headers - transparent for gradient effect
  recentSection: {
    paddingHorizontal: theme.spacing[5], // Increased padding from spacing[4]
    marginBottom: theme.spacing[4],
    backgroundColor: 'transparent', // Let gradient show through
    paddingVertical: theme.spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Activity Items
  activityItem: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    // backgroundColor removed - using LinearGradient
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  activityProvider: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  activityDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  activityCredits: {
    alignItems: 'center',
  },
  creditsValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  creditsUnit: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  // Enhanced License Section Styles - removed old status summary styles

  // License Card Styles
  licenseCard: {
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    // backgroundColor removed - using entry variant for white background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  licenseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  licenseCardMain: {
    flexDirection: 'row',
    flex: 1,
    marginRight: theme.spacing[3],
  },
  licenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  licenseIconText: {
    fontSize: 20,
  },
  licenseInfo: {
    flex: 1,
  },
  licenseCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  licenseCardAuthority: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  licenseCardExpiry: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  licenseStatusBadge: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.spacing[3],
    minWidth: 80,
    alignItems: 'center',
  },
  licenseStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },

  // License Actions
  licenseCardActions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  licenseActionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.spacing[1],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  licenseActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  licenseActionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },

  // License Progress
  licenseProgress: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing[3],
  },
  licenseProgressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  licenseProgressBar: {
    height: 6,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  licenseProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // License Renewal Instructions
  licenseRenewalInstructions: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing[2],
    padding: theme.spacing[2],
    marginTop: theme.spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  renewalInstructionsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    textAlign: 'center',
  },

  // Add License Button

  // Section Subtitle
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[1],
  },

  // Section Container and Card Styles - transparent for gradient effect
  sectionContainer: {
    paddingHorizontal: theme.spacing[5], // Increased padding from spacing[3]
    marginBottom: theme.spacing[4], // Reduced from [6]
    backgroundColor: 'transparent', // Let gradient show through
    paddingVertical: theme.spacing[2], // Reduced from [3]
  },
  sectionCard: {
    padding: 0,
    borderRadius: theme.spacing[3],
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: theme.colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerButton: {
    minHeight: 28,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    marginLeft: theme.spacing[2], // Add space from title
  },
  cardContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing[4],
  },

  // Reminders Section
  remindersSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  addReminderButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.spacing[2],
  },
  addReminderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.background,
  },
  remindersPlaceholder: {
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  remindersPlaceholderContent: {
    alignItems: 'center',
  },
  remindersPlaceholderIcon: {
    fontSize: 40,
    marginBottom: theme.spacing[3],
  },
  remindersPlaceholderTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  remindersPlaceholderSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  remindersList: {
    marginTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  reminderCard: {
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    // backgroundColor removed - using entry variant for white background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: theme.spacing[3],
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  reminderIconText: {
    fontSize: 16,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  reminderCardDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  reminderStatusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.spacing[2],
  },
  reminderStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },

  // No Licenses Section - transparent for gradient effect
  noLicensesSection: {
    paddingHorizontal: theme.spacing[5], // Increased padding from spacing[4]
    marginBottom: theme.spacing[4],
    backgroundColor: 'transparent', // Let gradient show through
  },
  noLicensesCard: {
    padding: theme.spacing[6],
  },
  noLicensesContent: {
    alignItems: 'center',
  },
  noLicensesIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  noLicensesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  noLicensesSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },

  // CME Event Reminders Section
  remindersPlaceholder: {
    marginTop: theme.spacing[3],
    padding: theme.spacing[6],
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  remindersPlaceholderContent: {
    alignItems: 'center',
  },
  remindersPlaceholderIcon: {
    fontSize: 40,
    marginBottom: theme.spacing[3],
  },
  remindersPlaceholderTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  remindersPlaceholderSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error handling styles
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

  // Bottom spacer for tab bar
  bottomSpacer: {
    height: 100, // Ensure content is fully above bottom tab bar
  },

  // Certificate Thumbnail Styles
  certificateThumbnailDashboard: {
    width: 32,
    height: 32,
    borderRadius: theme.spacing[2],
    backgroundColor: theme.colors.gray.light,
  },

  // Urgent License Renewal Warning Styles
  urgentWarningCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing[3],
    padding: theme.spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  urgentWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  urgentWarningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  urgentWarningEmoji: {
    fontSize: 20,
  },
  urgentWarningTitleContainer: {
    flex: 1,
  },
  urgentWarningTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing[1],
  },
  urgentWarningSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  urgentLicenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  urgentLicenseInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  urgentLicenseType: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  urgentLicenseAuthority: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  urgentLicenseExpiry: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  urgentLicenseActions: {
    alignItems: 'flex-end',
  },
  urgentLicenseStatus: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  urgentLicenseStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  urgentLicenseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.spacing[2],
  },
  urgentLicenseButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.background,
  },
  viewAllUrgentButton: {
    alignItems: 'center',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginTop: theme.spacing[3],
  },
  viewAllUrgentText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Progress Section Animated Background Styles
  progressGradientOrb1: {
    position: 'absolute',
    top: '15%',
    left: '5%',
  },
  progressGradientOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
  },
  progressGradientOrb3: {
    position: 'absolute',
    top: '60%',
    right: '25%',
  },
  progressOrb: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
});