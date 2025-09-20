import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Button, Input, LoadingSpinner, StandardHeader } from '../../components';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../onboarding/OnboardingComponents';
import { ModernDatePicker } from '../../components/common/ModernDatePicker';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { LicenseRenewal } from '../../types';

type RootStackParamList = {
  AddLicense: { editLicense?: LicenseRenewal };
  Settings: undefined;
};

type AddLicenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddLicense'>;
type AddLicenseScreenRouteProp = RouteProp<RootStackParamList, 'AddLicense'>;

interface Props {
  navigation: AddLicenseScreenNavigationProp;
  route: AddLicenseScreenRouteProp;
}

export const AddLicenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { addLicense, updateLicense } = useAppContext();
  const editLicense = route.params?.editLicense;
  const isEditing = !!editLicense;
  
  // Form state - initialized with edit data if editing
  const [licenseType, setLicenseType] = useState(editLicense?.licenseType || '');
  const [issuingAuthority, setIssuingAuthority] = useState(editLicense?.issuingAuthority || '');
  const [licenseNumber, setLicenseNumber] = useState(editLicense?.licenseNumber || '');
  const [expirationDate, setExpirationDate] = useState<Date>(
    editLicense ? new Date(editLicense.expirationDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Premium animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formCardAnim = useRef(new Animated.Value(0)).current;
  const infoCardAnim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations (to prevent gray flash)
  const formShadowAnim = useRef(new Animated.Value(0)).current;
  const infoShadowAnim = useRef(new Animated.Value(0)).current;

  // Premium entrance animations
  useFocusEffect(
    useCallback(() => {
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

      // Staggered content animations
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(formCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(infoCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Add shadows after animations finish
        setTimeout(() => {
          formShadowAnim.setValue(1);
          infoShadowAnim.setValue(1);
        }, 100);
      });
    }, [])
  );

  // Update form when editLicense changes (shouldn't happen but good practice)
  useEffect(() => {
    if (editLicense) {
      setLicenseType(editLicense.licenseType);
      setIssuingAuthority(editLicense.issuingAuthority);
      setLicenseNumber(editLicense.licenseNumber || '');
      setExpirationDate(new Date(editLicense.expirationDate));
    }
  }, [editLicense]);

  // Form validation
  const isFormValid = licenseType.trim() !== '' && 
                     issuingAuthority.trim() !== '' && 
                     expirationDate instanceof Date;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editLicense) {
        // Update existing license
        const updateData: Partial<LicenseRenewal> = {
          licenseType: licenseType.trim(),
          issuingAuthority: issuingAuthority.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          expirationDate: expirationDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        };

        const success = await updateLicense(editLicense.id, updateData);

        if (success) {
          Alert.alert(
            'Success',
            'License updated successfully!',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to update license. Please try again.');
        }
      } else {
        // Add new license
        const licenseData: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'> = {
          licenseType: licenseType.trim(),
          issuingAuthority: issuingAuthority.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          expirationDate: expirationDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
          renewalDate: undefined,
          requiredCredits: 0, // Default to 0, can be edited later
          completedCredits: 0,
          status: 'active',
        };

        const success = await addLicense(licenseData);

        if (success) {
          Alert.alert(
            'Success',
            'License added successfully!',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to add license. Please try again.');
        }
      }
    } catch (error) {
      __DEV__ && console.error(`Error ${isEditing ? 'updating' : 'adding'} license:`, error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [licenseType, issuingAuthority, licenseNumber, expirationDate, isFormValid, isEditing, editLicense, addLicense, updateLicense, navigation]);

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      
      <StandardHeader
        title={isEditing ? 'Edit License' : 'Add License'}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
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
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                elevation: formShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                shadowOpacity: formShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
              }
            ]}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>License Information</Text>
            <Text style={styles.formSubtitle}>
              {isEditing ? 'Update your license information and renewal dates' : 'Add your professional license details for renewal tracking'}
            </Text>
          </View>

          <View style={styles.formFields}>
            {/* License Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>License Type *</Text>
              <Input
                value={licenseType}
                onChangeText={setLicenseType}
                placeholder="e.g., Medical License, RN License, PharmD"
                autoExpand={true}
                minLines={1}
                maxLines={2}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Issuing Authority */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Issuing Authority *</Text>
              <Input
                value={issuingAuthority}
                onChangeText={setIssuingAuthority}
                placeholder="e.g., State Medical Board, College of Physicians"
                autoExpand={true}
                minLines={1}
                maxLines={3}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* License Number (Optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>License Number (Optional)</Text>
              <Input
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter license number if available"
                autoExpand={true}
                minLines={1}
                maxLines={2}
                style={styles.input}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>

            {/* Expiration Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Expiration Date *</Text>
              <ModernDatePicker
                value={expirationDate}
                onDateChange={setExpirationDate}
                minimumDate={new Date()} // Can't expire in the past
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 50))} // Allow up to 50 years in future
                style={styles.dateButton}
              />
            </View>
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <PremiumButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.button}
            />
            
            <PremiumButton
              title={isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update License' : 'Add License')}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              variant="primary"
              style={styles.button}
              loading={isSubmitting}
            />
          </View>

          {isSubmitting && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={20} />
              <Text style={styles.loadingText}>{isEditing ? 'Updating license...' : 'Adding license...'}</Text>
            </View>
          )}
            </PremiumCard>
          </Animated.View>

          {/* Info Card */}
          <Animated.View 
            style={[
              {
                opacity: infoCardAnim,
                transform: [{
                  translateY: infoCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.infoCard,
              {
                elevation: infoShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: infoShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoTitle}>License Tracking</Text>
          </View>
          <Text style={styles.infoText}>
            We'll use this information to help you track renewal deadlines and requirements. 
            You can always edit or delete licenses later from the Settings screen.
          </Text>
            </PremiumCard>
          </Animated.View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let AnimatedGradientBackground show through
  },
  content: {
    flex: 1,
  },

  // Header styles removed - using StandardHeader

  // Content
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  formHeader: {
    marginBottom: theme.spacing[6],
  },
  formTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Form Fields
  formFields: {
    marginBottom: theme.spacing[6],
  },
  fieldContainer: {
    marginBottom: theme.spacing[5],
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    // Input styling handled by component
  },

  // Date Picker Button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.spacing[2],
    backgroundColor: theme.colors.background,
    minHeight: 48,
  },
  dateButtonEmpty: {
    borderColor: theme.colors.border.light,
    backgroundColor: '#FFF5EE',
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  dateButtonTextEmpty: {
    color: theme.colors.text.secondary,
  },
  dateButtonIcon: {
    fontSize: 18,
    marginLeft: theme.spacing[2],
  },

  // Form Actions
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  button: {
    flex: 1,
    minHeight: 48,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  loadingText: {
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Info Card
  infoCard: {
    marginHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  infoIcon: {
    fontSize: 20,
    marginRight: theme.spacing[2],
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});