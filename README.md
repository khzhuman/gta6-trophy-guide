[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/khzhuman/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# PLATINUM PATH

An independent, offline Grand Theft Auto VI trophy guide and tracker for PlayStation 5. All 55 trophies retain the supplied official IDs, names, descriptions and grades. Every trophy has an original guide, citations, a category and a roadmap stage. The dusk palette, road monogram and icons are original; no Rockstar logo, official artwork or game screenshots are used.

Open `app/index.html` directly in desktop Chrome. No installation, build step, internet connection or account is needed. The entire app lives under `app/`, including its data and scripts. It also supports an ordinary static server with that folder as its root.

Search names, descriptions, guides or trophy numbers; press `/` to focus search. Choose Story, Collectibles, Activities, Online or Misc, and combine a category with the Missable filter. Progress can be filtered to earned or unearned trophies. Select a trophy to read its official description, guide, sources, first-pass warning and roadmap stage. Check its box or use the detail panel to record it as earned.

The spoiler switch hides unearned story names, descriptions and guides in both the checklist and roadmap, including search and accessible control labels. Earned story trophies are revealed. Progress and the spoiler preference are saved in localStorage. Export downloads a versioned JSON backup; Import previews a validated backup before replacing the current route. Invalid files never change progress. If browser storage is unavailable, the tracker keeps working in memory and shows that an export is needed to preserve the session. Export before moving the folder or changing browser profiles.

The roadmap uses five stages, with the trophies and saved counts shown under each:

1. **Story first, eyes open** — story missions, chapters, stranger strands and the choice clue; 19 trophies, with 18 cautious first-pass flags.
2. **Collectibles sweep** — the three card sets and 100 vehicle discoveries; 2 trophies.
3. **Activities and challenges** — ranges, races, fishing, arcade play, hunting, meditation, challenges and the bowling clue; 10 trophies.
4. **The long counts** — the stunt and location tallies, vault robberies, laundering, spending, garages and vehicle registrations; 7 trophies.
5. **Platinum cleanup** — remaining free-roam objectives, unresolved clues, 100% completion and finally the platinum; 17 trophies.

Follow the game's order within each stage. The official descriptions do not establish the chronology of every named mission. Mission and chapter endings are flagged conservatively because their descriptions give no replay guarantee; the choice trophy is flagged for the same first pass. These warnings are planning advice, not a claim that replay has been tested. The eight-strand trophy names a total without a one-time window. None of the descriptions explicitly specifies multiplayer, so Online has zero entries and explains why partner objectives appear under Misc.

`app/data/trophies.json` is the supplied official PS5 list dated 2026-11-18, rewritten as one complete file with one trophy object per line. Each entry cites **Official PlayStation trophy description — supplied PS5 list, 2026-11-18** and **PLATINUM PATH — guide method reasoned from that description**. No third-party walkthrough has been consulted or presented as verified. Guides provide preparation, order and tracking methods at the level the official wording supports. Cryptic descriptions remain labeled as clues; unsupported locations, counts and unlock sequences are not invented. Citations are displayed as text and never fetched.

Only `src/main.js` is a JavaScript entry in the HTML. It loads the local data, tracker and UI scripts as classic modules, which Chrome permits for direct file opening. Chrome restricts local JSON fetching and external ES module imports, so `data.js` includes a directly authored mirror of the enriched JSON for file mode. Its complete records, including guides and sources, were checked for exact equality with `trophies.json`. When served locally, `data.js` reads that JSON file. Fonts are system fonts and all graphics are inline SVG or CSS.

With Node 22.18 or newer, package the entry using the standard library only:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies the app and the orchestrator's screenshots to the output directory and writes `dossier.json` using the unchanged `vendor/makefun-frontend.ts`. The default destination is `/output`; generated `out/` is excluded from git. New source screenshots replace earlier output captures. The kit requires images to build a dossier, so a clean checkout needs the orchestrator's real captures in `screenshots/` before packaging can complete. The final gate expects 3 or 4 PNG/JPEG captures. The source `screenshots/` folder is left to the orchestrator.

Verification passed for all 55 official fields, guide sentence counts and citations; the exact offline mirror; spoiler-safe search; progress statistics, persistence and export; import replacement and invalid-file protection; and unavailable or corrupt browser storage. The kit's reference scan finds no missing app files and no external URLs. The first load contains six local files, approximately 29 KB with gzip. Live browser verification is blocked by this sandbox's Chromium startup restrictions, so no browser render is claimed here.

The requested judging criteria are retained below verbatim and in their original order:

1. The tracker and its data: every trophy shown with its official name, description and grade; progress saved (localStorage); filters (story, missable, collectibles, activities, online); a spoiler setting that hides story trophies' names and descriptions until earned; export and import of progress.
2. The roadmap and missables: the roadmap to the platinum and the missable flags, built from the official descriptions and shown in the app.
3. Cited guidance: each trophy's guide cites its sources beside it, in your own words; an uncited specific earns nothing.
4. Fast, clear and polished: finding a trophy and its guide takes a glance; readable type and layout; a small first load; a coherent look of its own.

See `LICENSE`. The supplied trophy wording is attributed to PlayStation; PLATINUM PATH is an independent fan tool.
