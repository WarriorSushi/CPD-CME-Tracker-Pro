import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';

import { Button, Card, Input, LoadingSpinner, DatePicker, StandardHeader } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { CME_CATEGORIES, FILE_PATHS, SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from '../../constants';
import { CMEEntry } from '../../types';
import { getCreditUnit } from '../../utils/creditTerminology';
import { ThumbnailService } from '../../services/thumbnailService';
import { databaseOperations } from '../../services/database';

type AddCMEScreenNavigationProp = StackNavigationProp<MainTabParamList, 'AddCME'>;
type AddCMEScreenRouteProp = RouteProp<MainTabParamList, 'AddCME'>;

interface Props {
  navigation: AddCMEScreenNavigationProp;
  route: AddCMEScreenRouteProp;
}

interface FormData {
  title: string;
  provider: string;
  dateAttended: Date;
  creditsEarned: string;
  category: string;
  notes: string;
  certificatePath?: string;
}

interface FormErrors {
  title?: string;
  provider?: string;
  creditsEarned?: string;
  category?: string;
}

export const AddCMEScreen: React.FC<Props> = ({ navigation, route }) => {
  console.log('➕ AddCMEScreen: Component rendering/mounting');
  console.log('📄 AddCMEScreen: Route params:', route.params);
  
  const insets = useSafeAreaInsets();
  const { user, addCMEEntry, updateCMEEntry, refreshCertificates } = useAppContext();
  
  const editEntry = route.params?.editEntry;
  const ocrData = route.params?.ocrData;
  const isEditing = !!editEntry;
  
  console.log('🔧 AddCMEScreen: Mode:', isEditing ? 'EDITING' : 'ADDING');
  console.log('📄 AddCMEScreen: OCR Data received:', ocrData);

  // Helper function to parse date from OCR
  const parseOCRDate = (dateString?: string): Date => {
    if (!dateString) return new Date();
    
    try {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse OCR date:', dateString);
    }
    
    return new Date();
  };
  
  const [formData, setFormData] = useState<FormData>({
    title: editEntry?.title || ocrData?.title || '',
    provider: editEntry?.provider || ocrData?.provider || '',
    dateAttended: editEntry ? new Date(editEntry.dateAttended) : parseOCRDate(ocrData?.date),
    creditsEarned: editEntry?.creditsEarned?.toString() || ocrData?.credits || '',
    category: editEntry?.category || ocrData?.category || CME_CATEGORIES[0],
    notes: editEntry?.notes || '',
    certificatePath: editEntry?.certificatePath || ocrData?.certificatePath || undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  
  // Button pressing states for visual feedback
  const [pressedButtons, setPressedButtons] = useState<{
    camera: boolean;
    gallery: boolean;
    files: boolean;
    remove: boolean;
  }>({
    camera: false,
    gallery: false,
    files: false,
    remove: false,
  });

  // Reset form when screen comes into focus or params change
  useEffect(() => {
    const currentEditEntry = route.params?.editEntry;
    const currentOcrData = route.params?.ocrData;
    
    console.log('🔄 AddCMEScreen: Resetting form with editEntry:', currentEditEntry);
    console.log('🔄 AddCMEScreen: Resetting form with ocrData:', currentOcrData);
    
    setFormData({
      title: currentEditEntry?.title || currentOcrData?.title || '',
      provider: currentEditEntry?.provider || currentOcrData?.provider || '',
      dateAttended: currentEditEntry 
        ? new Date(currentEditEntry.dateAttended) 
        : parseOCRDate(currentOcrData?.date),
      creditsEarned: currentEditEntry?.creditsEarned?.toString() || currentOcrData?.credits || '',
      category: currentEditEntry?.category || currentOcrData?.category || CME_CATEGORIES[0],
      notes: currentEditEntry?.notes || '',
      certificatePath: currentEditEntry?.certificatePath || currentOcrData?.certificatePath || undefined,
    });
    
    // Clear any errors when resetting
    setErrors({});
  }, [route.params?.editEntry, route.params?.ocrData]);

  // Additional reset when screen gets focus (ensures clean slate for new entries)
  useFocusEffect(
    useCallback(() => {
      const currentEditEntry = route.params?.editEntry;
      
      // Only reset if this is a new entry (no editEntry) AND we haven't already populated form data
      if (!currentEditEntry && !formData.title && !formData.provider) {
        console.log('🔄 AddCMEScreen: Screen focused, resetting for new entry');
        setFormData({
          title: '',
          provider: '',
          dateAttended: new Date(),
          creditsEarned: '',
          category: CME_CATEGORIES[0],
          notes: '',
          certificatePath: undefined,
        });
        setErrors({});
      } else {
        console.log('🔄 AddCMEScreen: Screen focused, skipping reset (editing or form has data)');
      }
    }, [route.params?.editEntry, formData.title, formData.provider])
  );

  // Camera permission handling
  const checkCameraPermissions = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const requestCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  // Certificate handling functions
  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      const granted = await requestCameraPermissions();
      if (!granted) {
        Alert.alert('Camera Permission', 'Camera access is required to take photos.');
        return;
      }
    }

    try {
      setIsUploadingCertificate(true);
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
      setIsUploadingCertificate(false);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      setIsUploadingCertificate(true);
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
      setIsUploadingCertificate(false);
    }
  };

  const processCertificateImage = async (imageAsset: any) => {
    try {
      console.log('📄 Processing certificate image for CME entry:', imageAsset.uri);
      
      // Create certificates directory if it doesn't exist
      const certificatesDir = `${FileSystem.documentDirectory}${FILE_PATHS.CERTIFICATES}`;
      const dirInfo = await FileSystem.getInfoAsync(certificatesDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(certificatesDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = imageAsset.uri.split('.').pop() || 'jpg';
      const newFileName = `cme_certificate_${timestamp}.${extension}`;
      const newFilePath = `${certificatesDir}${newFileName}`;

      // Copy image to app documents
      await FileSystem.copyAsync({
        from: imageAsset.uri,
        to: newFilePath,
      });

      // Generate thumbnail
      let thumbnailPath: string | undefined;
      try {
        thumbnailPath = await ThumbnailService.generateThumbnail(imageAsset.uri, newFileName);
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
      }

      // Get file info for certificate vault storage
      const fileInfo = await FileSystem.getInfoAsync(newFilePath);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      // Automatically add certificate to vault
      try {
        const certificateData = {
          filePath: newFilePath,
          fileName: newFileName,
          fileSize: fileSize,
          mimeType: `image/${extension}`,
          thumbnailPath: thumbnailPath,
          cmeEntryId: null, // Will be set after CME entry is created
        };

        const addResult = await databaseOperations.certificates.addCertificate(certificateData);
        if (addResult.success) {
          console.log('✅ Certificate automatically added to vault with ID:', addResult.data);
          // Refresh certificates in AppContext so vault shows the new certificate
          await refreshCertificates();
        } else {
          console.warn('⚠️ Failed to add certificate to vault:', addResult.error);
        }
      } catch (certError) {
        console.error('💥 Error adding certificate to vault:', certError);
      }

      // Update form data with certificate path
      setFormData(prev => ({
        ...prev,
        certificatePath: newFilePath,
      }));

      Alert.alert('Success', 'Certificate added to entry and saved to vault!');

    } catch (error) {
      console.error('💥 Error processing certificate:', error);
      Alert.alert('Error', 'Failed to process certificate. Please try again.');
    }
  };


  const handleChooseFiles = async () => {
    try {
      setIsUploadingCertificate(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_FILE_TYPES.ALL,
        copyToCacheDirectory: false,
      });

      if (!result.canceled) {
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

        await processDocument(file);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to open file picker. Please try again.');
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const processDocument = async (file: any) => {
    try {
      console.log('📄 Processing document file:', file.name);
      
      // Create certificates directory if it doesn't exist
      const certificatesDir = `${FileSystem.documentDirectory}${FILE_PATHS.CERTIFICATES}`;
      const dirInfo = await FileSystem.getInfoAsync(certificatesDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(certificatesDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'pdf';
      const newFileName = `cme_certificate_${timestamp}.${extension}`;
      const newFilePath = `${certificatesDir}${newFileName}`;

      // Copy file to app documents
      await FileSystem.copyAsync({
        from: file.uri,
        to: newFilePath,
      });

      // Generate thumbnail only for images
      let thumbnailPath: string | undefined;
      try {
        const isImageType = file.mimeType && SUPPORTED_FILE_TYPES.IMAGES.includes(file.mimeType as any);
        if (isImageType) {
          thumbnailPath = await ThumbnailService.generateThumbnail(file.uri, newFileName);
          console.log('✅ Thumbnail generated for image file');
        } else {
          // For documents, we'll just use document name and icon - no thumbnail needed
          console.log('📄 Document type detected, using document tile (no thumbnail)');
        }
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
      }

      // Automatically add certificate to vault
      try {
        const certificateData = {
          filePath: newFilePath,
          fileName: newFileName,
          fileSize: file.size || 0,
          mimeType: file.mimeType || 'application/pdf',
          thumbnailPath: thumbnailPath,
          cmeEntryId: null, // Will be set after CME entry is created
        };

        const addResult = await databaseOperations.certificates.addCertificate(certificateData);
        if (addResult.success) {
          console.log('✅ Document automatically added to vault with ID:', addResult.data);
          // Refresh certificates in AppContext so vault shows the new certificate
          await refreshCertificates();
        } else {
          console.warn('⚠️ Failed to add document to vault:', addResult.error);
        }
      } catch (certError) {
        console.error('💥 Error adding document to vault:', certError);
      }

      // Update form data with certificate path
      setFormData(prev => ({
        ...prev,
        certificatePath: newFilePath,
      }));

      Alert.alert('Success', 'Document added to entry and saved to vault!');

    } catch (error) {
      console.error('💥 Error processing document:', error);
      Alert.alert('Error', 'Failed to process document. Please try again.');
    }
  };

  const handleRemoveCertificate = () => {
    Alert.alert(
      'Remove Certificate',
      'Are you sure you want to remove the certificate from this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              certificatePath: undefined,
            }));
          },
        },
      ]
    );
  };

  // Check camera permissions on mount
  useEffect(() => {
    checkCameraPermissions();
  }, []);

  // Button pressing effect handlers
  const handlePressIn = (buttonType: keyof typeof pressedButtons) => {
    setPressedButtons(prev => ({ ...prev, [buttonType]: true }));
  };

  const handlePressOut = (buttonType: keyof typeof pressedButtons) => {
    setPressedButtons(prev => ({ ...prev, [buttonType]: false }));
  };

  // Get pressed button style
  const getPressedButtonStyle = (buttonType: keyof typeof pressedButtons) => {
    return pressedButtons[buttonType] ? styles.buttonPressed : {};
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.provider.trim()) {
      newErrors.provider = 'Provider is required';
    }

    if (!formData.creditsEarned.trim()) {
      const creditUnit = user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits';
      newErrors.creditsEarned = `${creditUnit} earned is required`;
    } else {
      const credits = parseFloat(formData.creditsEarned);
      if (isNaN(credits) || credits <= 0) {
        const creditUnit = user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits';
        newErrors.creditsEarned = `${creditUnit} must be a positive number`;
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('💾 handleSubmit: Starting form submission...');
    
    if (!validateForm()) {
      console.log('❌ handleSubmit: Form validation failed');
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
      return;
    }

    console.log('✅ handleSubmit: Form validation passed');
    setIsLoading(true);

    try {
      const entryData = {
        title: formData.title.trim(),
        provider: formData.provider.trim(),
        dateAttended: formData.dateAttended.toISOString().split('T')[0], // YYYY-MM-DD format
        creditsEarned: parseFloat(formData.creditsEarned),
        category: formData.category,
        notes: formData.notes.trim() || undefined,
        certificatePath: formData.certificatePath,
      };

      console.log('📝 handleSubmit: Entry data prepared:', entryData);

      let success = false;

      if (isEditing) {
        console.log('🔄 handleSubmit: Updating existing entry...');
        success = await updateCMEEntry(editEntry.id, entryData);
      } else {
        console.log('➕ handleSubmit: Adding new entry...');
        success = await addCMEEntry(entryData);
      }

      console.log('📊 handleSubmit: Operation result:', success);

      if (success) {
        console.log('🎉 handleSubmit: Success! Navigating back to dashboard');
        // Navigate back to close modal - this will automatically return to whatever screen called it
        navigation.goBack();
      } else {
        console.log('💥 handleSubmit: Operation failed');
        Alert.alert(
          'Error',
          `Failed to ${isEditing ? 'update' : 'add'} CME entry. Please try again.`
        );
      }
    } catch (error) {
      console.error('💥 handleSubmit: Exception occurred:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDateChange = (selectedDate: Date) => {
    updateFormData('dateAttended', selectedDate);
  };

  return (
    <View style={styles.container}>
      <StandardHeader
        title={isEditing ? 'Edit Entry' : 'Add New Entry'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Compact Form */}
        <Card style={styles.formCard}>
          {/* Row 1: Title and Provider */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Title *</Text>
              <Input
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="Activity title"
                style={[styles.compactInput, errors.title ? styles.inputError : undefined]}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Provider *</Text>
              <Input
                value={formData.provider}
                onChangeText={(value) => updateFormData('provider', value)}
                placeholder="Organization"
                style={[styles.compactInput, errors.provider ? styles.inputError : undefined]}
              />
              {errors.provider && <Text style={styles.errorText}>{errors.provider}</Text>}
            </View>
          </View>

          {/* Row 2: Date and Credit Amount */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Date *</Text>
              <DatePicker
                value={formData.dateAttended}
                onDateChange={handleDateChange}
                maximumDate={new Date()}
                style={styles.compactDatePicker}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>{user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'} *</Text>
              <Input
                value={formData.creditsEarned}
                onChangeText={(value) => updateFormData('creditsEarned', value)}
                placeholder="2.5"
                keyboardType="numeric"
                style={[styles.compactInput, errors.creditsEarned ? styles.inputError : undefined]}
              />
              {errors.creditsEarned && <Text style={styles.errorText}>{errors.creditsEarned}</Text>}
            </View>
          </View>

          {/* Row 3: Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => updateFormData('category', value)}
                style={styles.picker}
              >
                {CME_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Row 4: Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <Input
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="Optional notes about this activity..."
              multiline={true}
              numberOfLines={2}
              style={styles.notesInput}
            />
          </View>

          {/* Row 5: Certificate (Optional) - Merged into main form */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>📄 Certificate (Optional)</Text>
            
            {formData.certificatePath ? (
              // Show certificate preview - compact
              <View style={styles.certificatePreviewCompact}>
                <Image 
                  source={{ uri: formData.certificatePath }}
                  style={styles.certificateImageCompact}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={[styles.removeCertButtonCompact, getPressedButtonStyle('remove')]}
                  onPress={handleRemoveCertificate}
                  onPressIn={() => handlePressIn('remove')}
                  onPressOut={() => handlePressOut('remove')}
                  activeOpacity={1}
                >
                  <Text style={styles.removeCertButtonTextCompact}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Show tiny upload buttons with pressing effect
              <View style={styles.certificateUploadCompact}>
                <TouchableOpacity 
                  style={[styles.uploadButtonTiny, styles.cameraButtonTiny, getPressedButtonStyle('camera')]}
                  onPress={handleTakePhoto}
                  onPressIn={() => handlePressIn('camera')}
                  onPressOut={() => handlePressOut('camera')}
                  disabled={isUploadingCertificate}
                  activeOpacity={1}
                >
                  <Text style={styles.uploadButtonIconTiny}>📷</Text>
                  <Text style={styles.uploadButtonTextTiny}>Take</Text>
                  {isUploadingCertificate && <LoadingSpinner size={10} />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButtonTiny, styles.galleryButtonTiny, getPressedButtonStyle('gallery')]}
                  onPress={handleChooseFromGallery}
                  onPressIn={() => handlePressIn('gallery')}
                  onPressOut={() => handlePressOut('gallery')}
                  disabled={isUploadingCertificate}
                  activeOpacity={1}
                >
                  <Text style={styles.uploadButtonIconTiny}>🖼️</Text>
                  <Text style={styles.uploadButtonTextTiny}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButtonTiny, styles.filesButtonTiny, getPressedButtonStyle('files')]}
                  onPress={handleChooseFiles}
                  onPressIn={() => handlePressIn('files')}
                  onPressOut={() => handlePressOut('files')}
                  disabled={isUploadingCertificate}
                  activeOpacity={1}
                >
                  <Text style={styles.uploadButtonIconTiny}>📎</Text>
                  <Text style={styles.uploadButtonTextTiny}>Files</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.cancelButton}
          />
          <Button
            title={isEditing ? 'Update' : 'Save'}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>

        {/* Compact Helper */}
        <Text style={styles.helperText}>
          * Required fields • 💡 Be specific for better tracking
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  
  content: {
    flex: 1,
    padding: theme.spacing[4],
    backgroundColor: '#FFF7EC', // Section background
  },
  
  // Compact Form
  formCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  
  // Row Layout
  row: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  
  fieldContainer: {
    marginBottom: theme.spacing[4],
  },
  fieldHalf: {
    flex: 1,
    marginBottom: 0,
  },
  
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  
  // Compact Inputs
  compactInput: {
    height: 44,
    fontSize: theme.typography.fontSize.sm,
  },
  compactDatePicker: {
    height: 44,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[3],
  },
  
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing[1],
    paddingLeft: theme.spacing[1],
  },
  
  // Category Picker
  pickerContainer: {
    backgroundColor: theme.colors.gray.light,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 50,
    justifyContent: 'center',
    overflow: 'visible',
  },
  picker: {
    minHeight: 50,
    marginVertical: 0,
  },
  
  // Button Row
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  submitButton: {
    flex: 2,
  },
  cancelButton: {
    flex: 1,
  },
  
  // Compact Helper
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },

  // Certificate Section - Compact merged into main form
  certificateUploadCompact: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    justifyContent: 'flex-start',
    marginTop: theme.spacing[1],
  },
  
  // Tiny upload buttons with pressing effect
  uploadButtonTiny: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: 5,
    minWidth: 60,
    // Button pressing effect - unpressed state (elevated)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    // Transform for pressing effect will be handled by TouchableOpacity
  },
  
  cameraButtonTiny: {
    backgroundColor: '#3b82f6',
  },
  galleryButtonTiny: {
    backgroundColor: '#10b981',
  },
  filesButtonTiny: {
    backgroundColor: '#f59e0b',
  },
  
  uploadButtonIconTiny: {
    fontSize: 14,
    marginBottom: 2,
  },
  uploadButtonTextTiny: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
    textAlign: 'center',
  },

  // Compact certificate preview
  certificatePreviewCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  certificateImageCompact: {
    width: 60,
    height: 40,
    borderRadius: 5,
    backgroundColor: theme.colors.gray.light,
  },
  removeCertButtonCompact: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderRadius: 5,
    backgroundColor: '#ef4444',
    // Button pressing effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  removeCertButtonTextCompact: {
    fontSize: 11,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Button pressed state - removes shadow and adds inset effect
  buttonPressed: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
    // Inset border effect when pressed
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    // Slight translate down for pressed feeling
    transform: [{ translateY: 2 }],
  },
});