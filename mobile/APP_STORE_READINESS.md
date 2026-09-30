# App Store-gereedheid — Mursal Theorie iOS

Status op 30 september 2026: **nog niet klaar voor inzending**. Deze beoordeling gebruikt de code op `ios-v1-testflight`. Er is voor deze controle geen nieuwe build gemaakt en de live website is niet gewijzigd.

## Wat al aanwezig is

- De iOS-app gebruikt bundle-ID `nl.mursaltheorie.app`, het eigen appicoon en een gekoppeld EAS-project.
- De app toont lessen, oefeningen, examens, borden, verkeerssituaties, account, privacylink en accountverwijdering. De cursuscontrole loopt via de bestaande API.
- De inhoudsvalidator controleert 147 borden en 30 verkeerssituaties. De bestaande meertalige inhoud blijft alsnog onderworpen aan menselijke taalcontrole.
- De huidige `preview`-build is voor rechtstreekse installatie op geregistreerde apparaten. `production` is het profiel voor TestFlight/App Store.

## Blokkerende stappen voor inzending

1. **In-app aankoop:** In App Store Connect moet de eigenaar nagaan of de drie 30-dagenproducten uit [PAYMENTS.md](./PAYMENTS.md) bestaan, bij de juiste app horen en voor de gewenste landen/prijzen zijn ingesteld. Dit is momenteel onbekend. De eigenaar moet ook de overeenkomst voor betaalde apps en benodigde bank- en belastinggegevens afronden.
2. **Veilige verwerking van aankopen:** De app heeft nog geen StoreKit-koopknoppen of herstelknop en de API verifieert nog geen Apple-transacties. Een prijsvermelding of koopknop mag pas worden ingeschakeld nadat serververificatie, accountkoppeling, terugbetalingen en herstel in Apple sandbox zijn getest. De server beheert de looptijd van 30 dagen. Voor het fysieke boek blijft de website de checkout.
3. **App Store-build:** Er is een iOS-`production`-build met App Store-distributie en een daaropvolgende TestFlight-controle nodig. De bestaande interne preview-build is daarvoor niet geschikt. De gebruiker heeft uitdrukkelijk gevraagd nu geen nieuwe build te maken.
4. **App Store Connect:** Apprecord, categorie, leeftijdsclassificatie, beschrijving, screenshots, support-URL, privacy-URL, privacyantwoorden en een werkende reviewer-login/toegang moeten gecontroleerd en compleet gemaakt worden. Deze gegevens zijn niet door de codecontrole te bevestigen.
5. **Echte iPhone-test:** Controleer aanmelden, alle drie talen, 147 borden, verkeerssituaties, lessen, oefenvragen, examens inclusief verlopen tijd en uitslag, offline toegang, accountverwijdering en aankoopherstel met de uiteindelijke production/TestFlight-build.
6. **Taalcontrole:** Laat Nederlands, Dari/Farsi en Pashto door bevoegde sprekers nalopen op juistheid, duidelijkheid en leesbaarheid op een iPhone. De automatische inhoudscontrole beoordeelt geen taalkwaliteit.

## Klaar voor de volgende technische ronde

- De examen-API rondt een poging na het verstrijken van de tijd af en toont een uitslag. Dit staat alleen op de testbranch; de live API moet apart worden uitgerold voordat een appversie daarop kan vertrouwen.
- De lokale lescache is per gebruiker en taal gescheiden. Een offline toegangsbewijs verloopt uiterlijk na 24 uur of eerder bij het verstrijken van een bekende cursustoegang.
- De testbranch kan zonder nieuwe build worden nagekeken. Een toekomstige build is pas zinvol na de hierboven genoemde betaal- en releasevoorbereiding.

## Bronnen

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple: niet-verlengende abonnementen aanmaken](https://developer.apple.com/help/app-store-connect/manage-subscriptions/create-non-renewing-subscriptions)
- [Expo: in-app aankopen](https://docs.expo.dev/guides/in-app-purchases/)
- [Expo: interne distributie](https://docs.expo.dev/build/internal-distribution/)
- [Expo: iOS indienen](https://docs.expo.dev/submit/ios/)
