-- Get the most recent survey response to analyze the flow
SELECT 
  ROW_NUMBER() OVER (ORDER BY a.answered_at) as q_num,
  a.metadata->>'blockId' as block_id,
  a.answer_text,
  a.answer_choice_ids,
  jsonb_pretty(a.metadata) as full_metadata,
  a.answered_at::time as time
FROM answers a
WHERE a.response_id = (
  SELECT id FROM responses 
  ORDER BY started_at DESC 
  LIMIT 1
)
ORDER BY a.answered_at;