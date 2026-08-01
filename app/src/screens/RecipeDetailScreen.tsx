import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { spacing, typography } from '../theme';
import { BackButton, BottomBar, Button, Card, RecipeSummary, Screen } from '../components';
import { deleteUserRecipe } from '../data/userRecipes';
import { useSettingsStore } from '../store/settingsStore';
import type { RecipeStackScreenProps } from '../navigation/types';

export const RecipeDetailScreen = ({ navigation, route }: RecipeStackScreenProps<'OpskriftDetaljer'>) => {
  const recipe = route.params?.recipe;

  const roomTempC = useSettingsStore((state) => state.defaultRoomTempC);
  const starterStrength = useSettingsStore((state) => state.defaultStarterStrength);
  const options = useMemo(() => ({ roomTempC, starterStrength }), [roomTempC, starterStrength]);

  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    if (!recipe) return;

    Alert.alert(
      'Slet opskriften?',
      `"${recipe.name}" bliver slettet. Dine dagbogsindlæg beholder deres kopi af opskriften.`,
      [
        { text: 'Fortryd', style: 'cancel' },
        {
          text: 'Slet',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const deleted = await deleteUserRecipe(recipe.id);
            setDeleting(false);

            if (!deleted) {
              Alert.alert(
                'Kunne ikke slette',
                'Opskriften blev ikke slettet. Tjek din internetforbindelse, og prøv igen.'
              );
              return;
            }

            navigation.navigate('OpskriftListe');
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <Screen scroll={false}>
        <BackButton />
        <Text style={typography.h2}>Opskrift ikke fundet.</Text>
      </Screen>
    );
  }

  return (
    <>
      <Screen withBottomBar>
        <BackButton />
        <RecipeSummary recipe={recipe} options={options} />

        {recipe.isCustom && (
          <Card style={styles.infoCard}>
            <Text style={[typography.h3, { marginBottom: spacing.sm }]}>Din egen opskrift</Text>
            <Text style={[typography.bodySmall, { marginBottom: spacing.lg }]}>
              Ret den til, når du har fundet ud af, hvad der virker.
            </Text>
            <Button
              title="Rediger opskrift"
              variant="outline"
              onPress={() => navigation.navigate('OpskriftFormular', { recipe })}
            />
            <Button
              title="Slet opskrift"
              variant="danger"
              loading={deleting}
              style={{ marginTop: spacing.md }}
              onPress={confirmDelete}
            />
          </Card>
        )}
      </Screen>

      <BottomBar>
        {/*
          Bagningen begynder altid med fodringen. Opskriften følger med, så
          flowets trin "vis opskrifter" og "vælg opskrift" springes over.
        */}
        <Button
          title="Bag denne – start med fodring"
          onPress={() => navigation.navigate('Hjem', { screen: 'Fodring', params: { recipe } })}
        />
      </BottomBar>
    </>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    marginBottom: spacing.lg,
  },
});
