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

      // Configure notification categories and actions
      await this.setupNotificationCategories();

      // Clean up any expired notifications
      await NotificationStorage.cleanupExpiredNotifications();

      // Set up notification response handlers
      this.setupNotificationHandlers();

      this.initialized = true;

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Initialization failed:', error);
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

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error setting up categories:', error);
    }
  }

  /**
   * Setup notification response handlers
   */
  private static setupNotificationHandlers(): void {
    // Handle notification received while app is open
    Notifications.addNotificationReceivedListener(notification => {

    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {

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
        console.warn('[WARN] NotificationService: Cannot schedule - no permissions');
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
        trigger: notification.scheduledFor as any,
      });

      // Store in our local storage
      await NotificationStorage.saveScheduledNotification(notification);

      return notificationId;
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error scheduling notification:', error);
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

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await NotificationStorage.clearAllScheduledNotifications();

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error cancelling all notifications:', error);
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

      return;
    }

    this.isRefreshing = true;

    try {

      const settings = await this.getSettings();
      if (!settings.enabled) {

        await this.cancelAllNotifications();
        return;
      }

      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {

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
      __DEV__ && console.error(`[ERROR] NotificationService: Failed to schedule notification ${notification.id}:`, error);
        }
      }

      await NotificationStorage.saveLastRefresh();

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error refreshing notifications:', error);
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

      // Refresh notifications with new settings
      // Note: This should be called by the app after updating settings with current data
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error updating settings:', error);
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
          title: '[NOTIF] Test Notification',
          body: 'This is a test notification from CME Tracker. Your notifications are working correctly!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Error sending test notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific license
   */
  static async cancelLicenseNotifications(licenseId: number): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Filter notifications for this license
      const licenseNotifs = allNotifications.filter(n =>
        n.content.data?.type === 'license_renewal' &&
        n.content.data?.licenseId === licenseId
      );

      // Cancel each notification
      for (const notif of licenseNotifs) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }

      __DEV__ && console.log(`[INFO] Cancelled ${licenseNotifs.length} notifications for license ${licenseId}`);
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Failed to cancel license notifications:', error);
    }
  }

  /**
   * Cancel notification for a specific event reminder
   */
  static async cancelEventNotification(reminderId: number): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Filter notifications for this event
      const eventNotifs = allNotifications.filter(n =>
        n.content.data?.type === 'cme_event' &&
        n.content.data?.reminderId === reminderId
      );

      // Cancel each notification
      for (const notif of eventNotifs) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }

      __DEV__ && console.log(`[INFO] Cancelled ${eventNotifs.length} notifications for reminder ${reminderId}`);
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationService: Failed to cancel event notifications:', error);
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
      __DEV__ && console.error('[ERROR] NotificationService: Error getting system notifications:', error);
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