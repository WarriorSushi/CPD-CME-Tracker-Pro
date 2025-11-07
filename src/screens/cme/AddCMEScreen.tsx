import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Image,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';

import { Button, Card, Input, LoadingSpinner, DatePicker, StandardHeader, SvgIcon } from '../../components';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { MainTabParamList } from '../../types/navigation';
import { CME_CATEGORIES, FILE_PATHS, SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from '../../constants';
import { CMEEntry } from '../../types';
import { getCreditUnit } from '../../utils/creditTerminology';
import { ThumbnailService } from '../../services/thumbnailService';
import { databaseOperations } from '../../services/database';
import { HapticsUtils } from '../../utils/HapticsUtils';
import { useSound } from '../../hooks/useSound';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

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

  const insets = useSafeAreaInsets();
  const { user, addCMEEntry, updateCMEEntry, refreshCertificates } = useAppContext();
  const { playFormSubmit, playSuccess, playError, playEntryAdd } = useSound();
  
  const editEntry = route.params?.editEntry;
  const ocrData = route.params?.ocrData;
  const isEditing = !!editEntry;

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
    creditsEarned: editEntry?.creditsEarned?.toString() || ocrData?.credits?.toString() || '',
    category: editEntry?.category || ocrData?.category || CME_CATEGORIES[0],
    notes: editEntry?.notes || '',
    certificatePath: editEntry?.certificatePath || ocrData?.certificatePath || undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);

  // Track if form has unsaved changes
  const initialFormData = useRef<FormData>(formData);
  const [wasSaved, setWasSaved] = useState(false);
  const hasUnsavedChanges = !wasSaved && JSON.stringify(formData) !== JSON.stringify(initialFormData.current);

  // Warn user about unsaved changes
  useUnsavedChanges({
    hasChanges: hasUnsavedChanges && !isLoading,
    title: isEditing ? 'Unsaved Edits' : 'Discard Entry?',
    message: isEditing
      ? 'You have unsaved edits. Are you sure you want to leave?'
      : 'You have not saved this entry. Are you sure you want to discard it?',
  });

  // Premium animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formCardAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations (to prevent gray flash)
  const formShadowAnim = useRef(new Animated.Value(0)).current;
  
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

    setFormData({
      title: currentEditEntry?.title || currentOcrData?.title || '',
      provider: currentEditEntry?.provider || currentOcrData?.provider || '',
      dateAttended: currentEditEntry
        ? new Date(currentEditEntry.dateAttended)
        : parseOCRDate(currentOcrData?.date),
      creditsEarned: currentEditEntry?.creditsEarned?.toString() || currentOcrData?.credits?.toString() || '',
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

      }
      
      // Premium entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered form animations
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(formCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(actionsAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Add shadow after form finishes animating (using setValue to avoid conflicts)
        setTimeout(() => {
          formShadowAnim.setValue(1);
        }, 100);
      });
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
      __DEV__ && console.error('Camera error:', error);
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
      __DEV__ && console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo gallery. Please try again.');
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const processCertificateImage = async (imageAsset: any) => {
    try {

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
        const thumbnailResult = await ThumbnailService.generateThumbnail(imageAsset.uri, newFileName);
        thumbnailPath = thumbnailResult.thumbnailUri;
      } catch (thumbnailError) {
        console.warn('[WARN] Thumbnail generation failed:', thumbnailError);
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
          cmeEntryId: undefined, // Will be set after CME entry is created
        };

        const addResult = await databaseOperations.certificates.addCertificate(certificateData);
        if (addResult.success) {

          // Refresh certificates in AppContext so vault shows the new certificate
          await refreshCertificates();

          // Update form data with certificate path
          const updatedFormData = {
            ...formData,
            certificatePath: newFilePath,
          };
          setFormData(updatedFormData);

          // Update initialFormData ONLY after database success
          // Certificate is already saved to vault, so this is the new baseline
          initialFormData.current = updatedFormData;
        } else {
          console.warn('[WARN] Failed to add certificate to vault:', addResult.error);
        }
      } catch (certError) {
      __DEV__ && console.error('[ERROR] Error adding certificate to vault:', certError);
      }

      Alert.alert('Success', 'Certificate added to entry and saved to vault!');

    } catch (error) {
      __DEV__ && console.error('[ERROR] Error processing certificate:', error);
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
      __DEV__ && console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to open file picker. Please try again.');
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const processDocument = async (file: any) => {
    try {

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
          const thumbnailResult = await ThumbnailService.generateThumbnail(file.uri, newFileName);
          thumbnailPath = thumbnailResult.thumbnailUri;

        } else {
          // For documents, we'll just use document name and icon - no thumbnail needed

        }
      } catch (thumbnailError) {
        console.warn('[WARN] Thumbnail generation failed:', thumbnailError);
      }

      // Automatically add certificate to vault
      try {
        const certificateData = {
          filePath: newFilePath,
          fileName: newFileName,
          fileSize: file.size || 0,
          mimeType: file.mimeType || 'application/pdf',
          thumbnailPath: thumbnailPath,
          cmeEntryId: undefined, // Will be set after CME entry is created
        };

        const addResult = await databaseOperations.certificates.addCertificate(certificateData);
        if (addResult.success) {

          // Refresh certificates in AppContext so vault shows the new certificate
          await refreshCertificates();

          // Update form data with certificate path
          const updatedFormData = {
            ...formData,
            certificatePath: newFilePath,
          };
          setFormData(updatedFormData);

          // Update initialFormData ONLY after database success
          initialFormData.current = updatedFormData;
        } else {
          console.warn('[WARN] Failed to add document to vault:', addResult.error);
        }
      } catch (certError) {
      __DEV__ && console.error('[ERROR] Error adding document to vault:', certError);
      }

      Alert.alert('Success', 'Document added to entry and saved to vault!');

    } catch (error) {
      __DEV__ && console.error('[ERROR] Error processing document:', error);
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
          onPress: async () => {
            const certPath = formData.certificatePath;

            // Delete from filesystem and database
            if (certPath) {
              try {
                // Delete physical file
                await FileSystem.deleteAsync(certPath, { idempotent: true });

                // Find and delete from certificates table
                const certificates = await databaseOperations.certificates.getAllCertificates();
                const cert = certificates.data?.find(c => c.filePath === certPath);
                if (cert) {
                  await databaseOperations.certificates.deleteCertificate(cert.id);
                  // Refresh certificates in context
                  await refreshCertificates();
                }
              } catch (error) {
                __DEV__ && console.error('[ERROR] Error deleting certificate:', error);
                // Continue anyway - worst case is orphaned file
              }
            }

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
      const creditUnit = user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits';

      if (isNaN(credits) || !isFinite(credits) || credits <= 0) {
        newErrors.creditsEarned = `${creditUnit} must be a valid positive number`;
      } else if (credits > 500) {
        newErrors.creditsEarned = `${creditUnit} cannot exceed 500`;
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Prevent double submission - critical for preventing race conditions
    if (isLoading) {
      __DEV__ && console.warn('[WARN] handleSubmit: Already processing, ignoring duplicate call');
      return;
    }

    if (!validateForm()) {
      // Play error sound for validation failure
      await playError();
      HapticsUtils.error();
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
      return;
    }

    // Play form submit sound when starting submission
    await playFormSubmit();

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

      let success = false;

      if (isEditing) {

        success = await updateCMEEntry(editEntry.id, entryData);
      } else {

        success = await addCMEEntry(entryData);
      }

      if (success) {
        // Play success sound and entry add sound for positive feedback
        await playSuccess();
        if (!isEditing) {
          await playEntryAdd(); // Special sound for new entries
        }
        HapticsUtils.success();

        // Mark as saved to prevent unsaved changes warning
        setWasSaved(true);

        // Show success confirmation - safely handle empty title
        const entryTitle = formData.title?.trim() || 'Entry';
        Alert.alert(
          isEditing ? 'Entry Updated' : 'Entry Added',
          isEditing
            ? `${entryTitle} has been updated successfully.`
            : `${entryTitle} has been added successfully.`,
          [{
            text: 'OK',
            onPress: () => navigation.goBack()
          }]
        );
      } else {
        // Play error sound for operation failure
        await playError();
        HapticsUtils.error();
        Alert.alert(
          'Error',
          `Failed to ${isEditing ? 'update' : 'add'} CME entry. Please try again.`
        );
      }
    } catch (error) {
      // Play error sound for exceptions
      await playError();
      __DEV__ && console.error('[ERROR] handleSubmit: Exception occurred:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation feedback
    const newErrors: Partial<FormErrors> = {};
    
    switch (field) {
      case 'title':
        if (!value?.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        }
        break;
      case 'provider':
        if (!value?.trim()) {
          newErrors.provider = 'Provider is required';
        }
        break;
      case 'creditsEarned':
        const credits = parseFloat(value);
        if (isNaN(credits) || credits <= 0) {
          newErrors.creditsEarned = 'Credits must be a positive number';
        } else if (credits > 500) {
          newErrors.creditsEarned = 'Credits cannot exceed 500';
        } else if (credits > 100) {
          newErrors.creditsEarned = 'Credits seem unusually high. Please verify.';
        }
        break;
      case 'category':
        if (!value?.trim()) {
          newErrors.category = 'Category is required';
        }
        break;
    }
    
    // Update errors - clear field error if valid, set if invalid
    setErrors(prev => ({ 
      ...prev, 
      [field]: newErrors[field as keyof FormErrors] 
    }));
    
    // Add haptic feedback for validation errors
    if (newErrors[field as keyof FormErrors]) {
      HapticsUtils.warning();
    }
  };

  const handleDateChange = (selectedDate: Date) => {
    updateFormData('dateAttended', selectedDate);
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      
      <StandardHeader
        title={isEditing ? 'Edit Entry' : 'Add New Entry'}
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Premium Form Card */}
          <Animated.View 
            style={[
              {
                opacity: formCardAnim,
                transform: [{
                  translateY: formCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.formCard,
              {
                                shadowOpacity: Number(formShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] })),
              }
            ]}>
          {/* Row 1: Title and Provider */}
          <View style={styles.row}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Title *</Text>
              <Input
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="Activity title"
                autoExpand={true}
                minLines={1}
                maxLines={3}
                error={errors.title}
                style={styles.compactInput}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Provider *</Text>
              <Input
                value={formData.provider}
                onChangeText={(value) => updateFormData('provider', value)}
                placeholder="Organization"
                autoExpand={true}
                minLines={1}
                maxLines={3}
                error={errors.provider}
                style={styles.compactInput}
              />
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
                error={errors.creditsEarned}
                style={styles.compactInput}
              />
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
              autoExpand={true}
              minLines={2}
              maxLines={6}
              style={styles.notesInput}
            />
          </View>

          {/* Row 5: Certificate (Optional) - Merged into main form */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Certificate (Optional)</Text>
            
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
                  <View style={styles.removeCertButtonContent}>
                    <SvgIcon name="trash" size={14} color={theme.colors.error} />
                    <Text style={styles.removeCertButtonTextCompact}>Remove</Text>
                  </View>
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
                  <SvgIcon name="camera" size={16} color={theme.colors.primary} />
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
                  <SvgIcon name="gallery" size={16} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonTextTiny}>{isUploadingCertificate ? 'Loading...' : 'Gallery'}</Text>
                  {isUploadingCertificate && <LoadingSpinner size={10} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.uploadButtonTiny, styles.filesButtonTiny, getPressedButtonStyle('files')]}
                  onPress={handleChooseFiles}
                  onPressIn={() => handlePressIn('files')}
                  onPressOut={() => handlePressOut('files')}
                  disabled={isUploadingCertificate}
                  activeOpacity={1}
                >
                  <SvgIcon name="document" size={16} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonTextTiny}>{isUploadingCertificate ? 'Loading...' : 'Files'}</Text>
                  {isUploadingCertificate && <LoadingSpinner size={10} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
            </PremiumCard>
          </Animated.View>

          {/* Premium Action Buttons */}
          <Animated.View 
            style={[
              styles.buttonRow,
              {
                opacity: actionsAnim,
                transform: [{
                  translateY: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumButton
              title="Cancel"
              variant="secondary"
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.cancelButton}
            />
            <PremiumButton
              title={isEditing ? 'Update' : 'Save'}
              variant="primary"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />
          </Animated.View>

          {/* Compact Helper */}
          <Animated.View
            style={[
              styles.helperTextContainer,
              {
                opacity: actionsAnim,
              },
            ]}
          >
            <Text style={styles.helperText}>* Required fields</Text>
            <View style={styles.helperTip}>
              <SvgIcon name="info" size={14} color={theme.colors.text.secondary} />
              <Text style={styles.helperText}>Be specific for better tracking</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
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
  },
  
  // Premium Form Card
  formCard: {
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, // 12px for premium cards
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
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
    // Auto-expanding Input will handle height automatically
    textAlignVertical: 'top',
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
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  helperTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
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
    borderRadius: theme.borderRadius.base,
    minWidth: 70,
    minHeight: 44, // Accessibility: minimum touch target size
    // Button pressing effect - unpressed state (elevated)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    // Transform for pressing effect will be handled by TouchableOpacity
  },
  
  cameraButtonTiny: {
    backgroundColor: theme.colors.blue,
  },
  galleryButtonTiny: {
    backgroundColor: theme.colors.emerald,
  },
  filesButtonTiny: {
    backgroundColor: theme.colors.orange,
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
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.gray.light,
  },
  removeCertButtonCompact: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.error,
    // Button pressing effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  removeCertButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    borderColor: theme.colors.border.light,
    // Slight translate down for pressed feeling
    transform: [{ translateY: 2 }],
  },
});
