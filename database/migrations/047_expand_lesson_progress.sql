BEGIN;

ALTER TABLE lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_check,
  ADD CONSTRAINT lesson_progress_lesson_id_check CHECK (lesson_id BETWEEN 1 AND 10000);

INSERT INTO schema_migrations(version, name)
VALUES (47, 'expand_lesson_progress')
ON CONFLICT (version) DO NOTHING;

COMMIT;
