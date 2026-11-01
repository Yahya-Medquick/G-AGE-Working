/* Resolution regression check.
 * Usage:  npm run build && npm start   (in one terminal)
 *         npx playwright install chromium && node scripts/viewport-check.cjs [url]
 * Fails (exit 1) on page-wide horizontal scroll, overlapping header controls or JS errors
 * at phone, tablet, laptop and desktop sizes. Screenshots go to ./viewport-shots/.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:3000/';
const sizes = [[320,568],[360,640],[390,844],[414,896],[600,900],[768,1024],[769,1024],[820,1180],[1024,768],[1280,720],[1366,768],[1440,900],[1536,864],[1920,1080]];
(async () => {
  fs.mkdirSync('viewport-shots', { recursive: true });
  const browser = await chromium.launch();
  let failed = 0;
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1024 });
    await ctx.addInitScript(() => localStorage.setItem('gage_has_seen_onboarding', 'true'));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(url, { waitUntil: 'networkidle' });
    const skip = page.getByText('Skip', { exact: true }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const hdr = document.querySelector('header');
      let overlap = false;
      if (hdr) {
        const boxes = [...hdr.querySelectorAll('button')].map((b) => b.getBoundingClientRect()).filter((b) => b.width && b.height);
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], c = boxes[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) overlap = true;
        }
      }
      return { hscroll: de.scrollWidth > de.clientWidth, overlap };
    });
    const ok = !r.hscroll && !r.overlap && errors.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${w}x${h}`, ok ? '' : JSON.stringify({ ...r, errors }));
    await page.screenshot({ path: `viewport-shots/${w}x${h}.png` });
    await ctx.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
