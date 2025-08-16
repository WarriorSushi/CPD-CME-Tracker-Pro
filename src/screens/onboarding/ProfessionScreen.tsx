import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList, Profession } from '../../types';
import { userOperations } from '../../services/database';

type ProfessionScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Profession'>;

interface Props {
  navigation: ProfessionScreenNavigationProp;
}

const PROFESSIONS: { value: Profession; title: string; description: string }[] = [
  {
    value: 'Physician',
    title: 'Physician',
    description: 'Doctors, specialists, and medical practitioners',
  },
  {
    value: 'Nurse',
    title: 'Nurse',
    description: 'All nursing roles and care providers',
  },
  {
    value: 'Pharmacist',
    title: 'Pharmacist',
    description: 'Medication and pharmaceutical professionals',
  },
  {
    value: 'Allied Health',
    title: 'Allied Health Professional',
    description: 'Therapists, technologists, and support professionals',
  },
  {
    value: 'Other',
    title: 'Other Healthcare Professional',
    description: 'All other licensed healthcare workers',
  },
];

export const ProfessionScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedProfession) return;

    setIsLoading(true);
    
    try {
      // Save profession to database
      const result = await userOperations.updateUser({
        profession: selectedProfession,
      });

      if (result.success) {
        navigation.navigate('CreditSystem');
      } else {
        // Handle error - in a real app, we'd show an error message
      __DEV__ && console.error('Failed to save profession:', result.error);
      }
    } catch (error) {
      __DEV__ && console.error('Error saving profession:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ProgressIndicator currentStep={1} totalSteps={5} />
          
          <View style={styles.header}>
            <Text style={styles.title}>What's your profession?</Text>
            <Text style={styles.subtitle}>
              This helps us configure the right CE requirements and categories for your field.
            </Text>
          </View>

          <View style={styles.professionList}>
            {PROFESSIONS.map((profession) => (
              <TouchableOpacity
                key={profession.value}
                onPress={() => setSelectedProfession(profession.value)}
                activeOpacity={0.7}
              >
                <Card 
                  variant={selectedProfession === profession.value ? 'selected' : 'outline'}
                  style={styles.compactCard}
                >
                  <View style={styles.professionContent}>
                    <View style={styles.professionTextContent}>
                      <Text style={[
                        styles.professionTitle,
                        selectedProfession === profession.value && styles.selectedProfessionTitle,
                      ]}>
                        {profession.title}
                      </Text>
                      <Text style={[
                        styles.professionDescription,
                        selectedProfession === profession.value && styles.selectedProfessionDescription,
                      ]}>
                        {profession.description}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioButton,
                      selectedProfession === profession.value && styles.selectedRadioButton,
                    ]}>
                      {selectedProfession === profession.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedProfession}
          loading={isLoading}
          style={styles.primaryButton}
        />
        
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
          style={styles.secondaryButton}
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
  content: {
    padding: theme.spacing[3],
  },
  header: {
    marginBottom: theme.spacing[3],
    marginTop: theme.spacing[1],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  professionList: {
    gap: theme.spacing[1],
  },
  compactCard: {
    padding: theme.spacing[2],
  },
  professionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionTextContent: {
    flex: 1,
    marginRight: theme.spacing[1],
  },
  professionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 0,
  },
  selectedProfessionTitle: {
    color: theme.colors.primary,
  },
  professionDescription: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    lineHeight: 12,
  },
  selectedProfessionDescription: {
    color: theme.colors.text.primary,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  actions: {
    padding: theme.spacing[3],
    paddingTop: 0,
  },
  primaryButton: {
    marginBottom: theme.spacing[2],
  },
  secondaryButton: {
    // Secondary button styles
  },
});