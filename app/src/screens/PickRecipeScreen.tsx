import React, { useCallback, useMemo, useState } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { BackButton, Card, RecipeCard, Screen, StepHeader } from '../components';
import { fetchRecipes, Recipe } from '../data/recipes';
import { getEndTimeFromFeed, withFeedStep } from '../utils/bakePlan';
import { formatWeekdayTime } from '../utils/dateTime';
import type { HomeStackScreenProps } from '../navigation/types';

/**
 * Bageflowets trin 2. Fodringen er valgt, så tiderne på kortene er ikke
 * længere opskriftens egne – de tæller den fodring med, brugeren lige har
 * lagt. Fodrer hun nu, står der også hvornår bagværket er færdigt.
 */
export const PickRecipeScreen = ({ navigation, route }: HomeStackScreenProps<'VaelgOpskrift'>) => {
  const { flow } = route.params;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const options = useMemo(
    () => ({ roomTempC: flow.roomTempC, starterStrength: flow.starterStrength }),
    [flow.roomTempC, flow.starterStrength]
  );

  const fedAt = flow.fedAt ? new Date(flow.fedAt) : null;

  // Hentes ved hvert besøg, så en netop gemt egen opskrift er med i flowet.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadRecipes = async () => {
        setLoading(true);
        const data = await fetchRecipes();
        if (!active) return;
        setRecipes(data);
        setLoading(false);
      };

      loadRecipes();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Screen>
      <BackButton />
      <StepHeader step={2} />

      <Text style={typography.h1}>Hvad vil du bage?</Text>
      <Text style={[typography.body, { marginBottom: spacing.lg }]}>
        {fedAt
          ? 'Tiderne er regnet med din fodring som første trin.'
          : 'Tiderne tæller fodringen med. Sluttidspunktet vælger du bagefter.'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : recipes.length === 0 ? (
        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Ingen opskrifter fundet</Text>
          <Text style={typography.bodySmall}>
            Der er ingen opskrifter at vise lige nu. Tjek din internetforbindelse, og prøv igen.
          </Text>
        </Card>
      ) : (
        recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            // Planens udgave af opskriften, så det viste timetal er den tid,
            // bagningen faktisk tager – fodringen med.
            recipe={withFeedStep(recipe, flow.feed)}
            options={options}
            footnote={
              fedAt
                ? `Færdig ${formatWeekdayTime(getEndTimeFromFeed(recipe, flow.feed, fedAt, options))}`
                : undefined
            }
            onPress={() => navigation.navigate('OpskriftIPlan', { recipe, flow })}
          />
        ))
      )}
    </Screen>
  );
};
