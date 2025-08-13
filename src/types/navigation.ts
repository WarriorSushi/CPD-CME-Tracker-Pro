// Navigation types for CME Tracker
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Profession: undefined;
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
    editEntry?: any;
    ocrData?: {
      title?: string;
      provider?: string;
      date?: string;
      credits?: string;
      category?: string;
      certificatePath?: string;
    };
  };
  AddLicense: undefined;
  AddReminder: undefined;
  CertificateViewer: { imageUri: string };
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