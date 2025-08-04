-- Check for semantic differential answers (b9)
SELECT 
  question_id,
  answer_text,
  answer_choice_ids,
  metadata,
  metadata->>'blockId' as block_id
FROM answers
WHERE metadata->>'blockId' = 'b9'
   OR question_id LIKE '%b9%'
LIMIT 10;

-- Check the sequence of answers for a recent response
SELECT 
  a.question_id,
  a.answer_text,
  a.answer_choice_ids,
  a.metadata,
  a.metadata->>'blockId' as block_id,
  a.answered_at
FROM answers a
WHERE a.response_id = (
  SELECT id FROM responses 
  WHERE completed_at IS NOT NULL 
  ORDER BY completed_at DESC 
  LIMIT 1
)
ORDER BY a.answered_at;