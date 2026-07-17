import { useEffect, useMemo, useRef } from 'react';

interface Props {
  width?: number;
  height?: number;
  cell?: number;
  speed?: number;
  paused?: boolean;
  seed?: number;
  /** SVG path `d` to clip the field to. Cells whose centre falls outside are dropped. */
  mask?: string;
  /** Coordinate space the mask path is authored in. */
  maskViewBox?: readonly [number, number];
  /** Ramp the field blends across, left to right. Any length; two reads as an alternation. */
  tones?: readonly string[];
}

export default function SquareField({
  width = 378,
  height = 208,
  cell = 14,
  speed = 90,
  paused = false,
  seed = 17,
  mask,
  maskViewBox = [100, 100],
  tones = ['#2ebda1', '#1265b3'],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const [vbw, vbh] = maskViewBox;
  const toneKey = tones.join('|');

  const rng = useMemo(() => {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 0x100000000;
    };
  }, [seed]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = width * dpr;
    cv.height = height * dpr;
    cv.style.width = width + 'px';
    cv.style.height = height + 'px';
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const TONES = toneKey.split('|');
    const N = TONES.length;

    const probe = document.createElement('div');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    probe.style.color = 'var(--paper)';
    const BG = getComputedStyle(probe).color;
    probe.remove();

    const cols = Math.floor(width / cell);
    const rows = Math.floor(height / cell);
    const ox = Math.floor((width - cols * cell) / 2);
    const oy = Math.floor((height - rows * cell) / 2);

    // Resolve the mask on an identity-transform context: isPointInPath's handling
    // of a scaled CTM is not worth relying on.
    const live: boolean[] = new Array(cols * rows).fill(true);
    if (mask) {
      const mctx = document.createElement('canvas').getContext('2d');
      if (mctx) {
        const shape = new Path2D();
        shape.addPath(
          new Path2D(mask),
          new DOMMatrix().scale(width / vbw, height / vbh),
        );
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            live[j * cols + i] = mctx.isPointInPath(
              shape,
              ox + i * cell + cell / 2,
              oy + j * cell + cell / 2,
            );
          }
        }
      }
    }
    const liveIdx: number[] = [];
    for (let k = 0; k < live.length; k++) if (live[k]) liveIdx.push(k);
    if (liveIdx.length === 0) return;

    // Tone k anchors at u = k/(N-1); a cell's pick is biased toward the anchor
    // nearest it, over a floor that keeps the field mixing instead of collapsing
    // into hard vertical bands.
    function weights(u: number, v: number) {
      const uu = u + 0.1 * Math.sin(v * Math.PI * 1.7);
      return TONES.map((_, k) => {
        const anchor = N === 1 ? 0 : k / (N - 1);
        const d = Math.abs(uu - anchor) * Math.max(1, N - 1);
        return Math.max(0, 1 - d) ** 1.4 + 0.06;
      });
    }
    function pickTone(u: number, v: number, exclude = -1) {
      const w = weights(u, v);
      if (exclude >= 0) w[exclude] = 0;
      let sum = 0;
      for (const x of w) sum += x;
      let r = rng() * sum;
      for (let k = 0; k < w.length; k++) {
        if (r < w[k]) return k;
        r -= w[k];
      }
      return w.length - 1;
    }

    // Above two tones, force fg != bg so every cell shows its nesting. At two,
    // that rule would make every cell an inverse of the other and the field
    // flattens into one uniform mesh — so let fg land on bg and give the ramp
    // solid cells at each end to grade between.
    const roll = (u: number, v: number) => {
      const bg = pickTone(u, v);
      const fg = N > 2 ? pickTone(u, v, bg) : pickTone(u, v);
      return { bg, fg };
    };

    const cells: { bg: number; fg: number }[] = new Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        cells[j * cols + i] = roll(i / Math.max(1, cols - 1), j / Math.max(1, rows - 1));
      }
    }

    // Insets scale with the cell so the nesting survives small cells; the original
    // fixed 2px steps collapse to two flat rings below ~12px.
    const step = Math.max(1, Math.round(cell * 0.17));

    function drawCell(i: number, j: number) {
      const k = j * cols + i;
      const x = ox + i * cell;
      const y = oy + j * cell;
      if (!live[k]) {
        ctx!.fillStyle = BG;
        ctx!.fillRect(x, y, cell, cell);
        return;
      }
      const c = cells[k];
      const tone = [TONES[c.bg], TONES[c.fg]];
      let inset = 0;
      let ring = 0;
      while (cell - inset * 2 >= 1.5) {
        ctx!.fillStyle = tone[ring % 2];
        ctx!.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);
        inset += step;
        ring++;
      }
    }

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) drawCell(i, j);
    }

    let lastRoll = performance.now();
    function tick(t: number) {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (t - lastRoll >= speed) {
        lastRoll = t;
        // Re-roll only live cells — masked-out picks would be invisible work.
        for (let n = 0; n < 2; n++) {
          const k = liveIdx[Math.floor(rng() * liveIdx.length)];
          const i = k % cols;
          const j = (k - i) / cols;
          cells[k] = roll(i / Math.max(1, cols - 1), j / Math.max(1, rows - 1));
          drawCell(i, j);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, cell, speed, paused, rng, mask, vbw, vbh, toneKey]);

  return <canvas ref={canvasRef} style={{ display: 'block', width, height }} />;
}
