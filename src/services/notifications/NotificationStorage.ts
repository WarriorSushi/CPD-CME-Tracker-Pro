// Notification storage management using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduledNotification, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from './NotificationTypes';

const STORAGE_KEYS = {
  SCHEDULED_NOTIFICATIONS: '@cme_tracker_scheduled_notifications',
  NOTIFICATION_SETTINGS: '@cme_tracker_notification_settings',
  LAST_REFRESH: '@cme_tracker_notifications_last_refresh',
} as const;

export class NotificationStorage {
  /**
   * Save a scheduled notification
   */
  static async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const existing = await this.getScheduledNotifications();
      const updated = existing.filter(n => n.id !== notification.id);
      updated.push(notification);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(updated)
      );

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error saving notification:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored) as ScheduledNotification[];
      
      // Convert date strings back to Date objects
      return notifications.map(notification => ({
        ...notification,
        scheduledFor: new Date(notification.scheduledFor),
        createdAt: new Date(notification.createdAt),
      }));
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Remove a scheduled notification
   */
  static async removeScheduledNotification(id: string): Promise<void> {
    try {
      const existing = await this.getScheduledNotifications();
      const filtered = existing.filter(n => n.id !== id);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(filtered)
      );

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error removing notification:', error);
      throw error;
    }
  }

  /**
   * Clear all scheduled notifications
   */
  static async clearAllScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error clearing notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(type: string): Promise<ScheduledNotification[]> {
    const all = await this.getScheduledNotifications();
    return all.filter(n => n.type === type);
  }

  /**
   * Get active notifications (not expired)
   */
  static async getActiveNotifications(): Promise<ScheduledNotification[]> {
    const all = await this.getScheduledNotifications();
    const now = new Date();
    return all.filter(n => n.isActive && n.scheduledFor > now);
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const all = await this.getScheduledNotifications();
      const now = new Date();
      const active = all.filter(n => n.scheduledFor > now);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(active)
      );
      
      const removed = all.length - active.length;
      if (removed > 0) {

      }
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error cleaning notifications:', error);
    }
  }

  /**
   * Save notification settings
   */
  static async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(settings)
      );

    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (!stored) {
        // Return default settings and save them
        await this.saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
        return DEFAULT_NOTIFICATION_SETTINGS;
      }
      
      const settings = JSON.parse(stored) as NotificationSettings;
      
      // Merge with defaults to handle any missing properties from app updates
      const merged = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...settings,
        cycleReminders: {
          ...DEFAULT_NOTIFICATION_SETTINGS.cycleReminders,
          ...settings.cycleReminders,
        },
        licenseReminders: {
          ...DEFAULT_NOTIFICATION_SETTINGS.licenseReminders,
          ...settings.licenseReminders,
        },
        eventReminders: {
          ...DEFAULT_NOTIFICATION_SETTINGS.eventReminders,
          ...settings.eventReminders,
        },
        quietHours: {
          ...DEFAULT_NOTIFICATION_SETTINGS.quietHours,
          ...settings.quietHours,
        },
      };
      
      return merged;
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error getting settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  /**
   * Save last refresh timestamp
   */
  static async saveLastRefresh(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_REFRESH,
        new Date().toISOString()
      );
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error saving last refresh:', error);
    }
  }

  /**
   * Get last refresh timestamp
   */
  static async getLastRefresh(): Promise<Date | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REFRESH);
      return stored ? new Date(stored) : null;
    } catch (error) {
      __DEV__ && console.error('[ERROR] NotificationStorage: Error getting last refresh:', error);
      return null;
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
  }> {
    const all = await this.getScheduledNotifications();
    const active = await this.getActiveNotifications();
    const lastRefresh = await this.getLastRefresh();
    
    return {
      totalScheduled: all.length,
      activeScheduled: active.length,
      expiredCount: all.length - active.length,
      lastRefresh,
    };
  }
}