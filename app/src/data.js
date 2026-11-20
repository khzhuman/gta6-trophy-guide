export const stages = [
  { id: 1, name: 'Story first pass', detail: 'Work through the story trophies and watch for first-pass missable warnings.' },
  { id: 2, name: 'Collectibles', detail: 'Return to the collectible-focused trophies after the story route.' },
  { id: 3, name: 'Activities', detail: 'Clear the listed activity and challenge trophies.' },
  { id: 4, name: 'Money & totals', detail: 'Build toward the cumulative and ownership goals in the list.' },
  { id: 5, name: 'Completion cleanup', detail: 'Finish remaining open-world and overall completion trophies.' },
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

const standardize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase();

export async function loadTrophies() {
  const response = await fetch('data/trophies.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load the local trophy list. Open the app folder through a local web server.');
  const payload = await response.json();
  const trophies = Array.isArray(payload) ? payload : payload.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) throw new Error('The local trophy list must contain all 55 entries.');
  return trophies.map((trophy, index) => Object.freeze({
    ...trophy,
    id: Number(trophy.id ?? index + 1),
    sourceRefs: Array.isArray(trophy.sourceRefs) ? trophy.sourceRefs : [],
  }));
}

export function trophyMatches(trophy, filter, query, progress) {
  const group = filter.toLocaleLowerCase();
  if (group === 'missable' && !trophy.missable) return false;
  if (['story', 'collectibles', 'activities'].includes(group) && trophy.kind !== group) return false;
  if (group === 'online') return trophy.kind === 'online';
  if (!query) return true;
  const spoiler = progress.hideStory && trophy.kind === 'story' && !progress.earned[trophy.id];
  const searchable = spoiler ? 'hidden by spoiler setting' : `${trophy.name} ${trophy.description}`;
  return standardize(searchable).includes(standardize(query));
}
