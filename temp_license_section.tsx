        {/* License Management Section */}
        {licenses && licenses.length > 0 && (
          <View style={styles.licenseSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Licenses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.viewAllText}>Manage All</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              View and manage all your professional licenses here. Tap Edit to update expiration dates after renewal.
            </Text>
            
            {/* All License Cards - Show all licenses */}
            {(() => {
              // Helper function to calculate days between dates
              const calculateDaysUntil = (expirationDateString: string): number => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const expDate = new Date(expirationDateString);
                if (isNaN(expDate.getTime())) {
                  console.error('🚨 Invalid date string:', expirationDateString);
                  return 0;
                }
                expDate.setHours(0, 0, 0, 0);
                
                const msPerDay = 1000 * 60 * 60 * 24;
                const diffMs = expDate.getTime() - today.getTime();
                return Math.ceil(diffMs / msPerDay);
              };
              
              // Show ALL licenses, sorted by expiration date (most urgent first)
              const allLicenses = licenses
                .map(license => {
                  const daysUntil = calculateDaysUntil(license.expirationDate);
                  return { ...license, daysUntil };
                })
                .sort((a, b) => a.daysUntil - b.daysUntil);

              return allLicenses.map((license) => {
                const { daysUntil } = license;
                let statusColor = theme.colors.success;
                let statusText = 'Active';
                let statusIcon = '✅';

                if (daysUntil < 0) {
                  statusColor = theme.colors.error;
                  statusText = 'Expired';
                  statusIcon = '🚨';
                } else if (daysUntil <= 30) {
                  statusColor = theme.colors.error;
                  statusText = `${daysUntil} days left`;
                  statusIcon = '⚠️';
                } else if (daysUntil <= 90) {
                  statusColor = theme.colors.warning;
                  statusText = `${daysUntil} days left`;
                  statusIcon = '⏰';
                } else {
                  statusText = `${daysUntil} days left`;
                }

                return (
                  <Card key={license.id} style={styles.licenseCard}>
                    <View style={styles.licenseCardHeader}>
                      <View style={styles.licenseCardMain}>
                        <View style={[styles.licenseIcon, { backgroundColor: statusColor + '20' }]}>
                          <Text style={styles.licenseIconText}>{statusIcon}</Text>
                        </View>
                        <View style={styles.licenseInfo}>
                          <Text style={styles.licenseCardTitle} numberOfLines={1}>
                            {license.licenseType}
                          </Text>
                          <Text style={styles.licenseCardAuthority} numberOfLines={1}>
                            {license.issuingAuthority}
                          </Text>
                          <Text style={styles.licenseCardExpiry}>
                            Expires: {new Date(license.expirationDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={[styles.licenseStatusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.licenseStatusText}>{statusText}</Text>
                      </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.licenseCardActions}>
                      <TouchableOpacity 
                        style={styles.licenseActionButton}
                        onPress={() => {
                          // Navigate directly to AddLicense screen with edit data
                          (navigation as any).navigate('AddLicense', { editLicense: license });
                        }}
                      >
                        <Text style={styles.licenseActionText}>📝 Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.licenseActionButton}
                        onPress={() => {
                          // TODO: Setup reminder - for now show alert
                          Alert.alert(
                            'Set Reminder',
                            `Would you like to set renewal reminders for ${license.licenseType}?\n\nRecommended reminder schedule:\n• 90 days before\n• 60 days before\n• 30 days before\n• 14 days before\n• 7 days before\n• 1 day before`,
                            [
                              { text: 'Later', style: 'cancel' },
                              { text: 'Set Reminders', onPress: () => {} }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.licenseActionText}>🔔 Remind</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Progress indicator if credits are tracked */}
                    {license.requiredCredits > 0 && (
                      <View style={styles.licenseProgress}>
                        <Text style={styles.licenseProgressText}>
                          Credits: {license.completedCredits}/{license.requiredCredits} {user?.creditSystem ? getCreditUnit(user.creditSystem) : ''}
                        </Text>
                        <View style={styles.licenseProgressBar}>
                          <View 
                            style={[
                              styles.licenseProgressFill,
                              { 
                                width: `${Math.min((license.completedCredits / license.requiredCredits) * 100, 100)}%`,
                                backgroundColor: license.completedCredits >= license.requiredCredits ? theme.colors.success : theme.colors.primary
                              }
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Renewal Instructions */}
                    <View style={styles.licenseRenewalInstructions}>
                      <Text style={styles.renewalInstructionsText}>
                        💡 Already renewed? Tap "Edit" and update the expiration date.
                      </Text>
                    </View>
                  </Card>
                );
              });
            })()}
            
            {/* Quick Add License Button */}
            <TouchableOpacity 
              style={styles.addLicenseButton}
              onPress={() => navigation.navigate('Settings', { screen: 'AddLicense' })}
            >
              <Text style={styles.addLicenseText}>+ Add New License</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show Add License Prompt if no licenses */}
        {(!licenses || licenses.length === 0) && (
          <View style={styles.noLicensesSection}>
            <Card style={styles.noLicensesCard}>
              <View style={styles.noLicensesContent}>
                <Text style={styles.noLicensesIcon}>🏥</Text>
                <Text style={styles.noLicensesTitle}>Track Your Licenses</Text>
                <Text style={styles.noLicensesSubtitle}>
                  Add your professional licenses to track renewal deadlines and never miss a renewal date.
                </Text>
                <TouchableOpacity 
                  style={styles.noLicensesButton}
                  onPress={() => navigation.navigate('Settings', { screen: 'AddLicense' })}
                >
                  <Text style={styles.noLicensesButtonText}>Add Your First License</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* CME Event Reminders Section */}
        <View style={styles.remindersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CME Event Reminders</Text>
            <TouchableOpacity 
              style={styles.addReminderButton}
              onPress={() => {
                Alert.alert(
                  'Add CME Event Reminder', 
                  'Set reminders for upcoming conferences, workshops, or CME events.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Reminder', onPress: () => {
                      // TODO: Navigate to add reminder screen
                      Alert.alert('Coming Soon', 'CME event reminders will be available in the next update!');
                    }}
                  ]
                );
              }}
            >
              <Text style={styles.addReminderText}>+ Add Reminder</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Set reminders for upcoming CME events, conferences, and workshops so you never miss important learning opportunities.
          </Text>
          
          {/* Placeholder for reminders - will be implemented later */}
          <Card style={styles.remindersPlaceholder}>
            <View style={styles.remindersPlaceholderContent}>
              <Text style={styles.remindersPlaceholderIcon}>📅</Text>
              <Text style={styles.remindersPlaceholderTitle}>No Reminders Set</Text>
              <Text style={styles.remindersPlaceholderSubtitle}>
                Tap the + button above to add reminders for upcoming CME events
              </Text>
            </View>
          </Card>
        </View>