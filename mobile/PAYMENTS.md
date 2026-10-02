# iOS-cursustoegang: voorbereidingsplan

De website verkoopt nu 30 dagen toegang via Mollie. De mobiele app herkent die bestaande toegang na inloggen via de centrale `entitlements`-tabel. De app start geen Mollie-checkout.

De gekozen looptijd voor aankoop **in de iPhone-app** is 30 dagen zonder automatische verlenging. Nederlands kost € 49,99; Nederlands + Dari/Farsi en Nederlands + Pashto kosten elk € 65,00. Dit zijn de door de eigenaar opgegeven App Store-prijzen. De bestaande websiteprijzen zijn niet aangepast.

In App Store Connect zijn drie niet-verlengende abonnementen als concept aangemaakt voor Nederland en België:

| Bestaand pakket | Apple-product-ID | Gewenste prijs in Nederland en België |
| --- | --- | --- |
| `theory_b_nl_30d` | `nl.mursaltheorie.course.nl.30d` | €49,99 |
| `theory_b_nl_fa_30d` | `nl.mursaltheorie.course.nl.fa.30d` | €65,00 |
| `theory_b_nl_ps_30d` | `nl.mursaltheorie.course.nl.ps.30d` | €65,00 |

Stand op 1 oktober 2026: alle drie producten zijn nog `Prepare for Submission`. België en Nederland zijn geselecteerd; automatisch beschikbaar maken in toekomstige landen staat uit. De prijzen zijn in beide landen gecontroleerd: € 49,99 voor Nederlands en € 65,00 voor beide vertaalpakketten. Alle drie producten hebben een Nederlandse weergavenaam en beschrijving. Apple's prijswijziging voor het basisland heeft ook prijsberekeningen voor overige landen aangepast, maar die landen zijn niet voor verkoop geselecteerd. De app zelf kost € 0,00 en komt bij vrijgave alleen in Nederland en België beschikbaar. Versie 1.0 staat op handmatige vrijgave. De Paid Applications-overeenkomst en een bankrekening staan in App Store Connect als actief; dat is geen vervanging voor aankooptests of productgoedkeuring.

De StoreKit-schermen en serververificatie staan lokaal voorbereid. De koopknop blijft uit zolang `APPLE_IAP_ENABLED` niet bewust is geactiveerd. De databasewijziging en Apple-servergegevens zijn nog niet live ingesteld; er is geen sandbox-aankoop getest. De vermelde prijzen op de website worden niet automatisch Apple-prijzen. Vijf iPhone-schermafbeeldingen zijn proportioneel opgeschaald van 591 × 1280 naar 1242 × 2688 pixels en door App Store Connect geaccepteerd. Ze tonen cursus, borden, examenvraag, Farsi en Pashto; de lagere bronresolutie blijft zichtbaar. Een poging om het Nederlandse product aan review toe te voegen bevestigde dat Apple eerst een screenshot van het daadwerkelijke aankoopscherm eist. Die productscreenshots en een productiebuild ontbreken nog. De App Store-privacyopgave is gepubliceerd en de live privacyverklaring noemt nu Apple-aankopen. De contentrechtenverklaring staat op bevestigd. DAC7 staat op actief met de door de eigenaar bevestigde keuze dat de app alleen zelfstudie biedt.

Lokale controle op 1 oktober 2026: vier Apple-validatietests geslaagd, TypeScript-controle geslaagd en 147 verkeersborden plus 30 verkeerssituaties gevalideerd. Deze controles vervangen geen StoreKit-sandboxtest op een echte iPhone.

Voor vrijgave moeten deze onderdelen getest worden:

1. Toon de Apple-producten met hun live StoreKit-prijs in het accountscherm.
2. Start de aankoop met StoreKit en stuur de transactie-ID naar de API.
3. Verifieer de ondertekende transactie bij Apple op de server, controleer app-ID, product-ID, transactiestatus en terugbetaling en koppel de aankoop eenmalig aan het ingelogde Clerk-account. Gebruik een stabiele Apple `appAccountToken` om verwisseling van accounts te voorkomen.
4. Maak of verleng de 30-daagse toegang in `entitlements` met bron `apple` (de bestaande databasewaarde), zodat `/api/v1/access` voor web en app dezelfde uitkomst geeft.
5. Verwerk App Store Server Notifications V2 voor terugbetalingen en statuswijzigingen. Voeg 'Herstel aankopen' toe via het ingelogde account en test in Apple's sandbox. Bij niet-verlengende abonnementen beheert onze server de 30-dageneinddatum en het herstel op andere toestellen.

Apple documenteert [niet-verlengende abonnementen](https://developer.apple.com/app-store/business-models/), [serververificatie](https://developer.apple.com/documentation/appstoreserverapi) en [herstel van aankopen](https://developer.apple.com/documentation/storekit/restoring-purchased-products).

Fysieke boeken blijven via de website verkocht. Dit plan wijzigt geen live betalingen of websitecode.
