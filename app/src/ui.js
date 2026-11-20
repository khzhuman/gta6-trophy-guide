import { references, stages, trophyMatches } from './data.js';

const filters = ['All', 'Story', 'Missable', 'Collectibles', 'Activities', 'Online'];
const byGrade = ['platinum', 'gold', 'silver', 'bronze'];

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function gradeBadge(grade) {
  return node('span', `grade grade-${grade}`, grade);
}

function isMasked(trophy, state) {
  return state.hideStory && trophy.kind === 'story' && !state.earned[trophy.id];
}

function toggleControl(trophy, progress, state) {
  const label = node('label', 'earned-row');
  const box = node('input');
  box.type = 'checkbox';
  box.checked = Boolean(state.earned[trophy.id]);
  const trophyLabel = isMasked(trophy, state) ? 'hidden story trophy' : trophy.name;
  box.setAttribute('aria-label', `${box.checked ? 'Unmark' : 'Mark'} ${trophyLabel} earned`);
  box.addEventListener('change', () => progress.toggle(trophy.id, box.checked));
  label.append(box, node('span', '', 'Earned'));
  return label;
}

function refsLine(trophy) {
  const line = node('p', 'sources-line');
  line.append(node('b', '', 'Sources:'));
  const numbers = trophy.sourceRefs.length ? trophy.sourceRefs : trophy.sources || [];
  numbers.forEach((source, index) => {
    const number = typeof source === 'number' ? source : index + 1;
    line.append(node('span', '', ` [${number}]`));
  });
  return line;
}

function guideCard(trophy, progress, state) {
  const card = node('article', 'guide-card');
  const hidden = isMasked(trophy, state);
  const top = node('div', 'guide-top');
  top.append(node('h3', 'guide-title', hidden ? 'hidden by spoiler setting' : trophy.name), gradeBadge(trophy.grade));
  card.append(top);
  card.append(node('p', hidden ? 'spoiler-mask' : 'description', hidden ? 'Description hidden by spoiler setting. Mark this trophy earned to reveal it.' : trophy.description));
  const meta = node('div', 'guide-meta');
  meta.append(node('span', `verdict ${trophy.missable ? 'missable' : 'safe'}`, trophy.missable ? 'MISSABLE — first-pass caution' : 'NOT MISSABLE'));
  const stage = stages.find(item => item.id === trophy.stage);
  meta.append(node('span', 'stage-label', `S${trophy.stage} · ${stage?.name || 'Route stage'}`));
  card.append(meta);
  const method = node('section', 'method');
  method.append(node('p', 'method-label', 'METHOD'), node('p', 'method-text', trophy.guide || 'No guide text is available for this entry.'));
  card.append(method, refsLine(trophy), toggleControl(trophy, progress, state));
  return card;
}

function sourceLegend() {
  const list = document.querySelector('#source-list');
  list.replaceChildren();
  references.forEach((reference, index) => list.append(node('li', '', `[${index + 1}] ${reference}`)));
}

export function startViews(trophies, progress) {
  const state = { filter: 'All', query: '', view: 'guides', progress: progress.read() };
  const guideList = document.querySelector('#guide-list');
  const trackerList = document.querySelector('#tracker-list');
  const roadmapList = document.querySelector('#roadmap-list');
  const filterRow = document.querySelector('#filters');
  const search = document.querySelector('#search');
  const clear = document.querySelector('#clear');
  const spoiler = document.querySelector('#spoiler');
  const notice = document.querySelector('#notice');

  filters.forEach(label => {
    const chip = node('button', 'filter-chip', label);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(label === state.filter));
    chip.addEventListener('click', () => {
      state.filter = label;
      filterRow.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.textContent === label)));
      draw();
    });
    filterRow.append(chip);
  });

  function shownTrophies() {
    return trophies.filter(trophy => trophyMatches(trophy, state.filter, state.query, state.progress));
  }

  function updateHeader() {
    const totalEarned = trophies.filter(item => state.progress.earned[item.id]).length;
    document.querySelector('#earned-count').textContent = String(totalEarned);
    document.querySelector('#progress-percent').textContent = `${Math.round(totalEarned / trophies.length * 100)}%`;
    document.querySelector('#progress-fill').style.width = `${totalEarned / trophies.length * 100}%`;
    const gradeLine = document.querySelector('#grade-metrics');
    gradeLine.replaceChildren();
    byGrade.forEach(grade => {
      const matching = trophies.filter(item => item.grade === grade);
      const done = matching.filter(item => state.progress.earned[item.id]).length;
      const chip = node('span', 'metric');
      chip.append(node('i', `grade-dot grade-${grade}`), node('b', '', `${done}/${matching.length}`), document.createTextNode(` ${grade}`));
      gradeLine.append(chip);
    });
    const stageLine = document.querySelector('#stage-metrics');
    stageLine.replaceChildren();
    stages.forEach(stage => {
      const matching = trophies.filter(item => item.stage === stage.id);
      const done = matching.filter(item => state.progress.earned[item.id]).length;
      const chip = node('span', 'stage-chip');
      chip.append(node('b', '', `S${stage.id}`), document.createTextNode(` ${done}/${matching.length}`));
      stageLine.append(chip);
    });
    document.querySelector('#save-state').textContent = state.progress.storageOkay ? 'Saved locally' : 'Session only · export progress';
    spoiler.checked = state.progress.hideStory;
  }

  function drawGuides(items) {
    const empty = document.querySelector('#guide-empty');
    guideList.replaceChildren();
    if (state.filter === 'Online') {
      empty.hidden = false;
      empty.textContent = 'The official list contains no online trophies';
      document.querySelector('#guide-count').textContent = '0 guides';
      return;
    }
    empty.hidden = items.length > 0;
    empty.textContent = 'No matching trophies. Change the search or filter to see more.';
    document.querySelector('#guide-count').textContent = `${items.length} ${items.length === 1 ? 'guide' : 'guides'}`;
    items.forEach(trophy => guideList.append(guideCard(trophy, progress, state.progress)));
  }

  function trackerRow(trophy) {
    const row = node('div', 'tracker-row');
    const masked = isMasked(trophy, state.progress);
    row.append(node('span', 'trophy-name', masked ? 'Hidden by spoiler setting' : trophy.name), gradeBadge(trophy.grade));
    if (trophy.missable) row.append(node('span', 'flag', 'MISSABLE'));
    row.append(toggleControl(trophy, progress, state.progress));
    return row;
  }

  function drawTracker(items) {
    const empty = document.querySelector('#tracker-empty');
    trackerList.replaceChildren();
    if (state.filter === 'Online') {
      empty.hidden = false;
      empty.textContent = 'The official list contains no online trophies';
      document.querySelector('#tracker-count').textContent = '0 trophies';
      return;
    }
    empty.hidden = items.length > 0;
    empty.textContent = 'No matching trophies. Change the search or filter to see more.';
    const earned = items.filter(item => state.progress.earned[item.id]).length;
    document.querySelector('#tracker-count').textContent = `${earned} of ${items.length} shown earned`;
    stages.forEach(stage => {
      const group = items.filter(trophy => trophy.stage === stage.id);
      if (!group.length) return;
      const section = node('section', 'tracker-stage');
      const heading = node('div', 'stage-heading');
      const title = node('h3', '', `S${stage.id} · ${stage.name}`);
      const detail = node('p', '', stage.detail);
      const label = node('div');
      label.append(title, detail);
      const checked = group.filter(item => state.progress.earned[item.id]).length;
      heading.append(label, node('span', 'stage-count', `${checked}/${group.length} earned`));
      section.append(heading);
      group.forEach(item => section.append(trackerRow(item)));
      trackerList.append(section);
    });
  }

  function drawRoadmap(items) {
    roadmapList.replaceChildren();
    if (state.filter === 'Online') {
      roadmapList.append(node('div', 'online-empty', 'The official list contains no online trophies'));
      return;
    }
    stages.forEach(stage => {
      const group = items.filter(trophy => trophy.stage === stage.id);
      if (!group.length) return;
      const section = node('section', 'roadmap-stage');
      const heading = node('div', 'stage-heading');
      const label = node('div');
      label.append(node('h3', '', `S${stage.id} · ${stage.name}`), node('p', '', stage.detail));
      const done = group.filter(item => state.progress.earned[item.id]).length;
      heading.append(label, node('span', 'stage-count', `${done}/${group.length} earned`));
      section.append(heading);
      const rows = node('div', 'roadmap-items');
      group.forEach(trophy => {
        const row = node('div', 'roadmap-item');
        const title = isMasked(trophy, state.progress) ? 'hidden by spoiler setting' : trophy.name;
        row.append(node('span', 'name', title));
        if (trophy.missable) row.append(node('span', 'flag', 'MISSABLE'));
        row.append(gradeBadge(trophy.grade));
        rows.append(row);
      });
      section.append(rows);
      roadmapList.append(section);
    });
  }

  function drawView() {
    const current = shownTrophies();
    document.querySelectorAll('.view').forEach(section => {
      const key = section.id.replace('-view', '');
      section.hidden = key !== state.view;
    });
    document.querySelectorAll('.tabs a').forEach(tab => {
      if (tab.dataset.view === state.view) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    if (state.view === 'guides') drawGuides(current);
    if (state.view === 'tracker') drawTracker(current);
    if (state.view === 'roadmap') drawRoadmap(current);
  }

  function draw() {
    updateHeader();
    drawView();
    clear.hidden = !state.query;
  }

  function readHash() {
    const view = location.hash.match(/^#\/(guides|tracker|roadmap)$/)?.[1] || 'guides';
    state.view = view;
    drawView();
  }

  search.addEventListener('input', () => { state.query = search.value.trim(); draw(); });
  clear.addEventListener('click', () => { search.value = ''; state.query = ''; draw(); search.focus(); });
  spoiler.addEventListener('change', () => progress.spoilers(spoiler.checked));
  document.querySelectorAll('.tabs a').forEach(tab => tab.addEventListener('click', () => { state.view = tab.dataset.view; }));
  window.addEventListener('hashchange', readHash);
  document.querySelector('#export').addEventListener('click', () => progress.exportFile());
  document.querySelector('#import').addEventListener('click', () => document.querySelector('#import-file').click());
  document.querySelector('#import-file').addEventListener('change', async event => {
    const picker = event.currentTarget;
    try {
      await progress.importFile(picker.files[0]);
      notice.hidden = true;
    } catch (error) {
      notice.textContent = error.message || 'Could not import this progress file.';
      notice.hidden = false;
    }
    picker.value = '';
  });
  progress.subscribe(next => {
    state.progress = next;
    draw();
  });

  sourceLegend();
  if (!location.hash) history.replaceState(null, '', '#/guides');
  readHash();
  draw();
}
