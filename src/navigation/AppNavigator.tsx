import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/Base/ThemeToggle';
import { RootStackParamList } from './props';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { 
            fontFamily: 'PlayfairDisplay_600SemiBold', 
            fontSize: 22 
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'Travel Diary',
            headerRight: () => <ThemeToggle />
          }} 
        />
        <Stack.Screen 
          name="AddEntry" 
          component={AddEntryScreen} 
          options={{
            title: 'New Memory',
            presentation: 'modal',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};