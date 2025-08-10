// Core types for CME Tracker

export interface User {
  id: number;
  profession: string;
  creditSystem: CreditSystem;
  annualRequirement: number;
  requirementPeriod: number; // Period in years (1, 2, 3, 5, etc.)
  cycleStartDate?: string; // When their current requirement cycle started
  cycleEndDate?: string; // When their current requirement cycle ends
  createdAt: string;
}

export interface CMEEntry {
  id: number;
  title: string;
  provider: string;
  dateAttended: string;
  creditsEarned: number;
  category: string;
  notes?: string;
  certificatePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath?: string;
  cmeEntryId?: number;
  createdAt: string;
}

export interface LicenseRenewal {
  id: number;
  licenseType: string;
  issuingAuthority: string;
  licenseNumber?: string;
  expirationDate: string;
  renewalDate?: string;
  requiredCredits: number;
  completedCredits: number;
  status: LicenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

// Enums
export type CreditSystem = 'CME' | 'CPD' | 'CE' | 'Hours' | 'Points';
export type LicenseStatus = 'active' | 'expired' | 'pending_renewal' | 'suspended';
export type NotificationInterval = 90 | 60 | 30 | 14 | 7 | 1;

// Profession types
export type Profession = 
  | 'Physician'
  | 'Nurse'
  | 'Pharmacist'
  | 'Allied Health'
  | 'Other';

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  AddCME: { 
    editEntry?: CMEEntry; 
    ocrData?: {
      title?: string;
      provider?: string;
      date?: string;
      credits?: string;
      category?: string;
      certificatePath?: string;
    };
  };
  CMEHistory: undefined;
  CMEDetails: { entryId: number };
  CertificateVault: undefined;
  CertificateScanner: undefined;
  LicenseRenewal: undefined;
  Settings: undefined;
};

// Form types
export interface CMEEntryForm {
  title: string;
  provider: string;
  dateAttended: Date;
  creditsEarned: string;
  category: string;
  notes: string;
}

export interface OnboardingData {
  profession: Profession;
  country: string;
  creditSystem: CreditSystem;
  annualRequirement: number;
  licenses: LicenseRenewal[];
}

// Database operation types
export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// OCR types
export interface OCRResult {
  text: string;
  confidence: number;
  extractedData?: {
    title?: string;
    provider?: string;
    date?: string;
    credits?: number;
    category?: string;
  };
}

// File types
export interface FileInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// Progress tracking
export interface Progress {
  totalRequired: number;
  totalCompleted: number;
  percentage: number;
  remainingDays: number;
  status: 'on_track' | 'behind' | 'completed' | 'overdue';
}

// Notification types
export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: {
    licenseId?: number;
    entryId?: number;
    type: 'license_renewal' | 'cme_deadline' | 'general';
  };
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing?: 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

// Theme related types (extending the theme.ts types)
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Export navigation types
export * from './navigation';