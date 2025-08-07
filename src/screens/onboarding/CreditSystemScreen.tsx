import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type CreditSystemScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CreditSystem'>;

interface Props {
  navigation: CreditSystemScreenNavigationProp;
}

export const CreditSystemScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Credit System</Text>
        <Text style={styles.subtitle}>Coming Soon...</Text>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('AnnualTarget')}
          style={styles.primaryButton}
        />
        <Button
          title="Back"
          variant="outline"
          onPress={() => navigation.goBack()}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    padding: theme.spacing[5],
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
});