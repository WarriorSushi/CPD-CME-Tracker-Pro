import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, DatePicker, ProgressIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { userOperations } from '../../services/database';

type CycleStartDateScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CycleStartDate'>;

interface Props {
  navigation: CycleStartDateScreenNavigationProp;
}

const QUICK_OPTIONS = [
  { label: 'Starting today', months: 0 },
  { label: 'About 6 months ago', months: -6 },
  { label: 'About 1 year ago', months: -12 },
  { label: 'About 1.5 years ago', months: -18 },
  { label: 'About 2 years ago', months: -24 },
];

export const CycleStartDateScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [askAboutLicenseSync, setAskAboutLicenseSync] = useState(false);
  const [licenseSyncSelected, setLicenseSyncSelected] = useState<boolean | null>(null);

  const handleQuickSelect = (monthsAgo: number, index: number) => {
    const cycleStartDate = new Date();
    cycleStartDate.setMonth(cycleStartDate.getMonth() + monthsAgo);
    
    setSelectedOption(index);
    setCustomDate(cycleStartDate);
    
    // If they selected anything other than "starting today", ask about license sync
    if (monthsAgo !== 0) {
      setAskAboutLicenseSync(true);
    } else {
      setAskAboutLicenseSync(false);
    }
  };

  const handleCustomDate = () => {
    setSelectedOption(-1);
    setAskAboutLicenseSync(true);
    // Initialize with a reasonable default if not set
    if (!customDate) {
      setCustomDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    }
  };

  const handleDatePickerChange = (selectedDate: Date) => {
    setCustomDate(selectedDate);
    setAskAboutLicenseSync(true);
  };

  const handleContinue = async () => {
    if (selectedOption !== null || customDate) {
      const selectedDate = getSelectedDate();
      if (!selectedDate) return;
      
      console.log('💾 CycleStartDateScreen: Saving cycle dates...');
      
      try {
        // Get user's requirement period to calculate end date
        const userResult = await userOperations.getCurrentUser();
        const requirementPeriod = userResult.data?.requirementPeriod || 1;
        
        // Calculate cycle end date
        const cycleEndDate = new Date(selectedDate);
        cycleEndDate.setFullYear(selectedDate.getFullYear() + requirementPeriod);
        
        console.log('📅 CycleStartDateScreen: Cycle dates calculated:', {
          startDate: selectedDate.toISOString().split('T')[0],
          endDate: cycleEndDate.toISOString().split('T')[0],
          period: requirementPeriod
        });
        
        // Save cycle dates to database
        const result = await userOperations.updateUser({
          cycleStartDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
          cycleEndDate: cycleEndDate.toISOString().split('T')[0]
        });
        
        console.log('📊 CycleStartDateScreen: Save result:', result);
        
        if (result.success) {
          console.log('✅ CycleStartDateScreen: Successfully saved cycle dates, navigating...');
          navigation.navigate('LicenseSetup', {
            cycleStartDate: selectedDate?.toISOString(),
            syncWithLicense: licenseSyncSelected === true,
          });
        } else {
          console.error('❌ CycleStartDateScreen: Failed to save cycle dates');
        }
      } catch (error) {
        console.error('💥 CycleStartDateScreen: Error saving cycle dates:', error);
      }
    }
  };

  const handleLicenseSyncYes = () => {
    setLicenseSyncSelected(true);
  };

  const handleLicenseSyncNo = () => {
    setLicenseSyncSelected(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getSelectedDate = () => {
    if (selectedOption !== null && selectedOption >= 0) {
      const option = QUICK_OPTIONS[selectedOption];
      const date = new Date();
      date.setMonth(date.getMonth() + option.months);
      return date;
    }
    return customDate;
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isValid = selectedOption !== null || customDate !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressIndicator currentStep={4} totalSteps={5} />
        
        <View style={styles.header}>
          <Text style={styles.title}>When did your cycle start?</Text>
          <Text style={styles.subtitle}>
            Rough dates are fine! This helps show accurate progress.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Choose the closest option:</Text>
          
          {QUICK_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                selectedOption === index && styles.selectedCard,
              ]}
              onPress={() => handleQuickSelect(option.months, index)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  selectedOption === index && styles.selectedText,
                ]}>
                  {option.label}
                </Text>
                {option.months !== 0 && (
                  <Text style={[
                    styles.optionDate,
                    selectedOption === index && styles.selectedDateText,
                  ]}>
                    {(() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + option.months);
                      return `(${formatDateForDisplay(date)})`;
                    })()}
                  </Text>
                )}
              </View>
              <View style={[
                styles.radioButton,
                selectedOption === index && styles.radioSelected,
              ]} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === -1 && styles.selectedCard,
            ]}
            onPress={handleCustomDate}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionText,
                selectedOption === -1 && styles.selectedText,
              ]}>
                Pick a different date
              </Text>
              <Text style={styles.optionSubtext}>
                {customDate ? formatDateForDisplay(customDate) : 'Select any month and year'}
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedOption === -1 && styles.radioSelected,
            ]} />
          </TouchableOpacity>
        </View>

        {/* Custom Date Picker */}
        {selectedOption === -1 && (
          <View style={styles.datePickerContainer}>
            <DatePicker
              value={customDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              onDateChange={handleDatePickerChange}
              maximumDate={new Date()}
              minimumDate={new Date(2015, 0, 1)}
              style={styles.customDatePicker}
            />
          </View>
        )}

        {/* License Sync Option */}
        {askAboutLicenseSync && isValid && (
          <View style={styles.syncCard}>
            <View style={styles.syncContent}>
              <Text style={styles.syncIcon}>🔔</Text>
              <Text style={styles.syncTitle}>License renewal reminder calculation with same dates?</Text>
            </View>
            <View style={styles.syncButtons}>
              <TouchableOpacity 
                style={[
                  styles.syncButtonYes,
                  licenseSyncSelected === true && styles.syncButtonYesSelected,
                ]}
                onPress={handleLicenseSyncYes}
              >
                <Text style={[
                  styles.syncButtonYesText,
                  licenseSyncSelected === true && styles.syncButtonYesTextSelected,
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.syncButtonNo,
                  licenseSyncSelected === false && styles.syncButtonNoSelected,
                ]}
                onPress={handleLicenseSyncNo}
              >
                <Text style={[
                  styles.syncButtonNoText,
                  licenseSyncSelected === false && styles.syncButtonNoTextSelected,
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.reassurance}>
          <Text style={styles.reassuranceText}>
            💡 You can adjust this later in Settings
          </Text>
        </View>
      </ScrollView>
      
      <View style={[styles.actions, { paddingBottom: insets.bottom }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
          disabled={!isValid}
        />
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  optionsContainer: {
    marginBottom: theme.spacing[2],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[2],
    marginBottom: theme.spacing[1],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  selectedText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  optionDate: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  selectedDateText: {
    color: theme.colors.text.secondary,
  },
  optionSubtext: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginLeft: theme.spacing[2],
  },
  radioSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  datePickerContainer: {
    marginTop: theme.spacing[1],
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[1],
  },
  customDatePicker: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  syncCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.success,
    borderWidth: 2,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  syncIcon: {
    fontSize: 18,
    marginRight: theme.spacing[2],
  },
  syncTitle: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  syncButtons: {
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  syncButtonYes: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  syncButtonYesText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#000000',
  },
  syncButtonYesSelected: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  syncButtonYesTextSelected: {
    color: '#ffffff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  syncButtonNo: {
    flex: 1,
    paddingVertical: theme.spacing[2],
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  syncButtonNoText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#000000',
  },
  syncButtonNoSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderWidth: 1,
  },
  syncButtonNoTextSelected: {
    color: '#ffffff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  reassurance: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  reassuranceText: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    lineHeight: 11,
    textAlign: 'center',
  },
  actions: {
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  primaryButton: {
    marginBottom: theme.spacing[1],
  },
});