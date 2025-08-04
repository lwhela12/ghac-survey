-- Get the complete record for the most recent b9 answer
SELECT 
  id,
  response_id,
  question_id,
  answer_text,
  answer_choice_ids,
  video_url,
  metadata,
  metadata->>'blockId' as block_id,
  jsonb_object_keys(metadata) as metadata_keys,
  answered_at
FROM answers 
WHERE metadata->>'blockId' = 'b9'
ORDER BY answered_at DESC
LIMIT 1;

-- Also check if there are ANY answers with metadata containing more than just blockId
SELECT 
  metadata->>'blockId' as block_id,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE jsonb_array_length(jsonb_object_keys(metadata)::jsonb) > 1) as with_extra_data
FROM answers
WHERE metadata IS NOT NULL
GROUP BY metadata->>'blockId'
ORDER BY block_id;