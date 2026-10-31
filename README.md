# Gulavillan

En sida på en egen port i Home Assistant. Du ritar den som SVG, gärna med hjälp av en AI, och kopplar former, värden och grafer till dina entiteter. Porten väljs och byts inifrån Home Assistant.

## Installation

Kräver Home Assistant Core 2026.10 eller nyare, och [HACS](https://hacs.xyz/).

1. Öppna **HACS → Integrationer**.
2. Öppna menyn uppe till höger och välj **Anpassade arkiv**.
3. Klistra in `https://github.com/Aquilo77/ha-gulavillan-dashboard` och välj kategori **Integration**.
4. Sök upp **Gulavillan** och tryck på **Ladda ner**. Starta inte om innan nedladdningen är klar. HACS tar bort arkiv som inte har laddats ner.
5. Starta om Home Assistant.
6. Gå till **Inställningar → Enheter och tjänster → Lägg till integration** och välj **Gulavillan**.
7. Välj port (förval **8350**) och, om du vill, en pinkod.

Sidan finns sedan på `http://<din-home-assistant>:8350/`. Redigering finns på `/edit`.

## Byta port

Öppna integrationen **Gulavillan** och välj **Konfigurera**. Skriv den nya porten och spara. Sidan flyttar direkt, utan att hela Home Assistant startas om.

Välj inte Home Assistants egen port (oftast 8123).

## Rita sidan med AI

1. Öppna `/edit` på Gulavillans port.
2. Tryck på **Kopiera AI-instruktion**. Texten innehåller reglerna och dina entiteter.
3. Klistra in den i din AI och be den rita en SVG.
4. Klistra in SVG:n i rutan, förhandsvisa och spara.

Kopplingarna sitter i SVG-attribut:

| Attribut | Betydelse |
| --- | --- |
| `data-entity="sensor.exempel"` | Vilken entitet formen hör till |
| `data-widget="value"` | Tillståndet, med `data-decimals` om det är ett tal |
| `data-widget="label"` | På, Av, Öppen och liknande |
| `data-widget="name"` / `unit` | Namn och enhet |
| `data-widget="clock"` / `date` | Klocka och datum |
| `data-widget="sparkline"` `data-hours="24"` | Graf på en `rect` |
| `data-widget="state-fill"` `data-on` `data-off` | Färg när entiteten är på eller av |
| `data-widget="bar"` `data-min` `data-max` | En `rect` vars bredd fylls av värdet |

Skript, externa bilder och klick-hanterare tas bort när sidan sparas. Värdena kommer från Home Assistant via integrationens egen anslutning. Webbläsaren får ingen HA-token.

En pinkod som sätts i integrationen gäller både visning och redigering. Lämna den tom bara om porten inte ska nås från nätverk du inte litar på.

## Begränsningar

- En sida per installation.
- Grafer behöver att historik (Recorder) är påslagen.
- Porten måste vara nåbar på maskinen. Home Assistant öppnar den inte automatiskt i alla nätverksinställningar.
- Sidan är SVG som du (eller en AI) skriver. Den är inte Lovelace-redigeraren.
