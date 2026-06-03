import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { fetchRecipes, Recipe } from '../data/recipes';
import { getRecipeMetaItems } from '../utils/recipeMeta';

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
            const metaItems = getRecipeMetaItems(recipe);

            return (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => navigation.navigate('OpskriftDetaljer', { recipe })}
                activeOpacity={0.94}
              >
                <Card style={styles.recipeCard}>
                  <View style={styles.cardHeader}>
                    <Text style={typography.h2}>{recipe.name}</Text>
                  </View>
                  <Text style={[typography.body, { marginBottom: 12 }]}>{recipe.description}</Text>

                  <View style={styles.badges}>
                    {metaItems.map((item) => (
                      <StatusBadge key={item.label} label={item.label} status={item.status} />
                    ))}
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  recipeCard: {
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
