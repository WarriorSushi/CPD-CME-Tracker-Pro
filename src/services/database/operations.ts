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

// Database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Get database instance
const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await setupDatabase();
  }
  return dbInstance;
};

// User operations
export const userOperations = {
  // Get current user (for now, we only support single user)
  getCurrentUser: async (): Promise<DatabaseOperationResult<User>> => {
    try {
      const db = await getDatabase();
      const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = 1');
      
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
      const db = await getDatabase();
      
      const fields = [];
      const values = [];
      
      if (userData.profession) {
        fields.push('profession = ?');
        values.push(userData.profession);
      }
      if (userData.country) {
        fields.push('country = ?');
        values.push(userData.country);
      }
      if (userData.creditSystem) {
        fields.push('credit_system = ?');
        values.push(userData.creditSystem);
      }
      if (userData.annualRequirement) {
        fields.push('annual_requirement = ?');
        values.push(userData.annualRequirement);
      }

      if (fields.length === 0) {
        return { success: true };
      }

      values.push(1); // user ID

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await db.runAsync(query, values);

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

  // Add new CME entry
  addEntry: async (entry: Omit<CMEEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseOperationResult<number>> => {
    try {
      const db = await getDatabase();
      
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
      
      return {
        success: true,
        data: result.lastInsertRowId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add CME entry',
      };
    }
  },

  // Update CME entry
  updateEntry: async (id: number, entry: Partial<CMEEntry>): Promise<DatabaseOperationResult> => {
    try {
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
        return { success: true };
      }

      values.push(id);

      const query = `UPDATE cme_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = 1`;
      await db.runAsync(query, values);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update CME entry',
      };
    }
  },

  // Delete CME entry
  deleteEntry: async (id: number): Promise<DatabaseOperationResult> => {
    try {
      const db = await getDatabase();
      
      await db.runAsync('DELETE FROM cme_entries WHERE id = ? AND user_id = 1', [id]);
      
      return { success: true };
    } catch (error) {
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
    try {
      const db = await getDatabase();
      
      await db.runAsync(`
        INSERT OR REPLACE INTO app_settings (key, value) 
        VALUES (?, ?)
      `, [key, value]);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set setting',
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