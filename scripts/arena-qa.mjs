import { chromium } from 'playwright';

let fails=0;
function assert(c,m){ if(!c){console.log('FAIL',m); fails++;} else console.log('PASS',m); }

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('console', msg=>{
  if(msg.type()==='error' && !msg.text().includes('eval() is not supported')) console.log('console error',msg.text());
});
page.on('pageerror', e=>console.log('pageerror',String(e)));

// Test marquee Solar/Yi hidden
await page.goto('http://localhost:3000/', {waitUntil:'load'});
await page.waitForTimeout(800);
let marquee = await page.evaluate(()=>{
  const sec=document.querySelector('section.bg-exotic');
  const titles=[...sec.querySelectorAll('span[title]')].map(s=>s.getAttribute('title'));
  return titles;
});
console.log('marquee titles',marquee);
assert(!marquee.includes('Solar'),'marquee Solar hidden');
assert(!marquee.includes('Yi'),'marquee Yi hidden');
assert(marquee.includes('Qwen'),'marquee Qwen present');
assert(marquee.length===32,'marquee 16*2=32 items (was 36)');

// Check vs black
await page.goto('http://localhost:3000/arena', {waitUntil:'load'});
await page.waitForTimeout(1200);
// wait for models to load
await page.waitForTimeout(2000);
let vsColor = await page.evaluate(()=>{
  const vs = document.querySelector('h1 span.text-ink');
  if(!vs) return null;
  return getComputedStyle(vs).color;
});
console.log('vs color',vsColor);
assert(vsColor==='rgb(0, 0, 0)' || vsColor==='rgba(0, 0, 0, 1)','vs is black');

// Check dropdown logos
// open first picker
await page.click('button:has-text("Claude")', {timeout:5000}).catch(()=>{});
await page.waitForTimeout(500);
let pickerOpen = await page.evaluate(()=> !!document.querySelector('[role="listbox"]'));
console.log('picker open',pickerOpen);
if(pickerOpen){
  let logos = await page.evaluate(()=>{
    const box=document.querySelector('[role="listbox"]');
    const imgs=[...box.querySelectorAll('img')];
    return imgs.slice(0,5).map(img=>({src:img.getAttribute('src'), w:img.naturalWidth, complete:img.complete, filter:getComputedStyle(img).filter}));
  });
  console.log('picker logos sample',logos);
  assert(logos.every(l=>l.w>0 && l.complete),'dropdown logos loaded (no black box)');
  // check fallback not black box
  let fallbacks = await page.evaluate(()=>{
    const box=document.querySelector('[role="listbox"]');
    return [...box.querySelectorAll('span[data-logo-fallback]')].map(s=>s.className);
  });
  console.log('fallbacks',fallbacks.slice(0,3));
  // should be white fallback not black
  assert(fallbacks.every(c=>!c.includes('bg-ink')),'fallback not black box');
  await page.keyboard.press('Escape');
}

// Benchmarks scaling: check heights relative to maxSel
let benchInfo = await page.evaluate(()=>{
  const charts=document.querySelectorAll('.arena-chart');
  if(charts.length===0) return null;
  const first=charts[0];
  const bars=[...first.querySelectorAll('.aa-bar-fill')];
  return bars.slice(0,3).map(b=>({h:b.style.height, bg:getComputedStyle(b).backgroundColor}));
});
console.log('bench bars',benchInfo);

// Design Arena pie: check Graph mode shows svg pie
await page.evaluate(()=>{ const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Graph'); if(btn) btn.click(); });
await page.waitForTimeout(800);
let pie = await page.evaluate(()=>{
  const svg=document.querySelector('svg');
  const paths=[...document.querySelectorAll('svg path')];
  return {hasSvg: !!svg, pathCount: paths.length, viewBox: svg?.getAttribute('viewBox')};
});
console.log('pie',pie);
assert(pie.hasSvg && pie.pathCount>=2,'Design Arena pie rendered');
// if no pie because no data, that's okay - check that pie container exists
if(!pie.hasSvg){
  let noData = await page.evaluate(()=> document.body.innerText.includes('No Design Arena data'));
  console.log('noData',noData);
  assert(noData,'shows no data note when missing');
}

// 404 check for ~offline
let offlineRes = await page.evaluate(async()=>{
  try{
    const r=await fetch('/~offline');
    return {status:r.status, text: (await r.text()).slice(0,200)};
  }catch(e){return {err:String(e)}}
});
console.log('offline fetch',offlineRes);
assert(offlineRes.status===404,'~offline should 404 after deletion');

await page.goto('http://localhost:3000/~offline', {waitUntil:'load'});
await page.waitForTimeout(800);
let body = await page.innerText('body');
console.log('offline page body snippet',body.slice(0,300));
assert(body.includes('Lost in the frontier') || body.includes('404'),'~offline redirects to 404 not-found page');

// Activity note check: for a model without data, check note? Hard to force, but check Design Arena missing note structure exists
await browser.close();
console.log(`\nFAILS: ${fails}`);
process.exit(fails?1:0);
