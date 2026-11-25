-- Replace the schematic illustration with the approved realistic matrix-sign scene.
-- The prompt, answer key, question IDs and exam composition remain unchanged.
-- Deploy the image before applying this migration.
WITH repaired_lessons AS (
 UPDATE course_lessons l
 SET media=jsonb_set(l.media,'{0,src}','"/images/questions/matrix-red-cross-realistic-20261125.jpg"'::jsonb), updated_at=now()
 WHERE l.published AND l.lesson_number=86
   AND EXISTS(SELECT 1 FROM content_releases r WHERE r.id=l.release_id AND r.status='published')
 RETURNING l.release_id
), repaired_questions AS (
 UPDATE exam_questions_v1 q
 SET media=jsonb_set(q.media,'{0,src}','"/images/questions/matrix-red-cross-realistic-20261125.jpg"'::jsonb), updated_at=now()
 WHERE q.published AND q.release_id IN (SELECT release_id FROM repaired_lessons)
   AND q.external_key IN ('cbr2026-q623','cbr2026-q624','cbr2026-q625','cbr2026-q626','cbr2026-q627','cbr2026-q628')
 RETURNING q.external_key
), recorded AS (
 INSERT INTO schema_migrations(version,name)
 SELECT 51,'realistic_matrix_sign_image' WHERE EXISTS(SELECT FROM repaired_lessons)
 ON CONFLICT(version) DO NOTHING
)
SELECT (SELECT count(*) FROM repaired_lessons) repaired_lessons,
       (SELECT count(*) FROM repaired_questions) repaired_exam_questions;
