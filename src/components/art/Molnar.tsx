interface Props {
  cols?: number;
  rows?: number;
  cell?: number;
  axis?: 'x' | 'y';
  rotMax?: number;
  jitterMax?: number;
  curve?: number;
  color?: string;
  accent?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export default function Molnar({
  cols = 28,
  rows = 2,
  cell = 18,
  axis = 'x',
  rotMax = 38,
  jitterMax = 6,
  curve = 1.2,
  color = 'var(--ink)',
  accent = 'var(--accent)',
  strokeWidth = 0.9,
  width,
  height,
  seed = 0.3137,
}: Props) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const cells: JSX.Element[] = [];
  const totalW = cols * cell;
  const totalH = rows * cell;
  const pad = Math.max(jitterMax + 6, 8);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k0 = axis === 'x' ? c / Math.max(1, cols - 1) : r / Math.max(1, rows - 1);
      const k = Math.pow(k0, curve);

      const rot = (rand() - 0.5) * 2 * rotMax * k;
      const dx = (rand() - 0.5) * 2 * jitterMax * k;
      const dy = (rand() - 0.5) * 2 * jitterMax * k;

      const x = c * cell + dx;
      const y = r * cell + dy;
      const side = cell - 4;
      const cx = x + side / 2;
      const cy = y + side / 2;
      const tint = k > 0.85 && rand() < 0.3 ? accent : color;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width={side}
          height={side}
          fill="none"
          stroke={tint}
          strokeWidth={strokeWidth}
          transform={`rotate(${rot} ${cx} ${cy})`}
        />,
      );
    }
  }

  const vbW = totalW + pad * 2;
  const vbH = totalH + pad * 2;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${vbW} ${vbH}`}
      style={{
        display: 'block',
        width: width != null ? width : '100%',
        height: height != null ? height : 'auto',
      }}
    >
      {cells}
    </svg>
  );
}
