// Main notification service controller
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { 
  ScheduledNotification, 
  NotificationSettings, 
  NotificationType,
  NotificationPriority,
  DEFAULT_NOTIFICATION_SETTINGS
} from './NotificationTypes';
import { NotificationPermissions } from './NotificationPermissions';
import { NotificationStorage } from './NotificationStorage';
import { NotificationScheduler } from './NotificationScheduler';
import { User, LicenseRenewal, CMEEventReminder } from '../../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static initialized = false;
  private static isRefreshing = false;

  /**
   * Initialize the notification service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔔 NotificationService: Initializing...');

      // Configure notification categories and actions
      await this.setupNotificationCategories();

      // Clean up any expired notifications
      await NotificationStorage.cleanupExpiredNotifications();

      // Set up notification response handlers
      this.setupNotificationHandlers();

      this.initialized = true;
      console.log('✅ NotificationService: Initialized successfully');
    } catch (error) {
      console.error('💥 NotificationService: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup notification categories with actions
   */
  private static async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('cycle_ending', [
        {
          identifier: 'view_progress',
          buttonTitle: 'View Progress',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'add_entry',
          buttonTitle: 'Add Entry',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('license_expiring', [
        {
          identifier: 'view_license',
          buttonTitle: 'View License',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'set_reminder',
          buttonTitle: 'Remind Later',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('cme_event', [
        {
          identifier: 'view_event',
          buttonTitle: 'View Event',
          options: { opensAppToForeground: true },
        },
      ]);

      console.log('✅ NotificationService: Categories configured');
    } catch (error) {
      console.error('💥 NotificationService: Error setting up categories:', error);
    }
  }

  /**
   * Setup notification response handlers
   */
  private static setupNotificationHandlers(): void {
    // Handle notification received while app is open
    Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 NotificationService: Notification received:', notification.request.identifier);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 NotificationService: Notification tapped:', response.actionIdentifier);
      
      const { notification } = response;
      const data = notification.request.content.data;
      
      // Handle different action types
      switch (response.actionIdentifier) {
        case 'view_progress':
          // Navigate to dashboard
          break;
        case 'add_entry':
          // Navigate to add CME screen
          break;
        case 'view_license':
          // Navigate to license details
          break;
        case 'view_event':
          // Navigate to event details
          break;
        default:
          // Default action (tapping notification)
          this.handleDefaultNotificationAction(data);
          break;
      }
    });
  }

  /**
   * Handle default notification tap action
   */
  private static handleDefaultNotificationAction(data: any): void {
    // This will be used by the app's navigation system
    console.log('🎯 NotificationService: Handling default action for:', data.type);
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    return await NotificationPermissions.requestPermissions();
  }

  /**
   * Check if notifications are enabled
   */
  static async hasPermissions(): Promise<boolean> {
    return await NotificationPermissions.hasPermissions();
  }

  /**
   * Ensure permissions are granted
   */
  static async ensurePermissions(): Promise<boolean> {
    return await NotificationPermissions.ensurePermissions();
  }

  /**
   * Schedule a single notification
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.warn('⚠️ NotificationService: Cannot schedule - no permissions');
        return '';
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          categoryIdentifier: this.getCategoryForType(notification.type),
          priority: this.getPriorityForType(notification.type),
          sound: 'default',
        },
        trigger: {
          type: 'date',
          date: notification.scheduledFor,
        },
      });

      // Store in our local storage
      await NotificationStorage.saveScheduledNotification(notification);

      console.log(`✅ NotificationService: Scheduled notification ${notification.id} for ${notification.scheduledFor}`);
      return notificationId;
    } catch (error) {
      console.error('💥 NotificationService: Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      await NotificationStorage.removeScheduledNotification(id);
      console.log(`🗑️ NotificationService: Cancelled notification ${id}`);
    } catch (error) {
      console.error('💥 NotificationService: Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await NotificationStorage.clearAllScheduledNotifications();
      console.log('🗑️ NotificationService: Cancelled all notifications');
    } catch (error) {
      console.error('💥 NotificationService: Error cancelling all notifications:', error);
    }
  }

  /**
   * Refresh all notifications based on current data
   */
  static async refreshAllNotifications(
    user?: User,
    licenses?: LicenseRenewal[],
    events?: CMEEventReminder[],
    currentProgress?: number
  ): Promise<void> {
    if (this.isRefreshing) {
      console.log('⏳ NotificationService: Refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 NotificationService: Refreshing all notifications...');

      const settings = await this.getSettings();
      if (!settings.enabled) {
        console.log('⚠️ NotificationService: Notifications disabled, clearing all');
        await this.cancelAllNotifications();
        return;
      }

      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.log('⚠️ NotificationService: No permissions, cannot schedule notifications');
        return;
      }

      // Cancel all existing notifications
      await this.cancelAllNotifications();

      const allNotifications: ScheduledNotification[] = [];

      // Generate cycle ending notifications
      if (user && currentProgress !== undefined) {
        const cycleNotifications = NotificationScheduler.calculateCycleEndingNotifications(
          user,
          currentProgress,
          settings
        );
        allNotifications.push(...cycleNotifications);
      }

      // Generate license expiring notifications
      if (licenses && licenses.length > 0) {
        const licenseNotifications = NotificationScheduler.calculateLicenseExpiringNotifications(
          licenses,
          settings
        );
        allNotifications.push(...licenseNotifications);
      }

      // Generate event reminder notifications
      if (events && events.length > 0) {
        const eventNotifications = NotificationScheduler.calculateEventReminders(
          events,
          settings
        );
        allNotifications.push(...eventNotifications);
      }

      // Schedule all notifications
      let scheduledCount = 0;
      for (const notification of allNotifications) {
        try {
          await this.scheduleNotification(notification);
          scheduledCount++;
        } catch (error) {
          console.error(`💥 NotificationService: Failed to schedule notification ${notification.id}:`, error);
        }
      }

      await NotificationStorage.saveLastRefresh();

      console.log(`✅ NotificationService: Refreshed notifications - ${scheduledCount}/${allNotifications.length} scheduled`);
    } catch (error) {
      console.error('💥 NotificationService: Error refreshing notifications:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get notification settings
   */
  static async getSettings(): Promise<NotificationSettings> {
    return await NotificationStorage.getNotificationSettings();
  }

  /**
   * Update notification settings
   */
  static async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await NotificationStorage.saveNotificationSettings(updated);
      
      console.log('✅ NotificationService: Settings updated');
      
      // Refresh notifications with new settings
      // Note: This should be called by the app after updating settings with current data
    } catch (error) {
      console.error('💥 NotificationService: Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Show a test notification immediately
   */
  static async showTestNotification(): Promise<void> {
    try {
      const hasPermissions = await this.ensurePermissions();
      if (!hasPermissions) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'This is a test notification from CME Tracker. Your notifications are working correctly!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });

      console.log('✅ NotificationService: Test notification sent');
    } catch (error) {
      console.error('💥 NotificationService: Error sending test notification:', error);
    }
  }

  /**
   * Get category identifier for notification type
   */
  private static getCategoryForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.CYCLE_ENDING:
        return 'cycle_ending';
      case NotificationType.LICENSE_EXPIRING:
        return 'license_expiring';
      case NotificationType.CME_EVENT_REMINDER:
        return 'cme_event';
      default:
        return 'default';
    }
  }

  /**
   * Get priority for notification type
   */
  private static getPriorityForType(type: NotificationType): Notifications.AndroidNotificationPriority {
    switch (type) {
      case NotificationType.CYCLE_ENDING:
        return Notifications.AndroidNotificationPriority.HIGH;
      case NotificationType.LICENSE_EXPIRING:
        return Notifications.AndroidNotificationPriority.HIGH;
      case NotificationType.CME_EVENT_REMINDER:
        return Notifications.AndroidNotificationPriority.DEFAULT;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalScheduled: number;
    activeScheduled: number;
    expiredCount: number;
    lastRefresh: Date | null;
    systemScheduledCount: number;
  }> {
    const storageStats = await NotificationStorage.getStorageStats();
    
    let systemScheduledCount = 0;
    try {
      const systemNotifications = await Notifications.getAllScheduledNotificationsAsync();
      systemScheduledCount = systemNotifications.length;
    } catch (error) {
      console.error('💥 NotificationService: Error getting system notifications:', error);
    }

    return {
      ...storageStats,
      systemScheduledCount,
    };
  }

  /**
   * Check if service is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}