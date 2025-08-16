import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';

export interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  retry?: () => void;
  loadingText?: string;
  errorText?: string;
  children: React.ReactNode;
  skeleton?: boolean; // Whether to show skeleton loading
  minimal?: boolean; // Minimal loading for small components
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  retry,
  loadingText = 'Loading...',
  errorText,
  children,
  skeleton = false,
  minimal = false,
}) => {
  if (error) {
    return (
      <View style={[styles.container, minimal && styles.minimalContainer]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {errorText || error}
          </Text>
          {retry && (
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    if (skeleton) {
      return <SkeletonLoader minimal={minimal} />;
    }

    return (
      <View style={[styles.container, minimal && styles.minimalContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size={minimal ? 'small' : 'large'} 
            color={theme.colors.primary} 
          />
          {!minimal && (
            <Text style={styles.loadingText}>{loadingText}</Text>
          )}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const SkeletonLoader: React.FC<{ minimal?: boolean }> = ({ minimal }) => {
  return (
    <View style={[styles.skeletonContainer, minimal && styles.minimalContainer]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      {!minimal && (
        <>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  minimalContainer: {
    padding: theme.spacing[3],
    minHeight: 60,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.medium,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: theme.spacing[4],
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.gray200,
    borderRadius: 8,
    marginBottom: theme.spacing[2],
  },
  skeletonLineShort: {
    width: '60%',
  },
  skeletonLineMedium: {
    width: '80%',
  },
});

