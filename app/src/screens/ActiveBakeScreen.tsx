import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useBakeStore } from '../store/bakeStore';
import { getLiveTimerStep } from '../utils/scheduleCalculator';

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
  const { activeBake, completeStep, cancelBake } = useBakeStore();
  
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!activeBake) {
      navigation.navigate('Hjem');
      return;
    }

    const interval = setInterval(() => {
      const nextStep = getLiveTimerStep(activeBake.steps);
      
      if (nextStep) {
        const now = new Date();
        const target = new Date(nextStep.scheduledAt);
        const diff = target.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('00:00:00');
        } else {
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
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

  if (!activeBake) return null;

  const currentStepIndex = activeBake.steps.findIndex(s => s.status === 'active');
  const currentStep = currentStepIndex !== -1 ? activeBake.steps[currentStepIndex] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h1}>{activeBake.recipe.name}</Text>
          <StatusBadge label="I gang" status="active" />
        </View>

        {currentStep && (
          <Card style={styles.heroCard}>
            <Text style={typography.h3}>Næste trin: {currentStep.title}</Text>
            
            {currentStep.videoUrl && (
              <View style={styles.videoContainer}>
                <GuideVideo key={currentStep.videoUrl} uri={currentStep.videoUrl} />
              </View>
            )}

            {!currentStep.videoUrl && (
              <Text style={[typography.h1, { fontSize: 48, marginVertical: 16 }]}>{timeLeft}</Text>
            )}
            
            {currentStep.videoUrl && (
              <Text style={[typography.h2, { marginTop: 12 }]}>{timeLeft}</Text>
            )}

            <Text style={typography.bodySmall}>Start kl. {currentStep.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            
            <View style={{ height: 24 }} />
            <Button 
              title="Udført" 
              onPress={() => completeStep(currentStepIndex)} 
              style={{ backgroundColor: colors.success }}
            />
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  videoContainer: {
    width: width - 80, // Card padding minus margin
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
