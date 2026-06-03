import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';

const steps = [
  {
    title: 'Start med slutningen',
    text: 'Vælg hvornår dit brød eller dine boller skal være klar. Så regner vi resten ud.'
  },
  {
    title: 'Vi holder styr på tiden',
    text: 'Du får en enkel tidsplan med timere og næste handling.'
  },
  {
    title: 'Forsinket? Planen følger med',
    text: 'Tryk udført, når du faktisk er færdig. Resten af planen rykker automatisk.'
  }
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Afslut onboarding
      navigation.replace('MainTabs');
    }
  };

  const step = steps[currentStep];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[typography.h1, { textAlign: 'center', marginBottom: 16 }]}>{step.title}</Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>{step.text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, currentStep === index && styles.dotActive]} 
              />
            ))}
          </View>
          
          <Button 
            title={currentStep === steps.length - 1 ? 'Start min første bagning' : 'Næste'} 
            onPress={handleNext} 
          />
          
          {currentStep < steps.length - 1 && (
            <Button 
              title="Spring over" 
              variant="outline" 
              style={{ marginTop: 16, borderWidth: 0 }} 
              onPress={() => navigation.replace('MainTabs')} 
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  }
});
