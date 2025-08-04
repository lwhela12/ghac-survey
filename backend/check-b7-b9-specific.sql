-- Check b7 answers specifically
SELECT 
  metadata->>'blockId' as block_id,
  answer_text,
  answer_choice_ids,
  metadata::text as full_metadata
FROM answers
WHERE metadata->>'blockId' = 'b7'
LIMIT 5;

-- Check b9 answers specifically
SELECT 
  metadata->>'blockId' as block_id,
  answer_text,
  answer_choice_ids,
  metadata::text as full_metadata
FROM answers
WHERE metadata->>'blockId' = 'b9'
LIMIT 5;

-- Check if there's any answer with complex metadata beyond blockId
SELECT 
  metadata->>'blockId' as block_id,
  answer_text,
  jsonb_pretty(metadata) as pretty_metadata
FROM answers
WHERE jsonb_array_length(COALESCE((SELECT jsonb_agg(key) FROM jsonb_object_keys(metadata) key), '[]'::jsonb)) > 1
LIMIT 10;