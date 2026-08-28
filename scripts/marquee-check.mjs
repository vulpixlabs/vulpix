import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'load' });
await page.waitForTimeout(1000);
const logos = await page.evaluate(() => {
  // Better query marquee section
  const marquee = document.querySelector('section.bg-exotic');
  if (!marquee) return {err:'no marquee'};
  const items = [...marquee.querySelectorAll('span[title]')];
  return items.map(el=>{
    const img = el.querySelector('img');
    const fallback = el.querySelector('span[data-logo-fallback]');
    const name = el.getAttribute('title');
    const imgSrc = img ? img.getAttribute('src') : null;
    const imgClass = img ? img.className : null;
    const naturalWidth = img ? img.naturalWidth : null;
    const naturalHeight = img ? img.naturalHeight : null;
    const complete = img ? img.complete : null;
    const filter = img ? getComputedStyle(img).filter : null;
    const fallbackText = fallback ? fallback.textContent : null;
    const fallbackClass = fallback ? fallback.className : null;
    return { name, imgSrc, imgClass, naturalWidth, naturalHeight, complete, filter, fallbackText, fallbackClass };
  });
});
console.log(JSON.stringify(logos, null, 2));
await page.screenshot({ path: 'marquee-check.png', fullPage: false });
console.log('screenshot marquee-check.png');
await browser.close();
