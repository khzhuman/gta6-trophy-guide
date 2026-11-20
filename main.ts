import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function deliverFolder(name: string): void {
  const target = join(outputRoot, name);
  mkdirSync(target, { recursive: true });
  const source = join(entryRoot, name);
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputRoot, { recursive: true });
deliverFolder('app');
deliverFolder('screenshots');

// Assemble the review document only after the complete payload is in place.
const review = buildDossier(outputRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputRoot, 'dossier.json'), review);
