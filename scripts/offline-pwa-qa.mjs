import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Go to home first to install SW
console.log('goto /');
await page.goto('http://localhost:3000/', { waitUntil: 'load' });
await page.waitForTimeout(1500);
let sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'no sw support';
  const regs = await navigator.serviceWorker.getRegistrations();
  if (!regs.length) return 'no regs';
  return regs[0].active?.scriptURL || 'no active';
});
console.log('SW before offline:', sw);

// Check sw.js content for fallback
const swJs = await page.evaluate(async () => {
  try {
    const r = await fetch('/serwist/sw.js');
    const t = await r.text();
    return t.slice(0, 2000);
  } catch(e){ return 'fetch err '+e.message }
});
console.log('sw.js snippet has /~offline:', swJs.includes('/~offline') ? 'YES' : 'NO');
console.log(swJs.slice(0, 800));

// Simulate offline via context.setOffline
await context.setOffline(true);
console.log('setOffline true');

// try navigate to a new page while offline - should fallback to ~offline
try {
  await page.goto('http://localhost:3000/hub', { waitUntil: 'load', timeout: 8000 });
  await page.waitForTimeout(1000);
  const body = await page.innerText('body');
  console.log('offline nav body snippet:', body.slice(0, 600));
  console.log('has No connection:', body.includes('No connection') ? 'YES fallback works' : 'NO fallback');
  console.log('has Vulpix:', body.includes('Vulpix needs') ? 'YES Vulpix' : 'NO');
  console.log('has MaventHub:', body.includes('MaventHub') ? 'FAIL stale' : 'PASS');
  await page.screenshot({ path: 'offline-fallback-test.png', fullPage: false });
  console.log('screenshot offline-fallback-test.png');
} catch (e) {
  console.log('offline goto err:', e.message);
}

await context.setOffline(false);
await browser.close();
console.log('done pwa qa');
