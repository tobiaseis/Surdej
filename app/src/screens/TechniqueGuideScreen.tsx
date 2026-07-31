import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';
import { BackButton, Button, Card, Screen, VideoPlayer } from '../components';
import type { HomeStackScreenProps } from '../navigation/types';

export const TechniqueGuideScreen = ({ navigation, route }: HomeStackScreenProps<'Teknik'>) => {
  const step = route.params?.step;

  if (!step) {
    return (
      <Screen scroll={false}>
        <BackButton />
        <Text style={typography.h2}>Ingen teknik valgt.</Text>
      </Screen>
    );
  }

  const technique = step.technique;

  return (
    <Screen>
      <BackButton />
      {step.videoUrl && <VideoPlayer uri={step.videoUrl} height={220} style={styles.video} />}

      <Text style={typography.h1}>{step.title}</Text>

      {technique ? (
        <>
          <Text style={[typography.body, { marginBottom: spacing.xl }]}>{technique.summary}</Text>

          <Card>
            <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Sådan ved du, at det går rigtigt</Text>
            {technique.successSigns.map((sign, idx) => (
              <Text key={idx} style={[typography.bodySmall, { marginBottom: spacing.xs }]}>• {sign}</Text>
            ))}
          </Card>

          <Card>
            <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Typiske fejl</Text>
            {technique.commonMistakes.map((mistake, idx) => (
              <Text key={idx} style={[typography.bodySmall, { marginBottom: spacing.xs }]}>• {mistake}</Text>
            ))}
          </Card>
        </>
      ) : (
        <Text style={[typography.body, { marginBottom: spacing.xl }]}>{step.description}</Text>
      )}

      <Button title="Tilbage til bageplan" onPress={() => navigation.goBack()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  video: {
    marginBottom: spacing.xl,
  },
});
