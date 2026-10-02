# App Store-gereedheid — Mursal Theorie iOS

Status op 30 september 2026: **nog niet klaar voor inzending**. Deze beoordeling gebruikt de code op `ios-v1-testflight`. Er is voor deze controle geen nieuwe build gemaakt en de live website is niet gewijzigd.

## Wat al aanwezig is

- De iOS-app gebruikt bundle-ID `nl.mursaltheorie.app`, het eigen appicoon en een gekoppeld EAS-project.
- De app toont lessen, oefeningen, examens, borden, verkeerssituaties, account, privacylink en accountverwijdering. De cursuscontrole loopt via de bestaande API.
- De inhoudsvalidator controleert 147 borden en 30 verkeerssituaties. De bestaande meertalige inhoud blijft alsnog onderworpen aan menselijke taalcontrole.
- De huidige `preview`-build is voor rechtstreekse installatie op geregistreerde apparaten. `production` is het profiel voor TestFlight/App Store.

## Blokkerende stappen voor inzending

1. **In-app aankoop:** De drie 30-dagenproducten uit [PAYMENTS.md](./PAYMENTS.md) bestaan als concept bij de juiste app. Ze zijn alleen in Nederland en België geselecteerd. In beide landen staat Nederlands op € 49,99 en elk vertaalpakket op € 65,00. Paid Applications en de bankrekening zijn actief in App Store Connect. Producten hebben nog geen reviewscreenshot en zijn niet goedgekeurd.
2. **Veilige verwerking van aankopen:** StoreKit-koopknoppen, herstel, serververificatie van ondertekende Apple-transacties, 30-daagse toegang en terugbetalingsmeldingen zijn lokaal voorbereid met een standaard uitgeschakelde functieknop. Databasewijziging, Apple-servergegevens, notificatieadres en een volledige Apple-sandboxtest ontbreken nog. Daarom zijn aankopen niet live. Voor het fysieke boek blijft de website de checkout.
3. **App Store-build:** Er is een iOS-`production`-build met App Store-distributie en een daaropvolgende TestFlight-controle nodig. De bestaande interne preview-build is daarvoor niet geschikt. De gebruiker heeft uitdrukkelijk gevraagd nu geen nieuwe build te maken.
4. **App Store Connect:** De Nederlandse appbeschrijving, zoekwoorden, support-URL, marketing-URL, copyright en privacy-URL zijn als concept ingevuld. iPhone-screenshots ontbreken nog. De App Privacy-vragenlijst is na een eerste inventarisatie niet gepubliceerd; gegevens van Clerk en de API moeten volledig worden meegenomen. Reviewer-inlog, contactgegevens, categorie en leeftijdsclassificatie moeten worden afgerond. Versie 1.0 staat nog op `Prepare for Submission` en is niet ingediend.
5. **Echte iPhone-test:** Controleer aanmelden, alle drie talen, 147 borden, verkeerssituaties, lessen, oefenvragen, examens inclusief verlopen tijd en uitslag, offline toegang, accountverwijdering en aankoopherstel met de uiteindelijke production/TestFlight-build.
6. **Taalcontrole:** Laat Nederlands, Dari/Farsi en Pashto door bevoegde sprekers nalopen op juistheid, duidelijkheid en leesbaarheid op een iPhone. De automatische inhoudscontrole beoordeelt geen taalkwaliteit.

## Klaar voor de volgende technische ronde

- De examen-API rondt een poging na het verstrijken van de tijd af en toont een uitslag. Dit staat alleen op de testbranch; de live API moet apart worden uitgerold voordat een appversie daarop kan vertrouwen.
- De lokale lescache is per gebruiker en taal gescheiden. Een offline toegangsbewijs verloopt uiterlijk na 24 uur of eerder bij het verstrijken van een bekende cursustoegang.
- De testbranch kan zonder nieuwe build worden nagekeken. Een toekomstige build is pas zinvol na de hierboven genoemde betaal- en releasevoorbereiding.
- De lokale privacyverklaring benoemt Apple-transacties. De publieke privacy-URL toont de bestaande verklaring totdat deze wijziging afzonderlijk op de website wordt uitgerold.

## Bronnen

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple: niet-verlengende abonnementen aanmaken](https://developer.apple.com/help/app-store-connect/manage-subscriptions/create-non-renewing-subscriptions)
- [Expo: in-app aankopen](https://docs.expo.dev/guides/in-app-purchases/)
- [Expo: interne distributie](https://docs.expo.dev/build/internal-distribution/)
- [Expo: iOS indienen](https://docs.expo.dev/submit/ios/)
