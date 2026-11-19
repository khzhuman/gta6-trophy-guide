(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};

  function createUI(data, tracker) {
    const get = id => document.getElementById(id);
    const svgNamespace = document.querySelector("svg").namespaceURI;
    const collator = new Intl.Collator("en", {numeric: true, sensitivity: "base"});
    const state = {category: "all", missableOnly: false, completion: "all", query: "", sort: "roadmap", view: "list", selectedId: 2, focusedStage: 1};
    const nodes = {
      search: get("trophy-search"), clearSearch: get("clear-search"), spoilers: get("spoiler-toggle"), filters: get("filter-chips"),
      list: get("trophy-list"), listView: get("trophy-list-view"), roadmap: get("roadmap-view-panel"), scroll: get("browser-scroll"),
      listButton: get("list-view-button"), roadmapButton: get("roadmap-view-button"), detail: get("detail-panel"),
      completion: get("completion-filter"), sort: get("sort-order"), empty: get("empty-state"),
      dialog: get("import-dialog"), file: get("import-file"), importButton: get("import-button"),
      toast: get("toast"), toastText: get("toast-text")
    };
    let pendingImport = null;
    let toastTimer = null;

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function icon(name, className = "icon") {
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("class", className);
      svg.setAttribute("aria-hidden", "true");
      const use = document.createElementNS(svgNamespace, "use");
      use.setAttribute("href", "#icon-" + name);
      svg.append(use);
      return svg;
    }
    function pad(value) { return String(value).padStart(2, "0"); }
    function gradeLabel(grade) { return grade[0].toUpperCase() + grade.slice(1); }
    function displayName(trophy) { return data.displayName(trophy, tracker.hasEarned(trophy.id), tracker.getSpoilers()); }
    function hidden(trophy) { return data.isHidden(trophy, tracker.hasEarned(trophy.id), tracker.getSpoilers()); }
    function kindChip(trophy) { return element("span", "kind-chip kind-" + trophy.kind, data.kindLabels[trophy.kind]); }
    function missableChip() {
      const chip = element("span", "kind-chip missable-chip");
      chip.append(icon("flag"), document.createTextNode("Missable"));
      return chip;
    }

    function showToast(message, isError = false) {
      window.clearTimeout(toastTimer);
      nodes.toastText.textContent = message;
      nodes.toast.classList.toggle("is-error", isError);
      nodes.toast.hidden = false;
      toastTimer = window.setTimeout(() => { nodes.toast.hidden = true; }, isError ? 10000 : 4500);
    }

    function filteredTrophies() {
      const pool = state.category === "all" ? data.trophies : data.byKind.get(state.category);
      const trophies = pool.filter(trophy => {
        const earned = tracker.hasEarned(trophy.id);
        return (!state.missableOnly || trophy.missable)
          && (state.completion === "all" || (state.completion === "earned" ? earned : !earned))
          && data.matchesSearch(trophy, state.query, earned, tracker.getSpoilers());
      });
      return trophies.sort((left, right) => {
        if (state.sort === "name") return collator.compare(displayName(left), displayName(right)) || left.id - right.id;
        if (state.sort === "grade") return data.grades.indexOf(left.grade) - data.grades.indexOf(right.grade) || left.id - right.id;
        return data.roadmapOrder(left, right);
      });
    }

    function renderHeader(stats) {
      get("earned-count").textContent = stats.earned;
      get("total-count").textContent = stats.total;
      get("progress-percent").replaceChildren(document.createTextNode(String(stats.percent)), element("span", "", "%"));
      const orbit = get("progress-orbit");
      orbit.style.setProperty("--progress", String(stats.earned / stats.total * 100));
      orbit.setAttribute("aria-valuenow", String(stats.earned));
      orbit.setAttribute("aria-valuetext", stats.earned + " of " + stats.total + " trophies earned; " + stats.percent + " percent complete");
      const nextStage = data.stages.find(stage => stats.byStage[stage.id].earned < stats.byStage[stage.id].total);
      get("next-stage").replaceChildren(element("span", "", nextStage ? "Next stop" : "All 55 earned"), document.createTextNode(nextStage ? nextStage.title : " Route complete"));

      const gradeFragment = document.createDocumentFragment();
      for (const grade of data.grades) {
        const bucket = stats.byGrade[grade];
        const stat = element("span", "grade-stat grade-" + grade);
        stat.setAttribute("aria-label", gradeLabel(grade) + ": " + bucket.earned + " of " + bucket.total + " earned");
        stat.append(icon("trophy"), element("span", "grade-label", gradeLabel(grade)), element("strong", "", String(bucket.earned)), element("span", "grade-denominator", "/ " + bucket.total));
        gradeFragment.append(stat);
      }
      get("grade-summary").replaceChildren(gradeFragment);
      const warningText = element("span");
      if (stats.missableRemaining) {
        warningText.append(element("strong", "", String(stats.missableRemaining)), document.createTextNode(" first-pass warnings left"));
      } else {
        warningText.textContent = "All first-pass warnings cleared";
      }
      get("missable-summary").replaceChildren(icon("flag"), warningText);

      const routeFragment = document.createDocumentFragment();
      for (const stage of data.stages) {
        const progress = stats.byStage[stage.id];
        const button = element("button", "route-stop");
        button.type = "button";
        button.dataset.stage = String(stage.id);
        button.classList.toggle("is-current", nextStage?.id === stage.id);
        button.classList.toggle("is-complete", progress.earned === progress.total);
        button.setAttribute("aria-label", "Stage " + stage.id + ": " + stage.title + ", " + progress.earned + " of " + progress.total + " earned. Open roadmap.");
        button.append(element("span", "route-number", pad(stage.id)), element("strong", "", stage.short), element("span", "route-count", progress.earned + "/" + progress.total));
        routeFragment.append(button);
      }
      get("route-preview").replaceChildren(routeFragment);

      const storage = tracker.getStorageStatus();
      get("save-status").classList.toggle("is-warning", !storage.available || Boolean(storage.message));
      get("save-status-text").textContent = storage.available && !storage.message ? "Saved on this device" : "Export to keep this session";
      get("app-status").hidden = !storage.message;
      get("app-status").textContent = storage.message;
      get("panel-footer-text").textContent = storage.available && !storage.message
        ? "Check a trophy when you earn it. Your route saves automatically."
        : "This session is in memory. Export a backup to keep your route.";
    }

    function renderFilters(stats) {
      const fragment = document.createDocumentFragment();
      for (const category of ["all", ...data.kinds]) {
        const button = element("button", "filter-chip");
        button.type = "button";
        button.dataset.filter = category;
        button.classList.toggle("is-active", state.category === category);
        button.setAttribute("aria-pressed", String(state.category === category));
        button.append(document.createTextNode(category === "all" ? "All trophies" : data.kindLabels[category]), element("span", "chip-count", String(category === "all" ? stats.total : stats.byKind[category].total)));
        fragment.append(button);
      }
      const missable = element("button", "filter-chip filter-missable");
      missable.type = "button";
      missable.dataset.filter = "missable";
      missable.classList.toggle("is-active", state.missableOnly);
      missable.setAttribute("aria-pressed", String(state.missableOnly));
      missable.append(icon("flag"), document.createTextNode("Missable"), element("span", "chip-count", String(stats.missableTotal)));
      fragment.append(missable);
      nodes.filters.replaceChildren(fragment);
    }

    function trophyRow(trophy) {
      const earned = tracker.hasEarned(trophy.id);
      const masked = hidden(trophy);
      const name = displayName(trophy);
      const row = element("li", "trophy-row");
      row.dataset.id = String(trophy.id);
      row.classList.toggle("is-earned", earned);
      row.classList.toggle("is-selected", state.selectedId === trophy.id);
      const checkboxLabel = element("label", "earned-box");
      const checkbox = element("input");
      checkbox.type = "checkbox";
      checkbox.checked = earned;
      checkbox.dataset.earned = String(trophy.id);
      checkbox.setAttribute("aria-label", "Mark " + name + " as earned");
      checkboxLabel.append(checkbox, icon("check"));

      const button = element("button", "trophy-select");
      button.type = "button";
      button.dataset.select = String(trophy.id);
      button.setAttribute("aria-label", "Read guide for " + name);
      button.setAttribute("aria-pressed", String(state.selectedId === trophy.id));
      const badge = element("span", "grade-badge grade-" + trophy.grade);
      badge.title = gradeLabel(trophy.grade) + " trophy";
      badge.append(icon("trophy"), element("span", "sr-only", gradeLabel(trophy.grade) + " trophy"));
      const body = element("span", "trophy-body");
      const title = element("span", masked ? "trophy-name spoiler-name" : "trophy-name", name);
      if (masked) title.prepend(icon("lock"));
      const description = element("span", masked ? "trophy-description spoiler-description" : "trophy-description", masked ? "Story details hidden until earned." : trophy.description);
      const chips = element("span", "trophy-chips");
      chips.append(kindChip(trophy));
      if (trophy.missable) chips.append(missableChip());
      chips.append(element("span", "kind-chip stage-chip", "Stage " + pad(trophy.stage)));
      body.append(title, description, chips);
      button.append(badge, body, icon("arrow", "icon row-arrow"));
      row.append(checkboxLabel, button);
      return row;
    }

    function renderList(trophies) {
      const fragment = document.createDocumentFragment();
      for (const trophy of trophies) fragment.append(trophyRow(trophy));
      nodes.list.replaceChildren(fragment);
    }

    function renderRoadmap(trophies, stats) {
      const fragment = document.createDocumentFragment();
      const intro = element("div", "roadmap-intro");
      intro.append(element("h3", "", "Your route to Leonida legend."), element("p", "", "Follow these five stages at your own pace. Within a stage, follow the game's order; trophy IDs do not establish a mission sequence. First-pass flags are cautious because the descriptions do not promise replay."));
      fragment.append(intro);
      for (const stage of data.stages) {
        const stageTrophies = trophies.filter(trophy => trophy.stage === stage.id).sort(data.roadmapOrder);
        const progress = stats.byStage[stage.id];
        const card = element("section", "stage-card");
        card.dataset.stage = String(stage.id);
        card.id = "roadmap-stage-" + stage.id;
        card.classList.toggle("is-highlighted", state.focusedStage === stage.id);
        card.setAttribute("aria-labelledby", "stage-title-" + stage.id);
        const heading = element("div", "stage-heading");
        const copy = element("div", "stage-heading-copy");
        const title = element("h3", "", stage.title);
        title.id = "stage-title-" + stage.id;
        copy.append(title, element("p", "", stage.description));
        heading.append(element("span", "stage-number", pad(stage.id)), copy, element("span", "stage-progress-label", progress.earned + "/" + progress.total));
        const rail = element("div", "stage-progress");
        rail.setAttribute("role", "progressbar");
        rail.setAttribute("aria-label", stage.title + " progress");
        rail.setAttribute("aria-valuemin", "0");
        rail.setAttribute("aria-valuemax", String(progress.total));
        rail.setAttribute("aria-valuenow", String(progress.earned));
        const fill = element("span");
        fill.style.width = (progress.earned / progress.total * 100) + "%";
        rail.append(fill);
        card.append(heading, rail);
        if (stageTrophies.length) {
          const list = element("ul", "stage-trophies");
          for (const trophy of stageTrophies) list.append(trophyRow(trophy));
          card.append(list);
        } else {
          card.append(element("p", "stage-empty", "No trophies in this stage match your current filters."));
        }
        fragment.append(card);
      }
      nodes.roadmap.replaceChildren(fragment);
    }

    function detailSection(title, className = "detail-section") {
      const section = element("section", className);
      section.append(element("h3", "", title));
      return section;
    }

    function renderDetail() {
      const trophy = data.byId.get(state.selectedId);
      nodes.detail.removeAttribute("aria-labelledby");
      if (!trophy) {
        const empty = element("div", "detail-empty");
        empty.append(icon("route"), element("h2", "", "Find your next target."), element("p", "", "Choose a trophy from the checklist to see its official description, approach, sources and place in the route."));
        nodes.detail.removeAttribute("data-id");
        nodes.detail.replaceChildren(empty);
        return;
      }
      nodes.detail.dataset.id = String(trophy.id);
      const earned = tracker.hasEarned(trophy.id);
      const masked = hidden(trophy);
      const name = displayName(trophy);
      const fragment = document.createDocumentFragment();
      const topline = element("div", "detail-topline");
      const grade = element("span", "detail-grade grade-" + trophy.grade);
      grade.append(icon("trophy"), document.createTextNode(gradeLabel(trophy.grade)));
      topline.append(element("p", "eyebrow", "TROPHY BRIEF / " + pad(trophy.id)), grade);
      const title = element("h2", "detail-title", name);
      title.id = "detail-title";
      nodes.detail.setAttribute("aria-labelledby", title.id);
      const meta = element("div", "detail-meta");
      meta.append(kindChip(trophy));
      if (trophy.missable) meta.append(missableChip());
      const earnedLabel = element("span", earned ? "earned-label is-earned" : "earned-label");
      if (earned) earnedLabel.append(icon("check"));
      earnedLabel.append(document.createTextNode(earned ? "Earned" : "Unearned"));
      meta.append(earnedLabel);
      fragment.append(topline, title, meta);

      const official = detailSection("OFFICIAL DESCRIPTION");
      official.append(element("blockquote", "official-description", masked ? "Name and official description hidden until this story trophy is earned." : trophy.description));
      fragment.append(official);
      if (trophy.missable) {
        const warning = element("div", "missable-warning");
        const copy = element("div");
        copy.append(element("strong", "", "FIRST-PASS WARNING"), element("p", "", masked ? "This story or choice trophy may have a one-time window. Keep a separate save if available." : trophy.missableWhy));
        warning.append(icon("flag"), copy);
        fragment.append(warning);
      }
      if (masked) {
        const shield = element("div", "spoiler-panel");
        shield.append(icon("lock"), element("h3", "", "Story details protected"), element("p", "", "Earn this trophy to reveal its name, description and guide. Turn off Hide story spoilers when you want to read ahead."));
        fragment.append(shield);
      } else {
        const guide = detailSection("THE GUIDE");
        guide.append(element("p", "guide-text", trophy.guide));
        fragment.append(guide);
      }
      const citations = detailSection("SOURCES & METHOD", "detail-section sources-section");
      const sourceList = element("ol", "sources-list");
      trophy.sources.forEach((source, index) => {
        const item = element("li");
        item.append(element("span", "source-number", pad(index + 1)), element("span", "", source));
        sourceList.append(item);
      });
      citations.append(sourceList);
      fragment.append(citations);

      const stage = data.stages.find(item => item.id === trophy.stage);
      const stageButton = element("button", "detail-stage");
      stageButton.type = "button";
      stageButton.dataset.stage = String(stage.id);
      stageButton.setAttribute("aria-label", "Open roadmap stage " + stage.id + ": " + stage.title);
      const stageCopy = element("span");
      stageCopy.append(element("span", "detail-stage-label", "Your place in the roadmap"), element("span", "detail-stage-title", stage.title));
      stageButton.append(element("span", "detail-stage-number", pad(stage.id)), stageCopy, icon("arrow"));
      const earnedButton = element("button", "button detail-earned-button " + (earned ? "button-earned" : "button-primary"));
      earnedButton.type = "button";
      earnedButton.dataset.toggle = String(trophy.id);
      earnedButton.setAttribute("aria-label", (earned ? "Mark " + name + " as unearned" : "Mark " + name + " as earned"));
      earnedButton.append(icon("check"), document.createTextNode(earned ? "Earned · mark as unearned" : "Mark as earned"));
      fragment.append(stageButton, earnedButton);
      nodes.detail.replaceChildren(fragment);
    }

    function renderEmpty(trophies) {
      nodes.empty.hidden = trophies.length !== 0;
      if (trophies.length) return;
      if (state.category === "online" && data.byKind.get("online").length === 0) {
        get("empty-title").textContent = "No multiplayer trophies specified";
        get("empty-message").textContent = "None of the 55 supplied descriptions explicitly frames a trophy as multiplayer. Partner objectives are listed under Misc.";
      } else if (state.completion === "earned" && tracker.statistics().earned === 0) {
        get("empty-title").textContent = "Your first trophy is waiting";
        get("empty-message").textContent = "Mark a trophy as earned to see it here. Start with the story stage, then follow your route.";
      } else {
        get("empty-title").textContent = "No trophies found";
        get("empty-message").textContent = tracker.getSpoilers() && state.query.trim()
          ? "Try another search or clear your filters. Unearned story names, descriptions and guides stay out of search while spoiler protection is on."
          : "Try another search, category or progress filter to find your next trophy.";
      }
    }

    function rememberFocus() {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return null;
      if (active.dataset.stage) return {key: "stage", value: active.dataset.stage, container: active.closest("#detail-panel") ? "detail" : "route"};
      for (const key of ["earned", "select", "filter", "toggle"]) {
        if (active.dataset[key]) return {key, value: active.dataset[key]};
      }
      return null;
    }
    function restoreFocus(focus) {
      if (!focus) return;
      const container = focus.key === "stage" ? (focus.container === "detail" ? nodes.detail : get("route-preview")) : focus.key === "filter" ? nodes.filters : focus.key === "toggle" ? nodes.detail : state.view === "roadmap" ? nodes.roadmap : nodes.list;
      const target = container.querySelector("[data-" + focus.key + "='" + focus.value + "']");
      target?.focus({preventScroll: true});
    }

    function render() {
      const focus = rememberFocus();
      const trophies = filteredTrophies();
      if (!trophies.some(trophy => trophy.id === state.selectedId)) state.selectedId = trophies[0]?.id ?? null;
      const stats = tracker.statistics();
      renderHeader(stats);
      renderFilters(stats);
      renderList(trophies);
      renderRoadmap(trophies, stats);
      renderDetail();
      renderEmpty(trophies);
      document.documentElement.dataset.view = state.view;
      nodes.spoilers.checked = tracker.getSpoilers();
      nodes.clearSearch.hidden = !state.query;
      nodes.listView.hidden = state.view !== "list" || !trophies.length;
      nodes.roadmap.hidden = state.view !== "roadmap" || !trophies.length;
      nodes.listButton.classList.toggle("is-active", state.view === "list");
      nodes.roadmapButton.classList.toggle("is-active", state.view === "roadmap");
      nodes.listButton.setAttribute("aria-pressed", String(state.view === "list"));
      nodes.roadmapButton.setAttribute("aria-pressed", String(state.view === "roadmap"));
      get("browser-heading").textContent = state.view === "roadmap" ? "THE FIVE-STAGE ROUTE" : "THE CHECKLIST";
      get("results-summary").textContent = trophies.length + " of " + data.trophies.length + " trophies";
      nodes.sort.disabled = state.view === "roadmap";
      restoreFocus(focus);
    }

    function clearFilters() {
      state.category = "all";
      state.missableOnly = false;
      state.completion = "all";
      state.query = "";
      nodes.search.value = "";
      nodes.completion.value = "all";
    }
    function scrollToStage(id) {
      const card = get("roadmap-stage-" + id);
      if (!card) return;
      const top = nodes.scroll.scrollTop + card.getBoundingClientRect().top - nodes.scroll.getBoundingClientRect().top - 12;
      nodes.scroll.scrollTo({top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
    }
    function goToStage(id) {
      const stageTrophies = data.byStage.get(id);
      if (!stageTrophies) return;
      clearFilters();
      state.view = "roadmap";
      state.focusedStage = id;
      const sorted = [...stageTrophies].sort(data.roadmapOrder);
      state.selectedId = (sorted.find(trophy => !tracker.hasEarned(trophy.id)) || sorted[0]).id;
      render();
      scrollToStage(id);
    }
    function selectTrophy(id) {
      if (!data.byId.has(id)) return;
      state.selectedId = id;
      state.focusedStage = data.byId.get(id).stage;
      render();
      if (window.matchMedia("(max-width: 860px)").matches) {
        nodes.detail.focus({preventScroll: true});
        nodes.detail.scrollIntoView({block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
      }
    }

    nodes.search.addEventListener("input", () => {
      state.query = nodes.search.value;
      nodes.scroll.scrollTop = 0;
      render();
    });
    nodes.clearSearch.addEventListener("click", () => {
      state.query = "";
      nodes.search.value = "";
      render();
      nodes.search.focus();
    });
    nodes.filters.addEventListener("click", event => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      if (button.dataset.filter === "missable") state.missableOnly = !state.missableOnly;
      else state.category = button.dataset.filter;
      nodes.scroll.scrollTop = 0;
      render();
    });
    nodes.spoilers.addEventListener("change", () => tracker.setSpoilers(nodes.spoilers.checked));
    nodes.completion.addEventListener("change", () => { state.completion = nodes.completion.value; nodes.scroll.scrollTop = 0; render(); });
    nodes.sort.addEventListener("change", () => { state.sort = nodes.sort.value; nodes.scroll.scrollTop = 0; render(); });
    nodes.listButton.addEventListener("click", () => { state.view = "list"; nodes.scroll.scrollTop = 0; render(); });
    nodes.roadmapButton.addEventListener("click", () => { state.view = "roadmap"; nodes.scroll.scrollTop = 0; render(); });
    get("reset-filters").addEventListener("click", () => { clearFilters(); render(); nodes.search.focus(); });
    get("route-preview").addEventListener("click", event => {
      const button = event.target.closest("button[data-stage]");
      if (button) goToStage(Number(button.dataset.stage));
    });
    nodes.scroll.addEventListener("click", event => {
      const button = event.target.closest("button[data-select]");
      if (button) selectTrophy(Number(button.dataset.select));
    });
    nodes.scroll.addEventListener("change", event => {
      if (!event.target.matches("input[data-earned]")) return;
      state.selectedId = Number(event.target.dataset.earned);
      tracker.setEarned(state.selectedId, event.target.checked);
    });
    nodes.detail.addEventListener("click", event => {
      const stage = event.target.closest("button[data-stage]");
      const toggle = event.target.closest("button[data-toggle]");
      if (stage) goToStage(Number(stage.dataset.stage));
      if (toggle) tracker.toggleEarned(Number(toggle.dataset.toggle));
    });

    get("export-button").addEventListener("click", () => {
      try { tracker.exportProgress(); showToast("Progress exported. Keep the JSON file as your backup."); }
      catch { showToast("The backup could not be downloaded. Try exporting again.", true); }
    });
    nodes.importButton.addEventListener("click", () => nodes.file.click());
    nodes.file.addEventListener("change", async () => {
      const file = nodes.file.files[0];
      if (!file) return;
      nodes.importButton.disabled = true;
      try {
        pendingImport = await tracker.prepareImport(file);
        get("import-summary").textContent = pendingImport.name + " contains " + pendingImport.earnedCount + " of 55 earned trophies. Your current route has " + pendingImport.currentCount + " earned.";
        nodes.dialog.showModal();
      } catch (error) {
        pendingImport = null;
        showToast(error.message, true);
      } finally {
        nodes.importButton.disabled = false;
        nodes.file.value = "";
      }
    });
    get("cancel-import").addEventListener("click", () => { pendingImport = null; nodes.dialog.close(); });
    nodes.dialog.addEventListener("cancel", () => { pendingImport = null; });
    get("confirm-import").addEventListener("click", () => {
      if (!pendingImport) return;
      try {
        const count = pendingImport.earnedCount;
        tracker.applyImport(pendingImport);
        pendingImport = null;
        nodes.dialog.close();
        showToast("Imported " + count + " earned trophies. Your route is restored.");
      } catch (error) { showToast(error.message, true); }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !nodes.dialog.open && !event.target.matches("input, textarea, select")) {
        event.preventDefault();
        nodes.search.focus();
      }
      if (event.key === "Escape" && document.activeElement === nodes.search && state.query) {
        event.preventDefault();
        state.query = "";
        nodes.search.value = "";
        render();
      }
    });

    const unsubscribe = tracker.subscribe(event => {
      render();
      if (event.reason === "earned") showToast(tracker.hasEarned(event.id) ? "Trophy recorded. One step closer." : "Trophy marked as unearned.");
      if (event.reason === "spoilers") showToast(tracker.getSpoilers() ? "Story spoiler protection on." : "Story details are now visible.");
      if (event.reason === "sync") showToast("Progress updated from another tab.");
    });
    render();
    return Object.freeze({render, showToast, goToStage, getState: () => ({...state}), destroy() { unsubscribe(); window.clearTimeout(toastTimer); }});
  }

  app.createUI = createUI;
})();
