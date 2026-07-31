import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius } from '../theme';

interface VideoPlayerProps {
  uri: string;
  /** Højde på afspilleren. Bredden følger den omgivende beholder. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Teknik-video i loop med indbyggede kontroller og fuldskærm. */
export const VideoPlayer = ({ uri, height = 200, style }: VideoPlayerProps) => {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  return (
    <View style={[styles.container, { height }, style]}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        contentFit="cover"
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.videoBackground,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
