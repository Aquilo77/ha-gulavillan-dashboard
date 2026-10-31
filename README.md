# Gulavillan

En sida på en egen port i Home Assistant. Ritningen ligger i det här repot, som en SVG med värden och grafer kopplade till entiteter. Porten väljs och byts inifrån Home Assistant. Sidan kan inte redigeras i webbläsaren.

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

## Byta port

Öppna integrationen **Gulavillan** och välj **Konfigurera**. Skriv den nya porten och spara. Sidan flyttar direkt, utan att hela Home Assistant startas om.

Välj inte Home Assistants egen port (oftast 8123).

## Sidan

Ritningen är `custom_components/gulavillan_dashboard/www/page.svg`. Den ändras här i repot, inte på sidan.

Sidan är en gul tvåvåningsvilla. Ute- och innetemperatur, klockan och luftfuktigheten ritas på huset. Grafen under takfoten är utetemperaturen det senaste dygnet. Fönster och lampan vid dörren går att klicka och tänder eller släcker lampan. Dörren ritas öppen eller stängd.

Saknas de namngivna entiteterna väljer sidan själv bland det som finns i Home Assistant:

| Plats på huset | Förstaval | Annars |
| --- | --- | --- |
| Ute, och grafen | `sensor.temperatur_ute` | En temperatursensor vars namn innehåller ute, utomhus eller liknande. Finns ingen sådan används väderentitetens temperatur. |
| Inne | `climate.vardagsrum` | En annan temperatursensor, eller klimatets aktuella temperatur. |
| Luftfuktighet | `sensor.luftfuktighet` | En sensor med enhetsklassen fuktighet. |
| Fönster och lampa | `light.vardagsrum`, `light.hall`, `light.kok`, `light.sovrum` | Lampor i huset, med vardagsrum, kök, hall och sovrum först. |
| Dörr | `binary_sensor.ytterdorr` | En dörrsensor. |

Saknas även det visas ett streck på den platsen.

Värdena kommer från Home Assistant via integrationens egen anslutning. Webbläsaren får ingen HA-token. En pinkod som sätts i integrationen gäller för att öppna sidan.

## Begränsningar

- En sida, den som ligger i repot.
- Grafer behöver att historik (Recorder) är påslagen.
- Porten måste vara nåbar på maskinen.
