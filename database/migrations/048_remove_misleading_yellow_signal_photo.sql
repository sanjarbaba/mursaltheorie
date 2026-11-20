BEGIN;

-- This question asks for the meaning of a flashing yellow signal. The old
-- photograph shows static red and green signals, and is valid for other questions.
UPDATE exam_questions_v1 AS q
SET media = (
  SELECT COALESCE(jsonb_agg(item ORDER BY position), '[]'::jsonb)
  FROM jsonb_array_elements(q.media) WITH ORDINALITY AS entries(item, position)
  WHERE item->>'src' IS DISTINCT FROM '/images/theory-021-traffic-lights.webp'
),
    updated_at = NOW()
WHERE q.external_key = 'cbr2025-q41'
  AND q.release_id IN (SELECT id FROM content_releases WHERE version = 1)
  AND q.media @> '[{"src":"/images/theory-021-traffic-lights.webp"}]'::jsonb;

INSERT INTO schema_migrations (version, name)
VALUES (48, 'remove_misleading_yellow_signal_photo')
ON CONFLICT (version) DO NOTHING;

COMMIT;
