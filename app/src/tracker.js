const PROGRESS_SLOT = 'platinum-path-progress-v3';
const EXPORT_TYPE = 'platinum-path-progress';

function validatedEarned(value, knownIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Progress data must be an object keyed by trophy id.');
  }
  const result = {};
  for (const [rawId, checked] of Object.entries(value)) {
    const id = Number(rawId);
    if (!knownIds.has(id) || typeof checked !== 'boolean') {
      throw new Error('Progress data includes an unknown trophy or invalid value.');
    }
    if (checked) result[id] = true;
  }
  return result;
}

export function createProgress(trophies) {
  const knownIds = new Set(trophies.map(trophy => trophy.id));
  let earned = {};
  let hideStory = true;
  let storageOkay = true;
  const observers = new Set();
  const snapshot = () => ({ earned: { ...earned }, hideStory, storageOkay });
  const publish = () => observers.forEach(observer => observer(snapshot()));

  function persist() {
    try {
      localStorage.setItem(PROGRESS_SLOT, JSON.stringify({ earned, hideStory }));
      storageOkay = true;
    } catch {
      storageOkay = false;
    }
    publish();
  }

  function apply(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Choose a valid PLATINUM PATH progress file.');
    }
    earned = validatedEarned(value.earned, knownIds);
    hideStory = value.hideStory === true;
    persist();
  }

  try {
    const encoded = localStorage.getItem(PROGRESS_SLOT);
    if (encoded) apply(JSON.parse(encoded));
  } catch {
    storageOkay = false;
    earned = {};
    hideStory = true;
  }

  return Object.freeze({
    read: snapshot,
    toggle(id, checked) {
      if (!knownIds.has(id)) return;
      if (checked) earned[id] = true;
      else delete earned[id];
      persist();
    },
    spoilers(enabled) {
      hideStory = Boolean(enabled);
      persist();
    },
    subscribe(observer) {
      observers.add(observer);
      return () => observers.delete(observer);
    },
    exportFile() {
      const payload = new Blob([
        JSON.stringify({ format: EXPORT_TYPE, version: 1, earned, hideStory }, null, 2),
      ], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(payload);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'platinum-path-progress.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    },
    async importFile(file) {
      if (!file || file.size > 256 * 1024) {
        throw new Error('Choose a progress JSON file smaller than 256 KB.');
      }
      const payload = JSON.parse(await file.text());
      if (payload.format !== EXPORT_TYPE || payload.version !== 1) {
        throw new Error('This file is not a PLATINUM PATH progress export.');
      }
      apply(payload);
    },
  });
}

// Keep counter storage independent from saved progress and its backup format.
export function createCounters(trophies) {
  const slot = 'pp-counters';
  const limitById = new Map(
    trophies.filter(trophy => trophy.counterTarget)
      .map(trophy => [trophy.id, trophy.counterTarget])
  );
  let totals = {};

  try {
    const stored = JSON.parse(localStorage.getItem(slot) || '{}');
    for (const [id, ceiling] of limitById) {
      if (Number.isInteger(stored?.[id])) {
        totals[id] = Math.max(0, Math.min(ceiling, stored[id]));
      }
    }
  } catch { /* Invalid counter data must not interrupt saved-progress loading. */ }

  return {
    read(id) {
      return totals[id] || 0;
    },
    change(id, amount) {
      if (!limitById.has(id)) return false;
      totals[id] = Math.max(0, Math.min(limitById.get(id), (totals[id] || 0) + amount));
      try {
        localStorage.setItem(slot, JSON.stringify(totals));
        return true;
      } catch {
        return false;
      }
    },
  };
}
