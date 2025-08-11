// Singleflight user cache - prevents duplicate getCurrentUser calls
import { User, DatabaseOperationResult } from '../../types';
import { userOperations } from './operations';

// Singleflight state
let inflightUser: Promise<User | null> | null = null;
let lastUser: User | null = null;
let lastUserAt = 0;
const USER_TTL = 60000; // 1 minute TTL for user data

// Development logging helper
const isDevelopment = __DEV__;
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export async function getUserCached(): Promise<User | null> {
  const now = Date.now();
  
  // Return cached user if fresh
  if (lastUser && (now - lastUserAt) < USER_TTL) {
    devLog('💾 getUserCached: Using fresh cached user data');
    return lastUser;
  }
  
  // If already fetching, wait for the same promise
  if (inflightUser) {
    devLog('⏳ getUserCached: Waiting for inflight user request...');
    return inflightUser;
  }
  
  // Start new fetch
  devLog('🔄 getUserCached: Fetching fresh user data...');
  
  inflightUser = (async () => {
    try {
      const result = await userOperations.getCurrentUser();
      const userData = result.success ? result.data : null;
      
      // Cache the result
      lastUser = userData;
      lastUserAt = Date.now();
      
      devLog('✅ getUserCached: Fresh user data cached');
      return userData;
    } catch (error) {
      console.error('💥 getUserCached: Error fetching user:', error);
      return null;
    }
  })().finally(() => {
    inflightUser = null; // Clear inflight flag
  });
  
  return inflightUser;
}

// Force refresh user data (for updates)
export async function refreshUserCache(): Promise<User | null> {
  devLog('🔄 refreshUserCache: Force refreshing user cache...');
  
  // Clear cache
  lastUser = null;
  lastUserAt = 0;
  
  // If there's an inflight request, wait for it to complete first
  if (inflightUser) {
    await inflightUser;
  }
  
  // Get fresh data
  return getUserCached();
}

// Clear cache (for logout/reset)
export function clearUserCache(): void {
  devLog('🧹 clearUserCache: Clearing user cache...');
  lastUser = null;
  lastUserAt = 0;
  inflightUser = null;
}

// Get cached user synchronously (may be stale)
export function getCachedUserSync(): User | null {
  return lastUser;
}

// Check if user cache is fresh
export function isUserCacheFresh(): boolean {
  return lastUser !== null && (Date.now() - lastUserAt) < USER_TTL;
}

// Export cache status for debugging
export function getUserCacheStatus() {
  return {
    hasUser: !!lastUser,
    isInflight: !!inflightUser,
    lastUserAt,
    isFresh: isUserCacheFresh(),
    ttlRemaining: lastUser ? Math.max(0, USER_TTL - (Date.now() - lastUserAt)) : 0,
  };
}