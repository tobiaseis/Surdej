import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { BackButton, Button, Card, Screen, StatusBadge, Timeline, VideoPlayer } from '../components';
import { useBakeStore } from '../store/bakeStore';
import { ActiveBake, getLiveTimerStep, isBakeComplete } from '../utils/scheduleCalculator';
import { formatCountdown, formatTime } from '../utils/dateTime';
import type { HomeStackScreenProps } from '../navigation/types';

const DELAY_MINUTES = 15;

const getCountdownLabel = (bake: ActiveBake | null): string => {
  if (!bake) return '';
  const nextStep = getLiveTimerStep(bake.steps);
  return nextStep ? formatCountdown(nextStep.scheduledAt) : 'Færdig!';
};

export const ActiveBakeScreen = ({ navigation }: HomeStackScreenProps<'AktivBagning'>) => {
  const { activeBake, completeStep, skipStep, delayBake, cancelBake } = useBakeStore();

  // Beregn nedtællingen med det samme, så det store timer-felt aldrig står
  // tomt i det første sekund, før intervallet tikker.
  const [timeLeft, setTimeLeft] = useState(() => getCountdownLabel(activeBake));
  const [feedback, setFeedback] = useState<string | null>(null);

  // Når der ikke er flere trin tilbage, er bagningen færdig.
  useEffect(() => {
    if (!activeBake) {
      // Bagningen er annulleret. Tilbage til toppen af Hjem-stakken – at
      // navigere til selve tab'en ville efterlade denne tomme skærm øverst.
      navigation.popToTop();
      return;
    }
    if (isBakeComplete(activeBake)) {
      navigation.replace('Færdig');
    }
  }, [activeBake, navigation]);

  useEffect(() => {
    if (!activeBake) return;

    const tick = () => setTimeLeft(getCountdownLabel(activeBake));

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [activeBake]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
  };

  if (!activeBake) return null;

  const currentStepIndex = activeBake.steps.findIndex((s) => s.status === 'active');
  const currentStep = currentStepIndex !== -1 ? activeBake.steps[currentStepIndex] : null;
  const hasGuide = !!(currentStep && (currentStep.technique || currentStep.videoUrl));

  return (
    <Screen>
      <BackButton />
      <View style={styles.header}>
        <Text style={[typography.h1, styles.headerTitle]}>{activeBake.recipe.name}</Text>
        <StatusBadge label="I gang" tone="accent" />
      </View>

      {feedback && (
        <Card style={styles.feedbackCard}>
          <Text style={[typography.body, { color: colors.success }]}>{feedback}</Text>
        </Card>
      )}

      {currentStep && (
        <Card style={styles.heroCard}>
          <Text style={typography.h3}>Næste trin: {currentStep.title}</Text>

          {currentStep.videoUrl && (
            <VideoPlayer
              key={currentStep.videoUrl}
              uri={currentStep.videoUrl}
              style={styles.video}
            />
          )}

          <Text style={[typography.h1, { fontSize: currentStep.videoUrl ? 32 : 48, marginVertical: spacing.lg }]}>
            {timeLeft}
          </Text>

          <Text style={typography.bodySmall}>Start kl. {formatTime(currentStep.scheduledAt)}</Text>

          <View style={{ height: spacing.xl }} />
          <Button
            title="Udført"
            onPress={() => {
              completeStep(currentStepIndex);
              showFeedback('Godt klaret! Næste trin er sat i gang.');
            }}
            style={{ backgroundColor: colors.success }}
          />

          <View style={styles.secondaryActions}>
            {hasGuide && (
              <Button
                title="Se teknik"
                variant="outline"
                onPress={() => navigation.navigate('Teknik', { step: currentStep })}
              />
            )}
            <Button
              title="Jeg er forsinket"
              variant="outline"
              onPress={() => {
                delayBake(DELAY_MINUTES);
                showFeedback(`Du er rykket ${DELAY_MINUTES} min. Resten af planen følger med.`);
              }}
            />
            <Button
              title="Spring trin over"
              variant="outline"
              onPress={() => {
                skipStep(currentStepIndex);
                showFeedback('Trin sprunget over.');
              }}
            />
          </View>
        </Card>
      )}

      <Text style={[typography.h3, { marginTop: spacing.xl, marginBottom: spacing.lg }]}>Tidsplan</Text>

      <Timeline steps={activeBake.steps} showStatus />

      <View style={{ height: spacing.xxxl }} />
      <Button title="Annuller bagning" variant="outline" onPress={cancelBake} />
      <View style={{ height: spacing.xxxl }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  /** Uden flex skubber et langt opskriftsnavn "I gang"-badget ud af skærmen. */
  headerTitle: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: colors.successSurface,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  video: {
    marginTop: spacing.lg,
  },
  secondaryActions: {
    width: '100%',
    marginTop: spacing.md,
    /** Samme afstand mellem stablede knapper som på de øvrige skærme. */
    gap: spacing.md,
  },
});
