(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};

  function loadLocalScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(path, document.baseURI).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error("The local " + path + " file could not be loaded."));
      document.head.append(script);
    });
  }

  // Classic script modules also run when index.html is opened directly from disk.
  // This is the HTML's sole JavaScript entry; every dependency stays inside app/.
  app.ready = (async () => {
    await Promise.all([
      loadLocalScript("./src/data.js"),
      loadLocalScript("./src/tracker.js"),
      loadLocalScript("./src/ui.js")
    ]);
    const data = await app.data.load();
    const tracker = app.createTracker(data);
    const ui = app.createUI(data, tracker);
    app.catalog = data;
    app.tracker = tracker;
    app.ui = ui;
    document.documentElement.dataset.ready = "true";
    return {data, tracker, ui};
  })().catch(error => {
    const status = document.getElementById("app-status");
    status.textContent = error.message + " Keep the complete app folder together and reopen index.html.";
    status.hidden = false;
    document.getElementById("results-summary").textContent = "Guide unavailable";
    document.getElementById("save-status-text").textContent = "Could not load guide";
    document.documentElement.dataset.ready = "error";
    return null;
  });
})();
