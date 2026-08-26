export const TRAIL_W = 192;
export const TRAIL_H = 108;

export const TRAIL = {
  grid: new Uint8Array(TRAIL_W * TRAIL_H),
  version: 0,
};

let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;
let visibleCtx: CanvasRenderingContext2D | null = null;
let lastX = -1;
let lastY = -1;
let raf = 0;
let running = false;

export function getTrailMaskCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (!maskCanvas) {
    maskCanvas = document.createElement("canvas");
    maskCanvas.width = TRAIL_W;
    maskCanvas.height = TRAIL_H;
    maskCtx = maskCanvas.getContext("2d");
  }
  return maskCanvas;
}

export function attachTrailCanvas(cv: HTMLCanvasElement | null) {
  visibleCtx = cv?.getContext("2d") ?? null;
}

function stamp(x: number, y: number) {
  const R = 2.4;
  const cx = Math.round(x);
  const cy = Math.round(y);
  const r = Math.ceil(R);
  for (let gy = cy - r; gy <= cy + r; gy++) {
    if (gy < 0 || gy >= TRAIL_H) continue;
    for (let gx = cx - r; gx <= cx + r; gx++) {
      if (gx < 0 || gx >= TRAIL_W) continue;
      const d = Math.hypot(gx - x, gy - y);
      if (d > R) continue;
      const v = Math.round((1 - d / R) * 255);
      const i = gy * TRAIL_W + gx;
      if (v > TRAIL.grid[i]) TRAIL.grid[i] = v;
    }
  }
}

function onMove(e: MouseEvent) {
  const gx = (e.clientX / window.innerWidth) * TRAIL_W;
  const gy = (e.clientY / window.innerHeight) * TRAIL_H;
  if (lastX < 0) {
    stamp(gx, gy);
  } else {
    const dx = gx - lastX;
    const dy = gy - lastY;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 1.5));
    for (let s = 1; s <= steps; s++) {
      stamp(lastX + (dx * s) / steps, lastY + (dy * s) / steps);
    }
  }
  lastX = gx;
  lastY = gy;
}

function tick() {
  const grid = TRAIL.grid;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i] * 0.93;
    grid[i] = v < 1 ? 0 : v;
  }
  TRAIL.version++;

  const w = window.innerWidth;
  const h = window.innerHeight;

  let zones: { top: number; bottom: number; light: boolean }[] | null = null;

  if (visibleCtx) {
    const ctx = visibleCtx;
    ctx.clearRect(0, 0, w, h);
    const cw = w / TRAIL_W;
    const ch = h / TRAIL_H;

    zones = [];
    document.querySelectorAll<HTMLElement>("[data-trail]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) return;
      zones!.push({
        top: r.top,
        bottom: r.bottom,
        light: el.dataset.trail === "light",
      });
    });
    zones.sort((a, b) => a.top - b.top);

    for (let gy = 0; gy < TRAIL_H; gy++) {
      for (let gx = 0; gx < TRAIL_W; gx++) {
        const heat = grid[gy * TRAIL_W + gx] / 255;
        if (heat <= 0.02) continue;
        const cy = gy * ch + ch / 2;
        let light = true;
        for (let zi = 0; zi < zones.length; zi++) {
          const z = zones[zi];
          if (cy >= z.top && cy <= z.bottom) {
            light = z.light;
            break;
          }
        }
        ctx.fillStyle = light
          ? `rgba(245,79,27,${heat})`
          : `rgba(255,255,255,${heat})`;
        ctx.fillRect(gx * cw, gy * ch, cw + 1, ch + 1);
      }
    }
  }

  if (maskCtx) {
    const img = maskCtx.createImageData(TRAIL_W, TRAIL_H);
    const d = img.data;
    for (let i = 0; i < grid.length; i++) {
      d[i * 4] = 255;
      d[i * 4 + 1] = 255;
      d[i * 4 + 2] = 255;
      d[i * 4 + 3] = grid[i];
    }
    maskCtx.putImageData(img, 0, 0);
  }

  raf = requestAnimationFrame(tick);
}

export function startTrail() {
  if (running || typeof window === "undefined") return;
  if (window.self !== window.top) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  running = true;
  window.addEventListener("mousemove", onMove);
  raf = requestAnimationFrame(tick);
}

export function stopTrail() {
  if (!running) return;
  running = false;
  window.removeEventListener("mousemove", onMove);
  cancelAnimationFrame(raf);
}
