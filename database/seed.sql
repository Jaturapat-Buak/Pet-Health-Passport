INSERT INTO users (name, email, password_hash, role) VALUES
  ('Milo Owner', 'owner@example.com', crypt('password123', gen_salt('bf')), 'owner'),
  ('Dr. Vet', 'vet@example.com', crypt('password123', gen_salt('bf')), 'vet'),
  ('System Admin', 'admin@example.com', crypt('password123', gen_salt('bf')), 'admin');

WITH owner_user AS (
  SELECT id FROM users WHERE email = 'owner@example.com'
), milo AS (
  INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, color, weight, medical_notes)
  SELECT id, 'Milo', 'Cat', 'Domestic Shorthair', 'Male', '2023-04-12', 'Orange', 4.50, 'Food allergy: chicken.'
  FROM owner_user
  RETURNING id, owner_id
)
INSERT INTO vaccination_records (pet_id, vaccine_name, date_received, next_due_date, clinic_name, vet_name, notes)
SELECT id, 'Rabies Vaccine', CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '4 months', 'Happy Pet Clinic', 'Dr. Vet', 'Annual rabies vaccination.'
FROM milo;

INSERT INTO pet_vet_access (pet_id, vet_id, granted_by)
SELECT p.id, v.id, p.owner_id FROM pets p
JOIN users v ON v.email = 'vet@example.com'
WHERE p.name = 'Milo';

WITH milo AS (
  SELECT id, owner_id FROM pets WHERE name = 'Milo' LIMIT 1
)
INSERT INTO allergy_records (pet_id, allergy_type, allergen_name, reaction, severity, notes)
SELECT id, 'food', 'Chicken', 'Vomiting and skin irritation', 'medium', 'Avoid chicken-based food.'
FROM milo;

WITH milo AS (
  SELECT id, owner_id FROM pets WHERE name = 'Milo' LIMIT 1
)
INSERT INTO medical_records (pet_id, created_by, visit_date, clinic_name, vet_name, symptoms, diagnosis, treatment, follow_up_date)
SELECT id, (SELECT id FROM users WHERE email = 'vet@example.com'), CURRENT_DATE - INTERVAL '15 days', 'Happy Pet Clinic', 'Dr. Vet', 'Loss of appetite', 'Mild stomach irritation', 'Medication and diet control', CURRENT_DATE + INTERVAL '2 days'
FROM milo;

WITH milo AS (
  SELECT id, owner_id FROM pets WHERE name = 'Milo' LIMIT 1
)
INSERT INTO appointments (pet_id, owner_id, appointment_date, clinic_name, purpose, status, notes)
SELECT id, owner_id, (CURRENT_DATE + INTERVAL '5 days' + INTERVAL '10 hours') AT TIME ZONE 'Asia/Bangkok', 'Happy Pet Clinic', 'Follow-up checkup', 'upcoming', 'Bring recent food notes.'
FROM milo;

WITH milo AS (
  SELECT id, owner_id FROM pets WHERE name = 'Milo' LIMIT 1
)
INSERT INTO weight_records (pet_id, weight, record_date, notes)
SELECT id, 4.50, CURRENT_DATE - INTERVAL '15 days', 'Recorded during clinic visit.'
FROM milo;

