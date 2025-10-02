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
  Modal,
  Dimensions,
} from 'react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ModernDatePicker } from '../common/ModernDatePicker';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { LicenseRenewal } from '../../types';

interface FloatingLicenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FloatingLicenseModal: React.FC<FloatingLicenseModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {

  const { addLicense } = useAppContext();
  
  // Form state
  const [licenseType, setLicenseType] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date>(new Date(new Date().setFullYear(new Date().getFullYear() + 1))); // Default to 1 year from now
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Reset form
        setLicenseType('');
        setIssuingAuthority('');
        setLicenseNumber('');
        setExpirationDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
        
        Alert.alert(
          'Success',
          'License added successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to add license. Please try again.');
      }
    } catch (error) {
      __DEV__ && console.error('Error adding license:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [licenseType, issuingAuthority, licenseNumber, expirationDate, isFormValid, addLicense, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing while submitting

    onClose();
  }, [isSubmitting, onClose]);

  if (!visible) {
    return null;
  }
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const modalWidth = Math.min(screenWidth * 0.92, 520); // Responsive width, max 520px
  const modalHeight = Math.min(screenHeight * 0.88, 700); // Back to original size, max 700px  
  const modalLeft = (screenWidth - modalWidth) / 2;
  const modalTop = (screenHeight - modalHeight) / 2;
  
  return (
    <Modal
      key={visible ? 'modal-open' : 'modal-closed'}
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={{
          width: screenWidth,
          height: screenHeight,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        }}
        activeOpacity={1}
        onPress={(e) => {
          e.preventDefault();

          handleClose();
        }}
      >
        <TouchableOpacity
          style={{
            position: 'absolute',
            left: modalLeft,
            top: modalTop,
            width: modalWidth,
            height: modalHeight,
            backgroundColor: '#FFF5EE',
            borderRadius: 16,
            padding: theme.spacing[5], // Primary card padding
            elevation: 12,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            overflow: 'hidden',
          }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.closeButtonText}>×</Text>
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
                <Text style={styles.formSubtitle}>Add your professional license for renewal tracking</Text>
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
                <Button
                  title="Cancel"
                  onPress={handleClose}
                  variant="outline"
                  style={styles.button}
                  disabled={isSubmitting}
                />
                
                <Button
                  title={isSubmitting ? 'Adding...' : 'Add License'}
                  onPress={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  variant="primary"
                  style={styles.button}
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
                <SvgIcon name="info" size={20} color={theme.colors.primary} />
                <Text style={styles.infoTitle}>Quick Setup</Text>
              </View>
              <Text style={styles.infoText}>
                Adding your license now helps you track renewal deadlines and stay compliant. 
                You can always add more licenses later from the Settings screen.
              </Text>
            </Card>

            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: '#003087',
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -20,
    marginRight: -20,
    marginTop: -20,
    marginBottom: 16, // Reduced margin
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  closeButton: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },
  closeButtonText: {
    color: theme.colors.background,
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 28,
  },
  headerTitle: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 40, // Balance the header
  },

  // Content
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: theme.spacing[2],
    padding: theme.spacing[3], // Reduced padding
  },
  formHeader: {
    marginBottom: theme.spacing[3], // More compact
  },
  formTitle: {
    fontSize: theme.typography.fontSize.lg, // Smaller title
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1], // Less margin
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Form Fields
  formFields: {
    marginBottom: theme.spacing[3], // More compact
  },
  fieldContainer: {
    marginBottom: theme.spacing[2], // Much tighter spacing between fields
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.sm, // Smaller labels
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1], // Less space between label and input
  },
  input: {
    // Input styling handled by component
  },

  // Date Button
  dateButton: {
    // Date button styling handled by ModernDatePicker
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
    marginTop: theme.spacing[2], // Less space above loading
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  loadingText: {
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Info Card - Made much smaller
  infoCard: {
    marginHorizontal: theme.spacing[2],
    marginBottom: theme.spacing[2], // Less bottom margin
    padding: theme.spacing[2], // Much smaller padding
    backgroundColor: '#FFF7EC', // Section background
    borderLeftWidth: 3, // Thinner border
    borderLeftColor: theme.colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1], // Less space below header
  },
  infoIcon: {
    fontSize: 16, // Smaller icon
    marginRight: theme.spacing[1], // Less margin
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.sm, // Smaller title
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  infoText: {
    fontSize: theme.typography.fontSize.xs, // Much smaller text
    color: theme.colors.text.secondary,
    lineHeight: 16, // Tighter line height
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 10, // Reduced bottom spacer
  },
});