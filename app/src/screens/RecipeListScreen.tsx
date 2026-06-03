import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { fetchRecipes, Recipe } from '../data/recipes';

export const RecipeListScreen = () => {
  const navigation = useNavigation<any>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      const data = await fetchRecipes();
      setRecipes(data);
      setLoading(false);
    };
    loadRecipes();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Hvad vil du bage?</Text>
        <Text style={[typography.body, { marginBottom: 24 }]}>Vælg en opskrift for at starte en plan.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          recipes.map((recipe) => {
            const totalMinutes = recipe.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
            const totalHours = Math.round(totalMinutes / 60);

            return (
              <TouchableOpacity 
                key={recipe.id} 
                onPress={() => {
                  navigation.navigate('OpskriftDetaljer', { recipe });
                }}
                activeOpacity={0.8}
              >
                <Card style={styles.recipeCard}>
                  <View style={styles.cardHeader}>
                    <Text style={typography.h2}>{recipe.name}</Text>
                    <StatusBadge label={`${totalHours} timer`} status="info" />
                  </View>
                  <Text style={[typography.body, { marginBottom: 12 }]}>{recipe.description}</Text>
                  
                  <View style={styles.badges}>
                    <StatusBadge label="Let" status="completed" />
                    <View style={{ width: 8 }} />
                    <StatusBadge label="Koldhævning" status="info" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
  },
  recipeCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
  }
});
