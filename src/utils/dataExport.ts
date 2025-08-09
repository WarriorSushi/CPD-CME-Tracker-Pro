// Data export utilities for CPD/CME Tracker
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CMEEntry, LicenseRenewal, User } from '../types';

// CSV Export functionality
export const exportCMEToCSV = async (entries: CMEEntry[], user: User): Promise<boolean> => {
  try {
    // Create CSV header
    const header = 'Title,Provider,Date Attended,Credits Earned,Category,Notes,Created Date\n';
    
    // Create CSV rows
    const rows = entries.map(entry => {
      const title = `"${entry.title.replace(/"/g, '""')}"`;
      const provider = `"${entry.provider.replace(/"/g, '""')}"`;
      const dateAttended = entry.dateAttended;
      const creditsEarned = entry.creditsEarned;
      const category = entry.category;
      const notes = `"${(entry.notes || '').replace(/"/g, '""')}"`;
      const createdDate = new Date(entry.createdAt).toLocaleDateString();
      
      return `${title},${provider},${dateAttended},${creditsEarned},${category},${notes},${createdDate}`;
    }).join('\n');

    // Combine header and rows
    const csvContent = header + rows;
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `cme_entries_${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, csvContent);
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export CME Entries',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting CME data to CSV:', error);
    return false;
  }
};

// License export functionality
export const exportLicensesToCSV = async (licenses: LicenseRenewal[]): Promise<boolean> => {
  try {
    // Create CSV header
    const header = 'License Type,Issuing Authority,License Number,Expiration Date,Required Credits,Completed Credits,Status,Created Date\n';
    
    // Create CSV rows
    const rows = licenses.map(license => {
      const licenseType = `"${license.licenseType.replace(/"/g, '""')}"`;
      const issuingAuthority = `"${license.issuingAuthority.replace(/"/g, '""')}"`;
      const licenseNumber = `"${(license.licenseNumber || '').replace(/"/g, '""')}"`;
      const expirationDate = license.expirationDate;
      const requiredCredits = license.requiredCredits;
      const completedCredits = license.completedCredits;
      const status = license.status;
      const createdDate = new Date(license.createdAt).toLocaleDateString();
      
      return `${licenseType},${issuingAuthority},${licenseNumber},${expirationDate},${requiredCredits},${completedCredits},${status},${createdDate}`;
    }).join('\n');

    // Combine header and rows
    const csvContent = header + rows;
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `licenses_${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, csvContent);
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Licenses',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting license data to CSV:', error);
    return false;
  }
};

// Summary report generation
export const generateSummaryReport = async (
  user: User, 
  entries: CMEEntry[], 
  licenses: LicenseRenewal[]
): Promise<boolean> => {
  try {
    const currentYear = new Date().getFullYear();
    const currentYearEntries = entries.filter(entry => 
      new Date(entry.dateAttended).getFullYear() === currentYear
    );
    
    const totalCredits = currentYearEntries.reduce((sum, entry) => sum + entry.creditsEarned, 0);
    const progressPercentage = user.annualRequirement > 0 
      ? ((totalCredits / user.annualRequirement) * 100).toFixed(1) 
      : '0';

    // Create summary content
    const reportContent = `CME TRACKER SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}

PROFILE INFORMATION
==================
Name: ${user.profession}
Country: ${user.country}
Credit System: ${user.creditSystem}
Annual Requirement: ${user.annualRequirement} ${user.creditSystem.toLowerCase()}

${currentYear} PROGRESS
=====================
Total Credits Earned: ${totalCredits.toFixed(1)}
Progress: ${progressPercentage}% of annual requirement
Total Entries: ${currentYearEntries.length}

RECENT ENTRIES (Last 10)
========================
${currentYearEntries
  .slice(-10)
  .reverse()
  .map((entry, index) => 
    `${index + 1}. ${entry.title} (${entry.provider})
    Date: ${entry.dateAttended}
    Credits: ${entry.creditsEarned}
    Category: ${entry.category}
`
  ).join('\n')}

LICENSES (${licenses.length} total)
========
${licenses.map((license, index) => 
  `${index + 1}. ${license.licenseType} - ${license.issuingAuthority}
    Expires: ${license.expirationDate}
    Status: ${license.status}
`
).join('\n')}

---
Generated by CPD/CME Tracker v${require('../../constants').APP_CONFIG.VERSION}
`;

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `cme_summary_${timestamp}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, reportContent);
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'CME Summary Report',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error generating summary report:', error);
    return false;
  }
};

// Backup creation (JSON format for re-import)
export const createBackup = async (
  user: User,
  entries: CMEEntry[],
  licenses: LicenseRenewal[]
): Promise<boolean> => {
  try {
    const backupData = {
      version: require('../../constants').APP_CONFIG.VERSION,
      exportDate: new Date().toISOString(),
      user,
      cmeEntries: entries,
      licenses,
    };

    const backupContent = JSON.stringify(backupData, null, 2);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `cme_backup_${timestamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, backupContent);
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'CPD/CME Tracker Backup',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
};