import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import satori from 'satori';
import { SITE } from '../consts';

const FONT_DIR = join(process.cwd(), 'src/assets/og');
const WASM_PATH = join(process.cwd(), 'node_modules/@resvg/resvg-wasm/index_bg.wasm');

const BG = '#0a0a0a';
const FG = '#fafafa';
const MUTED = '#a1a1aa';
const FAINT = '#71717a';
const RULE = '#27272a';

let wasmReady: Promise<unknown> | null = null;
let fontsPromise: ReturnType<typeof loadFonts> | null = null;

function ensureWasm() {
  if (!wasmReady) wasmReady = readFile(WASM_PATH).then((buf) => initWasm(buf));
  return wasmReady;
}

async function loadFonts() {
  const [regular, semibold] = await Promise.all([
    readFile(join(FONT_DIR, 'geist-400.woff')),
    readFile(join(FONT_DIR, 'geist-600.woff')),
  ]);
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: semibold, weight: 600 as const, style: 'normal' as const },
  ];
}

/** Minimal element-tree helper so we avoid a JSX runtime. */
function el(type: string, style: Record<string, unknown>, children?: unknown) {
  return { type, props: { style, children } };
}

interface OgOptions {
  title: string;
  kicker?: string;
}

/** Render a 1200x630 OpenGraph card as a PNG buffer. */
export async function renderOg({ title, kicker = 'Ground Truth' }: OgOptions): Promise<Uint8Array> {
  if (!fontsPromise) fontsPromise = loadFonts();
  const [fonts] = await Promise.all([fontsPromise, ensureWasm()]);

  const fontSize = title.length > 78 ? 52 : title.length > 48 ? 60 : 70;

  const markup = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '1200px',
      height: '630px',
      padding: '76px 80px',
      background: BG,
      fontFamily: 'Geist',
    },
    [
      // Eyebrow: a small mark + the brand name.
      el('div', { display: 'flex', alignItems: 'center', gap: '18px' }, [
        el('div', { display: 'flex', width: '20px', height: '20px', background: FG }, ''),
        el(
          'div',
          {
            display: 'flex',
            fontSize: '25px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: FAINT,
          },
          SITE.author.toUpperCase(),
        ),
      ]),
      // The headline.
      el(
        'div',
        {
          display: 'flex',
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          lineHeight: 1.14,
          letterSpacing: '-0.02em',
          color: FG,
        },
        title,
      ),
      // Footer rule: section label + domain.
      el(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '30px',
          borderTop: `1px solid ${RULE}`,
          fontSize: '23px',
          letterSpacing: '0.04em',
          color: MUTED,
        },
        [
          el('div', { display: 'flex' }, kicker),
          el('div', { display: 'flex' }, SITE.url.replace('https://', '')),
        ],
      ),
    ],
  );

  const svg = await satori(markup as never, { width: 1200, height: 630, fonts });

  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
