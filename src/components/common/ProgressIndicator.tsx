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
    paddingVertical: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  completedDot: {
    backgroundColor: '#667EEA',
  },
  currentDot: {
    backgroundColor: '#667EEA',
    transform: [{ scale: 1.3 }],
  },
  pendingDot: {
    backgroundColor: '#E2E8F0',
  },
  stepText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: theme.typography.fontWeight.medium,
  },
});