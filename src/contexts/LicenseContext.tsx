import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LicenseRenewal, DatabaseOperationResult } from '../types';
import { databaseOperations } from '../services/database';
import { AuditTrailService } from '../services/AuditTrailService';

interface LicenseContextType {
  licenses: LicenseRenewal[];
  isLoadingLicenses: boolean;
  error: string | null;

  refreshLicenses: () => Promise<void>;
  addLicense: (license: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateLicense: (id: number, license: Partial<LicenseRenewal>) => Promise<boolean>;
  deleteLicense: (id: number) => Promise<boolean>;
  clearError: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within LicenseProvider');
  }
  return context;
};

interface LicenseProviderProps {
  children: ReactNode;
}

export const LicenseProvider: React.FC<LicenseProviderProps> = ({ children }) => {
  const [licenses, setLicenses] = useState<LicenseRenewal[]>([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshLicenses = useCallback(async () => {
    setIsLoadingLicenses(true);
    setError(null);

    try {
      const result = await databaseOperations.licenses.getAllLicenses();

      if (result.success && result.data) {
        setLicenses(result.data);
      } else {
        throw new Error(result.error || 'Failed to load licenses');
      }
    } catch (error) {
      __DEV__ && console.error('Failed to load licenses:', error);
      setError('Failed to load licenses');
    } finally {
      setIsLoadingLicenses(false);
    }
  }, []);

  const addLicense = useCallback(
    async (license: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
      try {
        const result = await databaseOperations.licenses.addLicense(license);

        if (result.success) {
          await refreshLicenses();

          await AuditTrailService.logLicenseAction(
            'add_license',
            result.data?.id || 0,
            {
              type: license.licenseType,
              authority: license.issuingAuthority,
            },
            true
          );

          return true;
        }

        throw new Error(result.error || 'Failed to add license');
      } catch (error) {
        __DEV__ && console.error('Failed to add license:', error);
        setError(error instanceof Error ? error.message : 'Failed to add license');

        await AuditTrailService.logLicenseAction(
          'add_license',
          0,
          { type: license.licenseType },
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshLicenses]
  );

  const updateLicense = useCallback(
    async (id: number, license: Partial<LicenseRenewal>): Promise<boolean> => {
      try {
        const result = await databaseOperations.licenses.updateLicense(id, license);

        if (result.success) {
          await refreshLicenses();

          await AuditTrailService.logLicenseAction(
            'update_license',
            id,
            { updatedFields: Object.keys(license) },
            true
          );

          return true;
        }

        throw new Error(result.error || 'Failed to update license');
      } catch (error) {
        __DEV__ && console.error('Failed to update license:', error);
        setError(error instanceof Error ? error.message : 'Failed to update license');

        await AuditTrailService.logLicenseAction(
          'update_license',
          id,
          { updatedFields: Object.keys(license) },
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshLicenses]
  );

  const deleteLicense = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const result = await databaseOperations.licenses.deleteLicense(id);

        if (result.success) {
          await refreshLicenses();

          await AuditTrailService.logLicenseAction('delete_license', id, {}, true);

          return true;
        }

        throw new Error(result.error || 'Failed to delete license');
      } catch (error) {
        __DEV__ && console.error('Failed to delete license:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete license');

        await AuditTrailService.logLicenseAction(
          'delete_license',
          id,
          {},
          false,
          error instanceof Error ? error.message : undefined
        );

        return false;
      }
    },
    [refreshLicenses]
  );

  // Initialize licenses on mount
  React.useEffect(() => {
    refreshLicenses();
  }, [refreshLicenses]);

  const value: LicenseContextType = {
    licenses,
    isLoadingLicenses,
    error,
    refreshLicenses,
    addLicense,
    updateLicense,
    deleteLicense,
    clearError,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};
