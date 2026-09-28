# Wereld 4 — Gevaarherkenning

Wereld 4 van Mursal Theory Hero bevat levels 61–80, vier hoofdstukken, een mini-boss op level 70 en een eindbaas op level 80. De wereld wordt na de eindbaas van Wereld 3 beschikbaar en valt onder dezelfde betaalde toegang via Mursaltheorie.

De 34 oorspronkelijke situaties beschrijven steeds zicht, afstand en het gedrag van anderen. Een speler kiest een reactie (**remmen**, **gas loslaten** of **doorrijden en blijven kijken**) of benoemt in een kijkvraag het relevante signaal. De illustratie is schematisch; de geschreven situatie is beslissend. De reactie is een didactisch oordeel bij deze omstandigheden, geen letterlijke tekst uit de wet of een officieel examenantwoord. Fouten tonen uitleg en een controleerbare bron.

## Bronnen

- [Wegenverkeerswet 1994, artikel 5](https://wetten.overheid.nl/BWBR0006622/2026-09-01/#HoofdstukII_Paragraaf1_Artikel5): algemeen verbod om gevaar of hinder te veroorzaken.
- [RVV 1990, artikel 19](https://wetten.overheid.nl/BWBR0004825/2026-07-01/#HoofdstukII_Paragraaf8_Artikel19): kunnen stoppen binnen de afstand die te overzien en vrij is.
- [RVV 1990, artikel 49](https://wetten.overheid.nl/BWBR0004825/2026-07-01/#HoofdstukII_Paragraaf19_Artikel49): voetgangersoversteekplaats.
- [RVV 1990, artikel 15a](https://wetten.overheid.nl/BWBR0004825/2026-07-01/#HoofdstukII_Paragraaf5a_Artikel15a): veilig gebruik van overwegen.

Bronversies en inhoud gecontroleerd op 28 september 2026. De versies, URL's en controledatum staan ook per bron in `api/v1/_hazard-data.js`. Bij gewijzigde regels moet de inhoud opnieuw worden bekeken; er is geen automatische juridische actualisering.

## Testen

`node --test test/world4.test.mjs` controleert bronkoppeling, 20 levels, antwoordkeuzes, savebehoud na 60 levels, badge, powers bij bazen en de comeback met vijf vragen. De browserproef in `work/verify-world4.cjs` doorloopt alle levels met een gesimuleerd betaald account en controleert de schermen op 320/390 px mobiel en 1440 px desktop.
