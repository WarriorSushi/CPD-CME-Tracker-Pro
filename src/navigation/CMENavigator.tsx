import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CMEStackParamList } from '../types/navigation';

// Import screens
import { CMEHistoryScreen } from '../screens/cme/CMEHistoryScreen';
import { AddCMEScreen } from '../screens/cme/AddCMEScreen';

const Stack = createStackNavigator<CMEStackParamList>();

export const CMENavigator: React.FC = () => {
  console.log('🏗️ CMENavigator: Rendering CME stack navigator with initial route CMEHistory');
  
  return (
    <Stack.Navigator
      initialRouteName="CMEHistory"
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