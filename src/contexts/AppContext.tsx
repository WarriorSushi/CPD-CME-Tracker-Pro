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
  
  // CME data (lazy loaded)
  recentCMEEntries: CMEEntry[]; // Last 10 entries for quick access
  totalCredits: number;
  currentYearProgress: Progress | null;
  
  // Certificates (lazy loaded)
  certificates: Certificate[];
  
  // Licenses
  licenses: LicenseRenewal[];
  
  // Enhanced loading states
  isInitializing: boolean; // First-time app setup
  isLoadingUser: boolean;
  isLoadingCME: boolean;
  isLoadingCertificates: boolean;
  isLoadingLicenses: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refreshUserData: () => Promise<void>;
  refreshCMEData: () => Promise<void>;
  refreshCertificates: () => Promise<void>;
  refreshLicenses: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // Lazy loading actions
  loadAllCMEEntries: () => Promise<CMEEntry[]>;
  clearError: () => void;
  
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
  const [recentCMEEntries, setRecentCMEEntries] = useState<CMEEntry[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [currentYearProgress, setCurrentYearProgress] = useState<Progress | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [licenses, setLicenses] = useState<LicenseRenewal[]>([]);
  
  // Enhanced loading states
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingCME, setIsLoadingCME] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Cached user data to reduce database calls
  const [cachedUserData, setCachedUserData] = useState<{ user: User | null; timestamp: number } | null>(null);
  const USER_CACHE_DURATION = 5000; // 5 seconds
  
  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Optimized getCurrentUser with caching
  const getCachedCurrentUser = useCallback(async (): Promise<User | null> => {
    const now = Date.now();
    
    // Return cached data if it's fresh
    if (cachedUserData && (now - cachedUserData.timestamp) < USER_CACHE_DURATION) {
      console.log('💾 AppContext: Using cached user data');
      return cachedUserData.user;
    }
    
    console.log('🔄 AppContext: Fetching fresh user data (cache miss/expired)');
    const userResult = await databaseOperations.user.getCurrentUser();
    const userData = userResult.success ? userResult.data : null;
    
    // Cache the result
    setCachedUserData({ user: userData, timestamp: now });
    
    return userData;
  }, [cachedUserData]);

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
      clearError();
      
      // Get current user to determine cycle dates
      const userResult = await databaseOperations.user.getCurrentUser();
      const userData = userResult.success ? userResult.data : null;
      
      console.log('📊 AppContext.refreshCMEData: User data:', userData);
      
      if (!userData) {
        console.log('⚠️ AppContext: No user data, skipping CME refresh');
        // Still try to load all entries without date filtering
        const allEntriesResult = await databaseOperations.cme.getAllEntries();
        console.log('📊 AppContext: All entries (fallback):', allEntriesResult);
        if (allEntriesResult.success && allEntriesResult.data) {
          setRecentCMEEntries(allEntriesResult.data.slice(0, 10));
          const totalCredits = allEntriesResult.data.reduce((sum, entry) => sum + entry.creditsEarned, 0);
          setTotalCredits(totalCredits);
        }
        return;
      }
      
      let startDate: string;
      let endDate: string;
      
      if (userData.cycleStartDate && userData.cycleEndDate) {
        startDate = userData.cycleStartDate;
        endDate = userData.cycleEndDate;
      } else if (userData.cycleStartDate) {
        startDate = userData.cycleStartDate;
        const endDateObj = new Date(userData.cycleStartDate);
        endDateObj.setFullYear(endDateObj.getFullYear() + (userData.requirementPeriod || 1));
        endDate = endDateObj.toISOString().split('T')[0];
      } else {
        // Fall back to current year if no cycle dates set
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
        const periodYears = userData.requirementPeriod || 1;
        endDate = `${currentYear + periodYears}-01-01`;
      }
      
      console.log('📅 AppContext.refreshCMEData: Using date range:', { startDate, endDate });
      
      // Load recent entries (last 10) and total credits in parallel
      const [recentEntriesResult, creditsResult, allEntriesResult] = await Promise.all([
        databaseOperations.cme.getEntriesInDateRange(startDate, endDate).then(result => {
          console.log('📊 AppContext: Entries in date range result:', result);
          if (result.success && result.data) {
            // Limit to most recent 10 entries for performance
            return { success: true, data: result.data.slice(0, 10) };
          }
          return result;
        }),
        databaseOperations.cme.getTotalCreditsInRange(startDate, endDate),
        // Also get ALL entries for debugging
        databaseOperations.cme.getAllEntries().then(result => {
          console.log('📊 AppContext: ALL entries in DB:', result);
          return result;
        })
      ]);
      
      if (recentEntriesResult.success) {
        console.log('📋 AppContext: Setting recent entries:', recentEntriesResult.data);
        setRecentCMEEntries(recentEntriesResult.data || []);
        
        // If no entries in date range but there are entries in DB, warn about date filtering
        if ((!recentEntriesResult.data || recentEntriesResult.data.length === 0) && 
            allEntriesResult.success && allEntriesResult.data && allEntriesResult.data.length > 0) {
          console.log('⚠️ AppContext: No entries in date range but entries exist in DB - possible date filtering issue');
          console.log('📅 AppContext: Date range used:', { startDate, endDate });
          console.log('📋 AppContext: All entries dates:', allEntriesResult.data.map(e => ({ id: e.id, title: e.title, date: e.dateAttended })));
        }
      } else {
        console.error('💥 AppContext: Failed to load recent entries:', recentEntriesResult.error);
        setError('Failed to load recent CME entries. Please try again.');
      }
      
      if (creditsResult.success) {
        setTotalCredits(creditsResult.data || 0);
      } else {
        setError('Failed to calculate total credits. Please try again.');
      }
    } catch (error) {
      console.error('Error refreshing CME data:', error);
      setError('Unable to load CME data. Please check your connection and try again.');
    } finally {
      setIsLoadingCME(false);
    }
  }, [clearError]);

  // Lazy load all CME entries when needed (e.g., for CME history screen)
  const loadAllCMEEntries = useCallback(async (): Promise<CMEEntry[]> => {
    try {
      const userResult = await databaseOperations.user.getCurrentUser();
      const userData = userResult.success ? userResult.data : null;
      
      if (!userData) {
        return [];
      }
      
      let startDate: string;
      let endDate: string;
      
      if (userData.cycleStartDate && userData.cycleEndDate) {
        startDate = userData.cycleStartDate;
        endDate = userData.cycleEndDate;
      } else if (userData.cycleStartDate) {
        startDate = userData.cycleStartDate;
        const endDateObj = new Date(userData.cycleStartDate);
        endDateObj.setFullYear(endDateObj.getFullYear() + (userData.requirementPeriod || 1));
        endDate = endDateObj.toISOString().split('T')[0];
      } else {
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
        const periodYears = userData.requirementPeriod || 1;
        endDate = `${currentYear + periodYears}-01-01`;
      }
      
      const result = await databaseOperations.cme.getEntriesInDateRange(startDate, endDate);
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error('Error loading all CME entries:', error);
      return [];
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

  // Smart initial data loading - prioritize essential data
  useEffect(() => {
    let mounted = true;
    
    const loadEssentialData = async () => {
      if (!mounted) return;
      
      try {
        console.log('🚀 AppContext: Starting smart initial data load...');
        setIsInitializing(true);
        
        // Load user first (essential for everything else)
        await refreshUserData();
        
        if (!mounted) return;
        
        // Load essential data in parallel
        await Promise.all([
          refreshCMEData(), // Only recent entries + totals
          // Skip certificates and licenses initially - load on demand
        ]);
        
        console.log('✅ AppContext: Essential data loaded quickly');
        
        // Load secondary data in background after a brief delay
        setTimeout(async () => {
          if (mounted) {
            console.log('🔄 AppContext: Loading secondary data...');
            await Promise.all([
              refreshCertificates(),
              refreshLicenses(),
            ]);
            console.log('✅ AppContext: All data loaded');
          }
        }, 100); // Short delay to prioritize UI responsiveness
        
      } catch (error) {
        console.error('💥 AppContext: Error during initial load:', error);
        setError('Failed to load app data. Please restart the app.');
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };
    
    loadEssentialData();
    
    return () => {
      mounted = false;
    };
  }, []); // No dependencies - run once on mount

  const value = useMemo<AppContextType>(() => ({
    // Data
    user,
    recentCMEEntries,
    totalCredits,
    currentYearProgress,
    certificates,
    licenses,
    
    // Enhanced loading states
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    
    // Error state
    error,
    
    // Refresh functions
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshAllData,
    
    // Lazy loading actions
    loadAllCMEEntries,
    clearError,
    
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
    recentCMEEntries,
    totalCredits,
    currentYearProgress,
    certificates,
    licenses,
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    error,
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshAllData,
    loadAllCMEEntries,
    clearError,
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