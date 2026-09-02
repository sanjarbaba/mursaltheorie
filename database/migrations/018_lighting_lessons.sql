-- Complete lessons 101-110 with bilingual vehicle-lighting rules and quizzes.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[101,102,103,104,105,106,107,108,109,110];
 rules text[]:=ARRAY['Gebruik verlichting zodat je ziet en gezien wordt.','Groot licht gebruik je alleen als je anderen niet verblindt.','Mistlicht vóór mag bij ernstig belemmerd zicht door mist, sneeuw of regen.','Mistachterlicht mag alleen bij minder dan 50 meter zicht door mist of sneeuw.','Dagrijlicht is geen vervanging voor achterlicht in donkere omstandigheden.','Geef richting tijdig en duidelijk aan vóór je manoeuvreert.','Gebruik alarmlichten alleen om te waarschuwen voor gevaar of stilstaand voertuig.','Gebruik de claxon alleen om direct gevaar te voorkomen.','Remlichten waarschuwen achteropkomend verkeer; houd afstand.','Pas je signalen aan de situatie aan en blijf opletten.'];
 rulesfa text[]:=ARRAY['از چراغ برای دیدن و دیده شدن استفاده کنید.','نوربالا فقط وقتی مجاز است که دیگران را خیره نکند.','مه‌شکن جلو در دید بسیار کم بر اثر مه، برف یا باران مجاز است.','مه‌شکن عقب فقط با دید کمتر از ۵۰ متر در مه یا برف مجاز است.','چراغ روز جای چراغ عقب را در تاریکی نمی‌گیرد.','پیش از مانور به‌موقع و واضح راهنما بزنید.','چراغ خطر فقط برای هشدار خطر یا خودروی متوقف است.','بوق فقط برای جلوگیری از خطر فوری استفاده می‌شود.','چراغ ترمز به ترافیک پشت هشدار می‌دهد؛ فاصله بگیرید.','علائم خود را با وضعیت هماهنگ و هوشیار بمانید.'];
 q text[]:=ARRAY['Waarom gebruik je verlichting?','Wanneer mag groot licht?','Wanneer mag mistlicht vóór?','Wanneer mag mistachterlicht?','Is dagrijlicht genoeg in het donker?','Wanneer geef je richting aan?','Wanneer gebruik je alarmlichten?','Waarvoor dient de claxon?','Wat doen remlichten?','Wat is belangrijk bij signalen?'];
 qfa text[]:=ARRAY['چرا از چراغ استفاده می‌کنید؟','چه زمانی نوربالا مجاز است؟','چه زمانی مه‌شکن جلو مجاز است؟','چه زمانی مه‌شکن عقب مجاز است؟','آیا چراغ روز در تاریکی کافی است؟','چه زمانی راهنما می‌زنید؟','چه زمانی چراغ خطر را استفاده می‌کنید؟','بوق برای چیست؟','چراغ ترمز چه می‌کند؟','در علائم چه مهم است؟'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET summary=jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),content_blocks=jsonb_build_array(jsonb_build_object('type','rule','text',jsonb_build_object('nl',rules[i],'fa',rulesfa[i])),jsonb_build_object('type','exam_tip','text',jsonb_build_object('nl','Controleer verlichting en signalen vóór vertrek.','fa','پیش از حرکت چراغ‌ها و علائم را بررسی کنید.')),jsonb_build_object('type','quiz','question',jsonb_build_object('nl',q[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),jsonb_build_object('nl','Altijd gebruiken','fa','همیشه استفاده کنید'),jsonb_build_object('nl','Nooit gebruiken','fa','هرگز استفاده نکنید')),'correctOption',0,'explanation',jsonb_build_object('nl',rules[i],'fa',rulesfa[i]))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i];
 END LOOP;
END $do$;
INSERT INTO schema_migrations(version,name) VALUES(18,'lighting_lessons') ON CONFLICT(version) DO NOTHING;
COMMIT;

