/**
 * FileSystem Compatibility Layer
 * Provides a simple wrapper around the new expo-file-system legacy API
 * to maintain compatibility with existing code
 */

import * as FileSystemLegacy from 'expo-file-system/legacy';

// Re-export everything from the legacy API
export const FileSystem = FileSystemLegacy;

// Export common types and constants
export const documentDirectory = FileSystemLegacy.documentDirectory;
export const cacheDirectory = FileSystemLegacy.cacheDirectory;

export default FileSystemLegacy;
