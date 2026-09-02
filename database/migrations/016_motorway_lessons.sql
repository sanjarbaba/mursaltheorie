-- Complete lessons 81-90 with bilingual motorway rules and quizzes.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[81,82,83,84,85,86,87,88,89,90];
 rules text[]:=ARRAY['Kies op de autosnelweg een passende rijstrook en houd rechts.','Houd voldoende afstand en kijk ver vooruit op de snelweg.','Gebruik de invoegstrook om snelheid te maken en voeg in als er ruimte is.','Geef richting aan en voeg tijdig uit naar de uitvoegstrook.','Een spitsstrook mag alleen open zijn wanneer de signalering dat aangeeft.','Matrixborden gelden direct en kunnen een lagere snelheid tonen.','Bij pech op de snelweg ga je zo snel mogelijk achter de vangrail staan.','De vluchtstrook is voor noodgevallen en pech, niet voor normaal rijden.','Pas je snelheid aan en houd extra afstand in een file.','Bereid je afrit voor door tijdig de juiste rijstrook te kiezen.'];
 rulesfa text[]:=ARRAY['در بزرگراه خط مناسب را انتخاب و سمت راست حرکت کنید.','در بزرگراه فاصله کافی و دید دور داشته باشید.','در مسیر ورود سرعت بگیرید و وقتی فضا بود وارد شوید.','راهنما بزنید و به‌موقع به خط خروج بروید.','خط شلوغی فقط وقتی باز است که علائم اجازه دهند.','تابلوهای ماتریسی فوراً معتبرند و ممکن است سرعت کمتر نشان دهند.','در خرابی بزرگراه سریع پشت گاردریل بروید.','شانه اضطراری برای خطر و خرابی است، نه رانندگی عادی.','در صف ترافیک سرعت و فاصله بیشتری رعایت کنید.','برای خروج، به‌موقع خط مناسب را انتخاب کنید.'];
 q text[]:=ARRAY['Welke kant houd je op de autosnelweg?','Wat is belangrijk op de snelweg?','Wat doe je op de invoegstrook?','Wanneer ga je naar de uitvoegstrook?','Wanneer mag je de spitsstrook gebruiken?','Wat geldt bij een rood kruis boven de rijstrook?','Waar ga je staan bij pech?','Waarvoor is de vluchtstrook?','Wat doe je in een file?','Hoe bereid je een afrit voor?'];
 qfa text[]:=ARRAY['در بزرگراه کدام سمت حرکت می‌کنید؟','در بزرگراه چه مهم است؟','در مسیر ورود چه می‌کنید؟','چه زمانی وارد خط خروج می‌شوید؟','چه زمانی خط شلوغی مجاز است؟','علامت ضربدر قرمز بالای خط چه می‌گوید؟','در خرابی کجا می‌ایستید؟','شانه اضطراری برای چیست؟','در ترافیک چه می‌کنید؟','چگونه برای خروج آماده می‌شوید؟'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET summary=jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),content_blocks=jsonb_build_array(jsonb_build_object('type','rule','text',jsonb_build_object('nl',rules[i],'fa',rulesfa[i])),jsonb_build_object('type','exam_tip','text',jsonb_build_object('nl','Let op signalering, verkeer en een vrije vluchtweg.','fa','به علائم، ترافیک و مسیر فرار آزاد توجه کنید.')),jsonb_build_object('type','quiz','question',jsonb_build_object('nl',q[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),jsonb_build_object('nl','Altijd stilstaan','fa','همیشه توقف'),jsonb_build_object('nl','De regel negeren','fa','نادیده گرفتن قاعده')),'correctOption',0,'explanation',jsonb_build_object('nl',rules[i],'fa',rulesfa[i]))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i];
 END LOOP;
END $do$;
INSERT INTO schema_migrations(version,name) VALUES(16,'motorway_lessons') ON CONFLICT(version) DO NOTHING;
COMMIT;

