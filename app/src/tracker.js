(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const STORAGE_KEY = "platinum-path.progress.v1";
  const SCHEMA = "platinum-path/progress";

  function createTracker(data) {
    const validIds = new Set(data.trophies.map(item => item.id));
    const listeners = new Set();
    let earned = new Set();
    let hideStory = false;
    let updatedAt = null;
    let storageMessage = "";
    let storageAvailable = true;

    function readPayload(value) {
      if (!value || typeof value !== "object" || Array.isArray(value) || value.schema !== SCHEMA || value.version !== 1) throw new Error("Choose a PLATINUM PATH version 1 progress backup.");
      if (value.game !== data.game || value.platform !== data.platform) throw new Error("This backup is for a different game or platform.");
      if (!Array.isArray(value.earned) || value.earned.length > validIds.size || value.earned.some(id => !Number.isInteger(id) || !validIds.has(id)) || new Set(value.earned).size !== value.earned.length) throw new Error("The backup contains invalid, unknown or duplicate trophy IDs.");
      if (!value.settings || typeof value.settings !== "object" || Array.isArray(value.settings) || typeof value.settings.hideStorySpoilers !== "boolean") throw new Error("The backup is missing a valid spoiler preference.");
      return {earned: [...value.earned].sort((a, b) => a - b), hideStorySpoilers: value.settings.hideStorySpoilers, updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null};
    }
    function snapshot() { return {schema: SCHEMA, version: 1, game: data.game, platform: data.platform, earned: [...earned].sort((a, b) => a - b), settings: {hideStorySpoilers: hideStory}, updatedAt}; }
    function persist() {
      updatedAt = new Date().toISOString();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); storageAvailable = true; storageMessage = ""; }
      catch { storageAvailable = false; storageMessage = "Progress could not be saved on this device. Export a backup before closing to keep this session."; }
    }
    function notify(reason, id) { listeners.forEach(listener => listener({reason, id: id ?? null})); }
    function adopt(value) { const clean = readPayload(value); earned = new Set(clean.earned); hideStory = clean.hideStorySpoilers; updatedAt = clean.updatedAt; }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        try { adopt(JSON.parse(raw)); }
        catch { storageMessage = "Saved progress could not be read. Import a valid backup, or export this session before closing."; }
      }
    } catch {
      storageAvailable = false;
      storageMessage = "Browser storage is unavailable. Your progress works for this session; export it before closing to keep your route.";
    }

    function setEarned(id, state) { if (!validIds.has(id)) throw new Error("That trophy is not in this guide."); const next = Boolean(state); if (earned.has(id) === next) return; next ? earned.add(id) : earned.delete(id); persist(); notify("earned", id); }
    function statistics() {
      const byGrade = Object.fromEntries(data.grades.map(grade => [grade, {earned: 0, total: 0}]));
      const byKind = Object.fromEntries(data.kinds.map(kind => [kind, {earned: 0, total: 0}]));
      const byStage = Object.fromEntries(data.stages.map(stage => [stage.id, {earned: 0, total: 0}]));
      let missableTotal = 0;
      data.trophies.forEach(trophy => {
        const buckets = [byGrade[trophy.grade], byKind[trophy.kind], byStage[trophy.stage]];
        const done = earned.has(trophy.id);
        buckets.forEach(bucket => { bucket.total += 1; if (done) bucket.earned += 1; });
        if (trophy.missable) missableTotal += 1;
      });
      return {earned: earned.size, total: data.trophies.length, percent: Math.round(earned.size / data.trophies.length * 100), byGrade, byKind, byStage, missableTotal, missableRemaining: data.trophies.filter(item => item.missable && !earned.has(item.id)).length};
    }
    async function prepareImport(file) {
      if (!file || typeof file.text !== "function" || file.size === 0) throw new Error("Choose a non-empty JSON progress backup.");
      if (file.size > 256 * 1024) throw new Error("This file is too large for a progress backup. Choose a JSON file under 256 KB.");
      let parsed; try { parsed = JSON.parse(await file.text()); } catch { throw new Error("This file is not readable JSON. Choose an exported PLATINUM PATH backup."); }
      const payload = readPayload(parsed);
      Object.freeze(payload.earned);
      Object.freeze(payload);
      return Object.freeze({payload, name: String(file.name || "Progress backup"), earnedCount: payload.earned.length, currentCount: earned.size});
    }
    function syncFromStorage(event) {
      if (event.key !== STORAGE_KEY) return;
      try {
        const next = event.newValue === null
          ? {earned: [], hideStorySpoilers: false, updatedAt: null}
          : readPayload(JSON.parse(event.newValue));
        earned = new Set(next.earned);
        hideStory = next.hideStorySpoilers;
        updatedAt = next.updatedAt;
        storageMessage = "";
        notify("sync");
      } catch {
        storageMessage = "A change from another tab could not be read. This tab's current route is still available to export.";
        notify("storage");
      }
    }
    window.addEventListener("storage", syncFromStorage);
    return Object.freeze({
      hasEarned: id => earned.has(id), getSpoilers: () => hideStory, getStorageStatus: () => ({available: storageAvailable, message: storageMessage}), snapshot,
      statistics, setEarned, toggleEarned: id => setEarned(id, !earned.has(id)),
      setSpoilers(value) { const next = Boolean(value); if (next === hideStory) return; hideStory = next; persist(); notify("spoilers"); },
      prepareImport, applyImport(candidate) { if (!candidate || !candidate.payload) throw new Error("Choose a progress backup before importing."); earned = new Set(candidate.payload.earned); hideStory = candidate.payload.hideStorySpoilers; updatedAt = candidate.payload.updatedAt; persist(); notify("import"); },
      exportProgress() { const date = new Date().toISOString(); const blob = new Blob([JSON.stringify({...snapshot(), exportedAt: date}, null, 2) + "\n"], {type: "application/json"}); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "platinum-path-" + date.slice(0, 10) + ".json"; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); return anchor.download; },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      destroy() { window.removeEventListener("storage", syncFromStorage); listeners.clear(); }
    });
  }
  app.createTracker = createTracker;
})();
