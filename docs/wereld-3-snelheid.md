# Wereld 3 — Snelheid & wegtypes

Uitbreiding van 23 september 2026. Ingang: `/game/spelen`.

## Wat is toegevoegd?

Twintig levels met 34 situaties: bebouwde kom, buitenwegen, autowegen, autosnelwegen, tijdvakken, matrixborden, zones, erven, aanhangwagens, toegangseisen en veilig aanpassen aan zicht. De speler kiest een limiet, herkent wegtypes of beoordeelt een voorgestelde limiet van Mursal. Timed challenges geven 25 seconden per vraag; de klok kan uit in Mijn held.

De Matrixwachter is de mini-boss op level 10. De Snelheidsmeester sluit level 20 af. Beide rondes vereisen 80% goed en hebben geen powers. De eindbeloning is de Snelheidsheld-badge.

Wereld 3 ontgrendelt na de Voorrangsmeester. Na die overwinning verschijnt de knop Ontdek Wereld 3; wisselen kan ook via Werelden. Het bestaande digitale abonnement omvat alle drie de werelden. Er is geen extra betaling of wijziging aan de looptijd toegevoegd.

De vijf levens blijven gedeeld. De comeback gebruikt vijf basisvragen uit de geselecteerde wereld en herstelt na vijf goede antwoorden alle vijf levens. Het snelheidsboek bevat twaalf samenvattingen met bronlinks.

## Inhoud en bronnen

De actuele ongedateerde RVV-pagina verwees tijdens controle op 23 september naar versie 1 juli 2026. De relevante artikelen 19–22, 42, 45, 63, 66 en 67 zijn rechtstreeks opgehaald en gelezen. Alle nieuwe artikelankers zijn gecontroleerd tegen de officiële HTML. Rijkswaterstaat is aanvullend gebruikt voor tijdvensters en matrixsignalering. Per vraag staan bron-ID’s; per bron staan URL, uitgever en controledatum.

De vragen maken onderscheid tussen de algemene wettelijke limiet en de beperking die in een concrete situatie geldt. Er staat geen algemene claim dat overdag overal 100 geldt. Ook een hoger matrixgetal heft een lager vast bord niet op. Elke vraag vermeldt alle benodigde voorwaarden. Standaard gaat het om een personenauto zonder aanhangwagen; afwijkingen worden expliciet genoemd.

`api/v1/_speed-data.js` bevat de inhoud. `game/speed-view.js` tekent de snelheidssituaties. Het publieke script bevat geen betaalde vraaginhoud; die wordt via de bestaande beschermde API geleverd. Betalingen, Clerk-instellingen en looptijden zijn niet aangepast.

## Opslag en uitbreiden

Wereld 1 behoudt ID’s 1–20, Wereld 2 21–40; Wereld 3 gebruikt 41–60. Aan spelers verschijnen per wereld nummers 1–20. De bestaande saveversie en accountgebonden lokale sleutels blijven behouden. De engine leidt badges en ontgrendeling af uit behaalde levels. Oude saves behouden hun scores en beide eerdere badges. De volgende-wereldknop gebruikt nu het wereldregister in plaats van een vaste Wereld-2-knop.

## Testen en bouwen

```sh
node --test test/mursal-game.test.mjs test/world2.test.mjs test/world3.test.mjs test/comeback.test.mjs test/game-access.test.mjs
node scripts/build-game-offline.mjs
```

Gecontroleerd: migratie van een 40-level-save, opeenvolgende ontgrendeling, alle zestig levels in de engine, drie badges, 180 sterren bij foutloos spelen, juiste en onjuiste Mursal-voorstellen, alle twintig nieuwe levels via browserknoppen, fout antwoord met uitleg, hervatten na herladen, beide bazen zonder powers, naslagboek, vijf comeback-vragen en terugwisselen naar Wereld 1.

Mobiele maten 320/390px en desktop 1440px zijn in Edge getest. Betaalde speltests gebruiken een nagebootste account; er is geen aankoop uitgevoerd. Voortgang blijft lokaal per browser en account. De live anonieme toegang en gepubliceerde bestanden worden na Vercel-deployment gecontroleerd.
