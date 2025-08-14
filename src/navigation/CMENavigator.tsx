import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CMEStackParamList } from '../types/navigation';
import { useAppContext } from '../contexts/AppContext';

// Import screens
import { CMEHistoryScreen } from '../screens/cme/CMEHistoryScreen';
import { AddCMEScreen } from '../screens/cme/AddCMEScreen';

const Stack = createStackNavigator<CMEStackParamList>();

export const CMENavigator: React.FC = () => {
  const { recentCMEEntries } = useAppContext();
  
  // Always start with CMEHistory - let the history screen handle showing empty state or entries
  const initialRoute = "CMEHistory";

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CMEHistory"
        component={CMEHistoryScreen}
      />
      <Stack.Screen
        name="AddCME"
        component={AddCMEScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};