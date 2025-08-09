import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { 
  User, 
  CMEEntry, 
  Certificate, 
  LicenseRenewal, 
  Progress,
  DatabaseOperationResult 
} from '../types';
import { databaseOperations } from '../services/database';

interface AppContextType {
  // User data
  user: User | null;
  
  // CME data
  cmeEntries: CMEEntry[];
  totalCredits: number;
  currentYearProgress: Progress | null;
  
  // Certificates
  certificates: Certificate[];
  
  // Licenses
  licenses: LicenseRenewal[];
  
  // Loading states
  isLoadingUser: boolean;
  isLoadingCME: boolean;
  isLoadingCertificates: boolean;
  isLoadingLicenses: boolean;
  
  // Actions
  refreshUserData: () => Promise<void>;
  refreshCMEData: () => Promise<void>;
  refreshCertificates: () => Promise<void>;
  refreshLicenses: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // CME actions
  addCMEEntry: (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCMEEntry: (id: number, entry: Partial<CMEEntry>) => Promise<boolean>;
  deleteCMEEntry: (id: number) => Promise<boolean>;
  
  // License actions
  addLicense: (license: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateLicense: (id: number, license: Partial<LicenseRenewal>) => Promise<boolean>;
  deleteLicense: (id: number) => Promise<boolean>;
  
  // User actions
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [cmeEntries, setCMEEntries] = useState<CMEEntry[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [currentYearProgress, setCurrentYearProgress] = useState<Progress | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [licenses, setLicenses] = useState<LicenseRenewal[]>([]);
  
  // Loading states
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingCME, setIsLoadingCME] = useState(true);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);

  // Calculate progress based on current data and user's requirement period
  const calculateProgress = (user: User, totalCredits: number): Progress => {
    const now = new Date();
    const periodYears = user.requirementPeriod || 1;
    
    // Use actual cycle dates if available, otherwise fall back to current year calculation
    let startOfPeriod: Date;
    let endOfPeriod: Date;
    
    if (user.cycleStartDate && user.cycleEndDate) {
      // User has set their actual cycle dates
      startOfPeriod = new Date(user.cycleStartDate);
      endOfPeriod = new Date(user.cycleEndDate);
    } else if (user.cycleStartDate) {
      // User has set start date, calculate end date
      startOfPeriod = new Date(user.cycleStartDate);
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setFullYear(startOfPeriod.getFullYear() + periodYears);
    } else {
      // No cycle dates set, fall back to current year assumption
      const currentYear = now.getFullYear();
      startOfPeriod = new Date(currentYear, 0, 1);
      endOfPeriod = new Date(currentYear + periodYears, 0, 1);
    }
    
    const totalDaysInPeriod = Math.ceil((endOfPeriod.getTime() - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(Math.ceil((endOfPeriod.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    
    const percentage = user.annualRequirement > 0 ? (totalCredits / user.annualRequirement) * 100 : 0;
    const expectedProgress = daysPassed > 0 ? (daysPassed / totalDaysInPeriod) * 100 : 0;
    
    let status: Progress['status'];
    if (percentage >= 100) {
      status = 'completed';
    } else if (percentage >= expectedProgress * 0.8) {
      status = 'on_track';
    } else if (remainingDays <= 0) {
      status = 'overdue';
    } else {
      status = 'behind';
    }
    
    return {
      totalRequired: user.annualRequirement,
      totalCompleted: totalCredits,
      percentage: Math.min(percentage, 100),
      remainingDays,
      status,
    };
  };

  // Data fetching functions
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingUser(true);
      console.log('🔄 AppContext: Refreshing user data...');
      const result = await databaseOperations.user.getCurrentUser();
      console.log('📊 AppContext: User data result:', result);
      if (result.success && result.data) {
        console.log('✅ AppContext: User data loaded:', result.data);
        console.log('🎯 AppContext: Credit system from DB:', result.data?.creditSystem);
        setUser(result.data);
      }
    } catch (error) {
      console.error('💥 AppContext: Error refreshing user data:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const refreshCMEData = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingCME(true);
      
      // Get current user to determine cycle dates
      const userResult = await databaseOperations.user.getCurrentUser();
      const userData = userResult.success ? userResult.data : null;
      
      let startDate: string;
      let endDate: string;
      
      if (userData?.cycleStartDate && userData?.cycleEndDate) {
        startDate = userData.cycleStartDate;
        endDate = userData.cycleEndDate;
      } else if (userData?.cycleStartDate) {
        startDate = userData.cycleStartDate;
        const endDateObj = new Date(userData.cycleStartDate);
        endDateObj.setFullYear(endDateObj.getFullYear() + (userData.requirementPeriod || 1));
        endDate = endDateObj.toISOString().split('T')[0];
      } else {
        // Fall back to current year if no cycle dates set
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
        const periodYears = userData?.requirementPeriod || 1;
        endDate = `${currentYear + periodYears}-01-01`;
      }
      
      const [entriesResult, creditsResult] = await Promise.all([
        databaseOperations.cme.getEntriesInDateRange(startDate, endDate),
        databaseOperations.cme.getTotalCreditsInRange(startDate, endDate),
      ]);
      
      if (entriesResult.success) {
        setCMEEntries(entriesResult.data || []);
      }
      
      if (creditsResult.success) {
        setTotalCredits(creditsResult.data || 0);
      }
    } catch (error) {
      console.error('Error refreshing CME data:', error);
    } finally {
      setIsLoadingCME(false);
    }
  }, []);

  const refreshCertificates = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingCertificates(true);
      const result = await databaseOperations.certificates.getAllCertificates();
      if (result.success) {
        setCertificates(result.data || []);
      }
    } catch (error) {
      console.error('Error refreshing certificates:', error);
    } finally {
      setIsLoadingCertificates(false);
    }
  }, []);

  const refreshLicenses = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingLicenses(true);
      const result = await databaseOperations.licenses.getAllLicenses();
      if (result.success) {
        setLicenses(result.data || []);
      }
    } catch (error) {
      console.error('Error refreshing licenses:', error);
    } finally {
      setIsLoadingLicenses(false);
    }
  }, []);

  const refreshAllData = useCallback(async (): Promise<void> => {
    await Promise.all([
      refreshUserData(),
      refreshCMEData(),
      refreshCertificates(),
      refreshLicenses(),
    ]);
  }, [refreshUserData, refreshCMEData, refreshCertificates, refreshLicenses]);

  // CME Actions
  const addCMEEntry = useCallback(async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      console.log('🗃️ AppContext.addCMEEntry: Attempting to add entry:', entry);
      const result = await databaseOperations.cme.addEntry(entry);
      console.log('🗃️ AppContext.addCMEEntry: Database result:', result);
      
      if (result.success) {
        console.log('✅ AppContext.addCMEEntry: Success! Refreshing CME data...');
        await refreshCMEData();
        return true;
      }
      console.log('❌ AppContext.addCMEEntry: Database operation failed');
      return false;
    } catch (error) {
      console.error('💥 AppContext.addCMEEntry: Exception occurred:', error);
      return false;
    }
  }, [refreshCMEData]);

  const updateCMEEntry = useCallback(async (id: number, entry: Partial<CMEEntry>): Promise<boolean> => {
    try {
      const result = await databaseOperations.cme.updateEntry(id, entry);
      if (result.success) {
        await refreshCMEData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating CME entry:', error);
      return false;
    }
  }, [refreshCMEData]);

  const deleteCMEEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await databaseOperations.cme.deleteEntry(id);
      if (result.success) {
        await refreshCMEData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting CME entry:', error);
      return false;
    }
  }, [refreshCMEData]);

  // License Actions
  const addLicense = useCallback(async (license: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const result = await databaseOperations.licenses.addLicense(license);
      if (result.success) {
        await refreshLicenses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding license:', error);
      return false;
    }
  }, [refreshLicenses]);

  const updateLicense = useCallback(async (id: number, license: Partial<LicenseRenewal>): Promise<boolean> => {
    try {
      const result = await databaseOperations.licenses.updateLicense(id, license);
      if (result.success) {
        await refreshLicenses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating license:', error);
      return false;
    }
  }, [refreshLicenses]);

  const deleteLicense = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await databaseOperations.licenses.deleteLicense(id);
      if (result.success) {
        await refreshLicenses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting license:', error);
      return false;
    }
  }, [refreshLicenses]);

  // User Actions
  const updateUser = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      const result = await databaseOperations.user.updateUser(userData);
      if (result.success) {
        await refreshUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }, [refreshUserData]);

  // Update progress when user or credits change
  useEffect(() => {
    if (user && !isLoadingCME) {
      const progress = calculateProgress(user, totalCredits);
      setCurrentYearProgress(progress);
    }
  }, [user, totalCredits, isLoadingCME]);

  // Initial data load - only once
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      if (mounted) {
        console.log('🔄 AppContext: Loading initial data...');
        await refreshAllData();
        console.log('✅ AppContext: Initial data load complete');
      }
    };
    
    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, []); // Remove refreshAllData dependency to prevent re-runs

  const value = useMemo<AppContextType>(() => ({
    // Data
    user,
    cmeEntries,
    totalCredits,
    currentYearProgress,
    certificates,
    licenses,
    
    // Loading states
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    
    // Refresh functions
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshAllData,
    
    // Actions
    addCMEEntry,
    updateCMEEntry,
    deleteCMEEntry,
    addLicense,
    updateLicense,
    deleteLicense,
    updateUser,
  }), [
    user,
    cmeEntries,
    totalCredits,
    currentYearProgress,
    certificates,
    licenses,
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshAllData,
    addCMEEntry,
    updateCMEEntry,
    deleteCMEEntry,
    addLicense,
    updateLicense,
    deleteLicense,
    updateUser,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};