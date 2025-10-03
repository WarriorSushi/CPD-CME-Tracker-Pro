/**
 * Contexts Index
 *
 * Provides domain-specific contexts for better performance and maintainability.
 * Each context manages its own domain, reducing unnecessary re-renders.
 */

import React, { ReactNode } from 'react';

// Export individual contexts
export { UserProvider, useUser } from './UserContext';
export { CMEProvider, useCME } from './CMEContext';
export { LicenseProvider, useLicense } from './LicenseContext';
export { CertificateProvider, useCertificate } from './CertificateContext';

// Export legacy AppContext for backwards compatibility (during migration)
export { AppProvider, useAppContext } from './AppContext';

/**
 * AppProviders - Composes all context providers
 *
 * Wrap your app with this to get access to all contexts.
 * Contexts are ordered by dependency: User -> CME -> License -> Certificate
 */
interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return children;
};
