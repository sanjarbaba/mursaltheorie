BEGIN;

UPDATE course_lessons
SET media = jsonb_build_array(jsonb_build_object(
      'type', 'image',
      'src', '/images/tram-gelijkwaardig-kruispunt.jpg',
      'alt', 'Tram en auto op een gelijkwaardig kruispunt'
    )),
    updated_at = NOW()
WHERE release_id = (SELECT id FROM content_releases WHERE version = 1)
  AND lesson_number = 37;

INSERT INTO schema_migrations(version, name)
VALUES (34, 'tram_lesson_media_fix')
ON CONFLICT(version) DO UPDATE SET name = EXCLUDED.name;

COMMIT;

SELECT version, name FROM schema_migrations WHERE version = 34;

