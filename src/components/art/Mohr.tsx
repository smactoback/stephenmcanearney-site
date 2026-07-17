import { useEffect, useMemo, useState } from 'react';

function buildHypercube(n: number) {
  const verts: number[][] = [];
  for (let i = 0; i < (1 << n); i++) {
    const v: number[] = [];
    for (let k = 0; k < n; k++) v.push((i >> k) & 1 ? 1 : -1);
    verts.push(v);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      let diff = 0;
      for (let k = 0; k < n; k++) if (verts[i][k] !== verts[j][k]) diff++;
      if (diff === 1) edges.push([i, j]);
    }
  }
  return { verts, edges };
}

function rotate4D(v: number[], a: number): [number, number, number, number] {
  let [x, y, z, w] = v;
  const r = (i: number, j: number, ang: number) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    const arr = [x, y, z, w];
    const a0 = arr[i], a1 = arr[j];
    arr[i] = a0 * c - a1 * s;
    arr[j] = a0 * s + a1 * c;
    [x, y, z, w] = arr;
  };
  r(0, 1, a * 0.7);
  r(0, 2, a * 1.1);
  r(0, 3, a * 1.4);
  r(1, 2, a * 0.9);
  r(1, 3, a * 1.3);
  r(2, 3, a * 0.6);
  return [x, y, z, w];
}

function project([x, y, z, w]: [number, number, number, number], scale: number): [number, number] {
  const k1 = 1 / (3 - w);
  const px = x * k1, py = y * k1, pz = z * k1;
  const k2 = 1 / (3 - pz);
  return [px * k2 * scale, py * k2 * scale];
}

interface MohrCubeProps {
  size?: number;
  dim?: number;
  phase?: number;
  color?: string;
  strokeWidth?: number;
}

export function MohrCube({
  size = 160,
  dim = 4,
  phase = 0,
  color = 'var(--ink)',
  strokeWidth = 1,
}: MohrCubeProps) {
  const { verts, edges } = useMemo(() => buildHypercube(dim), [dim]);
  const padded = verts.map((v) => v.concat(Array(Math.max(0, 4 - v.length)).fill(0)));

  const unitProj = padded.map((v) => project(rotate4D(v, phase), 1));
  let maxAbs = 0;
  for (const [x, y] of unitProj) {
    const a = Math.max(Math.abs(x), Math.abs(y));
    if (a > maxAbs) maxAbs = a;
  }
  const margin = strokeWidth * 4 + 4;
  const fit = (size / 2 - margin) / Math.max(maxAbs, 0.0001);
  const projected = unitProj.map(([x, y]) => [x * fit, y * fit] as [number, number]);

  const half = size / 2;
  return (
    <svg
      viewBox={`${-half} ${-half} ${size} ${size}`}
      style={{ width: size, height: size, display: 'block' }}
    >
      {edges.map(([a, b], i) => {
        const [x1, y1] = projected[a];
        const [x2, y2] = projected[b];
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        );
      })}
      {projected.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill={color} />
      ))}
    </svg>
  );
}

interface AnimatedProps {
  size?: number;
  dim?: number;
  color?: string;
  speed?: number;
}

export function MohrCubeAnimated({
  size = 160,
  dim = 4,
  color = 'var(--ink)',
  speed = 0.00015,
}: AnimatedProps) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf: number;
    let t0: number | null = null;
    const tick = (t: number) => {
      if (t0 == null) t0 = t;
      setPhase(((t - t0) * speed) % (Math.PI * 4));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);
  return <MohrCube size={size} dim={dim} phase={phase} color={color} />;
}

interface PartialProps {
  size?: number;
  seed?: number;
  color?: string;
  strokeWidth?: number;
}

export function MohrPartialCube({
  size = 60,
  seed = 0,
  color = 'var(--accent)',
  strokeWidth = 1,
}: PartialProps) {
  const V: [number, number, number][] = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const E: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const ax = Math.PI / 6, ay = Math.PI / 7;
  const ca = Math.cos(ax), sa = Math.sin(ax);
  const cb = Math.cos(ay), sb = Math.sin(ay);
  const proj = V.map(([x, y, z]) => {
    const x1 = x * cb + z * sb;
    const z1 = -x * sb + z * cb;
    const y2 = y * ca - z1 * sa;
    return [x1, y2] as [number, number];
  });
  let m = 0;
  for (const [x, y] of proj) m = Math.max(m, Math.abs(x), Math.abs(y));
  const fit = (size / 2 - strokeWidth * 2 - 1) / m;

  let s = (((seed * 9301 + 49297) % 233280) >>> 0) || 1;
  const rand = () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 0xffffffff;
  };
  const keep = E.map(() => rand() > 0.4);
  let kept = keep.filter(Boolean).length;
  for (let i = 0; i < E.length && kept < 6; i++) if (!keep[i]) { keep[i] = true; kept++; }

  const h = size / 2;
  return (
    <svg
      viewBox={`${-h} ${-h} ${size} ${size}`}
      style={{ width: size, height: size, display: 'block' }}
      aria-hidden="true"
    >
      {E.map(([a, b], i) => {
        if (!keep[i]) return null;
        const [x1, y1] = proj[a];
        const [x2, y2] = proj[b];
        return (
          <line
            key={i}
            x1={x1 * fit}
            y1={y1 * fit}
            x2={x2 * fit}
            y2={y2 * fit}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            fill="none"
          />
        );
      })}
    </svg>
  );
}
