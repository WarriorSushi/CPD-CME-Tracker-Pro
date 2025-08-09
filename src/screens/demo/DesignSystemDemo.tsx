import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, CardTitle, Chip } from '../../components';
import { useColors, useTokens } from '../../theme';
import { tokens } from '../../theme/tokens';

export const DesignSystemDemo: React.FC = () => {
  const insets = useSafeAreaInsets();
  const getColor = useColors();
  const tokensData = useTokens();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: getColor('textPrimary') }]}>
              CPD/CME Tracker Design System
            </Text>
            <Text style={[styles.subtitle, { color: getColor('textSecondary') }]}>
              Improved contrast, interactive states, and tactile feedback
            </Text>
          </View>

          {/* Cards Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>
              Cards
            </Text>
            <View style={styles.cardsGrid}>
              <Card variant="base" style={styles.demoCard}>
                <CardTitle variant="base">Unselected</CardTitle>
                <Text style={[styles.cardText, { color: getColor('textSecondary') }]}>
                  Base card style with subtle shadow
                </Text>
              </Card>

              <Card variant="selected" style={styles.demoCard}>
                <CardTitle variant="selected">Selected</CardTitle>
                <Text style={[styles.cardText, { color: getColor('textSecondary') }]}>
                  Blue background with primary border
                </Text>
              </Card>

              <Card variant="outline" style={styles.demoCard}>
                <CardTitle variant="base">Outline</CardTitle>
                <Text style={[styles.cardText, { color: getColor('textSecondary') }]}>
                  Clean white background with border
                </Text>
              </Card>

              <Card variant="success" style={styles.demoCard}>
                <CardTitle variant="success">Success</CardTitle>
                <Text style={[styles.cardText, { color: getColor('textSecondary') }]}>
                  Success state with green accent
                </Text>
              </Card>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>
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
            <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>
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
          <View style={[styles.footer, { backgroundColor: getColor('surface'), borderColor: getColor('borderLight') }]}>
            <Text style={[styles.footerTitle, { color: getColor('textPrimary') }]}>
              HSL Color Tokens
            </Text>
            <View style={styles.tokensContainer}>
              <Text style={[styles.tokenText, { color: getColor('textSecondary') }]}>
                Primary: {tokens.color.primary}
              </Text>
              <Text style={[styles.tokenText, { color: getColor('textSecondary') }]}>
                Selected: {tokens.color.selectedBg}
              </Text>
              <Text style={[styles.tokenText, { color: getColor('textSecondary') }]}>
                Success: {tokens.color.success}
              </Text>
              <Text style={[styles.tokenText, { color: getColor('textSecondary') }]}>
                Warning: {tokens.color.warningBorder}
              </Text>
              <Text style={[styles.tokenText, { color: getColor('textSecondary') }]}>
                Error: {tokens.color.error}
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