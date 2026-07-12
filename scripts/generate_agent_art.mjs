// One-off: 8体のエージェント・ポートレート画像を Gemini 画像生成 API で作成する。
// 使い方: GEMINI_API_KEY を env に入れて `node scripts/generate_agent_art.mjs`
// 元画像は .tmp/art-raw/<id>.png に保存し、後段の縮小/変換は shell 側 (sips) で行う。
import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WT = join(__dirname, '..');
const RAW_DIR = join(WT, '.tmp', 'art-raw');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY missing in env');
  process.exit(1);
}

const MODELS = [
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
];

const STYLE = [
  'Pokemon-style cute creature/monster bust portrait, centered and facing forward.',
  'Flat geometric vector art, emblem style.',
  'Warm off-white background (#fffaf3), clean crisp silhouette, subtle soft glow around the subject.',
  'Limited palette. Square 1:1 composition, subject fully inside the frame with margin, not cropped.',
  'Absolutely no text, no letters, no numbers, no words, no watermark, no logo, no signature.',
].join(' ');

const AGENTS = [
  { id: 'brief-cartographer', accent: '#f9c74f', desc: 'A Pokemon-style cute bird monster that decomposes requirements, representing a cartographer. Motifs: a compass rose pattern on its feathers, holding a tiny roll of map. Cozy amber and yellow accent colors. Thoughtful, methodical expression.' },
  { id: 'market-broker', accent: '#b7f7d7', desc: 'A Pokemon-style cute psychic cat-like monster representing a network broker. Motifs: glowing connection nodes floating around it, two hands clasping. Soft mint green and teal accent colors. Poised, diplomatic expression.' },
  { id: 'cloud-run-sre', accent: '#8ecae6', desc: 'A Pokemon-style cute turtle monster representing an SRE guarding a cloud service. Motifs: shell resembling a fluffy cloud with a ship steering wheel motif, three small glowing beacon lights on its back. Sky blue and navy accent colors. Steady, vigilant expression.' },
  { id: 'gemini-strategist', accent: '#81b29a', desc: 'A Pokemon-style cute rabbit monster representing a strategist mastermind. Motifs: starry ears like a constellation, holding a tiny chess knight piece. Sage green and gold accent colors. Calm, calculating expression.' },
  { id: 'test-forge', accent: '#ffc8dd', desc: 'A Pokemon-style cute squirrel monster representing a blacksmith forge robot. Motifs: holding a tiny golden hammer, standing next to a tiny anvil with gear-like ears. Soft pink and rose accent colors. Focused, industrious expression.' },
  { id: 'security-sentinel', accent: '#ffb3c1', desc: 'A Pokemon-style cute armadillo-like monster representing a security sentinel. Motifs: a protective shield pattern on its shell, a small padlock motif on its forehead. Rose and warm red accent colors. Alert, protective expression.' },
  { id: 'ux-guildmaster', accent: '#f6bd60', desc: 'A Pokemon-style cute fairy-like squirrel monster representing a user experience guildmaster. Motifs: holding a tiny paint brush, surrounded by a subtle light prism showing a soft rainbow glow. Soft gold and orange accent colors. Warm, discerning expression.' },
  { id: 'observability-oracle', accent: '#86bbd8', desc: 'A Pokemon-style cute cosmic owl monster representing an observability oracle. Motifs: a single prominent glowing eye emblem on its chest, surrounded by subtle circular radar sweeps and green line waveforms. Steel blue and cyan accent colors. Perceptive, insightful expression.' },
];

function buildPrompt(a) {
  return `${STYLE}\n\nSubject: ${a.desc}\nAccent color for this emblem: ${a.accent}.`;
}

function extractInlineImage(resp) {
  const cands = resp?.candidates ?? [];
  for (const c of cands) {
    const parts = c?.content?.parts ?? [];
    for (const p of parts) {
      const data = p?.inlineData?.data;
      if (data) return { data, mime: p.inlineData.mimeType || 'image/png' };
    }
  }
  return null;
}

async function generateOne(ai, model, agent) {
  const resp = await ai.models.generateContent({
    model,
    contents: buildPrompt(agent),
  });
  const img = extractInlineImage(resp);
  if (!img) throw new Error('no inlineData image in response');
  return img;
}

const HERO_PROMPT = [
  'A wide 16:9 Pokemon-style hero banner illustration for an AI agent marketplace / mission-control dashboard.',
  'Warm off-white background (#fffaf3) fading to soft cream.',
  'A central playground-like command console. Eight cute Pokemon-style monsters (representing the agents) gathered around it, interacting playfully.',
  'Each of the eight monsters has a distinct colorful accent (warm gold, mint green, sky blue, sage green, soft pink, rose, amber, and steel blue).',
  'Small motifs subtly integrated: miniature compass, glowing star, toy hammer, shield, brush, lock.',
  'Cute, colorful, clean vector art style, soft lighting, friendly and premium feel.',
  'Absolutely no text, no letters, no numbers, no words, no watermark, no logo, no UI labels.',
].join(' ');

async function generateHero(ai) {
  for (const model of MODELS) {
    for (let t = 0; t < 2; t++) {
      try {
        const resp = await ai.models.generateContent({ model, contents: HERO_PROMPT });
        const img = extractInlineImage(resp);
        if (img) {
          const buf = Buffer.from(img.data, 'base64');
          const outPath = join(RAW_DIR, 'agent-marketplace-hero.png');
          await writeFile(outPath, buf);
          console.log(`[ok] hero model=${model} raw=${buf.length}B -> ${outPath}`);
          return;
        }
      } catch (e) {
        console.error(`[try] hero model=${model} attempt=${t + 1} failed: ${e?.message || e}`);
      }
    }
  }
  console.error('[FAIL] hero: all models failed');
  process.exit(2);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey });

  if (process.argv.includes('hero')) {
    await generateHero(ai);
    return;
  }

  // どのモデルが使えるか、最初のエージェントで決定する。
  let activeModel = null;
  const results = [];

  for (const agent of AGENTS) {
    let img = null;
    let lastErr = null;

    // activeModel 未決なら候補を順に試す。決定済みならそのモデルのみ (1回リトライ)。
    const modelsToTry = activeModel ? [activeModel] : MODELS;
    const attempts = activeModel ? 2 : 1; // 決定後は 2 回 (=1 リトライ)。未決は各モデル 1 回ずつ試す。

    if (!activeModel) {
      for (const model of modelsToTry) {
        for (let t = 0; t < 2; t++) {
          try {
            img = await generateOne(ai, model, agent);
            activeModel = model;
            break;
          } catch (e) {
            lastErr = e;
            console.error(`[try] ${agent.id} model=${model} attempt=${t + 1} failed: ${e?.message || e}`);
          }
        }
        if (img) break;
      }
    } else {
      for (let t = 0; t < attempts; t++) {
        try {
          img = await generateOne(ai, activeModel, agent);
          break;
        } catch (e) {
          lastErr = e;
          console.error(`[try] ${agent.id} model=${activeModel} attempt=${t + 1} failed: ${e?.message || e}`);
        }
      }
    }

    if (!img) {
      console.error(`[FAIL] ${agent.id}: ${lastErr?.message || lastErr}`);
      results.push({ id: agent.id, ok: false });
      continue;
    }

    const buf = Buffer.from(img.data, 'base64');
    const outPath = join(RAW_DIR, `${agent.id}.png`);
    await writeFile(outPath, buf);
    console.log(`[ok] ${agent.id} model=${activeModel} raw=${buf.length}B -> ${outPath}`);
    results.push({ id: agent.id, ok: true, bytes: buf.length });
  }

  console.log('\n=== SUMMARY ===');
  console.log(`model=${activeModel}`);
  for (const r of results) {
    console.log(r.ok ? `OK   ${r.id} (${r.bytes}B raw)` : `FAIL ${r.id}`);
  }
  const failed = results.filter((r) => !r.ok).map((r) => r.id);
  if (failed.length) {
    console.log(`FAILED: ${failed.join(', ')}`);
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('fatal:', e?.stack || e);
  process.exit(1);
});
