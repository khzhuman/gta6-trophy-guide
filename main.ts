import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Node's native TypeScript support runs this entry without a build or dependencies.
const repository = dirname(fileURLToPath(import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const appSource = join(repository, 'app');
const screenshotSource = join(repository, 'screenshots');

function inside(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !path.startsWith(sep));
}

if (destination === repository || inside(appSource, destination) || inside(screenshotSource, destination)) {
  throw new Error('Choose an output directory outside the source app and screenshots folders.');
}

mkdirSync(destination, { recursive: true });
const appDestination = join(destination, 'app');
rmSync(appDestination, { recursive: true, force: true });
cpSync(appSource, appDestination, { recursive: true });

const screenshotDestination = join(destination, 'screenshots');
if (existsSync(screenshotSource)) {
  // Fresh orchestration captures replace any earlier output-only verification captures.
  rmSync(screenshotDestination, { recursive: true, force: true });
  cpSync(screenshotSource, screenshotDestination, { recursive: true });
} else {
  // Preserve output-only preflight captures; never invent or alter source screenshots.
  mkdirSync(screenshotDestination, { recursive: true });
}

const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
console.log(`PLATINUM PATH packaged in ${destination}; dossier.json is ${dossier.byteLength} bytes.`);
