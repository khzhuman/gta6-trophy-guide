(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  function createUI(data, tracker) {
    const get = id => document.getElementById(id);
    const state = {page: "guides", kind: "all", missablesOnly: false, query: "", earned: "all", order: "roadmap", chosen: 2, activeStage: 1};
    const filterNames = ["All", "Story", "Missable", "Collectibles", "Activities", "Online"];
    const shortId = id => String(id).padStart(2, "0");
    const titleCase = value => value[0].toUpperCase() + value.slice(1);
    let importDraft = null;
    let toastTimer = 0;

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function actionButton(label, className, callback, text) {
      const node = element("button", className, text);
      node.type = "button";
      node.setAttribute("aria-label", label);
      if (callback) node.addEventListener("click", callback);
      return node;
    }
    function masked(entry) { return data.isHidden(entry, tracker.hasEarned(entry.id), tracker.getSpoilers()); }
    function displayName(entry) { return data.displayName(entry, tracker.hasEarned(entry.id), tracker.getSpoilers()); }
    function badge(grade) { return element("span", "grade-badge grade-" + grade, titleCase(grade)); }
    function steps(text) {
      const list = element("ol", "guide-steps");
      text.split(/(?<=[.!?])\s+/).filter(Boolean).forEach(sentence => list.append(element("li", "", sentence)));
      return list;
    }
    function sources(names) {
      const list = element("ol", "source-list");
      names.forEach((name, index) => {
        const row = element("li");
        row.append(element("b", "source-number", String(index + 1)), element("span", "", name));
        list.append(row);
      });
      return list;
    }
    function verdict(entry) {
      const warning = element("p", entry.missable ? "missability is-risk" : "missability is-unknown");
      warning.append(element("b", "", "CAN IT BE MISSED? "));
      warning.append(document.createTextNode(entry.missable
        ? "POSSIBLY — first-pass caution; the description does not confirm replay."
        : "UNCLEAR — the description does not establish a one-time window."));
      return warning;
    }
    function earnedSwitch(parent, entry, extraClass = "") {
      const label = element("label", "earned-toggle " + extraClass);
      const input = element("input");
      input.type = "checkbox";
      input.checked = tracker.hasEarned(entry.id);
      input.dataset.earnedId = String(entry.id);
      input.setAttribute("aria-label", "Mark " + displayName(entry) + " as earned");
      label.append(input, element("span", "toggle-track"), element("span", "toggle-copy", input.checked ? "Earned" : "Mark earned"));
      parent.append(label);
    }
    function guideCard(entry) {
      const locked = masked(entry);
      const card = element("article", "guide-card" + (tracker.hasEarned(entry.id) ? " is-earned" : ""));
      card.dataset.id = String(entry.id);
      const head = element("div", "guide-card-head");
      const meta = element("div", "guide-identity");
      meta.append(badge(entry.grade), element("span", "trophy-id", "#" + shortId(entry.id)));
      const earnedMark = element("span", tracker.hasEarned(entry.id) ? "done-mark" : "done-mark", tracker.hasEarned(entry.id) ? "EARNED" : "");
      head.append(meta, earnedMark);
      card.append(head, element("h3", locked ? "guide-title is-locked" : "guide-title", displayName(entry)));
      card.append(element("p", locked ? "official-copy is-hidden" : "official-copy", locked ? "Story trophy details are hidden until earned." : entry.description));
      if (locked) {
        card.append(element("div", "locked-note", "Earn this story trophy or turn off spoiler protection to read the method."), verdict(entry));
      } else {
        const method = element("section", "guide-method");
        method.append(element("h4", "micro-heading", "METHOD / IN ORDER"), steps(entry.guide));
        card.append(method, verdict(entry));
      }
      const citations = element("section", "inline-sources");
      citations.append(element("h4", "micro-heading", "SOURCES"), sources(entry.sources));
      card.append(citations);
      earnedSwitch(card, entry, "card-toggle");
      return card;
    }
    function visibleTrophies() {
      let entries = state.kind === "all" || state.kind === "missable"
        ? data.trophies.slice()
        : (data.byKind.get(state.kind) || []).slice();
      entries = entries.filter(entry => {
        const isEarned = tracker.hasEarned(entry.id);
        return (!state.missablesOnly || entry.missable)
          && (state.earned === "all" || (state.earned === "earned" ? isEarned : !isEarned))
          && data.matchesSearch(entry, state.query, isEarned, tracker.getSpoilers());
      });
      return entries.sort((a, b) => {
        if (state.order === "name") return displayName(a).localeCompare(displayName(b)) || a.id - b.id;
        if (state.order === "grade") return data.grades.indexOf(a.grade) - data.grades.indexOf(b.grade) || a.id - b.id;
        return data.roadmapOrder(a, b);
      });
    }
    function paintGradeCounts(stats) {
      const summary = get("grade-summary");
      summary.replaceChildren();
      data.grades.forEach(grade => {
        const count = stats.byGrade[grade];
        const item = element("span", "grade-total grade-" + grade);
        item.append(element("i", "grade-dot"), element("b", "", String(count.earned)), element("span", "", "/ " + count.total + " " + titleCase(grade)));
        summary.append(item);
      });
      get("earned-count").textContent = String(stats.earned);
      get("progress-percent").textContent = stats.percent + "%";
      get("progress-fill").style.width = stats.percent + "%";
    }
    function paintRoute(stats) {
      const line = get("route-preview");
      line.replaceChildren();
      data.stages.forEach(stage => {
        const tally = stats.byStage[stage.id];
        const jump = actionButton("Open " + stage.title, "route-stop" + (state.activeStage === stage.id ? " is-current" : ""), () => openPage("roadmap"));
        jump.append(element("i", "route-index", String(stage.id)), element("span", "route-name", stage.short), element("b", "route-tally", tally.earned + "/" + tally.total));
        line.append(jump);
      });
    }
    function paintFilters(stats) {
      const tray = get("filter-chips");
      tray.replaceChildren();
      const keys = ["all", "story", "missable", "collectibles", "activities", "online"];
      keys.forEach((key, index) => {
        const count = key === "all" ? stats.total : key === "missable" ? stats.missableTotal : stats.byKind[key].total;
        const selected = state.kind === key;
        const chip = actionButton(filterNames[index] + " filter, " + count + " trophies", "filter-chip" + (selected ? " active" : ""), () => {
          state.kind = key;
          state.missablesOnly = key === "missable";
          repaint();
        }, filterNames[index]);
        chip.setAttribute("aria-pressed", String(selected));
        chip.append(element("b", "filter-count", String(count)));
        tray.append(chip);
      });
    }
    function paintGuides(entries) {
      const holder = get("guide-list");
      const cards = document.createDocumentFragment();
      entries.forEach(entry => cards.append(guideCard(entry)));
      holder.replaceChildren(cards);
      get("guide-results").textContent = entries.length + " of 55 trophies · method and citations shown together";
      get("guide-empty").hidden = entries.length !== 0;
    }
    function paintTracker(entries) {
      const holder = get("trophy-list");
      const rows = document.createDocumentFragment();
      entries.forEach(entry => {
        const locked = masked(entry);
        const row = element("article", "tracker-row" + (tracker.hasEarned(entry.id) ? " is-earned" : "") + (state.chosen === entry.id ? " is-selected" : ""));
        earnedSwitch(row, entry, "row-toggle");
        const open = actionButton("Open " + displayName(entry), "tracker-open", () => { state.chosen = entry.id; repaint(); });
        open.append(badge(entry.grade), element("span", "tracker-name", displayName(entry)), element("span", "row-mark", entry.missable ? "FIRST-PASS?" : ""));
        if (!locked) open.append(element("span", "tracker-description", entry.description));
        row.append(open);
        rows.append(row);
      });
      holder.replaceChildren(rows);
      get("results-summary").textContent = entries.length + " of 55 trophies";
      get("tracker-empty").hidden = entries.length !== 0;
      paintDetail(data.byId.get(state.chosen));
    }
    function paintDetail(entry) {
      const panel = get("detail-panel");
      panel.replaceChildren();
      if (!entry) return;
      const locked = masked(entry);
      panel.append(element("p", "kicker", "TROPHY BRIEF / " + shortId(entry.id)), element("h3", "detail-name", displayName(entry)), badge(entry.grade));
      if (locked) { panel.append(element("p", "locked-note", "Story details stay hidden until this trophy is earned.")); return; }
      panel.append(element("p", "detail-description", entry.description), element("h4", "micro-heading", "METHOD / IN ORDER"), steps(entry.guide), verdict(entry), element("h4", "micro-heading", "SOURCES"), sources(entry.sources));
    }
    function paintRoadmap() {
      const root = get("roadmap-content");
      root.replaceChildren();
      const allStats = tracker.statistics();
      data.stages.forEach(stage => {
        const group = element("section", "stage-card" + (stage.id === state.activeStage ? " is-current" : ""));
        const records = data.trophies.filter(entry => entry.stage === stage.id).sort(data.roadmapOrder);
        const tally = allStats.byStage[stage.id];
        const head = element("div", "stage-heading");
        const title = element("div");
        title.append(element("h3", "", stage.title), element("p", "", stage.description));
        head.append(element("span", "stage-number", "0" + stage.id), title, element("b", "stage-count", tally.earned + " / " + tally.total));
        group.append(head);
        const meter = element("div", "stage-meter");
        const fill = element("span");
        fill.style.width = (tally.total ? tally.earned / tally.total * 100 : 0) + "%";
        meter.append(fill);
        group.append(meter);
        const roster = element("div", "stage-roster");
        records.forEach(entry => {
          const item = element("div", "stage-trophy" + (tracker.hasEarned(entry.id) ? " is-earned" : ""));
          item.append(badge(entry.grade), element("span", "", displayName(entry)));
          if (entry.missable) item.append(element("b", "stage-warning", "FIRST-PASS?"));
          roster.append(item);
        });
        group.append(roster);
        root.append(group);
      });
    }
    function syncPage() {
      const requested = location.hash.slice(1);
      state.page = ["guides", "tracker", "roadmap"].includes(requested) ? requested : "guides";
      const panels = {guides: "guides-view", tracker: "tracker-view", roadmap: "roadmap-view-panel"};
      Object.entries(panels).forEach(([page, id]) => { get(id).hidden = state.page !== page; });
      get("tracker-options").hidden = state.page !== "tracker";
      [["guides-view-button", "guides"], ["list-view-button", "tracker"], ["roadmap-view-button", "roadmap"]].forEach(([id, page]) => {
        const tab = get(id);
        if (state.page === page) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
      });
    }
    function repaint() {
      const stats = tracker.statistics();
      paintGradeCounts(stats);
      paintRoute(stats);
      paintFilters(stats);
      const entries = visibleTrophies();
      paintGuides(entries);
      paintTracker(entries);
      paintRoadmap();
      get("spoiler-toggle").checked = tracker.getSpoilers();
      get("save-status-text").textContent = tracker.getStorageStatus().available ? "Saved on this device" : "Export to keep this session";
      const notice = get("app-status");
      notice.hidden = !tracker.getStorageStatus().message;
      notice.textContent = tracker.getStorageStatus().message;
      syncPage();
    }
    function openPage(page) { location.hash = page; }
    function toast(message, failed = false) {
      clearTimeout(toastTimer);
      get("toast-text").textContent = message;
      get("toast").classList.toggle("is-error", failed);
      get("toast").hidden = false;
      toastTimer = setTimeout(() => { get("toast").hidden = true; }, failed ? 8000 : 3500);
    }
    function wireControls() {
      get("trophy-search").addEventListener("input", event => { state.query = event.target.value.trim(); get("clear-search").hidden = !state.query; repaint(); });
      get("clear-search").addEventListener("click", () => { get("trophy-search").value = ""; state.query = ""; get("clear-search").hidden = true; repaint(); });
      get("spoiler-toggle").addEventListener("change", event => tracker.setSpoilers(event.target.checked));
      get("completion-filter").addEventListener("change", event => { state.earned = event.target.value; repaint(); });
      get("sort-order").addEventListener("change", event => { state.order = event.target.value; repaint(); });
      document.addEventListener("change", event => { if (event.target.matches("[data-earned-id]")) tracker.setEarned(Number(event.target.dataset.earnedId), event.target.checked); });
      document.addEventListener("keydown", event => { if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); get("trophy-search").focus(); } });
      window.addEventListener("hashchange", () => { syncPage(); window.scrollTo({top: 0, behavior: "smooth"}); });
      get("export-button").addEventListener("click", () => toast("Saved " + tracker.exportProgress()));
      get("import-button").addEventListener("click", () => get("import-file").click());
      get("import-file").addEventListener("change", async event => {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) return;
        try {
          importDraft = await tracker.prepareImport(file);
          get("import-summary").textContent = importDraft.name + " contains " + importDraft.earnedCount + " earned trophies. This device has " + importDraft.currentCount + ".";
          get("import-dialog").showModal();
        } catch (error) { toast(error.message, true); }
      });
      get("cancel-import").addEventListener("click", () => { importDraft = null; get("import-dialog").close(); });
      get("confirm-import").addEventListener("click", () => {
        try { tracker.applyImport(importDraft); importDraft = null; get("import-dialog").close(); toast("Progress restored on this device."); }
        catch (error) { toast(error.message, true); }
      });
      tracker.subscribe(repaint);
    }
    wireControls();
    if (!location.hash) history.replaceState(null, "", "#guides");
    repaint();
    return Object.freeze({render: repaint, navigate: openPage});
  }
  app.createUI = createUI;
})();
