import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card, Button, StandardHeader, SvgIcon, LoadingSpinner } from '../../components';
import { theme } from '../../constants/theme';
import { 
  NotificationService, 
  NotificationSettings, 
  DEFAULT_NOTIFICATION_SETTINGS,
  PermissionStatus 
} from '../../services/notifications';
import { useAppContext } from '../../contexts/AppContext';

interface Props {
  navigation: any;
}

export const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, licenses, eventReminders, recentCMEEntries } = useAppContext();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const [currentSettings, permStatus, stats] = await Promise.all([
        NotificationService.getSettings(),
        NotificationService.hasPermissions().then(granted => granted ? 'granted' : 'denied'),
        NotificationService.getStorageStats(),
      ]);

      setSettings(currentSettings);
      setPermissionStatus(permStatus as PermissionStatus);
      setStorageStats(stats);
    } catch (error) {
      __DEV__ && console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: NotificationSettings) => {
    try {
      setSaving(true);
      await NotificationService.updateSettings(updatedSettings);
      setSettings(updatedSettings);

      // Refresh notifications with current app data
      const currentProgress = recentCMEEntries.reduce((sum, entry) => sum + entry.creditsEarned, 0);
      await NotificationService.refreshAllNotifications(
        user || undefined,
        licenses,
        eventReminders,
        currentProgress
      );

    } catch (error) {
      __DEV__ && console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleMasterToggle = async (enabled: boolean) => {
    if (enabled && permissionStatus !== 'granted') {
      const granted = await NotificationService.ensurePermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive reminders.'
        );
        return;
      }
      setPermissionStatus('granted');
    }

    const updatedSettings = { ...settings, enabled };
    await saveSettings(updatedSettings);
  };

  const handleIntervalToggle = (
    section: 'cycleReminders' | 'licenseReminders',
    interval: number,
    enabled: boolean
  ) => {
    const currentIntervals = settings[section].intervals;
    let newIntervals: number[];

    if (enabled) {
      newIntervals = [...currentIntervals, interval].sort((a, b) => b - a);
    } else {
      newIntervals = currentIntervals.filter(i => i !== interval);
    }

    const updatedSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        intervals: newIntervals,
      },
    };

    saveSettings(updatedSettings);
  };

  const handleTimeChange = (
    type: 'start' | 'end',
    event: any,
    selectedTime?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      const updatedSettings = {
        ...settings,
        quietHours: {
          ...settings.quietHours,
          [type === 'start' ? 'startTime' : 'endTime']: timeString,
        },
      };
      saveSettings(updatedSettings);
    }
  };

  const sendTestNotification = async () => {
    try {
      const hasPermissions = await NotificationService.ensurePermissions();
      if (!hasPermissions) {
        Alert.alert('No Permissions', 'Please enable notifications first.');
        return;
      }

      await NotificationService.showTestNotification();
      Alert.alert('Test Sent', 'Check your notifications for the test message.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.cancelAllNotifications();
            await loadSettings();
            Alert.alert('Cleared', 'All scheduled notifications have been cleared.');
          },
        },
      ]
    );
  };

  const renderIntervalSelector = (
    title: string,
    section: 'cycleReminders' | 'licenseReminders',
    intervals: number[]
  ) => {
    const availableIntervals = [90, 60, 30, 14, 7, 1];

    return (
      <PremiumCard style={[
        styles.card,
        {
          elevation: cardsShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
          shadowOpacity: cardsShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
        }
      ]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Switch
            value={settings[section].enabled}
            onValueChange={(enabled) => {
              const updatedSettings = {
                ...settings,
                [section]: {
                  ...settings[section],
                  enabled,
                },
              };
              saveSettings(updatedSettings);
            }}
            trackColor={{ false: theme.colors.gray.light, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        </View>

        {settings[section].enabled && (
          <View style={styles.intervalContainer}>
            <Text style={styles.intervalLabel}>
              Send reminders (days before):
            </Text>
            <View style={styles.intervalGrid}>
              {availableIntervals.map((interval) => {
                const isSelected = intervals.includes(interval);
                return (
                  <TouchableOpacity
                    key={interval}
                    style={[
                      styles.intervalChip,
                      isSelected && styles.intervalChipSelected,
                    ]}
                    onPress={() => handleIntervalToggle(section, interval, !isSelected)}
                  >
                    <Text
                      style={[
                        styles.intervalChipText,
                        isSelected && styles.intervalChipTextSelected,
                      ]}
                    >
                      {interval === 1 ? '1 day' : `${interval} days`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </PremiumCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StandardHeader
          title="Notification Settings"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StandardHeader
        title="Notification Settings"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <Card variant="entry" style={styles.card}>
          <View style={styles.masterToggleContainer}>
            <View style={styles.masterToggleInfo}>
              <Text style={styles.masterToggleTitle}>Enable Notifications</Text>
              <Text style={styles.masterToggleDescription}>
                Receive reminders for CME deadlines, license renewals, and events
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: theme.colors.gray.light, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          </View>

          {/* Permission Status */}
          <View style={styles.permissionStatus}>
            <View style={styles.permissionInfo}>
              <SvgIcon
                name={permissionStatus === 'granted' ? 'checkmark' : 'alert'}
                size={16}
                color={
                  permissionStatus === 'granted'
                    ? theme.colors.success
                    : theme.colors.warning
                }
              />
              <Text style={styles.permissionText}>
                {permissionStatus === 'granted'
                  ? 'Permissions granted'
                  : 'Permissions required'}
              </Text>
            </View>
            {permissionStatus !== 'granted' && (
              <Button
                title="Request"
                size="small"
                variant="outline"
                onPress={() => NotificationService.ensurePermissions().then(loadSettings)}
              />
            )}
          </View>
        </Card>

        {settings.enabled && (
          <>
            {/* CME Cycle Reminders */}
            {renderIntervalSelector(
              'CME Cycle Reminders',
              'cycleReminders',
              settings.cycleReminders.intervals
            )}

            {/* License Renewal Reminders */}
            {renderIntervalSelector(
              'License Renewal Reminders',
              'licenseReminders',
              settings.licenseReminders.intervals
            )}

            {/* Event Reminders */}
            <Card variant="entry" style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CME Event Reminders</Text>
                <Switch
                  value={settings.eventReminders.enabled}
                  onValueChange={(enabled) => {
                    const updatedSettings = {
                      ...settings,
                      eventReminders: {
                        ...settings.eventReminders,
                        enabled,
                      },
                    };
                    saveSettings(updatedSettings);
                  }}
                  trackColor={{ false: theme.colors.gray.light, true: theme.colors.primary }}
                  thumbColor={theme.colors.background}
                />
              </View>

              {settings.eventReminders.enabled && (
                <View style={styles.eventReminderContainer}>
                  <Text style={styles.intervalLabel}>
                    Default reminder time:
                  </Text>
                  <View style={styles.intervalGrid}>
                    {[1, 3, 7].map((days) => {
                      const isSelected = settings.eventReminders.defaultInterval === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.intervalChip,
                            isSelected && styles.intervalChipSelected,
                          ]}
                          onPress={() => {
                            const updatedSettings = {
                              ...settings,
                              eventReminders: {
                                ...settings.eventReminders,
                                defaultInterval: days,
                              },
                            };
                            saveSettings(updatedSettings);
                          }}
                        >
                          <Text
                            style={[
                              styles.intervalChipText,
                              isSelected && styles.intervalChipTextSelected,
                            ]}
                          >
                            {days === 1 ? '1 day' : `${days} days`} before
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </Card>

            {/* Quiet Hours */}
            <Card variant="entry" style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quiet Hours</Text>
                <Switch
                  value={settings.quietHours.enabled}
                  onValueChange={(enabled) => {
                    const updatedSettings = {
                      ...settings,
                      quietHours: {
                        ...settings.quietHours,
                        enabled,
                      },
                    };
                    saveSettings(updatedSettings);
                  }}
                  trackColor={{ false: theme.colors.gray.light, true: theme.colors.primary }}
                  thumbColor={theme.colors.background}
                />
              </View>

              {settings.quietHours.enabled && (
                <View style={styles.quietHoursContainer}>
                  <Text style={styles.intervalLabel}>
                    Delay notifications during:
                  </Text>
                  
                  <View style={styles.timePickerContainer}>
                    <TouchableOpacity
                      style={styles.timePicker}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={styles.timePickerLabel}>Start:</Text>
                      <Text style={styles.timePickerValue}>{settings.quietHours.startTime}</Text>
                    </TouchableOpacity>

                    <Text style={styles.timePickerSeparator}>to</Text>

                    <TouchableOpacity
                      style={styles.timePicker}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Text style={styles.timePickerLabel}>End:</Text>
                      <Text style={styles.timePickerValue}>{settings.quietHours.endTime}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.quietHoursNote}>
                    Notifications during quiet hours will be delayed until the end time.
                  </Text>
                </View>
              )}
            </Card>

            {/* Statistics */}
            {storageStats && (
              <Card variant="entry" style={styles.card}>
                <Text style={styles.sectionTitle}>Notification Status</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{storageStats.activeScheduled}</Text>
                    <Text style={styles.statLabel}>Active reminders</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{storageStats.systemScheduledCount}</Text>
                    <Text style={styles.statLabel}>System scheduled</Text>
                  </View>
                  {storageStats.lastRefresh && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {new Date(storageStats.lastRefresh).toLocaleDateString()}
                      </Text>
                      <Text style={styles.statLabel}>Last updated</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Testing Section */}
            <Card variant="entry" style={styles.card}>
              <Text style={styles.sectionTitle}>Testing</Text>
              <View style={styles.testingContainer}>
                <Button
                  title="Send Test Notification"
                  onPress={sendTestNotification}
                  variant="outline"
                  style={styles.testButton}
                />
                {__DEV__ && (
                  <Button
                    title="Clear All Notifications"
                    onPress={clearAllNotifications}
                    variant="outline"
                    style={styles.testButton}
                  />
                )}
              </View>
            </Card>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${settings.quietHours.startTime}:00`)}
          mode="time"
          is24Hour={true}
          onChange={(event, time) => handleTimeChange('start', event, time)}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${settings.quietHours.endTime}:00`)}
          mode="time"
          is24Hour={true}
          onChange={(event, time) => handleTimeChange('end', event, time)}
        />
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <LoadingSpinner size="large" />
          <Text style={styles.savingText}>Updating notifications...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5EE',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  card: {
    margin: theme.spacing[4],
    marginBottom: theme.spacing[2],
    padding: theme.spacing[4],
  },

  // Master Toggle
  masterToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  masterToggleInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  masterToggleTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  masterToggleDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Permission Status
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },

  // Intervals
  intervalContainer: {
    marginTop: theme.spacing[3],
  },
  intervalLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  intervalChip: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.spacing[5],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background,
  },
  intervalChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  intervalChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  intervalChipTextSelected: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Event Reminders
  eventReminderContainer: {
    marginTop: theme.spacing[3],
  },

  // Quiet Hours
  quietHoursContainer: {
    marginTop: theme.spacing[3],
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.spacing[2],
    backgroundColor: theme.colors.background,
  },
  timePickerLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
  },
  timePickerValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  timePickerSeparator: {
    marginHorizontal: theme.spacing[3],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  quietHoursNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing[3],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[1],
  },

  // Testing
  testingContainer: {
    marginTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  testButton: {
    marginBottom: theme.spacing[2],
  },

  // Saving Overlay
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  bottomSpacer: {
    height: 50,
  },
});