# Gulavillan

En sida i Home Assistants sidomeny. Hem är en isometrisk gul villa. Övriga flikar byggs av våningar, områden och enhetstyper i ditt Home Assistant. Inga entity_id, rum eller personnamn ligger i repot.

Du loggar in med ditt vanliga Home Assistant-konto. En egen port och en pinkod för hela sidan behövs inte längre.

## Installation

Kräver Home Assistant Core 2026.10 eller nyare, och [HACS](https://hacs.xyz/).

1. Öppna **HACS → Integrationer**.
2. Öppna menyn uppe till höger och välj **Anpassade arkiv**.
3. Klistra in `https://github.com/Aquilo77/ha-gulavillan-dashboard` och välj kategori **Integration**.
4. Sök upp **Gulavillan** och tryck på **Ladda ner**. Starta inte om innan nedladdningen är klar.
5. Starta om Home Assistant en gång, så att integrationen kommer in.
6. Gå till **Inställningar → Enheter och tjänster → Lägg till integration** och välj **Gulavillan**.
7. En pinkod är valfri. Den används bara när larmet ska ändras från sidan.

Gulavillan syns sedan i sidomenyn. Första gången kopieras sidan till `/config/www/gulavillan/` och Home Assistant visar den som `/local/gulavillan/`.

## Uppdatera utseendet utan omstart

När en ny version av sidan finns på GitHub:

1. Öppna **Utvecklarverktyg → Åtgärder**.
2. Kör **gulavillan_dashboard.update_frontend**.
3. Lämna fältet tomt för senaste releasen, eller skriv en gren eller tagg.
4. Ladda om sidan i webbläsaren. En väggplatta som redan visar sidan laddar om sig själv när versionen ändras.

Det behövs ingen omstart av Home Assistant, och inte en ny nedladdning i HACS, för att byta villan, färger eller flikar. HACS-nedladdning och omstart behövs bara när Python-koden i integrationen ändras.

**gulavillan_dashboard.rollback_frontend** lägger tillbaka den förra sidkopian. Bara administratörer kan köra de här åtgärderna.

## Väggplatta

1. Skapa en vanlig användare i Home Assistant, inte en administratör, om plattan bara ska visa huset.
2. Öppna Home Assistant i webbläsaren eller i Companion-appen och logga in som den användaren.
3. Öppna **Gulavillan** i sidomenyn.
4. I Companion-appen kan du sätta den vyn som startskärm och slå på kioskläge, så att menyraden döljs.

Under **Konfigurera** kan sidan begränsas till administratörer, och namn och ikon i sidomenyn kan bytas.

## Flikar

En flik visas bara om det finns något att visa.

| Flik | Innehåll |
| --- | --- |
| Hem | Isometrisk gul villa. Klocka, ute med graf, inne, luftfuktighet och elpris svävar runt huset. Fönstren tänds av lamporna och går att klicka. Dörren följer dörrsensorn. Status och närvaro ligger längs nederkanten. |
| Belysning | Lampor per våning och område, med tänd/släck, ljusstyrka och släck allt. Strömbrytare kommer med bara om du valt dem. |
| Klimat | Klimat, temperatur, luftfuktighet och ljus per område, plus ute och väder. |
| Närvaro | Personer, enhetsspårare, rörelse och när den senast ändrades. |
| Säkerhet | Larm, dörrar, fönster, lås, rök, läckage och kamerabilder. Öppet markeras. Larmet kräver pinkoden en gång till om du har satt en. |
| Energi | Effekt nu, energi idag, elpris med dagens kurva, och laddbox om en sådan integration finns. |
| Media | Spelare som är igång, med spel/paus och volym. |
| System | Batterier under 20 %, väntande uppdateringar och antalet otillgängliga entiteter. |
| Familj | Kalender de närmaste två dygnen och skolmat, om de entiteterna finns. |

Entiteter utan område hamnar under **Övrigt**. Avstängda, dolda och diagnostik-entiteter visas inte.

Villan gissar utifrån område och enhetstyp. Det du väljer under **Konfigurera** vinner: utetemperatursensor, innetemperatur, luftfuktighet, klimat, dörr, lampor på huset, och vilka strömbrytare som ska räknas som lampor.

Färger, typsnitt, rundningar, skuggor och avstånd ligger i `www/theme.css` i sidfilerna.

## Egen port

Den egna porten är av som standard. Den kan slås på under **Konfigurera** om en gammal kiosk måste nå sidan utanför Home Assistant. Använd inte Home Assistants egen port. Den här vägen tas bort senare.

## Begränsningar

- Grafer behöver att historik (Recorder) är påslagen.
- Energi idag blir rätt om sensorn redan visar dagens förbrukning, till exempel en utility meter, eller om du väljer den under Konfigurera.
- Kamerabilder visas när kameran kan lämna en stillbild och användaren får läsa den.
