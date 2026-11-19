(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const grades = ["platinum", "gold", "silver", "bronze"];
  const kinds = ["story", "collectibles", "activities", "online", "misc"];
  const kindLabels = {story: "Story", collectibles: "Collectibles", activities: "Activities", online: "Online", misc: "Other"};
  const stages = [
    {id: 1, title: "Story first, eyes open", short: "Story", description: "Complete story milestones and watch for possible first-pass windows."},
    {id: 2, title: "Collectibles sweep", short: "Collect", description: "Work through card sets and vehicle discoveries."},
    {id: 3, title: "Activities and challenges", short: "Activities", description: "Clear activities, challenges and skill-based objectives."},
    {id: 4, title: "The long counts", short: "Tallies", description: "Build cumulative totals and property ownership."},
    {id: 5, title: "Platinum cleanup", short: "Cleanup", description: "Resolve open-world clues, then finish completion goals."}
  ];

  const normalize = value => String(value).normalize("NFKC").replace(/[’‘]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").toLocaleLowerCase();
  const byStage = (left, right) => left.stage - right.stage || left.id - right.id;
  const hiddenFromSpoilers = (trophy, earned, enabled) => enabled && trophy.kind === "story" && !earned;

  async function loadGuide() {
    const response = await fetch("./data/trophies.json", {cache: "no-store"});
    if (!response.ok) throw new Error("The local trophy list could not be read.");
    const file = await response.json();
    if (!Array.isArray(file.trophies) || file.trophies.length !== 55) throw new Error("The local trophy list is incomplete.");
    const trophies = file.trophies.map(entry => Object.freeze({...entry, id: Number(entry.id)}));
    const groups = new Map(kinds.map(kind => [kind, trophies.filter(entry => entry.kind === kind)]));
    return Object.freeze({
      game: "Grand Theft Auto VI", platform: "PlayStation 5", grades, kinds, kindLabels, stages,
      trophies: Object.freeze(trophies), byKind: groups,
      byId: new Map(trophies.map(entry => [entry.id, entry])),
      isHidden: hiddenFromSpoilers,
      displayName(entry, earned, spoilers) { return hiddenFromSpoilers(entry, earned, spoilers) ? "Story trophy hidden" : entry.name; },
      matchesSearch(entry, query, earned, spoilers) {
        if (!query) return true;
        const masked = hiddenFromSpoilers(entry, earned, spoilers);
        const searchable = [entry.id, masked ? "" : entry.name, kindLabels[entry.kind]].join(" ");
        return normalize(searchable).includes(normalize(query));
      },
      roadmapOrder: byStage
    });
  }
  app.data = Object.freeze({load: loadGuide});
})();
