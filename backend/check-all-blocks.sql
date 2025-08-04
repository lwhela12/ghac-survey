-- Check all unique blockIds in the database
SELECT DISTINCT 
  metadata->>'blockId' as block_id,
  COUNT(*) as answer_count
FROM answers
WHERE metadata IS NOT NULL
GROUP BY metadata->>'blockId'
ORDER BY block_id;

-- Look at a complete survey response to see the flow
SELECT 
  ROW_NUMBER() OVER (ORDER BY a.answered_at) as question_num,
  a.answer_text,
  a.answer_choice_ids,
  a.metadata->>'blockId' as block_id,
  a.answered_at
FROM answers a
WHERE a.response_id = (
  SELECT r.id 
  FROM responses r
  JOIN answers a2 ON r.id = a2.response_id
  GROUP BY r.id
  HAVING COUNT(a2.id) > 10
  ORDER BY MAX(a2.answered_at) DESC
  LIMIT 1
)
ORDER BY a.answered_at;