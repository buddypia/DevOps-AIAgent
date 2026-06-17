import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

const latestVersions = {
  dependencies: {
    "@google/genai": "2.5.0",
    cors: "2.8.6",
    express: "5.2.1",
    zod: "4.4.3",
  },
  devDependencies: {
    "@types/cors": "2.8.19",
    "@types/express": "5.0.6",
    "@types/node": "25.9.1",
    concurrently: "9.2.1",
    tsx: "4.22.3",
    typescript: "6.0.3",
    vite: "8.0.14",
    vitest: "4.1.7",
  },
};

const researchSources = [
  {
    label: "Google Cloud Run health checks",
    url: "https://docs.cloud.google.com/run/docs/configuring/healthchecks",
    takeaway: "Cloud Run startup probes succeed on HTTP 2xx/3xx health endpoints, so every MVP exposes health/readiness endpoints.",
  },
  {
    label: "Google Cloud Run security overview",
    url: "https://docs.cloud.google.com/run/docs/securing/security",
    takeaway: "Cloud Run production services should use dedicated identity, secrets, IAM, and runtime security controls.",
  },
  {
    label: "GitHub README guidance",
    url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
    takeaway: "A README should explain what the project does, why it is useful, how to start, where to get help, and who maintains it.",
  },
  {
    label: "OWASP ASVS",
    url: "https://owasp.org/www-project-application-security-verification-standard/",
    takeaway: "Use security requirements as a verification yardstick for web applications and APIs.",
  },
  {
    label: "Hypothesis-driven MVP research",
    url: "https://arxiv.org/abs/1808.05630",
    takeaway: "Startup MVPs should connect experiments to explicit business hypotheses and learning decisions.",
  },
  {
    label: "Gemini 3.1 Flash-Lite announcement",
    url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-lite/",
    takeaway: "Gemini 3.1 Flash-Lite is positioned for high-volume, low-latency AI workloads.",
  },
];

function writeText(filePath, text) {
  writeFileSync(filePath, text.replace(/\n+$/, "\n"), "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseProject(projectPath) {
  const source = readFileSync(projectPath, "utf8");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("} as const");
  if (start === -1 || end === -1) {
    throw new Error(`Cannot parse project config: ${projectPath}`);
  }
  return JSON.parse(source.slice(start, end + 1));
}

function listItems(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
}

function pillItems(items) {
  return items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function docsNav(project, current) {
  const links = [
    ["../README.md", "README"],
    ["environment.md", "環境設定"],
    ["manual.html", "操作マニュアル"],
    ["development.html", "開発ガイド"],
  ];
  return `<nav aria-label="ドキュメント">
${links
  .map(([href, label]) => {
    const active = label === current ? ' aria-current="page"' : "";
    return `  <a${active} href="${href}">${label}</a>`;
  })
  .join("\n")}
</nav>
<p class="doc-id">Rank ${project.rank} / Idea ${escapeHtml(project.ideaNo)} / ${escapeHtml(project.packageName)}</p>`;
}

function baseStyles(project) {
  const accent = escapeHtml(project.accent);
  const secondary = escapeHtml(project.secondary);
  return `:root {
  color-scheme: light;
  --accent: ${accent};
  --secondary: ${secondary};
  --ink: #17202a;
  --muted: #52606d;
  --line: #d7dee7;
  --paper: #ffffff;
  --soft: #f5f7fa;
  --warn: #fff8e6;
  --good: #eefbf5;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--soft); color: var(--ink); line-height: 1.7; }
main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
header { background: linear-gradient(135deg, var(--accent), var(--secondary)); color: white; padding: 36px 0 42px; }
header .inner { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
h1 { margin: 0 0 10px; font-size: clamp(2rem, 5vw, 4.3rem); line-height: 1; letter-spacing: 0; }
h2 { margin: 0 0 16px; font-size: 1.35rem; letter-spacing: 0; }
h3 { margin: 0 0 10px; font-size: 1rem; letter-spacing: 0; }
p { margin: 0 0 14px; }
section { margin-top: 20px; padding: 22px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; }
nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
nav a { color: white; border: 1px solid rgba(255,255,255,.5); text-decoration: none; padding: 8px 10px; border-radius: 6px; font-weight: 700; }
nav a[aria-current="page"] { background: rgba(255,255,255,.22); }
ul, ol { margin: 0; padding-left: 1.2rem; }
li + li { margin-top: 6px; }
code, pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
pre { overflow-x: auto; padding: 14px; background: #111827; color: #e5e7eb; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; font-size: .95rem; }
th, td { border: 1px solid var(--line); padding: 10px; text-align: left; vertical-align: top; }
th { background: #eef2f7; }
.doc-id { opacity: .86; font-weight: 700; }
.lede { max-width: 760px; font-size: 1.08rem; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.box { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: #fff; }
.box strong { color: var(--accent); }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pills span { border: 1px solid var(--line); border-radius: 999px; padding: 6px 9px; background: #fff; font-weight: 700; color: var(--muted); }
.diagram { width: 100%; min-height: 220px; border: 1px solid var(--line); border-radius: 8px; background: #fbfcfe; }
.callout { background: var(--good); border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); }
.warn { background: var(--warn); }
.muted { color: var(--muted); }
.checklist li { list-style: none; margin-left: -1rem; }
.checklist li::before { content: "✓"; color: var(--accent); font-weight: 900; margin-right: 8px; }
@media (max-width: 760px) {
  main { width: min(100% - 24px, 1120px); padding-top: 18px; }
  header { padding: 26px 0 30px; }
  .grid, .two { grid-template-columns: 1fr; }
  section { padding: 18px; }
}`;
}

function flowSvg(project) {
  const labels = [
    "1. 対象入力",
    "2. 証拠整理",
    "3. API検証",
    "4. AI/ fallback",
    "5. 判断共有",
  ];
  const y = 72;
  const boxes = labels
    .map((label, index) => {
      const x = 28 + index * 206;
      const arrow =
        index < labels.length - 1
          ? `<path d="M${x + 160} ${y + 34} H${x + 198}" stroke="#52606d" stroke-width="3" marker-end="url(#arrow)" />`
          : "";
      return `${arrow}<rect x="${x}" y="${y}" width="160" height="68" rx="8" fill="#ffffff" stroke="${escapeHtml(project.accent)}" stroke-width="2" />
<text x="${x + 80}" y="${y + 32}" text-anchor="middle" font-size="15" font-weight="700" fill="#17202a">${escapeHtml(label)}</text>
<text x="${x + 80}" y="${y + 52}" text-anchor="middle" font-size="12" fill="#52606d">${escapeHtml(project.positive)} / ${escapeHtml(project.caution)} / ${escapeHtml(project.negative)}</text>`;
    })
    .join("\n");
  return `<svg class="diagram" role="img" aria-labelledby="flow-title flow-desc" viewBox="0 0 1080 230">
  <title id="flow-title">${escapeHtml(project.name)} 操作フロー</title>
  <desc id="flow-desc">入力、証拠整理、API検証、AI分析、人間の共有判断までの流れ。</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#52606d" />
    </marker>
  </defs>
  <rect width="1080" height="230" fill="#fbfcfe" />
  <text x="28" y="34" font-size="20" font-weight="800" fill="#17202a">運用判断を5ステップで再現する</text>
  ${boxes}
</svg>`;
}

function architectureSvg(project) {
  const accent = escapeHtml(project.accent);
  return `<svg class="diagram" role="img" aria-labelledby="arch-title arch-desc" viewBox="0 0 1080 300">
  <title id="arch-title">${escapeHtml(project.name)} アーキテクチャ図</title>
  <desc id="arch-desc">Vite UI、Express API、Gemini API、Cloud Run、ログとヘルスチェックの関係。</desc>
  <defs>
    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#52606d" />
    </marker>
  </defs>
  <rect width="1080" height="300" fill="#fbfcfe" />
  <rect x="32" y="88" width="176" height="88" rx="8" fill="#fff" stroke="${accent}" stroke-width="2" />
  <text x="120" y="124" text-anchor="middle" font-size="17" font-weight="800" fill="#17202a">Browser UI</text>
  <text x="120" y="150" text-anchor="middle" font-size="12" fill="#52606d">Vite dashboard</text>
  <path d="M210 132 H314" stroke="#52606d" stroke-width="3" marker-end="url(#arrow2)" />
  <rect x="320" y="54" width="230" height="156" rx="8" fill="#fff" stroke="${accent}" stroke-width="2" />
  <text x="435" y="92" text-anchor="middle" font-size="17" font-weight="800" fill="#17202a">Cloud Run Service</text>
  <text x="435" y="120" text-anchor="middle" font-size="12" fill="#52606d">Express API + static UI</text>
  <text x="435" y="146" text-anchor="middle" font-size="12" fill="#52606d">/api/health /ready /version</text>
  <text x="435" y="172" text-anchor="middle" font-size="12" fill="#52606d">Request ID + structured logs</text>
  <path d="M552 132 H658" stroke="#52606d" stroke-width="3" marker-end="url(#arrow2)" />
  <rect x="666" y="88" width="176" height="88" rx="8" fill="#fff" stroke="${accent}" stroke-width="2" />
  <text x="754" y="124" text-anchor="middle" font-size="17" font-weight="800" fill="#17202a">Gemini API</text>
  <text x="754" y="150" text-anchor="middle" font-size="12" fill="#52606d">structured JSON</text>
  <path d="M435 212 V250 H922" stroke="#52606d" stroke-width="3" marker-end="url(#arrow2)" fill="none" />
  <rect x="862" y="88" width="180" height="88" rx="8" fill="#fff" stroke="${accent}" stroke-width="2" />
  <text x="952" y="120" text-anchor="middle" font-size="17" font-weight="800" fill="#17202a">Local fallback</text>
  <text x="952" y="148" text-anchor="middle" font-size="12" fill="#52606d">demo-safe analysis</text>
  <text x="32" y="36" font-size="20" font-weight="800" fill="#17202a">本番MVPの実装境界</text>
</svg>`;
}

function manualHtml(project) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} 操作マニュアル</title>
  <style>${baseStyles(project)}</style>
</head>
<body>
  <header>
    <div class="inner">
      <h1>${escapeHtml(project.name)}</h1>
      <p class="lede">${escapeHtml(project.tagline)}</p>
      ${docsNav(project, "操作マニュアル")}
    </div>
  </header>
  <main>
    <section class="callout">
      <h2>このMVPで検証する仮説</h2>
      <p>${escapeHtml(project.role)}が、分散したDevOps証拠を短時間で読み、${escapeHtml(project.positive)} / ${escapeHtml(project.caution)} / ${escapeHtml(project.negative)} の判断と次アクションに変換できれば、リリース判断・障害初動・運用レビューの待ち時間を減らせる。</p>
      <div class="pills">${pillItems(project.focusAreas)}</div>
    </section>

    <section>
      <h2>操作フロー</h2>
      ${flowSvg(project)}
      <ol>
        <li><strong>対象</strong>にPR URL、障害名、Cloud Run revision、Runbook名などを入力します。</li>
        <li><strong>Context</strong>にサービス背景、制約、安定版revision、関係者を入力します。</li>
        <li><strong>Signals</strong>にCI、ログ、メトリクス、変更差分、問い合わせ内容を貼ります。</li>
        <li>判断モードを選び、必要なら Evidence Window と Operator Note を足します。</li>
        <li>分析結果の判断、根拠、リスク、コマンド、Runbook Patch、コメント案を確認します。</li>
      </ol>
    </section>

    <section>
      <h2>サンプル入力</h2>
      <table>
        <tbody>
          <tr><th>Target</th><td>${escapeHtml(project.sampleTarget)}</td></tr>
          <tr><th>Context</th><td>${escapeHtml(project.sampleContext)}</td></tr>
          <tr><th>Signals</th><td>${escapeHtml(project.sampleSignals)}</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>判断の読み方</h2>
      <div class="grid">
        <div class="box"><strong>${escapeHtml(project.positive)}</strong><p>証拠が十分で、通常フローで進められる状態です。</p></div>
        <div class="box"><strong>${escapeHtml(project.caution)}</strong><p>進められる可能性はあるが、オーナー確認や追加観測が必要な状態です。</p></div>
        <div class="box"><strong>${escapeHtml(project.negative)}</strong><p>停止、ロールバック、エスカレーションなど強い介入が必要な状態です。</p></div>
      </div>
    </section>

    <section>
      <h2>画面で確認する項目</h2>
      <ul class="checklist">
        <li>Confidence が判断に対して過信していないか</li>
        <li>Evidence の重みが貼り付けた実データと対応しているか</li>
        <li>Actions に owner と priority があり、次の担当者へ渡せるか</li>
        <li>Verification Commands が実行可能な粒度になっているか</li>
        <li>Comment Draft がPR、障害チャンネル、Runbookに貼れる文章か</li>
      </ul>
    </section>

    <section class="warn">
      <h2>運用上の注意</h2>
      <p>このMVPは人間の承認を前提にした判断支援です。Gemini APIが使えない場合は deterministic fallback で動作しますが、実データ連携や本番自動化を行う前に、対象サービスの権限、監査ログ、ロールバック手順を確認してください。</p>
    </section>
  </main>
</body>
</html>`;
}

function developmentHtml(project) {
  const sourceRows = researchSources
    .map(
      (source) =>
        `<tr><td><a href="${source.url}">${escapeHtml(source.label)}</a></td><td>${escapeHtml(source.takeaway)}</td></tr>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} 開発ガイド</title>
  <style>${baseStyles(project)}</style>
</head>
<body>
  <header>
    <div class="inner">
      <h1>${escapeHtml(project.name)} 開発ガイド</h1>
      <p class="lede">${escapeHtml(project.overview)}</p>
      ${docsNav(project, "開発ガイド")}
    </div>
  </header>
  <main>
    <section>
      <h2>アーキテクチャ</h2>
      ${architectureSvg(project)}
      <div class="grid two">
        <div class="box"><strong>Frontend</strong><p>Vite + TypeScript。シナリオ選択、入力、結果履歴、copy/exportを担当します。</p></div>
        <div class="box"><strong>Backend</strong><p>Express API。Zod入力検証、Gemini呼び出し、fallback、ヘルスチェックを担当します。</p></div>
        <div class="box"><strong>AI contract</strong><p>decision、confidence、risks、actions、evidence、automationPlan、commentDraftをJSONで返します。</p></div>
        <div class="box"><strong>Runtime</strong><p>Cloud Run想定。PORT、Secret Manager、構造化ログ、request IDを使います。</p></div>
      </div>
    </section>

    <section>
      <h2>ローカル開発</h2>
      <pre><code>npm install
cp .env.example .env
npm run dev</code></pre>
      <p>Viteが表示するURLを開きます。APIは <code>/api</code> でExpressへプロキシされます。</p>
    </section>

    <section>
      <h2>検証コマンド</h2>
      <pre><code>npm run typecheck
npm run test
npm run build
npm run verify</code></pre>
      <p><code>npm run verify</code> はTypeScript、Vitest、client build、server buildをまとめて実行します。</p>
    </section>

    <section>
      <h2>API</h2>
      <table>
        <thead><tr><th>Endpoint</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>GET /api/health</code></td><td>起動確認。Cloud RunのHTTP health checkに使えます。</td></tr>
          <tr><td><code>GET /api/ready</code></td><td>静的UI配信とfallback可用性を含むreadiness確認。</td></tr>
          <tr><td><code>GET /api/version</code></td><td>serviceVersion、Node.js、model、project metadataを返します。</td></tr>
          <tr><td><code>GET /api/project</code></td><td>UIが使うプロジェクト設定を返します。</td></tr>
          <tr><td><code>POST /api/analyze</code></td><td>運用証拠を構造化判断JSONへ変換します。</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>本番MVPチェック</h2>
      <ul class="checklist">
        <li>Security headers、CSP、no-store API cache、JSON error formatを実装済み</li>
        <li>X-Request-Id と構造化ログで障害調査の起点を残す</li>
        <li>GEMINI_API_KEY はSecret Managerで渡し、リポジトリに置かない</li>
        <li>Dockerfileはmulti-stage build、runtime devDependencies除外、non-rootユーザー実行</li>
        <li>CORS_ORIGIN、JSON_BODY_LIMIT、SERVICE_VERSIONを環境ごとに調整可能</li>
      </ul>
    </section>

    <section>
      <h2>仮説検証メモ</h2>
      <table>
        <tbody>
          <tr><th>Problem hypothesis</th><td>${escapeHtml(project.role)}の判断材料が散らばり、初動の品質が担当者依存になる。</td></tr>
          <tr><th>MVP experiment</th><td>${escapeHtml(project.mvp)}</td></tr>
          <tr><th>Success metrics</th><td>${escapeHtml(project.metrics.join(", "))}</td></tr>
          <tr><th>Learn / pivot</th><td>実ユーザーが判断文、検証コマンド、コメント案をそのまま使えるかを観察し、外部API連携の優先順位を決める。</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Web調査からの基準</h2>
      <table>
        <thead><tr><th>Source</th><th>MVPへの反映</th></tr></thead>
        <tbody>${sourceRows}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function updatePackageJson(projectDir) {
  const packagePath = join(outputsDir, projectDir, "package.json");
  const data = JSON.parse(readFileSync(packagePath, "utf8"));
  data.dependencies = {
    ...data.dependencies,
    ...latestVersions.dependencies,
  };
  data.devDependencies = {
    ...data.devDependencies,
    ...latestVersions.devDependencies,
  };
  writeText(packagePath, `${JSON.stringify(data, null, 2)}\n`);
}

function updateReadme(projectDir, project) {
  const readmePath = join(outputsDir, projectDir, "README.md");
  let readme = readFileSync(readmePath, "utf8");
  readme = readme.replace(
    /## HTMLマニュアルと開発ドキュメント[\s\S]*?(?=\n## |\n?$)/,
    "",
  );
  const section = `\n## HTMLマニュアルと開発ドキュメント\n\n- [操作マニュアル](./docs/manual.html): ${project.name} の仮説、操作手順、判断の読み方、デモ確認項目をHTML図解で確認できます。\n- [開発ガイド](./docs/development.html): アーキテクチャ、API、検証コマンド、本番MVPチェック、Web調査に基づく基準をHTML図解で確認できます。\n`;
  const marker = "\n## リポジトリ構成\n";
  if (readme.includes(marker)) {
    readme = readme.replace(marker, `${section}${marker}`);
  } else {
    readme += section;
  }
  writeText(readmePath, readme);
}

function writeProjectGitignore(projectDir) {
  writeText(
    join(outputsDir, projectDir, ".gitignore"),
    `node_modules/
dist/
.env
.env.*
!.env.example
.DS_Store
npm-debug.log*
coverage/
.vite/
`,
  );
}

function updateManifest() {
  const manifestPath = join(outputsDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.packageVersions = latestVersions;
  manifest.githubReadiness = {
    generatedAt: "2026-05-22",
    includesHtmlManuals: true,
    includesDeveloperGuides: true,
    includesProjectGitignore: true,
    excludesGeneratedDependencies: true,
  };
  for (const project of manifest.projects) {
    project.docs = {
      manual: `${project.path}/docs/manual.html`,
      development: `${project.path}/docs/development.html`,
      environment: `${project.path}/docs/environment.md`,
    };
  }
  writeText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeTopLevelDocs() {
  const rows = projectDirs
    .map((dir) => {
      const project = parseProject(join(outputsDir, dir, "src/project.ts"));
      return `| ${project.rank} | ${project.name} | [README](./${dir}/README.md) | [Manual](./${dir}/docs/manual.html) | [Developer Guide](./${dir}/docs/development.html) | [Environment](./${dir}/docs/environment.md) |`;
    })
    .join("\n");

  const sources = researchSources
    .map((source) => `- [${source.label}](${source.url}): ${source.takeaway}`)
    .join("\n");

  writeText(
    join(outputsDir, "WEB_RESEARCH_MVP_REQUIREMENTS.md"),
    `# Web Research MVP Requirements

Date: 2026-05-22

## Researched Baseline

${sources}

## Applied Gate

| Requirement | Local evidence |
| --- | --- |
| Startup hypothesis validation | Every project now has an HTML manual and developer guide section for problem hypothesis, MVP experiment, success metrics, and learn/pivot decision. |
| GitHub-ready README | Every project README explains what it does, why it matters, setup, build, deploy, environment, demo flow, production guarantees, and links to HTML docs. |
| Production web/API baseline | Every server includes health/readiness/version endpoints, request IDs, structured logs, security headers, no-store API cache, JSON error format, Zod validation, and deterministic fallback. |
| Cloud Run deployability | Every project includes Dockerfile, .dockerignore, PORT-aware Express server, and Cloud Run deploy command. |
| Security baseline | API input is bounded and validated; generated docs call out Secret Manager, CORS, service identity, non-root runtime, and no committed secrets. |
| Developer verification | Every project exposes npm run typecheck, test, build, and verify. |
| HTML diagram documentation | Every project includes docs/manual.html and docs/development.html with SVG diagrams and Japanese explanatory text. |

## Project Documentation Matrix

| Rank | Project | README | Manual | Developer Guide | Environment |
| ---: | --- | --- | --- | --- | --- |
${rows}
`,
  );

  const indexPath = join(outputsDir, "README.md");
  let index = readFileSync(indexPath, "utf8");
  index = index.replace(
    /## HTMLマニュアル \/ 開発ドキュメント[\s\S]*?(?=\n## |\n?$)/,
    "",
  );
  const section = `\n## HTMLマニュアル / 開発ドキュメント\n\n全20プロジェクトに、GitHub公開前に読めるHTML図解ドキュメントを追加しました。各READMEからも辿れます。\n\n- [Web調査に基づくMVP要件](./WEB_RESEARCH_MVP_REQUIREMENTS.md)\n- 各プロジェクト: \`docs/manual.html\` と \`docs/development.html\`\n`;
  index += section;
  writeText(indexPath, index);
}

for (const dir of projectDirs) {
  const project = parseProject(join(outputsDir, dir, "src/project.ts"));
  mkdirSync(join(outputsDir, dir, "docs"), { recursive: true });
  writeText(join(outputsDir, dir, "docs/manual.html"), manualHtml(project));
  writeText(join(outputsDir, dir, "docs/development.html"), developmentHtml(project));
  writeProjectGitignore(dir);
  updatePackageJson(dir);
  updateReadme(dir, project);
}

updateManifest();
writeTopLevelDocs();
