-- Align the original exam set with the closest existing situation images.
-- Question text and answers remain unchanged.

BEGIN;
WITH media_map(external_key, image_src) AS (VALUES
('cbr2025-q33','/images/Kind veilig in autostoel onder 1,35 m.jpg'),
('cbr2025-q34','/images/signs/D4.svg'),
('cbr2025-q35','/images/theory-020-driveway-exit.webp'),
('cbr2025-q36','/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
('cbr2025-q41','/images/theory-021-traffic-lights.webp'),
('cbr2025-q44','/images/Invoegen op de Nederlandse snelweg.jpg'),
('cbr2025-q48','/images/Veilige afhandeling van een kleine aanrijding.jpg'),
('cbr2025-q53','/images/Direct botsingsgevaar op het kruispunt.jpg'),
('cbr2025-q54','/images/theory-016-right-before-left.webp'),
('cbr2025-q55','/images/Van onverharde zijweg naar asfaltweg.jpg'),
('cbr2025-q58','/images/theory-022-left-turn-oncoming.webp'),
('cbr2025-q61','/images/Blauwe auto op landelijke 80-weg.jpg'),
('cbr2025-q62','/images/Snelweg met matrixbord 80 en bord 100.jpg'),
('cbr2025-q63','/images/Blauwe auto op autoweg met 100-bord.jpg'),
('cbr2025-q65','/images/Blauwe auto blokkeert zebrapad.jpg'),
('cbr2025-q66','/images/Bus vertrekt, auto geeft ruimte.jpg'),
('cbr2025-q68','/images/theory-020-driveway-exit.webp'),
('cbr2025-q70','/images/theory-018-priority-road.webp'),
('cbr2025-q71','/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
('cbr2025-q75','/images/Nederlandse portiercheck bij rood fietspad.jpg'),
('cbr2025-q77','/images/Direct botsingsgevaar op het kruispunt.jpg'),
('cbr2025-q79','/images/Mistachterlicht bij 50 meter zicht.jpg'),
('cbr2025-q81','/images/theory-050-roadside-incident.webp'),
('cbr2025-q82','/images/Iedereen draagt de veiligheidsgordel.jpg'),
('cbr2025-q83','/images/Kind veilig in autostoel onder 1,35 m.jpg'),
('cbr2025-q85','/images/theory-038-breakdown-shoulder.webp'),
('cbr2025-q86','/images/theory-038-breakdown-shoulder.webp'),
('cbr2025-q90','/images/theory-045-blind-pedestrian.webp'),
('cbr2025-q91','/images/theory-023-straight-same-road.webp'),
('cbr2025-q98','/images/theory-021-traffic-lights.webp'),
('cbr2025-q101','/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
('cbr2025-q103','/images/Mistachterlicht bij 50 meter zicht.jpg'),
('cbr2025-q105','/images/Blauwe auto blokkeert zebrapad.jpg'),
('cbr2025-q108','/images/Snelweg met matrixbord 80 en bord 100.jpg'),
('cbr2025-q109','/images/Blauwe auto bereidt rijstrookwissel voor.jpg'),
('cbr2025-q111','/images/Bandenspanning controleren bij een koude band.jpg'),
('cbr2025-q112','/images/theory-038-breakdown-shoulder.webp'))
UPDATE exam_questions_v1 q SET media=jsonb_build_array(jsonb_build_object('type','image','src',m.image_src,'alt',q.prompt->>'nl')), updated_at=NOW()
FROM media_map m WHERE q.release_id=(SELECT id FROM content_releases WHERE version=1) AND q.external_key=m.external_key;
INSERT INTO schema_migrations(version,name) VALUES(33,'base_exam_media_precision') ON CONFLICT(version) DO UPDATE SET name=EXCLUDED.name;
COMMIT;
SELECT version,name FROM schema_migrations WHERE version=33;
