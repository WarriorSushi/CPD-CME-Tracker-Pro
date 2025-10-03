import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, ProgressIndicator, SvgIcon } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type CountryScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Country'>;

interface Props {
  navigation: CountryScreenNavigationProp;
}

const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export const CountryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_COUNTRIES;
    }
    return ALL_COUNTRIES.filter(country => 
      country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleContinue = () => {
    if (selectedCountry) {
      
      navigation.navigate('CreditSystem');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <ProgressIndicator currentStep={2} totalSteps={6} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Where are you located?</Text>
          <Text style={styles.subtitle}>This helps us configure your CME requirements</Text>
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Search countries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.countriesList}>
            {filteredCountries.map((country) => (
              <TouchableOpacity
                key={country}
                onPress={() => setSelectedCountry(country)}
                activeOpacity={0.7}
              >
                <Card 
                  variant={selectedCountry === country ? 'selected' : 'outline'}
                  style={styles.countryCard}
                >
                  <View style={styles.countryContent}>
                    <Text style={[
                      styles.countryText,
                      selectedCountry === country && styles.selectedCountryText,
                    ]}>
                      {country}
                    </Text>
                    {selectedCountry === country && (
                      <SvgIcon name="checkmark" size={16} color={theme.colors.white} style={styles.checkmark} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
            {filteredCountries.length === 0 && (
              <Text style={styles.noResults}>No countries found</Text>
            )}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
          disabled={!selectedCountry}
        />
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
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
    padding: theme.spacing[5],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    marginTop: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: theme.spacing[4],
  },
  searchInput: {
    // Search input styling
  },
  scrollView: {
    flex: 1,
  },
  countriesList: {
    // Countries list container
  },
  countryCard: {
    marginBottom: theme.spacing[2],
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noResults: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[8],
    fontStyle: 'italic',
  },
  countryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedCountryText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  checkmark: {
    position: 'absolute',
    top: theme.spacing[2],
    right: theme.spacing[2],
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: theme.spacing[3],
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
});
