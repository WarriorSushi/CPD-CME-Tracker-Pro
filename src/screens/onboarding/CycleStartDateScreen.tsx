import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DatePicker, ProgressIndicator } from '../../components';
import { SvgIcon } from '../../components/common/SvgIcon';
import { OnboardingStackParamList } from '../../types/navigation';
import { userOperations } from '../../services/database';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const optionShadowAnims = useRef(QUICK_OPTIONS.map(() => new Animated.Value(0))).current;
  const customShadowAnim = useRef(new Animated.Value(0)).current;

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
    // Initialize with a reasonable default
    const defaultDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    setCustomDate(defaultDate);
    // Show picker immediately
    setShowDatePicker(true);
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
    ]).start(() => {
      // Add shadow animations after cards finish appearing (using setValue to avoid conflicts)
      setTimeout(() => {
        optionShadowAnims.forEach(anim => anim.setValue(1));
        customShadowAnim.setValue(1);
      }, 100);
    });
  }, []);

  const isValid = selectedOption !== null || customDate !== null;

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
          __DEV__ && console.error('[ERROR] CycleStartDateScreen: Failed to save cycle dates');
        }
      } catch (error) {
        __DEV__ && console.error('[ERROR] CycleStartDateScreen: Error saving cycle dates:', error);
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
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <SvgIcon name="calendar" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>When did your cycle start?</Text>
            <Text style={styles.subtitle}>
              Rough dates are fine! This helps show accurate progress.
            </Text>
          </Animated.View>

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Choose the closest option:</Text>
            
            {/* Grid layout for quick options */}
            <View style={styles.optionsGrid}>
              {QUICK_OPTIONS.map((option, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.gridOptionWrapper,
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
                    style={[
                      styles.gridOptionCard,
                      {
                        elevation: optionShadowAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 4],
                        }),
                        shadowOpacity: optionShadowAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.15],
                        }),
                      } as any
                    ]}
                  >
                    <View style={styles.gridOptionContent}>
                      <Text style={[
                        styles.gridOptionText,
                        selectedOption === index && styles.selectedText,
                      ]}>
                        {option.label}
                      </Text>
                      {option.months !== 0 && (
                        <Text style={[
                          styles.gridOptionDate,
                          selectedOption === index && styles.selectedDateText,
                        ]}>
                          {(() => {
                            const date = new Date();
                            date.setMonth(date.getMonth() + option.months);
                            return formatDateForDisplay(date);
                          })()}
                        </Text>
                      )}
                    </View>
                  </PremiumCard>
                </Animated.View>
              ))}
            </View>

            {/* Custom date option - full width at bottom */}
            <Animated.View
              style={[
                styles.customOptionWrapper,
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
                style={[
                  styles.customOptionCard,
                  {
                                        shadowOpacity: customShadowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.15],
                    }),
                  } as any
                ]}
              >
                <View style={styles.customOptionContent}>
                  <View style={styles.customOptionTextContent}>
                    <Text style={[
                      styles.customOptionText,
                      selectedOption === -1 && styles.selectedText,
                    ]}>
                      Pick a different date
                    </Text>
                    <Text style={styles.customOptionSubtext}>
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
          
          {/* Date Picker Modal */}
          {showDatePicker && customDate && (
            <DatePicker
              value={customDate}
              onDateChange={(date) => {
                setCustomDate(date);
                setShowDatePicker(false);
              }}
              maximumDate={new Date()}
              minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 10))}
            />
          )}

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
    paddingTop: 12,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  optionWrapper: {
    marginBottom: 4,
  },
  // Grid layout styles
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridOptionWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  gridOptionCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 70,
  },
  gridOptionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridOptionDate: {
    fontSize: 10,
    color: '#718096',
    textAlign: 'center',
  },
  // Custom option styles (full width)
  customOptionWrapper: {
    width: '100%',
    marginTop: 8,
  },
  customOptionCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  customOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customOptionTextContent: {
    flex: 1,
    marginRight: 16,
  },
  customOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  customOptionSubtext: {
    fontSize: 11,
    color: '#718096',
  },
  optionCard: {
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  selectedText: {
    color: '#4FACFE',
  },
  optionDate: {
    fontSize: 11,
    color: '#718096',
  },
  selectedDateText: {
    color: '#4A5568',
  },
  optionSubtext: {
    fontSize: 11,
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
    borderRadius: theme.borderRadius.base,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    // Ghost button styles handled by component
  },
});
