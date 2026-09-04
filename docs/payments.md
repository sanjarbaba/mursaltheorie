# Betalingen activeren

De betaalbackend gebruikt Mollie Checkout. Mursaltheorie ontvangt of bewaart geen kaartnummer, CVC of vervaldatum.

Benodigde Vercel-variabelen:

- `MOLLIE_API_KEY` — gebruik eerst `test_...` en pas na een geslaagde eindtest `live_...`.
- `APP_URL=https://www.mursaltheorie.nl`
- `RESEND_API_KEY` — server-side sleutel voor aankoop- en ontbindingsbevestigingen.
- `TRANSACTIONAL_EMAIL_FROM=Mursaltheorie <noreply@mursaltheorie.nl>` — alleen gebruiken nadat het domein bij de e-mailprovider is geverifieerd.

De checkout stuurt per betaling deze webhook-URL naar Mollie:

`https://www.mursaltheorie.nl/api/v1/access?resource=mollie-webhook`

De Mollie-webhook bevat alleen een betalings-ID. De server haalt daarom de actuele betaling opnieuw op bij Mollie en accepteert uitsluitend status `paid`, EUR en het exacte serverbedrag. Een betaling maakt eerst een wachtende aankoop en een wachtend toegangsrecht aan. De 30 dagen beginnen pas nadat de aankoopbevestiging is verzonden en de klant zelf activeert. Herhaalde meldingen zijn idempotent.

Voer vóór deployment migratie `031_purchase_activation_and_withdrawal.sql` uit. Deze bewaart de gebruikte toestemmingsverklaring, bevestiging, activatie, ontbinding en eventuele Mollie-terugbetaling.

De online ontbindingsfunctie staat in het account en is bereikbaar via `/learn5?withdraw=1`. Een betaalde, nog niet geactiveerde aankoop wordt via Mollie volledig terugbetaald. Na geldige activatie is deze standaardontbinding voor digitale inhoud niet meer beschikbaar; wettelijke rechten bij gebrekkige levering blijven bestaan.

De checkout wordt voor een ingelogde gebruiker gestart met een `POST` naar:

`/api/v1/access?resource=checkout`

De checkout gebruikt een korte idempotency-sleutel tegen dubbele betalingen door herhaald klikken. Een account dat al actieve toegang heeft, krijgt geen nieuwe checkout.

Producten:

- `theory_b_nl_30d`: Nederlands, €29,99, 30 dagen.
- `theory_b_nl_fa_30d`: Nederlands + Dari/Farsi, €49,99, 30 dagen.

Pashto is niet te koop zolang de inhoudelijke controle niet is afgerond.

Zonder `MOLLIE_API_KEY` blijft betalen bewust uitgeschakeld met foutcode `PAYMENTS_NOT_CONFIGURED`.

## Teststatus

Op 4 september 2026 is de productieketen met een Mollie-testbetaling volledig gecontroleerd:

- de Nederlandse checkout toont €29,99 en de juiste productomschrijving;
- de Nederlands + Dari/Farsi-checkout toont €49,99 en de juiste productomschrijving;
- annuleren keert terug naar de website zonder toegang toe te kennen;
- een geslaagde testbetaling wordt als `payment.paid` geregistreerd;
- de oude webhook kende in de eerste technische test direct 30 dagen toegang toe voor `theory_b_nl_fa_30d`;
- de accountweergave verbergt daarna de betaalopties en een Dari-les opent.

De productieomgeving gebruikt nog een Mollie-testsleutel. Na invoering van migratie 031 moet de volledige nieuwe keten opnieuw worden getest: betaling → bevestigingsmail → handmatige activatie → precies 30 dagen, plus een afzonderlijke betaling → online ontbinding → Mollie-terugbetaling → bevestigingsmail. Vervang de sleutel pas daarna door een livesleutel.
