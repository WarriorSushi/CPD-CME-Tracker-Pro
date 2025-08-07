import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
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
    title: 'Physician (MD/DO)',
    description: 'All medical specialties and subspecialties',
  },
  {
    value: 'Nurse',
    title: 'Registered Nurse',
    description: 'RN, NP, CNS, CRNA, CNM, and other nursing roles',
  },
  {
    value: 'Pharmacist',
    title: 'Pharmacist (PharmD)',
    description: 'Clinical, retail, hospital, and specialty pharmacy',
  },
  {
    value: 'Physical Therapist',
    title: 'Physical Therapist',
    description: 'PT and related rehabilitation services',
  },
  {
    value: 'Occupational Therapist',
    title: 'Occupational Therapist',
    description: 'OT and related rehabilitation services',
  },
  {
    value: 'Medical Technologist',
    title: 'Medical Technologist',
    description: 'Lab tech, radiology tech, and other technical roles',
  },
  {
    value: 'Radiologic Technologist',
    title: 'Radiologic Technologist',
    description: 'Diagnostic imaging and radiation therapy',
  },
  {
    value: 'Respiratory Therapist',
    title: 'Respiratory Therapist',
    description: 'Pulmonary and respiratory care',
  },
  {
    value: 'Other',
    title: 'Other Healthcare Professional',
    description: 'Allied health and other licensed professionals',
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
        navigation.navigate('Country');
      } else {
        // Handle error - in a real app, we'd show an error message
        console.error('Failed to save profession:', result.error);
      }
    } catch (error) {
      console.error('Error saving profession:', error);
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
                style={[
                  styles.professionItem,
                  selectedProfession === profession.value && styles.selectedProfessionItem,
                ]}
                onPress={() => setSelectedProfession(profession.value)}
                activeOpacity={0.7}
              >
                <View style={styles.professionContent}>
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
    padding: theme.spacing[5],
  },
  header: {
    marginBottom: theme.spacing[6],
    marginTop: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  professionList: {
    gap: theme.spacing[3],
  },
  professionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.base,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  selectedProfessionItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  professionContent: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  professionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  selectedProfessionTitle: {
    color: theme.colors.primary,
  },
  professionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  selectedProfessionDescription: {
    color: theme.colors.text.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
  secondaryButton: {
    // Secondary button styles
  },
});