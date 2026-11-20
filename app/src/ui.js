import { sources, stages, trophyMatches } from './data.js';
import { createCounters } from './tracker.js';

const FILTERS = ['All', 'Story', 'Missable', 'Collectibles', 'Activities', 'Online', 'Misc'];
const find = selector => document.querySelector(selector);

function element(tag, className = '', content) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (content !== undefined) result.textContent = content;
  return result;
}

function action(label, callback, className = '') {
  const control = element('button', className, label);
  control.type = 'button';
  control.addEventListener('click', callback);
  return control;
}

const gradeBadge = grade => element('span', 'grade grade-' + grade, grade);

export function parseGuide(text) {
  const lines = text.split('\n');
  return {
    disagreement: lines.find(line => line.startsWith('SOURCES DISAGREE:')) || '',
    steps: lines.filter(line => /^\d+\. /.test(line)),
  };
}

export function computeAudit(entries) {
  const allSteps = entries.flatMap(entry => parseGuide(entry.guide).steps);
  return {
    official: entries.filter(entry =>
      entry.name && entry.description &&
      ['platinum', 'gold', 'silver', 'bronze'].includes(entry.grade)
    ).length,
    guidesCited: entries.filter(entry =>
      parseGuide(entry.guide).steps.some(step => /\[\d+\]$/.test(step))
    ).length,
    totalSteps: allSteps.length,
    citedSteps: allSteps.filter(step => /\[\d+\]$/.test(step)).length,
    sources: sources.length,
    missable: entries.filter(entry => entry.missable).length,
    disagree: entries.filter(entry => parseGuide(entry.guide).disagreement).length,
  };
}

export function startViews(trophies, progress) {
  const state = {
    filter: 'All',
    query: '',
    view: 'guides',
    selected: trophies.find(entry => entry.name === 'Positive Mental Attitude')?.id ?? trophies[0].id,
    progress: progress.read(),
  };
  const counters = createCounters(trophies);
  const stageIds = [...new Set(trophies.map(entry => entry.stage))].sort((a, b) => a - b);
  const routeStages = stageIds.map(id => stages.find(stage => stage.id === id) || {
    id, name: 'Route stage', detail: '',
  });
  const orderedTrophies = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const isMasked = entry =>
    state.progress.hideStory && entry.kind === 'story' && !state.progress.earned[entry.id];
  const shownName = entry => isMasked(entry) ? '◈ Shielded story trophy' : entry.name;
  const countEarned = entries => entries.filter(entry => state.progress.earned[entry.id]).length;
  const audit = computeAudit(trophies);

  find('#audit').textContent =
    audit.official + '/' + trophies.length + ' official name, description, grade · ' +
    audit.guidesCited + '/' + trophies.length + ' guides cite a source · ' +
    audit.citedSteps + '/' + audit.totalSteps + ' steps cited · ' +
    audit.sources + ' sources read ' + sources[0].readDate + ' · ' +
    audit.missable + ' missable flagged · ' + audit.disagree + ' sources disagree';

  const sourceList = find('#source-list');
  const notReferenced = [];
  sources.forEach((source, sourceIndex) => {
    const citedBy = trophies.filter(entry => entry.sourceRefs.includes(sourceIndex + 1)).length;
    if (!citedBy) {
      notReferenced.push(source.name);
      return;
    }
    const row = element('li');
    row.append(
      element('b', 'source-name', '[' + (sourceIndex + 1) + '] ' + source.name),
      element('span', 'source-description', source.descriptor),
      element('span', 'source-url', source.url),
      element('span', 'source-meta',
        'read ' + source.readDate + ' · cited by ' + citedBy + ' of ' + trophies.length + ' guides')
    );
    sourceList.append(row);
  });
  if (notReferenced.length) {
    const footnote = element('p', 'muted',
      'Also consulted for coverage: ' + notReferenced.join(' · ') + ' — read but not cited per guide.');
    footnote.style.fontSize = '9px';
    footnote.style.margin = '5px 11px';
    sourceList.after(footnote);
  }

  function choose(entry) {
    state.selected = entry.id;
    if (state.view !== 'guides') location.hash = '/guides';
    render();
  }

  function earnedCheckbox(entry) {
    const input = element('input');
    input.type = 'checkbox';
    input.checked = Boolean(state.progress.earned[entry.id]);
    input.setAttribute('aria-label', 'Mark ' + shownName(entry) + ' earned');
    input.addEventListener('change', () => progress.toggle(entry.id, input.checked));
    return input;
  }

  function trophyRow(entry) {
    const row = element('div',
      'tracker-row' +
      (entry.id === state.selected ? ' selected' : '') +
      (state.progress.earned[entry.id] ? ' earned' : ''));
    row.append(
      earnedCheckbox(entry),
      action(shownName(entry), () => choose(entry), 'trophy-name')
    );
    if (entry.missable) {
      const flag = element('span', 'mini-flag', '!');
      flag.title = 'Missable · Stage ' + entry.stage;
      row.append(flag);
    }
    row.append(gradeBadge(entry.grade));
    return row;
  }

  function renderGroups(container, entries, includeStageInfo = false) {
    container.replaceChildren();
    for (const stage of routeStages) {
      const members = entries.filter(entry => entry.stage === stage.id);
      if (!members.length) continue;
      const section = element('section', 'tracker-stage');
      const title = element('div', 'stage-heading');
      title.append(
        element('h3', '', 'S' + stage.id + ' · ' + stage.name),
        element('span', 'stage-count', countEarned(members) + '/' + members.length)
      );
      section.append(title);
      if (includeStageInfo) section.append(element('p', 'stage-detail', stage.detail));
      members.forEach(entry => section.append(trophyRow(entry)));
      container.append(section);
    }
    if (!entries.length) {
      container.append(element('p', 'empty',
        state.filter === 'Online' ? 'No online trophies in this list.' : 'No matching trophies.'));
    }
  }

  function showNotice(message) {
    find('#notice').textContent = message;
    find('#notice').hidden = false;
  }

  function renderDetail() {
    const entry = trophies.find(candidate => candidate.id === state.selected);
    const panel = find('#detail');
    panel.replaceChildren();
    panel.append(element('p', 'eyebrow',
      'S' + entry.stage + ' / ' + routeStages.find(stage => stage.id === entry.stage).name + ' / ' + entry.kind));

    const title = element('div', 'detail-title');
    title.append(element('h2', '', shownName(entry)), gradeBadge(entry.grade));
    panel.append(title);

    const concealed = isMasked(entry);
    if (concealed) {
      panel.append(
        element('div', 'shield-box', '◈ SPOILER SHIELD ON'),
        element('p', 'muted',
          'This story guide is shielded until earned. Turn off the shield to reveal the official wording and steps.'),
        action('Reveal story details', () => progress.spoilers(false), 'reveal-button')
      );
    } else {
      panel.append(
        element('p', 'section-label', 'OFFICIAL DESCRIPTION'),
        element('blockquote', '', entry.description)
      );
    }

    if (entry.missable) {
      const warning = element('section', 'warning');
      warning.append(
        element('b', '', 'MISSABLE · STAGE ' + entry.stage + ' WINDOW'),
        element('p', '',
          routeStages.find(stage => stage.id === entry.stage).name +
          ' — check this award before advancing. Keep it on your first-pass watch list.')
      );
      panel.append(warning);
    }

    if (!concealed) {
      const guide = parseGuide(entry.guide);
      if (guide.disagreement) {
        const box = element('section', 'disagreement');
        box.append(element('h3', '', 'SOURCES DISAGREE'));
        const body = guide.disagreement.replace('SOURCES DISAGREE: ', '');
        const verdictAt = body.indexOf('Our call:');
        box.append(element('p', '', verdictAt < 0 ? body : body.slice(0, verdictAt).trim()));
        if (verdictAt >= 0) box.append(element('strong', 'verdict', body.slice(verdictAt)));
        panel.append(box);
      }

      panel.append(element('p', 'section-label', 'THE METHOD / CITED STEP BY STEP'));
      const list = element('ol', 'steps');
      guide.steps.forEach(step => {
        const item = element('li');
        const body = step.replace(/^\d+\. /, '');
        const citation = body.match(/(?:\[\d+\])+$/)?.[0] || '';
        item.append(
          document.createTextNode(body.slice(0, body.length - citation.length)),
          element('span', 'citation', citation)
        );
        list.append(item);
      });
      panel.append(list);

      if (entry.counterTarget) {
        const card = element('section', 'counter');
        card.append(element('p', 'section-label', 'Your count — ' + entry.counterLabel + ':'));
        const controls = element('div', 'counter-controls');
        const update = amount => {
          const persisted = counters.change(entry.id, amount);
          renderDetail();
          if (!persisted) showNotice('Counter could not be saved locally; it remains available for this session.');
        };
        const decrement = action('−', () => update(-1));
        const increment = action('+', () => update(1));
        decrement.setAttribute('aria-label', 'Decrease ' + entry.counterLabel);
        increment.setAttribute('aria-label', 'Increase ' + entry.counterLabel);
        decrement.disabled = counters.read(entry.id) === 0;
        increment.disabled = counters.read(entry.id) === entry.counterTarget;
        controls.append(
          decrement,
          element('strong', '', counters.read(entry.id) + ' / ' + entry.counterTarget),
          increment
        );
        card.append(controls, element('p', 'muted', 'Track distinct spots · saved on this device'));
        panel.append(card);
      }

      const citations = element('p', 'detail-refs', 'GUIDE REFERENCES ');
      entry.sourceRefs.forEach(ref => citations.append(element('span', 'citation', '[' + ref + '] ')));
      panel.append(citations);
    }

    const toggle = element('label', 'detail-earned');
    toggle.append(earnedCheckbox(entry), element('span', '', 'Mark trophy earned'));
    panel.append(toggle);
  }

  function render() {
    const earnedTotal = countEarned(trophies);
    find('#progress-text').textContent =
      earnedTotal + '/' + trophies.length + ' earned · ' +
      Math.round(earnedTotal / trophies.length * 100) + '%';
    find('#spoiler').checked = state.progress.hideStory;
    find('#shield-state').textContent = state.progress.hideStory ? 'ON' : 'OFF';
    find('#shield-action').textContent = state.progress.hideStory ? 'Turn shield OFF' : 'Turn shield ON';
    find('#save-state').textContent = state.progress.storageOkay
      ? 'Saved locally · offline ready'
      : 'Session only · export progress';

    find('#stage-metrics').replaceChildren(...routeStages.map(stage => {
      const members = trophies.filter(entry => entry.stage === stage.id);
      const chip = element('div', 'stage-chip');
      chip.append(
        element('b', '', 'S' + stage.id),
        element('span', '', stage.name),
        element('strong', '', countEarned(members) + '/' + members.length)
      );
      return chip;
    }));

    find('#filters').replaceChildren(...FILTERS.map(label => {
      const matches = trophies.filter(entry => trophyMatches(entry, label, '', state.progress)).length;
      const chip = action(label + ' ' + matches, () => {
        state.filter = label;
        render();
      }, 'filter-chip');
      chip.setAttribute('aria-pressed', String(label === state.filter));
      return chip;
    }));

    const matches = orderedTrophies.filter(entry =>
      trophyMatches(entry, state.filter, state.query, state.progress));
    find('#shown-count').textContent = matches.length + ' shown';
    find('#clear').hidden = !state.query;
    renderGroups(find('#checklist'), matches);
    renderDetail();
    renderGroups(find('#tracker-list'), orderedTrophies);
    find('#tracker-count').textContent = earnedTotal + ' / ' + trophies.length + ' earned';
    renderGroups(find('#roadmap-list'), orderedTrophies, true);

    const upcoming = orderedTrophies.filter(entry => !state.progress.earned[entry.id]).slice(0, 4);
    find('#next-list').replaceChildren(...upcoming.map(entry => {
      const link = action('', () => choose(entry), 'next-item');
      link.append(
        element('span', 'next-stage', 'S' + entry.stage),
        element('span', '', shownName(entry)),
        gradeBadge(entry.grade)
      );
      return link;
    }));
    if (earnedTotal === trophies.length) {
      find('#next-list').append(element('p', 'empty', 'Route complete. Leonida Legend.'));
    }

    document.querySelectorAll('.view').forEach(view => {
      view.hidden = view.id !== state.view + '-view';
    });
    document.querySelectorAll('.tabs a').forEach(tab => {
      if (tab.dataset.view === state.view) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function followRoute() {
    state.view = location.hash.match(/^#\/(guides|tracker|roadmap|spoiler)$/)?.[1] || 'guides';
    render();
  }

  find('#search').addEventListener('input', event => {
    state.query = event.target.value.trim();
    render();
  });
  find('#clear').addEventListener('click', () => {
    state.query = '';
    find('#search').value = '';
    render();
    find('#search').focus();
  });
  find('#spoiler').addEventListener('change', event => progress.spoilers(event.target.checked));
  find('#shield-action').addEventListener('click', () => progress.spoilers(!state.progress.hideStory));

  ['#export', '#backup-export'].forEach(id =>
    find(id).addEventListener('click', () => progress.exportFile()));
  ['#import', '#backup-import'].forEach(id =>
    find(id).addEventListener('click', () => find('#import-file').click()));
  find('#import-file').addEventListener('change', async event => {
    const picker = event.currentTarget;
    if (!picker.files.length) return;
    try {
      await progress.importFile(picker.files[0]);
      find('#notice').hidden = true;
    } catch (error) {
      showNotice(error.message || 'Could not import progress.');
    }
    picker.value = '';
  });

  progress.subscribe(updated => {
    state.progress = updated;
    render();
  });
  window.addEventListener('hashchange', followRoute);
  followRoute();
}
