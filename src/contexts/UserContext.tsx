import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, DatabaseOperationResult } from '../types';
import { databaseOperations } from '../services/database';
import { getUserCached, refreshUserCache, clearUserCache, getCachedUserSync } from '../services/database/userCache';
import { AuditTrailService } from '../services/AuditTrailService';

interface UserContextType {
  user: User | null;
  isLoadingUser: boolean;
  error: string | null;

  refreshUserData: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    setIsLoadingUser(true);
    setError(null);

    try {
      const cachedUser = await getUserCached();
      setUser(cachedUser);
    } catch (error) {
      __DEV__ && console.error('Failed to load user:', error);
      setError('Failed to load user data');

      await AuditTrailService.logUserAction(
        'load_user_failed',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        false,
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user?.id) {
        throw new Error('No user ID found');
      }

      const result = await databaseOperations.userOperations.updateUser(user.id, userData);

      if (result.success && result.data) {
        setUser(result.data);
        await refreshUserCache();

        await AuditTrailService.logUserAction(
          'update_user',
          { updatedFields: Object.keys(userData) },
          true
        );

        return true;
      }

      throw new Error(result.error || 'Failed to update user');
    } catch (error) {
      __DEV__ && console.error('Failed to update user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');

      await AuditTrailService.logUserAction(
        'update_user',
        { updatedFields: Object.keys(userData) },
        false,
        error instanceof Error ? error.message : undefined
      );

      return false;
    }
  }, [user]);

  const updateUserProfile = useCallback(
    async (userData: Partial<User>): Promise<boolean> => {
      return updateUser(userData);
    },
    [updateUser]
  );

  // Initialize user data on mount
  React.useEffect(() => {
    // Use cached user synchronously for immediate UI
    const cachedUser = getCachedUserSync();
    if (cachedUser) {
      setUser(cachedUser);
    }

    // Then refresh from database
    refreshUserData();
  }, [refreshUserData]);

  const value: UserContextType = {
    user,
    isLoadingUser,
    error,
    refreshUserData,
    updateUser,
    updateUserProfile,
    clearError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
