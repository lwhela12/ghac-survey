-- Check answers with answer_choice_ids (multiple choice)
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata
FROM answers 
WHERE answer_choice_ids IS NOT NULL AND array_length(answer_choice_ids, 1) > 0
LIMIT 10;

-- Check answers with metadata containing ratings or other complex data
SELECT 
  question_id,
  answer_text,
  metadata,
  metadata->>'rating' as rating,
  metadata->>'scale' as scale,
  metadata->>'value' as value
FROM answers 
WHERE metadata::text != '{}' 
  AND metadata::text NOT LIKE '%blockId%'
LIMIT 10;

-- Check for rating questions specifically
SELECT DISTINCT
  question_id,
  answer_text,
  metadata
FROM answers
WHERE question_id IN (
  'c4fc3b8d-3b84-ce7f-d63f-d60308c87d77', -- b10 rating
  '96c07241-7275-7866-f29f-ebe1c9012797', -- b11 arts orgs
  'dac11ae6-5331-2fdb-4532-0d70c63861f9'  -- b9 attributes
)
ORDER BY question_id;