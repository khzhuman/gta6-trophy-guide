(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};

  function attach(path) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = new URL(path, document.baseURI).href;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error("Could not load the local " + path + " file."));
      document.head.append(tag);
    });
  }

  app.ready = (async () => {
    await Promise.all([attach("./src/data.js"), attach("./src/tracker.js"), attach("./src/ui.js")]);
    const data = await app.data.load();
    const tracker = app.createTracker(data);
    const ui = app.createUI(data, tracker);
    document.documentElement.dataset.ready = "true";
    return {data, tracker, ui};
  })().catch(error => {
    const status = document.getElementById("app-status");
    status.textContent = error.message + " Reopen the complete app folder from a local web server.";
    status.hidden = false;
    document.documentElement.dataset.ready = "error";
    return null;
  });
})();
