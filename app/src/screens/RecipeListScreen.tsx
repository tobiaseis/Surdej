import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card, Screen, StatusBadge } from '../components';
import { fetchRecipes, Recipe } from '../data/recipes';
import { getRecipeMetaItems } from '../utils/recipeMeta';
import { useSettingsStore } from '../store/settingsStore';
import type { RecipeStackScreenProps } from '../navigation/types';

export const RecipeListScreen = ({ navigation }: RecipeStackScreenProps<'OpskriftListe'>) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Vis tiderne under brugerens egne standardforhold, så tallet på kortet
  // svarer til den plan opskriften faktisk giver.
  const roomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const starterStrength = useSettingsStore((state) => state.defaultStarterStrength);
  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

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
    <Screen>
      <Text style={typography.h1}>Hvad vil du bage?</Text>
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>Vælg en opskrift for at starte en plan.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
      ) : recipes.length === 0 ? (
        <Card>
          <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Ingen opskrifter fundet</Text>
          <Text style={typography.bodySmall}>
            Der er ingen opskrifter at vise lige nu. Tjek din internetforbindelse, og prøv igen.
          </Text>
        </Card>
      ) : (
        recipes.map((recipe) => {
          const metaItems = getRecipeMetaItems(recipe, options);

          return (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => navigation.navigate('OpskriftDetaljer', { recipe })}
              activeOpacity={0.94}
              accessibilityRole="button"
            >
              <Card style={styles.recipeCard}>
                <View style={styles.cardHeader}>
                  <Text style={typography.h2}>{recipe.name}</Text>
                </View>
                <Text style={[typography.body, { marginBottom: spacing.md }]}>{recipe.description}</Text>

                <View style={styles.badges}>
                  {metaItems.map((item) => (
                    <StatusBadge key={item.label} label={item.label} tone={item.tone} />
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  recipeCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
