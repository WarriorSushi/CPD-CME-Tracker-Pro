import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Animated,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card, Button, LoadingSpinner, StandardHeader, SvgIcon } from '../../components';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
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
import { databaseOperations } from '../../services/database';
import { soundManager } from '../../services/sound/SoundManager';
import { useSound } from '../../hooks/useSound';

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
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isAudioEnabled());
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_DEBOUNCE_MS = 3000; // Debounce settings refresh to 3 seconds
  
  const { playToggle } = useSound();
  
  // Premium animation values
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible to prevent flash
  const slideAnim = useRef(new Animated.Value(30)).current;
  const profileCardAnim = useRef(new Animated.Value(1)).current; // Start visible
  const licensesCardAnim = useRef(new Animated.Value(1)).current; // Start visible
  const dataCardAnim = useRef(new Animated.Value(1)).current; // Start visible
  const aboutCardAnim = useRef(new Animated.Value(1)).current; // Start visible
  
  // Shadow animations (start with subtle shadow to prevent flash)
  const profileShadowAnim = useRef(new Animated.Value(0)).current;
  const licensesShadowAnim = useRef(new Animated.Value(0)).current;
  const dataShadowAnim = useRef(new Animated.Value(0)).current;
  const aboutShadowAnim = useRef(new Animated.Value(0)).current;

  // Debounced refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
        lastRefreshRef.current = now;
        refreshLicenses();
        refreshUserData();
      }
      
      // Premium entrance animations - only animate slide since cards start visible
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        // Add shadows after slide animation finishes (using setValue to avoid conflicts)
        setTimeout(() => {
          profileShadowAnim.setValue(1);
          licensesShadowAnim.setValue(1);
          dataShadowAnim.setValue(1);
          aboutShadowAnim.setValue(1);
        }, 100);
      });
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

            const success = await resetOnboarding();
            if (success) {

              // Don't show alert - let the automatic navigation to onboarding happen
              // The AppNavigator will automatically switch to OnboardingNavigator when isOnboardingComplete becomes false
            } else {

              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetCompleteApp = async () => {
    Alert.alert(
      'DANGER: Reset Complete App',
      'This will permanently delete ALL your data including:\n\n- All CME entries\n- All certificates\n- All license information\n- All settings\n- User profile\n\nThis action CANNOT be undone!',
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
              'FINAL WARNING',
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

                    const success = await resetCompleteApp();
                    if (success) {

                      // Don't show alert - let the automatic navigation to onboarding happen
                      // The AppNavigator will automatically switch to OnboardingNavigator when isOnboardingComplete becomes false
                    } else {

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

            // Load ALL entries for export, not just recent 10
            const allEntriesResult = await databaseOperations.cme.getAllEntries();
            const allEntries = allEntriesResult.success && allEntriesResult.data
              ? allEntriesResult.data
              : [];

            const success = await exportCMEToCSV(allEntries, user);
            setIsExporting(false);

            if (success) {
              Alert.alert('Success', `${allEntries.length} CME entries exported successfully!`);
            } else {
              Alert.alert('Error', 'Failed to export CME entries.');
            }
          },
        },
        {
          text: 'Summary Report',
          onPress: async () => {
            setIsExporting(true);

            // Load ALL entries for comprehensive report
            const allEntriesResult = await databaseOperations.cme.getAllEntries();
            const allEntries = allEntriesResult.success && allEntriesResult.data
              ? allEntriesResult.data
              : [];

            const success = await generateSummaryReport(user, allEntries, licenses);
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
              
              Alert.alert('Reminder Setup', 'License reminder notifications will be available in a future update.');
            }}
          >
            <Text style={styles.remindButtonText}>Remind Me</Text>
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
      <AnimatedGradientBackground />
      
      <StandardHeader
        title="Settings"
        showBackButton={false}
      />

      <Animated.View 
        style={[
          styles.scrollContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* User Profile Card */}
          <View style={styles.sectionContainer}>
            <PremiumCard style={[
              styles.sectionCard,
              {
                                shadowOpacity: Number(profileShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
              }
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Profile</Text>
              <PremiumButton
                title="Edit"
                onPress={() => {
                  (navigation as any).navigate('ProfileEdit');
                }}
                variant="secondary"
                style={styles.headerButton}
              />
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.profileHeader}>
                <View style={styles.profilePictureContainer}>
                  {user?.profilePicturePath ? (
                    <Image 
                      source={{ uri: user.profilePicturePath }}
                      style={styles.profilePicture}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profileIconWrapper}>
                      <SvgIcon name="profile" size={36} color="#1e40af" />
                    </View>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {user?.profileName || user?.profession || 'Healthcare Professional'}
                  </Text>
                  <Text style={styles.profileRole}>
                    {user?.profession || 'Profession not set'}
                    {user?.age && ` - ${user.age} years old`}
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
            </View>
            </PremiumCard>
          </View>

          {/* Data Management Section */}
          <View style={styles.sectionContainer}>
            <PremiumCard style={[
              styles.sectionCard,
              {
                                shadowOpacity: Number(dataShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
              }
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Data Management</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.modernButtonGrid}>
                <TouchableOpacity
                  style={styles.modernActionButton}
                  onPress={handleExportData}
                  disabled={isExporting}
                >
                  <SvgIcon name="export" size={28} color="#1e40af" />
                  <Text style={styles.modernActionText}>Export Data</Text>
                  <Text style={styles.modernActionSubtext}>CSV & Reports</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modernActionButton}
                  onPress={handleCreateBackup}
                  disabled={isExporting}
                >
                  <SvgIcon name="backup" size={28} color="#1e40af" />
                  <Text style={styles.modernActionText}>Create Backup</Text>
                  <Text style={styles.modernActionSubtext}>Full Backup</Text>
                </TouchableOpacity>
              </View>
            </View>
            </PremiumCard>
          </View>

          {/* App Settings Section */}
          <View style={styles.sectionContainer}>
            <PremiumCard style={[
              styles.sectionCard,
              {
                                shadowOpacity: Number(aboutShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
              }
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>App Settings</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.settingsGrid}>
                <TouchableOpacity 
                  style={styles.modernSettingItem}
                  onPress={() => (navigation as any).navigate('NotificationSettings')}
                >
                  <View style={styles.settingIconWrapper}>
                    <SvgIcon name="bell" size={22} color="#1e40af" />
                  </View>
                  <View style={styles.settingDetails}>
                    <Text style={styles.modernSettingLabel}>Notifications</Text>
                    <Text style={styles.modernSettingValue}>Reminders & Alerts</Text>
                  </View>
                  <SvgIcon name="chevron-right" size={16} color="#9ca3af" />
                </TouchableOpacity>
                
                <View style={styles.modernSettingItem}>
                  <View style={styles.settingIconWrapper}>
                    <SvgIcon name="volume" size={22} color="#1e40af" />
                  </View>
                  <View style={styles.settingDetails}>
                    <Text style={styles.modernSettingLabel}>Sound Effects</Text>
                    <Text style={styles.modernSettingValue}>{soundEnabled ? 'Enabled' : 'Disabled'}</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={async (enabled) => {
                      await playToggle();
                      setSoundEnabled(enabled);
                      await soundManager.setEnabled(enabled);
                    }}
                    trackColor={{ false: theme.colors.gray.light, true: theme.colors.primary }}
                    thumbColor={theme.colors.background}
                  />
                </View>
                
                <View style={styles.modernSettingItem}>
                  <View style={styles.settingIconWrapper}>
                    <SvgIcon name="theme" size={22} color="#1e40af" />
                  </View>
                  <View style={styles.settingDetails}>
                    <Text style={styles.modernSettingLabel}>Theme</Text>
                    <Text style={styles.modernSettingValue}>Light</Text>
                  </View>
                </View>
                
                <View style={styles.modernSettingItem}>
                  <View style={styles.settingIconWrapper}>
                    <SvgIcon name="sync" size={22} color="#1e40af" />
                  </View>
                  <View style={styles.settingDetails}>
                    <Text style={styles.modernSettingLabel}>Auto Backup</Text>
                    <Text style={styles.modernSettingValue}>Disabled</Text>
                  </View>
                </View>
              </View>
            </View>
            </PremiumCard>
          </View>

          {/* About Section */}
          <View style={styles.sectionContainer}>
            <PremiumCard style={[
              styles.sectionCard,
              {
                                shadowOpacity: Number(aboutShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
              }
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>About</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.modernAboutInfo}>
                <View style={styles.aboutIconWrapper}>
                  <SvgIcon name="medical" size={36} color="#1e40af" />
                </View>
                <Text style={styles.appName}>{APP_CONFIG.NAME}</Text>
                <Text style={styles.appVersion}>Version {APP_CONFIG.VERSION}</Text>
                <Text style={styles.appDescription}>
                  Your personal CME tracking companion. Track continuing education, 
                  manage certificates, and stay compliant with renewal requirements.
                </Text>
              </View>
            </View>
            </PremiumCard>
          </View>

          {/* Danger Zone Section - Keep as regular Card for danger styling */}
          <View style={styles.sectionContainer}>
            <Card style={[styles.sectionCard, styles.dangerCard]}>
            <LinearGradient
              colors={['#dc2626', '#991b1b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardHeader}
            >
              <View style={styles.dangerHeaderContent}>
                <SvgIcon name="warning" size={24} color="#ffffff" />
                <Text style={styles.cardHeaderTitle}>Danger Zone</Text>
              </View>
            </LinearGradient>
            
            <LinearGradient
              colors={['#fef2f2', '#fecaca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardContent}
            >
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
              <Text style={styles.dangerButtonPrimaryText}>Reset App</Text>
            </TouchableOpacity>
          </View>
          </LinearGradient>
            </Card>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let AnimatedGradientBackground show through
  },
  scrollContentOld: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    backgroundColor: 'transparent', // Let gradient show through
  },
  
  // Beautiful Header
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
  profilePictureContainer: {
    marginRight: theme.spacing[4],
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  profileIconWrapperOld: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.light,
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
    backgroundColor: theme.colors.accent,
    padding: theme.spacing[3], // Reduced padding
    borderRadius: theme.spacing[2],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginHorizontal: theme.spacing[1],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modernActionIconOld: {
    fontSize: 24,
    marginBottom: theme.spacing[2],
  },
  modernActionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  modernActionSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Settings Grid
  settingsGrid: {
    gap: theme.spacing[3],
  },
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.accent,
    borderRadius: theme.spacing[2],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full, // Circular icon
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
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  modernSettingValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Modern About Section
  modernAboutInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl, // Large rounded icon container
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
  licenseHeaderOld: {
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
  licenseAuthorityOld: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  licenseNumberOld: {
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
  licenseDetailsOld: {
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
  licenseActionsOld: {
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
    paddingHorizontal: theme.spacing[2], // Reduced from [4]
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
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  cardHeaderTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerButton: {
    minWidth: 100,
  },
  cardContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing[3],
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
    backgroundColor: theme.colors.accent,
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
    backgroundColor: theme.colors.accent,
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
  
  // Redesigned Settings styles
  dangerCard: {
    borderColor: '#dc2626',
  },
  dangerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  modernActionIcon: {
    // Removed since using SvgIcon now
  },
  profileIconNew: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  
  // Icon wrappers for proper spacing
  settingIconWrapper: {
    marginRight: theme.spacing[3],
    marginLeft: theme.spacing[1],
  },
  aboutIconWrapper: {
    marginBottom: theme.spacing[3],
  },
  profileIconWrapper: {
    marginRight: theme.spacing[3],
    marginTop: theme.spacing[1],
  },
});