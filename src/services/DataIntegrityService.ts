import { databaseOperations } from './database';
import { CMEEntry, User, LicenseRenewal, Certificate } from '../types';

/**
 * Data Integrity Service
 * Ensures data consistency and validation across the application
 */

export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalEntries: number;
    totalCredits: number;
    orphanedCertificates: number;
    invalidDates: number;
    negativeCredits: number;
    missingRequiredFields: number;
  };
}

export class DataIntegrityService {
  /**
   * Performs comprehensive data integrity check
   */
  static async performIntegrityCheck(): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalEntries: 0,
        totalCredits: 0,
        orphanedCertificates: 0,
        invalidDates: 0,
        negativeCredits: 0,
        missingRequiredFields: 0,
      }
    };

    try {
      // Check CME entries
      const entriesResult = await databaseOperations.cme.getAllEntries();
      if (entriesResult.success && entriesResult.data) {
        const entries = entriesResult.data;
        result.stats.totalEntries = entries.length;
        
        await this.validateCMEEntries(entries, result);
      }

      // Check certificates
      const certificatesResult = await databaseOperations.certificates.getAllCertificates();
      if (certificatesResult.success && certificatesResult.data) {
        await this.validateCertificates(certificatesResult.data, result);
      }

      // Check licenses
      const licensesResult = await databaseOperations.licenses.getAllLicenses();
      if (licensesResult.success && licensesResult.data) {
        await this.validateLicenses(licensesResult.data, result);
      }

      // Check user data
      const userResult = await databaseOperations.user.getCurrentUser();
      if (userResult.success && userResult.data) {
        await this.validateUser(userResult.data, result);
      }

      result.isValid = result.errors.length === 0;
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Integrity check failed: ${error}`);
    }

    return result;
  }

  /**
   * Validates CME entries for data consistency
   */
  private static async validateCMEEntries(entries: CMEEntry[], result: IntegrityCheckResult): Promise<void> {
    for (const entry of entries) {
      // Check required fields
      if (!entry.title?.trim()) {
        result.errors.push(`Entry ${entry.id}: Missing title`);
        result.stats.missingRequiredFields++;
      }

      if (!entry.provider?.trim()) {
        result.errors.push(`Entry ${entry.id}: Missing provider`);
        result.stats.missingRequiredFields++;
      }

      if (!entry.category?.trim()) {
        result.errors.push(`Entry ${entry.id}: Missing category`);
        result.stats.missingRequiredFields++;
      }

      // Check credits
      if (entry.creditsEarned <= 0) {
        result.errors.push(`Entry ${entry.id}: Invalid credits (${entry.creditsEarned})`);
        result.stats.negativeCredits++;
      } else {
        result.stats.totalCredits += entry.creditsEarned;
      }

      // Check excessive credits (warning)
      if (entry.creditsEarned > 100) {
        result.warnings.push(`Entry ${entry.id}: Unusually high credits (${entry.creditsEarned})`);
      }

      // Check dates
      const entryDate = new Date(entry.dateAttended);
      const now = new Date();
      
      if (isNaN(entryDate.getTime())) {
        result.errors.push(`Entry ${entry.id}: Invalid date format`);
        result.stats.invalidDates++;
      } else if (entryDate > now) {
        result.warnings.push(`Entry ${entry.id}: Future date (${entry.dateAttended})`);
      }

      // Check if date is too old (more than 10 years)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (entryDate < tenYearsAgo) {
        result.warnings.push(`Entry ${entry.id}: Very old entry (${entry.dateAttended})`);
      }
    }
  }

  /**
   * Validates certificates for orphaned files and integrity
   */
  private static async validateCertificates(certificates: Certificate[], result: IntegrityCheckResult): Promise<void> {
    for (const cert of certificates) {
      // Check if certificate has associated CME entry
      if (cert.cmeEntryId) {
        try {
          const entryResult = await databaseOperations.cme.getEntryById(cert.cmeEntryId);
          if (!entryResult.success || !entryResult.data) {
            result.warnings.push(`Certificate ${cert.id}: References non-existent CME entry ${cert.cmeEntryId}`);
            result.stats.orphanedCertificates++;
          }
        } catch (error) {
          result.warnings.push(`Certificate ${cert.id}: Could not verify CME entry reference`);
        }
      }

      // Check file path exists
      if (!cert.filePath?.trim()) {
        result.errors.push(`Certificate ${cert.id}: Missing file path`);
      }

      // Check file size is reasonable
      if (cert.fileSize && cert.fileSize > 50 * 1024 * 1024) { // 50MB
        result.warnings.push(`Certificate ${cert.id}: Large file size (${Math.round(cert.fileSize / 1024 / 1024)}MB)`);
      }
    }
  }

  /**
   * Validates license data
   */
  private static async validateLicenses(licenses: LicenseRenewal[], result: IntegrityCheckResult): Promise<void> {
    for (const license of licenses) {
      // Check required fields
      if (!license.licenseType?.trim()) {
        result.errors.push(`License ${license.id}: Missing license type`);
      }

      if (!license.issuingAuthority?.trim()) {
        result.errors.push(`License ${license.id}: Missing issuing authority`);
      }

      // Check expiration date
      if (license.expirationDate) {
        const expirationDate = new Date(license.expirationDate);
        if (isNaN(expirationDate.getTime())) {
          result.errors.push(`License ${license.id}: Invalid expiration date`);
        } else {
          const now = new Date();
          const warningThreshold = new Date();
          warningThreshold.setDate(warningThreshold.getDate() + 90); // 90 days warning

          if (expirationDate < now) {
            result.warnings.push(`License ${license.id}: Expired (${license.expirationDate})`);
          } else if (expirationDate < warningThreshold) {
            result.warnings.push(`License ${license.id}: Expires soon (${license.expirationDate})`);
          }
        }
      }

      // Check credits if applicable
      if (license.requiredCredits && license.requiredCredits > 0) {
        if (license.completedCredits && license.completedCredits < 0) {
          result.errors.push(`License ${license.id}: Negative completed credits`);
        }

        if (license.completedCredits && license.completedCredits > license.requiredCredits * 2) {
          result.warnings.push(`License ${license.id}: Unusually high completed credits`);
        }
      }
    }
  }

  /**
   * Validates user data
   */
  private static async validateUser(user: User, result: IntegrityCheckResult): Promise<void> {
    // Check required fields
    if (!user.profession?.trim()) {
      result.warnings.push('User: Missing profession');
    }

    if (!user.creditSystem?.trim()) {
      result.warnings.push('User: Missing credit system');
    }

    // Check annual requirement
    if (!user.annualRequirement || user.annualRequirement <= 0) {
      result.warnings.push('User: Invalid annual requirement');
    } else if (user.annualRequirement > 1000) {
      result.warnings.push('User: Unusually high annual requirement');
    }

    // Check requirement period
    if (user.requirementPeriod && (user.requirementPeriod < 1 || user.requirementPeriod > 10)) {
      result.warnings.push('User: Invalid requirement period');
    }

    // Check cycle dates
    if (user.cycleStartDate && user.cycleEndDate) {
      const startDate = new Date(user.cycleStartDate);
      const endDate = new Date(user.cycleEndDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        result.errors.push('User: Invalid cycle dates');
      } else if (endDate <= startDate) {
        result.errors.push('User: Cycle end date must be after start date');
      }
    }
  }

  /**
   * Attempts to fix common data issues automatically
   */
  static async autoFixIssues(): Promise<{ fixed: string[], failed: string[] }> {
    const fixed: string[] = [];
    const failed: string[] = [];

    try {
      // Fix negative credits by setting to 0
      const entriesResult = await databaseOperations.cme.getAllEntries();
      if (entriesResult.success && entriesResult.data) {
        for (const entry of entriesResult.data) {
          if (entry.creditsEarned < 0) {
            try {
              await databaseOperations.cme.updateEntry(entry.id!, { creditsEarned: 0 });
              fixed.push(`Fixed negative credits for entry ${entry.id}`);
            } catch (error) {
              failed.push(`Failed to fix entry ${entry.id}: ${error}`);
            }
          }
        }
      }

      // Remove orphaned certificates (with caution)
      // This is commented out as it's potentially destructive
      // Uncomment only if needed and with proper backup
      /*
      const certificatesResult = await databaseOperations.certificates.getAllCertificates();
      if (certificatesResult.success && certificatesResult.data) {
        for (const cert of certificatesResult.data) {
          if (cert.cmeEntryId) {
            const entryResult = await databaseOperations.cme.getEntryById(cert.cmeEntryId);
            if (!entryResult.success || !entryResult.data) {
              try {
                await databaseOperations.certificates.deleteCertificate(cert.id!);
                fixed.push(`Removed orphaned certificate ${cert.id}`);
              } catch (error) {
                failed.push(`Failed to remove certificate ${cert.id}: ${error}`);
              }
            }
          }
        }
      }
      */

    } catch (error) {
      failed.push(`Auto-fix failed: ${error}`);
    }

    return { fixed, failed };
  }

  /**
   * Exports integrity report as formatted text
   */
  static formatIntegrityReport(result: IntegrityCheckResult): string {
    const lines: string[] = [];
    
    lines.push('=== DATA INTEGRITY REPORT ===');
    lines.push(`Status: ${result.isValid ? '[OK] HEALTHY' : '[ERROR] ISSUES FOUND'}`);
    lines.push('');
    
    lines.push('[DATA] STATISTICS:');
    lines.push(`Total CME Entries: ${result.stats.totalEntries}`);
    lines.push(`Total Credits: ${result.stats.totalCredits}`);
    lines.push(`Orphaned Certificates: ${result.stats.orphanedCertificates}`);
    lines.push(`Invalid Dates: ${result.stats.invalidDates}`);
    lines.push(`Negative Credits: ${result.stats.negativeCredits}`);
    lines.push(`Missing Required Fields: ${result.stats.missingRequiredFields}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('[ERROR] ERRORS:');
      result.errors.forEach(error => lines.push(`  • ${error}`));
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('[WARN] WARNINGS:');
      result.warnings.forEach(warning => lines.push(`  • ${warning}`));
      lines.push('');
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('[OK] No issues found. Your data is healthy!');
    }

    lines.push(`Generated: ${new Date().toLocaleString()}`);
    
    return lines.join('\n');
  }
}