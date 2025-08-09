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
  Dashboard: undefined;
  CME: undefined;
  Vault: undefined;
  Settings: undefined;
};

export type CMEStackParamList = {
  CMEHistory: undefined;
  AddCME: { editEntry?: any };
  CMEDetails: { entryId: number };
};

export type VaultStackParamList = {
  CertificateVault: undefined;
  CertificateScanner: undefined;
  CertificateDetails: { certificateId: number };
};

export type SettingsStackParamList = {
  Settings: undefined;
  LicenseManagement: undefined;
  DataExport: undefined;
  About: undefined;
};