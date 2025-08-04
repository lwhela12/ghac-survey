-- Check what's in the responses table
SELECT id, survey_id, respondent_name, started_at, completed_at 
FROM responses 
LIMIT 5;

-- Check what's in the answers table
SELECT id, response_id, question_id, answer_text, answered_at 
FROM answers 
LIMIT 10;

-- Check what's in the questions table
SELECT id, survey_id, question_text, question_type 
FROM questions 
LIMIT 10;

-- Check if question IDs in answers match question IDs in questions table
SELECT DISTINCT a.question_id as answer_question_id, q.id as question_table_id
FROM answers a
LEFT JOIN questions q ON a.question_id = q.id
LIMIT 10;

-- Count answers that have matching questions
SELECT 
  COUNT(*) as total_answers,
  COUNT(q.id) as answers_with_matching_questions
FROM answers a
LEFT JOIN questions q ON a.question_id = q.id;