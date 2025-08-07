import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Button, Card, Input, ProgressCircle, LoadingSpinner } from './src/components';
import { theme } from './src/constants/theme';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>CME Tracker</Text>
        <Text style={styles.subtitle}>Design System Demo</Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Buttons</Text>
          <View style={styles.buttonRow}>
            <Button
              title="Primary"
              onPress={() => console.log('Primary pressed')}
              style={styles.button}
            />
            <Button
              title="Secondary"
              variant="secondary"
              onPress={() => console.log('Secondary pressed')}
              style={styles.button}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="Outline"
              variant="outline"
              onPress={() => console.log('Outline pressed')}
              style={styles.button}
            />
            <Button
              title="Disabled"
              disabled
              onPress={() => console.log('Disabled pressed')}
              style={styles.button}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Circle</Text>
          <View style={styles.progressRow}>
            <ProgressCircle progress={0.75} size={100} />
            <View style={styles.progressText}>
              <Text style={styles.progressLabel}>CME Progress</Text>
              <Text style={styles.progressValue}>37.5 / 50 hours</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Input Fields</Text>
          <Input
            label="Activity Title"
            placeholder="Enter activity title"
            helperText="Name of the CME activity"
          />
          <Input
            label="Credits Earned"
            placeholder="0.0"
            keyboardType="numeric"
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Loading Spinner</Text>
          <LoadingSpinner size={32} />
        </Card>
      </ScrollView>
    </View>
  );
}

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
    paddingTop: theme.spacing[16],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  section: {
    marginBottom: theme.spacing[5],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing[2],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressText: {
    flex: 1,
    marginLeft: theme.spacing[6],
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  progressValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
