import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Recipe, RecipeStep } from '../data/recipes';
import type { StarterStrength } from '../utils/scheduleCalculator';

/**
 * Route-navne og deres parametre for hver navigator. Alle skærme henter deres
 * `navigation`/`route` herfra, så et forkert route-navn eller en manglende
 * parameter bliver en compilerfejl i stedet for en fejl på telefonen.
 */

export type HomeStackParamList = {
  HomeMain: undefined;
  AktivBagning: undefined;
  Teknik: { step: RecipeStep };
  Færdig: undefined;
  Indstillinger: undefined;
};

export type RecipeStackParamList = {
  OpskriftListe: undefined;
  OpskriftDetaljer: { recipe: Recipe };
  SetupOpskrift: { recipe: Recipe };
  /** Uden opskrift starter beregneren på standardforholdene. */
  Beregner: { recipe?: Recipe } | undefined;
  PlanOversigt: {
    recipe: Recipe;
    /** ISO-streng, fordi Date ikke kan serialiseres i navigation-params. */
    targetTime: string;
    roomTempC: number;
    starterStrength: StarterStrength;
  };
};

export type CoffeeStackParamList = {
  KaffeListe: undefined;
  KaffeNy: undefined;
};

// `| undefined` gør det muligt at gå til en fane uden at pege på en bestemt
// skærm i den, fx navigate('Opskrifter').
export type MainTabParamList = {
  Hjem: NavigatorScreenParams<HomeStackParamList> | undefined;
  Opskrifter: NavigatorScreenParams<RecipeStackParamList> | undefined;
  Dagbog: undefined;
  Kaffe: NavigatorScreenParams<CoffeeStackParamList> | undefined;
  Hjælp: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/**
 * Skærme i tab- og de nestede stack-navigatorer navigerer også på tværs af
 * navigatorer (fx fra Hjem til Opskrifter-fanen). `CompositeScreenProps` kæder
 * forældrenes route-navne på, så også de kald er typede.
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type RecipeStackScreenProps<T extends keyof RecipeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<RecipeStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

export type CoffeeStackScreenProps<T extends keyof CoffeeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<CoffeeStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

// Gør de utypede `useNavigation()`-kald i evt. hjælpekomponenter typede som rod-stakken.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
