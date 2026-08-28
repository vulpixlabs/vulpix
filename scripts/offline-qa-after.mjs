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
await page.goto(url, { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(800);
const btnCls = await page.getAttribute('a:has-text("Back home")', 'class');
console.log('button class after fix:', btnCls);
console.log('has select-none:', btnCls?.includes('select-none') ? 'PASS' : 'FAIL');
const canvasCount = await page.locator('canvas').count();
console.log('canvas count after fix (expect 0):', canvasCount, canvasCount===0 ? 'PASS' : 'FAIL (still renders)');
const html = await page.content();
console.log('Vulpix present:', html.includes('Vulpix needs') ? 'PASS' : 'FAIL');
console.log('MaventHub present:', html.includes('MaventHub') ? 'FAIL' : 'PASS');
// Try to simulate selection drag over button - check ::selection not covering
const selBefore = await page.evaluate(() => window.getSelection()?.toString());
console.log('selection before:', JSON.stringify(selBefore));
// Programmatically select button text
await page.evaluate(() => {
  const el = document.querySelector('a[href="/"]');
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});
const selAfter = await page.evaluate(() => window.getSelection()?.toString());
console.log('selection after programmatic:', JSON.stringify(selAfter));
const isSelectable = await page.evaluate(() => {
  const el = document.querySelector('a[href="/"]');
  return getComputedStyle(el).userSelect;
});
console.log('button userSelect:', isSelectable, isSelectable==='none' ? 'PASS select-none' : 'FAIL');

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `offline-after-${vp.name}.png`, fullPage: false });
  console.log(`screenshot offline-after-${vp.name}.png`);
}
await browser.close();
console.log('=== QA after done ===');
