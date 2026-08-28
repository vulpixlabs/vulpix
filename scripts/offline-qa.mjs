import { chromium } from 'playwright';

const url = 'http://localhost:3000/~offline';
const viewports = [
  { w: 1280, h: 800, name: 'desktop' },
  { w: 768, h: 800, name: 'tablet' },
  { w: 390, h: 844, name: 'mobile' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log('=== Phase 1: gather evidence ===');
await page.goto(url, { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(800);

const html = await page.content();
const hasVulpix = html.includes('Vulpix needs');
const hasMavent = html.includes('MaventHub');
console.log(`Vulpix:${hasVulpix} MaventHub:${hasMavent}`);
if (hasMavent) console.log('FAIL: stale MaventHub still in HTML');
else console.log('PASS: Vulpix copy');

const bodyText = await page.innerText('body');
console.log('--- body snippet ---');
console.log(bodyText.slice(0, 500));

// Inspect offline button
const btn = page.locator('a:has-text("Back home")');
const btnCount = await btn.count();
console.log(`Back home links: ${btnCount}`);
if (btnCount > 0) {
  const cls = await btn.first().getAttribute('class');
  console.log('button class:', cls);
  console.log('has select-none:', cls?.includes('select-none') ? 'YES' : 'NO');
  const box = await btn.first().boundingBox();
  console.log('button box:', box);
  // computed styles
  const sel = await page.evaluate(() => {
    // ::selection not directly readable via js, but check selection bg via stylesheet
    const sheets = [...document.styleSheets].map(s => {
      try { return [...s.cssRules].map(r=>r.cssText).join('\n').slice(0,1000) } catch { return '' }
    }).join('\n');
    const hasSelectionRule = sheets.includes('::selection');
    return { hasSelectionRule, sheetsSlice: sheets.slice(0, 800) };
  });
  console.log('has ::selection rule:', sel.hasSelectionRule);
}

const canvas = page.locator('canvas');
console.log('canvas count:', await canvas.count());
if (await canvas.count() > 0) {
  const z = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? getComputedStyle(c).zIndex + ' ' + c.className : 'none';
  });
  console.log('canvas z/class:', z);
}

// Screenshots before fix
for (const vp of viewports) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `offline-before-${vp.name}.png`, fullPage: false });
  console.log(`screenshot offline-before-${vp.name}.png`);
}

// Check SW
const swStatus = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'no-sw';
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.map(r => r.active?.scriptURL + ' state:' + r.active?.state).join(' | ') || 'no regs';
});
console.log('SW:', swStatus);

// console errors
page.on('console', m => console.log('console:', m.text()));
page.on('pageerror', e => console.log('pageerror:', e.message));

await browser.close();
console.log('=== done gather ===');
