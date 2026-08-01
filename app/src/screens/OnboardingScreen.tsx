import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Button, Screen } from '../components';
import { useSettingsStore } from '../store/settingsStore';
import type { RootStackScreenProps } from '../navigation/types';

const steps = [
  {
    title: 'Det starter med surdejen',
    text: 'Fodr surdejen, vælg en opskrift – så lægger vi resten af planen for dig.'
  },
  {
    title: 'Du bestemmer tidspunktet',
    text: 'Fodrer du nu, siger vi hvornår det er færdigt. Skal det være klar til et bestemt tidspunkt, siger vi hvornår du skal fodre.'
  },
  {
    title: 'Forsinket? Planen følger med',
    text: 'Tryk udført, når du faktisk er færdig. Resten af planen rykker automatisk.'
  }
];

export const OnboardingScreen = ({ navigation }: RootStackScreenProps<'Onboarding'>) => {
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const [currentStep, setCurrentStep] = useState(0);

  // Husk at onboarding er set, så den ikke vises igen ved næste app-start.
  const finishOnboarding = () => {
    completeOnboarding();
    navigation.replace('MainTabs');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const step = steps[currentStep];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <View style={styles.content}>
        <Text style={[typography.h1, { textAlign: 'center', marginBottom: spacing.lg }]}>{step.title}</Text>
        <Text style={[typography.body, { textAlign: 'center' }]}>{step.text}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View key={index} style={[styles.dot, currentStep === index && styles.dotActive]} />
          ))}
        </View>

        <Button
          title={currentStep === steps.length - 1 ? 'Start min første bagning' : 'Næste'}
          onPress={handleNext}
        />

        {currentStep < steps.length - 1 && (
          <Button
            title="Spring over"
            variant="ghost"
            style={{ marginTop: spacing.md }}
            onPress={finishOnboarding}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.sm / 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: spacing.xl,
  },
});
