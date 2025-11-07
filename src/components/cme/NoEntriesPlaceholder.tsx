import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PremiumCard, PremiumButton } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';

interface NoEntriesPlaceholderProps {
  message?: string;
  subtitle?: string;
  onAddEntry: () => void;
}

export const NoEntriesPlaceholder: React.FC<NoEntriesPlaceholderProps> = ({
  message = 'No CME Entries Found',
  subtitle = 'Start tracking your continuing education by adding your first entry.',
  onAddEntry,
}) => {
  return (
    <View style={styles.container}>
      <PremiumCard style={styles.card}>
        <View style={styles.content}>
          <SvgIcon
            name="book"
            size={48}
            color={theme.colors.text.secondary}
            accessibilityLabel="No entries"
          />
          <Text style={styles.title}>{message}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <PremiumButton
            title="Add Your First Entry"
            onPress={onAddEntry}
            variant="primary"
            style={styles.addButton}
          />
        </View>
      </PremiumCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  card: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  addButton: {
    width: '100%',
  },
});
