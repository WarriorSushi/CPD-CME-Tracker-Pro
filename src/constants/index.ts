// Export all constants
export * from './theme';

// App configuration constants
export const APP_CONFIG = {
  NAME: 'CPD/CME Tracker',
  VERSION: '1.0.0',
  DATABASE_VERSION: 1,
  DATABASE_NAME: 'cme_tracker.db',
} as const;

// Storage keys for AsyncStorage and SecureStore
export const STORAGE_KEYS = {
  // AsyncStorage keys
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_PREFERENCES: 'user_preferences',
  APP_SETTINGS: 'app_settings',
  THEME_PREFERENCE: 'theme_preference',
  
  // SecureStore keys
  USER_DATA: 'user_data',
  LICENSE_INFO: 'license_info',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// File system paths
export const FILE_PATHS = {
  CERTIFICATES: 'certificates/',
  THUMBNAILS: 'certificates/thumbnails/',
  BACKUPS: 'backups/',
  TEMP: 'temp/',
} as const;

// Categories for CME entries
export const CME_CATEGORIES = [
  'Conference',
  'Workshop',
  'Online Course',
  'Webinar',
  'Journal Reading',
  'Research',
  'Teaching',
  'Committee Work',
  'Quality Improvement',
  'Patient Safety',
  'Ethics',
  'Other',
] as const;

// Default credit requirements by profession
export const DEFAULT_CREDIT_REQUIREMENTS = {
  Physician: { CME: 50, CPD: 50, CE: 50, Hours: 50, Points: 50 },
  Nurse: { CME: 24, CPD: 24, CE: 24, Hours: 24, Points: 24 },
  Pharmacist: { CME: 30, CPD: 30, CE: 30, Hours: 30, Points: 30 },
  'Allied Health': { CME: 24, CPD: 24, CE: 24, Hours: 24, Points: 24 },
  Other: { CME: 24, CPD: 24, CE: 24, Hours: 24, Points: 24 },
} as const;

// Countries/regions
export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'New Zealand',
  'Ireland',
  'South Africa',
  'Other',
] as const;

// Notification intervals (in days)
export const NOTIFICATION_INTERVALS = [90, 60, 30, 14, 7, 1] as const;

// File type constants
export const SUPPORTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/jpg'],
  DOCUMENTS: ['application/pdf'],
  ALL: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
} as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
} as const;

// OCR configuration
export const OCR_CONFIG = {
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_PROCESSING_TIME: 10000, // 10 seconds
} as const;

// Animation constants
export const ANIMATION_CONFIG = {
  BUTTON_PRESS: {
    duration: 200,
    easing: 'ease-out',
  },
  PAGE_TRANSITION: {
    duration: 300,
    easing: 'ease-in-out',
  },
  LOADING: {
    duration: 1000,
    easing: 'ease-in-out',
  },
} as const;

// Progress thresholds
export const PROGRESS_THRESHOLDS = {
  ON_TRACK: 0.8, // 80% completion with 20% time remaining is on track
  BEHIND: 0.9, // Less than 90% completion with less than 10% time remaining is behind
} as const;