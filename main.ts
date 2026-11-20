// A working gta6-clipper-01 entry (Node 22, standard library only).
//
// What it does, in order:
//   1. Copies VIDEO.json from the repository root to /output/VIDEO.json,
//      where the gate reads it. That is the entry's scored behaviour:
//      the entry is the video itself, named by VIDEO.json.
//   2. When the source trailer is present at assets/launch-trailer.mp4
//      (Rockstar's official Grand Theft Auto VI Launch Trailer, 15 Oct
//      2026), it rebuilds clip.mp4 deterministically with ffmpeg and
//      writes it to /output/clip.mp4 too. The trailer is not committed
//      (19+ MB of Rockstar footage); ./build-clip.sh documents how to
//      fetch it and runs the same pipeline locally.
//
// The cut (see build-clip.sh for the same table): one theme, "GTA 6 is
// finally here". It opens on the trailer's most kinetic shot (the
// dirt-bike jump, mid-air), then fast 3-second cuts across the trailer's
// best visuals, each with one big caption, then a 13-second pitch on
// neon-dark cards: make clips like this with AI, earn real money on
// make.fun, bounty link + $500. Total 46 seconds, vertical 1080x1920.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

// [source start (s), duration (s), on-screen caption]
const SEGMENTS: Array<[number, number, string]> = [
  [48.8, 3.0, 'GTA 6 IS OUT NOW'],
  [3.0, 3.0, 'VICE CITY'],
  [18.0, 3.0, 'THE CREW IS BACK'],
  [24.0, 3.0, 'LEONIDA'],
  [27.0, 3.0, 'LOCKED & LOADED'],
  [36.0, 3.0, 'NEVER STOPS'],
  [39.0, 3.0, 'JASON & LUCIA'],
  [45.0, 3.0, 'OUT NOW'],
  [54.0, 3.0, 'PLAY HAS NO LIMITS'],
  [66.0, 3.0, 'NOVEMBER 19, 2026'],
  [69.0, 3.0, 'GTA 6'],
];

// Pitch cards: [duration (s), line 1, line 2, line 2 colour, line 1 size,
// line 2 size, optional line 3, line 3 size, line 3 colour]
const PITCH: Array<
  [number, string, string, string, number, number, string?, number?, string?]
> = [
  [4, 'MAKE CLIPS LIKE THIS', 'WITH AI', '#FF2E88', 72, 140],
  [4, 'AND EARN REAL MONEY', 'ON MAKE.FUN', '#FF2E88', 72, 130],
  [5, 'make.fun/bounty/', 'gta6-clipper-01', '#00E5FF', 76, 76, '$500 BOUNTY', 110, '#FFD34D'],
];

function runFfmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });
}

function buildClip(source: string, out: string): void {
  const work = join(tmpdir(), 'gta6-clipper-build');
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const parts: string[] = [];

  SEGMENTS.forEach(([start, dur, caption], idx) => {
    const capFile = join(work, `cap${idx}.txt`);
    const segFile = join(work, `seg${String(idx).padStart(2, '0')}.mp4`);
    writeFileSync(capFile, caption);
    runFfmpeg([
      '-ss', String(start), '-i', source, '-t', String(dur),
      '-vf',
      `crop=608:1080:(in_w-608)/2:0,scale=1080:1920,` +
        `drawtext=fontfile=${FONT}:textfile=${capFile}:fontsize=76:fontcolor=white:` +
        `borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.70:` +
        `box=1:boxcolor=black@0.55:boxborderw=28`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-r', '30',
      '-c:a', 'aac', '-b:a', '128k', segFile,
    ]);
    parts.push(segFile);
  });

  PITCH.forEach(([dur, line1, line2, accent, size1, size2, line3, size3, accent3], idx) => {
    const f1 = join(work, `p1_${idx}.txt`);
    const f2 = join(work, `p2_${idx}.txt`);
    writeFileSync(f1, line1);
    writeFileSync(f2, line2);
    let filters =
      `drawtext=fontfile=${FONT}:textfile=${f1}:fontsize=${size1}:fontcolor=white:` +
      `borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.40:` +
      `box=1:boxcolor=black@0.55:boxborderw=24,` +
      `drawtext=fontfile=${FONT}:textfile=${f2}:fontsize=${size2}:fontcolor=${accent}:` +
      `borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.51:` +
      `box=1:boxcolor=black@0.55:boxborderw=24`;
    if (line3) {
      const f3 = join(work, `p3_${idx}.txt`);
      writeFileSync(f3, line3);
      filters +=
        `,drawtext=fontfile=${FONT}:textfile=${f3}:fontsize=${size3}:` +
        `fontcolor=${accent3}:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.63:` +
        `box=1:boxcolor=black@0.55:boxborderw=24`;
    }
    const pitchFile = join(work, `pitch${idx}.mp4`);
    runFfmpeg([
      '-f', 'lavfi', '-i', `color=c=0x0a0a12:s=1080x1920:r=30:d=${dur}`,
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', String(dur),
      '-vf', filters,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-r', '30',
      '-c:a', 'aac', '-b:a', '128k', pitchFile,
    ]);
    parts.push(pitchFile);
  });

  const concatFile = join(work, 'concat.txt');
  writeFileSync(concatFile, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  runFfmpeg([
    '-f', 'concat', '-safe', '0', '-i', concatFile,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', out,
  ]);
  rmSync(work, { recursive: true, force: true });

  // Verify the rebuild: a Short must be vertical 1080x1920 and under 60s.
  const probe = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'stream=width,height', '-show_entries', 'format=duration', '-of', 'json', out],
      { encoding: 'utf8' },
    ) as string,
  ) as { streams: Array<{ width: number; height: number }>; format: { duration: string } };
  const video = probe.streams[0];
  const duration = parseFloat(probe.format.duration);
  console.log(`built ${out}: ${video.width}x${video.height}, ${duration.toFixed(2)}s`);
  if (video.width !== 1080 || video.height !== 1920) {
    throw new Error(`unexpected resolution ${video.width}x${video.height}, want 1080x1920`);
  }
  if (duration >= 60) {
    throw new Error(`clip is ${duration.toFixed(2)}s, over the 60s Short limit`);
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, 'VIDEO.json'), join(OUTPUT_DIR, 'VIDEO.json'));
} catch (err) {
  console.error(`VIDEO.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

// The clip rebuild is a bonus on top of the gate behaviour: if ffmpeg or
// the source trailer is missing, the VIDEO.json copy above still stands.
const source = join(BOT_DIR, 'assets', 'launch-trailer.mp4');
if (existsSync(source)) {
  try {
    buildClip(source, join(OUTPUT_DIR, 'clip.mp4'));
    console.log('clip.mp4 rebuilt into', OUTPUT_DIR);
  } catch (err) {
    console.error(`clip rebuild skipped: ${(err as Error).message}`);
  }
} else {
  console.log('no assets/launch-trailer.mp4; clip.mp4 not rebuilt (see build-clip.sh)');
}
