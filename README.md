[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# PLATINUM PATH

An independent, offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5. Open the **Guides** view for the full list: each card pairs the official description with a numbered method, a visible missability verdict and three named citations. Use the one-click Tracker and Roadmap tabs to work through progress and the five-stage route.

Serve `app/` as the root of a local static server and open `index.html`. The app uses vanilla JavaScript, local CSS and the local trophy JSON; it needs no build step or network access. The search and category chips filter by trophy name and kind, including the dedicated Missable filter. The spoiler switch masks unearned story details in every view.

Progress is stored in localStorage on the current browser. Export downloads a JSON backup; Import checks the file and previews its counts before replacing this device's progress. Grade totals, stage totals and earned checkboxes update with the tracker.

The route has five stages: story and first-pass warnings (19 trophies), collectibles (2), activities and challenges (10), cumulative counts (7), and cleanup (17). Eighteen entries carry cautious first-pass flags because their descriptions do not establish a replay route. The trophy text leaves some triggers unresolved; those cards say what remains unknown rather than supplying unsupported locations or counts.

`app/data/trophies.json` preserves the official trophy IDs, names, descriptions and grades from the starter list. Every entry has an original guide and the requested source names: Official PlayStation trophy description, Exophase — Grand Theft Auto VI trophy list, and PSNProfiles — Grand Theft Auto VI trophy list. The app makes no network requests; source names are displayed as text.

The project uses the kit's unchanged `main.ts` and `vendor/makefun-frontend.ts` to assemble the app, screenshots and dossier. With Node 22.18 or newer, run `MAKEFUN_OUTPUT_DIR=out node main.ts` from the repository root. The output dossier is generated from the local app files and supplied screenshots.

See `LICENSE`. PLATINUM PATH is an independent fan guide and uses no Rockstar logo or game artwork.
