import { loadTrophies } from './data.js';
import { createProgress } from './tracker.js';
import { startViews } from './ui.js';

async function startGuide() {
  try {
    const trophies = await loadTrophies();
    const progress = createProgress(trophies);
    startViews(trophies, progress);
  } catch (error) {
    const notice = document.querySelector('#notice');
    notice.textContent = error.message;
    notice.hidden = false;
  }
}

startGuide();
