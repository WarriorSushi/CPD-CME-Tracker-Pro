// PDF Generation Service for CPD & CME Tracker
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CMEEntry, LicenseRenewal, User } from '../types';
import { getCreditUnit } from '../utils/creditTerminology';
import { APP_CONFIG } from '../constants';

/**
 * Generates HTML styles for professional PDF output
 */
const getPDFStyles = (): string => {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #333;
        padding: 40px;
        background: white;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #003087;
      }

      .header h1 {
        color: #003087;
        font-size: 24pt;
        margin-bottom: 10px;
        font-weight: bold;
      }

      .header .subtitle {
        color: #666;
        font-size: 10pt;
        margin-top: 5px;
      }

      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }

      .section-title {
        background: #003087;
        color: white;
        padding: 8px 15px;
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 15px;
        border-radius: 4px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
      }

      .info-item {
        padding: 8px;
        background: #f8f9fa;
        border-left: 3px solid #003087;
        border-radius: 3px;
      }

      .info-label {
        font-weight: bold;
        color: #003087;
        font-size: 9pt;
        text-transform: uppercase;
        margin-bottom: 3px;
      }

      .info-value {
        color: #333;
        font-size: 11pt;
      }

      .progress-card {
        background: linear-gradient(135deg, #003087 0%, #0047b3 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
      }

      .progress-card .big-number {
        font-size: 36pt;
        font-weight: bold;
        margin: 10px 0;
      }

      .progress-card .label {
        font-size: 12pt;
        opacity: 0.9;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        page-break-inside: auto;
      }

      thead {
        background: #003087;
        color: white;
      }

      th {
        padding: 10px;
        text-align: left;
        font-weight: bold;
        font-size: 10pt;
      }

      td {
        padding: 8px 10px;
        border-bottom: 1px solid #e0e0e0;
        font-size: 10pt;
      }

      tbody tr:nth-child(even) {
        background: #f8f9fa;
      }

      tbody tr:hover {
        background: #e8f4f8;
      }

      .entry-row td {
        page-break-inside: avoid;
      }

      .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 9pt;
        font-weight: bold;
      }

      .badge-success {
        background: #10b981;
        color: white;
      }

      .badge-warning {
        background: #f59e0b;
        color: white;
      }

      .badge-error {
        background: #ef4444;
        color: white;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e0e0e0;
        text-align: center;
        font-size: 9pt;
        color: #666;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }

      .stat-box {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        border: 2px solid #e0e0e0;
      }

      .stat-box .number {
        font-size: 24pt;
        font-weight: bold;
        color: #003087;
        margin-bottom: 5px;
      }

      .stat-box .label {
        font-size: 9pt;
        color: #666;
        text-transform: uppercase;
      }

      .category-breakdown {
        margin: 15px 0;
      }

      .category-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
      }

      .license-card {
        background: #f8f9fa;
        border-left: 4px solid #003087;
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 4px;
      }

      .license-header {
        font-weight: bold;
        color: #003087;
        margin-bottom: 5px;
      }

      .license-details {
        font-size: 10pt;
        color: #666;
      }

      @media print {
        body {
          padding: 20px;
        }

        .section {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
};

/**
 * Generates a professional PDF report of CME entries
 */
export const generateCMEEntriesPDF = async (
  entries: CMEEntry[],
  user: User
): Promise<{ success: boolean; message: string }> => {
  try {
    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const currentYear = new Date().getFullYear();
    const currentYearEntries = entries.filter(
      entry => new Date(entry.dateAttended).getFullYear() === currentYear
    );

    const totalCredits = currentYearEntries.reduce(
      (sum, entry) => sum + entry.creditsEarned,
      0
    );

    const progressPercentage = user.annualRequirement > 0
      ? ((totalCredits / user.annualRequirement) * 100).toFixed(1)
      : '0';

    // Generate entry rows
    const entryRows = entries
      .sort((a, b) => new Date(b.dateAttended).getTime() - new Date(a.dateAttended).getTime())
      .map(entry => `
        <tr class="entry-row">
          <td>${new Date(entry.dateAttended).toLocaleDateString()}</td>
          <td><strong>${entry.title}</strong></td>
          <td>${entry.provider}</td>
          <td>${entry.category}</td>
          <td style="text-align: center;"><strong>${entry.creditsEarned}</strong></td>
          <td style="font-size: 9pt;">${entry.notes || '-'}</td>
        </tr>
      `)
      .join('');

    // Category breakdown
    const categoryBreakdown = currentYearEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.creditsEarned;
      return acc;
    }, {} as Record<string, number>);

    const categoryRows = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([category, credits]) => `
        <div class="category-item">
          <span><strong>${category}</strong></span>
          <span>${credits.toFixed(1)} ${creditUnit}</span>
        </div>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CME Entries Report</title>
          ${getPDFStyles()}
        </head>
        <body>
          <div class="header">
            <h1>${APP_CONFIG.NAME}</h1>
            <div class="subtitle">CME Entries Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Professional Profile</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${user.profileName || 'Not set'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Profession</div>
                <div class="info-value">${user.profession}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Credit System</div>
                <div class="info-value">${user.creditSystem}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Annual Requirement</div>
                <div class="info-value">${user.annualRequirement} ${creditUnit}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">${currentYear} Progress Summary</div>
            <div class="progress-card">
              <div class="label">Total ${creditUnit} Earned</div>
              <div class="big-number">${totalCredits.toFixed(1)}</div>
              <div class="label">${progressPercentage}% of Annual Requirement</div>
            </div>

            <div class="summary-stats">
              <div class="stat-box">
                <div class="number">${currentYearEntries.length}</div>
                <div class="label">Entries This Year</div>
              </div>
              <div class="stat-box">
                <div class="number">${entries.length}</div>
                <div class="label">Total Entries</div>
              </div>
              <div class="stat-box">
                <div class="number">${Object.keys(categoryBreakdown).length}</div>
                <div class="label">Categories</div>
              </div>
            </div>
          </div>

          ${categoryRows.length > 0 ? `
          <div class="section">
            <div class="section-title">Category Breakdown (${currentYear})</div>
            <div class="category-breakdown">
              ${categoryRows}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">All CME Entries (${entries.length} total)</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th style="text-align: center;">${creditUnit}</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${entryRows}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>${APP_CONFIG.NAME}</strong> v${APP_CONFIG.VERSION}</p>
            <p>This is an official record of continuing medical education activities</p>
            <p>Generated on ${new Date().toISOString()}</p>
          </div>
        </body>
      </html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'CME Entries Report',
        UTI: 'com.adobe.pdf',
      });
    }

    return {
      success: true,
      message: `PDF report with ${entries.length} entries generated successfully!`,
    };
  } catch (error) {
    __DEV__ && console.error('Error generating CME entries PDF:', error);
    return {
      success: false,
      message: 'Failed to generate PDF report. Please try again.',
    };
  }
};

/**
 * Generates a comprehensive summary PDF report
 */
export const generateSummaryPDF = async (
  user: User,
  entries: CMEEntry[],
  licenses: LicenseRenewal[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const creditUnit = getCreditUnit(user.creditSystem || 'CME');
    const currentYear = new Date().getFullYear();
    const currentYearEntries = entries.filter(
      entry => new Date(entry.dateAttended).getFullYear() === currentYear
    );

    const totalCredits = currentYearEntries.reduce(
      (sum, entry) => sum + entry.creditsEarned,
      0
    );

    const progressPercentage = user.annualRequirement > 0
      ? ((totalCredits / user.annualRequirement) * 100).toFixed(1)
      : '0';

    // License status helper
    const getLicenseStatus = (license: LicenseRenewal) => {
      const today = new Date();
      const expDate = new Date(license.expirationDate);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) return { badge: 'badge-error', text: 'EXPIRED' };
      if (daysUntilExpiry <= 30) return { badge: 'badge-error', text: `${daysUntilExpiry} days left` };
      if (daysUntilExpiry <= 90) return { badge: 'badge-warning', text: `${daysUntilExpiry} days left` };
      return { badge: 'badge-success', text: `${daysUntilExpiry} days left` };
    };

    // License cards
    const licenseCards = licenses
      .map(license => {
        const status = getLicenseStatus(license);
        return `
          <div class="license-card">
            <div class="license-header">
              ${license.licenseType} - ${license.issuingAuthority}
              <span class="badge ${status.badge}" style="float: right;">${status.text}</span>
            </div>
            <div class="license-details">
              ${license.licenseNumber ? `License #: ${license.licenseNumber}<br>` : ''}
              Expiration Date: ${new Date(license.expirationDate).toLocaleDateString()}<br>
              ${license.requiredCredits > 0 ? `Credits: ${license.completedCredits}/${license.requiredCredits} ${creditUnit}` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    // Recent entries
    const recentEntryRows = currentYearEntries
      .slice(-10)
      .reverse()
      .map(entry => `
        <tr>
          <td>${new Date(entry.dateAttended).toLocaleDateString()}</td>
          <td><strong>${entry.title}</strong></td>
          <td>${entry.provider}</td>
          <td style="text-align: center;"><strong>${entry.creditsEarned}</strong></td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CME Summary Report</title>
          ${getPDFStyles()}
        </head>
        <body>
          <div class="header">
            <h1>${APP_CONFIG.NAME}</h1>
            <div class="subtitle">Professional Summary Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Professional Profile</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${user.profileName || 'Not set'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Profession</div>
                <div class="info-value">${user.profession}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Age</div>
                <div class="info-value">${user.age || 'Not set'} years</div>
              </div>
              <div class="info-item">
                <div class="info-label">Credit System</div>
                <div class="info-value">${user.creditSystem}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">${currentYear} Progress</div>
            <div class="progress-card">
              <div class="label">Total ${creditUnit} Earned</div>
              <div class="big-number">${totalCredits.toFixed(1)}</div>
              <div class="label">${progressPercentage}% of ${user.annualRequirement} ${creditUnit} Annual Requirement</div>
            </div>
          </div>

          ${licenses.length > 0 ? `
          <div class="section">
            <div class="section-title">License Management (${licenses.length} licenses)</div>
            ${licenseCards}
          </div>
          ` : ''}

          ${recentEntryRows.length > 0 ? `
          <div class="section">
            <div class="section-title">Recent CME Activities (Last 10)</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Provider</th>
                  <th style="text-align: center;">${creditUnit}</th>
                </tr>
              </thead>
              <tbody>
                ${recentEntryRows}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>${APP_CONFIG.NAME}</strong> v${APP_CONFIG.VERSION}</p>
            <p>This is an official summary of continuing medical education and license status</p>
            <p>Report ID: ${Date.now()}</p>
          </div>
        </body>
      </html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'CME Summary Report',
        UTI: 'com.adobe.pdf',
      });
    }

    return {
      success: true,
      message: 'PDF summary report generated successfully!',
    };
  } catch (error) {
    __DEV__ && console.error('Error generating summary PDF:', error);
    return {
      success: false,
      message: 'Failed to generate PDF summary. Please try again.',
    };
  }
};

/**
 * Generates a PDF report specifically for license renewals
 */
export const generateLicenseRenewalPDF = async (
  user: User,
  licenses: LicenseRenewal[],
  relevantEntries: CMEEntry[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const creditUnit = getCreditUnit(user.creditSystem || 'CME');

    const getLicenseStatus = (license: LicenseRenewal) => {
      const today = new Date();
      const expDate = new Date(license.expirationDate);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) return { badge: 'badge-error', text: 'EXPIRED', days: daysUntilExpiry };
      if (daysUntilExpiry <= 30) return { badge: 'badge-error', text: `${daysUntilExpiry} days left`, days: daysUntilExpiry };
      if (daysUntilExpiry <= 90) return { badge: 'badge-warning', text: `${daysUntilExpiry} days left`, days: daysUntilExpiry };
      return { badge: 'badge-success', text: 'Active', days: daysUntilExpiry };
    };

    const licenseRows = licenses
      .map(license => {
        const status = getLicenseStatus(license);
        const progress = license.requiredCredits > 0
          ? ((license.completedCredits / license.requiredCredits) * 100).toFixed(1)
          : '0';

        return `
          <tr>
            <td><strong>${license.licenseType}</strong></td>
            <td>${license.issuingAuthority}</td>
            <td>${license.licenseNumber || '-'}</td>
            <td>${new Date(license.expirationDate).toLocaleDateString()}</td>
            <td><span class="badge ${status.badge}">${status.text}</span></td>
            <td style="text-align: center;">
              ${license.requiredCredits > 0 ? `${license.completedCredits}/${license.requiredCredits} (${progress}%)` : 'N/A'}
            </td>
          </tr>
        `;
      })
      .join('');

    const entryRows = relevantEntries
      .sort((a, b) => new Date(b.dateAttended).getTime() - new Date(a.dateAttended).getTime())
      .map(entry => `
        <tr>
          <td>${new Date(entry.dateAttended).toLocaleDateString()}</td>
          <td><strong>${entry.title}</strong></td>
          <td>${entry.provider}</td>
          <td>${entry.category}</td>
          <td style="text-align: center;"><strong>${entry.creditsEarned}</strong></td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>License Renewal Report</title>
          ${getPDFStyles()}
        </head>
        <body>
          <div class="header">
            <h1>${APP_CONFIG.NAME}</h1>
            <div class="subtitle">License Renewal & Compliance Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Professional Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${user.profileName || 'Not set'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Profession</div>
                <div class="info-value">${user.profession}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Credit System</div>
                <div class="info-value">${user.creditSystem}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Report Date</div>
                <div class="info-value">${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">License Status (${licenses.length} total)</div>
            <table>
              <thead>
                <tr>
                  <th>License Type</th>
                  <th>Authority</th>
                  <th>License #</th>
                  <th>Expiration</th>
                  <th>Status</th>
                  <th style="text-align: center;">Credits Progress</th>
                </tr>
              </thead>
              <tbody>
                ${licenseRows}
              </tbody>
            </table>
          </div>

          ${entryRows.length > 0 ? `
          <div class="section">
            <div class="section-title">Supporting CME Activities (${relevantEntries.length} entries)</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Provider</th>
                  <th>Category</th>
                  <th style="text-align: center;">${creditUnit}</th>
                </tr>
              </thead>
              <tbody>
                ${entryRows}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>${APP_CONFIG.NAME}</strong> v${APP_CONFIG.VERSION}</p>
            <p>This document serves as proof of license renewal compliance</p>
            <p>Report ID: LR-${Date.now()}</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'License Renewal Report',
        UTI: 'com.adobe.pdf',
      });
    }

    return {
      success: true,
      message: `License renewal report with ${licenses.length} licenses generated successfully!`,
    };
  } catch (error) {
    __DEV__ && console.error('Error generating license renewal PDF:', error);
    return {
      success: false,
      message: 'Failed to generate license renewal PDF. Please try again.',
    };
  }
};
