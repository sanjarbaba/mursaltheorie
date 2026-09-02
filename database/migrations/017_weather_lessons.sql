-- Complete lessons 91-100 with bilingual adverse-weather rules and quizzes.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[91,92,93,94,95,96,97,98,99,100];
 rules text[]:=ARRAY['Bij regen verminder je snelheid en vergroot je volgafstand.','Bij mist gebruik je dimlicht en pas je snelheid aan je zicht aan.','Bij sneeuw rijd je rustig en rem je geleidelijk.','Bij gladheid voorkom je plotseling sturen, remmen en gas geven.','Bij aquaplaning laat je gas los en houd je het stuur stabiel.','In het donker gebruik je de juiste verlichting en kijk je verder vooruit.','Bij laagstaande zon verminder je snelheid en houd je meer afstand.','Bij harde wind houd je beide handen aan het stuur en pas je snelheid aan.','Bij slecht zicht rijd je alleen zo snel dat je kunt stoppen.','Veilig rijden betekent je snelheid steeds aan de omstandigheden aanpassen.'];
 rulesfa text[]:=ARRAY['در باران سرعت را کم و فاصله را بیشتر کنید.','در مه از نور پایین استفاده و سرعت را با دید هماهنگ کنید.','در برف آرام و با ترمز تدریجی برانید.','در لغزندگی از فرمان، ترمز و گاز ناگهانی پرهیز کنید.','در لغزش آبی گاز را رها و فرمان را ثابت نگه دارید.','در تاریکی چراغ مناسب بزنید و دورتر را نگاه کنید.','در آفتاب کم‌ارتفاع سرعت و فاصله بیشتری بگیرید.','در باد شدید هر دو دست روی فرمان و سرعت مناسب داشته باشید.','با دید کم فقط سرعتی بروید که بتوانید بایستید.','رانندگی ایمن یعنی سرعت را پیوسته با شرایط تطبیق دهید.'];
 q text[]:=ARRAY['Wat doe je bij regen?','Hoe rijd je in mist?','Wat is veilig bij sneeuw?','Wat vermijd je bij gladheid?','Wat doe je bij aquaplaning?','Welke verlichting gebruik je in het donker?','Wat doe je bij laagstaande zon?','Hoe reageer je op harde wind?','Welke snelheid kies je bij slecht zicht?','Wat is de hoofdregel bij veranderende omstandigheden?'];
 qfa text[]:=ARRAY['در باران چه می‌کنید؟','در مه چگونه می‌رانید؟','در برف چه ایمن است؟','در لغزندگی از چه پرهیز می‌کنید؟','در لغزش آبی چه می‌کنید؟','در تاریکی کدام چراغ را استفاده می‌کنید؟','در آفتاب کم‌ارتفاع چه می‌کنید؟','در باد شدید چگونه واکنش می‌دهید؟','در دید کم چه سرعتی انتخاب می‌کنید؟','قاعده اصلی در شرایط متغیر چیست؟'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET summary=jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),content_blocks=jsonb_build_array(jsonb_build_object('type','rule','text',jsonb_build_object('nl',rules[i],'fa',rulesfa[i])),jsonb_build_object('type','exam_tip','text',jsonb_build_object('nl','Kijk ver vooruit en verminder snelheid vóór het gevaar.','fa','دورتر را نگاه کنید و پیش از خطر سرعت را کم کنید.')),jsonb_build_object('type','quiz','question',jsonb_build_object('nl',q[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),jsonb_build_object('nl','Niets aanpassen','fa','هیچ تغییری ندهید'),jsonb_build_object('nl','Sneller rijden','fa','سریع‌تر برانید')),'correctOption',0,'explanation',jsonb_build_object('nl',rules[i],'fa',rulesfa[i]))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i];
 END LOOP;
END $do$;
INSERT INTO schema_migrations(version,name) VALUES(17,'weather_lessons') ON CONFLICT(version) DO NOTHING;
COMMIT;

