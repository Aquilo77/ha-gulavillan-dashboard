# Gulavillan

En sida i Home Assistants sidomeny. Hem är en isometrisk gul villa. Övriga flikar byggs av våningar, områden och enhetstyper i ditt Home Assistant. Inga entity_id, rum eller personnamn ligger i repot.

Du loggar in med ditt vanliga Home Assistant-konto. En egen port och en pinkod för hela sidan behövs inte längre.

## Två vyer

**Startsida** visar villan och bara de översiktskort som har data: belysning, klimat, energi, avvikelser, media, fordon och väder. Tomma kort ritas inte. Säkerhet visas när något är öppet, utlöst, olåst eller otillgängligt. Energikortet summerar bara watt och kilowattimmar var för sig. Saknas enhet räknas den inte in, och en kostnad hittas aldrig på.

**Kontrollpanel** är flikarna nedan, utan Hem. **Granska** syns när en enhet inte kunde klassas. Visa eller Dölj sparas i Home Assistant och skrivs inte över nästa gång enheterna läses in. Temat följer systemet tills du byter det med knappen uppe till höger. Valet ligger i webbläsaren.

Byggmallen från kollegan ligger i `HOME_ASSISTANT_AI_SPEC.md`. Den beskriver två egna program på port 3030 och 3001. Den vägen används inte: sidan är en integration i sidomenyn, med samma inloggning som Home Assistant, och den egna porten är av. Klassning, förtroende, granskningskö, sparade val och enhetsregler följer mallen. Automatisk visning gäller de kategorier som redan kunde klassas med hög säkerhet, annars skulle en fungerande sida bli tom. Osäkra enheter hamnar i kön i stället. Sidans färger, 14 px hörnradie och 56 px meny följer avsnitt 6 i den filen. Villan är illustrationen högst upp.

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

En ändring av sidan höjer inte versionsnumret. HACS ska inte visa en uppdatering, och Home Assistant ska inte startas om.

1. Öppna **Utvecklarverktyg → Åtgärder**.
2. Kör **gulavillan_dashboard.update_frontend**.
3. Skriv senaste **commit-hash** från `main` i fältet **Gren eller tagg** (inte bara ordet `main`). Hashen gör att panelen laddar om; samma ord `main` varje gång kan behålla gammal cache.
4. Väggplattan laddar om sig själv när sidan är bytt.

Om HACS ändå visar 0.9.1: installera den inte, och starta inte om. Det var ett misstag. Versionsnumret på `main` är 0.9.0 igen.

HACS-nedladdning och omstart behövs bara när Python-koden i integrationen ändras.

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
| Startsida | Isometrisk gul villa plus översiktskorten. Klocka, ute med graf, inne, luftfuktighet och elpris svävar runt huset. Fönstren tänds av lamporna och går att klicka. Dörren följer dörrsensorn. Status och närvaro ligger längs nederkanten. |
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
