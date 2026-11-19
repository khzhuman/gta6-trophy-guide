(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  const STORAGE_KEY = "platinum-path.progress.v1";
  const SCHEMA = "platinum-path/progress";
  const MAX_IMPORT_BYTES = 256 * 1024;

  function createTracker(data) {
    const knownIds = new Set(data.trophies.map(trophy => trophy.id));
    const listeners = new Set();
    let earned = new Set();
    let hideStorySpoilers = false;
    let updatedAt = null;
    let storageAvailable = true;
    let storageMessage = "";

    function validate(payload) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload) || payload.schema !== SCHEMA || payload.version !== 1) {
        throw new Error("Choose a PLATINUM PATH version 1 progress backup.");
      }
      if (payload.game !== data.game || payload.platform !== data.platform) {
        throw new Error("This backup is for a different game or platform.");
      }
      if (!Array.isArray(payload.earned) || payload.earned.length > knownIds.size || payload.earned.some(id => !Number.isInteger(id) || !knownIds.has(id)) || new Set(payload.earned).size !== payload.earned.length) {
        throw new Error("The backup contains invalid, unknown or duplicate trophy IDs.");
      }
      if (!payload.settings || typeof payload.settings !== "object" || Array.isArray(payload.settings) || typeof payload.settings.hideStorySpoilers !== "boolean") {
        throw new Error("The backup is missing a valid spoiler preference.");
      }
      return {
        schema: SCHEMA,
        version: 1,
        game: data.game,
        platform: data.platform,
        earned: [...payload.earned].sort((left, right) => left - right),
        settings: {hideStorySpoilers: payload.settings.hideStorySpoilers},
        updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : null
      };
    }

    function snapshot() {
      return {
        schema: SCHEMA,
        version: 1,
        game: data.game,
        platform: data.platform,
        earned: [...earned].sort((left, right) => left - right),
        settings: {hideStorySpoilers},
        updatedAt
      };
    }

    function adopt(payload) {
      earned = new Set(payload.earned);
      hideStorySpoilers = payload.settings.hideStorySpoilers;
      updatedAt = payload.updatedAt;
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        try {
          adopt(validate(JSON.parse(saved)));
        } catch {
          storageMessage = "Saved progress could not be read. Import a valid backup, or export this session before closing.";
        }
      }
    } catch {
      storageAvailable = false;
      storageMessage = "Browser storage is unavailable. Your progress works for this session; export it before closing to keep your route.";
    }

    function save() {
      updatedAt = new Date().toISOString();
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
        storageAvailable = true;
        storageMessage = "";
      } catch {
        storageAvailable = false;
        storageMessage = "Progress could not be saved on this device. Export a backup before closing to keep this session.";
      }
    }

    function notify(reason, id = null) {
      const event = Object.freeze({reason, id});
      for (const listener of listeners) listener(event);
    }

    function setEarned(id, value) {
      if (!knownIds.has(id)) throw new Error("That trophy is not in this guide.");
      const next = Boolean(value);
      if (earned.has(id) === next) return;
      if (next) earned.add(id); else earned.delete(id);
      save();
      notify("earned", id);
    }

    function toggleEarned(id) {
      setEarned(id, !earned.has(id));
    }

    function setSpoilers(value) {
      const next = Boolean(value);
      if (hideStorySpoilers === next) return;
      hideStorySpoilers = next;
      save();
      notify("spoilers");
    }

    function statistics() {
      const byGrade = Object.fromEntries(data.grades.map(grade => [grade, {earned: 0, total: 0}]));
      const byKind = Object.fromEntries(data.kinds.map(kind => [kind, {earned: 0, total: 0}]));
      const byStage = Object.fromEntries(data.stages.map(stage => [stage.id, {earned: 0, total: 0}]));
      let missableTotal = 0;
      let missableRemaining = 0;
      for (const trophy of data.trophies) {
        const done = earned.has(trophy.id);
        for (const bucket of [byGrade[trophy.grade], byKind[trophy.kind], byStage[trophy.stage]]) {
          bucket.total++;
          if (done) bucket.earned++;
        }
        if (trophy.missable) {
          missableTotal++;
          if (!done) missableRemaining++;
        }
      }
      return {earned: earned.size, total: knownIds.size, percent: Math.round(earned.size / knownIds.size * 100), byGrade, byKind, byStage, missableTotal, missableRemaining};
    }

    async function prepareImport(file) {
      if (!file || typeof file.text !== "function" || file.size === 0) throw new Error("Choose a non-empty JSON progress backup.");
      if (file.size > MAX_IMPORT_BYTES) throw new Error("This file is too large for a progress backup. Choose a JSON file under 256 KB.");
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("This file is not readable JSON. Choose an exported PLATINUM PATH backup.");
      }
      const payload = validate(parsed);
      Object.freeze(payload.earned);
      Object.freeze(payload.settings);
      return Object.freeze({payload: Object.freeze(payload), name: String(file.name || "Progress backup"), earnedCount: payload.earned.length, currentCount: earned.size});
    }

    function applyImport(candidate) {
      if (!candidate || !candidate.payload) throw new Error("Choose a progress backup before importing.");
      adopt(validate(candidate.payload));
      save();
      notify("import");
    }

    function exportProgress() {
      const date = new Date().toISOString();
      const payload = {...snapshot(), exportedAt: date};
      const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = "platinum-path-" + date.slice(0, 10) + ".json";
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return filename;
    }

    function onStorage(event) {
      if (event.key !== STORAGE_KEY) return;
      try {
        const next = event.newValue === null
          ? {earned: [], settings: {hideStorySpoilers: false}, updatedAt: null}
          : validate(JSON.parse(event.newValue));
        adopt(next);
        storageMessage = "";
        notify("sync");
      } catch {
        storageMessage = "A change from another tab could not be read. This tab's current route is still available to export.";
        notify("storage");
      }
    }
    window.addEventListener("storage", onStorage);

    return Object.freeze({
      hasEarned: id => earned.has(id),
      getSpoilers: () => hideStorySpoilers,
      getStorageStatus: () => ({available: storageAvailable, message: storageMessage}),
      snapshot, statistics, setEarned, toggleEarned, setSpoilers,
      prepareImport, applyImport, exportProgress,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      destroy() { window.removeEventListener("storage", onStorage); listeners.clear(); }
    });
  }

  app.createTracker = createTracker;
})();
