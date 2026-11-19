import * as filesystem from 'node:fs';
import * as paths from 'node:path';
import { fileURLToPath as localPath } from 'node:url';
import { buildDossier as assembleDossier } from './vendor/makefun-frontend.ts';

// Resolve the payload beside this module, independently of the launch directory.
const repositoryDirectory = localPath(new URL('.', import.meta.url));
const destinationDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyPayloadDirectory(directoryName: string): void {
  filesystem.cpSync(
    paths.join(repositoryDirectory, directoryName),
    paths.join(destinationDirectory, directoryName),
    { recursive: true },
  );
}

filesystem.mkdirSync(destinationDirectory, { recursive: true });
copyPayloadDirectory('app');

// Keep the destination present even when the repository supplies no screenshots.
filesystem.mkdirSync(paths.join(destinationDirectory, 'screenshots'), { recursive: true });
if (filesystem.existsSync(paths.join(repositoryDirectory, 'screenshots'))) {
  copyPayloadDirectory('screenshots');
}

// Keep the serialization budget and refusal thresholds together for review.
const submissionLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossierBytes = assembleDossier(destinationDirectory, submissionLimits);
filesystem.writeFileSync(paths.join(destinationDirectory, 'dossier.json'), dossierBytes);
