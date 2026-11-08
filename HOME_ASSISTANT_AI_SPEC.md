# AI-byggmall för Home Assistant – startsida och kontrollpanel

Version 1.0 | Modell C: AI-installation + dynamisk enhetsupptäckt

## 0. Uppdrag till kodagenten

Du är en erfaren Home Assistant-, Node.js- och React-utvecklare. Bygg två sammanhängande webbappar i en Home Assistant OS-installation: **Startsida** för överblick och **Kontrollpanel** för styrning. Använd specifikationen nedan som målbild. Inventera installationen innan du väljer kort och funktioner. Kopiera inte entitets-ID:n, rum eller utrustning från något annat hem. Implementera i verifierbara etapper och dokumentera varje beslut.

**Viktiga gränser:** Läsning/inventering är tillåten när behörighet finns. Begär uttryckligt godkännande innan du installerar tillägg, ändrar befintlig HA-konfiguration, exponerar portar, skapar autentiseringsuppgifter, aktiverar styrning eller ersätter filer. Gör inga destruktiva ändringar. Om anslutning eller behörighet saknas: rapportera exakt vad som behövs, och bygg/testa lokalt med exempeldata under tiden.

## 1. Mål och acceptanskriterier

- Två appar med gemensam design och navigation, responsiva för mobil, surfplatta och dator.
- Inventering av områden, enheter, entiteter, integrationer och tillgängliga tjänster/åtgärder.
- Automatiskt uppdaterade statusvärden och upptäckt av tillkomna/borttagna entiteter.
- Relevanta kort skapas utifrån verifierade funktioner; okända objekt placeras i en granskningskö.
- Användarens layout, namn, synlighet och manuella mappningar bevaras vid synkronisering och uppdatering.
- Backend förmedlar behörighetskontrollerade läs- och styranrop; inga HA-nycklar i frontend.
- Säkerhetskopiering, rollback, hälsokontroller och dokumenterad uppgraderingsväg.
- Inga påståenden om lyckad installation utan verifierade tester.

## 2. Arkitektur

```text
Webbläsare (React + Vite + TypeScript)
        | HTTPS / samma ursprung
        v
Node.js / Express (auth, API, WebSocket/SSE, statiska filer)
        | Home Assistant REST + WebSocket
        v
Home Assistant Core (Supervisor API/token i add-on-miljö)
        |
        +-- områden, enheter, entiteter, tillstånd, tjänster

Gemensam konfigurationsmodell + entitetskatalog
        |-- upptäckta objekt (maskingenererade)
        |-- användarval (persistenta, högre prioritet)
        +-- layoutregler / kortdefinitioner
```

Behåll två separata appar som i ursprungsmallen: startsida på föreslagen port 3030 och kontrollpanel på 3001. Gemensamma paket kan delas vid byggtid. Kontrollera portkonflikter före användning. Ett alternativ är en gemensam backend och två routade frontend-appar; välj inte det alternativet utan att dokumentera avvikelsen från originalet.

Teknik: Node.js LTS, Express, React, Vite, TypeScript, CSS-variabler. Bygg frontend och produktionsberoenden för rätt målarkitektur före deploy. Lita inte på Windows-genererade `node_modules` i en Linux-container. Lagra appkod och data i tilläggens persistenta, tillåtna lagringsutrymmen; verifiera faktiska mounts och rättigheter i målmiljön. Hemligheter i add-on-miljön eller säker konfiguration, aldrig i repo eller klientkod.

## 3. Inventering – kör först

1. Identifiera HA-version, installationstyp, CPU-arkitektur, tillgängliga tillägg, befintliga portar och lagringsutrymme.
2. Hämta områdes-, enhets- och entitetsregister via stödda HA-API:er/WebSocket-anrop med korrekt behörighet.
3. Hämta aktuella tillstånd, attribut, enhetsklasser, måttenheter, tillgängliga styrfunktioner och kopplingar mellan område/enhet/entitet.
4. Dokumentera integrationskällor, `unavailable`/`unknown`, dolda/avaktiverade entiteter och eventuella dubbletter.
5. Bygg en normaliserad katalog med stabila interna ID:n. Behåll HA:s egna ID:n som referenser; härled aldrig identitet enbart från visningsnamn.
6. Skapa inventeringsrapport: antal per domän, område, föreslagen kategori, säkerhetsklass och osäkra mappningar.
7. Presentera en kort plan för användaren innan ändringar görs.

## 4. Klassificering och kortval

Klassificera först med HA-domän, device_class, capabilities och områdestillhörighet; använd namn som sekundär signal. Ange säkerhet/konfidens i varje matchning. Ingen AI behövs vid normal synkronisering.

| Kategori | Exempel på entiteter | Startsida | Kontrollpanel |
|---|---|---|---|
| Belysning | `light.*` | Påslagna lampor, status | Rum, dimning, färg där stödd |
| Klimat | `climate.*`, temperatur, luftfuktighet | Temperatur och avvikelser | Termostater och historik |
| Energi | Effekt/energi med rätt enheter | Total effekt, dygnsenergi | Grafer, delsystem, kostnad om data finns |
| Säkerhet | Lås, dörrar, larm, läckage | Viktiga avvikelser | Status och skyddade åtgärder |
| Media | `media_player.*` | Aktiv uppspelning | Volym och kontroller |
| Fordon/laddning | Integrationens verifierade entiteter | Laddstatus | Laddning och scheman där stödd |
| Väder | `weather.*` | Aktuellt väder | Prognos om tillgänglig |
| Övrigt | Okända entiteter | Inte automatiskt | Granskningskö |

Skapa aldrig tomma kort för saknade kategorier. Presentera inte uppskattad energikostnad som mätvärde om pris eller energidata saknas. Kontrollera enheter och state_class innan summering. Prioritera användbara statuskort framför att visa alla sensorer.

## 5. Dynamisk upptäckt och synkronisering

- Prenumerera på relevanta HA-händelser och state-uppdateringar via WebSocket; återanslut med backoff och återhämta fullständigt tillstånd efter avbrott.
- Kör dessutom periodisk avstämning av registren, exempelvis vid uppstart och var 15:e minut; frekvens konfigurerbar.
- Ny entitet: klassificera och föreslå kort. Lägg till automatiskt endast om kategorin är godkänd för autoinkludering och konfidensen är hög.
- Ändrad entitet: uppdatera kapabiliteter och tillstånd utan att nollställa användarinställningar.
- Borttagen entitet: markera som saknad och erbjud återkoppling; radera inte manuella kort automatiskt.
- `unavailable`/`unknown`: visa tydligt men låt övriga kort fungera.
- Spara användarens overrides separat från den genererade katalogen.
- Konfliktordning: säkerhetspolicy > användarens uttryckliga inställningar > verifierade funktioner > automatiska förslag.
- Spara senaste synktid, fel och ändringslogg. Ge användaren möjlighet att godkänna eller avvisa nya kort.

## 6. Layout och design – bevara originalets formspråk

- Ljus, luftig yta med vita kort; separat omsorgsfullt mörkt tema.
- Gemensamma CSS-variabler: `--page`, `--surface-1`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--good`, `--warn`, `--bad`, `--shadow`, `--radius`.
- Ljust: page `#f7f8fa`, surface `#ffffff`, accent `#1b63c4`, border `#e7e9ee`.
- Mörkt: page `#0f1115`, surface `#171a20`, accent `#4b8ff0`, border `#262a33`.
- Hörnradie 14 px; kortmellanrum 16 px på större skärmar, 12 px på mobil; korttitel 16 px / 700.
- Menyrad 56 px, ikon vänster och navigationspil höger i kortens rubriker.
- Stor husbild eller användarvald illustration högst upp, datum, klocka och väder. Om bild saknas: neutral fallback; generera inte påstått foto av huset.
- Statusrad under hero. Tre kolumner över 1180 px, två kolumner upp till 1180 px, en kolumn under 820 px. Mobilanpassad padding under 640 px.
- Kort öppnar detaljpanel eller undersida. Samma meny på båda apparna och undersidorna.
- Tema följer systemet som standard, manuellt val sparas lokalt; sätt tema innan första rendering.
- Tillgänglighet: tangentbordsnavigering, fokusindikator, semantiska kontroller, tydliga fel, kontrast minst 4,5:1 för normal text.

## 7. Konfiguration och användarändringar

Använd en versionerad JSON-konfiguration eller databas med migreringar. Föreslagen struktur:

```json
{
  "schemaVersion": 1,
  "discovery": {"enabled": true, "reconcileMinutes": 15, "autoAddCategories": ["weather"]},
  "layout": {"homepage": [], "controlPanel": []},
  "overrides": {"entities": {}, "cards": {}, "areas": {}},
  "reviewQueue": []
}
```

Objekt i `layout` bör ha stabila kort-ID:n, kategori, område, entitetsreferenser, sorteringsordning och synlighet. Spara atomiskt och gör backup före migrering. Skriv aldrig över `overrides` vid automatisk upptäckt eller deploy.

## 8. Backend-API och realtid

Minst följande interna API:er, med validering, åtkomstkontroll och tydliga felkoder:

- `GET /api/health` – apphälsa, version och HA-anslutningsstatus.
- `GET /api/catalog` – normaliserade objekt och capabilities.
- `GET /api/dashboard` – renderbar layout med tillstånd.
- `GET /api/review-queue` – förslag och osäkra klassificeringar.
- `PATCH /api/preferences` – sparade användarval, med schemavalidering.
- `POST /api/actions` – strikt tillåtelselista av HA-åtgärder; kontrollera mål, domän, tillstånd, behörighet och eventuell bekräftelse.
- WebSocket eller SSE för statusändringar, synkresultat och anslutningsstatus.

Exponera inte generisk, obegränsad HA-proxy till webbläsaren. Skydda ändrande anrop mot CSRF om cookie-autentisering används. Lägg till rate limiting, strukturerad loggning och redigering av hemligheter i loggar. För fjärråtkomst: använd verifierad autentisering och HTTPS via lämplig ingress/reverse proxy; anta inte att en publicerad port är skyddad av Home Assistant-inloggning.

## 9. Installation och uppdatering

1. Kontrollera om HA OS med Supervisor finns; om inte, redovisa annan installationsstrategi innan genomförande.
2. Bygg frontend och backend för målarkitektur; lås beroendeversioner och kör tester.
3. Skapa lokala HA-tillägg för startsida och kontrollpanel med unika sluggar, portar och persistenta datamounts. Kontrollera korrekt add-on-konfigurationssyntax mot aktuell HA-version.
4. Installera först efter godkännande; starta med minimala behörigheter.
5. Driftsätt med staging-katalog, verifiera filer och byt atomiskt när möjligt.
6. Ta backup av aktiv kod, konfiguration och data före byte.
7. Starta om en app i taget, verifiera health och grundläggande API-anrop.
8. Om health eller kritiska tester misslyckas: återställ föregående version och rapportera felet.
9. Dokumentera SSH-/CLI-kommandon som faktiskt fungerar i målversionen; hårdkoda inte äldre `ha addons`/nyare `ha apps` utan kontroll.

## 10. Tester

**Enhetstester:** klassificering, prioritet mellan auto- och användarinställningar, normalisering av energienheter, migreringar, validering av styranrop.

**Integrationstester:** API-autentisering, reconnect efter HA-avbrott, tillagd/borttagen entitet, `unknown`/`unavailable`, fel i enskilda kort, skyddade åtgärder.

**Visuella tester:** desktop, surfplatta, mobil, ljust/mörkt tema, tomt system, många entiteter, långa namn, tangentbordsnavigering.

**Drifttester:** omstart av HA/tillägg, backup/restore, uppgradering och rollback.

## 11. Arbetsordning för AI-agenten

**Fas 1 – Läsning:** verifiera miljö, inventera och skapa en rapport utan att ändra något.

**Fas 2 – Plan:** föreslå kategorier, kort och layout; markera osäkra antaganden och vilka ändringar som kräver godkännande.

**Fas 3 – Bygg:** implementera gemensamma komponenter, backend, katalog, konfigurationslager och realtid. Använd mockdata om HA inte är tillgängligt.

**Fas 4 – Verifiering:** kör tester och visa vilka kriterier som passerat respektive misslyckats.

**Fas 5 – Installation:** begär godkännande för faktisk driftsättning och port-/behörighetsändringar; installera, testa och dokumentera.

**Fas 6 – Överlämning:** redovisa åtkomstadresser, installerade versioner, backup, återställningsinstruktioner, återstående begränsningar och hur användaren godkänner nya kort.

## 12. Förväntade leverabler

- Fullständig källkod för båda apparna och gemensamma paket.
- Lokala tilläggsdefinitioner, bygg- och driftsättningsskript.
- Exempelkonfiguration utan hemligheter.
- Inventeringsrapport och lista över föreslagna/aktiva kort.
- Tester, installationsguide, felsökningsguide och rollback-instruktioner.
- Ändringslogg och dokumentation för framtida AI-agentkörningar.

## 13. Saker agenten inte får anta

- Att samma sensorer, rum eller integrationer finns som i originalhemmet.
- Att en entitets namn ensamt avgör dess funktion.
- Att alla sensorer får summeras eller att effekt och energi är utbytbara.
- Att HA-tillägg automatiskt får säkert externåtkomstskydd.
- Att add-on-kommandon, Supervisor-API:er eller mounts är identiska i alla HA-versioner.
- Att användaren vill ha automatisk styrning eller att alla upptäckta enheter ska visas.
- Att en installation är lyckad innan den faktiskt har verifierats.

---

**Användning:** Lägg denna fil i projektets rot som `HOME_ASSISTANT_AI_SPEC.md`. Be agenten: ”Läs hela specifikationen. Börja med fas 1, gör inga ändringar innan du redovisat inventering och plan. Följ sedan faserna i ordning.”
