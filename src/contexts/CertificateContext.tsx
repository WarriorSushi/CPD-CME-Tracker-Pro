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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const refreshCertificates = useCallback(async () => {
    setIsLoadingCertificates(true);
    setError(null);

    try {
      const result = await databaseOperations.certificates.getAllCertificates();

      if (result.success && result.data) {
        setCertificates(result.data);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(result.error || 'Failed to load certificates');
      }
    } catch (error) {
      __DEV__ && console.error('Failed to load certificates:', error);

      if (retryCount < MAX_RETRIES) {
        // Exponential backoff retry
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refreshCertificates();
        }, 1000 * (retryCount + 1));
      } else {
        setError('Failed to load certificates after 3 attempts. Please restart the app.');

        await AuditTrailService.logCertificateAction(
          'load_certificates_failed',
          0,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          false,
          error instanceof Error ? error.message : undefined
        );
      }
    } finally {
      setIsLoadingCertificates(false);
    }
  }, [retryCount]);

  // Initialize certificates on mount
  React.useEffect(() => {
    refreshCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  const value: CertificateContextType = {
    certificates,
    isLoadingCertificates,
    error,
    refreshCertificates,
    clearError,
  };

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};
