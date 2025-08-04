-- Check a response that should have all questions
SELECT 
  ROW_NUMBER() OVER (ORDER BY a.answered_at) as q_num,
  a.metadata->>'blockId' as block_id,
  SUBSTRING(a.answer_text, 1, 30) as answer_preview,
  a.answer_choice_ids,
  a.answered_at::time as time_answered
FROM answers a
WHERE a.response_id = (
  -- Find a response with b11 answer
  SELECT DISTINCT response_id 
  FROM answers 
  WHERE metadata->>'blockId' = 'b11'
  LIMIT 1
)
ORDER BY a.answered_at;

-- Check another response flow
SELECT 
  ROW_NUMBER() OVER (ORDER BY a.answered_at) as q_num,
  a.metadata->>'blockId' as block_id,
  SUBSTRING(a.answer_text, 1, 30) as answer_preview,
  a.answer_choice_ids
FROM answers a
WHERE a.response_id = (
  -- Find a response WITHOUT b11
  SELECT DISTINCT r.id
  FROM responses r
  WHERE NOT EXISTS (
    SELECT 1 FROM answers a2 
    WHERE a2.response_id = r.id 
    AND a2.metadata->>'blockId' = 'b11'
  )
  AND EXISTS (
    SELECT 1 FROM answers a3 
    WHERE a3.response_id = r.id
  )
  LIMIT 1
)
ORDER BY a.answered_at;