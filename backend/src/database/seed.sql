-- Insert the GHAC Donor Survey
INSERT INTO surveys (id, name, description, is_active) 
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'GHAC Donor Survey',
    'Greater Hartford Arts Council donor feedback survey',
    true
) ON CONFLICT (id) DO NOTHING;