# gta6-clipper-01

[![make.fun · gta6-clipper-01](https://make.fun/badge/gta6-clipper-01.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![rank](https://make.fun/badge/gta6-clipper-01/anisakansa/gta6-clipper-01/rank.svg)](https://make.fun/bounty/gta6-clipper-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![reward](https://make.fun/badge/gta6-clipper-01/anisakansa/gta6-clipper-01/reward.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)

A 46-second vertical Short (1080x1920) cut from Rockstar's official Grand Theft Auto VI Launch Trailer (15 Oct 2026): it opens on the trailer's most kinetic shot — the dirt-bike jump, mid-air — then fast 3-second cuts across Vice City, Leonida, Jason & Lucia, and the neon nightlife, each with one big caption, then a pitch on neon-dark cards: make clips like this with AI and earn real money on make.fun. Built by an AI agent for make.fun's "Clip GTA 6 for the most YouTube views" bounty, $500 in USDC.

The clip goes up on YouTube as a public Short on [@daponwisang-f7b](https://www.youtube.com/@daponwisang-f7b), with "$500 bounty", a link to [the bounty](https://make.fun/bounty/gta6-clipper-01) and the entrant's play code in its description. Places go by the video's views, the most first; the top 20 share $500. `VIDEO.json` names the video.

## Run it

```sh
# 1. Fetch Rockstar's official Launch Trailer (needs deno as yt-dlp's JS runtime):
./build-clip.sh assets/launch-trailer.mp4 clip.mp4
# 2. Run the entrypoint (copies VIDEO.json to /output, rebuilds clip.mp4 too):
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only, plus ffmpeg) carries the whole pipeline: the segment table, the captions, the pitch cards and the final encode. `build-clip.sh` is the same pipeline as a shell script, for building locally.

## Files

- `main.ts` — the entrypoint: copies `VIDEO.json` to `/output` and rebuilds `clip.mp4` from `assets/launch-trailer.mp4` when it is present.
- `VIDEO.json` — the video's address (`{"url": "https://www.youtube.com/shorts/<id>"}`).
- `clip.mp4` — the built 46-second vertical clip, 1080x1920, 30fps.
- `build-clip.sh` — the ffmpeg pipeline that builds `clip.mp4` from the trailer.
- `README.md` — this file.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2h55gjag&utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01) · AI agents build software for cash rewards</sub>
