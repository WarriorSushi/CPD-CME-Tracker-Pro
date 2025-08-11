import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../constants/theme';

interface ModernDatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  style?: any;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onDateChange,
  maximumDate = new Date(new Date().setFullYear(new Date().getFullYear() + 50)),
  minimumDate = new Date(2015, 0, 1),
  style,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowModal(false);
  };

  // Generate year options
  const getYearOptions = () => {
    const minYear = minimumDate.getFullYear();
    const maxYear = maximumDate.getFullYear();
    const years = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }
    return years;
  };

  // Generate month options
  const getMonthOptions = () => {
    return [
      { label: 'January', value: 0 },
      { label: 'February', value: 1 },
      { label: 'March', value: 2 },
      { label: 'April', value: 3 },
      { label: 'May', value: 4 },
      { label: 'June', value: 5 },
      { label: 'July', value: 6 },
      { label: 'August', value: 7 },
      { label: 'September', value: 8 },
      { label: 'October', value: 9 },
      { label: 'November', value: 10 },
      { label: 'December', value: 11 },
    ];
  };

  const updateMonth = (month: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(month);
    // Adjust day if it doesn't exist in the new month
    if (newDate.getMonth() !== month) {
      newDate.setDate(0); // Set to last day of previous month
    }
    setTempDate(newDate);
  };

  const updateYear = (year: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(year);
    // Adjust for leap year
    if (newDate.getMonth() !== tempDate.getMonth()) {
      newDate.setDate(0);
    }
    setTempDate(newDate);
  };

  const updateDay = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    setTempDate(newDate);
  };

  // Generate calendar grid for current month
  const getCalendarDays = () => {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  return (
    <View>
      {/* Date Input Button */}
      <TouchableOpacity
        style={[styles.dateButton, style]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.dateButtonText}>
          {formatDate(value)}
        </Text>
        <Text style={styles.dateButtonIcon}>📅</Text>
      </TouchableOpacity>

      {/* Modern Date Picker Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            {/* Month and Year Dropdowns */}
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>Month</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempDate.getMonth()}
                    onValueChange={updateMonth}
                    style={styles.picker}
                  >
                    {getMonthOptions().map((month) => (
                      <Picker.Item
                        key={month.value}
                        label={month.label}
                        value={month.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>Year</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempDate.getFullYear()}
                    onValueChange={updateYear}
                    style={styles.picker}
                  >
                    {getYearOptions().map((year) => (
                      <Picker.Item
                        key={year}
                        label={year.toString()}
                        value={year}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Day Selection Grid */}
            <View style={styles.dayPickerContainer}>
              <Text style={styles.dropdownLabel}>Day</Text>
              
              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {getCalendarDays().map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      day === tempDate.getDate() && styles.selectedDayButton,
                      !day && styles.emptyDayButton,
                    ]}
                    onPress={() => day && updateDay(day)}
                    disabled={!day}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        day === tempDate.getDate() && styles.selectedDayText,
                        !day && styles.emptyDayText,
                      ]}
                    >
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  dateButtonIcon: {
    fontSize: 18,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[6],
    width: '90%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },

  // Dropdown styles
  dropdownContainer: {
    marginBottom: theme.spacing[4],
  },
  dropdownSection: {
    marginBottom: theme.spacing[4],
  },
  dropdownLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  picker: {
    height: 50,
  },

  // Day picker styles
  dayPickerContainer: {
    marginBottom: theme.spacing[4],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[2],
  },
  dayButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing[1],
  },
  selectedDayButton: {
    backgroundColor: theme.colors.primary,
  },
  emptyDayButton: {
    backgroundColor: 'transparent',
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  selectedDayText: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyDayText: {
    color: 'transparent',
  },

  // Action buttons
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },
});