import React, { useState, useCallback, useMemo } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Button, Card, RecipeCard, Screen } from '../components';
import { fetchRecipes, Recipe } from '../data/recipes';
import { useSettingsStore } from '../store/settingsStore';
import type { RecipeStackScreenProps } from '../navigation/types';

/**
 * Opskriftsbiblioteket. Selve bagningen starter fra Hjem, hvor fodringen er
 * første trin – herfra læses og skrives der opskrifter, og en opskrift kan
 * sendes ind i bageflowet, som så begynder med fodringen.
 */
export const RecipeListScreen = ({ navigation }: RecipeStackScreenProps<'OpskriftListe'>) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Vis tiderne under brugerens egne standardforhold, så tallet på kortet
  // svarer til den plan opskriften faktisk giver.
  const roomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const starterStrength = useSettingsStore((state) => state.defaultStarterStrength);
  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

  // Hentes ved hvert besøg, så en netop gemt, rettet eller slettet egen
  // opskrift står rigtigt, når man kommer tilbage fra formularen.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadRecipes = async () => {
        setLoading(true);
        const data = await fetchRecipes();
        if (!active) return;
        setRecipes(data);
        setLoading(false);
      };

      loadRecipes();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <Screen>
      <Text style={typography.h1}>Opskrifter</Text>
      <Text style={[typography.body, { marginBottom: spacing.lg }]}>
        Læs dem igennem, eller skriv dine egne. Du kan starte en bagning herfra.
      </Text>

      <Button
        title="Skriv din egen opskrift"
        variant="outline"
        style={{ marginBottom: spacing.xl }}
        onPress={() => navigation.navigate('OpskriftFormular')}
      />

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
        recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            options={options}
            onPress={() => navigation.navigate('OpskriftDetaljer', { recipe })}
          />
        ))
      )}
    </Screen>
  );
};
