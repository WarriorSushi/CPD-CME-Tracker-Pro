// Database operations for CME Tracker
import * as SQLite from 'expo-sqlite';
import { 
  CMEEntry, 
  Certificate, 
  LicenseRenewal, 
  AppSetting, 
  User,
  DatabaseOperationResult 
} from '../../types';
import { setupDatabase } from './schema';

// Database instance with proper singleton pattern
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Force clean database migration with proper cleanup
const forceCleanMigration = async (): Promise<SQLite.SQLiteDatabase> => {
  console.log('🧹 Force migration: Starting clean database migration...');
  
  try {
    // Create fresh database with simple initialization
    const db = await SQLite.openDatabaseAsync('cme_tracker.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create tables directly without migration system
    console.log('🏗️ Force migration: Creating fresh tables...');
    await createSimpleTables(db);
    
    // Test the new database before returning
    const isHealthy = await testDatabaseHealth(db);
    if (!isHealthy) {
      await safeCloseDatabase(db);
      throw new Error('Newly created database failed health check');
    }
    
    console.log('✅ Force migration: Created and verified fresh database');
    return db;
  } catch (error) {
    console.error('💥 Force migration: Error during clean migration:', error);
    throw error;
  }
};

// Simple table creation without migration complexity
const createSimpleTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync('BEGIN TRANSACTION;');
  
  try {
    // Users table without country column
    await db.execAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profession TEXT,
        credit_system TEXT,
        annual_requirement INTEGER,
        requirement_period INTEGER DEFAULT 1,
        cycle_start_date DATE,
        cycle_end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // CME entries table
    await db.execAsync(`
      CREATE TABLE cme_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        provider TEXT NOT NULL,
        date_attended DATE NOT NULL,
        credits_earned REAL NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        certificate_path TEXT,
        user_id INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Certificates table
    await db.execAsync(`
      CREATE TABLE certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        thumbnail_path TEXT,
        cme_entry_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cme_entry_id) REFERENCES cme_entries (id) ON DELETE CASCADE
      );
    `);

    // License renewals table  
    await db.execAsync(`
      CREATE TABLE license_renewals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_type TEXT NOT NULL,
        issuing_authority TEXT NOT NULL,
        license_number TEXT,
        expiration_date DATE NOT NULL,
        renewal_date DATE,
        required_credits REAL NOT NULL DEFAULT 0,
        completed_credits REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        user_id INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // App settings table
    await db.execAsync(`
      CREATE TABLE app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default app settings
    await db.execAsync(`
      INSERT INTO app_settings (key, value) VALUES
      ('onboarding_completed', 'false'),
      ('notification_enabled', 'true'),
      ('biometric_enabled', 'false'),
      ('theme_mode', 'light'),
      ('backup_enabled', 'true'),
      ('auto_scan_enabled', 'true');
    `);

    await db.execAsync('COMMIT;');
    console.log('✅ Simple tables created successfully');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
};

// Test if database instance is healthy
const testDatabaseHealth = async (db: SQLite.SQLiteDatabase): Promise<boolean> => {
  try {
    // Simple test query to verify database is functional
    await db.getFirstAsync('SELECT 1 as test');
    return true;
  } catch (error) {
    console.log('🩺 testDatabaseHealth: Database health check failed:', error);
    return false;
  }
};

// Safely close database with error handling
const safeCloseDatabase = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    await db.closeAsync();
    console.log('🔒 safeCloseDatabase: Database closed successfully');
  } catch (error) {
    console.log('⚠️ safeCloseDatabase: Error closing database (may already be closed):', error);
  }
};

// Force close and delete database with proper cleanup
const forceCleanupDatabase = async (): Promise<void> => {
  console.log('🧹 forceCleanupDatabase: Starting database cleanup...');
  
  // First, try to close the existing instance if it exists
  if (dbInstance) {
    console.log('🔒 forceCleanupDatabase: Closing existing database instance...');
    await safeCloseDatabase(dbInstance);
    dbInstance = null;
  }
  
  // Try to delete the database file with multiple attempts
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`🗑️ forceCleanupDatabase: Delete attempt ${attempts + 1}/${maxAttempts}`);
      await SQLite.deleteDatabaseAsync('cme_tracker.db');
      console.log('✅ forceCleanupDatabase: Database file deleted successfully');
      break;
    } catch (error) {
      attempts++;
      console.log(`💥 forceCleanupDatabase: Delete attempt ${attempts} failed:`, error);
      
      if (attempts >= maxAttempts) {
        console.log('⚠️ forceCleanupDatabase: All delete attempts failed, proceeding anyway...');
        break;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 200 * attempts));
    }
  }
};

// Get database instance with robust health checking
const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  // If instance exists, test its health before returning it
  if (dbInstance) {
    console.log('🩺 getDatabase: Testing cached database health...');
    const isHealthy = await testDatabaseHealth(dbInstance);
    
    if (isHealthy) {
      console.log('✅ getDatabase: Cached database is healthy, returning it');
      return dbInstance;
    } else {
      console.log('💀 getDatabase: Cached database is corrupted, cleaning up...');
      await safeCloseDatabase(dbInstance);
      dbInstance = null;
      // Continue to create new instance
    }
  }
  
  // If initialization is in progress, wait for it
  if (dbInitPromise) {
    console.log('⏳ getDatabase: Waiting for existing database initialization...');
    try {
      const db = await dbInitPromise;
      // Test the initialized database before returning
      const isHealthy = await testDatabaseHealth(db);
      if (!isHealthy) {
        console.log('💀 getDatabase: Newly initialized database is unhealthy, forcing cleanup...');
        dbInitPromise = null;
        throw new Error('Database initialization produced unhealthy instance');
      }
      return db;
    } catch (error) {
      console.error('💥 getDatabase: Waiting for initialization failed:', error);
      dbInitPromise = null;
      // Continue to create new instance
    }
  }
  
  // Start new database initialization
  console.log('🔄 getDatabase: Starting fresh database initialization...');
  
  dbInitPromise = (async () => {
    try {
      // Check if we need to force clean migration
      let needsCleanMigration = false;
      
      try {
        // Try to open existing database to check its state
        const testDb = await SQLite.openDatabaseAsync('cme_tracker.db');
        
        try {
          // Test if database is functional
          await testDb.getFirstAsync('SELECT 1 as test');
          
          // Check if users table exists with country column
          const tableInfo = await testDb.getFirstAsync(`
            SELECT sql FROM sqlite_master WHERE type='table' AND name='users'
          `);
          
          if (tableInfo && tableInfo.sql && tableInfo.sql.includes('country TEXT NOT NULL')) {
            console.log('⚠️ getDatabase: Found problematic country column, needs clean migration');
            needsCleanMigration = true;
          }
          
          await safeCloseDatabase(testDb);
        } catch (testError) {
          console.log('💀 getDatabase: Database test failed, needs clean migration:', testError);
          await safeCloseDatabase(testDb);
          needsCleanMigration = true;
        }
      } catch (openError) {
        console.log('🆕 getDatabase: Database doesn\'t exist or can\'t be opened, creating new...');
        needsCleanMigration = false; // Just create normally
      }
      
      let db: SQLite.SQLiteDatabase;
      
      if (needsCleanMigration) {
        console.log('🧹 getDatabase: Performing clean migration...');
        await forceCleanupDatabase();
        db = await forceCleanMigration();
      } else {
        console.log('📊 getDatabase: Using normal setup...');
        db = await setupDatabase();
      }
      
      // Final health check before caching
      const isHealthy = await testDatabaseHealth(db);
      if (!isHealthy) {
        await safeCloseDatabase(db);
        throw new Error('Database created but failed health check');
      }
      
      console.log('✅ getDatabase: Database instance created and verified healthy');
      return db;
      
    } catch (error) {
      console.error('💥 getDatabase: Database initialization failed:', error);
      throw error;
    }
  })();
  
  try {
    dbInstance = await dbInitPromise;
    return dbInstance;
  } catch (error) {
    console.error('💥 getDatabase: Failed to get database instance:', error);
    // Reset state for next attempt
    dbInstance = null;
    dbInitPromise = null;
    throw error;
  }
};

// Reset database instance (for complete app reset)
export const resetDatabaseInstance = async (): Promise<void> => {
  console.log('🔄 resetDatabaseInstance: Starting database instance reset...');
  
  // Safely close existing database
  if (dbInstance) {
    await safeCloseDatabase(dbInstance);
  }
  
  // Clear references
  dbInstance = null;
  dbInitPromise = null;
  
  console.log('✅ resetDatabaseInstance: Database instance reset - will be recreated on next access');
};

// User operations
export const userOperations = {
  // Get current user (for now, we only support single user)
  getCurrentUser: async (): Promise<DatabaseOperationResult<User>> => {
    try {
      const db = await getDatabase();
      const user = await db.getFirstAsync<any>(`
        SELECT 
          id,
          profession,
          credit_system as creditSystem,
          annual_requirement as annualRequirement,
          requirement_period as requirementPeriod,
          cycle_start_date as cycleStartDate,
          cycle_end_date as cycleEndDate,
          created_at as createdAt
        FROM users WHERE id = 1
      `);
      
      return {
        success: true,
        data: user || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  },

  // Update user information
  updateUser: async (userData: Partial<User>): Promise<DatabaseOperationResult> => {
    try {
      console.log('💾 DB Operations: updateUser called with:', userData);
      const db = await getDatabase();
      
      // First, check if user exists
      const existingUser = await db.getFirstAsync<any>('SELECT id FROM users WHERE id = 1');
      
      if (!existingUser) {
        console.log('⚠️ DB Operations: No user found, creating user with provided data only...');
        // Create user with only the fields that were actually provided
        const createFields = ['id'];
        const createPlaceholders = ['1']; // User ID is always 1
        const createValues: any[] = [];
        
        if (userData.profession) {
          createFields.push('profession');
          createPlaceholders.push('?');
          createValues.push(userData.profession);
        }
        if (userData.creditSystem) {
          createFields.push('credit_system');
          createPlaceholders.push('?');
          createValues.push(userData.creditSystem);
        }
        if (userData.annualRequirement) {
          createFields.push('annual_requirement');
          createPlaceholders.push('?');
          createValues.push(userData.annualRequirement);
        }
        if (userData.requirementPeriod) {
          createFields.push('requirement_period');
          createPlaceholders.push('?');
          createValues.push(userData.requirementPeriod);
        }
        if (userData.cycleStartDate) {
          createFields.push('cycle_start_date');
          createPlaceholders.push('?');
          createValues.push(userData.cycleStartDate);
        }
        if (userData.cycleEndDate) {
          createFields.push('cycle_end_date');
          createPlaceholders.push('?');
          createValues.push(userData.cycleEndDate);
        }
        
        await db.runAsync(`
          INSERT INTO users (${createFields.join(', ')})
          VALUES (${createPlaceholders.join(', ')})
        `, createValues);
        console.log('✅ DB Operations: User created with provided fields only');
        return { success: true };
      }
      
      const fields = [];
      const values = [];
      
      if (userData.profession) {
        fields.push('profession = ?');
        values.push(userData.profession);
      }
      if (userData.creditSystem) {
        console.log('🎯 DB Operations: Adding creditSystem to update:', userData.creditSystem);
        fields.push('credit_system = ?');
        values.push(userData.creditSystem);
      }
      if (userData.annualRequirement) {
        fields.push('annual_requirement = ?');
        values.push(userData.annualRequirement);
      }
      if (userData.requirementPeriod) {
        fields.push('requirement_period = ?');
        values.push(userData.requirementPeriod);
      }
      if (userData.cycleStartDate) {
        fields.push('cycle_start_date = ?');
        values.push(userData.cycleStartDate);
      }
      if (userData.cycleEndDate) {
        fields.push('cycle_end_date = ?');
        values.push(userData.cycleEndDate);
      }

      if (fields.length === 0) {
        return { success: true };
      }

      values.push(1); // user ID

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      console.log('📝 DB Operations: Executing query:', query);
      console.log('📝 DB Operations: With values:', values);
      
      const result = await db.runAsync(query, values);
      console.log('✅ DB Operations: Update result:', result);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  },
};

// CME entry operations
export const cmeOperations = {
  // Get all CME entries
  getAllEntries: async (year?: number): Promise<DatabaseOperationResult<CMEEntry[]>> => {
    try {
      const db = await getDatabase();
      
      let query = `
        SELECT 
          id,
          title,
          provider,
          date_attended as dateAttended,
          credits_earned as creditsEarned,
          category,
          notes,
          certificate_path as certificatePath,
          created_at as createdAt,
          updated_at as updatedAt
        FROM cme_entries 
        WHERE user_id = 1
      `;
      
      const params = [];
      
      if (year) {
        query += ` AND strftime('%Y', date_attended) = ?`;
        params.push(year.toString());
      }
      
      query += ' ORDER BY date_attended DESC';
      
      const entries = await db.getAllAsync<CMEEntry>(query, params);
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get CME entries',
      };
    }
  },

  // Get CME entry by ID
  getEntryById: async (id: number): Promise<DatabaseOperationResult<CMEEntry>> => {
    try {
      const db = await getDatabase();
      
      const entry = await db.getFirstAsync<CMEEntry>(`
        SELECT 
          id,
          title,
          provider,
          date_attended as dateAttended,
          credits_earned as creditsEarned,
          category,
          notes,
          certificate_path as certificatePath,
          created_at as createdAt,
          updated_at as updatedAt
        FROM cme_entries 
        WHERE id = ? AND user_id = 1
      `, [id]);
      
      return {
        success: true,
        data: entry || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get CME entry',
      };
    }
  },

  // Add new CME entry - simplified with robust database layer
  addEntry: async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseOperationResult<number>> => {
    try {
      console.log('🗃️ cmeOperations.addEntry: Starting database operation...');
      
      // Get healthy database instance (handles all corruption automatically)
      const db = await getDatabase();
      console.log('🗃️ cmeOperations.addEntry: Healthy database connection established');
      
      // Ensure user exists
      console.log('👤 cmeOperations.addEntry: Checking if user exists...');
      const userCheck = await db.getFirstAsync('SELECT id FROM users WHERE id = 1');
      console.log('👤 cmeOperations.addEntry: User check result:', userCheck);
      
      if (!userCheck) {
        console.log('⚠️ cmeOperations.addEntry: User with ID 1 does not exist, creating default user...');
        await db.runAsync(`
          INSERT OR IGNORE INTO users (id, profession, credit_system, annual_requirement, requirement_period)
          VALUES (1, 'Healthcare Professional', 'Credits', 50, 1)
        `);
        console.log('✅ cmeOperations.addEntry: Default user created');
      }
      
      console.log('📝 cmeOperations.addEntry: Preparing to insert CME entry with data:', {
        title: entry.title,
        provider: entry.provider,
        dateAttended: entry.dateAttended,
        creditsEarned: entry.creditsEarned,
        category: entry.category,
        notes: entry.notes || null,
        certificatePath: entry.certificatePath || null,
      });
      
      const result = await db.runAsync(`
        INSERT INTO cme_entries (
          title, provider, date_attended, credits_earned, 
          category, notes, certificate_path, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        entry.title,
        entry.provider,
        entry.dateAttended,
        entry.creditsEarned,
        entry.category,
        entry.notes || null,
        entry.certificatePath || null,
      ]);
      
      console.log('✅ cmeOperations.addEntry: Insert successful, lastInsertRowId:', result.lastInsertRowId);
      
      return {
        success: true,
        data: result.lastInsertRowId,
      };
    } catch (error) {
      console.error('💥 cmeOperations.addEntry: Database error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add CME entry',
      };
    }
  },

  // Update CME entry
  updateEntry: async (id: number, entry: Partial<CMEEntry>): Promise<DatabaseOperationResult> => {
    try {
      console.log('✏️ cmeOperations.updateEntry: Starting update for ID:', id);
      console.log('📝 cmeOperations.updateEntry: Update data:', entry);
      
      const db = await getDatabase();
      
      const fields = [];
      const values = [];
      
      if (entry.title) {
        fields.push('title = ?');
        values.push(entry.title);
      }
      if (entry.provider) {
        fields.push('provider = ?');
        values.push(entry.provider);
      }
      if (entry.dateAttended) {
        fields.push('date_attended = ?');
        values.push(entry.dateAttended);
      }
      if (entry.creditsEarned !== undefined) {
        fields.push('credits_earned = ?');
        values.push(entry.creditsEarned);
      }
      if (entry.category) {
        fields.push('category = ?');
        values.push(entry.category);
      }
      if (entry.notes !== undefined) {
        fields.push('notes = ?');
        values.push(entry.notes);
      }
      if (entry.certificatePath !== undefined) {
        fields.push('certificate_path = ?');
        values.push(entry.certificatePath);
      }

      if (fields.length === 0) {
        console.log('⚠️ cmeOperations.updateEntry: No fields to update');
        return { success: true };
      }

      values.push(id);

      const query = `UPDATE cme_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = 1`;
      console.log('📝 cmeOperations.updateEntry: Executing query:', query);
      console.log('📝 cmeOperations.updateEntry: With values:', values);
      
      const result = await db.runAsync(query, values);
      console.log('✅ cmeOperations.updateEntry: Update result:', result);

      return { success: true };
    } catch (error) {
      console.error('💥 cmeOperations.updateEntry: Database error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update CME entry',
      };
    }
  },

  // Delete CME entry
  deleteEntry: async (id: number): Promise<DatabaseOperationResult> => {
    try {
      console.log('🗑️ cmeOperations.deleteEntry: Starting delete for ID:', id);
      
      const db = await getDatabase();
      
      // First check if entry exists
      const existingEntry = await db.getFirstAsync(
        'SELECT id, title FROM cme_entries WHERE id = ? AND user_id = 1', 
        [id]
      );
      console.log('🔍 cmeOperations.deleteEntry: Existing entry check:', existingEntry);
      
      if (!existingEntry) {
        console.log('⚠️ cmeOperations.deleteEntry: Entry not found');
        return { 
          success: false, 
          error: 'Entry not found' 
        };
      }
      
      const result = await db.runAsync('DELETE FROM cme_entries WHERE id = ? AND user_id = 1', [id]);
      console.log('✅ cmeOperations.deleteEntry: Delete result:', result);
      
      // Verify deletion
      const verifyDeleted = await db.getFirstAsync(
        'SELECT id FROM cme_entries WHERE id = ? AND user_id = 1', 
        [id]
      );
      console.log('🔍 cmeOperations.deleteEntry: Verify deleted:', verifyDeleted);
      
      return { success: true };
    } catch (error) {
      console.error('💥 cmeOperations.deleteEntry: Database error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete CME entry',
      };
    }
  },

  // Get total credits for current year
  getTotalCredits: async (year?: number): Promise<DatabaseOperationResult<number>> => {
    try {
      const db = await getDatabase();
      
      const currentYear = year || new Date().getFullYear();
      
      const result = await db.getFirstAsync<{ total: number }>(`
        SELECT COALESCE(SUM(credits_earned), 0) as total
        FROM cme_entries 
        WHERE user_id = 1 
        AND strftime('%Y', date_attended) = ?
      `, [currentYear.toString()]);
      
      return {
        success: true,
        data: result?.total || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get total credits',
      };
    }
  },

  // Get CME entries within a date range
  getEntriesInDateRange: async (startDate: string, endDate: string): Promise<DatabaseOperationResult<CMEEntry[]>> => {
    try {
      const db = await getDatabase();
      
      const entries = await db.getAllAsync<CMEEntry>(`
        SELECT 
          id,
          title,
          provider,
          date_attended as dateAttended,
          credits_earned as creditsEarned,
          category,
          notes,
          certificate_path as certificatePath,
          created_at as createdAt,
          updated_at as updatedAt
        FROM cme_entries 
        WHERE user_id = 1
        AND date_attended >= ?
        AND date_attended < ?
        ORDER BY date_attended DESC
      `, [startDate, endDate]);
      
      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get CME entries in date range',
      };
    }
  },

  // Get total credits within a date range
  getTotalCreditsInRange: async (startDate: string, endDate: string): Promise<DatabaseOperationResult<number>> => {
    try {
      const db = await getDatabase();
      
      const result = await db.getFirstAsync<{ total: number }>(`
        SELECT COALESCE(SUM(credits_earned), 0) as total
        FROM cme_entries 
        WHERE user_id = 1 
        AND date_attended >= ?
        AND date_attended < ?
      `, [startDate, endDate]);
      
      return {
        success: true,
        data: result?.total || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get total credits in range',
      };
    }
  },
};

// Certificate operations
export const certificateOperations = {
  // Get all certificates
  getAllCertificates: async (): Promise<DatabaseOperationResult<Certificate[]>> => {
    try {
      const db = await getDatabase();
      
      const certificates = await db.getAllAsync<Certificate>(`
        SELECT 
          id,
          file_path as filePath,
          file_name as fileName,
          file_size as fileSize,
          mime_type as mimeType,
          thumbnail_path as thumbnailPath,
          cme_entry_id as cmeEntryId,
          created_at as createdAt
        FROM certificates 
        ORDER BY created_at DESC
      `);
      
      return {
        success: true,
        data: certificates,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get certificates',
      };
    }
  },

  // Add certificate
  addCertificate: async (certificate: Omit<Certificate, 'id' | 'createdAt'>): Promise<DatabaseOperationResult<number>> => {
    try {
      const db = await getDatabase();
      
      const result = await db.runAsync(`
        INSERT INTO certificates (
          file_path, file_name, file_size, mime_type, 
          thumbnail_path, cme_entry_id
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        certificate.filePath,
        certificate.fileName,
        certificate.fileSize,
        certificate.mimeType,
        certificate.thumbnailPath || null,
        certificate.cmeEntryId || null,
      ]);
      
      return {
        success: true,
        data: result.lastInsertRowId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add certificate',
      };
    }
  },

  // Delete certificate
  deleteCertificate: async (id: number): Promise<DatabaseOperationResult> => {
    try {
      const db = await getDatabase();
      
      await db.runAsync('DELETE FROM certificates WHERE id = ?', [id]);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete certificate',
      };
    }
  },
};

// License renewal operations
export const licenseOperations = {
  // Get all licenses
  getAllLicenses: async (): Promise<DatabaseOperationResult<LicenseRenewal[]>> => {
    try {
      const db = await getDatabase();
      
      const licenses = await db.getAllAsync<LicenseRenewal>(`
        SELECT 
          id,
          license_type as licenseType,
          issuing_authority as issuingAuthority,
          license_number as licenseNumber,
          expiration_date as expirationDate,
          renewal_date as renewalDate,
          required_credits as requiredCredits,
          completed_credits as completedCredits,
          status,
          created_at as createdAt,
          updated_at as updatedAt
        FROM license_renewals 
        WHERE user_id = 1
        ORDER BY expiration_date ASC
      `);
      
      return {
        success: true,
        data: licenses,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get licenses',
      };
    }
  },

  // Add license
  addLicense: async (license: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseOperationResult<number>> => {
    try {
      const db = await getDatabase();
      
      const result = await db.runAsync(`
        INSERT INTO license_renewals (
          license_type, issuing_authority, license_number,
          expiration_date, renewal_date, required_credits,
          completed_credits, status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        license.licenseType,
        license.issuingAuthority,
        license.licenseNumber || null,
        license.expirationDate,
        license.renewalDate || null,
        license.requiredCredits,
        license.completedCredits,
        license.status,
      ]);
      
      return {
        success: true,
        data: result.lastInsertRowId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add license',
      };
    }
  },

  // Update license
  updateLicense: async (id: number, license: Partial<LicenseRenewal>): Promise<DatabaseOperationResult> => {
    try {
      const db = await getDatabase();
      
      const fields = [];
      const values = [];
      
      if (license.licenseType) {
        fields.push('license_type = ?');
        values.push(license.licenseType);
      }
      if (license.issuingAuthority) {
        fields.push('issuing_authority = ?');
        values.push(license.issuingAuthority);
      }
      if (license.licenseNumber !== undefined) {
        fields.push('license_number = ?');
        values.push(license.licenseNumber);
      }
      if (license.expirationDate) {
        fields.push('expiration_date = ?');
        values.push(license.expirationDate);
      }
      if (license.renewalDate !== undefined) {
        fields.push('renewal_date = ?');
        values.push(license.renewalDate);
      }
      if (license.requiredCredits !== undefined) {
        fields.push('required_credits = ?');
        values.push(license.requiredCredits);
      }
      if (license.completedCredits !== undefined) {
        fields.push('completed_credits = ?');
        values.push(license.completedCredits);
      }
      if (license.status) {
        fields.push('status = ?');
        values.push(license.status);
      }

      if (fields.length === 0) {
        return { success: true };
      }

      values.push(id);

      const query = `UPDATE license_renewals SET ${fields.join(', ')} WHERE id = ? AND user_id = 1`;
      await db.runAsync(query, values);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update license',
      };
    }
  },

  // Delete license
  deleteLicense: async (id: number): Promise<DatabaseOperationResult> => {
    try {
      const db = await getDatabase();
      
      await db.runAsync('DELETE FROM license_renewals WHERE id = ? AND user_id = 1', [id]);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete license',
      };
    }
  },
};

// App settings operations
export const settingsOperations = {
  // Get setting by key
  getSetting: async (key: string): Promise<DatabaseOperationResult<string>> => {
    try {
      const db = await getDatabase();
      
      const setting = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        [key]
      );
      
      return {
        success: true,
        data: setting?.value,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get setting',
      };
    }
  },

  // Set setting
  setSetting: async (key: string, value: string): Promise<DatabaseOperationResult> => {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`⚙️ settingsOperations.setSetting: Attempt ${retryCount + 1} - Starting with key:`, key, 'value:', value);
        const db = await getDatabase();
        console.log('⚙️ settingsOperations.setSetting: Database connection established');
        
        // First, ensure the app_settings table exists
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ settingsOperations.setSetting: Table ensured to exist');
        
        // Use execAsync for more reliable execution
        await db.execAsync(`
          INSERT OR REPLACE INTO app_settings (key, value) 
          VALUES ('${key}', '${value}')
        `);
        
        console.log('✅ settingsOperations.setSetting: Setting saved successfully');
        return { success: true };
        
      } catch (error) {
        retryCount++;
        console.error(`💥 settingsOperations.setSetting: Attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          console.error('💥 settingsOperations.setSetting: Max retries reached, giving up');
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set setting after retries',
          };
        }
        
        // Wait a bit before retrying
        console.log(`⏳ settingsOperations.setSetting: Waiting before retry ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }
    
    return { success: false, error: 'Unexpected error in setSetting' };
  },

  // Complete app reset - wipe all data and reset database
  resetAllData: async (): Promise<DatabaseOperationResult> => {
    try {
      console.log('🧹 settingsOperations.resetAllData: Starting complete app reset...');
      const db = await getDatabase();
      console.log('🧹 settingsOperations.resetAllData: Database connection established');
      
      // Delete all data from all tables
      await db.runAsync('DELETE FROM cme_entries');
      console.log('✅ settingsOperations.resetAllData: CME entries cleared');
      
      await db.runAsync('DELETE FROM certificates');
      console.log('✅ settingsOperations.resetAllData: Certificates cleared');
      
      await db.runAsync('DELETE FROM license_renewals');
      console.log('✅ settingsOperations.resetAllData: License renewals cleared');
      
      await db.runAsync('DELETE FROM users');
      console.log('✅ settingsOperations.resetAllData: Users cleared');
      
      await db.runAsync('DELETE FROM app_settings');
      console.log('✅ settingsOperations.resetAllData: App settings cleared');
      
      // Reset database version to 0 to force recreation of tables and data
      console.log('🔄 settingsOperations.resetAllData: Resetting database version...');
      await db.execAsync('PRAGMA user_version = 0');
      
      // Reset the database instance so it gets recreated properly on next access
      console.log('🔄 settingsOperations.resetAllData: Resetting database instance...');
      await resetDatabaseInstance();
      
      console.log('🎉 settingsOperations.resetAllData: Complete app reset successful');
      return { success: true };
    } catch (error) {
      console.error('💥 settingsOperations.resetAllData: Error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset app data',
      };
    }
  },

  // Get all settings
  getAllSettings: async (): Promise<DatabaseOperationResult<Record<string, string>>> => {
    try {
      const db = await getDatabase();
      
      const settings = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM app_settings'
      );
      
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      return {
        success: true,
        data: settingsObject,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get all settings',
      };
    }
  },
};

// Export all operations
export const databaseOperations = {
  user: userOperations,
  cme: cmeOperations,
  certificates: certificateOperations,
  licenses: licenseOperations,
  settings: settingsOperations,
};