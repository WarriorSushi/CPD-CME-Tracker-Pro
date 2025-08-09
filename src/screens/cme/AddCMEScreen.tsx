import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { Button, Card, Input, LoadingSpinner, DatePicker } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { CMEStackParamList } from '../../types/navigation';
import { CME_CATEGORIES } from '../../constants';
import { CMEEntry } from '../../types';
import { getCreditUnit } from '../../utils/creditTerminology';

type AddCMEScreenNavigationProp = StackNavigationProp<CMEStackParamList, 'AddCME'>;
type AddCMEScreenRouteProp = RouteProp<CMEStackParamList, 'AddCME'>;

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
}

interface FormErrors {
  title?: string;
  provider?: string;
  creditsEarned?: string;
  category?: string;
}

export const AddCMEScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, addCMEEntry, updateCMEEntry } = useAppContext();
  
  const editEntry = route.params?.editEntry;
  const isEditing = !!editEntry;
  
  const [formData, setFormData] = useState<FormData>({
    title: editEntry?.title || '',
    provider: editEntry?.provider || '',
    dateAttended: editEntry ? new Date(editEntry.dateAttended) : new Date(),
    creditsEarned: editEntry?.creditsEarned?.toString() || '',
    category: editEntry?.category || CME_CATEGORIES[0],
    notes: editEntry?.notes || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when screen comes into focus or params change
  useEffect(() => {
    const currentEditEntry = route.params?.editEntry;
    
    console.log('🔄 AddCMEScreen: Resetting form with editEntry:', currentEditEntry);
    
    setFormData({
      title: currentEditEntry?.title || '',
      provider: currentEditEntry?.provider || '',
      dateAttended: currentEditEntry ? new Date(currentEditEntry.dateAttended) : new Date(),
      creditsEarned: currentEditEntry?.creditsEarned?.toString() || '',
      category: currentEditEntry?.category || CME_CATEGORIES[0],
      notes: currentEditEntry?.notes || '',
    });
    
    // Clear any errors when resetting
    setErrors({});
  }, [route.params?.editEntry, route.params]);

  // Additional reset when screen gets focus (ensures clean slate for new entries)
  useFocusEffect(
    useCallback(() => {
      const currentEditEntry = route.params?.editEntry;
      
      // Only reset if this is a new entry (no editEntry)
      if (!currentEditEntry) {
        console.log('🔄 AddCMEScreen: Screen focused, resetting for new entry');
        setFormData({
          title: '',
          provider: '',
          dateAttended: new Date(),
          creditsEarned: '',
          category: CME_CATEGORIES[0],
          notes: '',
        });
        setErrors({});
      }
    }, [route.params?.editEntry])
  );

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
        certificatePath: undefined, // For now, no certificate attachment in form
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
        console.log('🎉 handleSubmit: Success! Showing success alert');
        Alert.alert(
          'Success',
          `CME entry ${isEditing ? 'updated' : 'added'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
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
});