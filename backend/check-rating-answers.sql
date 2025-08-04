-- Look for any metadata fields that might contain ratings
SELECT 
  question_id,
  answer_text,
  metadata,
  jsonb_object_keys(metadata) as keys
FROM answers 
WHERE metadata::text != '{}'
  AND metadata::text NOT LIKE '%"blockId"%'
LIMIT 20;

-- Check all metadata content to understand the structure
SELECT DISTINCT
  jsonb_object_keys(metadata) as metadata_keys
FROM answers
WHERE metadata IS NOT NULL;

-- Look at specific answers to understand the data
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata
FROM answers
WHERE answer_text IS NULL 
  AND answer_choice_ids IS NOT NULL
  AND array_length(answer_choice_ids, 1) > 0
ORDER BY answered_at DESC
LIMIT 10;