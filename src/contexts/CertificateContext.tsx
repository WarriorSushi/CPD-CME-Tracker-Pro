import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Certificate, DatabaseOperationResult } from '../types';
import { databaseOperations } from '../services/database';
import { AuditTrailService } from '../services/AuditTrailService';

interface CertificateContextType {
  certificates: Certificate[];
  isLoadingCertificates: boolean;
  error: string | null;

  refreshCertificates: () => Promise<void>;
  clearError: () => void;
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export const useCertificate = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificate must be used within CertificateProvider');
  }
  return context;
};

interface CertificateProviderProps {
  children: ReactNode;
}

export const CertificateProvider: React.FC<CertificateProviderProps> = ({ children }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshCertificates = useCallback(async () => {
    setIsLoadingCertificates(true);
    setError(null);

    try {
      const result = await databaseOperations.certificates.getAllCertificates();

      if (result.success && result.data) {
        setCertificates(result.data);
      } else {
        throw new Error(result.error || 'Failed to load certificates');
      }
    } catch (error) {
      __DEV__ && console.error('Failed to load certificates:', error);
      setError('Failed to load certificates');

      await AuditTrailService.logCertificateAction(
        'load_certificates_failed',
        0,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        false,
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setIsLoadingCertificates(false);
    }
  }, []);

  // Initialize certificates on mount
  React.useEffect(() => {
    refreshCertificates();
  }, [refreshCertificates]);

  const value: CertificateContextType = {
    certificates,
    isLoadingCertificates,
    error,
    refreshCertificates,
    clearError,
  };

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};
