import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { CMEEntry, Progress, DatabaseOperationResult } from '../types';
import { databaseOperations } from '../services/database';
import { AuditTrailService } from '../services/AuditTrailService';
import { useUser } from './UserContext';

interface CMEContextType {
  recentCMEEntries: CMEEntry[];
  totalCredits: number;
  currentYearProgress: Progress | null;
  isLoadingCME: boolean;
  error: string | null;

  refreshCMEData: () => Promise<void>;
  forceRefreshCMEData: () => Promise<void>;
  loadAllCMEEntries: () => Promise<CMEEntry[]>;
  addCMEEntry: (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCMEEntry: (id: number, entry: Partial<CMEEntry>) => Promise<boolean>;
  deleteCMEEntry: (id: number) => Promise<boolean>;
  clearError: () => void;
}

const CMEContext = createContext<CMEContextType | undefined>(undefined);

export const useCME = () => {
  const context = useContext(CMEContext);
  if (!context) {
    throw new Error('useCME must be used within CMEProvider');
  }
  return context;
};

interface CMEProviderProps {
  children: ReactNode;
}

export const CMEProvider: React.FC<CMEProviderProps> = ({ children }) => {
  const { user } = useUser();

  const [recentCMEEntries, setRecentCMEEntries] = useState<CMEEntry[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoadingCME, setIsLoadingCME] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entriesStaleRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate progress based on current data (memoized)
  const currentYearProgress = useMemo((): Progress | null => {
    if (!user) return null;

    const annualRequirement = user.annualRequirement || 0;
    const currentYear = new Date().getFullYear();

    // Filter entries for current year
    const currentYearEntries = recentCMEEntries.filter(entry => {
      const entryYear = new Date(entry.dateAttended).getFullYear();
      return entryYear === currentYear;
    });

    const completed = currentYearEntries.reduce((sum, entry) => sum + (entry.creditsEarned || 0), 0);
    const percentage = annualRequirement > 0 ? (completed / annualRequirement) * 100 : 0;

    return {
      year: currentYear,
      required: annualRequirement,
      completed,
      remaining: Math.max(0, annualRequirement - completed),
      percentage: Math.min(100, percentage),
    };
  }, [user, recentCMEEntries]);

  const refreshCMEData = useCallback(async () => {
    // Optimize: skip refresh if data is fresh (less than 5 seconds old)
    if (!entriesStaleRef.current) {
      return;
    }

    setIsLoadingCME(true);
    setError(null);

    try {
      const entriesResult = await databaseOperations.cmeOperations.getRecentCMEEntries(10);

      if (entriesResult.success && entriesResult.data) {
        setRecentCMEEntries(entriesResult.data);
        entriesStaleRef.current = false;

        const credits = entriesResult.data.reduce((sum, entry) => sum + (entry.creditsEarned || 0), 0);
        setTotalCredits(credits);
      } else {
        throw new Error(entriesResult.error || 'Failed to load CME entries');
      }
    } catch (error) {
      __DEV__ && console.error('Failed to load CME data:', error);
      setError('Failed to load CME data');
    } finally {
      setIsLoadingCME(false);
    }
  }, []);

  const forceRefreshCMEData = useCallback(async () => {
    entriesStaleRef.current = true;
    await refreshCMEData();
  }, [refreshCMEData]);

  const loadAllCMEEntries = useCallback(async (): Promise<CMEEntry[]> => {
    try {
      const result = await databaseOperations.cmeOperations.getAllCMEEntries();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to load all CME entries');
    } catch (error) {
      __DEV__ && console.error('Failed to load all CME entries:', error);
      setError('Failed to load CME entries');
      return [];
    }
  }, []);

  const addCMEEntry = useCallback(
    async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
      try {
        const result = await databaseOperations.cmeOperations.addCMEEntry(entry);

        if (result.success) {
          entriesStaleRef.current = true;
          await refreshCMEData();

          await AuditTrailService.logCMEAction(
            'add_entry',
            result.data?.id || 0,
            {
              title: entry.title,
              credits: entry.creditsEarned,
              category: entry.category,
            },
            true
          );

          return true;
        }

        throw new Error(result.error || 'Failed to add CME entry');
      } catch (error) {
        __DEV__ && console.error('Failed to add CME entry:', error);
        setError(error instanceof Error ? error.message : 'Failed to add entry');

        await AuditTrailService.logCMEAction(
          'add_entry',
          0,
          { title: entry.title },
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshCMEData]
  );

  const updateCMEEntry = useCallback(
    async (id: number, entry: Partial<CMEEntry>): Promise<boolean> => {
      try {
        const result = await databaseOperations.cmeOperations.updateCMEEntry(id, entry);

        if (result.success) {
          entriesStaleRef.current = true;
          await refreshCMEData();

          await AuditTrailService.logCMEAction(
            'update_entry',
            id,
            { updatedFields: Object.keys(entry) },
            true
          );

          return true;
        }

        throw new Error(result.error || 'Failed to update CME entry');
      } catch (error) {
        __DEV__ && console.error('Failed to update CME entry:', error);
        setError(error instanceof Error ? error.message : 'Failed to update entry');

        await AuditTrailService.logCMEAction(
          'update_entry',
          id,
          { updatedFields: Object.keys(entry) },
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshCMEData]
  );

  const deleteCMEEntry = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const result = await databaseOperations.cmeOperations.deleteCMEEntry(id);

        if (result.success) {
          entriesStaleRef.current = true;
          await refreshCMEData();

          await AuditTrailService.logCMEAction('delete_entry', id, {}, true);

          return true;
        }

        throw new Error(result.error || 'Failed to delete CME entry');
      } catch (error) {
        __DEV__ && console.error('Failed to delete CME entry:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete entry');

        await AuditTrailService.logCMEAction(
          'delete_entry',
          id,
          {},
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshCMEData]
  );

  // Initialize CME data on mount
  React.useEffect(() => {
    entriesStaleRef.current = true;
    refreshCMEData();
  }, [refreshCMEData]);

  const value: CMEContextType = {
    recentCMEEntries,
    totalCredits,
    currentYearProgress,
    isLoadingCME,
    error,
    refreshCMEData,
    forceRefreshCMEData,
    loadAllCMEEntries,
    addCMEEntry,
    updateCMEEntry,
    deleteCMEEntry,
    clearError,
  };

  return <CMEContext.Provider value={value}>{children}</CMEContext.Provider>;
};
