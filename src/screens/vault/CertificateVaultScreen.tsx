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

import { Card, Button, LoadingSpinner, Input } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { Certificate } from '../../types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES, FILE_PATHS } from '../../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing[5] * 3) / 2;

export const CertificateVaultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { certificates, isLoadingCertificates, refreshCertificates } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshCertificates();
    }, [refreshCertificates])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCertificates();
    setRefreshing(false);
  }, [refreshCertificates]);

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

      // Add certificate to database
      const certificateData = {
        fileName: file.name,
        filePath: newFilePath,
        fileSize: file.size || 0,
        mimeType: file.mimeType || 'application/pdf',
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

  const renderCertificate = ({ item }: { item: Certificate }) => {
    const isImage = SUPPORTED_FILE_TYPES.IMAGES.includes(item.mimeType as any);
    
    return (
      <TouchableOpacity 
        style={styles.certificateCard}
        onPress={() => handleViewCertificate(item)}
      >
        <Card style={styles.certificateContent}>
          {/* Certificate Preview */}
          <View style={styles.certificatePreview}>
            {isImage ? (
              <Image 
                source={{ uri: item.filePath }}
                style={styles.certificateImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.pdfPreview}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text style={styles.pdfLabel}>PDF</Text>
              </View>
            )}
          </View>

          {/* Certificate Info */}
          <View style={styles.certificateInfo}>
            <Text style={styles.certificateName} numberOfLines={2}>
              {item.fileName}
            </Text>
            <Text style={styles.certificateSize}>
              {(item.fileSize / 1024).toFixed(1)} KB
            </Text>
            <Text style={styles.certificateDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.certificateActions}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteCertificate(item);
              }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
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
        <Button
          title="Upload"
          onPress={handleUploadCertificate}
          size="small"
          loading={isUploading}
          style={styles.uploadButton}
        />
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
              <Text style={styles.statLabel}>Certificates</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(filteredCertificates.reduce((sum, cert) => sum + cert.fileSize, 0) / 1024 / 1024).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>MB Used</Text>
            </View>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          columnWrapperStyle={styles.row}
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  uploadButton: {
    minWidth: 80,
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

  // List
  listContent: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Certificate Cards
  certificateCard: {
    width: CARD_WIDTH,
    marginBottom: theme.spacing[4],
  },
  certificateContent: {
    padding: theme.spacing[3],
    height: CARD_WIDTH * 1.3,
  },
  certificatePreview: {
    height: CARD_WIDTH * 0.6,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.gray.light,
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.light,
  },
  pdfIcon: {
    fontSize: 32,
    marginBottom: theme.spacing[2],
  },
  pdfLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  certificateSize: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  certificateDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  // Actions
  certificateActions: {
    position: 'absolute',
    top: theme.spacing[2],
    right: theme.spacing[2],
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
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