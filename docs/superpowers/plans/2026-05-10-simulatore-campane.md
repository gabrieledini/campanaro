# Simulatore di campane — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `index.html` that replicates the bell-ringing simulator from campanologia.org, with locally-served audio and SVG assets.

**Architecture:** Single HTML file with embedded CSS and vanilla JS. A `BellPlayer` class manages 36 `<audio>` elements (lazy-loaded with ogg/mp3 fallback) and animation state. Bell grid is generated programmatically from a definitions array. Assets are downloaded once via a setup script.

**Tech Stack:** HTML5 + Vanilla JavaScript (no dependencies) + HTML5 Audio API + CSS keyframe animations. `bash` + `curl` for asset download.

**Spec:** `docs/superpowers/specs/2026-05-10-simulatore-campane-design.md`

**Note on testing:** This is a small frontend with audio/animation behavior that requires human verification. Each task ends with a **manual verification step** instead of automated tests. The verification is just as binding as a passing test — do not mark a task complete until verification passes.

**Note on file paths:** Working directory is `C:\Users\g.dini\Downloads\campanaro`. The shell is bash on Windows (MSYS), so use forward slashes in commands.

---

## File Structure

After this plan is complete, the project will look like:

```
campanaro/
├── index.html              # Single-page app (HTML+CSS+JS embedded)
├── download-assets.sh      # One-shot asset downloader
├── README.md               # How to run the simulator
├── sound/                  # 36×mp3 + 36×ogg = 72 files
│   ├── c0.mp3, c0.ogg, ...
│   └── h2.mp3, h2.ogg
├── img/                    # 4 SVG assets
│   ├── bell-light-grey.svg
│   ├── bell-dark-grey.svg
│   ├── bell-brown-wo-clapper.svg
│   └── clapper-brown.svg
├── docs/                   # Spec + plan (already exists)
└── .gitignore              # Ignore _source.html, _style.css, _Soundmanager.js
```

`index.html` is split internally into clearly-labeled sections:
1. `<style>` — layout + animations
2. Bell grid container `<div id="flexbox">`
3. "Ferma tutto" button
4. `<script>` — `NOTES_PER_OCTAVE` + `OCTAVE_ROWS` data tables, `buildBellGrid` function, `BellPlayer` class, init

---

## Task 1: Project initialization and asset download

**Files:**
- Create: `download-assets.sh`
- Create: `.gitignore`
- Modify: working directory (init git)

- [ ] **Step 1: Initialize git and clean up scratch files**

The brainstorming session left three scratch files in the directory: `_source.html`, `_style.css`, `_Soundmanager.js`. These are reference material, not project files. Add them to `.gitignore`.

Run:
```bash
cd "C:/Users/g.dini/Downloads/campanaro" && git init
```

Expected: `Initialized empty Git repository in .../campanaro/.git/`

- [ ] **Step 2: Create `.gitignore`**

Create `C:/Users/g.dini/Downloads/campanaro/.gitignore` with content:
```
# Reference material from brainstorming
_source.html
_style.css
_Soundmanager.js

# OS junk
Thumbs.db
.DS_Store
```

- [ ] **Step 3: Write the asset download script**

Create `C:/Users/g.dini/Downloads/campanaro/download-assets.sh` with content:
```bash
#!/usr/bin/env bash
# Downloads all bell audio (mp3 + ogg) and SVG images from campanologia.org.
# Idempotent: skips files that already exist.
set -euo pipefail

BASE_URL="https://campanologia.org/bell-simulator"
SOUND_DIR="sound"
IMG_DIR="img"

mkdir -p "$SOUND_DIR" "$IMG_DIR"

# Bell IDs: 12 chromatic notes per octave × 3 octaves
NATURALS=(c d e f g a h)
SHARPS=(cis-des dis-es fis-ges gis-as ais-b)
# Sharp positions (which natural they follow):
# cis-des after c, dis-es after d, fis-ges after f, gis-as after g, ais-b after a

OCTAVES=(0 1 2)
EXTS=(mp3 ogg)

download_if_missing() {
  local url="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "  skip (exists): $dest"
    return
  fi
  echo "  download: $dest"
  curl -fsSL -o "$dest" "$url"
}

echo "== Downloading audio files =="
for oct in "${OCTAVES[@]}"; do
  for note in "${NATURALS[@]}"; do
    for ext in "${EXTS[@]}"; do
      download_if_missing "$BASE_URL/sound/${note}${oct}.${ext}" "$SOUND_DIR/${note}${oct}.${ext}"
    done
  done
  for note in "${SHARPS[@]}"; do
    for ext in "${EXTS[@]}"; do
      download_if_missing "$BASE_URL/sound/${note}${oct}.${ext}" "$SOUND_DIR/${note}${oct}.${ext}"
    done
  done
done

echo "== Downloading SVG assets =="
for img in bell-light-grey bell-dark-grey bell-brown-wo-clapper clapper-brown; do
  download_if_missing "$BASE_URL/img/${img}.svg" "$IMG_DIR/${img}.svg"
done

echo "== Done =="
echo "Sound files: $(ls "$SOUND_DIR" | wc -l)"
echo "Image files: $(ls "$IMG_DIR" | wc -l)"
```

- [ ] **Step 4: Run the download script**

Run from project root:
```bash
cd "C:/Users/g.dini/Downloads/campanaro" && bash download-assets.sh
```

Expected output ends with:
```
Sound files: 72
Image files: 4
```

If any download fails (HTTP error), the script exits non-zero — re-run after investigating. The script is idempotent so successful downloads are not re-fetched.

- [ ] **Step 5: Verify assets**

```bash
cd "C:/Users/g.dini/Downloads/campanaro" && ls sound/ | wc -l && ls img/
```

Expected:
- `sound/` count: `72`
- `img/` listing: `bell-brown-wo-clapper.svg  bell-dark-grey.svg  bell-light-grey.svg  clapper-brown.svg`

Sanity-check one audio file plays at all (open file directly):
```bash
ls -la sound/c0.mp3 sound/c0.ogg
```
Expected: both files exist with non-zero size (typically several KB to a few hundred KB each).

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/g.dini/Downloads/campanaro" && git add .gitignore download-assets.sh docs/ && git commit -m "chore: project init, asset download script, spec & plan"
```

Note: `sound/` and `img/` are NOT committed. They are runtime assets reproducible via the script. (If the user later wants them committed too, they can `git add sound/ img/` separately.)

---

## Task 2: HTML skeleton with bell grid (static layout, no JS yet)

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create the base HTML structure**

Create `C:/Users/g.dini/Downloads/campanaro/index.html` with content:
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Simulatore di campane a slancio</title>
  <style>
    /* CSS will be added in Task 3 */
  </style>
</head>
<body>
  <h1>Simulatore di campane a slancio</h1>
  <div class="big-table">
    <div id="wrapper">
      <div id="flexbox"></div>
    </div>
  </div>
  <p><button id="stopAll">Ferma tutto</button></p>

  <script>
    // BELL_DEFS and BellPlayer will be added in Task 4
  </script>
</body>
</html>
```

- [ ] **Step 2: Add the bell definitions array and grid generator**

Inside the `<script>` tag, add:
```javascript
// 12 chromatic notes per octave; rendered as a row in the grid.
// `id` matches the audio filename (German notation).
// `label` is the Italian display label (will get the octave number appended).
// `sharp` controls which SVG is used (light vs dark grey).
const NOTES_PER_OCTAVE = [
  { id: "c",       label: "DO",         sharp: false },
  { id: "cis-des", label: "REb\nDO#",   sharp: true  },
  { id: "d",       label: "RE",         sharp: false },
  { id: "dis-es",  label: "MIb\nRE#",   sharp: true  },
  { id: "e",       label: "MI",         sharp: false },
  { id: "f",       label: "FA",         sharp: false },
  { id: "fis-ges", label: "SOLb\nFA#",  sharp: true  },
  { id: "g",       label: "SOL",        sharp: false },
  { id: "gis-as",  label: "LAb\nSOL#",  sharp: true  },
  { id: "a",       label: "LA",         sharp: false },
  { id: "ais-b",   label: "SIb\nLA#",   sharp: true  },
  { id: "h",       label: "SI",         sharp: false }
];

// Octave row mapping: row 0 (top) = highest octave (DO4-SI4), row 2 (bottom) = lowest (DO2-SI2).
// `octIndex` matches the original ID suffix: 0 = octave 2, 1 = octave 3, 2 = octave 4.
// Original CSS uses class `l1` for bottom row (octave 2), `l3` for top row (octave 4).
const OCTAVE_ROWS = [
  { octIndex: 2, lClass: "l3" }, // DO4-SI4 row, displayed top
  { octIndex: 1, lClass: "l2" }, // DO3-SI3 row
  { octIndex: 0, lClass: "l1" }  // DO2-SI2 row, displayed bottom
];

function buildBellGrid() {
  const flexbox = document.getElementById("flexbox");
  let bIndex = 1; // matches original b1..b36 numbering: bottom-left = b1, top-right = b36
  const rowsBottomUp = [...OCTAVE_ROWS].reverse(); // assign bN starting from bottom row
  // First pass: assign bN per spec (b1..b12 = bottom row left-to-right, etc.)
  const numbering = new Map();
  for (const row of rowsBottomUp) {
    for (const note of NOTES_PER_OCTAVE) {
      const fullId = note.id + row.octIndex;
      numbering.set(fullId, bIndex++);
    }
  }
  // Render top-to-bottom for visual layout
  for (const row of OCTAVE_ROWS) {
    for (const note of NOTES_PER_OCTAVE) {
      const fullId = note.id + row.octIndex;
      const displayOctave = row.octIndex + 2; // 0->2, 1->3, 2->4
      const labelHtml = note.label
        .replace("\n", displayOctave + "<br>") + displayOctave;
      const imgFile = note.sharp ? "bell-dark-grey.svg" : "bell-light-grey.svg";
      const div = document.createElement("div");
      div.id = fullId;
      div.className = `button b${numbering.get(fullId)} ${row.lClass}`;
      div.innerHTML = `<img src="img/${imgFile}" alt=""><div class="label">${labelHtml}</div>`;
      flexbox.appendChild(div);
    }
  }
}

document.addEventListener("DOMContentLoaded", buildBellGrid);
```

Note on label rendering: an alteration like `cis-des` has label `"REb\nDO#"`. With `displayOctave = 4`, the rendered HTML becomes `REb4<br>DO#4` — matching the original site's two-line label format. A natural like `c` has label `"DO"` and renders as `DO4` (no `<br>`).

- [ ] **Step 3: Manual verification — DOM structure**

Open `C:/Users/g.dini/Downloads/campanaro/index.html` in a browser (double-click or via local server).

Expected:
- Page title: "Simulatore di campane a slancio"
- 36 bell icons visible in a single area (no styling yet — they will all be in one wrapping flow row, may overflow)
- Top bells labeled `DO4`, `REb4 / DO#4`, `RE4`, ..., `SI4`
- Middle bells: `DO3`...`SI3`
- Bottom bells: `DO2`...`SI2`
- "Ferma tutto" button below
- No console errors (open DevTools → Console)
- Inspect a bell (e.g. DO2): `<div id="c0" class="button b1 l1"><img src="img/bell-light-grey.svg" alt=""><div class="label">DO2</div></div>`
- Inspect a sharp (e.g. REb2/DO#2): `<div id="cis-des0" class="button b2 l1">...<div class="label">REb2<br>DO#2</div></div>`

If any IDs or labels are wrong, fix the data tables before moving on — they are the source of truth for the rest of the plan.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/g.dini/Downloads/campanaro" && git add index.html && git commit -m "feat: HTML skeleton with bell grid generation (no styling yet)"
```

---

## Task 3: CSS styling and swinging animation

**Files:**
- Modify: `index.html` (the `<style>` block)

- [ ] **Step 1: Add layout and animation CSS**

Replace the empty `<style>` block in `index.html` with:
```css
body {
  font-family: sans-serif;
  background: #f5f5f5;
  margin: 0;
  padding: 16px;
}

h1 {
  font-size: 1.4em;
  margin: 0 0 16px;
}

.big-table {
  display: flex;
  justify-content: center;
}

#wrapper {
  background: #fff;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#flexbox {
  display: grid;
  grid-template-columns: repeat(12, 70px);
  grid-auto-rows: 110px;
  gap: 4px;
}

.button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 0;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  background: #f8f8f8;
  border: 1px solid #ddd;
  transition: background 0.1s;
}

.button:hover {
  background: #efefef;
}

.button img {
  width: 50px;
  height: 70px;
  pointer-events: none;
  transform-origin: 50% 0%; /* swing pivot at top of bell */
}

/* Clapper sits at the same origin as the bell so they swing together */
.button img.clapper {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: 50% 0%;
}

.button .label {
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
  color: #333;
  pointer-events: none;
}

.button.ringing {
  background: #fff3e0;
}

button#stopAll {
  margin-top: 16px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

@keyframes swinging {
  0%   { transform: rotate(-10deg); }
  50%  { transform: rotate(10deg); }
  100% { transform: rotate(-10deg); }
}
```

The `animation-name` and `animation-duration` are NOT set in CSS — they will be set inline by JS in Task 5 so the duration matches the actual audio length.

The `animation-iteration-count: infinite` is also NOT in the keyframes; it will be set inline as `infinite` in Task 5.

- [ ] **Step 2: Manual verification — visual layout**

Reload `index.html` in browser.

Expected:
- 12-column × 3-row grid, centered, on white card
- Light-grey bells alternating with dark-grey bells (sharps) in a piano-key pattern
- Each bell has its label below (e.g. "DO4", "REb4\nDO#4")
- Hover changes background to slightly darker shade
- "Ferma tutto" button visible below the grid
- No console errors

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: grid layout, button styling, swinging keyframe"
```

---

## Task 4: BellPlayer class — basic click to play (no animation, no fade yet)

**Files:**
- Modify: `index.html` (add BellPlayer class + init)

- [ ] **Step 1: Add BellPlayer class**

Inside the `<script>` block, after the `buildBellGrid` function definition and before the `DOMContentLoaded` listener, add:
```javascript
const MAX_SIMULTANEOUS = 10;
const SOUND_PATH = "sound/";

class BellPlayer {
  constructor(buttonEl) {
    this.button = buttonEl;
    this.id = buttonEl.id;
    this.audio = null;       // lazy-created on first click
    this.duration = null;    // discovered from audio metadata
    this.isRinging = false;
    this.button.addEventListener("click", () => this.onClick());
  }

  ensureAudio() {
    if (this.audio) return Promise.resolve();
    this.audio = document.createElement("audio");
    this.audio.loop = true;
    this.audio.preload = "metadata";
    const oggSrc = document.createElement("source");
    oggSrc.src = SOUND_PATH + this.id + ".ogg";
    oggSrc.type = "audio/ogg";
    const mp3Src = document.createElement("source");
    mp3Src.src = SOUND_PATH + this.id + ".mp3";
    mp3Src.type = "audio/mpeg";
    this.audio.appendChild(oggSrc);
    this.audio.appendChild(mp3Src);
    document.body.appendChild(this.audio);
    return new Promise((resolve, reject) => {
      this.audio.addEventListener("loadedmetadata", () => {
        this.duration = this.audio.duration;
        resolve();
      }, { once: true });
      this.audio.addEventListener("error", (e) => reject(e), { once: true });
    });
  }

  async onClick() {
    if (this.isRinging) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    if (document.querySelectorAll(".ringing").length >= MAX_SIMULTANEOUS) return;
    await this.ensureAudio();
    this.isRinging = true;
    this.button.classList.add("ringing");
    this.audio.currentTime = 0;
    this.audio.volume = 1.0; // full volume for now; fade comes in Task 6
    this.audio.play();
  }

  stop() {
    this.isRinging = false;
    this.button.classList.remove("ringing");
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}

// Registry of all BellPlayer instances, keyed by id
const players = new Map();

function initPlayers() {
  for (const btn of document.querySelectorAll("#flexbox .button")) {
    players.set(btn.id, new BellPlayer(btn));
  }
}
```

- [ ] **Step 2: Wire up initialization**

Replace the existing `DOMContentLoaded` listener:
```javascript
document.addEventListener("DOMContentLoaded", buildBellGrid);
```
with:
```javascript
document.addEventListener("DOMContentLoaded", () => {
  buildBellGrid();
  initPlayers();
});
```

- [ ] **Step 3: Manual verification — basic playback**

**Important:** open the page through a local server, not `file://`, to avoid potential audio CORS / autoplay issues. From the project root:
```bash
cd "C:/Users/g.dini/Downloads/campanaro" && python -m http.server 8000
```
Then open http://localhost:8000/ in a browser.

Expected:
- Click any bell (e.g. DO2 / `c0`): audio plays in loop, the bell's background turns light-orange (`.ringing`)
- Click the same bell again: audio stops
- Click 3-4 different bells: all play simultaneously
- No console errors
- Inspect the page after a click: a `<audio>` element exists in `<body>` with two `<source>` children (`.ogg` and `.mp3`)

If audio doesn't play, check:
- Browser permissions (some browsers require user interaction before audio — clicking IS that interaction, so it should work)
- File paths (`sound/c0.ogg` and `sound/c0.mp3` exist)
- Network tab: is the audio file 200 OK?

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat: BellPlayer with basic click-to-play (no fade or animation yet)"
```

---

## Task 5: SVG swap and swinging animation

**Files:**
- Modify: `index.html` (BellPlayer.start / stop)

- [ ] **Step 1: Update `start` and `stop` to swap SVGs and animate**

In `BellPlayer.start()`, after `this.button.classList.add("ringing");` and before the `this.audio.play()` line, insert the visual setup. Also extract a small helper. Replace the entire `start()` and `stop()` methods with:
```javascript
async start() {
  if (document.querySelectorAll(".ringing").length >= MAX_SIMULTANEOUS) return;
  await this.ensureAudio();
  this.isRinging = true;
  this.button.classList.add("ringing");
  this._showRingingVisuals();
  this.audio.currentTime = 0;
  this.audio.volume = 1.0; // fade comes in Task 6
  this.audio.play();
}

stop() {
  this.isRinging = false;
  this.button.classList.remove("ringing");
  this._showIdleVisuals();
  if (this.audio) {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

_showRingingVisuals() {
  const swingDuration = this.duration / 6; // seconds, matches original
  const mainImg = this.button.querySelector("img:not(.clapper)");
  mainImg.src = "img/bell-brown-wo-clapper.svg";
  mainImg.style.animation = `swinging ${swingDuration}s ease-in-out infinite`;
  // Insert clapper if not already there
  if (!this.button.querySelector("img.clapper")) {
    const clapper = document.createElement("img");
    clapper.className = "clapper";
    clapper.src = "img/clapper-brown.svg";
    clapper.style.animation = `swinging ${swingDuration}s ease-in-out infinite`;
    clapper.alt = "";
    this.button.appendChild(clapper);
  }
}

_showIdleVisuals() {
  const mainImg = this.button.querySelector("img:not(.clapper)");
  if (mainImg) {
    mainImg.style.animation = "";
    // Determine grey tone from the label: contains "#" → sharp → dark grey
    const isSharp = this.button.querySelector(".label").innerHTML.includes("#");
    mainImg.src = isSharp ? "img/bell-dark-grey.svg" : "img/bell-light-grey.svg";
  }
  const clapper = this.button.querySelector("img.clapper");
  if (clapper) clapper.remove();
}
```

- [ ] **Step 2: Manual verification — animation**

Reload the page (still on local server).

Expected:
- Click any bell: audio plays, the SVG changes to brown bell + brown clapper appears, both rotate left/right with a smooth swinging motion that matches the audio rhythm
- Click again: clapper disappears, bell returns to grey, animation stops
- The swing duration looks reasonable (around 0.5-1 second per cycle for typical bell durations of 3-6s)
- Click multiple bells: each animates independently; their swing cycles may differ depending on their audio length
- No console errors

If the bell rotates around its center instead of the top, recheck the CSS `transform-origin: 50% 0%` in `.button img`.

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: brown SVG swap and swinging animation on play/stop"
```

---

## Task 6: Fade-in on play start, fade-out on stop

**Files:**
- Modify: `index.html` (BellPlayer.start / stop, add fade helpers)

- [ ] **Step 1: Add fade helpers and update start/stop**

Add a helper method to `BellPlayer` and update `start()` / `stop()`:
```javascript
// Replace start()
async start() {
  if (document.querySelectorAll(".ringing").length >= MAX_SIMULTANEOUS) return;
  await this.ensureAudio();
  if (this._fadeTimer) {
    clearInterval(this._fadeTimer);
    this._fadeTimer = null;
  }
  this.isRinging = true;
  this.button.classList.add("ringing");
  this._showRingingVisuals();

  const dur = this.duration;
  const initialDelayMs = (dur / 24) * 1000;
  const fadeInMs = (dur / 6) * 1000;
  const targetVolume = 0.30; // 30% as in original

  this.audio.currentTime = 0;
  this.audio.volume = 0;

  setTimeout(() => {
    if (!this.isRinging) return; // user may have clicked stop already
    this.audio.play();
    this._fadeVolume(0, targetVolume, fadeInMs);
  }, initialDelayMs);
}

// Replace stop()
stop() {
  this.isRinging = false;
  this.button.classList.remove("ringing");
  this._showIdleVisuals();
  if (!this.audio) return;
  if (this._fadeTimer) {
    clearInterval(this._fadeTimer);
    this._fadeTimer = null;
  }
  const dur = this.duration || 1;
  const fadeOutMs = Math.pow(dur, 2.5) * 0.02 * 1000;
  const startVolume = this.audio.volume;
  this._fadeVolume(startVolume, 0, fadeOutMs, () => {
    this.audio.pause();
    this.audio.currentTime = 0;
  });
}

// Add this new method to the class
_fadeVolume(from, to, durationMs, onDone) {
  if (this._fadeTimer) clearInterval(this._fadeTimer);
  if (durationMs <= 0) {
    this.audio.volume = to;
    if (onDone) onDone();
    return;
  }
  const stepMs = 30;
  const totalSteps = Math.max(1, Math.round(durationMs / stepMs));
  let step = 0;
  this.audio.volume = from;
  this._fadeTimer = setInterval(() => {
    step++;
    const t = step / totalSteps;
    const v = from + (to - from) * t;
    this.audio.volume = Math.max(0, Math.min(1, v));
    if (step >= totalSteps) {
      clearInterval(this._fadeTimer);
      this._fadeTimer = null;
      if (onDone) onDone();
    }
  }, stepMs);
}
```

- [ ] **Step 2: Manual verification — fade behavior**

Reload the page.

Expected:
- Click a bell: there's a short delay (a fraction of a second) before any sound, then it fades in smoothly to a moderate volume (much quieter than full)
- Click to stop: the sound fades out (the longer the bell duration, the longer the fade — for a 5s bell it's about 1s; the formula is `dur^2.5 * 20`ms)
- Visual animation starts immediately on click, BEFORE the audio (since audio has the `dur/24` delay)
- Visual animation stops immediately on click-to-stop, while the audio still fades out for a moment — this matches the original's behavior
- No console errors, no audio glitches (popping, abrupt cuts)

Edge cases to verify:
- Click-stop-click rapidly: fade timers don't stack; clicking start cancels any in-progress fade-out
- Click-click while still fading in: the bell stops mid-fade-in correctly

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: delayed start, volume fade-in/out matching original timings"
```

---

## Task 7: "Ferma tutto" button

**Files:**
- Modify: `index.html` (wire up the existing `#stopAll` button)

- [ ] **Step 1: Wire the button to stop all ringing bells**

In the `DOMContentLoaded` handler, after `initPlayers();`, add:
```javascript
document.getElementById("stopAll").addEventListener("click", () => {
  for (const player of players.values()) {
    if (player.isRinging) player.stop();
  }
});
```

The full handler becomes:
```javascript
document.addEventListener("DOMContentLoaded", () => {
  buildBellGrid();
  initPlayers();
  document.getElementById("stopAll").addEventListener("click", () => {
    for (const player of players.values()) {
      if (player.isRinging) player.stop();
    }
  });
});
```

- [ ] **Step 2: Manual verification — stop all**

Reload page.

Expected:
- Start 4-5 bells across different rows
- Click "Ferma tutto"
- All bells fade out, clappers disappear, SVGs return to grey
- After full fade-out, audio is silent
- Clicking "Ferma tutto" with no bells ringing: no error, no effect

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "feat: 'Ferma tutto' button stops all ringing bells"
```

---

## Task 8: 10-bell limit verification and edge cases

**Files:** none (verification only — limit was implemented in Task 4)

- [ ] **Step 1: Verify the 10-bell limit**

Reload page.

Test plan:
1. Start 10 different bells (one click each, rapidly enough that they're all in `ringing` state)
2. Try to start an 11th bell: nothing happens (no audio, no animation, no `.ringing` class)
3. Stop one of the 10: the 11th can now be started
4. Click "Ferma tutto" then immediately try to start 11+ bells: again limited to 10

Expected: limit enforced strictly via `document.querySelectorAll(".ringing").length >= MAX_SIMULTANEOUS` check at the top of `start()`.

If the limit is bypassed (e.g. due to async timing window), the simplest fix is to also increment a counter synchronously at the start. But verify first before fixing — async race is unlikely with click events.

- [ ] **Step 2: Verify mixed click patterns**

Test:
- Click DO2, then click DO2 again before the fade-in completes: should stop cleanly
- Click DO2 (starts fade-in), then click DO3 mid-fade: both ring, no audio glitch on DO2
- Click DO2 (currently ringing), wait for steady-state, click again: starts fade-out
- During DO2's fade-out, click DO2 again: starts fade-in again from current volume (no glitch)

If any of these produce console errors or audio artifacts, fix in `start()` / `stop()` — the fade timer cleanup is the key.

- [ ] **Step 3: Commit (only if any fixes were needed)**

If no changes: skip this step.
If fixes: `git add index.html && git commit -m "fix: race condition in <describe>"`

---

## Task 9: README and final polish

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `C:/Users/g.dini/Downloads/campanaro/README.md`:
```markdown
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
```

- [ ] **Step 2: Final full manual test pass**

With the dev server running, run through the spec's testing checklist (spec section 10):

1. Open http://localhost:8000/
2. Click every bell of one row (12 bells of, say, octave 3): each plays and animates
3. Click 11 different bells rapidly: 11th is rejected
4. Click an active bell: stops with fade-out
5. Click "Ferma tutto" with ≥3 active bells: all stop
6. Visual check: light-grey for naturals, dark-grey for sharps; brown bell+clapper while ringing; correct labels (e.g. `REb3<br>DO#3`)

All six pass: project complete.

- [ ] **Step 3: Final commit**

```bash
cd "C:/Users/g.dini/Downloads/campanaro" && git add README.md && git commit -m "docs: README with setup and usage instructions"
```

- [ ] **Step 4: Project status**

```bash
cd "C:/Users/g.dini/Downloads/campanaro" && git log --oneline && git status
```

Expected `git log --oneline` (most recent first):
```
<hash> docs: README with setup and usage instructions
<hash> feat: 'Ferma tutto' button stops all ringing bells
<hash> feat: delayed start, volume fade-in/out matching original timings
<hash> feat: brown SVG swap and swinging animation on play/stop
<hash> feat: BellPlayer with basic click-to-play (no fade or animation yet)
<hash> feat: grid layout, button styling, swinging keyframe
<hash> feat: HTML skeleton with bell grid generation (no styling yet)
<hash> chore: project init, asset download script, spec & plan
```

(Optional Task 8 fix commit may also appear.)

`git status`: clean working tree.

---

## Plan complete

Spec coverage check:
- §3 structure → Tasks 1, 2, 9 (sound/, img/, index.html, README.md)
- §4 ID mapping → Task 2 (NOTES_PER_OCTAVE + OCTAVE_ROWS)
- §5.1 bell definitions → Task 2
- §5.2 grid HTML → Task 2 (buildBellGrid)
- §5.3 BellPlayer → Tasks 4, 5, 6 (lazy audio, animation, fades)
- §5.4 stop-all button → Task 7
- §6.1 idle/ringing states → Tasks 4, 5
- §6.2 click→ring sequence (delay + fade-in + animation) → Tasks 5, 6
- §6.3 click→stop sequence (fade-out + reset) → Tasks 5, 6
- §6.4 swinging animation → Tasks 3 (CSS) + 5 (inline duration)
- §7.1-7.2 audio + image asset list → Task 1 (download script)
- §7.3 download script → Task 1
- §8 audio loading approach → Task 4 (ensureAudio)
- §9 error handling (missing audio = silent skip) → implicit in Task 4 ensureAudio's reject path; the click is awaited but rejection is unhandled, which means a console error and no playback (acceptable per spec)
- §10 testing checklist → Task 9 final test pass
- §11 file:// note → Task 9 README
