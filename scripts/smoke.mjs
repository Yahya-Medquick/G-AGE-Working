import process from 'node:process';

const baseUrl = new URL(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000');
const hostname = baseUrl.hostname.toLowerCase();
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
const isNamedRailwayPreview = hostname.endsWith('.railway.app') && /(staging|preview|pr[-.]?\d+)/i.test(hostname);
if ((!isLocalHost && !isNamedRailwayPreview) || hostname === 'gageai.org' || hostname.endsWith('.gageai.org')) {
  throw new Error('Smoke tests are restricted to localhost or a Railway preview host; refusing this URL.');
}
if (!isLocalHost && !['staging', 'preview'].includes(process.env.APP_ENV || '')) {
  throw new Error('Set APP_ENV=staging or APP_ENV=preview before smoke-testing a Railway environment.');
}

async function request(path) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

const healthResponse = await request('/api/health');
if (healthResponse.headers.get('x-robots-tag') !== 'noindex, nofollow') {
  throw new Error('Staging API responses must carry X-Robots-Tag: noindex, nofollow.');
}
const health = await healthResponse.json();
if (health.status !== 'ok' || !['staging', 'preview'].includes(health.appEnv) || !('commit' in health)) {
  throw new Error('/api/health is missing its expected status or deployment fields.');
}

const htmlResponse = await request('/');
const html = await htmlResponse.text();
if (!/<meta\s+name=["']robots["']\s+content=["']noindex(?:,\s*nofollow)?["']\s*\/?>/i.test(html)) {
  throw new Error('The staging SPA shell is missing its noindex robots meta tag.');
}

const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|woff2?)(?:\?[^"']*)?)["']/gi)]
  .map((match) => match[1])
  .filter((asset) => asset.startsWith('/'));
if (assetPaths.length === 0) throw new Error('No local built JS/CSS/font assets were found in the SPA shell.');
for (const assetPath of assetPaths) {
  const response = await request(assetPath);
  const contentType = response.headers.get('content-type') || '';
  const extension = new URL(assetPath, baseUrl).pathname.split('.').pop();
  if (extension === 'js' && !/javascript|ecmascript/i.test(contentType)) throw new Error(`${assetPath} has an invalid JS MIME type.`);
  if (extension === 'css' && !/text\/css/i.test(contentType)) throw new Error(`${assetPath} has an invalid CSS MIME type.`);
  if (extension?.startsWith('woff') && !/font|octet-stream/i.test(contentType)) throw new Error(`${assetPath} has an invalid font MIME type.`);
}

for (const path of ['/terms', '/privacy', '/download', '/manifest.json', '/sw.js']) await request(path);
const robots = await (await request('/robots.txt')).text();
if (!robots.includes('Disallow: /')) throw new Error('Staging robots.txt must disallow crawling.');
for (const path of ['/sitemap.xml', '/sitemap-qa.xml']) {
  const response = await fetch(new URL(path, baseUrl));
  if (response.status !== 404) throw new Error(`${path} should return 404 in staging (got ${response.status}).`);
}
for (const path of ['/api/v1/personas', '/api/catalog', '/api/usage']) {
  const response = await request(path);
  if (!/application\/json/i.test(response.headers.get('content-type') || '')) {
    throw new Error(`${path} did not return JSON.`);
  }
}

console.log(`Smoke checks passed for ${baseUrl.origin}`);
