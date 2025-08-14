import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { 
  User, 
  CMEEntry, 
  Certificate, 
  LicenseRenewal, 
  CMEEventReminder,
  Progress,
  DatabaseOperationResult 
} from '../types';
import { databaseOperations } from '../services/database';
import { getUserCached, refreshUserCache, clearUserCache, getCachedUserSync } from '../services/database/userCache';
import { NotificationService } from '../services/notifications';
import { AuditTrailService } from '../services/AuditTrailService';

// Development logging helper
const isDevelopment = __DEV__;
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Remount detection for debugging
if (isDevelopment) {
  const remountCounter = (globalThis.__appContextMountCount = (globalThis.__appContextMountCount || 0) + 1);
  devLog('🔄 AppContext: Provider mounting (count:', remountCounter, ')');
}

// Batch state updates helper
const useBatchedStateUpdates = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<(() => void)[]>([]);
  
  const batchUpdate = useCallback((update: () => void) => {
    pendingUpdatesRef.current.push(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = [...pendingUpdatesRef.current];
      pendingUpdatesRef.current = [];
      
      // Execute all updates in a single batch
      updates.forEach(update => update());
      
      timeoutRef.current = null;
    }, 0); // Batch at next tick
  }, []);
  
  return batchUpdate;
};

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
  
  // Event Reminders
  eventReminders: CMEEventReminder[];
  
  // Enhanced loading states
  isInitializing: boolean; // First-time app setup
  isLoadingUser: boolean;
  isLoadingCME: boolean;
  isLoadingCertificates: boolean;
  isLoadingLicenses: boolean;
  isLoadingReminders: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refreshUserData: () => Promise<void>;
  refreshCMEData: () => Promise<void>;
  refreshCertificates: () => Promise<void>;
  refreshLicenses: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  forceRefreshCMEData: () => Promise<void>;
  
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
  
  // Event Reminder actions
  addEventReminder: (reminder: Omit<CMEEventReminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateEventReminder: (id: number, reminder: Partial<CMEEventReminder>) => Promise<boolean>;
  deleteEventReminder: (id: number) => Promise<boolean>;
  
  // User actions
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>; // Alias for profile updates
  
  // Notification refresh
  refreshNotifications: () => Promise<void>;
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
  const [eventReminders, setEventReminders] = useState<CMEEventReminder[]>([]);
  
  // Batched state updater
  const batchUpdate = useBatchedStateUpdates();
  
  // Enhanced loading states
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingCME, setIsLoadingCME] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Staleness tracking for entries data
  const lastEntriesRefreshRef = useRef<number>(0);
  const ENTRIES_STALENESS_TTL = 60000; // 1 minute
  
  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Use singleton user cache instead of local caching
  const getCurrentUserCached = useCallback(async (): Promise<User | null> => {
    return getUserCached();
  }, []);

  // Calculate progress based on current data and user's requirement period (memoized)
  const calculateProgress = useCallback((user: User, totalCredits: number): Progress => {
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
  }, []); // Empty dependencies since function only uses parameters

  // Data fetching functions
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingUser(true);
      devLog('🔄 AppContext: Refreshing user data...');
      const userData = await refreshUserCache(); // Use singleflight cache
      if (userData) {
        devLog('✅ AppContext: User data loaded:', userData?.creditSystem);
        setUser(userData);
      }
    } catch (error) {
      console.error('💥 AppContext: Error refreshing user data:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const refreshCMEData = useCallback(async (force: boolean = false): Promise<void> => {
    try {
      setIsLoadingCME(true);
      clearError();
      
      // Use cached user data if available, avoid duplicate DB call
      let userData = user || getCachedUserSync();
      if (!userData) {
        userData = await getUserCached(); // Use singleflight cache
      }
      
      devLog('📊 AppContext.refreshCMEData: User data:', userData?.profession);
      
      if (!userData) {
        devLog('⚠️ AppContext: No user data, skipping CME refresh');
        // Still try to load all entries without date filtering
        const allEntriesResult = await databaseOperations.cme.getAllEntries();
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
        // Since database query uses "date_attended < endDate" (exclusive),
        // we need to use the first day of the next year to include all of the current year
        endDate = `${currentYear + periodYears}-01-01`;
      }
      
      devLog('📅 AppContext.refreshCMEData: Using date range:', { startDate, endDate });
      
      // Check staleness to avoid redundant queries
      const now = Date.now();
      const isStale = (now - lastEntriesRefreshRef.current) > ENTRIES_STALENESS_TTL;
      
      if (!isStale && !force) {
        devLog('✅ AppContext: CME data is fresh, skipping refresh');
        return;
      }
      
      lastEntriesRefreshRef.current = now;
      devLog('🔄 AppContext: CME data is stale, refreshing...');
      
      // Load recent entries and total credits (remove redundant getAllEntries call for performance) 
      const [recentEntriesResult, creditsResult] = await Promise.all([
        databaseOperations.cme.getEntriesInDateRange(startDate, endDate).then(result => {
          if (result.success && result.data) {
            // Limit to most recent 10 entries for performance
            return { success: true, data: result.data.slice(0, 10) };
          }
          return result;
        }),
        databaseOperations.cme.getTotalCreditsInRange(startDate, endDate)
      ]);
      
      // Only fetch ALL entries as fallback if no entries found in date range
      let allEntriesResult = null;
      if (!recentEntriesResult.success || !recentEntriesResult.data || recentEntriesResult.data.length === 0) {
        allEntriesResult = await databaseOperations.cme.getAllEntries();
      }
      
      // Batch state updates to prevent multiple re-renders
      const entriesData = recentEntriesResult.success ? (recentEntriesResult.data || []) : [];
      const creditsData = creditsResult.success ? (creditsResult.data || 0) : 0;
      
      // Handle fallback to all entries if needed
      let finalEntries = entriesData;
      let finalCredits = creditsData;
      
      if ((!entriesData || entriesData.length === 0) && 
          allEntriesResult && allEntriesResult.success && allEntriesResult.data && allEntriesResult.data.length > 0) {
        finalEntries = allEntriesResult.data.slice(0, 10);
        finalCredits = allEntriesResult.data.reduce((sum, entry) => sum + entry.creditsEarned, 0);
      }
      
      // Batch all state updates together
      batchUpdate(() => {
        setRecentCMEEntries(finalEntries);
        setTotalCredits(finalCredits);
        if (!recentEntriesResult.success) {
          setError('Failed to load recent CME entries. Please try again.');
        } else if (!creditsResult.success) {
          setError('Failed to calculate total credits. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error refreshing CME data:', error);
      setError('Unable to load CME data. Please check your connection and try again.');
    } finally {
      setIsLoadingCME(false);
    }
  }, [clearError]); // Remove user dependency to prevent unnecessary re-runs
  // Lazy load all CME entries when needed (e.g., for CME history screen)
  const loadAllCMEEntries = useCallback(async (): Promise<CMEEntry[]> => {
    try {
      // Use cached user data to avoid redundant DB calls
      let userData = user || getCachedUserSync();
      if (!userData) {
        userData = await getUserCached(); // Use singleflight cache
      }
      
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
        // Fall back to current year if no cycle dates set  
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
        const periodYears = userData.requirementPeriod || 1;
        // Since database query uses "date_attended < endDate" (exclusive),
        // we need to use the first day of the next year to include all of the current year
        endDate = `${currentYear + periodYears}-01-01`;
      }
      
      const result = await databaseOperations.cme.getEntriesInDateRange(startDate, endDate);
      console.log('📋 AppContext.loadAllCMEEntries: Raw data from database:', result.data);
      // DATABASE already sorts with ORDER BY date_attended DESC - do NOT sort again
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

  const refreshReminders = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingReminders(true);
      const result = await databaseOperations.eventReminders.getAllReminders();
      if (result.success) {
        setEventReminders(result.data || []);
      }
    } catch (error) {
      console.error('Error refreshing reminders:', error);
    } finally {
      setIsLoadingReminders(false);
    }
  }, []);

  const refreshAllData = useCallback(async (): Promise<void> => {
    await Promise.all([
      refreshUserData(),
      refreshCMEData(),
      refreshCertificates(),
      refreshLicenses(),
      refreshReminders(),
    ]);
  }, [refreshUserData, refreshCMEData, refreshCertificates, refreshLicenses, refreshReminders]);

  // Force refresh CME data (bypass staleness check)
  const forceRefreshCMEData = useCallback(async (): Promise<void> => {
    await refreshCMEData(true);
  }, [refreshCMEData]);

  // CME Actions
  const addCMEEntry = useCallback(async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      console.log('🗃️ AppContext.addCMEEntry: Attempting to add entry:', entry);
      const result = await databaseOperations.cme.addEntry(entry);
      console.log('🗃️ AppContext.addCMEEntry: Database result:', result);
      
      if (result.success) {
        console.log('✅ AppContext.addCMEEntry: Success! Force refreshing CME data...');
        await AuditTrailService.logCMEAction('add_entry', result.data?.id || 0, {
          title: entry.title,
          provider: entry.provider,
          credits: entry.creditsEarned,
          category: entry.category
        }, true);
        await forceRefreshCMEData();
        return true;
      }
      console.log('❌ AppContext.addCMEEntry: Database operation failed');
      await AuditTrailService.logCMEAction('add_entry', 0, { title: entry.title }, false, 'Database operation failed');
      return false;
    } catch (error) {
      console.error('💥 AppContext.addCMEEntry: Exception occurred:', error);
      await AuditTrailService.logCMEAction('add_entry', 0, { title: entry.title }, false, String(error));
      return false;
    }
  }, [forceRefreshCMEData]);

  const updateCMEEntry = useCallback(async (id: number, entry: Partial<CMEEntry>): Promise<boolean> => {
    try {
      const result = await databaseOperations.cme.updateEntry(id, entry);
      if (result.success) {
        await AuditTrailService.logCMEAction('update_entry', id, entry, true);
        await forceRefreshCMEData();
        return true;
      }
      await AuditTrailService.logCMEAction('update_entry', id, entry, false, 'Database operation failed');
      return false;
    } catch (error) {
      console.error('Error updating CME entry:', error);
      await AuditTrailService.logCMEAction('update_entry', id, entry, false, String(error));
      return false;
    }
  }, [forceRefreshCMEData]);

  const deleteCMEEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await databaseOperations.cme.deleteEntry(id);
      if (result.success) {
        await AuditTrailService.logCMEAction('delete_entry', id, {}, true);
        await forceRefreshCMEData();
        return true;
      }
      await AuditTrailService.logCMEAction('delete_entry', id, {}, false, 'Database operation failed');
      return false;
    } catch (error) {
      console.error('Error deleting CME entry:', error);
      await AuditTrailService.logCMEAction('delete_entry', id, {}, false, String(error));
      return false;
    }
  }, [forceRefreshCMEData]);

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

  // Event Reminder Actions
  const addEventReminder = useCallback(async (reminder: Omit<CMEEventReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const result = await databaseOperations.eventReminders.addReminder(reminder);
      if (result.success) {
        await refreshReminders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding event reminder:', error);
      return false;
    }
  }, [refreshReminders]);

  const updateEventReminder = useCallback(async (id: number, reminder: Partial<CMEEventReminder>): Promise<boolean> => {
    try {
      const result = await databaseOperations.eventReminders.updateReminder(id, reminder);
      if (result.success) {
        await refreshReminders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating event reminder:', error);
      return false;
    }
  }, [refreshReminders]);

  const deleteEventReminder = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await databaseOperations.eventReminders.deleteReminder(id);
      if (result.success) {
        await refreshReminders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting event reminder:', error);
      return false;
    }
  }, [refreshReminders]);

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

  // Refresh notifications with current app data
  const refreshNotifications = useCallback(async (): Promise<void> => {
    try {
      if (!user) return;
      
      devLog('🔔 AppContext: Refreshing notifications with current data...');
      await NotificationService.refreshAllNotifications(
        user,
        licenses,
        eventReminders,
        totalCredits
      );
      devLog('✅ AppContext: Notifications refreshed successfully');
    } catch (error) {
      console.error('💥 AppContext: Error refreshing notifications:', error);
    }
  }, [user, licenses, eventReminders, totalCredits]);

  // Update progress when user or credits change
  useEffect(() => {
    if (user && !isLoadingCME) {
      const progress = calculateProgress(user, totalCredits);
      setCurrentYearProgress(progress);
    }
  }, [user, totalCredits, isLoadingCME]);

  // Auto-refresh notifications when relevant data changes (optimized debouncing)
  const notificationRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (user && !isInitializing) {
      // Clear any existing timeout
      if (notificationRefreshTimeoutRef.current) {
        clearTimeout(notificationRefreshTimeoutRef.current);
      }
      
      // Set new timeout with longer debounce for better performance
      notificationRefreshTimeoutRef.current = setTimeout(() => {
        refreshNotifications();
      }, 2000); // Increased debounce to 2 seconds
      
      return () => {
        if (notificationRefreshTimeoutRef.current) {
          clearTimeout(notificationRefreshTimeoutRef.current);
        }
      };
    }
  }, [user, licenses, eventReminders, totalCredits, refreshNotifications, isInitializing]);

  // Smart initial data loading - prioritize essential data
  // Use ref to prevent double execution in React 18 StrictMode
  const didInitialLoadRef = useRef(false);
  
  useEffect(() => {
    // Guard against double execution
    if (didInitialLoadRef.current) {
      devLog('⚠️ AppContext: Initial load already completed, skipping...');
      return;
    }
    
    didInitialLoadRef.current = true;
    let mounted = true;
    
    const loadEssentialData = async () => {
      if (!mounted) return;
      
      try {
        devLog('🚀 AppContext: Starting smart initial data load...');
        setIsInitializing(true);
        
        // Initialize notification service
        try {
          await NotificationService.initialize();
          devLog('✅ AppContext: Notification service initialized');
        } catch (error) {
          console.error('💥 AppContext: Failed to initialize notifications:', error);
        }
        
        // Load user first (essential for everything else)
        await refreshUserData();
        
        if (!mounted) return;
        
        // Load essential data in parallel
        await Promise.all([
          refreshCMEData(), // Only recent entries + totals
          // Skip certificates and licenses initially - load on demand
        ]);
        
        devLog('✅ AppContext: Essential data loaded quickly');
        
        // Load secondary data in background after a brief delay
        setTimeout(async () => {
          if (mounted) {
            devLog('🔄 AppContext: Loading secondary data...');
            await Promise.all([
              refreshCertificates(),
              refreshLicenses(),
            ]);
            
            // Load reminders separately to avoid blocking
            setTimeout(async () => {
              if (mounted) {
                await refreshReminders();
              }
            }, 500);
            devLog('✅ AppContext: All data loaded');
          }
        }, 100); // Short delay to prioritize UI responsiveness
        
      } catch (error) {
        console.error('💥 AppContext: Error during initial load:', error); // Keep error logs
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
    eventReminders,
    
    // Enhanced loading states
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    isLoadingReminders,
    
    // Error state
    error,
    
    // Refresh functions
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshReminders,
    refreshAllData,
    forceRefreshCMEData,
    
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
    addEventReminder,
    updateEventReminder,
    deleteEventReminder,
    updateUser,
    updateUserProfile: updateUser, // Alias for profile updates
    refreshNotifications,
  }), [
    user,
    recentCMEEntries,
    totalCredits,
    currentYearProgress,
    certificates,
    licenses,
    eventReminders,
    isInitializing,
    isLoadingUser,
    isLoadingCME,
    isLoadingCertificates,
    isLoadingLicenses,
    isLoadingReminders,
    error,
    refreshUserData,
    refreshCMEData,
    refreshCertificates,
    refreshLicenses,
    refreshReminders,
    refreshAllData,
    forceRefreshCMEData,
    loadAllCMEEntries,
    clearError,
    addCMEEntry,
    updateCMEEntry,
    deleteCMEEntry,
    addLicense,
    updateLicense,
    deleteLicense,
    addEventReminder,
    updateEventReminder,
    deleteEventReminder,
    updateUser,
    refreshNotifications,
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