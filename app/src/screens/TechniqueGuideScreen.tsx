import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { RecipeStep } from '../data/recipes';

const GuideVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  return <VideoView style={styles.video} player={player} nativeControls contentFit="cover" fullscreenOptions={{ enable: true }} />;
};

export const TechniqueGuideScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const step = route.params?.step as RecipeStep | undefined;

  if (!step) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={typography.h2}>Ingen teknik valgt.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const technique = step.technique;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {step.videoUrl && (
          <View style={styles.videoContainer}>
            <GuideVideo uri={step.videoUrl} />
          </View>
        )}

        <Text style={typography.h1}>{step.title}</Text>

        {technique ? (
          <>
            <Text style={[typography.body, { marginBottom: 24 }]}>{technique.summary}</Text>

            <Card>
              <Text style={[typography.h3, { marginBottom: 8 }]}>Sådan ved du, at det går rigtigt</Text>
              {technique.successSigns.map((sign, idx) => (
                <Text key={idx} style={[typography.bodySmall, { marginBottom: 4 }]}>• {sign}</Text>
              ))}
            </Card>

            <Card>
              <Text style={[typography.h3, { marginBottom: 8 }]}>Typiske fejl</Text>
              {technique.commonMistakes.map((mistake, idx) => (
                <Text key={idx} style={[typography.bodySmall, { marginBottom: 4 }]}>• {mistake}</Text>
              ))}
            </Card>
          </>
        ) : (
          <Text style={[typography.body, { marginBottom: 24 }]}>{step.description}</Text>
        )}

        <Button title="Tilbage til bageplan" onPress={() => navigation.goBack()} />
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
  videoContainer: {
    width: width - 48,
    height: 220,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
