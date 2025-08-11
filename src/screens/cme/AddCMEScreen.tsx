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
import { Camera } from 'expo-camera';

import { Button, Card, Input, LoadingSpinner, DatePicker } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { CME_CATEGORIES, FILE_PATHS } from '../../constants';
import { CMEEntry } from '../../types';
import { getCreditUnit } from '../../utils/creditTerminology';
import { ThumbnailService } from '../../services/thumbnailService';

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
  const { user, addCMEEntry, updateCMEEntry } = useAppContext();
  
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
      setIsUploadingCertificate(false);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      setIsUploadingCertificate(true);
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
      try {
        await ThumbnailService.generateThumbnail(imageAsset.uri, newFileName);
      } catch (thumbnailError) {
        console.warn('⚠️ Thumbnail generation failed:', thumbnailError);
      }

      // Update form data with certificate path
      setFormData(prev => ({
        ...prev,
        certificatePath: newFilePath,
      }));

      Alert.alert('Success', 'Certificate added to CME entry!');

    } catch (error) {
      console.error('💥 Error processing certificate:', error);
      Alert.alert('Error', 'Failed to process certificate. Please try again.');
    }
  };

  const handleChooseFromVault = () => {
    // For now, just close modal and show alert to navigate manually
    // TODO: Implement proper certificate selection from vault
    navigation.goBack();
    Alert.alert(
      'Choose from Vault',
      'Please navigate to the Vault tab to select a certificate, then return to add a new entry.',
      [{ text: 'OK' }]
    );
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Entry' : 'Add New Entry'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

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
        </Card>

        {/* Certificate Section */}
        <Card style={styles.certificateCard}>
          <Text style={styles.sectionTitle}>📄 Certificate (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Attach a certificate or photo for this CME activity
          </Text>

          {formData.certificatePath ? (
            // Show certificate preview
            <View style={styles.certificatePreview}>
              <Image 
                source={{ uri: formData.certificatePath }}
                style={styles.certificateImage}
                resizeMode="cover"
              />
              <View style={styles.certificateActions}>
                <TouchableOpacity 
                  style={styles.removeCertButton}
                  onPress={handleRemoveCertificate}
                >
                  <Text style={styles.removeCertButtonText}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Show upload options
            <View style={styles.certificateUploadSection}>
              <View style={styles.uploadButtonsRow}>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.cameraButton]}
                  onPress={handleTakePhoto}
                  disabled={isUploadingCertificate}
                >
                  <Text style={styles.uploadButtonIcon}>📷</Text>
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                  {isUploadingCertificate && <LoadingSpinner size={16} />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.galleryButton]}
                  onPress={handleChooseFromGallery}
                  disabled={isUploadingCertificate}
                >
                  <Text style={styles.uploadButtonIcon}>🖼️</Text>
                  <Text style={styles.uploadButtonText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.vaultButton]}
                  onPress={handleChooseFromVault}
                  disabled={isUploadingCertificate}
                >
                  <Text style={styles.uploadButtonIcon}>📁</Text>
                  <Text style={styles.uploadButtonText}>From Vault</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  
  // Compact Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.primary,
  },
  backButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 20,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.bold,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  headerSpacer: {
    width: 32, // Same as back button for centering
  },
  
  content: {
    flex: 1,
    padding: theme.spacing[4],
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

  // Certificate Section
  certificateCard: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  certificateUploadSection: {
    alignItems: 'center',
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-around',
    width: '100%',
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[2],
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
  vaultButton: {
    backgroundColor: '#8b5cf6',
  },
  uploadButtonIcon: {
    fontSize: 20,
    marginBottom: theme.spacing[1],
  },
  uploadButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
    textAlign: 'center',
  },
  certificatePreview: {
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  certificateImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.spacing[3],
    backgroundColor: theme.colors.gray.light,
  },
  certificateActions: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  removeCertButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.spacing[2],
    backgroundColor: '#ef4444',
  },
  removeCertButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});