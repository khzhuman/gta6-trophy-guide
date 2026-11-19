(() => {
  "use strict";
  const app = window.PlatinumPath = window.PlatinumPath || {};
  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(path, document.baseURI).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load the local " + path + " file."));
      document.head.append(script);
    });
  }
  app.ready = (async () => {
    await Promise.all([loadScript("./src/data.js"), loadScript("./src/tracker.js"), loadScript("./src/ui.js")]);
    const data = await app.data.load();
    const tracker = app.createTracker(data);
    const ui = app.createUI(data, tracker);
    document.documentElement.dataset.ready = "true";
    return {data, tracker, ui};
  })().catch(error => {
    const notice = document.getElementById("app-status");
    notice.textContent = error.message + " Reopen the complete app folder from a local web server.";
    notice.hidden = false;
    document.documentElement.dataset.ready = "error";
    return null;
  });
})();
