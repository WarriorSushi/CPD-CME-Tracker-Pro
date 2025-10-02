import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
}

export interface UseImagePickerOptions {
  allowCamera?: boolean;
  allowGallery?: boolean;
  allowFiles?: boolean;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  onSuccess?: (result: ImagePickerResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for handling image/file uploads with camera, gallery, and file picker
 */
export function useImagePicker(options: UseImagePickerOptions = {}) {
  const {
    allowCamera = true,
    allowGallery = true,
    allowFiles = false,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = ['image/*'],
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setCameraPermission(granted);

      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [{ text: 'OK' }]
        );
      }

      return granted;
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      setCameraPermission(false);
      return false;
    }
  }, []);

  /**
   * Launch camera to take photo
   */
  const launchCamera = useCallback(async () => {
    if (!allowCamera) {
      throw new Error('Camera is not allowed');
    }

    setIsUploading(true);
    try {
      // Check/request camera permission
      const hasPermission = cameraPermission ?? await requestCameraPermission();
      if (!hasPermission) {
        setIsUploading(false);
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageResult: ImagePickerResult = {
          uri: asset.uri,
          fileName: asset.uri.split('/').pop() || 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: asset.fileSize,
        };

        onSuccess?.(imageResult);
        return imageResult;
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to take photo');
      console.error('Camera error:', err);
      onError?.(err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [allowCamera, cameraPermission, requestCameraPermission, onSuccess, onError]);

  /**
   * Launch image library to pick photo
   */
  const launchGallery = useCallback(async () => {
    if (!allowGallery) {
      throw new Error('Gallery is not allowed');
    }

    setIsUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageResult: ImagePickerResult = {
          uri: asset.uri,
          fileName: asset.uri.split('/').pop() || 'image.jpg',
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        };

        // Check file size
        if (imageResult.fileSize && imageResult.fileSize > maxFileSize) {
          Alert.alert(
            'File Too Large',
            `The selected file is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`
          );
          return null;
        }

        onSuccess?.(imageResult);
        return imageResult;
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to pick image');
      console.error('Gallery error:', err);
      onError?.(err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [allowGallery, maxFileSize, onSuccess, onError]);

  /**
   * Launch document picker for PDFs and other files
   */
  const launchFilePicker = useCallback(async () => {
    if (!allowFiles) {
      throw new Error('File picker is not allowed');
    }

    setIsUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileResult: ImagePickerResult = {
          uri: asset.uri,
          fileName: asset.name,
          mimeType: asset.mimeType,
          fileSize: asset.size,
        };

        // Check file size
        if (fileResult.fileSize && fileResult.fileSize > maxFileSize) {
          Alert.alert(
            'File Too Large',
            `The selected file is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`
          );
          return null;
        }

        onSuccess?.(fileResult);
        return fileResult;
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to pick file');
      console.error('File picker error:', err);
      onError?.(err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [allowFiles, acceptedTypes, maxFileSize, onSuccess, onError]);

  return {
    isUploading,
    cameraPermission,
    launchCamera,
    launchGallery,
    launchFilePicker,
    requestCameraPermission,
  };
}
