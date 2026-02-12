-- Fix : Ambiguïté de nom entre variable et colonne "code" dans generate_family_code()

CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result_code TEXT := '';
  i INTEGER;
BEGIN
  LOOP
    result_code := '';
    FOR i IN 1..6 LOOP
      result_code := result_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM family_groups WHERE family_groups.code = result_code);
  END LOOP;
  RETURN result_code;
END;
$$ LANGUAGE plpgsql;
