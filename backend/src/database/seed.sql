-- Seed initial survey data
INSERT INTO surveys (id, name, description, is_active) 
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'GHAC Donor Survey V1',
  'Greater Hartford Arts Council donor feedback survey',
  true
) ON CONFLICT (id) DO NOTHING;

-- You can add sample questions here if needed