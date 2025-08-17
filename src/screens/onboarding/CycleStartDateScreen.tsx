import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DatePicker, ProgressIndicator } from '../../components';
import { OnboardingStackParamList } from '../../types/navigation';
import { userOperations } from '../../services/database';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from './OnboardingComponents';

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
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const optionCardsAnim = useRef(QUICK_OPTIONS.map(() => new Animated.Value(0))).current;
  const customCardAnim = useRef(new Animated.Value(0)).current;
  const syncCardAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    Animated.sequence([
      Animated.delay(300),
      Animated.stagger(80, [
        ...optionCardsAnim.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        ),
        Animated.spring(customCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate sync card when it becomes visible
    if (askAboutLicenseSync && isValid) {
      Animated.spring(syncCardAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      syncCardAnim.setValue(0);
    }
  }, [askAboutLicenseSync, isValid]);

  const handleContinue = async () => {
    if (selectedOption !== null || customDate) {
      const selectedDate = getSelectedDate();
      if (!selectedDate) return;

      setIsLoading(true);
      try {
        // Get user's requirement period to calculate end date
        const userResult = await userOperations.getCurrentUser();
        const requirementPeriod = userResult.data?.requirementPeriod || 1;
        
        // Calculate cycle end date
        const cycleEndDate = new Date(selectedDate);
        cycleEndDate.setFullYear(selectedDate.getFullYear() + requirementPeriod);

        // Save cycle dates to database
        const result = await userOperations.updateUser({
          cycleStartDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
          cycleEndDate: cycleEndDate.toISOString().split('T')[0]
        });

        if (result.success) {
          navigation.navigate('SetupComplete');
        } else {
          __DEV__ && console.error('❌ CycleStartDateScreen: Failed to save cycle dates');
        }
      } catch (error) {
        __DEV__ && console.error('💥 CycleStartDateScreen: Error saving cycle dates:', error);
      } finally {
        setIsLoading(false);
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedGradientBackground />

      <Animated.View 
        style={[
          styles.progressWrapper,
          {
            opacity: progressAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ProgressIndicator currentStep={4} totalSteps={5} />
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4FACFE', '#00F2FE']}
                style={styles.headerIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.headerEmoji}>📅</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>When did your cycle start?</Text>
            <Text style={styles.subtitle}>
              Rough dates are fine! This helps show accurate progress.
            </Text>
          </Animated.View>

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Choose the closest option:</Text>
            
            {QUICK_OPTIONS.map((option, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.optionWrapper,
                  {
                    opacity: optionCardsAnim[index],
                    transform: [{
                      translateY: optionCardsAnim[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [15, 0],
                      }),
                    }],
                  },
                ]}
              >
                <PremiumCard
                  selected={selectedOption === index}
                  onPress={() => handleQuickSelect(option.months, index)}
                  style={styles.optionCard}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionTextContent}>
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
                    ]}>
                      {selectedOption === index && (
                        <LinearGradient
                          colors={['#4FACFE', '#00F2FE']}
                          style={styles.radioButtonInner}
                        />
                      )}
                    </View>
                  </View>
                </PremiumCard>
              </Animated.View>
            ))}

            <Animated.View
              style={[
                styles.optionWrapper,
                {
                  opacity: customCardAnim,
                  transform: [{
                    translateY: customCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  }],
                },
              ]}
            >
              <PremiumCard
                selected={selectedOption === -1}
                onPress={handleCustomDate}
                style={styles.optionCard}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContent}>
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
                  ]}>
                    {selectedOption === -1 && (
                      <LinearGradient
                        colors={['#4FACFE', '#00F2FE']}
                        style={styles.radioButtonInner}
                      />
                    )}
                  </View>
                </View>
              </PremiumCard>
            </Animated.View>
          </View>

          {/* Custom Date Picker */}
          {selectedOption === -1 && (
            <View style={styles.datePickerContainer}>
              <PremiumCard style={styles.datePickerCard}>
                <DatePicker
                  value={customDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                  onDateChange={handleDatePickerChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(2015, 0, 1)}
                  style={styles.customDatePicker}
                />
              </PremiumCard>
            </View>
          )}

          {/* License Sync Option */}
          {askAboutLicenseSync && isValid && (
            <Animated.View
              style={[
                styles.syncWrapper,
                {
                  opacity: syncCardAnim,
                  transform: [{
                    translateY: syncCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  }],
                },
              ]}
            >
              <PremiumCard style={styles.syncCard}>
                <View style={styles.syncContent}>
                  <LinearGradient
                    colors={['#43E97B', '#38F9D7']}
                    style={styles.syncIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.syncEmoji}>🔔</Text>
                  </LinearGradient>
                  <Text style={styles.syncTitle}>License renewal reminder calculation with same dates?</Text>
                </View>
                <View style={styles.syncButtons}>
                  <PremiumCard 
                    selected={licenseSyncSelected === true}
                    onPress={handleLicenseSyncYes}
                    style={styles.syncButton}
                  >
                    <Text style={[
                      styles.syncButtonText,
                      licenseSyncSelected === true && styles.syncButtonTextSelected,
                    ]}>
                      Yes
                    </Text>
                  </PremiumCard>
                  <PremiumCard 
                    selected={licenseSyncSelected === false}
                    onPress={handleLicenseSyncNo}
                    style={styles.syncButton}
                  >
                    <Text style={[
                      styles.syncButtonText,
                      licenseSyncSelected === false && styles.syncButtonTextSelected,
                    ]}>
                      No
                    </Text>
                  </PremiumCard>
                </View>
              </PremiumCard>
            </Animated.View>
          )}

          <PremiumCard style={styles.reassurance}>
            <View style={styles.reassuranceContent}>
              <LinearGradient
                colors={['#FA709A', '#FEE140']}
                style={styles.reassuranceIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.reassuranceEmoji}>💡</Text>
              </LinearGradient>
              <Text style={styles.reassuranceText}>
                You can adjust this later in Settings
              </Text>
            </View>
          </PremiumCard>
        </View>
      </ScrollView>
      
      <Animated.View 
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <PremiumButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid}
          loading={isLoading}
          variant="primary"
          style={styles.primaryButton}
        />
        
        <PremiumButton
          title="Back"
          variant="ghost"
          onPress={handleBack}
          style={styles.secondaryButton}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrapper: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  content: {
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
  },
  optionWrapper: {
    marginBottom: 8,
  },
  optionCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContent: {
    flex: 1,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  selectedText: {
    color: '#4FACFE',
  },
  optionDate: {
    fontSize: 13,
    color: '#718096',
  },
  selectedDateText: {
    color: '#4A5568',
  },
  optionSubtext: {
    fontSize: 13,
    color: '#718096',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#4FACFE',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  datePickerContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  datePickerCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  customDatePicker: {
    backgroundColor: 'transparent',
  },
  syncWrapper: {
    marginBottom: 20,
  },
  syncCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  syncEmoji: {
    fontSize: 16,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
    lineHeight: 22,
  },
  syncButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  syncButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  syncButtonTextSelected: {
    color: '#4FACFE',
  },
  reassurance: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  reassuranceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reassuranceIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reassuranceEmoji: {
    fontSize: 12,
  },
  reassuranceText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    // Ghost button styles handled by component
  },
});