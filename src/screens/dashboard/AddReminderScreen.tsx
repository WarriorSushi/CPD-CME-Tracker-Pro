import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StandardHeader } from '../../components/common/StandardHeader';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { ModernDatePicker } from '../../components/common/ModernDatePicker';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { CMEEventReminder } from '../../types';

type RootStackParamList = {
  AddReminder: undefined;
  Dashboard: undefined;
};

type AddReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddReminder'>;
type AddReminderScreenRouteProp = RouteProp<RootStackParamList, 'AddReminder'>;

interface Props {
  navigation: AddReminderScreenNavigationProp;
  route: AddReminderScreenRouteProp;
}

export const AddReminderScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addEventReminder } = useAppContext();
  
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState<Date>(
    new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week from now
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

  const isFormValid = eventName.trim() !== '' && eventDate instanceof Date;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reminderData: Omit<CMEEventReminder, 'id' | 'createdAt' | 'updatedAt'> = {
        eventName: eventName.trim(),
        eventDate: eventDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
      };

      const success = await addEventReminder(reminderData);

      if (success) {
        Alert.alert(
          'Success',
          'Event reminder added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to add event reminder. Please try again.');
      }
    } catch (error) {
      __DEV__ && console.error('Error adding reminder:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      
      <StandardHeader
        title="Add Event Reminder"
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
            <Text style={styles.formTitle}>Event Details</Text>
            <Text style={styles.formSubtitle}>
              Add a reminder for an upcoming CME event, conference, or workshop
            </Text>
          </View>

          <View style={styles.formFields}>
            {/* Event Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Event Name *</Text>
              <Input
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g., Annual Cardiology Conference, CME Workshop"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Event Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Event Date *</Text>
              <ModernDatePicker
                value={eventDate}
                onDateChange={setEventDate}
                minimumDate={new Date()} // Can't set reminders for past events
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5))} // Allow up to 5 years in future
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
              title={isSubmitting ? 'Adding...' : 'Add Reminder'}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              variant="primary"
              style={styles.button}
              loading={isSubmitting}
            />
          </View>
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
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoTitle}>Event Reminders</Text>
          </View>
          <Text style={styles.infoText}>
            Set reminders for important CME events, conferences, and workshops. 
            You can track all your upcoming learning opportunities in one place.
          </Text>
          <Text style={styles.infoNote}>
            Note: Push notifications for reminders will be available in a future update.
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

  // Form Actions
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  button: {
    flex: 1,
    minHeight: 48,
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
    marginBottom: theme.spacing[2],
  },
  infoNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});