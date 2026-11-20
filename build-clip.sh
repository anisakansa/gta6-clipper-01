#!/usr/bin/env bash
# Build the gta6-clipper-01 vertical Short from Rockstar's official
# Grand Theft Auto VI Launch Trailer (15 Oct 2026, youtube rz1B4B2yBZY).
#
# Usage: ./build-clip.sh [path/to/launch-trailer.mp4] [out.mp4]
#   The source is Rockstar's trailer, downloaded with:
#     yt-dlp --js-runtimes deno -f "137+140" --merge-output-format mp4 \
#       -o launch-trailer.mp4 https://www.youtube.com/watch?v=rz1B4B2yBZY
#   (deno is needed as the JS runtime or YouTube's bot check refuses the
#   1080p formats; the android client only serves 360p.)
#
# The cut: one theme, "GTA 6 is finally here". It opens on the single most
# kinetic shot in the trailer (the dirt-bike jump, mid-air), then fast
# 3-second cuts across the trailer's best visuals, each with one big
# caption, then a 13-second pitch on neon-dark cards: make clips like
# this with AI, earn real money on make.fun, bounty link + $500.
# Total: 33s of trailer + 13s of pitch = 46s, vertical 1080x1920, 30fps.
set -euo pipefail

SRC="${1:-assets/launch-trailer.mp4}"
OUT="${2:-clip.mp4}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if [ ! -f "$SRC" ]; then
  echo "source trailer not found: $SRC" >&2
  echo "download it first, see the header of this script" >&2
  exit 1
fi

# start,duration,caption  — captions are one line each here; the pitch
# cards below carry two lines.
SEGMENTS=(
  "48.8 3.0 GTA 6 IS OUT NOW"
  "3.0 3.0 VICE CITY"
  "18.0 3.0 THE CREW IS BACK"
  "24.0 3.0 LEONIDA"
  "27.0 3.0 LOCKED & LOADED"
  "36.0 3.0 NEVER STOPS"
  "39.0 3.0 JASON & LUCIA"
  "45.0 3.0 OUT NOW"
  "54.0 3.0 PLAY HAS NO LIMITS"
  "66.0 3.0 NOVEMBER 19, 2026"
  "69.0 3.0 GTA 6"
)

i=0
for seg in "${SEGMENTS[@]}"; do
  start="${seg%% *}"; rest="${seg#* }"
  dur="${rest%% *}"; caption="${rest#* }"
  i=$((i + 1))
  printf '%s' "$caption" > "$WORK/cap$i.txt"
  ffmpeg -y -v error -ss "$start" -i "$SRC" -t "$dur" \
    -vf "crop=608:1080:(in_w-608)/2:0,scale=1080:1920,drawtext=fontfile=$FONT:textfile=$WORK/cap$i.txt:fontsize=76:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.70:box=1:boxcolor=black@0.55:boxborderw=28" \
    -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 128k "$WORK/seg$(printf '%02d' $i).mp4"
done

# Pitch cards: solid near-black, neon text. Card 1 and 2 carry two lines
# (white line 1, pink line 2); card 3 carries three lines (white URL split
# over two lines, gold prize). Font sizes are sized so the longest line
# fits inside 1080 px with margins (DejaVu Bold averages ~0.62 x fontsize).
pitch() {
  local n="$1" dur="$2" line1="$3" line2="$4" accent="$5" size1="$6" size2="$7" line3="${8:-}" size3="${9:-0}" accent3="${10:-#FFD34D}"
  printf '%s' "$line1" > "$WORK/p1_$n.txt"
  printf '%s' "$line2" > "$WORK/p2_$n.txt"
  local filters="drawtext=fontfile=$FONT:textfile=$WORK/p1_$n.txt:fontsize=$size1:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.36:box=1:boxcolor=black@0.55:boxborderw=24,drawtext=fontfile=$FONT:textfile=$WORK/p2_$n.txt:fontsize=$size2:fontcolor=$accent:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.47:box=1:boxcolor=black@0.55:boxborderw=24"
  if [ -n "$line3" ]; then
    printf '%s' "$line3" > "$WORK/p3_$n.txt"
    filters="$filters,drawtext=fontfile=$FONT:textfile=$WORK/p3_$n.txt:fontsize=$size3:fontcolor=$accent3:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.60:box=1:boxcolor=black@0.55:boxborderw=24"
  fi
  ffmpeg -y -v error -f lavfi -i "color=c=0x0a0a12:s=1080x1920:r=30:d=$dur" \
    -f lavfi -i "anullsrc=r=48000:cl=stereo" -t "$dur" \
    -vf "$filters" \
    -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 128k "$WORK/pitch$n.mp4"
}
pitch 1 4 "MAKE CLIPS LIKE THIS" "WITH AI" "#FF2E88" 72 140
pitch 2 4 "AND EARN REAL MONEY" "ON MAKE.FUN" "#FF2E88" 72 130
pitch 3 5 "make.fun/bounty/" "gta6-clipper-01" "#00E5FF" 76 76 "\$500 BOUNTY" 110 "#FFD34D"

# Concatenate in order, one final encode. -shortest keeps the output at
# the video length (46s): segment audio runs a little long otherwise.
: > "$WORK/concat.txt"
for f in "$WORK"/seg*.mp4 "$WORK"/pitch1.mp4 "$WORK"/pitch2.mp4 "$WORK"/pitch3.mp4; do
  printf "file '%s'\n" "$f" >> "$WORK/concat.txt"
done
ffmpeg -y -v error -f concat -safe 0 -i "$WORK/concat.txt" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k -movflags +faststart -shortest "$OUT"

ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=width,height,codec_name \
  -of default=noprint_wrappers=1 "$OUT"
echo "built $OUT"
