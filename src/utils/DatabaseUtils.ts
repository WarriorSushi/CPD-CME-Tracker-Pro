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
  console.log('🔍 DatabaseUtils: Getting first row with query:', sql);
  
  try {
    // Use direct database method for better compatibility
    const result = await db.getFirstAsync<T>(sql, params || []);
    return result;
  } catch (error) {
    console.error('💥 DatabaseUtils: getFirstSafe failed:', error);
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
  console.log('📋 DatabaseUtils: Getting all rows with query:', sql);
  
  try {
    // Use direct database method for better compatibility
    const result = await db.getAllAsync<T>(sql, params || []);
    return result;
  } catch (error) {
    console.error('💥 DatabaseUtils: getAllSafe failed:', error);
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
  console.log('🚀 DatabaseUtils: Running statement safely:', sql);
  
  try {
    // Use direct database method for better compatibility
    const result = await db.runAsync(sql, params || []);
    return result;
  } catch (error) {
    console.error('💥 DatabaseUtils: runSafe failed:', error);
    throw error;
  }
}

/**
 * Safely closes a database with proper error handling
 */
export async function closeDatabaseSafe(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    console.log('🔒 DatabaseUtils: Closing database safely...');
    await db.closeAsync();
    console.log('✅ DatabaseUtils: Database closed successfully');
  } catch (error) {
    console.warn('⚠️ DatabaseUtils: Warning during database close (may already be closed):', error);
    // Don't throw - database might already be closed
  }
}

/**
 * Waits for all pending database operations to complete
 * This is crucial before deleting database files
 */
export async function waitForPendingOperations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    console.log('⏳ DatabaseUtils: Waiting for pending operations...');
    
    // Execute a simple query to ensure all pending operations are complete
    await db.execAsync('PRAGMA schema_version');
    
    // Small delay to ensure Android native handles are released
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ DatabaseUtils: All pending operations completed');
  } catch (error) {
    console.warn('⚠️ DatabaseUtils: Error waiting for pending operations:', error);
    throw error;
  }
}

/**
 * Forces cleanup of database handles and connections
 */
export async function forceCleanupHandles(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    console.log('🧹 DatabaseUtils: Force cleaning up database handles...');
    
    // Wait for pending operations
    await waitForPendingOperations(db);
    
    // Close the database
    await closeDatabaseSafe(db);
    
    // Additional wait for Android to release native handles
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('✅ DatabaseUtils: Database handles cleaned up');
  } catch (error) {
    console.error('💥 DatabaseUtils: Error during force cleanup:', error);
    throw error;
  }
}

/**
 * Tests if a database instance is healthy without causing NPEs
 */
export async function testDatabaseHealthSafe(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    console.log('🩺 DatabaseUtils: Testing database health safely...');
    
    // Use a simple safe query that shouldn't cause NPEs
    await getFirstSafe(db, 'SELECT 1 as test');
    
    console.log('✅ DatabaseUtils: Database health check passed');
    return true;
  } catch (error) {
    console.log('💀 DatabaseUtils: Database health check failed:', error);
    return false;
  }
}

/**
 * Safely deletes a database file with proper handle cleanup
 */
export async function deleteDatabaseSafe(databaseName: string, db?: SQLite.SQLiteDatabase): Promise<void> {
  try {
    console.log(`🗑️ DatabaseUtils: Safely deleting database: ${databaseName}`);
    
    // If database instance provided, clean it up first
    if (db) {
      await forceCleanupHandles(db);
    }
    
    // Additional wait to ensure Android handles are released
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Attempt to delete the database file
    await SQLite.deleteDatabaseAsync(databaseName);
    console.log(`✅ DatabaseUtils: Database ${databaseName} deleted successfully`);
    
  } catch (error) {
    console.error(`💥 DatabaseUtils: Error deleting database ${databaseName}:`, error);
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
  console.log('🔄 DatabaseUtils: Starting transaction...');
  
  try {
    await db.execAsync('BEGIN TRANSACTION');
    console.log('✅ DatabaseUtils: Transaction started');
    
    const result = await operation();
    
    await db.execAsync('COMMIT');
    console.log('✅ DatabaseUtils: Transaction committed');
    
    return result;
  } catch (error) {
    console.error('💥 DatabaseUtils: Transaction failed, rolling back:', error);
    try {
      await db.execAsync('ROLLBACK');
      console.log('🔄 DatabaseUtils: Transaction rolled back');
    } catch (rollbackError) {
      console.error('💥 DatabaseUtils: Rollback failed:', rollbackError);
    }
    throw error;
  }
}