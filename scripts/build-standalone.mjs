import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SOURCE_HTML = path.join(ROOT, 'public', 'case-study.html');
const OUTPUT_HTML = path.join(ROOT, 'public', 'aseptic-equipment-training-standalone.html');
const WIX_XR_URL = 'https://kushrajshetty96.wixsite.com/kushperspectivdesign/xr-design';

const ASSET_SPECS = [
  {
    key: 'logo',
    url: '/assets/logo.png',
    file: path.join(ROOT, 'public', 'assets', 'logo.png'),
    mime: 'image/png',
    convertArgs: ['-resize', 'x144>', '-strip'],
    ext: '.png',
  },
  {
    key: 'hero',
    url: '/src/assets/images/aseptic_hero_environment_1795121124489.jpg',
    file: path.join(ROOT, 'src', 'assets', 'images', 'aseptic_hero_environment_1795121124489.jpg'),
    mime: 'image/jpeg',
    convertArgs: ['-resize', '1440x>', '-strip', '-quality', '82'],
    ext: '.jpg',
  },
  {
    key: 'gowning',
    url: '/src/assets/images/aseptic_gowning_prep_1795121125268.jpg',
    file: path.join(ROOT, 'src', 'assets', 'images', 'aseptic_gowning_prep_1795121125268.jpg'),
    mime: 'image/jpeg',
    convertArgs: ['-resize', '1440x>', '-strip', '-quality', '82'],
    ext: '.jpg',
  },
  {
    key: 'interaction',
    url: '/src/assets/images/aseptic_spatial_interaction_1795121125570.jpg',
    file: path.join(ROOT, 'src', 'assets', 'images', 'aseptic_spatial_interaction_1795121125570.jpg'),
    mime: 'image/jpeg',
    convertArgs: ['-resize', '1440x>', '-strip', '-quality', '82'],
    ext: '.jpg',
  },
  {
    key: 'unity',
    url: '/src/assets/images/aseptic_unity_prototype_1795121132409.jpg',
    file: path.join(ROOT, 'src', 'assets', 'images', 'aseptic_unity_prototype_1795121132409.jpg'),
    mime: 'image/jpeg',
    convertArgs: ['-resize', '1440x>', '-strip', '-quality', '82'],
    ext: '.jpg',
  },
];

function buildEmbeddedAssets() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xr-standalone-'));
  const embedded = {};
  try {
    for (const spec of ASSET_SPECS) {
      const outPath = path.join(tmpDir, `${spec.key}${spec.ext}`);
      execFileSync('convert', [spec.file, ...spec.convertArgs, outPath]);
      const data = fs.readFileSync(outPath);
      embedded[spec.key] = `data:${spec.mime};base64,${data.toString('base64')}`;
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  return embedded;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildStandalone() {
  let html = fs.readFileSync(SOURCE_HTML, 'utf8');
  const embedded = buildEmbeddedAssets();

  // Rewrite relative portfolio home links to live Wix XR Design URL
  html = html.replace(/href="\/"/g, `href="${WIX_XR_URL}"`);

  // Replace image src and data-lightbox URLs with deduplicated asset keys
  for (const spec of ASSET_SPECS) {
    const srcPattern = new RegExp(`src="${escapeRegExp(spec.url)}"`, 'g');
    const lbPattern = new RegExp(`data-lightbox="${escapeRegExp(spec.url)}"`, 'g');
    html = html.replace(srcPattern, `data-asset="${spec.key}"`);
    html = html.replace(lbPattern, `data-lightbox="${spec.key}" data-lightbox-asset="${spec.key}"`);
  }

  // Inject deduplicated asset dictionary and synchronous hydration right at start of script
  const hydrationSnippet = `
      // Self-contained embedded image assets (deduplicated once for single-file portability)
      const EMBEDDED_ASSETS = ${JSON.stringify(embedded)};
      document.querySelectorAll('img[data-asset]').forEach((img) => {
        const key = img.getAttribute('data-asset');
        if (key && EMBEDDED_ASSETS[key]) {
          img.src = EMBEDDED_ASSETS[key];
        }
      });
      document.querySelectorAll('[data-lightbox-asset]').forEach((btn) => {
        const key = btn.getAttribute('data-lightbox-asset');
        if (key && EMBEDDED_ASSETS[key]) {
          btn.setAttribute('data-lightbox', EMBEDDED_ASSETS[key]);
        }
      });
`;

  const marker = '  <script>\n    (() => {';
  if (!html.includes(marker)) {
    throw new Error('Could not locate script entry marker in source HTML');
  }
  html = html.replace(marker, `${marker}\n${hydrationSnippet}`);

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Built standalone HTML: ${OUTPUT_HTML} (${sizeKb} KB)`);
}

buildStandalone();
