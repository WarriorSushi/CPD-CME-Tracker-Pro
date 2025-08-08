import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { theme } from '../../constants/theme';

interface DatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  maximumDate = new Date(),
  minimumDate,
  placeholder = 'Select date',
  style,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Simple date input for web/expo
  const renderDateInput = () => (
    <TouchableOpacity
      style={[styles.dateButton, style]}
      onPress={() => setShowModal(true)}
    >
      <Text style={styles.dateButtonText}>
        {formatDate(value)}
      </Text>
      <Text style={styles.dateButtonIcon}>📅</Text>
    </TouchableOpacity>
  );

  const renderSimpleDatePicker = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <View style={styles.dateSelectors}>
              {/* Month Selector */}
              <View style={styles.selectorColumn}>
                <Text style={styles.selectorLabel}>Month</Text>
                <View style={styles.selectorButtons}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.selectorButton,
                        tempDate.getMonth() === index && styles.selectedButton
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), index, tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.selectorButtonText,
                        tempDate.getMonth() === index && styles.selectedButtonText
                      ]}>
                        {month.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day Selector */}
              <View style={styles.selectorColumn}>
                <Text style={styles.selectorLabel}>Day</Text>
                <View style={styles.selectorButtons}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.selectorButton,
                        tempDate.getDate() === day && styles.selectedButton
                      ]}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day))}
                    >
                      <Text style={[
                        styles.selectorButtonText,
                        tempDate.getDate() === day && styles.selectedButtonText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Year Selector */}
              <View style={styles.selectorColumn}>
                <Text style={styles.selectorLabel}>Year</Text>
                <View style={styles.selectorButtons}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.selectorButton,
                        tempDate.getFullYear() === year && styles.selectedButton
                      ]}
                      onPress={() => setTempDate(new Date(year, tempDate.getMonth(), tempDate.getDate()))}
                    >
                      <Text style={[
                        styles.selectorButtonText,
                        tempDate.getFullYear() === year && styles.selectedButtonText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.selectedDateText}>
              Selected: {formatDate(tempDate)}
            </Text>

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
    );
  };

  return (
    <View>
      {renderDateInput()}
      {renderSimpleDatePicker()}
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
    backgroundColor: theme.colors.gray.light,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.base,
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
    padding: theme.spacing[5],
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  
  // Date selectors
  dateSelectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  selectorColumn: {
    flex: 1,
    marginHorizontal: theme.spacing[1],
  },
  selectorLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  selectorButtons: {
    maxHeight: 150,
  },
  selectorButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing[1],
    backgroundColor: theme.colors.gray.light,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: theme.colors.primary,
  },
  selectorButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  selectedButtonText: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Selected date display
  selectedDateText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.gray.light,
    borderRadius: theme.borderRadius.md,
  },
  
  // Modal actions
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
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.medium,
  },
});