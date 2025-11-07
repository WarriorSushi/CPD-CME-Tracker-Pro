// ZIP Backup Service for CME Tracker
// Handles complete backup with certificates using JSZip
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CMEEntry, LicenseRenewal, User, Certificate } from '../types';
import { APP_CONFIG } from '../constants';

export interface BackupOptions {
  includeCertificates: boolean;
}

export interface BackupProgress {
  step: 'preparing' | 'certificates' | 'zipping' | 'saving' | 'complete';
  progress: number; // 0-100
  message: string;
}

/**
 * Creates a complete backup with optional certificates
 */
export const createCompleteBackup = async (
  user: User,
  entries: CMEEntry[],
  licenses: LicenseRenewal[],
  certificates: Certificate[],
  options: BackupOptions,
  onProgress?: (progress: BackupProgress) => void
): Promise<{ success: boolean; message: string; fileUri?: string }> => {
  try {
    // Step 1: Prepare data
    onProgress?.({
      step: 'preparing',
      progress: 10,
      message: 'Preparing backup data...',
    });

    const backupData = {
      version: APP_CONFIG.VERSION,
      exportDate: new Date().toISOString(),
      includedCertificates: options.includeCertificates,
      user,
      cmeEntries: entries,
      licenses,
    };

    if (!options.includeCertificates) {
      // Simple JSON backup without certificates
      onProgress?.({
        step: 'saving',
        progress: 80,
        message: 'Creating backup file...',
      });

      const backupContent = JSON.stringify(backupData, null, 2);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `cme_backup_${timestamp}.json`;
      const file = new File(Paths.document, fileName);

      await file.create();
      file.write(backupContent, { encoding: 'utf8' });

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Backup created successfully!',
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'CPD & CME Tracker Backup',
        });
      }

      return {
        success: true,
        message: `Backup created successfully (${entries.length} entries, ${licenses.length} licenses)`,
        fileUri: file.uri,
      };
    }

    // Create ZIP backup with certificates
    const zip = new JSZip();

    // Add backup.json to root
    onProgress?.({
      step: 'preparing',
      progress: 20,
      message: 'Adding data to backup...',
    });

    zip.file('backup.json', JSON.stringify(backupData, null, 2));

    // Add README
    const readme = `CME TRACKER COMPLETE BACKUP
Generated: ${new Date().toLocaleString()}
Version: ${APP_CONFIG.VERSION}

CONTENTS:
- backup.json: All your CME entries, licenses, and user data
- certificates/: ${certificates.length} certificate images

TO RESTORE:
1. Open CME Tracker app
2. Go to Settings → Import Backup
3. Select this ZIP file
4. Follow the import wizard

This backup includes:
- ${entries.length} CME entries
- ${licenses.length} licenses
- ${certificates.length} certificates
- User profile data

IMPORTANT: Keep this file secure as it contains your professional records.
`;

    zip.file('README.txt', readme);

    // Add certificates if any exist
    if (certificates.length > 0) {
      onProgress?.({
        step: 'certificates',
        progress: 30,
        message: `Adding ${certificates.length} certificates...`,
      });

      const certificatesFolder = zip.folder('certificates');
      let processedCount = 0;

      for (const cert of certificates) {
        try {
          // Read certificate file
          const fileInfo = await FileSystem.getInfoAsync(cert.filePath);

          if (fileInfo.exists) {
            // Read file as base64
            const fileContent = await FileSystem.readAsStringAsync(cert.filePath, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Add to ZIP with original filename
            const fileName = cert.fileName || `certificate_${cert.id}${getFileExtension(cert.mimeType)}`;
            certificatesFolder?.file(fileName, fileContent, { base64: true });

            processedCount++;

            // Update progress
            const certProgress = 30 + Math.floor((processedCount / certificates.length) * 40);
            onProgress?.({
              step: 'certificates',
              progress: certProgress,
              message: `Added ${processedCount}/${certificates.length} certificates...`,
            });
          } else {
            __DEV__ && console.warn(`Certificate file not found: ${cert.filePath}`);
          }
        } catch (error) {
          __DEV__ && console.error(`Error adding certificate ${cert.id}:`, error);
          // Continue with other certificates
        }
      }
    }

    // Generate ZIP
    onProgress?.({
      step: 'zipping',
      progress: 75,
      message: 'Compressing backup...',
    });

    const zipContent = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Medium compression (1-9)
      },
    });

    // Save ZIP file
    onProgress?.({
      step: 'saving',
      progress: 90,
      message: 'Saving backup file...',
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `cme_complete_backup_${timestamp}.zip`;
    const zipPath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(zipPath, zipContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Backup created successfully!',
    });

    // Share ZIP file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: 'CPD & CME Tracker Complete Backup',
      });
    }

    // Calculate approximate file size
    const fileInfo = await FileSystem.getInfoAsync(zipPath);
    const fileSizeMB = (fileInfo.exists && 'size' in fileInfo && fileInfo.size)
      ? (fileInfo.size / (1024 * 1024)).toFixed(2)
      : 'unknown';

    return {
      success: true,
      message: `Complete backup created successfully!\n\n${entries.length} entries\n${licenses.length} licenses\n${certificates.length} certificates\n\nFile size: ${fileSizeMB} MB`,
      fileUri: zipPath,
    };
  } catch (error) {
    __DEV__ && console.error('Error creating complete backup:', error);

    onProgress?.({
      step: 'complete',
      progress: 0,
      message: 'Failed to create backup',
    });

    return {
      success: false,
      message: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };

  return extensions[mimeType] || '.jpg';
}

/**
 * Validates if a file is a valid backup (JSON or ZIP)
 */
export const isValidBackupFile = async (fileUri: string): Promise<{
  isValid: boolean;
  type: 'json' | 'zip' | 'unknown';
  message: string;
}> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return { isValid: false, type: 'unknown', message: 'File not found' };
    }

    // Check file extension
    const fileName = fileUri.toLowerCase();

    if (fileName.endsWith('.json')) {
      // Try to parse as JSON
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      // Validate structure
      if (data.version && data.exportDate && (data.user || data.cmeEntries)) {
        return { isValid: true, type: 'json', message: 'Valid JSON backup' };
      }

      return { isValid: false, type: 'json', message: 'Invalid backup structure' };
    }

    if (fileName.endsWith('.zip')) {
      return { isValid: true, type: 'zip', message: 'Valid ZIP backup (certificates included)' };
    }

    return { isValid: false, type: 'unknown', message: 'Unsupported file format. Please select a .json or .zip backup file.' };
  } catch (error) {
    return { isValid: false, type: 'unknown', message: 'Unable to read backup file' };
  }
};

/**
 * Extracts backup data from ZIP file
 */
export const extractZipBackup = async (
  zipUri: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<{
  success: boolean;
  backupData?: {
    version: string;
    exportDate: string;
    user: User;
    cmeEntries: CMEEntry[];
    licenses: LicenseRenewal[];
  };
  certificates?: Array<{ fileName: string; base64Data: string }>;
  message: string;
}> => {
  try {
    onProgress?.({
      step: 'preparing',
      progress: 10,
      message: 'Reading ZIP file...',
    });

    // Read ZIP file
    const zipContent = await FileSystem.readAsStringAsync(zipUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    onProgress?.({
      step: 'zipping',
      progress: 30,
      message: 'Extracting backup...',
    });

    // Load ZIP
    const zip = await JSZip.loadAsync(zipContent, { base64: true });

    // Extract backup.json
    const backupFile = zip.file('backup.json');

    if (!backupFile) {
      return {
        success: false,
        message: 'Invalid backup: backup.json not found in ZIP file',
      };
    }

    onProgress?.({
      step: 'preparing',
      progress: 50,
      message: 'Reading backup data...',
    });

    const backupContent = await backupFile.async('string');
    const backupData = JSON.parse(backupContent);

    // Extract certificates if they exist
    const certificates: Array<{ fileName: string; base64Data: string }> = [];
    const certFolder = zip.folder('certificates');

    if (certFolder) {
      onProgress?.({
        step: 'certificates',
        progress: 60,
        message: 'Extracting certificates...',
      });

      const certFiles = Object.keys(zip.files).filter(name => name.startsWith('certificates/') && !name.endsWith('/'));

      let processedCount = 0;
      for (const fileName of certFiles) {
        const file = zip.file(fileName);
        if (file) {
          const base64Data = await file.async('base64');
          certificates.push({
            fileName: fileName.replace('certificates/', ''),
            base64Data,
          });

          processedCount++;
          const certProgress = 60 + Math.floor((processedCount / certFiles.length) * 30);
          onProgress?.({
            step: 'certificates',
            progress: certProgress,
            message: `Extracted ${processedCount}/${certFiles.length} certificates...`,
          });
        }
      }
    }

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Extraction complete!',
    });

    return {
      success: true,
      backupData,
      certificates,
      message: `Successfully extracted backup with ${certificates.length} certificates`,
    };
  } catch (error) {
    __DEV__ && console.error('Error extracting ZIP backup:', error);

    return {
      success: false,
      message: `Failed to extract backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
