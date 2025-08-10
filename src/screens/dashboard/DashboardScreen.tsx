import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Card, Button, LoadingSpinner, CertificateViewer } from '../../components';
import { SimpleProgressRing } from '../../components/charts/SimpleProgressRing';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { getCreditUnit } from '../../utils/creditTerminology';

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
    recentCMEEntries,
    licenses,
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingLicenses,
    error,
    refreshAllData,
    clearError,
  } = useAppContext();


  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedCertificate, setSelectedCertificate] = React.useState<string | undefined>(undefined);

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

  const recentEntries = recentCMEEntries.slice(0, 2);
  const upcomingRenewals = getUpcomingRenewals().slice(0, 2);

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
        {/* Enhanced Progress Section */}
        <View style={styles.progressSection}>
          <Card style={styles.progressCard}>
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

            <View style={styles.progressFooter}>
              <View style={styles.progressTimeInfo}>
                <Text style={styles.progressTimeValue}>
                  {currentYearProgress?.remainingDays || 0}
                </Text>
                <Text style={styles.progressTimeLabel}>
                  days remaining in cycle
                </Text>
              </View>
              <View style={[styles.progressStatusIndicator, { backgroundColor: currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium }]}>
                <Text style={styles.progressStatusText}>
                  {currentYearProgress?.status === 'completed' && 'Complete!'}
                  {currentYearProgress?.status === 'on_track' && 'On Track'}
                  {currentYearProgress?.status === 'behind' && 'Keep Going'}
                  {currentYearProgress?.status === 'overdue' && 'Action Needed'}
                  {!currentYearProgress && 'Getting Started'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Add Entry Button */}
        <View style={styles.addEntrySection}>
          <Button
            title="+ Add New Entry"
            onPress={() => (navigation as any).navigate('CME', { screen: 'AddCME', params: { editEntry: undefined } })}
            style={styles.addEntryButton}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={() => (navigation as any).navigate('CME', { screen: 'AddCME', params: { editEntry: undefined } })}
            >
              <Text style={styles.quickActionIcon}>📚</Text>
              <Text style={styles.quickActionText}>Add Entry</Text>
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
              onPress={() => (navigation as any).navigate('CME', { screen: 'CMEHistory' })}
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
                  <TouchableOpacity 
                    style={styles.activityIcon}
                    onPress={() => entry.certificatePath && setSelectedCertificate(entry.certificatePath)}
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

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Certificate Viewer */}
      <CertificateViewer
        visible={!!selectedCertificate}
        imageUri={selectedCertificate}
        onClose={() => setSelectedCertificate(undefined)}
      />
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
    backgroundColor: '#003087', // HSL(215°, 100%, 26%)
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[5],
    borderBottomLeftRadius: theme.spacing[6],
    borderBottomRightRadius: theme.spacing[6],
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

  // Enhanced Progress Section
  progressSection: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
  },
  progressCard: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    marginBottom: theme.spacing[2],
    backgroundColor: theme.colors.background,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  progressTimeInfo: {
    flex: 1,
  },
  progressTimeValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  progressTimeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
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

  // Section Title
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  // Add Entry Section
  addEntrySection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  addEntryButton: {
    // Custom styling for the button if needed
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
});