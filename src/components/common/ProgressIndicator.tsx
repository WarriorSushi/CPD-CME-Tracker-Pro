import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  showTitle?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  showTitle = true,
}) => {
  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>Customize this app to your needs in simple steps</Text>
      )}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentStep ? styles.completedDot : styles.pendingDot,
              index === currentStep - 1 ? styles.currentDot : null,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
    lineHeight: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  completedDot: {
    backgroundColor: theme.colors.primary,
  },
  currentDot: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.2 }],
  },
  pendingDot: {
    backgroundColor: theme.colors.border.light,
  },
  stepText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});