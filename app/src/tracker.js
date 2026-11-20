const STORAGE_KEY = 'platinum-path-progress-v3';
const BACKUP_KIND = 'platinum-path-progress';

function cleanEarned(value, validIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Progress data must be an object keyed by trophy id.');
  const safe = {};
  for (const [key, done] of Object.entries(value)) {
    const id = Number(key);
    if (!validIds.has(id) || typeof done !== 'boolean') throw new Error('Progress data includes an unknown trophy or invalid value.');
    if (done) safe[id] = true;
  }
  return safe;
}

export function createProgress(trophies) {
  const validIds = new Set(trophies.map(trophy => trophy.id));
  let earned = {};
  let hideStory = false;
  let storageOkay = true;
  const listeners = new Set();

  function emit() { listeners.forEach(listener => listener(read())); }
  function read() { return { earned: { ...earned }, hideStory, storageOkay }; }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned, hideStory }));
      storageOkay = true;
    } catch {
      storageOkay = false;
    }
    emit();
  }
  function accept(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a valid PLATINUM PATH progress file.');
    earned = cleanEarned(value.earned, validIds);
    hideStory = value.hideStory === true;
    save();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) accept(JSON.parse(saved));
  } catch {
    storageOkay = false;
    earned = {};
    hideStory = false;
  }

  return Object.freeze({
    read,
    toggle(id, checked) {
      if (!validIds.has(id)) return;
      if (checked) earned[id] = true;
      else delete earned[id];
      save();
    },
    spoilers(enabled) { hideStory = Boolean(enabled); save(); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    exportFile() {
      const file = new Blob([JSON.stringify({ format: BACKUP_KIND, version: 1, earned, hideStory }, null, 2)], { type: 'application/json' });
      const address = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = address;
      anchor.download = 'platinum-path-progress.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(address), 1000);
    },
    async importFile(file) {
      if (!file || file.size > 256 * 1024) throw new Error('Choose a progress JSON file smaller than 256 KB.');
      const value = JSON.parse(await file.text());
      if (value.format !== BACKUP_KIND || value.version !== 1) throw new Error('This file is not a PLATINUM PATH progress export.');
      accept(value);
    },
  });
}
