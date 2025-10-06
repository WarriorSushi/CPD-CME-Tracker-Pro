// Navigation types for CPD & CME Tracker
import { CMEEntry } from './index';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Features: undefined;
  Privacy: undefined;
  Profession: undefined;
  Country: undefined;
  CreditSystem: undefined;
  AnnualTarget: undefined;
  CycleStartDate: undefined;
  LicenseSetup: { cycleStartDate?: string; syncWithLicense?: boolean } | undefined;
  SetupComplete: undefined;
};

export type MainTabParamList = {
  Tabs: { screen?: keyof TabParamList } | undefined;
  Dashboard: undefined;
  CME: undefined;
  Vault: undefined;
  Settings: undefined;
  AddCME: {
    editEntry?: CMEEntry;
    ocrData?: {
      title?: string;
      provider?: string;
      date?: string;
      credits?: number;
      category?: string;
      certificatePath?: string;
    };
  } | undefined;
  AddLicense: { editLicense?: any } | undefined;
  AddReminder: undefined;
  CertificateViewer: { imageUri: string };
  ProfileEdit: undefined;
  NotificationSettings: undefined;
  CMEHistory: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  CME: undefined;
  Vault: undefined;
  Settings: undefined;
};

export type CMEStackParamList = {
  CMEHistory: undefined;
  CMEDetails: { entryId: number };
  AddCME: { 
    editEntry?: CMEEntry;
    ocrData?: {
      title?: string;
      provider?: string;
      date?: string;
      credits?: number;
      category?: string;
      certificatePath?: string;
    };
  };
};

export type VaultStackParamList = {
  CertificateVault: undefined;
  CertificateScanner: undefined;
  CertificateDetails: { certificateId: number };
};

export type SettingsStackParamList = {
  Settings: undefined;
  AddLicense: undefined;
  LicenseManagement: undefined;
  DataExport: undefined;
  About: undefined;
};