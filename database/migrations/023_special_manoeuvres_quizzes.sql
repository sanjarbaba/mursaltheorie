-- Add the missing bilingual quizzes to special-manoeuvre lessons 51-60.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[51,52,53,54,55,56,57,58,59,60];
 qnl text[]:=ARRAY['Wat geldt bij wegrijden?','Wie laat je voorgaan bij achteruitrijden?','Wat doe je bij uitparkeren?','Wat controleer je vóór inparkeren?','Wanneer mag je keren?','Wat controleer je vóór een rijstrookwissel?','Wie gaat voor als je een uitrit verlaat?','Wat geldt bij een oprit oprijden?','Wanneer wissel je in een file van rijstrook?','Wat is de hoofdregel bij een bijzondere manoeuvre?'];
 qfa text[]:=ARRAY['هنگام شروع حرکت چه قاعده‌ای است؟','هنگام دنده‌عقب به چه کسی راه می‌دهید؟','هنگام خروج از پارک چه می‌کنید؟','پیش از پارک چه بررسی می‌کنید؟','چه زمانی می‌توان دور زد؟','پیش از تغییر خط چه بررسی می‌کنید؟','هنگام خروج از ملک چه کسی مقدم است؟','هنگام ورود به ورودی چه قاعده‌ای است؟','در صف چه زمانی خط عوض می‌کنید؟','قاعده اصلی مانور ویژه چیست؟'];
 ansnl text[]:=ARRAY['Al het overige verkeer voor laten gaan','Al het overige verkeer','Rondom kijken en iedereen voor laten gaan','Spiegels, dode hoek en beschikbare ruimte','Alleen als het toegestaan en volledig veilig is','Spiegels, richtingaanwijzer en dode hoek','Al het overige verkeer','Iedereen voor laten gaan','Alleen als het veilig en nuttig is','Al het overige verkeer voor laten gaan'];
 ansfa text[]:=ARRAY['به تمام ترافیک دیگر راه بدهید','تمام ترافیک دیگر','اطراف را ببینید و به همه راه بدهید','آینه، نقطه کور و فضای موجود','فقط وقتی مجاز و کاملاً ایمن است','آینه، راهنما و نقطه کور','تمام ترافیک دیگر','به همه راه بدهید','فقط وقتی ایمن و مفید است','به تمام ترافیک دیگر راه بدهید'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET content_blocks=l.content_blocks || jsonb_build_array(jsonb_build_object('type','quiz','question',jsonb_build_object('nl',qnl[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',ansnl[i],'fa',ansfa[i]),jsonb_build_object('nl','Je hebt altijd zelf voorrang','fa','همیشه خودتان مقدم هستید'),jsonb_build_object('nl','Alleen naar voren kijken','fa','فقط جلو را نگاه کنید')),'correctOption',0,'explanation',jsonb_build_object('nl',ansnl[i] || '.','fa',ansfa[i] || '.'))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i] AND NOT l.content_blocks @> '[{"type":"quiz"}]'::jsonb;
 END LOOP;
END $do$;
DO $check$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM course_lessons WHERE release_id=(SELECT id FROM content_releases WHERE version=1) AND content_blocks @> '[{"type":"quiz"}]'::jsonb; IF n<>150 THEN RAISE EXCEPTION 'Expected 150 lessons with quizzes, found %',n; END IF; END $check$;
INSERT INTO schema_migrations(version,name) VALUES(23,'special_manoeuvres_quizzes') ON CONFLICT(version) DO NOTHING;
COMMIT;

