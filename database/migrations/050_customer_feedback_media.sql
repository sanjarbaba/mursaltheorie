-- Customer screenshots reviewed 2026-11-25.
-- Preserve lesson IDs, question IDs, answers and exam composition.
-- Images must be deployed before this migration is applied.
WITH fixes AS (
 SELECT * FROM jsonb_to_recordset($media$[
  {
    "lesson_number": 16,
    "src": "/images/questions/merge-from-right-20261125.jpg"
  },
  {
    "lesson_number": 20,
    "src": "/images/questions/lesson-106-richtingaanwijzer.jpg"
  },
  {
    "lesson_number": 35,
    "src": "/images/questions/lesson-057-uitrit-verlaten.jpg"
  },
  {
    "lesson_number": 64,
    "src": "/images/Inhalen verboden bij doorgetrokken streep.jpg"
  },
  {
    "lesson_number": 72,
    "src": "/images/signs/E2.svg"
  },
  {
    "lesson_number": 83,
    "src": "/images/questions/merge-from-right-20261125.jpg"
  },
  {
    "lesson_number": 85,
    "src": "/images/questions/open-shoulder-20261125.jpg"
  },
  {
    "lesson_number": 86,
    "src": "/images/questions/matrix-red-cross-20261125.svg"
  },
  {
    "lesson_number": 93,
    "src": "/images/questions/snow-driving-20261125.jpg"
  }
]$media$::jsonb) AS x(lesson_number integer, src text)
), repaired_lessons AS (
 UPDATE course_lessons l
 SET media=jsonb_set(l.media,'{0,src}',to_jsonb(f.src)), updated_at=now()
 FROM fixes f
 WHERE l.lesson_number=f.lesson_number AND l.published
 RETURNING l.release_id,l.lesson_number,l.media
), exam_fixes AS (
 SELECT l.release_id,'cbr2026-q'||(113+(l.lesson_number-1)*6+v.i) AS external_key,l.media->0->>'src' AS src
 FROM repaired_lessons l CROSS JOIN generate_series(0,5) v(i)
 UNION ALL
 SELECT r.id,b.external_key,b.src
 FROM content_releases r CROSS JOIN (VALUES
 ('cbr2025-q45','/images/signs/C1.svg'),
 ('cbr2025-q92','/images/questions/military-convoy-20261125.jpg')
 ) b(external_key,src) WHERE r.status='published'
), repaired_exams AS (
 UPDATE exam_questions_v1 q
 SET media=jsonb_set(q.media,'{0,src}',to_jsonb(f.src)),updated_at=now()
 FROM exam_fixes f
 WHERE q.release_id=f.release_id AND q.external_key=f.external_key AND q.published
 RETURNING q.external_key
), recorded AS (
 INSERT INTO schema_migrations(version,name)
 SELECT 50,'customer_feedback_media_and_exam_recovery'
 WHERE EXISTS(SELECT FROM repaired_lessons)
 ON CONFLICT(version) DO NOTHING
)
SELECT (SELECT count(*) FROM repaired_lessons) AS repaired_lessons,
       (SELECT count(*) FROM repaired_exams) AS repaired_exam_questions;
