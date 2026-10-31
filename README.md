# Gulavillan

En sida på en egen port i Home Assistant. Hem är en SVG-villa. Övriga flikar byggs av det som finns i Home Assistant just nu: områden, våningar och enhetstyper. Inga entity_id, rum eller personnamn ligger i repot. Porten väljs och byts inifrån Home Assistant. Sidan kan inte redigeras i webbläsaren.

## Installation

Kräver Home Assistant Core 2026.10 eller nyare, och [HACS](https://hacs.xyz/).

1. Öppna **HACS → Integrationer**.
2. Öppna menyn uppe till höger och välj **Anpassade arkiv**.
3. Klistra in `https://github.com/Aquilo77/ha-gulavillan-dashboard` och välj kategori **Integration**.
4. Sök upp **Gulavillan** och tryck på **Ladda ner**. Starta inte om innan nedladdningen är klar. HACS tar bort arkiv som inte har laddats ner.
5. Starta om Home Assistant.
6. Gå till **Inställningar → Enheter och tjänster → Lägg till integration** och välj **Gulavillan**.
7. Välj port (förval **8350**) och, om du vill, en pinkod.

Sidan finns sedan på `http://<din-home-assistant>:8350/`.

## Byta port och välja entiteter

Öppna integrationen **Gulavillan** och välj **Konfigurera**. Där byter du port och pinkod. Där kan du också peka ut villans sensorer, vilka lampor som sitter i fönstren, och vilka strömbrytare som ska räknas som lampor. Tomma fält betyder att sidan väljer själv. Sidan flyttar port direkt, utan att hela Home Assistant startas om.

Välj inte Home Assistants egen port (oftast 8123).

## Flikar

En flik visas bara om det finns något att visa.

| Flik | Innehåll |
| --- | --- |
| Hem | Isometrisk gul villa. Klocka, ute med graf, inne, luftfuktighet och elpris svävar runt huset. Fönstren tänds av lamporna och går att klicka. Dörren följer dörrsensorn. Status och närvaro ligger längs nederkanten. |
| Belysning | Lampor per våning och område, med tänd/släck, ljusstyrka och släck allt. Strömbrytare kommer med bara om du valt dem. |
| Klimat | Klimat, temperatur, luftfuktighet och ljusstyrka per område, plus ute och väder. |
| Närvaro | Personer, enhetsspårare, rörelse och när den senast ändrades. |
| Säkerhet | Larm, dörrar, fönster, lås, rök, läckage och kamerabilder. Öppet och otillgängligt markeras. Larmet kräver sidans pinkod en gång till. |
| Energi | Effekt nu, energi idag, elpris med dagens kurva, och laddbox om en sådan integration finns. |
| Media | Spelare som är igång, med spel/paus och volym. |
| System | Batterier under 20 %, väntande uppdateringar och antalet otillgängliga entiteter. |
| Familj | Kalender de närmaste två dygnen och skolmat, om de entiteterna finns. |

Entiteter utan område hamnar under **Övrigt**. Avstängda, dolda och diagnostik-entiteter visas inte.

Villan gissar utifrån område och enhetstyp: en temperatursensor vars namn låter som ute, annars vädrets temperatur; innetemperatur från ett områdes temperatursensor; luftfuktighet och dörr på samma sätt. Lampor i ett område används till fönstren. Det du väljer under Konfigurera vinner.

Färger, typsnitt, rundningar, skuggor och avstånd ligger i `custom_components/gulavillan_dashboard/www/theme.css`.

Värdena kommer från Home Assistant via integrationens egen anslutning. Webbläsaren får ingen HA-token. En pinkod som sätts i integrationen gäller för att öppna sidan.

## Begränsningar

- Ritningen av huset ändras i repot, inte på sidan.
- Grafer behöver att historik (Recorder) är påslagen.
- Energi idag blir rätt om sensorn redan visar dagens förbrukning, till exempel en utility meter, eller om du väljer den under Konfigurera.
- Kamerabilder visas när kameran kan lämna en stillbild.
- Porten måste vara nåbar på maskinen.
