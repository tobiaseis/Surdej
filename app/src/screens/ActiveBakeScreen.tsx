import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useBakeStore } from '../store/bakeStore';
import { getLiveTimerStep, isBakeComplete } from '../utils/scheduleCalculator';

const DELAY_MINUTES = 15;

const GuideVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      nativeControls
      contentFit="cover"
      fullscreenOptions={{ enable: true }}
    />
  );
};

export const ActiveBakeScreen = () => {
  const navigation = useNavigation<any>();
  const { activeBake, completeStep, skipStep, delayBake, cancelBake } = useBakeStore();

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Når der ikke er flere trin tilbage, er bagningen færdig.
  useEffect(() => {
    if (!activeBake) {
      navigation.navigate('Hjem');
      return;
    }
    if (isBakeComplete(activeBake)) {
      navigation.replace('Færdig');
    }
  }, [activeBake, navigation]);

  useEffect(() => {
    if (!activeBake) return;

    const interval = setInterval(() => {
      const nextStep = getLiveTimerStep(activeBake.steps);

      if (nextStep) {
        const now = new Date();
        const target = new Date(nextStep.scheduledAt);
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('00:00:00');
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);

          const pad = (num: number) => num.toString().padStart(2, '0');
          setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
        }
      } else {
        setTimeLeft('Færdig!');
      }
    }, 1000);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h1}>{activeBake.recipe.name}</Text>
          <StatusBadge label="I gang" status="active" />
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
              <View style={styles.videoContainer}>
                <GuideVideo key={currentStep.videoUrl} uri={currentStep.videoUrl} />
              </View>
            )}

            <Text style={[typography.h1, { fontSize: currentStep.videoUrl ? 32 : 48, marginVertical: 16 }]}>
              {timeLeft}
            </Text>

            <Text style={typography.bodySmall}>
              Start kl. {currentStep.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            <View style={{ height: 24 }} />
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
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Teknik', { step: currentStep })}
                />
              )}
              <Button
                title="Jeg er forsinket"
                variant="outline"
                style={styles.secondaryButton}
                onPress={() => {
                  delayBake(DELAY_MINUTES);
                  showFeedback(`Du er rykket ${DELAY_MINUTES} min. Resten af planen følger med.`);
                }}
              />
              <Button
                title="Spring trin over"
                variant="outline"
                style={styles.secondaryButton}
                onPress={() => {
                  skipStep(currentStepIndex);
                  showFeedback('Trin sprunget over.');
                }}
              />
            </View>
          </Card>
        )}

        <Text style={[typography.h3, { marginTop: 24, marginBottom: 16 }]}>Tidsplan</Text>

        <View style={styles.timeline}>
          {activeBake.steps.map((step, index) => {
            const isLast = index === activeBake.steps.length - 1;
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <View key={step.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <Text style={[typography.bodySmall, { fontWeight: '600', color: isCompleted ? colors.success : colors.textMain }]}>
                    {step.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.timelineCenter}>
                  <View style={[styles.dot, isCompleted && styles.dotCompleted, isActive && styles.dotActive]} />
                  {!isLast && <View style={[styles.line, isCompleted && styles.lineCompleted]} />}
                </View>
                <View style={styles.timelineRight}>
                  <Text style={[typography.h3, isCompleted && { color: colors.success, textDecorationLine: 'line-through' }]}>
                    {step.title}
                  </Text>
                  <Text style={typography.bodySmall}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
        <Button title="Annuller bagning" variant="outline" onPress={cancelBake} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackCard: {
    backgroundColor: '#EAF2EC',
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  videoContainer: {
    width: width - 80,
    height: 200,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  secondaryActions: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  secondaryButton: {
    marginTop: 0,
  },
  timeline: {
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 2,
  },
  timelineCenter: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginTop: 6,
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: -6,
    marginBottom: -6,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 32,
  },
});
