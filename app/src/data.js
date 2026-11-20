export const stages = [
  { id: 1, name: 'Story first pass', detail: 'Work through the story trophies and watch for first-pass missable warnings.' },
  { id: 2, name: 'Collectibles', detail: 'Return to the collectible-focused trophies after the story route.' },
  { id: 3, name: 'Activities', detail: 'Clear the listed activity and challenge trophies.' },
  { id: 4, name: 'Money & totals', detail: 'Build toward the cumulative and ownership goals in the list.' },
  { id: 5, name: 'Completion cleanup', detail: 'Finish remaining open-world and overall completion trophies.' },
];

export const sources = [
  { name: 'Official PlayStation trophy description', descriptor: 'Official trophy wording and award requirements', url: 'https://www.playstation.com', readDate: '19 Nov 2026' },
  { name: 'Exophase — Grand Theft Auto VI trophy list', descriptor: 'Trophy list and grade reference', url: 'https://www.exophase.com', readDate: '19 Nov 2026' },
  { name: 'PSNProfiles — Grand Theft Auto VI trophy list', descriptor: 'Community trophy list reference', url: 'https://psnprofiles.com', readDate: '19 Nov 2026' },
  { name: 'PowerPyx — Grand Theft Auto VI trophy guide coverage', descriptor: 'Trophy guide coverage', url: 'https://www.powerpyx.com', readDate: '19 Nov 2026' },
  { name: 'OutputLag — Grand Theft Auto VI trophy coverage', descriptor: 'Trophy coverage and commentary', url: 'https://outputlag.com', readDate: '19 Nov 2026' },
  { name: 'GTA Zone — Grand Theft Auto VI trophy list', descriptor: 'GTA trophy list reference', url: 'https://www.gtazone.net', readDate: '19 Nov 2026' },
  { name: 'KeenGamer — Grand Theft Auto VI trophy coverage', descriptor: 'Gaming editorial trophy coverage', url: 'https://www.keengamer.com', readDate: '19 Nov 2026' },
];

export const references = [
  'Official PlayStation trophy description — retrieved 19 Nov 2026',
  'Exophase — Grand Theft Auto VI trophy list — retrieved 19 Nov 2026',
  'PSNProfiles — Grand Theft Auto VI trophy list — retrieved 19 Nov 2026',
  'PowerPyx — Grand Theft Auto VI trophy guide coverage — retrieved 20 Nov 2026',
  'OutputLag — Grand Theft Auto VI trophy coverage — retrieved 20 Nov 2026',
  'GTA Zone — Grand Theft Auto VI trophy list — retrieved 20 Nov 2026',
  'KeenGamer — Grand Theft Auto VI trophy coverage — retrieved 20 Nov 2026',
];

const normalize = input => String(input ?? '').normalize('NFKC').toLocaleLowerCase();
const groupedKinds = new Set(['story', 'collectibles', 'activities', 'online', 'misc']);

export async function loadTrophies() {
  const response = await fetch('data/trophies.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load the local trophy list. Open the app folder through a local web server.');
  }

  const data = await response.json();
  const rows = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(rows) || rows.length !== 55) {
    throw new Error('The local trophy list must contain all 55 entries.');
  }

  return rows.map((entry, position) => Object.freeze({
    ...entry,
    id: Number(entry.id ?? position + 1),
    sourceRefs: Array.isArray(entry.sourceRefs) ? entry.sourceRefs : [],
  }));
}

export function trophyMatches(trophy, filter, query, progress) {
  const category = filter.toLocaleLowerCase();
  if (category === 'missable' && !trophy.missable) return false;
  if (groupedKinds.has(category) && trophy.kind !== category) return false;
  if (!query) return true;

  const concealed = progress.hideStory && trophy.kind === 'story' && !progress.earned[trophy.id];
  const searchableText = concealed
    ? 'hidden by spoiler setting'
    : [trophy.name, trophy.description].join(' ');
  return normalize(searchableText).includes(normalize(query));
}
