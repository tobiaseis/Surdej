import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';
import { BackButton, BottomBar, Button, Card, RecipeSummary, Screen, StepHeader } from '../components';
import { formatFeedAmounts, withFeedStep } from '../utils/bakePlan';
import { formatRatio } from '../utils/starterFeed';
import type { HomeStackScreenProps } from '../navigation/types';

/**
 * Bageflowets trin 3. Her læses opskriften igennem, inden planen lægges.
 * Fodringen står med, så det er tydeligt, at den er trin ét og ikke noget,
 * der skal huskes ved siden af.
 */
export const PlanRecipeScreen = ({ navigation, route }: HomeStackScreenProps<'OpskriftIPlan'>) => {
  const { recipe, flow } = route.params;

  const options = useMemo(
    () => ({ roomTempC: flow.roomTempC, starterStrength: flow.starterStrength }),
    [flow.roomTempC, flow.starterStrength]
  );

  const planRecipe = useMemo(() => withFeedStep(recipe, flow.feed), [recipe, flow.feed]);

  return (
    <>
      <Screen withBottomBar>
        <BackButton />
        <StepHeader step={3} />

        <RecipeSummary recipe={planRecipe} options={options} />

        <Card style={styles.feedCard}>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Din fodring er trin 1</Text>
          <Text style={typography.bodySmall}>
            {formatFeedAmounts(flow.feed)} ({formatRatio(flow.feed.ratio)}).
          </Text>
          <Text style={typography.bodySmall}>
            Opskriftens eget fodringstrin er skiftet ud med dit, så tiderne passer til dit forhold.
          </Text>
        </Card>
      </Screen>

      <BottomBar>
        <Button
          title="Brug denne opskrift"
          onPress={() => navigation.navigate('GaaIGang', { recipe, flow })}
        />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  feedCard: {
    marginBottom: spacing.lg,
  },
});
