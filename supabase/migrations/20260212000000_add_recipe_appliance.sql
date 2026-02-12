-- Ajout du champ "appliance" (appareil de cuisine) aux recettes
-- Champ optionnel : airfryer, robot_cuiseur, cookeo
ALTER TABLE recipes
ADD COLUMN appliance TEXT DEFAULT NULL
CHECK (appliance IS NULL OR appliance IN ('airfryer', 'robot_cuiseur', 'cookeo'));

-- Index pour filtrer par appareil
CREATE INDEX idx_recipes_appliance ON recipes(appliance) WHERE appliance IS NOT NULL;
