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

Den första sidan visar klocka, utetemperatur med graf, inomhustemperatur, luftfuktighet, ett hus där fönstren tänds med lampor, och ytterdörrens läge. Den förväntar sig de här entiteterna:

| Entitet | Visas som |
| --- | --- |
| `sensor.temperatur_ute` | Ute, med graf för senaste dygnet |
| `climate.vardagsrum` | Inomhustemperatur och läge |
| `sensor.luftfuktighet` | Luftfuktighet |
| `light.vardagsrum`, `light.kok`, `light.hall` | Fönster och lampa på huset |
| `binary_sensor.ytterdorr` | Dörr |

Saknas en entitet visas ett streck. Säg till vilka riktiga entity_id som ska användas, så byts de i SVG-filen.

Värdena kommer från Home Assistant via integrationens egen anslutning. Webbläsaren får ingen HA-token. En pinkod som sätts i integrationen gäller för att öppna sidan.

## Begränsningar

- En sida, den som ligger i repot.
- Grafer behöver att historik (Recorder) är påslagen.
- Porten måste vara nåbar på maskinen.
