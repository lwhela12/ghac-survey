-- Check the full content of answers that appear empty
SELECT 
  metadata->>'blockId' as block_id,
  answer_text,
  answer_choice_ids,
  metadata::text as full_metadata,
  LENGTH(answer_text) as text_length,
  CASE 
    WHEN answer_text IS NULL THEN 'NULL'
    WHEN answer_text = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE'
  END as text_status
FROM answers
WHERE metadata->>'blockId' IN ('b6', 'b7', 'b9', 'b10', 'b12', 'b18', 'b20')
ORDER BY metadata->>'blockId'
LIMIT 20;