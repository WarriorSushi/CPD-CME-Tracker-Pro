// True singleton database - opens once per app lifetime, never closes
import * as SQLite from 'expo-sqlite';
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

// Export read-only status for debugging
export function getDatabaseStatus() {
  return {
    isOpen: !!db,
    isOpening: !!opening,
    lastHealthOkAt,
  };
}