import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { FILE_PATHS } from '../constants';

export interface ThumbnailResult {
  thumbnailUri: string;
  width: number;
  height: number;
  fileSize: number;
}

export class ThumbnailService {
  private static readonly THUMBNAIL_SIZE = 300; // Max width/height for thumbnails
  private static readonly THUMBNAIL_QUALITY = 0.7;

  /**
   * Generate a thumbnail for an image file
   */
  static async generateThumbnail(
    originalImageUri: string,
    fileName: string
  ): Promise<ThumbnailResult> {
    try {

      // Create thumbnails directory if it doesn't exist
      const thumbnailsDir = `${FileSystem.documentDirectory}${FILE_PATHS.THUMBNAILS}`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(thumbnailsDir, { intermediates: true });
      }

      // Generate thumbnail filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'jpg';
      const thumbnailFileName = `thumb_${timestamp}.${extension}`;
      const thumbnailPath = `${thumbnailsDir}${thumbnailFileName}`;

      // Create thumbnail using manipulateAsync
      const thumbnail = await manipulateAsync(
        originalImageUri,
        [
          {
            resize: {
              width: this.THUMBNAIL_SIZE,
            },
          },
        ],
        {
          compress: this.THUMBNAIL_QUALITY,
          format: SaveFormat.JPEG,
        }
      );

      // Copy thumbnail to permanent location
      await FileSystem.copyAsync({
        from: thumbnail.uri,
        to: thumbnailPath,
      });

      // Get thumbnail file info
      const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);

      return {
        thumbnailUri: thumbnailPath,
        width: thumbnail.width,
        height: thumbnail.height,
        fileSize: (thumbnailInfo as any).size || 0,
      };

    } catch (error) {
      __DEV__ && console.error('💥 ThumbnailService: Failed to generate thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Generate thumbnails for PDF documents
   * This is a placeholder - full PDF thumbnail generation would require additional libraries
   */
  static async generatePDFThumbnail(
    pdfUri: string,
    fileName: string
  ): Promise<ThumbnailResult> {
    try {

      // Create thumbnails directory if it doesn't exist
      const thumbnailsDir = `${FileSystem.documentDirectory}${FILE_PATHS.THUMBNAILS}`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(thumbnailsDir, { intermediates: true });
      }

      // For now, return a placeholder thumbnail
      // In a full implementation, this would use a PDF rendering library
      const timestamp = Date.now();
      const thumbnailFileName = `pdf_thumb_${timestamp}.jpg`;
      const thumbnailPath = `${thumbnailsDir}${thumbnailFileName}`;

      // Create a simple colored rectangle as PDF placeholder thumbnail
      const placeholderThumbnail = await manipulateAsync(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9mRwJcgAAAABJRU5ErkJggg==', // 1x1 transparent pixel
        [
          {
            resize: {
              width: this.THUMBNAIL_SIZE,
            },
          },
        ],
        {
          compress: this.THUMBNAIL_QUALITY,
          format: SaveFormat.JPEG,
        }
      );

      // Copy to permanent location
      await FileSystem.copyAsync({
        from: placeholderThumbnail.uri,
        to: thumbnailPath,
      });

      const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);

      return {
        thumbnailUri: thumbnailPath,
        width: placeholderThumbnail.width,
        height: placeholderThumbnail.height,
        fileSize: (thumbnailInfo as any).size || 0,
      };

    } catch (error) {
      __DEV__ && console.error('💥 ThumbnailService: Failed to generate PDF thumbnail:', error);
      throw new Error('Failed to generate PDF thumbnail');
    }
  }

  /**
   * Delete a thumbnail file
   */
  static async deleteThumbnail(thumbnailUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(thumbnailUri);

      }
    } catch (error) {
      __DEV__ && console.error('💥 ThumbnailService: Failed to delete thumbnail:', error);
    }
  }

  /**
   * Clean up orphaned thumbnails that no longer have corresponding certificates
   */
  static async cleanupOrphanedThumbnails(validThumbnailUris: string[]): Promise<void> {
    try {
      const thumbnailsDir = `${FileSystem.documentDirectory}${FILE_PATHS.THUMBNAILS}`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailsDir);
      
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(thumbnailsDir);
      const validUriSet = new Set(validThumbnailUris.map(uri => uri.split('/').pop()));

      for (const file of files) {
        if (!validUriSet.has(file)) {
          const orphanedPath = `${thumbnailsDir}${file}`;
          await FileSystem.deleteAsync(orphanedPath);

        }
      }
    } catch (error) {
      __DEV__ && console.error('💥 ThumbnailService: Failed to cleanup orphaned thumbnails:', error);
    }
  }

  /**
   * Get storage usage statistics for thumbnails
   */
  static async getStorageStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const thumbnailsDir = `${FileSystem.documentDirectory}${FILE_PATHS.THUMBNAILS}`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailsDir);
      
      if (!dirInfo.exists) {
        return { count: 0, totalSize: 0 };
      }

      const files = await FileSystem.readDirectoryAsync(thumbnailsDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${thumbnailsDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        totalSize += (fileInfo as any).size || 0;
      }

      return {
        count: files.length,
        totalSize,
      };
    } catch (error) {
      __DEV__ && console.error('💥 ThumbnailService: Failed to get storage stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}