import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { Home, BookOpen, Book, Coffee, HelpCircle } from 'lucide-react-native';
import { colors } from '../theme';
import { useSettingsHydrated, useSettingsStore } from '../store/settingsStore';
import type {
  CoffeeStackParamList,
  HomeStackParamList,
  MainTabParamList,
  RecipeStackParamList,
  RootStackParamList,
} from './types';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ActiveBakeScreen } from '../screens/ActiveBakeScreen';
import { CompletionScreen } from '../screens/CompletionScreen';
import { TechniqueGuideScreen } from '../screens/TechniqueGuideScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RecipeListScreen } from '../screens/RecipeListScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { DoughCalculatorScreen } from '../screens/DoughCalculatorScreen';
import { PlanOverviewScreen } from '../screens/PlanOverviewScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { CoffeeScreen } from '../screens/CoffeeScreen';
import { CoffeeEntryScreen } from '../screens/CoffeeEntryScreen';
import { SosScreen } from '../screens/SosScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RecipeStack = createNativeStackNavigator<RecipeStackParamList>();
const CoffeeStack = createNativeStackNavigator<CoffeeStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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
      <RecipeStack.Screen name="Beregner" component={DoughCalculatorScreen} />
      <RecipeStack.Screen name="PlanOversigt" component={PlanOverviewScreen} />
    </RecipeStack.Navigator>
  );
};

const CoffeeStackNavigator = () => {
  return (
    <CoffeeStack.Navigator screenOptions={{ headerShown: false }}>
      <CoffeeStack.Screen name="KaffeListe" component={CoffeeScreen} />
      <CoffeeStack.Screen name="KaffeNy" component={CoffeeEntryScreen} />
    </CoffeeStack.Navigator>
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
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarButton: (props) => (
          <PlatformPressable {...props} pressColor={colors.pressHighlight} pressOpacity={0.92} />
        ),
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
        name="Kaffe"
        component={CoffeeStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Coffee color={color} size={size} />,
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
  const hydrated = useSettingsHydrated();
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);

  // Vent på de gemte indstillinger, så navigatoren mountes med den rigtige
  // startskærm. `initialRouteName` læses kun ved første mount.
  if (!hydrated) {
    return <View style={styles.boot} />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={hasOnboarded ? 'MainTabs' : 'Splash'}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
