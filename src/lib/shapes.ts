/**
 * Silhouettes used to mask generative fields.
 *
 * Authored as points placed on the outline and smoothed with a closed
 * Catmull-Rom spline, rather than hand-tuned bezier control points — control
 * points authored by hand balloon the lobes into circles.
 */

type Pt = readonly [number, number];

function smoothClosed(pts: readonly Pt[], tension = 1): string {
  const n = pts.length;
  const at = (i: number) => pts[((i % n) + n) % n];
  let d = `M ${at(0)[0]},${at(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return `${d} Z`;
}

/** Left-facing lateral brain, traced frontal pole -> Sylvian fissure -> temporal
 *  lobe -> brainstem -> cerebellum -> occipital -> vertex. */
const BRAIN_PTS: readonly Pt[] = [
  [11, 36], [11, 41], [13, 45],
  [18, 46], [25, 46], [32, 45], [39, 44], [43, 46], [44, 49],
  [40, 49], [35, 50], [31, 52], [28, 55],
  [26, 59], [27, 63], [31, 66], [36, 67], [42, 67], [47, 65], [51, 63],
  [55, 63], [56, 68], [57, 73], [59, 77], [62, 77], [64, 72], [66, 66],
  [69, 64], [73, 67], [78, 69], [83, 68], [87, 64], [88, 59], [86, 54], [83, 51],
  [88, 46], [90, 39], [89, 32], [86, 25],
  [81, 18], [74, 12], [66, 8], [57, 6], [48, 6], [39, 7], [30, 10], [22, 15], [16, 21], [12, 28],
];

export const BRAIN = {
  path: smoothClosed(BRAIN_PTS),
  viewBox: [100, 78] as const,
};
