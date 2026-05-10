# Simulatore di campane a slancio — Design Spec

**Data:** 2026-05-10
**Autore:** brainstorming session
**Sorgente di riferimento:** https://campanologia.org/simulatore-campane

## 1. Obiettivo

Creare una pagina `index.html` standalone che replichi fedelmente il simulatore di campane a slancio dell'Associazione Italiana di Campanologia, riutilizzando gli stessi asset audio e grafici scaricati localmente. La pagina deve funzionare offline una volta scaricati gli asset.

## 2. Scope

### In scope
- 36 campane interattive (3 ottave: DO2-SI4)
- Click per avviare/fermare il suono di una campana (loop con fade in/out)
- Animazione SVG della campana che oscilla con battaglio quando suona
- Limite di 10 campane simultanee (come l'originale)
- Pulsante "Ferma tutto"
- Asset audio e immagini scaricati una volta da campanologia.org e serviti localmente

### Out of scope
- Concerti/sequenze pre-impostate (Grosio, Sernio, Villapinta, Venezia, Bologna, ecc.)
- Supporto tastiera fisica
- Registrazione o sequenze custom
- Layout responsive dedicato per mobile
- Internazionalizzazione (solo italiano)

## 3. Struttura del progetto

```
campanaro/
├── index.html              # Pagina unica con CSS+JS embedded
├── download-assets.sh      # Script bash one-shot per scaricare gli asset
├── sound/                  # 72 file audio (36 mp3 + 36 ogg)
│   ├── c0.mp3, c0.ogg
│   ├── cis-des0.mp3, cis-des0.ogg
│   ├── ... (36 note totali)
│   └── h2.mp3, h2.ogg
└── img/
    ├── bell-light-grey.svg
    ├── bell-dark-grey.svg
    ├── bell-brown-wo-clapper.svg
    └── clapper-brown.svg
```

Tutto il codice (HTML + CSS + JS) sta in un unico `index.html` per semplicità di distribuzione e nessuna dipendenza esterna a runtime.

## 4. Mappatura ID → Nota

Convenzione di naming tedesca per gli ID (come l'originale), etichetta visualizzata in italiano.

### Note naturali
| Ottava | ID | Etichetta |
|--------|----|-----------|
| 0 (DO2-SI2) | `c0` `d0` `e0` `f0` `g0` `a0` `h0` | DO2 RE2 MI2 FA2 SOL2 LA2 SI2 |
| 1 (DO3-SI3) | `c1` `d1` `e1` `f1` `g1` `a1` `h1` | DO3 RE3 MI3 FA3 SOL3 LA3 SI3 |
| 2 (DO4-SI4) | `c2` `d2` `e2` `f2` `g2` `a2` `h2` | DO4 RE4 MI4 FA4 SOL4 LA4 SI4 |

### Alterazioni (5 per ottava)
| ID pattern | Etichetta (esempio ottava 2/SI4) |
|-----------|-----------|
| `cis-des{n}` | REb / DO# |
| `dis-es{n}` | MIb / RE# |
| `fis-ges{n}` | SOLb / FA# |
| `gis-as{n}` | LAb / SOL# |
| `ais-b{n}` | SIb / LA# |

Suffissi ottava: `0`=ottava 2 (più grave), `1`=ottava 3, `2`=ottava 4.

Numero di registro (cifra finale dell'etichetta) = ottava ID + 2.

## 5. Componenti

### 5.1 Definizione campane
Array di oggetti generato in JS:
```js
{ id: "c0", label: "DO2", sharp: false, row: 1, col: 1 }
{ id: "cis-des0", label: "REb2\nDO#2", sharp: true, row: 1, col: 2 }
...
```

Le 12 note cromatiche per ottava si ripetono per 3 ottave. Le righe sono ordinate dall'alto al basso come l'originale: ottava più acuta in alto (DO4-SI4), ottava più grave in basso (DO2-SI2).

### 5.2 Griglia HTML
3 righe × 12 colonne in un container flex (replica del `#flexbox` originale). Ogni cella è un `<div class="button">` con:
- `<img>` SVG della campana
- `<div class="label">` con il nome della nota

Classi: `button`, `b{n}` (1-36), `l{1|2|3}` (riga), `ringing` (quando attiva).

### 5.3 BellPlayer (classe vanilla JS)
Responsabilità:
- Inizializzazione: per ogni `.button`, crea un `HTMLAudioElement` lazy (al primo click) con sorgenti `.ogg` e `.mp3` come `<source>` fallback, attributo `loop`
- Click handling: toggle stato (idle ↔ ringing)
- Avvio: parte dopo `duration/24` secondi, fade-in volume 0→30% su `duration/6` secondi
- Stop: fade-out su `duration^2.5 * 0.02 * 1000` ms
- Animazione: cambia SVG, aggiunge clapper sovrapposto, applica `animation-name: swinging` con `animation-duration: duration/6 + "s"`
- Limite globale: massimo 10 campane simultaneamente attive (i click su una nuova campana sopra il limite vengono ignorati)
- Conta campane attive tramite contatore o tramite query `.ringing`

### 5.4 Controlli
- Pulsante "Ferma tutto": itera su tutte le campane con stato attivo e ferma ciascuna (simulando un click)

## 6. Comportamento dettagliato (replica fedele)

### Stato di una campana
- `idle`: SVG grigia (chiara per naturali, scura per alterazioni), nessuna animazione
- `ringing`: SVG marrone senza battaglio + battaglio sovrapposto, animazione swinging, audio in riproduzione

### Sequenza click → ringing
1. Click su campana idle
2. Se ci sono già 10 campane in `.ringing`: ignora il click
3. Altrimenti: crea/recupera l'`HTMLAudioElement`, attendi che `loadeddata` riporti la durata `dur`
4. Sostituisci `bell-{light|dark}-grey.svg` con `bell-brown-wo-clapper.svg`
5. Inserisci `<img class="clapper" src="clapper-brown.svg">` con `animation-duration: dur/6 + "s"`
6. Applica al `<img>` principale `animation-name: swinging`, `animation-duration: dur/6 + "s"`
7. Dopo `dur/24` secondi: avvia playback con volume iniziale 0, fade-in fino a 30% su `dur/6` secondi
8. Aggiungi classe `ringing` al div, segna stato come attivo

### Sequenza click → stop
1. Click su campana ringing
2. Avvia fade-out audio su `dur^2.5 * 0.02 * 1000` ms; al termine, pause + reset volume
3. Rimuovi classe `ringing`
4. Rimuovi clapper, rimuovi `animation-name`
5. Ripristina SVG grigia (chiara/scura in base al fatto che l'etichetta contenga `#`)

### Animazione CSS
```css
@keyframes swinging {
  0%   { transform: rotate(-10deg); }
  50%  { transform: rotate(10deg); }
  100% { transform: rotate(-10deg); }
}
```
La durata viene impostata via inline style in JS. Il CSS originale (`bell-simulator/css/style.css`) verrà adattato; le regole non rilevanti rimosse.

## 7. Asset

### 7.1 Audio
- 36 nomi file (uno per campana, vedi mappatura sezione 4)
- 2 formati: `.mp3` e `.ogg`
- Sorgente: `https://campanologia.org/bell-simulator/sound/{id}.{ext}`
- Destinazione: `./sound/{id}.{ext}`
- Totale: 72 file

### 7.2 Immagini
- 4 SVG da `https://campanologia.org/bell-simulator/img/`:
  - `bell-light-grey.svg`
  - `bell-dark-grey.svg`
  - `bell-brown-wo-clapper.svg`
  - `clapper-brown.svg`
- Destinazione: `./img/`

### 7.3 Script di download
`download-assets.sh`: crea le cartelle `sound/` e `img/`, scarica con `curl` tutti gli asset. Idempotente (skip se file esiste). Eseguito una sola volta in setup.

## 8. Caricamento audio

Approccio: HTML5 `<audio>` con due `<source>` (ogg + mp3 fallback). Creazione lazy al primo click per evitare di caricare 36 audio all'apertura della pagina. Una volta creato, l'elemento viene mantenuto in memoria per click successivi.

```html
<audio loop preload="none">
  <source src="sound/c0.ogg" type="audio/ogg">
  <source src="sound/c0.mp3" type="audio/mpeg">
</audio>
```

Per il fade in/out si usa interpolazione manuale via `setInterval` o `setTimeout` ricorsivo che modifica `audio.volume`.

## 9. Error handling

Confini di errore (da gestire esplicitamente):
- File audio mancante → log in console, click ignorato silenziosamente (l'utente vede la campana non animarsi)
- Browser senza supporto né mp3 né ogg → caso fuori scope (browser molto datato)

Per il resto si fida del DOM e dell'API audio (codice interno).

## 10. Testing

Verifica manuale dopo implementazione:
1. Aprire `index.html` (con `file://` o server locale per evitare problemi CORS)
2. Cliccare ogni campana di una riga: tutte devono suonare e animarsi
3. Cliccare 11 campane diverse rapidamente: la 11ª non deve partire
4. Cliccare di nuovo una campana attiva: deve fermarsi con fade-out
5. Cliccare "Ferma tutto" mentre ci sono ≥3 campane attive: tutte si fermano
6. Verifica visiva: grigio chiaro per naturali, scuro per alterazioni; SVG marrone+battaglio durante il ringing; etichette corrette

Nessun test automatico: il progetto è troppo piccolo e dipende da audio/animazioni che richiedono verifica umana.

## 11. Considerazioni note

- **CORS / file://**: aprire la pagina con doppio click (`file://`) potrebbe bloccare il caricamento audio in alcuni browser. Documentare nel README l'uso di un server locale (es. `python -m http.server`).
- **Volume al 30%**: come l'originale, per evitare distorsione con campane multiple.
- **Limite di 10**: scelto dall'originale; rispettato per fedeltà.
- **Loop infinito**: il suono di una campana isolata loopa finché non viene fermata, esattamente come l'originale.
