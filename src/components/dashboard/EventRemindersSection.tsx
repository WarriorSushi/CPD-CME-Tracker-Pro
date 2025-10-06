import React from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { PremiumCard, PremiumButton } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';

interface EventRemindersSectionProps {
  eventReminders: any[];
  remindersCardAnim: Animated.Value;
  remindersShadowAnim: Animated.Value;
  onAddReminder: () => void;
}

export const EventRemindersSection: React.FC<EventRemindersSectionProps> = ({
  eventReminders,
  remindersCardAnim,
  remindersShadowAnim,
  onAddReminder,
}) => {
  const cardShadowStyle: ViewStyle = {
        shadowOpacity: Number(remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })) as unknown as number,
  };

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: remindersCardAnim,
          transform: [{
            translateY: remindersCardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <PremiumCard style={[
        styles.sectionCard,
        cardShadowStyle
      ]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>Event Reminders</Text>
          <PremiumButton
            title="+ Add Reminder"
            onPress={onAddReminder}
            variant="secondary"
            style={styles.headerButton}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.sectionSubtitle}>
            Set reminders for upcoming CME events, conferences, and workshops so you never miss important learning opportunities.
          </Text>

          {/* Reminders List or Placeholder */}
          {eventReminders && eventReminders.length > 0 ? (
            <View style={styles.remindersList}>
              {eventReminders.map((reminder) => {
                const eventDate = new Date(reminder.eventDate);
                const today = new Date();
                const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                let statusColor = theme.colors.primary;
                let statusText = 'Upcoming';
                let statusIcon: React.ReactNode = <SvgIcon name="calendar" size={16} color={statusColor} />;

                if (daysUntil < 0) {
                  statusColor = theme.colors.gray.medium;
                  statusText = 'Past';
                  statusIcon = <SvgIcon name="clipboard" size={16} color={statusColor} />;
                } else if (daysUntil === 0) {
                  statusColor = theme.colors.error;
                  statusText = 'Today';
                  statusIcon = <SvgIcon name="fire" size={16} color={statusColor} />;
                } else if (daysUntil <= 7) {
                  statusColor = theme.colors.warning;
                  statusText = `${daysUntil} days`;
                  statusIcon = <SvgIcon name="clock" size={16} color={statusColor} />;
                } else {
                  statusText = `${daysUntil} days`;
                }

                return (
                  <PremiumCard key={reminder.id} style={styles.reminderCard}>
                    <View style={styles.reminderCardHeader}>
                      <View style={styles.reminderCardMain}>
                        <View style={[styles.reminderIcon, { backgroundColor: statusColor + '20' }]}>
                          <Text style={styles.reminderIconText}>{statusIcon}</Text>
                        </View>
                        <View style={styles.reminderInfo}>
                          <Text style={styles.reminderCardTitle} numberOfLines={1}>
                            {reminder.eventName}
                          </Text>
                          <Text style={styles.reminderCardDate}>
                            {eventDate.toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.reminderStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.reminderStatusText}>{statusText}</Text>
                      </View>
                    </View>
                  </PremiumCard>
                );
              })}
            </View>
          ) : (
            <PremiumCard style={styles.remindersPlaceholder}>
              <View style={styles.remindersPlaceholderContent}>
                <SvgIcon
                  name="reminder"
                  size={40}
                  color={theme.colors.text.secondary}
                  accessibilityLabel="No reminders"
                />
                <Text style={styles.remindersPlaceholderTitle}>No Reminders Set</Text>
                <Text style={styles.remindersPlaceholderSubtitle}>
                  Tap the + button above to add reminders for upcoming CME events
                </Text>
              </View>
            </PremiumCard>
          )}

        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  sectionCard: {
    padding: theme.spacing[5], // Primary card padding
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardContent: {
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    padding: theme.spacing[3], // Nested card padding
    backgroundColor: '#FAFBFC',
  },
  reminderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderIconText: {
    fontSize: 16,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  reminderCardDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  reminderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xl,
  },
  reminderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  remindersPlaceholder: {
    padding: 24,
    backgroundColor: '#FAFBFC',
  },
  remindersPlaceholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  remindersPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  remindersPlaceholderSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});


