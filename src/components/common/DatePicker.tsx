import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface DatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
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
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

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
    setCurrentMonth(value.getMonth());
    setCurrentYear(value.getFullYear());
    setShowModal(false);
  };

  // Simple date input button
  const renderDateInput = () => (
    <TouchableOpacity
      style={[styles.dateButton, style]}
      onPress={() => {
        setTempDate(value);
        setCurrentMonth(value.getMonth());
        setCurrentYear(value.getFullYear());
        setShowModal(true);
      }}
    >
      <Text style={styles.dateButtonText}>
        {formatDate(value)}
      </Text>
      <Text style={styles.dateButtonIcon}>📅</Text>
    </TouchableOpacity>
  );

  // Get calendar grid data
  const getCalendarData = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    // Create array of all days to show (including padding from previous/next month)
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return {
      monthName: monthNames[currentMonth],
      year: currentYear,
      dayNames,
      days,
      daysInMonth
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    
    // Check if date is within allowed range
    if (maximumDate && newDate > maximumDate) return;
    if (minimumDate && newDate < minimumDate) return;
    
    setTempDate(newDate);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (maximumDate && date > maximumDate) return true;
    if (minimumDate && date < minimumDate) return true;
    return false;
  };

  const isSelectedDate = (day: number) => {
    return (
      tempDate.getDate() === day &&
      tempDate.getMonth() === currentMonth &&
      tempDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const renderCompactCalendar = () => {
    const { monthName, year, dayNames, days } = getCalendarData();

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={() => navigateMonth('prev')}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              
              <View style={styles.monthYearContainer}>
                <Text style={styles.monthText}>{monthName}</Text>
                <Text style={styles.yearText}>{year}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={() => navigateMonth('next')}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day names header */}
            <View style={styles.dayNamesRow}>
              {dayNames.map((dayName) => (
                <View key={dayName} style={styles.dayNameCell}>
                  <Text style={styles.dayNameText}>{dayName}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const disabled = isDateDisabled(day);
                const selected = isSelectedDate(day);
                const today = isToday(day);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      selected && styles.selectedDayCell,
                      today && !selected && styles.todayDayCell,
                      disabled && styles.disabledDayCell,
                    ]}
                    onPress={() => !disabled && selectDate(day)}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.dayText,
                      selected && styles.selectedDayText,
                      today && !selected && styles.todayDayText,
                      disabled && styles.disabledDayText,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected date display */}
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>Selected:</Text>
              <Text style={styles.selectedDateValue}>{formatDate(tempDate)}</Text>
            </View>

            {/* Action buttons */}
            <View style={styles.calendarActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
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
      {renderCompactCalendar()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Date input button
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
  
  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  
  // Calendar modal container
  calendarModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Calendar header with navigation
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.gray.light,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  yearText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  
  // Day names header
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing[2],
    paddingBottom: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[1],
  },
  dayNameText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  
  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing[4],
  },
  dayCell: {
    width: '14.28%', // 7 days per week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Day cell states
  selectedDayCell: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.bold,
  },
  todayDayCell: {
    backgroundColor: theme.colors.gray.light,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  todayDayText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  disabledDayCell: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: theme.colors.text.secondary,
  },
  
  // Selected date display
  selectedDateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.gray.light,
    borderRadius: theme.borderRadius.md,
  },
  selectedDateLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
  },
  selectedDateValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  
  // Action buttons
  calendarActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.bold,
  },
});