import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Recipe, RecipeStep } from '../data/recipes';
import type { DiaryEntry } from '../data/diary';
import type { FeedPlan } from '../utils/bakePlan';
import type { StarterStrength } from '../utils/scheduleCalculator';

/**
 * Route-navne og deres parametre for hver navigator. Alle skærme henter deres
 * `navigation`/`route` herfra, så et forkert route-navn eller en manglende
 * parameter bliver en compilerfejl i stedet for en fejl på telefonen.
 */

/**
 * Det bageflowets første trin fandt ud af, båret med gennem de næste trin.
 * Bageplanen kan ikke lægges uden en fodring, så den følger med hele vejen.
 */
export type BakeFlow = {
  feed: FeedPlan;
  roomTempC: number;
  starterStrength: StarterStrength;
  /**
   * ISO-streng, fordi Date ikke kan serialiseres i navigation-params.
   * Sat når brugeren fodrer nu – så regnes planen forlæns herfra. Er den
   * ikke sat, vælger brugeren sluttidspunktet, og planen regnes baglæns.
   */
  fedAt?: string;
};

/**
 * Bageflowet: fodr surdej → vis opskrifter → vælg opskrift → gå i gang.
 * Det ligger i Hjem-stakken, fordi det ender i den aktive bagning.
 */
export type HomeStackParamList = {
  HomeMain: undefined;
  /** Trin 1. Kommer man med en opskrift i hånden, springes trin 2 og 3 over. */
  Fodring: { recipe?: Recipe } | undefined;
  /** Trin 2 */
  VaelgOpskrift: { flow: BakeFlow };
  /** Trin 3 */
  OpskriftIPlan: { recipe: Recipe; flow: BakeFlow };
  /** Trin 4 */
  GaaIGang: { recipe: Recipe; flow: BakeFlow };
  AktivBagning: undefined;
  Teknik: { step: RecipeStep };
  Færdig: undefined;
  Indstillinger: undefined;
};

/** Opskrifts-fanen er et bibliotek: læs, skriv og ret opskrifter. */
export type RecipeStackParamList = {
  OpskriftListe: undefined;
  OpskriftDetaljer: { recipe: Recipe };
  /** Uden opskrift oprettes en ny; med opskrift redigeres den. */
  OpskriftFormular: { recipe?: Recipe } | undefined;
};

export type DiaryStackParamList = {
  DagbogListe: undefined;
  /** Indlægget sendes med som det er – felterne er tekst og tal, så det kan serialiseres. */
  DagbogIndlaeg: { entry: DiaryEntry };
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
  Dagbog: NavigatorScreenParams<DiaryStackParamList> | undefined;
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

export type DiaryStackScreenProps<T extends keyof DiaryStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DiaryStackParamList, T>,
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
