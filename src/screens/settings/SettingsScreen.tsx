import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card, Button, LoadingSpinner, StandardHeader, SvgIcon } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { useOnboardingContext } from '../../contexts/OnboardingContext';
import { LicenseRenewal } from '../../types';
import { MainTabParamList, TabParamList } from '../../types/navigation';
import { APP_CONFIG } from '../../constants';
import { getCreditUnit } from '../../utils/creditTerminology';
import { 
  exportCMEToCSV, 
  exportLicensesToCSV, 
  generateSummaryReport, 
  createBackup 
} from '../../utils/dataExport';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Settings'>,
  StackNavigationProp<MainTabParamList>
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { 
    user, 
    licenses, 
    recentCMEEntries,
    isLoadingLicenses,
    refreshLicenses,
    refreshUserData,
    deleteLicense
  } = useAppContext();
  const { resetOnboarding, resetCompleteApp } = useOnboardingContext();

  const [refreshing, setRefreshing] = useState(false);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_DEBOUNCE_MS = 3000; // Debounce settings refresh to 3 seconds

  // Debounced refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
        lastRefreshRef.current = now;
        refreshLicenses();
        refreshUserData();
      }
    }, [refreshLicenses, refreshUserData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshLicenses(), refreshUserData()]);
    setRefreshing(false);
  }, [refreshLicenses, refreshUserData]);

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset only your onboarding settings and return you to the welcome screen. Your CME data will not be affected.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            console.log('🔄 User confirmed reset onboarding');
            const success = await resetOnboarding();
            if (success) {
              console.log('✅ Onboarding reset successful - app should automatically navigate to onboarding');
              // Don't show alert - let the automatic navigation to onboarding happen
              // The AppNavigator will automatically switch to OnboardingNavigator when isOnboardingComplete becomes false
            } else {
              console.log('❌ Onboarding reset failed');
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetCompleteApp = async () => {
    Alert.alert(
      '⚠️ DANGER: Reset Complete App',
      'This will permanently delete ALL your data including:\n\n• All CME entries\n• All certificates\n• All license information\n• All settings\n• User profile\n\nThis action CANNOT be undone!',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I understand, DELETE ALL DATA',
          style: 'destructive',
          onPress: () => {
            // Double confirmation for complete reset
            Alert.alert(
              '🚨 FINAL WARNING',
              'Are you absolutely sure you want to delete ALL app data? This cannot be reversed.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'YES, DELETE EVERYTHING',
                  style: 'destructive',
                  onPress: async () => {
                    console.log('🧹 User confirmed complete app reset');
                    const success = await resetCompleteApp();
                    if (success) {
                      console.log('✅ Complete app reset successful - app should automatically navigate to onboarding');
                      // Don't show alert - let the automatic navigation to onboarding happen
                      // The AppNavigator will automatically switch to OnboardingNavigator when isOnboardingComplete becomes false
                    } else {
                      console.log('❌ Complete app reset failed');
                      Alert.alert('Error', 'Failed to reset app completely. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteLicense = (license: LicenseRenewal) => {
    Alert.alert(
      'Delete License',
      `Are you sure you want to delete the ${license.licenseType} license?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteLicense(license.id);
            if (!success) {
              Alert.alert('Error', 'Failed to delete license. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not loaded. Please try again.');
      return;
    }

    Alert.alert(
      'Export Data',
      'What would you like to export?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'CME Entries',
          onPress: async () => {
            setIsExporting(true);
            const success = await exportCMEToCSV(recentCMEEntries, user);
            setIsExporting(false);
            if (success) {
              Alert.alert('Success', 'CME entries exported successfully!');
            } else {
              Alert.alert('Error', 'Failed to export CME entries.');
            }
          },
        },
        {
          text: 'Summary Report',
          onPress: async () => {
            setIsExporting(true);
            const success = await generateSummaryReport(user, recentCMEEntries, licenses);
            setIsExporting(false);
            if (success) {
              Alert.alert('Success', 'Summary report generated successfully!');
            } else {
              Alert.alert('Error', 'Failed to generate summary report.');
            }
          },
        },
      ]
    );
  };

  const handleCreateBackup = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not loaded. Please try again.');
      return;
    }

    Alert.alert(
      'Create Backup',
      'This will create a complete backup of your data including CME entries and licenses.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create Backup',
          onPress: async () => {
            setIsExporting(true);
            const success = await createBackup(user, recentCMEEntries, licenses);
            setIsExporting(false);
            if (success) {
              Alert.alert('Success', 'Backup created successfully!');
            } else {
              Alert.alert('Error', 'Failed to create backup.');
            }
          },
        },
      ]
    );
  };

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: theme.colors.error, text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: theme.colors.error, text: `${daysUntilExpiry} days left` };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', color: theme.colors.warning, text: `${daysUntilExpiry} days left` };
    } else {
      return { status: 'active', color: theme.colors.success, text: `${daysUntilExpiry} days left` };
    }
  };

  const renderLicenseCard = (license: LicenseRenewal) => {
    const expirationInfo = getExpirationStatus(license.expirationDate);
    
    return (
      <Card key={license.id} style={styles.licenseCard}>
        <View style={styles.licenseHeader}>
          <View style={styles.licenseInfo}>
            <Text style={styles.licenseTitle}>{license.licenseType}</Text>
            <Text style={styles.licenseAuthority}>{license.issuingAuthority}</Text>
            {license.licenseNumber && (
              <Text style={styles.licenseNumber}>#{license.licenseNumber}</Text>
            )}
          </View>
          
          <View style={styles.licenseStatus}>
            <View style={[styles.statusBadge, { backgroundColor: expirationInfo.color }]}>
              <Text style={styles.statusText}>{expirationInfo.text}</Text>
            </View>
          </View>
        </View>

        <View style={styles.licenseDetails}>
          <Text style={styles.licenseDate}>
            Expires: {new Date(license.expirationDate).toLocaleDateString()}
          </Text>
          
          {license.requiredCredits > 0 && (
            <View style={styles.creditsInfo}>
              <Text style={styles.creditsText}>
                {user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'}: {license.completedCredits}/{license.requiredCredits}
              </Text>
              <View style={styles.creditsBar}>
                <View 
                  style={[
                    styles.creditsProgress, 
                    { 
                      width: `${Math.min((license.completedCredits / license.requiredCredits) * 100, 100)}%`,
                      backgroundColor: license.completedCredits >= license.requiredCredits 
                        ? theme.colors.success 
                        : theme.colors.primary
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.licenseActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.remindButton]}
            onPress={() => {
              // TODO: Setup notification reminders for this license
              Alert.alert('Reminder Setup', 'License reminder notifications will be available in a future update.');
            }}
          >
            <Text style={styles.remindButtonText}>🔔 Remind Me</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              navigation.navigate('AddLicense', { editLicense: license });
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteLicense(license)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <StandardHeader
        title="Settings"
        showBackButton={false}
      />

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>
                {user?.profession?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.profession || 'Healthcare Professional'}
              </Text>
              <Text style={styles.profileRole}>
                {user?.profession || 'Profession not set'}
              </Text>
            </View>
          </View>
          
          {user ? (
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'}</Text>
                <Text style={styles.statLabel}>System</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.annualRequirement || 0}</Text>
                <Text style={styles.statLabel}>Annual Goal</Text>
              </View>
            </View>
          ) : (
            <LoadingSpinner size={20} />
          )}
          
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              Alert.alert('Edit Profile', 'Profile editing will be available in a future update.');
            }}
          >
            <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Your Licenses Section */}
        {licenses && licenses.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
            <LinearGradient
              colors={['#36454F', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardHeader}
            >
              <Text style={styles.cardHeaderTitle}>Your Licenses</Text>
              <Button
                title="+ Add License"
                onPress={() => (navigation.getParent() as any).navigate('AddLicense')}
                variant="primary"
                size="small"
                style={styles.headerButton}
              />
            </LinearGradient>
            
            <LinearGradient
              colors={['#FBFBF9', '#FEFEFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardContent}
            >
              <Text style={styles.sectionSubtitle}>
                View and manage all your professional licenses here. Tap Edit to update expiration dates after renewal.
              </Text>
            
            {(() => {
              const calculateDaysUntil = (expirationDateString: string): number => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const expDate = new Date(expirationDateString);
                if (isNaN(expDate.getTime())) {
                  console.error('🚨 Invalid date string:', expirationDateString);
                  return 0;
                }
                expDate.setHours(0, 0, 0, 0);
                
                const msPerDay = 1000 * 60 * 60 * 24;
                const diffMs = expDate.getTime() - today.getTime();
                return Math.ceil(diffMs / msPerDay);
              };
              
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
                  statusIcon = <Text style={{ fontSize: 16 }}>🗓️</Text>;
                }

                return (
                  <Card key={license.id} variant="entry" style={styles.licenseCardNew}>
                    <View style={styles.licenseHeader}>
                      <View style={styles.licenseMainInfo}>
                        <View style={styles.licenseIconContainer}>
                          {statusIcon}
                        </View>
                        <View style={styles.licenseDetails}>
                          <Text style={styles.licenseType}>{license.licenseType}</Text>
                          <Text style={styles.licenseAuthority}>{license.issuingAuthority}</Text>
                          {license.licenseNumber && (
                            <Text style={styles.licenseNumber}>#{license.licenseNumber}</Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.licenseStatusContainer}>
                        <View style={[styles.licenseStatusBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.licenseStatusText}>{statusText}</Text>
                        </View>
                        <Text style={styles.licenseExpiration}>
                          Expires {new Date(license.expirationDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.licenseActions}>
                      <TouchableOpacity
                        style={styles.editLicenseButton}
                        onPress={() => {
                          (navigation.getParent() as any).navigate('AddLicense', { editLicense: license });
                        }}
                      >
                        <Text style={styles.editLicenseText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.licenseRenewalInstructions}>
                      <Text style={styles.renewalInstructionsText}>
                        💡 Already renewed? Tap "Edit" and update the expiration date.
                      </Text>
                    </View>
                  </Card>
                );
              });
            })()}
            
            </LinearGradient>
            </View>
          </View>
        )}

        {(!licenses || licenses.length === 0) && (
          <View style={styles.noLicensesSection}>
            <Card style={styles.noLicensesCard}>
              <View style={styles.noLicensesContent}>
                <Text style={styles.noLicensesIcon}>📋</Text>
                <Text style={styles.noLicensesTitle}>No Licenses Added</Text>
                <Text style={styles.noLicensesSubtitle}>
                  Add your professional licenses to track renewal deadlines and stay compliant.
                </Text>
                <Button
                  title="Add Your First License"
                  onPress={() => (navigation.getParent() as any).navigate('AddLicense')}
                  style={styles.addEntryButton}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Data Management Section */}
        <Card style={styles.modernSection}>
          <Text style={styles.modernSectionTitle}>💾 Data Management</Text>
          
          <View style={styles.modernButtonGrid}>
            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={handleExportData}
              disabled={isExporting}
            >
              <Text style={styles.modernActionIcon}>📤</Text>
              <Text style={styles.modernActionText}>Export Data</Text>
              <Text style={styles.modernActionSubtext}>CSV & Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={handleCreateBackup}
              disabled={isExporting}
            >
              <Text style={styles.modernActionIcon}>💾</Text>
              <Text style={styles.modernActionText}>Create Backup</Text>
              <Text style={styles.modernActionSubtext}>Full Backup</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* App Settings Section */}
        <Card style={styles.modernSection}>
          <Text style={styles.modernSectionTitle}>⚙️ App Settings</Text>
          
          <View style={styles.settingsGrid}>
            <View style={styles.modernSettingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔔</Text>
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.modernSettingLabel}>Notifications</Text>
                <Text style={styles.modernSettingValue}>Enabled</Text>
              </View>
            </View>
            
            <View style={styles.modernSettingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🌙</Text>
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.modernSettingLabel}>Theme</Text>
                <Text style={styles.modernSettingValue}>Light</Text>
              </View>
            </View>
            
            <View style={styles.modernSettingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔄</Text>
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.modernSettingLabel}>Auto Backup</Text>
                <Text style={styles.modernSettingValue}>Disabled</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* About Section */}
        <Card style={styles.modernSection}>
          <Text style={styles.modernSectionTitle}>ℹ️ About</Text>
          
          <View style={styles.modernAboutInfo}>
            <View style={styles.appIconContainer}>
              <Text style={styles.appIcon}>🏥</Text>
            </View>
            <Text style={styles.appName}>{APP_CONFIG.NAME}</Text>
            <Text style={styles.appVersion}>Version {APP_CONFIG.VERSION}</Text>
            <Text style={styles.appDescription}>
              Your personal CME tracking companion. Track continuing education, 
              manage certificates, and stay compliant with renewal requirements.
            </Text>
          </View>
        </Card>

        {/* Danger Zone Section */}
        <Card style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <Text style={styles.dangerSubtitle}>
            These actions are irreversible. Please proceed with caution.
          </Text>
          
          <View style={styles.dangerActions}>
            <TouchableOpacity
              style={styles.dangerButtonSecondary}
              onPress={handleResetOnboarding}
            >
              <Text style={styles.dangerButtonSecondaryText}>Reset Onboarding</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dangerButtonPrimary}
              onPress={handleResetCompleteApp}
            >
              <Text style={styles.dangerButtonPrimaryText}>🗑️ Reset App</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  
  // Beautiful Header
  header: {
    backgroundColor: '#003087', // HSL(215°, 100%, 26%)
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
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    opacity: 0.9,
  },
  
  // Scroll Content
  scrollContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },

  // Modern Profile Card
  profileCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  profileRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginBottom: theme.spacing[4],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing[4],
  },
  editProfileButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.spacing[3],
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.background,
  },

  // Modern Sections
  modernSection: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  modernSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  addLicenseButton: {
    backgroundColor: '#00b894',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.spacing[2],
  },
  addLicenseText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.background,
  },

  // Modern Empty State
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modern Button Grid
  modernButtonGrid: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  modernActionButton: {
    flex: 1,
    backgroundColor: '#74b9ff',
    padding: theme.spacing[4],
    borderRadius: theme.spacing[3],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing[2],
  },
  modernActionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
    marginBottom: theme.spacing[1],
  },
  modernActionSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.background,
    opacity: 0.8,
  },

  // Settings Grid
  settingsGrid: {
    gap: theme.spacing[3],
  },
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    backgroundColor: '#FFF5EE',
    borderRadius: theme.spacing[2],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  settingIconText: {
    fontSize: 18,
  },
  settingDetails: {
    flex: 1,
  },
  modernSettingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  modernSettingValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Modern About Section
  modernAboutInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  appIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  appVersion: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[4],
  },
  appDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing[4],
  },

  // License Management (existing)
  licensesList: {
    gap: theme.spacing[3],
  },
  licenseCard: {
    padding: theme.spacing[4],
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  licenseInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  licenseTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  licenseAuthority: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  licenseNumber: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  licenseStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  licenseDetails: {
    marginBottom: theme.spacing[3],
  },
  licenseDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  creditsInfo: {
    marginBottom: theme.spacing[2],
  },
  creditsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  creditsBar: {
    height: 4,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  creditsProgress: {
    height: '100%',
  },
  licenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing[3],
  },
  actionButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  remindButton: {
    backgroundColor: '#6c5ce7',
  },
  remindButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.medium,
  },
  editButton: {
    backgroundColor: '#00b894',
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Danger Zone
  dangerZone: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#d63031',
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  dangerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  dangerActions: {
    gap: theme.spacing[3],
  },
  dangerButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#ff7675',
    borderWidth: 2,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.spacing[2],
    alignItems: 'center',
  },
  dangerButtonSecondaryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#ff7675',
  },
  dangerButtonPrimary: {
    backgroundColor: '#d63031',
    paddingVertical: theme.spacing[3],
    borderRadius: theme.spacing[2],
    alignItems: 'center',
    shadowColor: '#d63031',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  dangerButtonPrimaryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },

  // Bottom spacing for tab bar
  bottomSpacing: {
    height: 100, // Ensure content is fully above bottom tab bar
  },

  // New License Section Styles (from dashboard)
  sectionContainer: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[6],
    backgroundColor: '#FFF7EC',
    paddingVertical: theme.spacing[3],
  },
  sectionCard: {
    padding: 0,
    borderRadius: theme.spacing[3],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#36454F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  cardHeaderTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  headerButton: {
    minWidth: 100,
  },
  cardContent: {
    padding: theme.spacing[4],
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  licenseCardNew: {
    marginBottom: theme.spacing[4],
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  licenseMainInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  licenseIconContainer: {
    marginRight: theme.spacing[3],
    marginTop: theme.spacing[1],
  },
  licenseDetails: {
    flex: 1,
  },
  licenseType: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  licenseAuthority: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  licenseNumber: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  licenseStatusContainer: {
    alignItems: 'flex-end',
  },
  licenseStatusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing[1],
  },
  licenseStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  licenseExpiration: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  licenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing[2],
  },
  editLicenseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.spacing[1],
  },
  editLicenseText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.background,
  },
  licenseRenewalInstructions: {
    backgroundColor: '#FFF7EC',
    borderRadius: theme.spacing[2],
    padding: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  renewalInstructionsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  noLicensesSection: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
    backgroundColor: '#FFF7EC',
    paddingVertical: theme.spacing[3],
  },
  noLicensesCard: {
    alignItems: 'center',
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
    lineHeight: 22,
    marginBottom: theme.spacing[4],
  },
  addEntryButton: {
    minWidth: 200,
  },
});