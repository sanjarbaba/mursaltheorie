-- Add answer formats without exposing answer keys to the public question payload.
-- Existing single-choice questions and saved attempts remain valid.

BEGIN;

ALTER TABLE exam_questions_v1
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'single_choice',
  ADD COLUMN IF NOT EXISTS correct_answer JSONB;

UPDATE exam_questions_v1
SET correct_answer = to_jsonb(correct_option)
WHERE correct_answer IS NULL;

ALTER TABLE exam_questions_v1
  DROP CONSTRAINT IF EXISTS exam_questions_v1_question_type_check;

ALTER TABLE exam_questions_v1
  ADD CONSTRAINT exam_questions_v1_question_type_check
  CHECK (question_type IN ('single_choice', 'multiple_response', 'yes_no', 'numeric', 'hotspot'));

ALTER TABLE exam_questions_v1
  ALTER COLUMN correct_answer SET NOT NULL;

ALTER TABLE exam_attempt_answers_v1
  ADD COLUMN IF NOT EXISTS answer JSONB;

UPDATE exam_attempt_answers_v1
SET answer = to_jsonb(selected_option)
WHERE answer IS NULL;

ALTER TABLE exam_attempt_answers_v1
  ALTER COLUMN selected_option DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_questions_v1_category
  ON exam_questions_v1(category)
  WHERE published = TRUE;

INSERT INTO schema_migrations(version, name)
VALUES (26, 'exam_question_types')
ON CONFLICT (version) DO NOTHING;

COMMIT;

