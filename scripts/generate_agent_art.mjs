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
  'Flat geometric vector emblem style, stylized robot bust portrait, centered and facing forward.',
  'Dark navy background (#0b1220), clean crisp silhouette, subtle glow around the head.',
  'Professional sci-fi command-center dashboard aesthetic: confident, competent, not cute, suitable for an enterprise ops dashboard.',
  'Single accent color used as the highlight/rim light. Limited palette. Square 1:1 composition, subject fully inside the frame with margin, not cropped.',
  'Absolutely no text, no letters, no numbers, no words, no watermark, no logo, no signature.',
].join(' ');

const AGENTS = [
  { id: 'brief-cartographer', accent: '#f9c74f', desc: 'A planner robot that decomposes requirements like a mapmaker. Motifs: a compass rose, an unfurled cartography map with contour lines, drafting/surveying tools. Thoughtful, methodical expression.' },
  { id: 'market-broker', accent: '#b7f7d7', desc: 'A broker robot that mediates between other agents over an A2A protocol. Motifs: a glowing network of connected nodes, a handshake, a trading/exchange floor. Poised, diplomatic expression.' },
  { id: 'cloud-run-sre', accent: '#8ecae6', desc: 'An SRE robot guarding a production Cloud Run service. Motifs: a stylized cloud, a ship steering wheel/helm, status signal lights (traffic-light beacons). Steady, vigilant expression.' },
  { id: 'gemini-strategist', accent: '#81b29a', desc: 'A strategist mastermind robot. Motifs: a chess knight/king piece, a constellation star map, twin/gemini stars. Calm, calculating expression.' },
  { id: 'test-forge', accent: '#ffc8dd', desc: 'A blacksmith robot that forges quality. Motifs: an anvil, a hammer, flying sparks, interlocking gears. Focused, industrious expression.' },
  { id: 'security-sentinel', accent: '#ffb3c1', desc: 'A guardian robot for security auditing. Motifs: a heater shield, a padlock, a watchtower. Alert, protective expression.' },
  { id: 'ux-guildmaster', accent: '#f6bd60', desc: 'A guild-master robot that refines user experience. Motifs: an artist brush, a ruler/straightedge, a light-refracting prism with a soft rainbow. Warm, discerning expression.' },
  { id: 'observability-oracle', accent: '#86bbd8', desc: 'An oracle robot that reads metrics. Motifs: a single all-seeing eye, a radar sweep, an oscilloscope waveform / line graph. Perceptive, insightful expression.' },
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
  'Wide 16:9 hero banner illustration for an AI agent marketplace / mission-control dashboard.',
  'Flat geometric vector style matching a set of stylized robot-bust emblems: clean shapes, crisp silhouettes, subtle glow.',
  'Dark navy background (#0b1220) fading to deep indigo. A central mission-control command console with a large holographic world/network map, radiating connection lines (A2A links) between eight glowing agent nodes arranged around it.',
  'Each of the eight nodes hints at a distinct accent color: warm gold, mint green, sky blue, sage green, soft pink, rose, amber, and steel blue.',
  'Motifs subtly woven into the nodes: compass, handshake/network, cloud with a ship helm, chess piece and constellation, anvil with sparks, shield with padlock, prism with brush, and an all-seeing eye with a waveform.',
  'Professional enterprise sci-fi aesthetic, cinematic depth, soft rim lighting, thin glowing grid lines on the floor. Balanced composition with visual breathing room.',
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
