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
    console.log(...args);
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
          console.error('💥 Database health check failed - this should never happen');
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
    devLog('⏳ getDatabase: Waiting for existing database initialization...');
    return opening;
  }

  // Start opening process
  devLog('🚀 getDatabase: Starting fresh database initialization...');
  
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
      devLog('✅ getDatabase: Database opened and verified healthy');
      
      return handle;
    } catch (error) {
      console.error('💥 getDatabase: Failed to open database:', error);
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
  devLog('🔄 resetDatabaseForAppReset: Resetting database singleton...');
  
  if (db) {
    try {
      await db.closeAsync();
    } catch (error) {
      devLog('⚠️ resetDatabaseForAppReset: Error closing database:', error);
    }
  }
  
  db = null;
  opening = null;
  lastHealthOkAt = 0;
  
  devLog('✅ resetDatabaseForAppReset: Database singleton reset');
}

// Emergency corruption recovery - recreate database from scratch
export async function recoverFromCorruption(): Promise<void> {
  try {
    devLog('🚨 recoverFromCorruption: Starting emergency database recovery...');
    
    // Force close any existing connection
    if (db) {
      try {
        await db.closeAsync();
      } catch (error) {
        devLog('⚠️ recoverFromCorruption: Error closing corrupted database (expected):', error);
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
        devLog('🗑️ recoverFromCorruption: Deleted corrupted database file');
      }
    } catch (error) {
      devLog('⚠️ recoverFromCorruption: Could not delete database file (may not exist):', error);
    }
    
    // Force fresh database creation on next access
    devLog('✅ recoverFromCorruption: Recovery complete - database will be recreated on next access');
    
  } catch (error) {
    console.error('💥 recoverFromCorruption: Recovery failed:', error);
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
    const testResult = await db.getFirstAsync('SELECT 1 as test');
    if (!testResult || testResult.test !== 1) {
      devLog('⚠️ checkDatabaseHealth: Basic test query failed');
      return false;
    }
    
    // Try to access app tables
    const tableTest = await db.getFirstAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    if (!tableTest) {
      devLog('⚠️ checkDatabaseHealth: Required tables not found');
      return false;
    }
    
    lastHealthOkAt = Date.now();
    return true;
    
  } catch (error) {
    devLog('💀 checkDatabaseHealth: Database health check failed:', error);
    
    // Check if this is a corruption-related error
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isCorruption = errorMessage.includes('database') && 
                        (errorMessage.includes('corrupt') || 
                         errorMessage.includes('malformed') ||
                         errorMessage.includes('nullpointer') ||
                         errorMessage.includes('rejected'));
    
    if (isCorruption) {
      devLog('🚨 checkDatabaseHealth: Database corruption detected - triggering recovery');
      try {
        await recoverFromCorruption();
      } catch (recoveryError) {
        console.error('💥 checkDatabaseHealth: Recovery failed:', recoveryError);
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