// Database schema definitions for CME Tracker
import * as SQLite from 'expo-sqlite';
import { APP_CONFIG } from '../../constants';

// Database initialization
export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await SQLite.openDatabaseAsync(APP_CONFIG.DATABASE_NAME);
  
  // Enable foreign key constraints
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  return db;
};

// Create all tables (assumes transaction is already started by caller)
export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('🏗️ createTables: Starting table creation/migration...');

    // First, handle users table migration/creation
    const tableExists = await db.getFirstAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `);
    
    if (tableExists) {
      console.log('🔍 Migration: Checking if users table needs migration...');
      
      // Check if we need migration (either country column exists or profile columns are missing)
      const columns = await db.getAllAsync('PRAGMA table_info(users)');
      const columnNames = columns.map((col: any) => col.name);
      
      const countryColumnExists = columnNames.includes('country');
      const profileColumnsExist = columnNames.includes('profile_name') && columnNames.includes('age') && columnNames.includes('profile_picture_path');
      
      // Force migration if any profile column is missing - make this more explicit
      const needsMigration = countryColumnExists || !profileColumnsExist;
      
      console.log('🔍 Migration check - Column names:', columnNames);
      console.log('🔍 Migration check - Country exists:', countryColumnExists, 'Profile exists:', profileColumnsExist);
      console.log('🔍 Migration check - Needs migration:', needsMigration);
      console.log('🔍 Migration check - Specific profile columns missing:', {
        profile_name: !columnNames.includes('profile_name'),
        age: !columnNames.includes('age'),
        profile_picture_path: !columnNames.includes('profile_picture_path')
      });
      
      // FORCE migration for now to ensure profile columns are added
      if (needsMigration || !profileColumnsExist) {
        console.log('🔄 Migration: Recreating users table...');
        console.log('🔄 Migration reason - Country exists:', countryColumnExists, 'Profile missing:', !profileColumnsExist);
        
        // Backup existing user data - only select columns that exist
        const selectColumns = ['id', 'profession', 'credit_system', 'annual_requirement', 
                              'requirement_period', 'cycle_start_date', 'cycle_end_date'];
        
        // Add profile columns only if they exist
        if (columnNames.includes('profile_name')) selectColumns.push('profile_name');
        if (columnNames.includes('age')) selectColumns.push('age');
        if (columnNames.includes('profile_picture_path')) selectColumns.push('profile_picture_path');
        selectColumns.push('created_at');
        
        const existingUsers = await db.getAllAsync(`
          SELECT ${selectColumns.join(', ')} FROM users
        `);
        
        console.log('📦 Migration: Backed up', existingUsers.length, 'user records');
        
        // Drop old table
        await db.execAsync('DROP TABLE users');
        console.log('🗑️ Migration: Dropped old users table');
        
        // Create new table without country column
        await db.execAsync(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profession TEXT,
            credit_system TEXT,
            annual_requirement INTEGER,
            requirement_period INTEGER DEFAULT 1,
            cycle_start_date DATE,
            cycle_end_date DATE,
            profile_name TEXT,
            age INTEGER,
            profile_picture_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('🆕 Migration: Created new users table');
        
        // Restore data without country column
        for (const user of existingUsers) {
          const userData = user as any; // Type assertion for migration data
          await db.runAsync(`
            INSERT INTO users (id, profession, credit_system, annual_requirement, requirement_period, cycle_start_date, cycle_end_date, profile_name, age, profile_picture_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userData.id,
            userData.profession,
            userData.credit_system,
            userData.annual_requirement || null,
            userData.requirement_period || 1,
            userData.cycle_start_date || null,
            userData.cycle_end_date || null,
            userData.profile_name || null,
            userData.age || null,
            userData.profile_picture_path || null,
            userData.created_at
          ]);
        }
        
        console.log('✅ Migration: Successfully migrated', existingUsers.length, 'users to new table');
      } else {
        console.log('ℹ️ Migration: Users table already migrated, no action needed');
      }
    } else {
      // Create table normally (first time)
      console.log('🆕 Creating users table for the first time...');
      await db.execAsync(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profession TEXT,
          credit_system TEXT,
          annual_requirement INTEGER,
          requirement_period INTEGER DEFAULT 1,
          cycle_start_date DATE,
          cycle_end_date DATE,
          profile_name TEXT,
          age INTEGER,
          profile_picture_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created new users table');
    }

    // CME entries table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cme_entries (
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
      CREATE TABLE IF NOT EXISTS certificates (
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
      CREATE TABLE IF NOT EXISTS license_renewals (
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

    // CME event reminders table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cme_event_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        event_date DATE NOT NULL,
        user_id INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // App settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cme_entries_date_attended ON cme_entries (date_attended);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cme_entries_user_id ON cme_entries (user_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_certificates_cme_entry_id ON certificates (cme_entry_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_license_renewals_expiration_date ON license_renewals (expiration_date);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_license_renewals_user_id ON license_renewals (user_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cme_event_reminders_event_date ON cme_event_reminders (event_date);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cme_event_reminders_user_id ON cme_event_reminders (user_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);
    `);

    // Create triggers for automatic updated_at timestamps
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_cme_entries_timestamp 
      AFTER UPDATE ON cme_entries
      FOR EACH ROW
      BEGIN
        UPDATE cme_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_license_renewals_timestamp 
      AFTER UPDATE ON license_renewals
      FOR EACH ROW
      BEGIN
        UPDATE license_renewals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_cme_event_reminders_timestamp 
      AFTER UPDATE ON cme_event_reminders
      FOR EACH ROW
      BEGIN
        UPDATE cme_event_reminders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_app_settings_timestamp 
      AFTER UPDATE ON app_settings
      FOR EACH ROW
      BEGIN
        UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    // Note: User will be created during onboarding flow - no default user needed

    // Insert default app settings
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value) VALUES
      ('onboarding_completed', 'false'),
      ('notification_enabled', 'true'),
      ('biometric_enabled', 'false'),
      ('theme_mode', 'light'),
      ('backup_enabled', 'true'),
      ('auto_scan_enabled', 'true');
    `);

    
    console.log('✅ createTables: Database tables created successfully');
  } catch (error) {
    console.error('💥 createTables: Error creating database tables:', error);
    throw error;
  }
};

// Database migration functions
export const migrateDatabase = async (
  db: SQLite.SQLiteDatabase,
  currentVersion: number,
  targetVersion: number
): Promise<void> => {
  console.log(`Migrating database from version ${currentVersion} to ${targetVersion}`);
  
  try {
    // Migration from version 0 to 1 - initial setup
    if (currentVersion < 1 && targetVersion >= 1) {
      console.log('🔄 Running migration 0 -> 1: Creating initial tables...');
      
      // Check if users table exists and add missing columns if needed
      const tableInfo = await db.getAllAsync(`PRAGMA table_info(users)`);
      const hasRequirementPeriod = tableInfo.some((col: any) => col.name === 'requirement_period');
      const hasCycleStartDate = tableInfo.some((col: any) => col.name === 'cycle_start_date');
      const hasCycleEndDate = tableInfo.some((col: any) => col.name === 'cycle_end_date');
      
      if (tableInfo.length > 0) {
        // Table exists, add missing columns
        if (!hasRequirementPeriod) {
          console.log('⚙️ Adding requirement_period column to existing users table...');
          await db.execAsync(`ALTER TABLE users ADD COLUMN requirement_period INTEGER NOT NULL DEFAULT 1`);
        }
        if (!hasCycleStartDate) {
          console.log('⚙️ Adding cycle_start_date column to existing users table...');
          await db.execAsync(`ALTER TABLE users ADD COLUMN cycle_start_date DATE`);
        }
        if (!hasCycleEndDate) {
          console.log('⚙️ Adding cycle_end_date column to existing users table...');
          await db.execAsync(`ALTER TABLE users ADD COLUMN cycle_end_date DATE`);
        }
      } else {
        // Table doesn't exist, create all tables
        console.log('🏗️ Creating all database tables...');
        await createTables(db);
      }
      
      console.log('✅ Migration 0 -> 1 completed successfully');
    }

    // Migration from version 1 to 2 - add CME event reminders table
    if (currentVersion < 2 && targetVersion >= 2) {
      console.log('🔄 Running migration 1 -> 2: Adding CME event reminders table...');
      
      // Create the CME event reminders table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cme_event_reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_name TEXT NOT NULL,
          event_date DATE NOT NULL,
          user_id INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Create indexes for the new table
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cme_event_reminders_event_date ON cme_event_reminders (event_date);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cme_event_reminders_user_id ON cme_event_reminders (user_id);
      `);

      // Create trigger for automatic updated_at timestamp
      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS update_cme_event_reminders_timestamp 
        AFTER UPDATE ON cme_event_reminders
        FOR EACH ROW
        BEGIN
          UPDATE cme_event_reminders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);

      console.log('✅ Migration 1 -> 2 completed successfully');
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
};

// Get current database version
export const getDatabaseVersion = async (db: SQLite.SQLiteDatabase): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    return result?.user_version || 0;
  } catch (error) {
    console.error('Error getting database version:', error);
    return 0;
  }
};

// Set database version
export const setDatabaseVersion = async (
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> => {
  try {
    await db.execAsync(`PRAGMA user_version = ${version}`);
  } catch (error) {
    console.error('Error setting database version:', error);
    throw error;
  }
};

// Initialize and migrate database
export const setupDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    console.log('🗃️ setupDatabase: Initializing database...');
    const db = await initializeDatabase();
    
    const currentVersion = await getDatabaseVersion(db);
    const targetVersion = APP_CONFIG.DATABASE_VERSION;
    console.log(`🗃️ setupDatabase: Current version: ${currentVersion}, Target version: ${targetVersion}`);
    
    if (currentVersion < targetVersion) {
      console.log('🗃️ setupDatabase: Running migration...');
      await migrateDatabase(db, currentVersion, targetVersion);
      await setDatabaseVersion(db, targetVersion);
    }
    
    // Always ensure tables exist (safety mechanism)
    console.log('🗃️ setupDatabase: Verifying tables exist...');
    await ensureTablesExist(db);
    
    console.log('✅ setupDatabase: Database setup complete');
    return db;
  } catch (error) {
    console.error('💥 setupDatabase: Error setting up database:', error);
    throw error;
  }
};

// Safety mechanism to ensure all tables exist
const ensureTablesExist = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Check if app_settings table exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'"
    );
    
    if (!tableCheck) {
      console.log('⚠️ ensureTablesExist: Tables missing, creating them...');
      await createTables(db);
    } else {
      console.log('✅ ensureTablesExist: All tables exist');
    }
  } catch (error) {
    console.error('💥 ensureTablesExist: Error checking tables:', error);
    // If there's any error, try to create tables anyway
    await createTables(db);
  }
};