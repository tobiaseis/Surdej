import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Home, BookOpen, Book, HelpCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ActiveBakeScreen } from '../screens/ActiveBakeScreen';
import { CompletionScreen } from '../screens/CompletionScreen';
import { TechniqueGuideScreen } from '../screens/TechniqueGuideScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RecipeListScreen } from '../screens/RecipeListScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { PlanOverviewScreen } from '../screens/PlanOverviewScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { SosScreen } from '../screens/SosScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const RecipeStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AktivBagning" component={ActiveBakeScreen} />
      <HomeStack.Screen name="Teknik" component={TechniqueGuideScreen} />
      <HomeStack.Screen name="Færdig" component={CompletionScreen} />
      <HomeStack.Screen name="Indstillinger" component={SettingsScreen} />
    </HomeStack.Navigator>
  );
};

const RecipeStackNavigator = () => {
  return (
    <RecipeStack.Navigator screenOptions={{ headerShown: false }}>
      <RecipeStack.Screen name="OpskriftListe" component={RecipeListScreen} />
      <RecipeStack.Screen name="OpskriftDetaljer" component={RecipeDetailScreen} />
      <RecipeStack.Screen name="SetupOpskrift" component={SetupScreen} />
      <RecipeStack.Screen name="PlanOversigt" component={PlanOverviewScreen} />
    </RecipeStack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSub,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Hjem"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Opskrifter"
        component={RecipeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Dagbog"
        component={DiaryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Hjælp"
        component={SosScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
