-- Check if ANY answers have metadata with more than just blockId
SELECT 
  metadata->>'blockId' as block_id,
  metadata,
  jsonb_pretty(metadata) as pretty_metadata
FROM answers
WHERE metadata IS NOT NULL
  AND jsonb_object_keys(metadata) != 'blockId'
LIMIT 10;

-- Alternative: find metadata with more than 1 key
SELECT 
  metadata->>'blockId' as block_id,
  metadata,
  (SELECT COUNT(*) FROM jsonb_object_keys(metadata)) as key_count
FROM answers
WHERE metadata IS NOT NULL
  AND (SELECT COUNT(*) FROM jsonb_object_keys(metadata)) > 1
LIMIT 10;