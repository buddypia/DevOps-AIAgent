import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputsDir = join(root, "outputs");
const templateDir = join(root, "scripts", "templates");
const projectDirs = readdirSync(outputsDir)
  .filter((entry) => /^\d{2}-/.test(entry))
  .sort();

const vitestVersion = "4.1.6";

function writeText(path, text) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text.replace(/\n+$/, "\n"), "utf8");
}

function updatePackageJson(projectDir) {
  const path = join(projectDir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.scripts = {
    ...pkg.scripts,
    test: "vitest run",
    verify: "npm run typecheck && npm run test && npm run build",
  };
  pkg.devDependencies = {
    ...pkg.devDependencies,
    vitest: vitestVersion,
  };
  writeText(path, JSON.stringify(pkg, null, 2));
}

function appendReadmeUpgrade(projectDir) {
  const path = join(projectDir, "README.md");
  const text = readFileSync(path, "utf8");
  if (text.includes("## すぐ使えるMVPとして追加した機能")) return;
  const insert = `## すぐ使えるMVPとして追加した機能

- Baseline / Watch / Critical の3つのサンプルシナリオを選べます。
- Conservative / Balanced / Aggressive の判断ポリシーを切り替えられます。
- Evidence Window と Operator Note を入力でき、発表デモだけでなく実運用の文脈も渡せます。
- 分析結果はブラウザ履歴に保存され、過去判断を再読み込みできます。
- Comment Draft、Markdownレポート、JSONをコピーまたはエクスポートできます。
- Verification Commands、Handoff Checklist、Runbook Patch を出力し、判断後の実行に移りやすくしています。
- \`npm run test\` と \`npm run verify\` を追加し、エージェント契約を回帰テストできます。

`;
  writeText(path, text.replace("## リポジトリ構成", `${insert}## リポジトリ構成`));
}

function updateRootPackageVersions() {
  const path = join(outputsDir, "PACKAGE_VERSIONS.md");
  let text = readFileSync(path, "utf8");
  if (!text.includes("| `vitest` |")) {
    text = text.replace("| `vite` | `8.0.12` |", "| `vite` | `8.0.12` |\n| `vitest` | `4.1.6` |");
  }
  writeText(path, text);
}

function reflectionDoc() {
  return `# MVP Upgrade Reflection

Date: 2026-05-14

## 反省

前回の20個のプロジェクトは、Cloud Runで動くUI/API/Gemini連携の形にはなっていました。しかし、正直に見ると「審査で見せられる最低限の箱」に寄っていて、現場でそのまま触るMVPとしては薄い部分がありました。

不足していた点は次の通りです。

- サンプル入力が1種類だけで、正常系・警戒系・危険系の比較デモができない。
- 判断ポリシーを変えられず、保守的に見る場面と積極的に進める場面を表現できない。
- 結果をコピー、レポート化、JSON保存できず、判断後の共有に移りにくい。
- 履歴がなく、前回判断との比較や再読み込みができない。
- AI出力がコメント案中心で、検証コマンド、引き継ぎ、Runbook更新まで踏み込めていない。
- テストがなく、20個のエージェント契約が壊れても検知しにくい。

## 今回の改善方針

今回は「触れる」「残せる」「共有できる」「検証できる」をMVPの合格ラインにしました。20個すべてに同じ改善を入れ、さらに各プロジェクトの判断ラベル、メトリクス、フォーカス領域、サンプル入力は個別設定から反映されるようにしています。

## 追加した内容

- Baseline / Watch / Critical の3シナリオ
- Conservative / Balanced / Aggressive の判断モード
- Evidence Window と Operator Note
- localStorageによる判断履歴
- Comment Draft コピー
- Markdownレポートコピー
- JSONエクスポート
- Verification Commands
- Handoff Checklist
- Runbook Patch
- Vitestによるエージェント契約テスト
- \`npm run verify\` による typecheck + test + build の一括検証

## 今後の本格化ポイント

次に時間を使うなら、GitHub API、Cloud Logging、Cloud Monitoring、BigQuery、Secret Managerへ実接続する段階です。今回のMVPは、その実接続を受け止めるUI、API、出力契約、テストの土台として整えています。
`;
}

function auditDoc() {
  return `# MVP Upgrade Audit

Date: 2026-05-14

## Objective

Reflect on whether the existing 20 projects were temporary or rushed, then improve them into fuller immediately usable MVPs.

## Prompt-To-Artifact Checklist

| Requirement | Evidence |
| --- | --- |
| Reflect honestly on rushed or temporary parts | \`outputs/MVP_UPGRADE_REFLECTION.md\` lists the weak points of the previous MVP. |
| Improve all 20 projects, not just one | \`outputs/01-*\` through \`outputs/20-*\` all receive the upgraded \`src/main.ts\`, \`src/agent.ts\`, \`src/styles.css\`, and \`src/agent.test.ts\`. |
| Make the MVP more immediately usable | Each app now has 3 scenarios, decision modes, evidence window, operator note, history, copy/export, verification commands, handoff checklist, and runbook patch output. |
| Add validation and regression checks | Each project has \`npm run test\` and \`npm run verify\`; \`src/agent.test.ts\` checks validation and fallback output contract. |
| Preserve project-specific identity | Each app still imports \`src/project.ts\` for name, rank, idea number, role, focus areas, metrics, decisions, samples, and stack. |
| Update documentation | Each project README includes \`## すぐ使えるMVPとして追加した機能\`. |

## Verification Commands

\`\`\`bash
find outputs -mindepth 2 -maxdepth 2 -name agent.test.ts | wc -l
find outputs -mindepth 2 -maxdepth 2 -name README.md | wc -l
node -e 'const fs=require("fs"); const dirs=fs.readdirSync("outputs").filter(x=>/^\\\\d{2}-/.test(x)); const bad=[]; for (const d of dirs) { const p=JSON.parse(fs.readFileSync("outputs/"+d+"/package.json","utf8")); if (!p.scripts.test || !p.scripts.verify || !p.devDependencies.vitest) bad.push(d); } console.log(bad.length?bad.join("\\\\n"):"all projects have test/verify/vitest");'
\`\`\`
`;
}

for (const dir of projectDirs) {
  const projectDir = join(outputsDir, dir);
  copyFileSync(join(templateDir, "mvp-agent.ts"), join(projectDir, "src", "agent.ts"));
  copyFileSync(join(templateDir, "mvp-main.ts"), join(projectDir, "src", "main.ts"));
  copyFileSync(join(templateDir, "mvp-styles.css"), join(projectDir, "src", "styles.css"));
  copyFileSync(join(templateDir, "mvp-agent.test.ts"), join(projectDir, "src", "agent.test.ts"));
  updatePackageJson(projectDir);
  appendReadmeUpgrade(projectDir);
}

updateRootPackageVersions();
writeText(join(outputsDir, "MVP_UPGRADE_REFLECTION.md"), reflectionDoc());
writeText(join(outputsDir, "MVP_UPGRADE_AUDIT.md"), auditDoc());

console.log(`Hardened ${projectDirs.length} MVP projects`);
