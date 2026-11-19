(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const grades = Object.freeze(["platinum", "gold", "silver", "bronze"]);
  const kinds = Object.freeze(["story", "collectibles", "activities", "online", "misc"]);
  const kindLabels = Object.freeze({story: "Story", collectibles: "Collectibles", activities: "Activities", online: "Online", misc: "Other"});
  const stages = Object.freeze([
    Object.freeze({id: 1, title: "Story first, eyes open", short: "Story", description: "Complete story milestones and watch for possible first-pass windows."}),
    Object.freeze({id: 2, title: "Collectibles sweep", short: "Collect", description: "Work through card sets and vehicle discoveries."}),
    Object.freeze({id: 3, title: "Activities and challenges", short: "Activities", description: "Clear activities, challenges and skill-based objectives."}),
    Object.freeze({id: 4, title: "The long counts", short: "Tallies", description: "Build cumulative totals and property ownership."}),
    Object.freeze({id: 5, title: "Platinum cleanup", short: "Cleanup", description: "Resolve open-world clues, then finish completion goals."})
  ]);

  function tidy(value) { return String(value).normalize("NFKC").replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").toLocaleLowerCase(); }
  function sortByStage(a, b) { return a.stage - b.stage || a.id - b.id; }
  function isHidden(trophy, earned, spoilers) { return Boolean(spoilers && trophy.kind === "story" && !earned); }

  async function load() {
    const response = await fetch("./data/trophies.json", {cache: "no-store"});
    if (!response.ok) throw new Error("The local trophy list could not be read.");
    const source = await response.json();
    if (!Array.isArray(source.trophies) || source.trophies.length !== 55) throw new Error("The local trophy list is incomplete.");
    const trophies = source.trophies.map(trophy => Object.freeze({...trophy, id: Number(trophy.id)}));
    const byKind = new Map(kinds.map(kind => [kind, trophies.filter(trophy => trophy.kind === kind)]));
    return Object.freeze({
      game: "Grand Theft Auto VI", platform: "PlayStation 5", grades, kinds, kindLabels, stages,
      trophies: Object.freeze(trophies), byKind, byId: new Map(trophies.map(trophy => [trophy.id, trophy])),
      isHidden,
      displayName(trophy, earned, spoilers) { return isHidden(trophy, earned, spoilers) ? "Story trophy hidden" : trophy.name; },
      matchesSearch(trophy, query, earned, spoilers) {
        if (!query) return true;
        const masked = isHidden(trophy, earned, spoilers);
        return tidy([trophy.id, masked ? "" : trophy.name, masked ? "" : trophy.description, masked ? "" : trophy.guide, kindLabels[trophy.kind]].join(" ")).includes(tidy(query));
      },
      roadmapOrder: sortByStage
    });
  }

  app.data = Object.freeze({load});
})();
