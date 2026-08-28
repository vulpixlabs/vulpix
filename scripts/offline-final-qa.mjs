import { chromium } from 'playwright';

const viewports = [
  { w: 1280, h: 800, name: 'desktop' },
  { w: 768, h: 800, name: 'tablet' },
  { w: 390, h: 844, name: 'mobile' },
];

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.log('FAIL', msg); fails++; } else console.log('PASS', msg);
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto('http://localhost:3000/~offline', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const body = await page.innerText('body');
  assert(body.includes('Vulpix needs'), `offline Vulpix copy @${vp.name}`);
  assert(!body.includes('MaventHub'), `no MaventHub @${vp.name}`);
  assert(body.includes('No connection.'), `heading @${vp.name}`);
  assert(body.includes('Back home'), `cta @${vp.name}`);

  const btn = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Back home');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      hasSelectNone: el.className.includes('select-none'),
      userSelect: cs.userSelect,
      bg: cs.backgroundColor,
      hasFocusRing: el.className.includes('focus-visible:ring-exotic')
    };
  });
  assert(btn?.hasSelectNone, `button select-none @${vp.name}`);
  assert(btn?.userSelect === 'none', `userSelect none @${vp.name}`);
  assert(btn?.hasFocusRing, `focus ring @${vp.name}`);

  const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
  assert(canvasCount === 0, `no TrailCanvas on ~offline @${vp.name} (got ${canvasCount})`);

  // check no black selection overlay after drag simulation
  // simulate drag over button
  const box = await page.locator('a:has-text("Back home")').boundingBox();
  if (box) {
    await page.mouse.move(box.x + 5, box.y + box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 5, box.y + box.height/2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    // after drag, check selection text - should be empty because select-none prevents selection
    const sel = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    // With select-none, dragging over button should produce no selection (or select surrounding text but not button)
    const containsBackHome = sel.includes('Back home');
    assert(!containsBackHome, `drag over button does not select Back home @${vp.name} (sel=${JSON.stringify(sel.slice(0,30))})`);
    // clear selection
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
  }

  await page.screenshot({ path: `offline-final-${vp.name}.png`, fullPage: false });
  console.log(`screenshot offline-final-${vp.name}.png`);

  // also test keyboard a11y: tab to button
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // we don't strictly assert focus but ensure no console errors
}

const consoleErrors = [];
page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(String(e)));

await page.goto('http://localhost:3000/~offline', { waitUntil: 'load' });
await page.waitForTimeout(500);
assert(consoleErrors.length===0, `no console errors (got ${consoleErrors.length})`);

await browser.close();
console.log(`\nTOTAL FAILS: ${fails}`);
process.exit(fails>0 ? 1 : 0);
