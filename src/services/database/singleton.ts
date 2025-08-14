// True singleton database - opens once per app lifetime, never closes
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { setupDatabase } from './schema';
import { testDatabaseHealthSafe } from '../../utils/DatabaseUtils';

// Singleton state - module level, imported once at top level
let db: SQLite.SQLiteDatabase | null = null;
let opening: Promise<SQLite.SQLiteDatabase> | null = null;
let lastHealthOkAt = 0;
const HEALTH_OK_TTL = 300000; // 5 minutes - much longer since we never close

// Development logging helper
const isDevelopment = __DEV__;
const devLog = (...args: any[]) => {
  if (isDevelopment) {

  }
};

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing handle immediately
  if (db) {
    // Optional health check with very long TTL
    const now = Date.now();
    if (now - lastHealthOkAt > HEALTH_OK_TTL) {
      // Non-blocking health check - don't await it
      testDatabaseHealthSafe(db).then(isHealthy => {
        if (isHealthy) {
          lastHealthOkAt = now;
        } else {
      __DEV__ && console.error('💥 Database health check failed - this should never happen');
          // In production, we might want to restart the app or show error
        }
      }).catch(() => {
        // Ignore health check errors - keep using existing handle
      });
    }
    return db;
  }

  // If already opening, wait for the same promise (singleflight pattern)
  if (opening) {

    return opening;
  }

  // Start opening process

  opening = (async () => {
    try {
      // Open and setup database
      const handle = await setupDatabase();
      
      // Run initial health check
      const isHealthy = await testDatabaseHealthSafe(handle);
      if (!isHealthy) {
        throw new Error('Database failed initial health check');
      }
      
      lastHealthOkAt = Date.now();

      return handle;
    } catch (error) {
      __DEV__ && console.error('💥 getDatabase: Failed to open database:', error);
      throw error;
    }
  })().finally(() => {
    opening = null; // Clear opening flag regardless of success/failure
  });

  try {
    db = await opening;
    return db;
  } catch (error) {
    // Reset state on failure
    db = null;
    throw error;
  }
}

// Only for complete app reset - not used during normal operation
export async function resetDatabaseForAppReset(): Promise<void> {

  if (db) {
    try {
      await db.closeAsync();
    } catch (error) {

    }
  }
  
  db = null;
  opening = null;
  lastHealthOkAt = 0;

}

// Emergency corruption recovery - recreate database from scratch
export async function recoverFromCorruption(): Promise<void> {
  try {

    // Force close any existing connection
    if (db) {
      try {
        await db.closeAsync();
      } catch (error) {

      }
    }
    
    // Reset all state
    db = null;
    opening = null;
    lastHealthOkAt = 0;
    
    // Delete corrupted database file completely
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/cme_tracker.db`;
      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (dbInfo.exists) {
        await FileSystem.deleteAsync(dbPath);

      }
    } catch (error) {

    }
    
    // Force fresh database creation on next access

  } catch (error) {
      __DEV__ && console.error('💥 recoverFromCorruption: Recovery failed:', error);
    throw error;
  }
}

// Enhanced database health check with corruption detection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!db) {
      return false; // No database connection
    }
    
    // Try basic operations
    const testResult = await db.getFirstAsync<{ test: number }>('SELECT 1 as test');
    if (!testResult || testResult.test !== 1) {

      return false;
    }
    
    // Try to access app tables
    const tableTest = await db.getFirstAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    if (!tableTest) {

      return false;
    }
    
    lastHealthOkAt = Date.now();
    return true;
    
  } catch (error) {

    // Check if this is a corruption-related error
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isCorruption = errorMessage.includes('database') && 
                        (errorMessage.includes('corrupt') || 
                         errorMessage.includes('malformed') ||
                         errorMessage.includes('nullpointer') ||
                         errorMessage.includes('rejected'));
    
    if (isCorruption) {

      try {
        await recoverFromCorruption();
      } catch (recoveryError) {
      __DEV__ && console.error('💥 checkDatabaseHealth: Recovery failed:', recoveryError);
      }
    }
    
    return false;
  }
}

// Export read-only status for debugging
export function getDatabaseStatus() {
  return {
    isOpen: !!db,
    isOpening: !!opening,
    lastHealthOkAt,
  };
}