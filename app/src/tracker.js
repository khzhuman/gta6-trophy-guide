(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const KEY = "platinum-path.progress.v1";
  const SHAPE = "platinum-path/progress";

  function createTracker(data) {
    const ids = new Set(data.trophies.map(trophy => trophy.id));
    const listeners = new Set();
    let earned = new Set();
    let spoilers = false;
    let storageMessage = "";
    let storageAvailable = true;

    function validate(value) {
      if (!value || value.schema !== SHAPE || value.version !== 1 || value.game !== data.game || value.platform !== data.platform) throw new Error("Choose a PLATINUM PATH progress backup for Grand Theft Auto VI on PlayStation 5.");
      if (!Array.isArray(value.earned) || value.earned.some(id => !Number.isInteger(id) || !ids.has(id)) || new Set(value.earned).size !== value.earned.length) throw new Error("This backup has an invalid trophy list.");
      if (!value.settings || typeof value.settings.hideStorySpoilers !== "boolean") throw new Error("This backup has an invalid spoiler preference.");
      return {earned: [...value.earned], hideStorySpoilers: value.settings.hideStorySpoilers};
    }
    function snapshot() { return {schema: SHAPE, version: 1, game: data.game, platform: data.platform, earned: [...earned].sort((a, b) => a - b), settings: {hideStorySpoilers: spoilers}, updatedAt: new Date().toISOString()}; }
    function save() {
      try { window.localStorage.setItem(KEY, JSON.stringify(snapshot())); storageAvailable = true; storageMessage = ""; }
      catch { storageAvailable = false; storageMessage = "Browser storage is unavailable. Export your route before closing."; }
    }
    function emit(reason, id) { listeners.forEach(listener => listener({reason, id: id ?? null})); }
    function adopt(value) { const normalized = validate(value); earned = new Set(normalized.earned); spoilers = normalized.hideStorySpoilers; }
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) adopt(JSON.parse(raw));
    } catch { storageMessage = "Saved progress could not be read. You can still use and export this route."; }

    function setEarned(id, value) { if (!ids.has(id)) return; const next = Boolean(value); if (earned.has(id) === next) return; next ? earned.add(id) : earned.delete(id); save(); emit("earned", id); }
    function setSpoilers(value) { if (spoilers === Boolean(value)) return; spoilers = Boolean(value); save(); emit("spoilers"); }
    function stats() {
      const byGrade = Object.fromEntries(data.grades.map(grade => [grade, {earned: 0, total: 0}]));
      const byKind = Object.fromEntries(data.kinds.map(kind => [kind, {earned: 0, total: 0}]));
      const byStage = Object.fromEntries(data.stages.map(stage => [stage.id, {earned: 0, total: 0}]));
      let missableTotal = 0;
      for (const trophy of data.trophies) {
        const done = earned.has(trophy.id);
        for (const bucket of [byGrade[trophy.grade], byKind[trophy.kind], byStage[trophy.stage]]) { bucket.total++; if (done) bucket.earned++; }
        if (trophy.missable) missableTotal++;
      }
      return {earned: earned.size, total: data.trophies.length, percent: Math.round(earned.size / data.trophies.length * 100), byGrade, byKind, byStage, missableTotal, missableRemaining: data.trophies.filter(trophy => trophy.missable && !earned.has(trophy.id)).length};
    }
    async function prepareImport(file) {
      if (!file || file.size > 256 * 1024) throw new Error("Choose a JSON backup under 256 KB.");
      let parsed; try { parsed = JSON.parse(await file.text()); } catch { throw new Error("That file is not valid JSON."); }
      const payload = validate(parsed); return Object.freeze({payload, name: String(file.name || "backup"), earnedCount: payload.earned.length, currentCount: earned.size});
    }
    function applyImport(candidate) { if (!candidate) return; adopt(candidate.payload); save(); emit("import"); }
    function exportProgress() {
      const blob = new Blob([JSON.stringify({...snapshot(), exportedAt: new Date().toISOString()}, null, 2) + "\n"], {type: "application/json"});
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "platinum-path-progress.json"; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); return anchor.download;
    }
    return Object.freeze({hasEarned: id => earned.has(id), getSpoilers: () => spoilers, getStorageStatus: () => ({available: storageAvailable, message: storageMessage}), snapshot, statistics: stats, setEarned, toggleEarned: id => setEarned(id, !earned.has(id)), setSpoilers, prepareImport, applyImport, exportProgress, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }});
  }
  app.createTracker = createTracker;
})();
