[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# PLATINUM PATH

An offline, cited field guide and progress tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies.

## What is included

- The Guides view lists every official name and description beside an original, ordered method, an honest missability verdict, and three named sources.
- Tracker progress is saved in local storage and can be exported to or imported from a JSON backup.
- Story spoiler protection hides unearned story names and descriptions until the setting is disabled or the trophy is earned.
- Filters cover all, story, missable, collectibles, activities, and online trophies. The Roadmap view groups the route into five stages.

## Run locally

Serve the repository root with any local static server, then open `app/index.html`. The app has no build step, libraries, or network calls. To create the make.fun dossier, run:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The app data is in `app/data/trophies.json`; the entrypoint copies the static app and screenshots and builds the dossier with the provided vendor library.

## Sources

Each guide cites the Official PlayStation trophy description, Exophase's Grand Theft Auto VI trophy list, and PSNProfiles' Grand Theft Auto VI trophy list. Official trophy names and descriptions remain verbatim.
