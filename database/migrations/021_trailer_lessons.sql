-- Complete lessons 131-140 with bilingual trailer and load safety rules.
BEGIN;
DO $do$
DECLARE i int; nums int[]:=ARRAY[131,132,133,134,135,136,137,138,139,140];
 rules text[]:=ARRAY['Controleer voor vertrek koppeling, verlichting en bevestiging van de aanhanger.','Een aanhanger moet goed vastzitten en de verlichting moet werken.','Controleer dat de belading gelijkmatig en goed gezekerd is.','De combinatie heeft een langere remweg; houd meer afstand.','Met een aanhanger geldt de aangegeven lagere maximumsnelheid.','Overschrijd het toegestane gewicht van auto of aanhanger niet.','Rem eerder en geleidelijk met een zware lading.','Slepen mag alleen veilig, zichtbaar en volgens de voorschriften.','Pas snelheid en bochten aan de massa en lengte van de caravan aan.','Gebruik geschikte spiegels en controleer de dode hoek achter de aanhanger.'];
 rulesfa text[]:=ARRAY['پیش از حرکت اتصال، چراغ‌ها و بست تریلر را بررسی کنید.','تریلر باید محکم وصل و چراغ‌هایش سالم باشد.','بار را یکنواخت و محکم مهار کنید.','ترکیب خودرو و تریلر فاصله ترمز بیشتری لازم دارد.','با تریلر حد سرعت پایین‌تر اعلام‌شده را رعایت کنید.','وزن مجاز خودرو یا تریلر را بیشتر نکنید.','با بار سنگین زودتر و تدریجی ترمز کنید.','یدک‌کشیدن فقط ایمن، قابل دید و طبق مقررات مجاز است.','سرعت و پیچیدن را با جرم و طول کاروان هماهنگ کنید.','آینه مناسب بزنید و نقطه کور پشت تریلر را بررسی کنید.'];
 q text[]:=ARRAY['Wat controleer je vóór vertrek?','Wat moet met een aanhanger in orde zijn?','Hoe laad je een aanhanger?','Wat geldt voor de remweg?','Welke snelheid geldt met een aanhanger?','Wat mag je niet overschrijden?','Hoe rem je met lading?','Wanneer mag je slepen?','Hoe rijd je met een caravan?','Wat heb je nodig voor goed zicht?'];
 qfa text[]:=ARRAY['پیش از حرکت چه بررسی می‌کنید؟','تریلر باید چه وضعی داشته باشد؟','تریلر را چگونه بار می‌کنید؟','در مورد فاصله ترمز چه است؟','با تریلر چه سرعتی مجاز است؟','از چه نباید عبور کنید؟','با بار چگونه ترمز می‌کنید؟','یدک‌کشیدن چه زمانی مجاز است؟','با کاروان چگونه می‌رانید؟','برای دید خوب چه لازم دارید؟'];
BEGIN
 FOR i IN 1..10 LOOP
  UPDATE course_lessons l SET summary=jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),content_blocks=jsonb_build_array(jsonb_build_object('type','rule','text',jsonb_build_object('nl',rules[i],'fa',rulesfa[i])),jsonb_build_object('type','exam_tip','text',jsonb_build_object('nl','Controleer de combinatie en plan extra ruimte.','fa','ترکیب را بررسی و فضای بیشتری برنامه‌ریزی کنید.')),jsonb_build_object('type','quiz','question',jsonb_build_object('nl',q[i],'fa',qfa[i]),'options',jsonb_build_array(jsonb_build_object('nl',rules[i],'fa',rulesfa[i]),jsonb_build_object('nl','Niets controleren','fa','هیچ چیز را بررسی نکنید'),jsonb_build_object('nl','Altijd sneller rijden','fa','همیشه سریع‌تر برانید')),'correctOption',0,'explanation',jsonb_build_object('nl',rules[i],'fa',rulesfa[i]))),updated_at=NOW() WHERE l.release_id=(SELECT id FROM content_releases WHERE version=1) AND l.lesson_number=nums[i];
 END LOOP;
END $do$;
INSERT INTO schema_migrations(version,name) VALUES(21,'trailer_lessons') ON CONFLICT(version) DO NOTHING;
COMMIT;

