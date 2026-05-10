# Simulatore di campane a slancio

Replica locale del simulatore di campane dell'Associazione Italiana di Campanologia
(https://campanologia.org/simulatore-campane).

36 campane interattive (3 ottave, da DO2 a SI4). Click per avviare/fermare,
massimo 10 campane simultanee. Replica fedele dell'originale (volume al 30%,
fade in/out, animazione swinging del battaglio).

## Setup

Servono `bash` e `curl`.

```bash
bash download-assets.sh
```

Scarica 36 file `.mp3` + 36 file `.ogg` in `sound/` e 4 SVG in `img/` da
campanologia.org. Lo script è idempotente.

## Esecuzione

Serve un server HTTP locale (l'apertura via `file://` può bloccare il
caricamento audio in alcuni browser):

```bash
python -m http.server 8000
```

Apri http://localhost:8000/ nel browser.

## Crediti

Audio e immagini SVG sono dell'Associazione Italiana di Campanologia
(https://campanologia.org). Questa è una replica locale del front-end
per uso personale; tutti i diritti sugli asset rimangono dei rispettivi
autori.
