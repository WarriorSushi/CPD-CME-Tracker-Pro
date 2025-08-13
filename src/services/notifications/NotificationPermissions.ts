// Notification permissions management
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { PermissionStatus } from './NotificationTypes';

export class NotificationPermissions {
  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔔 NotificationPermissions: Requesting permissions...');
      
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });

      const granted = status === 'granted';
      console.log('🔔 NotificationPermissions: Permission result:', status);
      return granted;
    } catch (error) {
      console.error('💥 NotificationPermissions: Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get current permission status
   */
  static async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.status as PermissionStatus;
    } catch (error) {
      console.error('💥 NotificationPermissions: Error getting permission status:', error);
      return 'undetermined';
    }
  }

  /**
   * Check if permissions are granted
   */
  static async hasPermissions(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'granted';
  }

  /**
   * Show permission prompt with explanation
   */
  static async showPermissionPrompt(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Notifications',
        'Stay on top of your CME requirements with timely reminders for:\n\n' +
        '• Cycle ending deadlines\n' +
        '• License renewal dates\n' +
        '• Upcoming CME events\n\n' +
        'You can always change this later in Settings.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const granted = await this.requestPermissions();
              resolve(granted);
            },
          },
        ]
      );
    });
  }

  /**
   * Show alert to open system settings if permissions were denied
   */
  static async showPermissionDeniedAlert(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Notifications Disabled',
        'To receive important reminders about your CME progress and license renewals, please enable notifications in your device settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await this.openAppSettings();
              resolve();
            },
          },
        ]
      );
    });
  }

  /**
   * Open app settings for notification permissions
   */
  static async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('💥 NotificationPermissions: Error opening settings:', error);
    }
  }

  /**
   * Check and request permissions if needed
   */
  static async ensurePermissions(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    
    switch (status) {
      case 'granted':
        return true;
        
      case 'undetermined':
        return await this.showPermissionPrompt();
        
      case 'denied':
        await this.showPermissionDeniedAlert();
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Check if we should show permission prompt
   */
  static async shouldShowPermissionPrompt(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === 'undetermined';
  }
}