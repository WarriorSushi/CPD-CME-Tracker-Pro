import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, CardTitle, Chip } from '../../components';
import { theme } from '../../constants/theme';

export const DesignSystemDemo: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              CPD & CME Tracker Design System
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Improved contrast, interactive states, and tactile feedback
            </Text>
          </View>

          {/* Cards Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Cards
            </Text>
            <View style={styles.cardsGrid}>
              <Card variant="base" style={styles.demoCard}>
                <CardTitle variant="base">Unselected</CardTitle>
                <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>
                  Base card style with subtle shadow
                </Text>
              </Card>

              <Card variant="selected" style={styles.demoCard}>
                <CardTitle variant="selected">Selected</CardTitle>
                <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>
                  Blue background with primary border
                </Text>
              </Card>

              <Card variant="outline" style={styles.demoCard}>
                <CardTitle variant="base">Outline</CardTitle>
                <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>
                  Clean white background with border
                </Text>
              </Card>

              <Card variant="success" style={styles.demoCard}>
                <CardTitle variant="success">Success</CardTitle>
                <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>
                  Success state with green accent
                </Text>
              </Card>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Buttons
            </Text>
            <View style={styles.buttonsRow}>
              <Button
                title="Primary"
                variant="primary"
                onPress={() => console.log('Primary pressed')}
                style={styles.demoButton}
              />
              <Button
                title="Outline"
                variant="outline"
                onPress={() => console.log('Outline pressed')}
                style={styles.demoButton}
              />
              <Button
                title="Destructive"
                variant="destructive"
                onPress={() => console.log('Destructive pressed')}
                style={styles.demoButton}
              />
            </View>
          </View>

          {/* Chips Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Chips
            </Text>
            <View style={styles.chipsRow}>
              <Chip
                label="Unselected"
                variant="default"
                onPress={() => console.log('Default chip pressed')}
                style={styles.demoChip}
              />
              <Chip
                label="Selected"
                variant="selected"
                onPress={() => console.log('Selected chip pressed')}
                style={styles.demoChip}
              />
              <Chip
                label="Warning"
                variant="warning"
                onPress={() => console.log('Warning chip pressed')}
                style={styles.demoChip}
              />
            </View>
          </View>

          {/* Color Tokens Footer */}
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.footerTitle, { color: theme.colors.text.primary }]}>
              HSL Color Tokens
            </Text>
            <View style={styles.tokensContainer}>
              <Text style={[styles.tokenText, { color: theme.colors.text.secondary }]}>
                Primary: {theme.colors.primary}
              </Text>
              <Text style={[styles.tokenText, { color: theme.colors.text.secondary }]}>
                Selected: {theme.colors.selectedBg}
              </Text>
              <Text style={[styles.tokenText, { color: theme.colors.text.secondary }]}>
                Success: {theme.colors.success}
              </Text>
              <Text style={[styles.tokenText, { color: theme.colors.text.secondary }]}>
                Warning: {theme.colors.warning}
              </Text>
              <Text style={[styles.tokenText, { color: theme.colors.text.secondary }]}>
                Error: {theme.colors.error}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(0 0% 100%)', // getColor('background')
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  demoCard: {
    width: '48%',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  demoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  demoChip: {
    marginRight: 12,
    marginBottom: 8,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tokensContainer: {
    // Container for tokens
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
});