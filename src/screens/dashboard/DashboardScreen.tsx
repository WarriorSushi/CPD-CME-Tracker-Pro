import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ProgressCircle, Card, Button, LoadingSpinner } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';

const { width, height } = Dimensions.get('window');

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    currentYearProgress,
    cmeEntries,
    licenses,
    isLoadingUser,
    isLoadingCME,
    isLoadingLicenses,
    refreshAllData,
  } = useAppContext();

  const [refreshing, setRefreshing] = React.useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [refreshAllData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  }, [refreshAllData]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '🎉';
      case 'on_track':
        return '✅';
      case 'behind':
        return '⚠️';
      case 'overdue':
        return '🚨';
      default:
        return '🎯';
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

  const recentEntries = cmeEntries.slice(0, 2);
  const upcomingRenewals = getUpcomingRenewals().slice(0, 2);

  if (isLoadingUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingSpinner size={40} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={styles.userName}>{user?.profession || 'Healthcare Professional'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Annual Progress</Text>
            <Text style={styles.yearText}>{new Date().getFullYear()}</Text>
          </View>

          <Card style={styles.progressCard}>
            <View style={styles.progressContent}>
              <View style={styles.progressCircleContainer}>
                <ProgressCircle 
                  progress={currentYearProgress ? currentYearProgress.percentage / 100 : 0} 
                  size={120}
                  color={currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium}
                  gradientColors={[
                    currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium,
                    currentYearProgress ? getProgressColor(currentYearProgress.status) + '80' : theme.colors.gray.light
                  ]}
                  strokeWidth={10}
                  showGlow={true}
                  pulseOnComplete={true}
                  showShadow={true}
                  duration={1500}
                />
              </View>

              <View style={styles.progressDetails}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Credits Earned</Text>
                  <Text style={styles.progressValue}>
                    {currentYearProgress?.totalCompleted?.toFixed(1) || '0'}
                  </Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Annual Goal</Text>
                  <Text style={styles.progressValue}>
                    {currentYearProgress?.totalRequired || user?.annualRequirement || 0}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusIcon}>
                    {currentYearProgress ? getStatusIcon(currentYearProgress.status) : '🎯'}
                  </Text>
                  <Text style={styles.statusText}>
                    {currentYearProgress?.remainingDays ? `${currentYearProgress.remainingDays} days left` : 'Getting started'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Large Add Entry Button */}
        <View style={styles.addEntrySection}>
          <TouchableOpacity 
            style={styles.addEntryButton}
            onPress={() => navigation.navigate('CME')}
          >
            <View style={styles.addEntryContent}>
              <View style={styles.addEntryIcon}>
                <Text style={styles.addEntryIconText}>+</Text>
              </View>
              <View style={styles.addEntryTextContainer}>
                <Text style={styles.addEntryTitle}>Add New CME Entry</Text>
                <Text style={styles.addEntrySubtitle}>Log your continuing education credits</Text>
              </View>
              <View style={styles.addEntryArrow}>
                <Text style={styles.addEntryArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('CME')}
            >
              <Text style={styles.quickActionIcon}>📚</Text>
              <Text style={styles.quickActionText}>Add CME</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Vault')}
            >
              <Text style={styles.quickActionIcon}>🏆</Text>
              <Text style={styles.quickActionText}>Certificates</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('CME')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        {recentEntries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CME')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentEntries.map((entry, index) => (
              <Card key={entry.id} style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityEmoji}>📖</Text>
                  </View>
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
                    <Text style={styles.creditsUnit}>{user?.creditSystem || 'hrs'}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <View style={styles.renewalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>License Renewals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.viewAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingRenewals.map((license) => {
              const daysUntilExpiry = Math.ceil(
                (new Date(license.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const isUrgent = daysUntilExpiry <= 30;
              
              return (
                <Card key={license.id} style={styles.renewalItem}>
                  <View style={styles.renewalContent}>
                    <View style={styles.renewalIcon}>
                      <Text style={styles.renewalEmoji}>📋</Text>
                    </View>
                    <View style={styles.renewalDetails}>
                      <Text style={styles.renewalTitle} numberOfLines={1}>
                        {license.licenseType}
                      </Text>
                      <Text style={styles.renewalAuthority} numberOfLines={1}>
                        {license.issuingAuthority}
                      </Text>
                    </View>
                    <View style={[
                      styles.renewalBadge, 
                      isUrgent && styles.renewalBadgeUrgent
                    ]}>
                      <Text style={[
                        styles.renewalDays,
                        isUrgent && styles.renewalDaysUrgent
                      ]}>
                        {daysUntilExpiry}d
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
    borderBottomLeftRadius: theme.spacing[6],
    borderBottomRightRadius: theme.spacing[6],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 18,
  },

  // ScrollView
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Sections
  progressSection: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  yearText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Progress Card
  progressCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircleContainer: {
    marginRight: theme.spacing[4],
  },
  progressInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  progressDetails: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  statusIcon: {
    fontSize: 16,
    marginRight: theme.spacing[2],
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },

  // Add Entry Section
  addEntrySection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  addEntryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing[4],
    paddingVertical: theme.spacing[5],
    paddingHorizontal: theme.spacing[4],
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    // Button pressed effect preparation
    borderWidth: 0,
    borderBottomWidth: 5,
    borderBottomColor: theme.colors.primary + 'DD',
  },
  addEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addEntryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  addEntryIconText: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  addEntryTextContainer: {
    flex: 1,
  },
  addEntryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
    marginBottom: theme.spacing[1],
  },
  addEntrySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background + 'CC',
  },
  addEntryArrow: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEntryArrowText: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
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
    backgroundColor: theme.colors.background,
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

  // Sections with headers
  recentSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  renewalsSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
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
    backgroundColor: theme.colors.background,
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

  // Renewal Items
  renewalItem: {
    padding: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },
  renewalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  renewalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.warning + '20', // Light warning background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  renewalEmoji: {
    fontSize: 16,
  },
  renewalDetails: {
    flex: 1,
  },
  renewalTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  renewalAuthority: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  renewalBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  renewalBadgeUrgent: {
    backgroundColor: theme.colors.error,
  },
  renewalDays: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  renewalDaysUrgent: {
    color: theme.colors.background,
  },

  // Bottom spacer
  bottomSpacer: {
    height: theme.spacing[6],
  },
});