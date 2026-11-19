(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};

  function createUI(data, tracker) {
    const byId = id => document.getElementById(id);
    const view = {page: "guides", category: "all", onlyMissable: false, query: "", completion: "all", sort: "roadmap", selected: 2, stageFocus: 1};
    const labels = ["All", "Story", "Missable", "Collectibles", "Activities", "Online"];
    const filterNode = byId("filter-chips");
    const gradeText = grade => grade[0].toUpperCase() + grade.slice(1);
    const shortId = id => String(id).padStart(2, "0");
    let waitingImport = null;
    let toastDelay = null;

    function make(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function button(title, className, action, text) {
      const node = make("button", className, text);
      node.type = "button";
      node.setAttribute("aria-label", title);
      if (action) node.addEventListener("click", action);
      return node;
    }
    function masked(trophy) { return data.isHidden(trophy, tracker.hasEarned(trophy.id), tracker.getSpoilers()); }
    function shownName(trophy) { return data.displayName(trophy, tracker.hasEarned(trophy.id), tracker.getSpoilers()); }
    function makeBadge(grade) { return make("span", "grade-badge grade-" + grade, gradeText(grade)); }
    function makeSteps(text) {
      const list = make("ol", "guide-steps");
      const phrases = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      phrases.forEach(phrase => list.append(make("li", "", phrase)));
      return list;
    }
    function makeSources(sources) {
      const list = make("ol", "source-list");
      sources.forEach((source, index) => {
        const item = make("li");
        item.append(make("b", "source-number", String(index + 1)), make("span", "", source));
        list.append(item);
      });
      return list;
    }
    function missableVerdict(trophy) {
      const line = make("p", trophy.missable ? "missability is-risk" : "missability is-unknown");
      line.append(make("b", "", "CAN IT BE MISSED? "));
      line.append(document.createTextNode(trophy.missable
        ? "POSSIBLY — first-pass warning; the description does not confirm replay."
        : "UNCLEAR — the description does not establish a one-time window."));
      return line;
    }
    function addEarnToggle(parent, trophy, extra = "") {
      const label = make("label", "earned-toggle " + extra);
      const input = make("input");
      input.type = "checkbox";
      input.checked = tracker.hasEarned(trophy.id);
      input.dataset.earnedId = String(trophy.id);
      input.setAttribute("aria-label", "Mark " + shownName(trophy) + " as earned");
      label.append(input, make("span", "toggle-track"), make("span", "toggle-copy", input.checked ? "Earned" : "Mark earned"));
      parent.append(label);
    }
    function card(trophy, compact = false) {
      const locked = masked(trophy);
      const article = make("article", "guide-card" + (compact ? " compact-guide" : ""));
      article.dataset.id = String(trophy.id);
      if (tracker.hasEarned(trophy.id)) article.classList.add("is-earned");
      const head = make("div", "guide-card-head");
      const identity = make("div", "guide-identity");
      identity.append(makeBadge(trophy.grade), make("span", "trophy-id", "#" + shortId(trophy.id)));
      const done = make("span", tracker.hasEarned(trophy.id) ? "done-mark is-on" : "done-mark", tracker.hasEarned(trophy.id) ? "EARNED" : "");
      head.append(identity, done);
      const title = make("h3", locked ? "guide-title is-locked" : "guide-title", shownName(trophy));
      const official = make("p", locked ? "official-copy is-hidden" : "official-copy", locked ? "Story trophy details are hidden until earned." : trophy.description);
      article.append(head, title, official);
      if (locked) {
        article.append(make("div", "locked-note", "Earn this story trophy or turn off spoiler protection to read the guide."), missableVerdict(trophy));
      } else {
        const instructions = make("section", "guide-method");
        instructions.append(make("h4", "micro-heading", "METHOD / IN ORDER"), makeSteps(trophy.guide));
        article.append(instructions, missableVerdict(trophy));
      }
      const cites = make("section", "inline-sources");
      cites.append(make("h4", "micro-heading", "SOURCES"), makeSources(trophy.sources));
      article.append(cites);
      addEarnToggle(article, trophy, "card-toggle");
      return article;
    }
    function filtered() {
      let collection = view.category === "all" || view.category === "missable"
        ? data.trophies.slice()
        : (data.byKind.get(view.category) || []).slice();
      collection = collection.filter(trophy => {
        const earned = tracker.hasEarned(trophy.id);
        return (!view.onlyMissable || trophy.missable)
          && (view.completion === "all" || (view.completion === "earned" ? earned : !earned))
          && data.matchesSearch(trophy, view.query, earned, tracker.getSpoilers());
      });
      return collection.sort((a, b) => {
        if (view.sort === "name") return shownName(a).localeCompare(shownName(b)) || a.id - b.id;
        if (view.sort === "grade") return data.grades.indexOf(a.grade) - data.grades.indexOf(b.grade) || a.id - b.id;
        return data.roadmapOrder(a, b);
      });
    }
    function renderGrades(stats) {
      const tray = byId("grade-summary");
      tray.replaceChildren();
      for (const grade of data.grades) {
        const group = make("span", "grade-total grade-" + grade);
        group.append(make("i", "grade-dot"), make("b", "", String(stats.byGrade[grade].earned)), make("span", "", "/ " + stats.byGrade[grade].total + " " + gradeText(grade)));
        tray.append(group);
      }
      byId("earned-count").textContent = String(stats.earned);
      byId("progress-percent").textContent = stats.percent + "%";
      byId("progress-fill").style.width = stats.percent + "%";
    }
    function renderRoute(stats) {
      const line = byId("route-preview");
      line.replaceChildren();
      data.stages.forEach(stage => {
        const tally = stats.byStage[stage.id];
        const jump = button("Open " + stage.title, "route-stop" + (view.stageFocus === stage.id ? " is-current" : ""), () => navigate("roadmap"));
        jump.append(make("i", "route-index", String(stage.id)), make("span", "route-name", stage.short), make("b", "route-tally", tally.earned + "/" + tally.total));
        line.append(jump);
      });
    }
    function renderFilters(stats) {
      filterNode.replaceChildren();
      const options = ["all", "story", "missable", "collectibles", "activities", "online"];
      for (let index = 0; index < options.length; index++) {
        const key = options[index];
        const count = key === "all" ? stats.total : key === "missable" ? stats.missableTotal : stats.byKind[key].total;
        const active = view.category === key;
        const chip = button(labels[index] + " filter, " + count + " trophies", "filter-chip" + (active ? " active" : ""), () => {
          view.category = key;
          view.onlyMissable = key === "missable";
          repaint();
        }, labels[index]);
        chip.setAttribute("aria-pressed", String(active));
        chip.append(make("b", "filter-count", String(count)));
        filterNode.append(chip);
      }
    }
    function renderGuides(items) {
      const target = byId("guide-list");
      target.replaceChildren();
      const batch = document.createDocumentFragment();
      items.forEach(trophy => batch.append(card(trophy)));
      target.append(batch);
      byId("guide-results").textContent = items.length + " of 55 trophies · citations shown with each method";
      byId("guide-empty").hidden = items.length !== 0;
    }
    function renderTracker(items) {
      const list = byId("trophy-list");
      list.replaceChildren();
      const rows = document.createDocumentFragment();
      for (const trophy of items) {
        const locked = masked(trophy);
        const row = make("article", "tracker-row" + (tracker.hasEarned(trophy.id) ? " is-earned" : "") + (view.selected === trophy.id ? " is-selected" : ""));
        addEarnToggle(row, trophy, "row-toggle");
        const open = button("Open " + shownName(trophy), "tracker-open", () => { view.selected = trophy.id; repaint(); });
        open.append(makeBadge(trophy.grade), make("span", "tracker-name", shownName(trophy)), make("span", "row-mark", trophy.missable ? "FIRST-PASS?" : ""));
        if (!locked) open.append(make("span", "tracker-description", trophy.description));
        row.append(open);
        rows.append(row);
      }
      list.append(rows);
      byId("results-summary").textContent = items.length + " of 55 trophies";
      byId("tracker-empty").hidden = items.length !== 0;
      renderDetail(data.byId.get(view.selected));
    }
    function renderDetail(trophy) {
      const panel = byId("detail-panel");
      panel.replaceChildren();
      if (!trophy) return;
      const locked = masked(trophy);
      panel.append(make("p", "kicker", "TROPHY BRIEF / " + shortId(trophy.id)), make("h3", "detail-name", shownName(trophy)), makeBadge(trophy.grade));
      if (locked) {
        panel.append(make("p", "locked-note", "Story details stay hidden until this trophy is earned."));
        return;
      }
      panel.append(make("p", "detail-description", trophy.description), make("h4", "micro-heading", "METHOD / IN ORDER"), makeSteps(trophy.guide), missableVerdict(trophy));
      panel.append(make("h4", "micro-heading", "SOURCES"), makeSources(trophy.sources));
    }
    function renderRoadmap() {
      const holder = byId("roadmap-content");
      holder.replaceChildren();
      for (const stage of data.stages) {
        const group = make("section", "stage-card" + (stage.id === view.stageFocus ? " is-current" : ""));
        const records = data.trophies.filter(trophy => trophy.stage === stage.id).sort(data.roadmapOrder);
        const tally = tracker.statistics().byStage[stage.id];
        const heading = make("div", "stage-heading");
        heading.append(make("span", "stage-number", "0" + stage.id));
        const title = make("div");
        title.append(make("h3", "", stage.title), make("p", "", stage.description));
        heading.append(title, make("b", "stage-count", tally.earned + " / " + tally.total));
        group.append(heading);
        const progress = make("div", "stage-meter");
        const fill = make("span");
        fill.style.width = (tally.total ? tally.earned / tally.total * 100 : 0) + "%";
        progress.append(fill);
        group.append(progress);
        const roster = make("div", "stage-roster");
        records.forEach(trophy => {
          const row = make("div", "stage-trophy" + (tracker.hasEarned(trophy.id) ? " is-earned" : ""));
          row.append(makeBadge(trophy.grade), make("span", "", shownName(trophy)));
          if (trophy.missable) row.append(make("b", "stage-warning", "FIRST-PASS?"));
          roster.append(row);
        });
        group.append(roster);
        holder.append(group);
      }
    }
    function syncPage() {
      const name = location.hash.replace(/^#/, "");
      view.page = ["guides", "tracker", "roadmap"].includes(name) ? name : "guides";
      const pages = {guides: "guides-view", tracker: "tracker-view", roadmap: "roadmap-view-panel"};
      Object.entries(pages).forEach(([key, id]) => { byId(id).hidden = view.page !== key; });
      byId("tracker-options").hidden = view.page !== "tracker";
      for (const [id, key] of [["guides-view-button", "guides"], ["list-view-button", "tracker"], ["roadmap-view-button", "roadmap"]]) {
        const tab = byId(id);
        if (view.page === key) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
      }
    }
    function repaint() {
      const stats = tracker.statistics();
      renderGrades(stats);
      renderRoute(stats);
      renderFilters(stats);
      const items = filtered();
      renderGuides(items);
      renderTracker(items);
      renderRoadmap();
      byId("spoiler-toggle").checked = tracker.getSpoilers();
      byId("save-status-text").textContent = tracker.getStorageStatus().available ? "Saved on this device" : "Export to keep this session";
      const status = byId("app-status");
      status.hidden = !tracker.getStorageStatus().message;
      status.textContent = tracker.getStorageStatus().message;
      syncPage();
    }
    function navigate(page) { location.hash = page; }
    function toast(message, error = false) {
      window.clearTimeout(toastDelay);
      byId("toast-text").textContent = message;
      byId("toast").classList.toggle("is-error", error);
      byId("toast").hidden = false;
      toastDelay = window.setTimeout(() => { byId("toast").hidden = true; }, error ? 8000 : 3500);
    }
    function bind() {
      byId("trophy-search").addEventListener("input", event => { view.query = event.target.value.trim(); byId("clear-search").hidden = !view.query; repaint(); });
      byId("clear-search").addEventListener("click", () => { byId("trophy-search").value = ""; view.query = ""; byId("clear-search").hidden = true; repaint(); });
      byId("spoiler-toggle").addEventListener("change", event => tracker.setSpoilers(event.target.checked));
      byId("completion-filter").addEventListener("change", event => { view.completion = event.target.value; repaint(); });
      byId("sort-order").addEventListener("change", event => { view.sort = event.target.value; repaint(); });
      document.addEventListener("change", event => { if (event.target.matches("[data-earned-id]")) tracker.setEarned(Number(event.target.dataset.earnedId), event.target.checked); });
      document.addEventListener("keydown", event => { if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); byId("trophy-search").focus(); } });
      window.addEventListener("hashchange", () => { syncPage(); window.scrollTo({top: 0, behavior: "smooth"}); });
      byId("export-button").addEventListener("click", () => toast("Saved " + tracker.exportProgress()));
      byId("import-button").addEventListener("click", () => byId("import-file").click());
      byId("import-file").addEventListener("change", async event => {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) return;
        try {
          waitingImport = await tracker.prepareImport(file);
          byId("import-summary").textContent = waitingImport.name + " contains " + waitingImport.earnedCount + " earned trophies. This device has " + waitingImport.currentCount + ".";
          byId("import-dialog").showModal();
        } catch (error) { toast(error.message, true); }
      });
      byId("cancel-import").addEventListener("click", () => { waitingImport = null; byId("import-dialog").close(); });
      byId("confirm-import").addEventListener("click", () => {
        try { tracker.applyImport(waitingImport); waitingImport = null; byId("import-dialog").close(); toast("Progress restored on this device."); }
        catch (error) { toast(error.message, true); }
      });
      tracker.subscribe(repaint);
    }

    bind();
    if (!location.hash) history.replaceState(null, "", "#guides");
    repaint();
    return Object.freeze({render: repaint, navigate});
  }
  app.createUI = createUI;
})();
