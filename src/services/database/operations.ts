// Database operations for CME Tracker - using true singleton pattern
import * as SQLite from 'expo-sqlite';
import { 
  CMEEntry, 
  Certificate, 
  LicenseRenewal, 
  User,
  DatabaseOperationResult 
} from '../../types';
import { dbMutex } from '../../utils/AsyncMutex';
import { getDatabase, resetDatabaseForAppReset } from './singleton';
import { 
  getFirstSafe,
  getAllSafe,
  runSafe,
  runInTransaction
} from '../../utils/DatabaseUtils';

// Development logging helper
const isDevelopment = __DEV__;
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Reset database instance (for complete app reset) - delegates to singleton
export const resetDatabaseInstance = async (): Promise<void> => {
  await resetDatabaseForAppReset();
};

// User operations
export const userOperations = {
  // Get current user (for now, we only support single user)
  getCurrentUser: async (): Promise<DatabaseOperationResult<User>> => {
    try {
      const db = await getDatabase(); // Get DB from singleton
      
      return dbMutex.runDatabaseRead('getCurrentUser', async () => {
        const user = await getFirstSafe<any>(db, `
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
      });
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
      devLog('💾 DB Operations: updateUser called with:', userData?.profession);
      const db = await getDatabase();
      
      return dbMutex.runDatabaseWrite('updateUser', async () => {
        
        // First, check if user exists
        const existingUser = await getFirstSafe<any>(db, 'SELECT id FROM users WHERE id = 1');
        
        if (!existingUser) {
          devLog('⚠️ DB Operations: No user found, creating user with provided data only...');
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
          
          await runSafe(db, `
            INSERT INTO users (${createFields.join(', ')})
            VALUES (${createPlaceholders.join(', ')})
          `, createValues);
          devLog('✅ DB Operations: User created with provided fields only');
          return { success: true };
        }
        
        const fields = [];
        const values = [];
        
        if (userData.profession) {
          fields.push('profession = ?');
          values.push(userData.profession);
        }
        if (userData.creditSystem) {
          devLog('🎯 DB Operations: Adding creditSystem to update:', userData.creditSystem);
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
        devLog('📝 DB Operations: Executing query:', query);
        
        const result = await runSafe(db, query, values);
        devLog('✅ DB Operations: Update result:', !!result);

        return { success: true };
      });
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
      
      return dbMutex.runDatabaseRead('getAllEntries', async () => {
        
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
        
        query += ' ORDER BY date_attended DESC, id DESC';
        
        const entries = await getAllSafe<CMEEntry>(db, query, params);
        
        // DEBUG: Log entries as they come from database (dev only)
        if (isDevelopment && entries.length > 0) {
          devLog('🗃️ DATABASE getAllEntries result (should be newest first):');
          entries.slice(0, 3).forEach((entry, index) => {
            devLog(`  ${index + 1}. ${entry.title} - ${entry.dateAttended}`);
          });
          if (entries.length > 3) devLog(`  ... and ${entries.length - 3} more entries`);
        }
        
        return {
          success: true,
          data: entries,
        };
      });
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

  // Add new CME entry - with mutex protection to prevent Android NPEs
  addEntry: async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseOperationResult<number>> => {
    try {
      devLog('🗃️ cmeOperations.addEntry: Starting database operation...');
      
      // Get healthy database instance from singleton
      const db = await getDatabase();
      devLog('🗃️ cmeOperations.addEntry: Database connection established');
      
      return dbMutex.runDatabaseWrite('addEntry', async () => {
        
        // Ensure user exists
        devLog('👤 cmeOperations.addEntry: Checking if user exists...');
        const userCheck = await getFirstSafe<any>(db, 'SELECT id FROM users WHERE id = 1');
        devLog('👤 cmeOperations.addEntry: User check result:', !!userCheck);
        
        if (!userCheck) {
          devLog('⚠️ cmeOperations.addEntry: User with ID 1 does not exist, creating default user...');
          await runSafe(db, `
            INSERT OR IGNORE INTO users (id, profession, credit_system, annual_requirement, requirement_period)
            VALUES (1, 'Healthcare Professional', 'Credits', 50, 1)
          `);
          devLog('✅ cmeOperations.addEntry: Default user created');
        }
        
        devLog('📝 cmeOperations.addEntry: Preparing to insert CME entry');
        
        const result = await runSafe(db, `
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
        
        devLog('✅ cmeOperations.addEntry: Insert successful, lastInsertRowId:', result.lastInsertRowId);
        
        return {
          success: true,
          data: result.lastInsertRowId,
        };
      });
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
    return dbMutex.runDatabaseWrite('updateEntry', async () => {
      try {
        devLog('✏️ cmeOperations.updateEntry: Starting update for ID:', id);
        
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
          devLog('⚠️ cmeOperations.updateEntry: No fields to update');
          return { success: true };
        }

        values.push(id);

        const query = `UPDATE cme_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = 1`;
        devLog('📝 cmeOperations.updateEntry: Executing query');
        
        const result = await runSafe(db, query, values);
        devLog('✅ cmeOperations.updateEntry: Update result:', !!result);

        return { success: true };
      } catch (error) {
        console.error('💥 cmeOperations.updateEntry: Database error occurred:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update CME entry',
        };
      }
    });
  },

  // Delete CME entry
  deleteEntry: async (id: number): Promise<DatabaseOperationResult> => {
    return dbMutex.runDatabaseWrite('deleteEntry', async () => {
      try {
        devLog('🗑️ cmeOperations.deleteEntry: Starting delete for ID:', id);
        
        const db = await getDatabase();
        
        // First check if entry exists
        const existingEntry = await getFirstSafe<any>(db,
          'SELECT id, title FROM cme_entries WHERE id = ? AND user_id = 1', 
          [id]
        );
        devLog('🔍 cmeOperations.deleteEntry: Existing entry check:', !!existingEntry);
        
        if (!existingEntry) {
          devLog('⚠️ cmeOperations.deleteEntry: Entry not found');
          return { 
            success: false, 
            error: 'Entry not found' 
          };
        }
        
        const result = await runSafe(db, 'DELETE FROM cme_entries WHERE id = ? AND user_id = 1', [id]);
        devLog('✅ cmeOperations.deleteEntry: Delete result:', !!result);
        
        return { success: true };
      } catch (error) {
        console.error('💥 cmeOperations.deleteEntry: Database error occurred:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete CME entry',
        };
      }
    });
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
        ORDER BY date_attended DESC, id DESC
      `, [startDate, endDate]);
      
      // DEBUG: Log entries as they come from database (dev only)
      if (isDevelopment && entries.length > 0) {
        devLog('🗃️ DATABASE getEntriesInDateRange result (should be newest first):');
        entries.slice(0, 3).forEach((entry, index) => {
          devLog(`  ${index + 1}. ${entry.title} - ${entry.dateAttended}`);
        });
        if (entries.length > 3) devLog(`  ... and ${entries.length - 3} more entries`);
      }
      
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
    return dbMutex.runDatabaseWrite('setSetting', async () => {
      try {
        devLog(`⚙️ settingsOperations.setSetting: Starting with key:`, key, 'value:', value);
        const db = await getDatabase();
        devLog('⚙️ settingsOperations.setSetting: Database connection established');
        
        // First, ensure the app_settings table exists
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        devLog('✅ settingsOperations.setSetting: Table ensured to exist');
        
        // Use safe prepared statement execution
        await runSafe(db, `
          INSERT OR REPLACE INTO app_settings (key, value) 
          VALUES (?, ?)
        `, [key, value]);
        
        devLog('✅ settingsOperations.setSetting: Setting saved successfully');
        return { success: true };
        
      } catch (error) {
        console.error('💥 settingsOperations.setSetting: Error occurred:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to set setting',
        };
      }
    });
  },

  // Complete app reset - wipe all data and reset database
  resetAllData: async (): Promise<DatabaseOperationResult> => {
    return dbMutex.runDatabaseCleanup('resetAllData', async () => {
      try {
        devLog('🧹 settingsOperations.resetAllData: Starting complete app reset...');
        const db = await getDatabase();
        devLog('🧹 settingsOperations.resetAllData: Database connection established');
        
        // Delete all data from all tables using transaction
        await runInTransaction(db, async () => {
          await runSafe(db, 'DELETE FROM cme_entries');
          devLog('✅ settingsOperations.resetAllData: CME entries cleared');
          
          await runSafe(db, 'DELETE FROM certificates');
          devLog('✅ settingsOperations.resetAllData: Certificates cleared');
          
          await runSafe(db, 'DELETE FROM license_renewals');
          devLog('✅ settingsOperations.resetAllData: License renewals cleared');
          
          await runSafe(db, 'DELETE FROM users');
          devLog('✅ settingsOperations.resetAllData: Users cleared');
          
          await runSafe(db, 'DELETE FROM app_settings');
          devLog('✅ settingsOperations.resetAllData: App settings cleared');
        });
        
        // Reset database version to 0 to force recreation of tables and data
        devLog('🔄 settingsOperations.resetAllData: Resetting database version...');
        await db.execAsync('PRAGMA user_version = 0');
        
        // Reset the database singleton
        devLog('🔄 settingsOperations.resetAllData: Resetting database instance...');
        const { resetDatabaseForAppReset } = await import('./singleton');
        await resetDatabaseForAppReset();
        
        devLog('🎉 settingsOperations.resetAllData: Complete app reset successful');
        return { success: true };
      } catch (error) {
        console.error('💥 settingsOperations.resetAllData: Error occurred:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reset app data',
        };
      }
    });
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