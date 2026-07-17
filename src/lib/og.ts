import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import satori from 'satori';
import { SITE } from '../consts';

const FONT_DIR = join(process.cwd(), 'src/assets/og');
const WASM_PATH = join(process.cwd(), 'node_modules/@resvg/resvg-wasm/index_bg.wasm');

const PAPER = '#ffffff';
const INK = '#0a0f14';
const SOFT = 'rgba(10, 15, 20, 0.67)';
const FAINT = 'rgba(10, 15, 20, 0.45)';
const RULE = 'rgba(10, 15, 20, 0.18)';
const ACCENT = '#1062c8';

let wasmReady: Promise<unknown> | null = null;
let fontsPromise: ReturnType<typeof loadFonts> | null = null;

function ensureWasm() {
  if (!wasmReady) wasmReady = readFile(WASM_PATH).then((buf) => initWasm(buf));
  return wasmReady;
}

async function loadFonts() {
  const [regular, semibold] = await Promise.all([
    readFile(join(FONT_DIR, 'plex-mono-400.woff')),
    readFile(join(FONT_DIR, 'plex-mono-600.woff')),
  ]);
  return [
    { name: 'Plex Mono', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Plex Mono', data: semibold, weight: 600 as const, style: 'normal' as const },
  ];
}

function el(type: string, style: Record<string, unknown>, children?: unknown) {
  return { type, props: { style, children } };
}

interface OgOptions {
  title: string;
  kicker?: string;
}

export async function renderOg({ title, kicker = 'Building 58' }: OgOptions): Promise<Uint8Array> {
  if (!fontsPromise) fontsPromise = loadFonts();
  const [fonts] = await Promise.all([fontsPromise, ensureWasm()]);

  const fontSize = title.length > 78 ? 48 : title.length > 48 ? 56 : 64;

  const markup = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '1200px',
      height: '630px',
      padding: '76px 80px',
      background: PAPER,
      fontFamily: 'Plex Mono',
    },
    [
      el('div', { display: 'flex', alignItems: 'center', gap: '14px' }, [
        el(
          'div',
          {
            display: 'flex',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: INK,
          },
          'Ground Truth',
        ),
        el('div', { display: 'flex', fontSize: '28px', fontWeight: 700, color: ACCENT }, '_'),
      ]),
      el(
        'div',
        {
          display: 'flex',
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: INK,
        },
        title,
      ),
      el(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '24px',
          borderTop: `1px solid ${RULE}`,
          fontSize: '22px',
          letterSpacing: '0.04em',
          color: SOFT,
        },
        [
          el('div', { display: 'flex' }, kicker),
          el('div', { display: 'flex', color: FAINT }, SITE.url.replace('https://', '')),
        ],
      ),
    ],
  );

  const svg = await satori(markup as never, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
