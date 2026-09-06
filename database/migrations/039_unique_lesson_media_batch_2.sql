-- Give another group of lessons a subject-specific image and keep generated
-- exam media aligned with its source lesson.
BEGIN;
WITH release AS (SELECT id FROM content_releases WHERE version=1),
mapping(lesson_number,src) AS (VALUES
  (1,'/images/questions/lesson-001-rijbewijs-kenteken.jpg'),
  (48,'/images/questions/lesson-048-kruispunt-fietsers.jpg'),
  (76,'/images/questions/lesson-076-stoep-vrijhouden.jpg'),
  (79,'/images/questions/lesson-079-laden-lossen.jpg'),
  (81,'/images/Blauwe auto op autoweg met 100-bord.jpg'),
  (102,'/images/questions/lesson-102-grootlicht.jpg'),
  (149,'/images/questions/lesson-149-waarschuwingsdriehoek.jpg')
), updated AS (
  UPDATE course_lessons l SET media=jsonb_build_array(jsonb_build_object('type','image','src',mapping.src,'alt',l.title)),updated_at=NOW()
  FROM mapping WHERE l.release_id=(SELECT id FROM release) AND l.lesson_number=mapping.lesson_number
  RETURNING l.lesson_number,l.media
)
UPDATE exam_questions_v1 q SET media=updated.media,updated_at=NOW()
FROM updated WHERE q.release_id=(SELECT id FROM release) AND q.external_key LIKE 'cbr2026-q%'
AND ((substring(q.external_key FROM '[0-9]+$')::integer-113)/6)+1=updated.lesson_number;

DO $check$ DECLARE mismatches integer; BEGIN
  SELECT count(*) INTO mismatches FROM exam_questions_v1 q JOIN course_lessons l ON l.release_id=q.release_id
  AND l.lesson_number=((substring(q.external_key FROM '[0-9]+$')::integer-113)/6)+1
  WHERE q.release_id=(SELECT id FROM content_releases WHERE version=1) AND q.external_key LIKE 'cbr2026-q%' AND q.media IS DISTINCT FROM l.media;
  IF mismatches<>0 THEN RAISE EXCEPTION 'Generated media mismatches remain: %',mismatches; END IF;
END $check$;
INSERT INTO schema_migrations(version,name) VALUES(39,'unique_lesson_media_batch_2') ON CONFLICT(version) DO NOTHING;
COMMIT;