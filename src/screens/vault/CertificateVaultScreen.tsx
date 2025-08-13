import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

import { Card, Button, LoadingSpinner, Input, StandardHeader, SvgIcon } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { Certificate } from '../../types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES, FILE_PATHS } from '../../constants';
import { ThumbnailService } from '../../services/thumbnailService';
import { databaseOperations } from '../../services/database';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing[5] * 3) / 2;

interface Props {
  navigation?: any; // We'll need navigation to go to AddCME screen
}

export const CertificateVaultScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { certificates, isLoadingCertificates, refreshCertificates, refreshCMEData } = useAppContext();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Check camera permissions on mount
  useFocusEffect(
    useCallback(() => {
      refreshCertificates();
      checkCameraPermissions();
    }, [refreshCertificates])
  );

  const checkCameraPermissions = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const requestCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCertificates();
    setRefreshing(false);
  }, [refreshCertificates]);

  const handleCameraPress = async () => {
    if (!cameraPermission) {
      const granted = await requestCameraPermissions();
      if (!granted) {
        Alert.alert('Camera Permission', 'Camera access is required to scan certificates.');
        return;
      }
    }

    try {
      setIsScanning(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        await processCertificateImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      setIsScanning(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        await processCertificateImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo gallery. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const processCertificateImage = async (imageAsset: any) => {
    try {
      console.log('📄 Processing certificate image:', imageAsset.uri);
      
      // Create certificates directory if it doesn't exist
      const certificatesDir = `${FileSystem.documentDirectory}${FILE_PATHS.CERTIFICATES}`;
      const dirInfo = await FileSystem.getInfoAsync(certificatesDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(certificatesDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = imageAsset.uri.split('.').pop() || 'jpg';
      const newFileName = `certificate_${timestamp}.${extension}`;
      const newFilePath = `${certificatesDir}${newFileName}`;

      // Copy image to app documents
      await FileSystem.copyAsync({
        from: imageAsset.uri,
        to: newFilePath,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(newFilePath);
      console.log('📁 Certificate saved to:', newFilePath);

      // Generate thumbnail
      console.log('📸 Generating thumbnail...');
      let thumbnailPath = null;
      try {
        const thumbnailResult = await ThumbnailService.generateThumbnail(imageAsset.uri, newFileName);
        thumbnailPath = thumbnailResult.thumbnailUri;
        console.log('✅ Thumbnail generated successfully:', thumbnailPath);
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
      }

      // Save certificate to database with thumbnail path
      const addResult = await databaseOperations.certificates.addCertificate({
        filePath: newFilePath,
        fileName: newFileName,
        fileSize: fileInfo.size,
        mimeType: 'image/jpeg',
        thumbnailPath: thumbnailPath || undefined,
        cmeEntryId: null // Standalone certificate, not linked to a CME entry
      });

      if (addResult.success && addResult.data) {
        console.log('✅ Certificate added to vault with ID:', addResult.data);
        Alert.alert('Success', 'Certificate saved to your vault!');
        await refreshCertificates();
      } else {
        console.error('❌ Failed to save certificate to database:', addResult.error);
        Alert.alert('Error', 'Certificate saved to device but failed to add to vault database.');
      }

    } catch (error) {
      console.error('💥 Error processing certificate:', error);
      Alert.alert('Error', 'Failed to process certificate. Please try again.');
    }
  };

  // No filtering needed since search is removed


  const handleUploadCertificate = async () => {
    try {
      setIsUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [...SUPPORTED_FILE_TYPES.IMAGES, ...SUPPORTED_FILE_TYPES.DOCUMENTS],
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size
      const isImageType = file.mimeType && SUPPORTED_FILE_TYPES.IMAGES.includes(file.mimeType as any);
      const maxSize = isImageType ? MAX_FILE_SIZES.IMAGE : MAX_FILE_SIZES.DOCUMENT;

      if ((file.size || 0) > maxSize) {
        Alert.alert(
          'File Too Large',
          `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        );
        return;
      }

      // Create certificates directory if it doesn't exist
      const certificatesDir = `${FileSystem.documentDirectory}${FILE_PATHS.CERTIFICATES}`;
      const dirInfo = await FileSystem.getInfoAsync(certificatesDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(certificatesDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'pdf';
      const newFileName = `certificate_${timestamp}.${extension}`;
      const newFilePath = `${certificatesDir}${newFileName}`;

      // Copy file to app documents
      await FileSystem.copyAsync({
        from: file.uri,
        to: newFilePath,
      });

      // Generate thumbnail only for images
      console.log('📸 Generating thumbnail for uploaded file...');
      let thumbnailPath = null;
      try {
        if (isImageType) {
          const thumbnailResult = await ThumbnailService.generateThumbnail(file.uri, file.name);
          thumbnailPath = thumbnailResult.thumbnailUri;
          console.log('✅ Thumbnail generated for uploaded image');
        } else {
          // For documents, we'll just use document name and icon - no thumbnail needed
          console.log('📄 Document type detected, using document tile (no thumbnail)');
        }
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed for uploaded file:', thumbnailError);
      }

      // Add certificate to database
      const certificateData = {
        fileName: file.name,
        filePath: newFilePath,
        fileSize: file.size || 0,
        mimeType: file.mimeType || 'application/pdf',
        thumbnailPath,
        cmeEntryId: null, // Not associated with any specific CME entry
      };

      console.log('💾 Adding certificate to vault database:', certificateData);
      
      const addResult = await databaseOperations.certificates.addCertificate(certificateData);
      
      if (addResult.success) {
        console.log('✅ Certificate added to vault with ID:', addResult.data);
        Alert.alert('Success', 'Certificate uploaded successfully!');
        // Refresh the list
        await refreshCertificates();
      } else {
        console.error('❌ Failed to add certificate to database:', addResult.error);
        Alert.alert('Error', 'Failed to save certificate to vault. Please try again.');
      }

    } catch (error) {
      console.error('Error uploading certificate:', error);
      Alert.alert('Error', 'Failed to upload certificate. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCertificate = (certificate: Certificate) => {
    Alert.alert(
      'Delete Certificate',
      `Are you sure you want to delete "${certificate.fileName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // First, clear certificate path from any CME entries that reference this file
              try {
                // Use a workaround to clear certificate references
                const allEntries = await databaseOperations.cme.getAllEntries();
                if (allEntries.success && allEntries.data) {
                  const entriesToUpdate = allEntries.data.filter(entry => 
                    entry.certificatePath === certificate.filePath
                  );
                  
                  for (const entry of entriesToUpdate) {
                    await databaseOperations.cme.updateEntry(entry.id, { 
                      certificatePath: undefined 
                    });
                  }
                  
                  if (entriesToUpdate.length > 0) {
                    console.log(`✅ Cleared certificate references from ${entriesToUpdate.length} CME entries`);
                  }
                }
              } catch (updateError) {
                console.warn('⚠️ Could not clear certificate references from CME entries:', updateError);
              }

              // Delete from database
              const deleteResult = await databaseOperations.certificates.deleteCertificate(certificate.id);
              
              if (!deleteResult.success) {
                Alert.alert('Error', 'Failed to delete certificate from database.');
                return;
              }

              // Delete file from filesystem
              const fileInfo = await FileSystem.getInfoAsync(certificate.filePath);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(certificate.filePath);
              }

              // Also delete thumbnail if it exists
              if (certificate.thumbnailPath) {
                try {
                  // Handle both string paths and thumbnail result objects
                  let thumbnailUri = certificate.thumbnailPath;
                  if (typeof certificate.thumbnailPath === 'object' && certificate.thumbnailPath.thumbnailUri) {
                    thumbnailUri = certificate.thumbnailPath.thumbnailUri;
                  }
                  
                  const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailUri);
                  if (thumbnailInfo.exists) {
                    await FileSystem.deleteAsync(thumbnailUri);
                  }
                } catch (thumbnailError) {
                  console.warn('Warning: Could not delete thumbnail:', thumbnailError);
                  // Continue with deletion even if thumbnail cleanup fails
                }
              }

              // Refresh both certificates and CME data to update all UIs
              await Promise.all([
                refreshCertificates(),
                refreshCMEData() // Refresh CME data to remove thumbnails from entries
              ]);
              
              Alert.alert('Success', 'Certificate deleted successfully!');
            } catch (error) {
              console.error('Error deleting certificate:', error);
              Alert.alert('Error', 'Failed to delete certificate.');
            }
          },
        },
      ]
    );
  };

  const handleViewCertificate = async (certificate: Certificate) => {
    try {
      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(certificate.filePath);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Certificate file not found.');
        return;
      }

      // For now, just show file info
      Alert.alert(
        certificate.fileName,
        `Size: ${(certificate.fileSize / 1024).toFixed(1)} KB\nType: ${certificate.mimeType}\nCreated: ${new Date(certificate.createdAt).toLocaleDateString()}`,
        [
          {
            text: 'OK',
          },
        ]
      );
    } catch (error) {
      console.error('Error viewing certificate:', error);
      Alert.alert('Error', 'Failed to view certificate.');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏆</Text>
      <Text style={styles.emptyTitle}>No certificates yet</Text>
      <Text style={styles.emptySubtitle}>
        Upload your first certificate to get started
      </Text>
      <Button
        title="Upload Certificate"
        onPress={handleUploadCertificate}
        style={styles.emptyButton}
        loading={isUploading}
      />
    </View>
  );

  const renderCertificate = ({ item, index }: { item: Certificate; index: number }) => {
    const isImage = SUPPORTED_FILE_TYPES.IMAGES.includes(item.mimeType as any);
    
    // Pinterest-style dynamic heights
    const cardHeight = 200 + (Math.abs(Math.sin(index * 1.2)) * 100); // Random height between 200-300
    const imageHeight = cardHeight * 0.7;
    
    return (
      <TouchableOpacity 
        style={[styles.masonryCard, { height: cardHeight }]}
        onPress={() => handleViewCertificate(item)}
      >
        <Card style={[styles.masonryContent, { height: cardHeight }]}>
          {/* Certificate Preview */}
          <View style={[styles.masonryPreview, { height: imageHeight }]}>
            {isImage ? (
              <Image 
                source={{ uri: item.filePath }}
                style={styles.masonryImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.masonryPdfPreview}>
                <Text style={styles.masonryPdfIcon}>📄</Text>
                <Text style={styles.masonryPdfLabel}>
                  {item.mimeType === 'application/pdf' ? 'PDF' : 'DOC'}
                </Text>
              </View>
            )}
            
            {/* Overlay actions */}
            <View style={styles.masonryOverlay}>
              <TouchableOpacity 
                style={styles.overlayDeleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteCertificate(item);
                }}
              >
                <Text style={styles.overlayDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Certificate Info */}
          <View style={styles.masonryInfo}>
            <Text style={styles.masonryName} numberOfLines={1}>
              {item.fileName.replace(/\.[^/.]+$/, "")} {/* Remove extension */}
            </Text>
            <View style={styles.masonryMetaRow}>
              <Text style={styles.masonrySize}>
                {(item.fileSize / 1024).toFixed(0)}KB
              </Text>
              <Text style={styles.masonryDate}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StandardHeader
        title="Certificate Vault"
        showBackButton={false}
      />
      
      {/* Subtitle */}
      <View style={styles.subtitleSection}>
        <Text style={styles.subtitle}>Store and manage your certificates securely</Text>
      </View>

      {/* Prominent Add Section */}
      <View style={styles.prominentAddSection}>
        <View style={styles.addSectionTitleContainer}>
          <SvgIcon name="vault" size={20} color={theme.colors.primary} />
          <Text style={styles.addSectionTitle}>Add Certificate</Text>
        </View>
        <View style={styles.addButtonsRow}>
          <TouchableOpacity 
            style={[styles.addButton, styles.cameraButton]}
            onPress={handleCameraPress}
            disabled={isScanning}
          >
            <Text style={styles.addButtonIcon}>📷</Text>
            <Text style={styles.addButtonText}>Camera</Text>
            {isScanning && <LoadingSpinner size={12} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, styles.galleryButton]}
            onPress={handleGalleryPress}
            disabled={isScanning}
          >
            <Text style={styles.addButtonIcon}>🖼️</Text>
            <Text style={styles.addButtonText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, styles.uploadButton]}
            onPress={handleUploadCertificate}
            disabled={isUploading}
          >
            <Text style={styles.addButtonIcon}>📁</Text>
            <Text style={styles.addButtonText}>Files</Text>
            {isUploading && <LoadingSpinner size={12} />}
          </TouchableOpacity>
        </View>
        
        {/* Tiny stats moved to bottom right */}
        <View style={styles.tinyStats}>
          <Text style={styles.tinyStatsText}>
            {certificates?.length || 0} certificates • {((certificates || []).reduce((sum, cert) => sum + cert.fileSize, 0) / 1024 / 1024).toFixed(1)}MB used
          </Text>
        </View>
      </View>

      {/* Certificates Grid */}
      {isLoadingCertificates ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      ) : (
        <FlatList
          data={certificates}
          renderItem={renderCertificate}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.masonryList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          columnWrapperStyle={styles.masonryRow}
          ItemSeparatorComponent={() => <View style={styles.masonyVerticalSpacer} />}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Subtitle
  subtitleSection: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: '#FFF7EC', // Section background
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Compact Add Section
  prominentAddSection: {
    marginHorizontal: theme.spacing[3],
    marginVertical: theme.spacing[2],
    padding: theme.spacing[3],
    backgroundColor: '#FFF7EC', // Section background
    borderRadius: theme.spacing[2],
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  addSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },
  addButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cameraButton: {
    backgroundColor: '#3b82f6',
  },
  galleryButton: {
    backgroundColor: '#10b981',
  },
  uploadButton: {
    backgroundColor: '#8b5cf6',
  },
  addButtonIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  addButtonText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
    textAlign: 'center',
  },
  tinyStats: {
    alignSelf: 'flex-end',
  },
  tinyStatsText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    fontStyle: 'italic',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  // Masonry List
  masonryList: {
    paddingHorizontal: theme.spacing[3],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[4],
  },
  masonryRow: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[2],
  },
  masonyVerticalSpacer: {
    height: theme.spacing[3],
  },

  // Masonry Certificate Cards
  masonryCard: {
    width: (width - theme.spacing[3] * 2 - theme.spacing[2] * 2 - theme.spacing[3]) / 2,
    marginBottom: theme.spacing[3],
  },
  masonryContent: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  masonryPreview: {
    position: 'relative',
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  masonryImage: {
    width: '100%',
    height: '100%',
  },
  masonryPdfPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  masonryPdfIcon: {
    fontSize: 28,
    marginBottom: theme.spacing[1],
  },
  masonryPdfLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Masonry Overlay
  masonryOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: theme.spacing[2],
  },
  overlayDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayDeleteText: {
    fontSize: 12,
  },

  // Masonry Info
  masonryInfo: {
    padding: theme.spacing[3],
    backgroundColor: theme.colors.card, // Card background for certificate info
  },
  masonryName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  masonryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masonrySize: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  masonryDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing[6],
  },
  emptyButton: {
    minWidth: 150,
  },


});