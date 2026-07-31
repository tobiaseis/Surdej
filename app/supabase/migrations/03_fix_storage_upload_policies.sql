-- Migration: 03_fix_storage_upload_policies.sql
-- Formål: Upload af billeder blev afvist, fordi policyerne brugte auth.role().
--
-- auth.role() er en legacy-funktion, der læser JWT-claimet på den gamle sti og
-- returnerer NULL på nyere projekter. Så fejler "auth.role() = 'authenticated'"
-- selv for en korrekt indlogget bruger. auth.uid() IS NOT NULL er robust og
-- dækker også anonyme sessioner, som er dem appen bruger.
--
-- Sikker at køre flere gange.

-- Bucketsne oprettes igen, hvis en tidligere migration ikke nåede igennem.
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary_images', 'diary_images', true), ('coffee_images', 'coffee_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload diary images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload coffee images" ON storage.objects;

CREATE POLICY "Signed in users can upload diary images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'diary_images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Signed in users can upload coffee images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'coffee_images' AND auth.uid() IS NOT NULL);
