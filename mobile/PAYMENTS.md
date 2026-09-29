# iOS-cursustoegang: voorbereidingsplan

De website verkoopt nu 30 dagen toegang via Mollie. De mobiele app herkent die bestaande toegang na inloggen via de centrale `entitlements`-tabel. De app start geen Mollie-checkout.

Voor aankoop **in de iPhone-app** komen drie niet-verlengende aankopen in App Store Connect die overeenkomen met de huidige taalpakketten:

| Bestaand pakket | Voorlopig Apple-product-ID |
| --- | --- |
| `theory_b_nl_30d` | `nl.mursaltheorie.course.nl.30d` |
| `theory_b_nl_fa_30d` | `nl.mursaltheorie.course.nl.fa.30d` |
| `theory_b_nl_ps_30d` | `nl.mursaltheorie.course.nl.ps.30d` |

De eigenaar moet de product-ID's en prijzen in App Store Connect goedkeuren en de betaalovereenkomst, bank- en belastinggegevens afronden. Tot die tijd verschijnt geen koopknop in de app. De vermelde prijzen op de website worden niet automatisch Apple-prijzen.

Na die stap:

1. Toon de Apple-producten met hun live StoreKit-prijs in het accountscherm.
2. Start de aankoop met StoreKit en stuur de transactie-ID naar de API.
3. Verifieer de ondertekende transactie bij Apple op de server, controleer app-ID, product-ID, transactiestatus en terugbetaling en koppel de aankoop eenmalig aan het ingelogde Clerk-account. Gebruik een stabiele Apple `appAccountToken` om verwisseling van accounts te voorkomen.
4. Maak of verleng de 30-daagse toegang in `entitlements` met bron `apple` (de bestaande databasewaarde), zodat `/api/v1/access` voor web en app dezelfde uitkomst geeft.
5. Verwerk App Store Server Notifications V2 voor terugbetalingen en statuswijzigingen. Voeg 'Herstel aankopen' toe via het ingelogde account en test in Apple's sandbox. Bij niet-verlengende abonnementen beheert onze server de 30-dageneinddatum en het herstel op andere toestellen.

Apple documenteert [niet-verlengende abonnementen](https://developer.apple.com/app-store/business-models/), [serververificatie](https://developer.apple.com/documentation/appstoreserverapi) en [herstel van aankopen](https://developer.apple.com/documentation/storekit/restoring-purchased-products).

Fysieke boeken blijven via de website verkocht. Dit plan wijzigt geen live betalingen of websitecode.
