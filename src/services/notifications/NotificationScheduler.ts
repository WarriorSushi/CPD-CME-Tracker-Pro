// Notification scheduling logic and calculations
import { 
  ScheduledNotification, 
  NotificationType, 
  NotificationSettings,
  NotificationData
} from './NotificationTypes';
import { User, LicenseRenewal, CMEEventReminder } from '../../types';
import { getCreditUnit } from '../../utils/creditTerminology';

export class NotificationScheduler {
  /**
   * Calculate cycle ending notifications based on user data
   */
  static calculateCycleEndingNotifications(
    user: User,
    currentProgress: number,
    settings: NotificationSettings
  ): ScheduledNotification[] {
    if (!settings.enabled || !settings.cycleReminders.enabled || !user.cycleEndDate) {
      return [];
    }

    const notifications: ScheduledNotification[] = [];
    const cycleEndDate = new Date(user.cycleEndDate);

    // Validate date - prevent crash on invalid dates
    if (isNaN(cycleEndDate.getTime())) {
      __DEV__ && console.warn('[WARN] NotificationScheduler: Invalid cycle end date:', user.cycleEndDate);
      return [];
    }

    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const remaining = Math.max(0, (user.annualRequirement || 0) - currentProgress);

    settings.cycleReminders.intervals.forEach(days => {
      const notificationDate = new Date(cycleEndDate);
      notificationDate.setDate(cycleEndDate.getDate() - days);
      
      // Only schedule future notifications
      if (notificationDate > new Date()) {
        const progressPercent = user.annualRequirement ? 
          Math.round((currentProgress / user.annualRequirement) * 100) : 0;

        const { title, body } = this.generateCycleEndingContent(
          days, 
          progressPercent, 
          remaining, 
          creditUnit
        );

        const notification: ScheduledNotification = {
          id: this.generateNotificationId(NotificationType.CYCLE_ENDING, user.id?.toString() || '1', days),
          type: NotificationType.CYCLE_ENDING,
          title,
          body,
          scheduledFor: this.adjustForQuietHours(notificationDate, settings),
          data: {
            type: NotificationType.CYCLE_ENDING,
            userId: user.id,
            daysRemaining: days,
            currentProgress: progressPercent,
            creditsRemaining: remaining,
            creditUnit
          } as NotificationData,
          isActive: true,
          createdAt: new Date(),
        };

        notifications.push(notification);
      }
    });

    return notifications;
  }

  /**
   * Calculate license expiring notifications
   */
  static calculateLicenseExpiringNotifications(
    licenses: LicenseRenewal[],
    settings: NotificationSettings
  ): ScheduledNotification[] {
    if (!settings.enabled || !settings.licenseReminders.enabled) {
      return [];
    }

    const notifications: ScheduledNotification[] = [];

    licenses.forEach(license => {
      if (license.status !== 'active') return;

      // Validate expiration date exists
      if (!license.expirationDate) {
        __DEV__ && console.warn('[WARN] NotificationScheduler: License missing expiration date:', license.id);
        return;
      }

      const expiryDate = new Date(license.expirationDate);

      // Validate date - prevent crash on invalid dates
      if (isNaN(expiryDate.getTime())) {
        __DEV__ && console.warn('[WARN] NotificationScheduler: Invalid license expiration date:', license.expirationDate);
        return;
      }

      settings.licenseReminders.intervals.forEach(days => {
        const notificationDate = new Date(expiryDate);
        notificationDate.setDate(expiryDate.getDate() - days);

        // Only schedule future notifications
        if (notificationDate > new Date()) {
          const { title, body } = this.generateLicenseExpiringContent(
            license,
            days
          );

          const notification: ScheduledNotification = {
            id: this.generateNotificationId(NotificationType.LICENSE_EXPIRING, license.id.toString(), days),
            type: NotificationType.LICENSE_EXPIRING,
            title,
            body,
            scheduledFor: this.adjustForQuietHours(notificationDate, settings),
            data: {
              type: NotificationType.LICENSE_EXPIRING,
              entityId: license.id.toString(),
              licenseType: license.licenseType,
              issuingAuthority: license.issuingAuthority,
              daysRemaining: days,
              expirationDate: license.expirationDate,
              requiredCredits: license.requiredCredits,
              completedCredits: license.completedCredits
            } as NotificationData,
            isActive: true,
            createdAt: new Date(),
          };

          notifications.push(notification);
        }
      });
    });

    return notifications;
  }

  /**
   * Calculate CME event reminder notifications
   */
  static calculateEventReminders(
    events: CMEEventReminder[],
    settings: NotificationSettings
  ): ScheduledNotification[] {
    if (!settings.enabled || !settings.eventReminders.enabled) {
      return [];
    }

    const notifications: ScheduledNotification[] = [];

    events.forEach(event => {
      // Validate event date exists
      if (!event.eventDate) {
        __DEV__ && console.warn('[WARN] NotificationScheduler: Event missing date:', event.id);
        return;
      }

      const eventDate = new Date(event.eventDate);

      // Validate date - prevent crash on invalid dates
      if (isNaN(eventDate.getTime())) {
        __DEV__ && console.warn('[WARN] NotificationScheduler: Invalid event date:', event.eventDate);
        return;
      }

      const reminderDate = new Date(eventDate);
      reminderDate.setDate(eventDate.getDate() - settings.eventReminders.defaultInterval);

      // Only schedule future notifications
      if (reminderDate > new Date()) {
        const { title, body } = this.generateEventReminderContent(
          event,
          settings.eventReminders.defaultInterval
        );

        const notification: ScheduledNotification = {
          id: this.generateNotificationId(NotificationType.CME_EVENT_REMINDER, event.id.toString(), settings.eventReminders.defaultInterval),
          type: NotificationType.CME_EVENT_REMINDER,
          title,
          body,
          scheduledFor: this.adjustForQuietHours(reminderDate, settings),
          data: {
            type: NotificationType.CME_EVENT_REMINDER,
            entityId: event.id.toString(),
            eventName: event.eventName,
            eventDate: event.eventDate,
            daysRemaining: settings.eventReminders.defaultInterval
          } as NotificationData,
          isActive: true,
          createdAt: new Date(),
        };

        notifications.push(notification);
      }
    });

    return notifications;
  }

  /**
   * Generate notification content for cycle ending reminders
   */
  private static generateCycleEndingContent(
    days: number,
    progressPercent: number,
    remaining: number,
    creditUnit: string
  ): { title: string; body: string } {
    let title = `${creditUnit} Cycle Reminder`;
    let body = '';

    if (days === 1) {
      title = `${creditUnit} Cycle Ends Tomorrow!`;
    } else if (days <= 7) {
      title = `${creditUnit} Cycle Ending Soon`;
    }

    if (progressPercent >= 100) {
      body = `Congratulations! You've completed your ${creditUnit} requirements for this cycle.`;
    } else if (progressPercent >= 80) {
      body = `Great progress! You're ${progressPercent}% complete with ${remaining} ${creditUnit.toLowerCase()}s remaining. Cycle ends in ${days} day${days !== 1 ? 's' : ''}.`;
    } else if (progressPercent >= 50) {
      body = `You're ${progressPercent}% complete. Keep going! ${remaining} ${creditUnit.toLowerCase()}s needed. Cycle ends in ${days} day${days !== 1 ? 's' : ''}.`;
    } else {
      body = `Action needed: Your ${creditUnit} cycle ends in ${days} day${days !== 1 ? 's' : ''}. You still need ${remaining} ${creditUnit.toLowerCase()}s (${progressPercent}% complete).`;
    }

    return { title, body };
  }

  /**
   * Generate notification content for license expiring reminders
   */
  private static generateLicenseExpiringContent(
    license: LicenseRenewal,
    days: number
  ): { title: string; body: string } {
    let title = 'License Renewal Reminder';
    let body = '';

    if (days === 1) {
      title = 'License Expires Tomorrow!';
      body = `Your ${license.licenseType} license expires tomorrow. Don't forget to renew it.`;
    } else if (days <= 7) {
      title = 'License Renewal Due Soon';
      body = `Your ${license.licenseType} license expires in ${days} days. Time to start the renewal process.`;
    } else if (days <= 30) {
      title = 'License Renewal Reminder';
      body = `Your ${license.licenseType} license expires in ${days} days. Consider starting your renewal application.`;
    } else {
      title = 'Upcoming License Renewal';
      body = `Your ${license.licenseType} license expires in ${days} days. Mark your calendar for renewal.`;
    }

    return { title, body };
  }

  /**
   * Generate notification content for event reminders
   */
  private static generateEventReminderContent(
    event: CMEEventReminder,
    days: number
  ): { title: string; body: string } {
    let title = 'CME Event Reminder';
    let body = '';

    if (days === 1) {
      title = 'CME Event Tomorrow';
      body = `Don't forget: "${event.eventName}" is tomorrow!`;
    } else {
      title = 'Upcoming CME Event';
      body = `Reminder: "${event.eventName}" is in ${days} day${days !== 1 ? 's' : ''}.`;
    }

    return { title, body };
  }

  /**
   * Check if a given time is within quiet hours
   */
  static isWithinQuietHours(date: Date, settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) {
      return false;
    }

    const time = date.getHours() * 100 + date.getMinutes();
    const startTime = this.timeStringToNumber(settings.quietHours.startTime);
    const endTime = this.timeStringToNumber(settings.quietHours.endTime);

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return time >= startTime || time <= endTime;
    } else {
      return time >= startTime && time <= endTime;
    }
  }

  /**
   * Adjust notification time to avoid quiet hours
   */
  static adjustForQuietHours(date: Date, settings: NotificationSettings): Date {
    if (!this.isWithinQuietHours(date, settings)) {
      return date;
    }

    const adjustedDate = new Date(date);
    const endTime = this.timeStringToNumber(settings.quietHours.endTime);
    const endHour = Math.floor(endTime / 100);
    const endMinute = endTime % 100;

    // Set to end of quiet hours
    adjustedDate.setHours(endHour, endMinute, 0, 0);

    // If the adjusted time is in the past, set to next day
    if (adjustedDate <= new Date()) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }

    return adjustedDate;
  }

  /**
   * Convert time string (HH:MM) to number (HHMM)
   */
  private static timeStringToNumber(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Generate unique notification ID
   */
  static generateNotificationId(type: NotificationType, entityId: string, daysBefore: number): string {
    return `${type}_${entityId}_${daysBefore}days`;
  }

  /**
   * Check if we should prefer business hours for notifications
   */
  static adjustForBusinessHours(date: Date): Date {
    const day = date.getDay();
    const hour = date.getHours();

    // If it's weekend or outside business hours (9 AM - 6 PM), adjust to next business day at 9 AM
    if (day === 0 || day === 6 || hour < 9 || hour >= 18) {
      const adjustedDate = new Date(date);
      
      // Find next Monday if it's weekend
      if (day === 0) { // Sunday
        adjustedDate.setDate(date.getDate() + 1);
      } else if (day === 6) { // Saturday
        adjustedDate.setDate(date.getDate() + 2);
      }
      
      // Set to 9 AM
      adjustedDate.setHours(9, 0, 0, 0);
      
      return adjustedDate;
    }

    return date;
  }
}