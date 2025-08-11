import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Button, Input, LoadingSpinner } from '../../components';
import { ModernDatePicker } from '../../components/common/ModernDatePicker';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { LicenseRenewal } from '../../types';

type RootStackParamList = {
  AddLicense: undefined;
  Settings: undefined;
};

type AddLicenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddLicense'>;
type AddLicenseScreenRouteProp = RouteProp<RootStackParamList, 'AddLicense'>;

interface Props {
  navigation: AddLicenseScreenNavigationProp;
  route: AddLicenseScreenRouteProp;
}

export const AddLicenseScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addLicense } = useAppContext();
  
  // Form state
  const [licenseType, setLicenseType] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isFormValid = licenseType.trim() !== '' && 
                     issuingAuthority.trim() !== '' && 
                     expirationDate !== null;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const licenseData: Omit<LicenseRenewal, 'id' | 'createdAt' | 'updatedAt'> = {
        licenseType: licenseType.trim(),
        issuingAuthority: issuingAuthority.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        expirationDate: expirationDate!.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        renewalDate: null,
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
              onPress: () => navigation.navigate('Settings'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to add license. Please try again.');
      }
    } catch (error) {
      console.error('Error adding license:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [licenseType, issuingAuthority, licenseNumber, expirationDate, isFormValid, addLicense, navigation]);

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return 'Select expiration date *';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add License</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>License Information</Text>
            <Text style={styles.formSubtitle}>Add your professional license details for renewal tracking</Text>
          </View>

          <View style={styles.formFields}>
            {/* License Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>License Type *</Text>
              <Input
                value={licenseType}
                onChangeText={setLicenseType}
                placeholder="e.g., Medical License, RN License, PharmD"
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
                style={styles.input}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>

            {/* Expiration Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Expiration Date *</Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  !expirationDate && styles.dateButtonEmpty
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[
                  styles.dateButtonText,
                  !expirationDate && styles.dateButtonTextEmpty
                ]}>
                  {formatDateDisplay(expirationDate)}
                </Text>
                <Text style={styles.dateButtonIcon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            
            <Button
              title={isSubmitting ? 'Adding...' : 'Add License'}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              style={[styles.button, styles.submitButton]}
              textStyle={styles.submitButtonText}
            />
          </View>

          {isSubmitting && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size={20} />
              <Text style={styles.loadingText}>Adding license...</Text>
            </View>
          )}
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoTitle}>License Tracking</Text>
          </View>
          <Text style={styles.infoText}>
            We'll use this information to help you track renewal deadlines and requirements. 
            You can always edit or delete licenses later from the Settings screen.
          </Text>
        </Card>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Date Picker Modal */}
      <ModernDatePicker
        visible={showDatePicker}
        date={expirationDate || new Date()}
        onConfirm={(selectedDate) => {
          setExpirationDate(selectedDate);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()} // Can't expire in the past
        title="Select Expiration Date"
        subtitle="Choose when this license expires"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Header
  header: {
    backgroundColor: '#003087',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: theme.spacing[2],
    paddingRight: theme.spacing[2],
  },
  backButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  headerTitle: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 60, // Balance the header
  },

  // Content
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: theme.spacing[4],
    padding: theme.spacing[4],
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
    backgroundColor: '#f8f9fa',
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
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonText: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
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
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
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