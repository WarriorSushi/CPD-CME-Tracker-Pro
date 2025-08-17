// Data export utilities for CPD & CME Tracker
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CMEEntry, LicenseRenewal, User, Certificate } from '../types';
import { getCreditUnit } from './creditTerminology';
import { DataIntegrityService } from '../services/DataIntegrityService';
import { AuditTrailService } from '../services/AuditTrailService';
import { BadgeService } from '../services/BadgeService';

// CSV Export functionality
export const exportCMEToCSV = async (entries: CMEEntry[], user: User): Promise<boolean> => {
  try {
    // Create CSV header
    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const header = `Title,Provider,Date Attended,${creditUnit} Earned,Category,Notes,Created Date\n`;
    
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
      __DEV__ && console.error('Error exporting CME data to CSV:', error);
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
      __DEV__ && console.error('Error exporting license data to CSV:', error);
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

    // Get dynamic terminology
    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const creditPlural = creditUnit.toLowerCase() + 's';

    // Create summary content
    const reportContent = `CME TRACKER SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}

PROFILE INFORMATION
==================
${user.profileName ? `Name: ${user.profileName}` : ''}
${user.age ? `Age: ${user.age} years` : ''}
Profession: ${user.profession}
Credit System: ${user.creditSystem}
Annual Requirement: ${user.annualRequirement} ${creditPlural}

${currentYear} PROGRESS
=====================
Total ${creditUnit} Earned: ${totalCredits.toFixed(1)}
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
    ${creditUnit}: ${entry.creditsEarned}
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
Generated by CPD & CME Tracker v${require('../../constants').APP_CONFIG.VERSION}
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
      __DEV__ && console.error('Error generating summary report:', error);
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
        dialogTitle: 'CPD & CME Tracker Backup',
      });
    }
    
    return true;
  } catch (error) {
      __DEV__ && console.error('Error creating backup:', error);
    return false;
  }
};

// Enhanced comprehensive report with integrity check and badges
export const generateComprehensiveReport = async (
  user: User, 
  entries: CMEEntry[], 
  licenses: LicenseRenewal[],
  certificates: Certificate[]
): Promise<boolean> => {
  try {
    // Perform data integrity check
    const integrityResult = await DataIntegrityService.performIntegrityCheck();
    
    // Get badge statistics
    const badgeStats = await BadgeService.getBadgeStatistics(user, entries, certificates);
    const badgeProgress = await BadgeService.calculateBadgeProgress(user, entries, certificates);
    
    // Get audit statistics
    const auditStats = await AuditTrailService.getAuditStatistics();
    
    const currentYear = new Date().getFullYear();
    const currentYearEntries = entries.filter(entry => 
      new Date(entry.dateAttended).getFullYear() === currentYear
    );
    
    const totalCredits = currentYearEntries.reduce((sum, entry) => sum + entry.creditsEarned, 0);
    const progressPercentage = user.annualRequirement > 0 
      ? ((totalCredits / user.annualRequirement) * 100).toFixed(1) 
      : '0';

    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const creditPlural = creditUnit.toLowerCase() + 's';

    // Category breakdown
    const categoryBreakdown = currentYearEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.creditsEarned;
      return acc;
    }, {} as Record<string, number>);

    // Create comprehensive report content
    const reportContent = `COMPREHENSIVE CME TRACKER REPORT
Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

PROFILE INFORMATION
==================
${user.profileName ? `Name: ${user.profileName}` : ''}
${user.age ? `Age: ${user.age} years` : ''}
Profession: ${user.profession}
Credit System: ${user.creditSystem}
Annual Requirement: ${user.annualRequirement} ${creditPlural}
${user.requirementPeriod && user.requirementPeriod > 1 ? `Requirement Period: ${user.requirementPeriod} years` : ''}

${currentYear} PROGRESS SUMMARY
===============================
Total ${creditUnit} Earned: ${totalCredits.toFixed(1)}
Progress: ${progressPercentage}% of annual requirement
Total Entries: ${currentYearEntries.length}
Certificates Uploaded: ${certificates.length}

CATEGORY BREAKDOWN
==================
${Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .map(([category, credits]) => `${category}: ${credits.toFixed(1)} ${creditPlural}`)
  .join('\n')}

ACHIEVEMENT BADGES
==================
Total Badges Available: ${badgeStats.totalBadges}
Badges Earned: ${badgeStats.earnedBadges}
Completion Rate: ${badgeStats.completionRate.toFixed(1)}%

Earned Badges:
${badgeProgress
  .filter(bp => bp.earned)
  .map(bp => `✅ ${bp.badge.name} - ${bp.badge.description}`)
  .join('\n')}

Next Badge Progress:
${badgeStats.nextBadge 
  ? `🎯 ${badgeStats.nextBadge.badge.name} - ${(badgeStats.nextBadge.progress * 100).toFixed(1)}% complete`
  : 'All badges earned! 🎉'
}

LICENSE MANAGEMENT
==================
Total Licenses: ${licenses.length}
${licenses.map((license, index) => 
  `${index + 1}. ${license.licenseType} - ${license.issuingAuthority}
    License Number: ${license.licenseNumber || 'Not provided'}
    Expires: ${license.expirationDate}
    Status: ${license.status}
    Required Credits: ${license.requiredCredits || 'Not specified'}
    Completed Credits: ${license.completedCredits || 0}
`
).join('\n')}

DATA INTEGRITY STATUS
=====================
Overall Status: ${integrityResult.isValid ? '✅ HEALTHY' : '❌ ISSUES FOUND'}
Total Entries Checked: ${integrityResult.stats.totalEntries}
Total Credits Verified: ${integrityResult.stats.totalCredits}

Issues Summary:
- Errors Found: ${integrityResult.errors.length}
- Warnings: ${integrityResult.warnings.length}
- Orphaned Certificates: ${integrityResult.stats.orphanedCertificates}
- Invalid Dates: ${integrityResult.stats.invalidDates}
- Missing Required Fields: ${integrityResult.stats.missingRequiredFields}

${integrityResult.errors.length > 0 ? `
Critical Errors:
${integrityResult.errors.slice(0, 5).map(error => `❌ ${error}`).join('\n')}
${integrityResult.errors.length > 5 ? `... and ${integrityResult.errors.length - 5} more` : ''}
` : ''}

ACTIVITY STATISTICS
===================
App Usage Statistics:
- Total Audit Events: ${auditStats.totalEvents}
- Success Rate: ${auditStats.successRate.toFixed(1)}%
- Recent Errors: ${auditStats.recentErrors.length}

Entity Breakdown:
${Object.entries(auditStats.entityBreakdown)
  .map(([entity, count]) => `- ${entity}: ${count} operations`)
  .join('\n')}

RECENT CME ENTRIES (Last 10)
=============================
${currentYearEntries
  .slice(-10)
  .reverse()
  .map((entry, index) => 
    `${index + 1}. ${entry.title}
    Provider: ${entry.provider}
    Date: ${entry.dateAttended}
    ${creditUnit}: ${entry.creditsEarned}
    Category: ${entry.category}
    ${entry.notes ? `Notes: ${entry.notes}` : ''}
    ${entry.certificatePath ? '📋 Certificate attached' : ''}
`
  ).join('\n')}

RECOMMENDATIONS
===============
${generateRecommendations(user, entries, licenses, badgeStats, integrityResult)}

---
Generated by CPD & CME Tracker v${require('../../constants/index').APP_CONFIG?.VERSION || '1.0.0'}
Report Type: Comprehensive Analysis
Export Date: ${new Date().toISOString()}
`;

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `cme_comprehensive_report_${timestamp}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(filePath, reportContent);
    
    // Log export action
    await AuditTrailService.logExportAction('comprehensive_report', {
      entriesCount: entries.length,
      licensesCount: licenses.length,
      certificatesCount: certificates.length,
      hasIntegrityIssues: !integrityResult.isValid
    }, true);
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Comprehensive CME Report',
      });
    }
    
    return true;
  } catch (error) {
      __DEV__ && console.error('Error generating comprehensive report:', error);
    await AuditTrailService.logExportAction('comprehensive_report', {}, false, String(error));
    return false;
  }
};

// Export data integrity report
export const exportDataIntegrityReport = async (): Promise<boolean> => {
  try {
    const integrityResult = await DataIntegrityService.performIntegrityCheck();
    const reportContent = DataIntegrityService.formatIntegrityReport(integrityResult);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `cme_integrity_report_${timestamp}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, reportContent);
    
    await AuditTrailService.logExportAction('integrity_report', {
      isValid: integrityResult.isValid,
      errorsCount: integrityResult.errors.length,
      warningsCount: integrityResult.warnings.length
    }, true);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Data Integrity Report',
      });
    }
    
    return true;
  } catch (error) {
      __DEV__ && console.error('Error exporting integrity report:', error);
    return false;
  }
};

// Export audit trail
export const exportAuditTrail = async (): Promise<boolean> => {
  try {
    const auditContent = await AuditTrailService.exportAuditTrail();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `cme_audit_trail_${timestamp}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, auditContent);
    
    await AuditTrailService.logExportAction('audit_trail', {}, true);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Audit Trail Export',
      });
    }
    
    return true;
  } catch (error) {
      __DEV__ && console.error('Error exporting audit trail:', error);
    return false;
  }
};

// Helper function to generate recommendations
function generateRecommendations(
  user: User, 
  entries: CMEEntry[], 
  licenses: LicenseRenewal[], 
  badgeStats: any,
  integrityResult: any
): string {
  const recommendations: string[] = [];
  
  // Progress recommendations
  const currentYear = new Date().getFullYear();
  const currentYearCredits = entries
    .filter(entry => new Date(entry.dateAttended).getFullYear() === currentYear)
    .reduce((sum, entry) => sum + entry.creditsEarned, 0);
  
  const progressPercentage = user.annualRequirement > 0 
    ? (currentYearCredits / user.annualRequirement) * 100 
    : 0;
  
  if (progressPercentage < 50) {
    recommendations.push("📈 You're behind on your annual requirement. Consider scheduling more CME activities.");
  } else if (progressPercentage >= 100) {
    recommendations.push("🎉 Congratulations! You've met your annual requirement. Consider pursuing additional learning for professional growth.");
  }
  
  // License recommendations
  const expiringLicenses = licenses.filter(license => {
    if (!license.expirationDate) return false;
    const expirationDate = new Date(license.expirationDate);
    const warningDate = new Date();
    warningDate.setMonth(warningDate.getMonth() + 3); // 3 months warning
    return expirationDate <= warningDate;
  });
  
  if (expiringLicenses.length > 0) {
    recommendations.push(`⚠️ ${expiringLicenses.length} license(s) expiring within 3 months. Plan your renewal activities.`);
  }
  
  // Badge recommendations
  if (badgeStats.nextBadge && badgeStats.nextBadge.progress > 0.5) {
    recommendations.push(`🎯 You're ${((1 - badgeStats.nextBadge.progress) * 100).toFixed(0)}% away from earning "${badgeStats.nextBadge.badge.name}" badge!`);
  }
  
  // Data integrity recommendations
  if (!integrityResult.isValid) {
    recommendations.push("🔧 Data integrity issues detected. Review and fix errors to ensure accurate reporting.");
  }
  
  // Category diversification
  const categories = new Set(entries.map(entry => entry.category));
  if (categories.size < 3) {
    recommendations.push("🌟 Consider diversifying your learning across different categories for well-rounded professional development.");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ Your CME tracking looks excellent! Keep up the great work with your professional development.");
  }
  
  return recommendations.join('\n\n');
}