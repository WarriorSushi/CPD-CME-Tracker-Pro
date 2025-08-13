// Notification type definitions for CME Tracker
export enum NotificationType {
  CYCLE_ENDING = 'cycle_ending',
  LICENSE_EXPIRING = 'license_expiring',
  CME_EVENT_REMINDER = 'cme_event_reminder',
  PROGRESS_MILESTONE = 'progress_milestone'
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: Date;
  data: any; // Extra context data
  isActive: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  cycleReminders: {
    enabled: boolean;
    intervals: number[]; // Days before cycle end [90, 60, 30, 14, 7, 1]
  };
  licenseReminders: {
    enabled: boolean;
    intervals: number[]; // Days before license expiry [90, 60, 30, 14, 7, 1]
  };
  eventReminders: {
    enabled: boolean;
    defaultInterval: number; // Days before event [1]
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
  };
}

export interface NotificationAction {
  id: string;
  title: string;
  type?: 'textInput' | 'default';
}

export interface NotificationData {
  type: NotificationType;
  entityId?: string;
  daysRemaining?: number;
  currentProgress?: number;
  licenseType?: string;
  eventName?: string;
  [key: string]: any;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  cycleReminders: {
    enabled: true,
    intervals: [90, 60, 30, 14, 7, 1]
  },
  licenseReminders: {
    enabled: true,
    intervals: [90, 60, 30, 14, 7, 1]
  },
  eventReminders: {
    enabled: true,
    defaultInterval: 1
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
};

// Notification permission status
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// Notification priority levels
export enum NotificationPriority {
  LOW = 'low',
  DEFAULT = 'default', 
  HIGH = 'high'
}