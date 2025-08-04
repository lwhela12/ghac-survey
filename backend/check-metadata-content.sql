-- Check metadata content excluding blockId
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata,
  metadata - 'blockId' as metadata_without_blockid
FROM answers
WHERE metadata IS NOT NULL 
  AND jsonb_array_length(jsonb_object_keys(metadata)::jsonb) > 1
LIMIT 20;

-- Try another approach to find complex metadata
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata::text as metadata_text,
  length(metadata::text) as metadata_length
FROM answers
WHERE metadata IS NOT NULL
  AND length(metadata::text) > 20
ORDER BY length(metadata::text) DESC
LIMIT 10;