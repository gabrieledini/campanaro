#!/usr/bin/env bash
# Downloads all bell audio (mp3 + ogg) and SVG images from campanologia.org.
# Idempotent: skips files that already exist.
set -euo pipefail

BASE_URL="https://campanologia.org/bell-simulator"
SOUND_DIR="sound"
IMG_DIR="img"

mkdir -p "$SOUND_DIR" "$IMG_DIR"

NATURALS=(c d e f g a h)
SHARPS=(cis-des dis-es fis-ges gis-as ais-b)

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
