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
  console.log('DEBUG: FloatingLicenseModal render, visible =', visible);
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
      console.error('Error adding license:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [licenseType, issuingAuthority, licenseNumber, expirationDate, isFormValid, addLicense, onClose, onSuccess]);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
  };

  console.log('DEBUG: About to render Modal with visible =', visible);
  
  if (!visible) {
    console.log('DEBUG: Modal not visible, returning null');
    return null;
  }
  
  console.log('DEBUG: Modal is visible, rendering...');
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const modalWidth = 300;
  const modalHeight = 400;
  const modalLeft = (screenWidth - modalWidth) / 2;
  const modalTop = (screenHeight - modalHeight) / 2;
  
  console.log('DEBUG: Screen dimensions:', screenWidth, 'x', screenHeight);
  console.log('DEBUG: Modal position:', modalLeft, ',', modalTop);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      onShow={() => console.log('DEBUG: Modal onShow triggered')}
      onDismiss={() => console.log('DEBUG: Modal onDismiss triggered')}
    >
      {console.log('DEBUG: Inside Modal component')}
      <View style={{
        width: screenWidth,
        height: screenHeight,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}>
        {console.log('DEBUG: Inside overlay View')}
        <View style={{
          position: 'absolute',
          left: modalLeft,
          top: modalTop,
          width: modalWidth,
          height: modalHeight,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          borderWidth: 5,
          borderColor: 'red',
        }}>
          {console.log('DEBUG: Inside card View')}
          {/* TEMP: Sanity check - remove after testing */}
          <View style={{height: 200, backgroundColor: 'tomato', width: '100%'}} />
          
          {/* Simple test content instead of complex form */}
          <View style={{height: 50, backgroundColor: 'blue', width: '100%', marginTop: 10}} />
          
          <TouchableOpacity 
            style={{
              height: 40,
              backgroundColor: 'green',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
            }}
            onPress={handleClose}
          >
            <Text style={{color: 'white', fontSize: 16}}>CLOSE TEST</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};