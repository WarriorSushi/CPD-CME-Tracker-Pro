import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList, Profession } from '../../types';
import { userOperations } from '../../services/database';
import { getColor } from '../../theme';

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
    gap: theme.spacing[2], // Reduced from spacing[3] to spacing[2]
  },
  compactCard: {
    padding: theme.spacing[3], // Override default Card padding (was 16px, now 12px)
  },
  professionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionTextContent: {
    flex: 1,
    marginRight: theme.spacing[2], // Reduced margin
  },
  professionTitle: {
    fontSize: theme.typography.fontSize.base, // Reduced from lg to base
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[0], // Reduced margin between title and description
  },
  selectedProfessionTitle: {
    color: theme.colors.primary,
  },
  professionDescription: {
    fontSize: theme.typography.fontSize.xs, // Reduced from sm to xs
    color: theme.colors.text.secondary,
    lineHeight: 16, // Reduced line height
  },
  selectedProfessionDescription: {
    color: theme.colors.text.primary,
  },
  radioButton: {
    width: 20, // Reduced from 24 to 20
    height: 20, // Reduced from 24 to 20
    borderRadius: 10, // Adjusted for new size
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10, // Reduced from 12 to 10
    height: 10, // Reduced from 12 to 10
    borderRadius: 5, // Adjusted for new size
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