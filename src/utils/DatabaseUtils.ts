// Database utilities for safe operations and proper handle management
// Prevents Android SQLite NPEs by ensuring proper resource cleanup
import * as SQLite from 'expo-sqlite';

/**
 * Safely gets first row using direct database method (fallback for compatibility)
 */
export async function getFirstSafe<T = any>(
  db: SQLite.SQLiteDatabase,
  sql: string,
  params?: any[]
): Promise<T | null> {

  try {
    // Use direct database method for better compatibility
    const result = await db.getFirstAsync<T>(sql, params || []);
    return result;
  } catch (error) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: getFirstSafe failed:', error);
    throw error;
  }
}

/**
 * Safely gets all rows using direct database method (fallback for compatibility)
 */
export async function getAllSafe<T = any>(
  db: SQLite.SQLiteDatabase,
  sql: string,
  params?: any[]
): Promise<T[]> {

  try {
    // Use direct database method for better compatibility
    const result = await db.getAllAsync<T>(sql, params || []);
    return result;
  } catch (error) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: getAllSafe failed:', error);
    throw error;
  }
}

/**
 * Safely runs a statement using direct database method (fallback for compatibility)
 */
export async function runSafe(
  db: SQLite.SQLiteDatabase,
  sql: string,
  params?: any[]
): Promise<SQLite.SQLiteRunResult> {

  try {
    // Use direct database method for better compatibility
    const result = await db.runAsync(sql, params || []);
    return result;
  } catch (error) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: runSafe failed:', error);
    throw error;
  }
}

/**
 * Safely closes a database with proper error handling
 */
export async function closeDatabaseSafe(db: SQLite.SQLiteDatabase): Promise<void> {
  try {

    await db.closeAsync();

  } catch (error) {
    console.warn('[WARN] DatabaseUtils: Warning during database close (may already be closed):', error);
    // Don't throw - database might already be closed
  }
}

/**
 * Waits for all pending database operations to complete
 * This is crucial before deleting database files
 */
export async function waitForPendingOperations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {

    // Execute a simple query to ensure all pending operations are complete
    await db.execAsync('PRAGMA schema_version');
    
    // Small delay to ensure Android native handles are released
    await new Promise(resolve => setTimeout(resolve, 100));

  } catch (error) {
    console.warn('[WARN] DatabaseUtils: Error waiting for pending operations:', error);
    throw error;
  }
}

/**
 * Forces cleanup of database handles and connections
 */
export async function forceCleanupHandles(db: SQLite.SQLiteDatabase): Promise<void> {
  try {

    // Wait for pending operations
    await waitForPendingOperations(db);
    
    // Close the database
    await closeDatabaseSafe(db);
    
    // Additional wait for Android to release native handles
    await new Promise(resolve => setTimeout(resolve, 200));

  } catch (error) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: Error during force cleanup:', error);
    throw error;
  }
}

/**
 * Tests if a database instance is healthy without causing NPEs
 */
export async function testDatabaseHealthSafe(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {

    // Use a simple safe query that shouldn't cause NPEs
    await getFirstSafe(db, 'SELECT 1 as test');

    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Safely deletes a database file with proper handle cleanup
 */
export async function deleteDatabaseSafe(databaseName: string, db?: SQLite.SQLiteDatabase): Promise<void> {
  try {

    // If database instance provided, clean it up first
    if (db) {
      await forceCleanupHandles(db);
    }
    
    // Additional wait to ensure Android handles are released
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Attempt to delete the database file
    await SQLite.deleteDatabaseAsync(databaseName);

  } catch (error) {
      __DEV__ && console.error(`[ERROR] DatabaseUtils: Error deleting database ${databaseName}:`, error);
    throw error;
  }
}

/**
 * Creates a safe database transaction wrapper
 */
export async function runInTransaction<T>(
  db: SQLite.SQLiteDatabase,
  operation: () => Promise<T>
): Promise<T> {

  try {
    await db.execAsync('BEGIN TRANSACTION');

    const result = await operation();
    
    await db.execAsync('COMMIT');

    return result;
  } catch (error) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: Transaction failed, rolling back:', error);
    try {
      await db.execAsync('ROLLBACK');

    } catch (rollbackError) {
      __DEV__ && console.error('[ERROR] DatabaseUtils: Rollback failed:', rollbackError);
    }
    throw error;
  }
}