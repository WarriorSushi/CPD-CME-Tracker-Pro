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

import { Card, Button, LoadingSpinner, Input } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { Certificate } from '../../types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES, FILE_PATHS } from '../../constants';
import { ThumbnailService } from '../../services/thumbnailService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing[5] * 3) / 2;

interface Props {
  navigation?: any; // We'll need navigation to go to AddCME screen
}

export const CertificateVaultScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { certificates, isLoadingCertificates, refreshCertificates } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
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

      // TODO: Save certificate to database with thumbnail path
      // For now, just show success
      Alert.alert('Success', 'Certificate saved to your vault!');

      await refreshCertificates();

    } catch (error) {
      console.error('💥 Error processing certificate:', error);
      Alert.alert('Error', 'Failed to process certificate. Please try again.');
    }
  };

  // Filter certificates based on search
  const filteredCertificates = certificates.filter(cert => 
    !searchQuery || 
    cert.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );


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

      // Generate thumbnail for the uploaded file
      console.log('📸 Generating thumbnail for uploaded file...');
      let thumbnailPath = null;
      try {
        if (isImageType) {
          const thumbnailResult = await ThumbnailService.generateThumbnail(file.uri, file.name);
          thumbnailPath = thumbnailResult.thumbnailUri;
          console.log('✅ Thumbnail generated for uploaded image');
        } else {
          const thumbnailResult = await ThumbnailService.generatePDFThumbnail(file.uri, file.name);
          thumbnailPath = thumbnailResult.thumbnailUri;
          console.log('✅ PDF thumbnail generated for uploaded document');
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
      };

      // For now, we'll skip the database integration and just show success
      Alert.alert('Success', 'Certificate uploaded successfully!');
      
      // Refresh the list
      await refreshCertificates();

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
              // Delete file from filesystem
              const fileInfo = await FileSystem.getInfoAsync(certificate.filePath);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(certificate.filePath);
              }

              // TODO: Delete from database using context
              // await deleteCertificate(certificate.id);

              Alert.alert('Success', 'Certificate deleted successfully!');
              await refreshCertificates();
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
        {searchQuery 
          ? 'No certificates match your search'
          : 'Upload your first certificate to get started'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Upload Certificate"
          onPress={handleUploadCertificate}
          style={styles.emptyButton}
          loading={isUploading}
        />
      )}
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
                <Text style={styles.masonryPdfLabel}>PDF</Text>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Certificate Vault</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => Alert.alert('Certificate Vault', 'Take photos or upload your certificates to keep them organized and easily accessible.')}
        >
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Scanning Section */}
      <View style={styles.scanningSection}>
        <Card style={styles.scanningCard}>
          <Text style={styles.scanningTitle}>📸 Add New Certificate</Text>
          <Text style={styles.scanningSubtitle}>
            Take a photo or choose from gallery to add certificates to your vault
          </Text>
          
          <View style={styles.scanningActions}>
            <TouchableOpacity 
              style={[styles.scanButton, styles.cameraButton]}
              onPress={handleCameraPress}
              disabled={isScanning}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>Camera</Text>
              {isScanning && <LoadingSpinner size={16} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, styles.galleryButton]}
              onPress={handleGalleryPress}
              disabled={isScanning}
            >
              <Text style={styles.scanButtonIcon}>🖼️</Text>
              <Text style={styles.scanButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, styles.uploadButton]}
              onPress={handleUploadCertificate}
              disabled={isUploading}
            >
              <Text style={styles.scanButtonIcon}>📁</Text>
              <Text style={styles.scanButtonText}>Files</Text>
              {isUploading && <LoadingSpinner size={16} />}
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Search and Stats */}
      <View style={styles.controls}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search certificates..."
          style={styles.searchInput}
        />
        
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredCertificates.length}</Text>
              <Text style={styles.statLabel}>
                {searchQuery ? 'Found' : 'Certificates'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(filteredCertificates.reduce((sum, cert) => sum + cert.fileSize, 0) / 1024 / 1024).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>MB Used</Text>
            </View>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </View>

      {/* Certificates Grid */}
      {isLoadingCertificates ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCertificates}
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    backgroundColor: '#1e3a8a',
    borderBottomLeftRadius: theme.spacing[4],
    borderBottomRightRadius: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 16,
  },

  // Scanning Section
  scanningSection: {
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[4],
  },
  scanningCard: {
    padding: theme.spacing[5],
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  scanningTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  scanningSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  scanningActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing[3],
  },
  scanButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  scanButtonIcon: {
    fontSize: 24,
    marginBottom: theme.spacing[2],
  },
  scanButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },

  // Controls
  controls: {
    padding: theme.spacing[5],
    gap: theme.spacing[4],
  },
  searchInput: {
    // Input styles applied by component
  },
  
  // Stats
  statsCard: {
    paddingVertical: theme.spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    paddingBottom: theme.spacing[8],
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
    backgroundColor: theme.colors.background,
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

  // Search and management styles
  clearSearchButton: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing[2],
    marginLeft: theme.spacing[3],
  },
  clearSearchText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  },

});