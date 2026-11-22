import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from './server.js';

function startTestServer() {
  return new Promise((resolve) => {
    const app = createApp();
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

test('serves XR Design page featuring Aseptic Equipment Training at / and /xr-design', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    for (const urlPath of ['/', '/xr-design']) {
      const res = await fetch(`${baseUrl}${urlPath}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /text\/html/);
      const body = await res.text();
      assert.match(body, /Aseptic Equipment Training/);
      assert.match(body, /href="\/case-study"/);
      assert.match(body, /src="\/src\/assets\/images\/aseptic_hero_environment_1795121124489\.jpg"/);
    }
  } finally {
    server.close();
  }
});

test('serves confidentiality-safe Unity industrial XR case study at /case-study and redirects /case-study/', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/case-study`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    const body = await res.text();

    // Required positioning, content, and reflection
    assert.match(body, /Aseptic Equipment Training/);
    assert.match(body, /Unity-based XR experience/);
    assert.match(body, /confidentiality-safe portfolio recreation/i);
    const plainText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.match(plainText, /How might we make complex equipment training easier to understand, follow, and practise through an intuitive XR experience\?/);
    assert.match(body, /Industrial XR is not simply about placing 3D content into a headset\./);
    assert.match(body, /src="\/src\/assets\/images\/aseptic_hero_environment_1795121124489\.jpg"/);

    // Strict exclusions: no Unreal Engine, no CAD/mesh optimisation stats, no proprietary client screenshots
    assert.doesNotMatch(body, /Unreal Engine/i);
    assert.doesNotMatch(body, /\bUMG\b/);
    assert.doesNotMatch(body, /\bBlueprints\b/i);
    assert.doesNotMatch(body, /meshoptimizer/i);
    assert.doesNotMatch(body, /\b290k\b|\b95k\b/i);
    assert.doesNotMatch(body, /Line 18/i);
    assert.doesNotMatch(body, /shot-01\.jpg/i);

    const redirectRes = await fetch(`${baseUrl}/case-study/`, { redirect: 'manual' });
    assert.equal(redirectRes.status, 301);
    assert.equal(redirectRes.headers.get('location'), '/case-study');
  } finally {
    server.close();
  }
});

test('serves generated confidentiality-safe case study images under /src/assets/images/', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const imagePaths = [
      '/src/assets/images/aseptic_hero_environment_1795121124489.jpg',
      '/src/assets/images/aseptic_spatial_interaction_1795121125570.jpg',
      '/src/assets/images/aseptic_unity_prototype_1795121132409.jpg',
      '/src/assets/images/aseptic_gowning_prep_1795121125268.jpg',
    ];
    for (const assetPath of imagePaths) {
      const res = await fetch(`${baseUrl}${assetPath}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /image\/jpeg/);
      const buf = await res.arrayBuffer();
      assert.ok(buf.byteLength > 10000, `${assetPath} should be non-empty`);
    }
  } finally {
    server.close();
  }
});

test('serves portfolio logo under /assets/', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/assets/logo.png`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /image\/png/);
  } finally {
    server.close();
  }
});

test('serves single self-contained standalone HTML at /standalone and /download/aseptic-equipment-training.html', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const viewRes = await fetch(`${baseUrl}/standalone`);
    assert.equal(viewRes.status, 200);
    assert.match(viewRes.headers.get('content-type') || '', /text\/html/);
    const html = await viewRes.text();

    assert.match(html, /Aseptic Equipment Training/);
    assert.match(html, /data:image\/png;base64,/);
    assert.match(html, /data:image\/jpeg;base64,/);
    assert.match(html, /https:\/\/kushrajshetty96\.wixsite\.com\/kushperspectivdesign\/xr-design/);
    assert.doesNotMatch(html, /src="\/assets\//);
    assert.doesNotMatch(html, /src="\/src\/assets\//);
    assert.doesNotMatch(html, /Unreal Engine/i);

    const dlRes = await fetch(`${baseUrl}/download/aseptic-equipment-training.html`);
    assert.equal(dlRes.status, 200);
    assert.match(dlRes.headers.get('content-disposition') || '', /attachment; filename="aseptic-equipment-training-case-study\.html"/);
  } finally {
    server.close();
  }
});

test('blocks access to files outside static roots', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/../package.json`);
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});
