import express from 'express';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STATIC_DIR = path.join(__dirname, 'needle-change-xr-portfolio (1)');
export const PUBLIC_DIR = path.join(__dirname, 'public');
export const DEFAULT_PORT = Number(process.env.PORT) || 3000;
export const DEFAULT_HOST = '0.0.0.0';

export function createApp(staticDir = STATIC_DIR, publicDir = PUBLIC_DIR) {
  const app = express();

  const xrDesignFile = path.join(publicDir, 'xr-design.html');
  const caseStudyFile = path.join(publicDir, 'case-study.html');
  const standaloneFile = path.join(publicDir, 'aseptic-equipment-training-standalone.html');

  app.use('/assets', express.static(path.join(publicDir, 'assets')));
  app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images')));

  app.get(['/', '/xr-design', '/xr-design.html'], (_req, res) => {
    res.sendFile(xrDesignFile);
  });

  app.get(['/case-study', '/case-study.html'], (req, res) => {
    if (req.path === '/case-study/') {
      res.redirect(301, '/case-study');
      return;
    }
    res.sendFile(caseStudyFile);
  });

  app.get('/standalone', (_req, res) => {
    res.sendFile(standaloneFile);
  });

  app.get('/download/aseptic-equipment-training.html', (_req, res) => {
    res.download(standaloneFile, 'aseptic-equipment-training-case-study.html');
  });

  app.use(
    express.static(staticDir, {
      extensions: ['html'],
      setHeaders(res, filePath) {
        if (filePath.endsWith('.glb')) {
          res.setHeader('Content-Type', 'model/gltf-binary');
        }
      },
    }),
  );

  return app;
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const app = createApp();
  app.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    console.log(`Server listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}`);
  });
}
