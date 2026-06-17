# brief2dev エコシステム移行記録

`.tmp/ecosystem-extract`（brief2dev の `sample-web-app` から抽出されたエコシステム、622 ファイル / うち 564 ファイルが韓国語）から、本プロジェクト（**a2a-agent-marketplace** — Vite + React + Express + npm + TypeScript）に**コア統治セットを厳選し、日本語化・スタック適応して移行**した記録。

移行プロトコルは `.tmp/ecosystem-extract/sample-web-app/.claude/rules/common/oss-transplant-protocol.md`（R-CM-015 = ユーザーが言及した「TRANSPLANT-GUIDE」に該当）に準拠:

- **Source READ-ONLY**: `.tmp/ecosystem-extract` の原本は一切改変していない。
- **Native Adaptation**: コピペではなく、本プロジェクトの規約（npm / Vite / Express）に合わせて変換。
- **ユーザー決定**: 移行範囲・スタック適応・配置場所はユーザーの明示的決定に基づく（コア統治セットを厳選 / このスタックに適応 / 直下 `.claude/` に即有効化）。

---

## 1. 移行したもの（IN）

### 1.1 ルール（`.claude/rules/`、17 ファイル、日本語化済み）

| カテゴリ | ファイル | ID | 重要度 |
|---------|---------|----|--------|
| common | coding-style.md | R-CM-001 | critical |
| common | testing.md | R-CM-002 | critical |
| common | security.md | R-CM-003 | critical |
| common | performance.md | R-CM-004 | major |
| common | patterns.md | R-CM-005 | major |
| common | git-workflow.md | R-CM-008 | critical |
| common | command-portability.md | R-CM-009 | critical |
| common | verification-before-completion.md | R-CM-010 | critical |
| common | testing-anti-patterns.md | R-CM-011 | critical |
| common | multi-perspective-review.md | R-CM-012 | major |
| common | anti-sycophancy.md | R-CM-016 | major |
| common | gstack-native-patterns.md (プロセスパターン) | R-CM-017 | major |
| typescript | coding-style.md | R-TS-001 | critical |
| typescript | testing.md | R-TS-002 | critical |
| typescript | patterns.md | R-TS-003 | major |
| typescript | security.md | R-TS-004 | critical |
| typescript | hooks.md (React) | R-TS-005 | major |

一覧・メタデータは `.claude/rules/MANIFEST.json`。

### 1.2 フック（`.claude/hooks/`、4 ファイル、`.claude/settings.json` で配線済み）

| フック | イベント | 動作 | 依存 lib |
|--------|---------|------|---------|
| `secret-leak-guard` | PreToolUse Edit/Write | シークレット検出で **deny** | utils, hook-output, secret-patterns |
| `destructive-git-guard` | PreToolUse Bash | 破壊的 git で **deny** | utils, hook-output |
| `prompt-injection-guard` | PostToolUse Read | 注入パターンを **警告**(非ブロック) | utils, hook-output, prompt-injection-patterns |
| `edit-error-recovery` | PostToolUse Edit | Edit 失敗時に復旧ガイダンス注入 | utils, hook-output |

全フックは `safeHookMain` による **fail-open**（エラー時は素通りで開発を妨げない）。

### 1.3 ライブラリ（`.claude/scripts/lib/`、4 ファイル）

- `hook-output.mjs` — Hook 出力標準化（純粋、無依存）
- `utils.mjs` — stdin/stdout/git ヘルパー（**適応**: `hook-flags.mjs` 依存を除去、後述）
- `secret-patterns.mjs` — シークレット検出パターン（純粋、無依存）
- `prompt-injection-patterns.mjs` — 注入検出（**適応**: `learnings.mjs` 依存をスタブ化、後述）

### 1.4 設定・統合

- `project-config.json`（ルート）— パス・命令の SSOT（本プロジェクト実態に合わせて新規作成）
- `Makefile`（ルート）— `make q.check`（typecheck + test）等、npm 向けに適応
- `AGENTS.md`（ルート）— 既存ハッカソン内容を保全しつつ「AI 統治ルール」セクションを追記。`CLAUDE.md`（`@AGENTS.md`）経由で読み込まれる。

---

## 2. スタック適応（Native Adaptation）

| 元（brief2dev / Next.js / pnpm） | 適応後（本プロジェクト） |
|--------------------------------|------------------------|
| `pnpm install/dev/test/build/lint/typecheck` | `npm install` / `npm run dev` / `npm test` / `npm run build` / (lint なし) / `npm run typecheck` |
| Next.js 15 App Router, `src/app/`, `next/image`, `next.config.ts` | Vite + React, `src/`, 一般的な画像最適化, `vite.config.ts` |
| `utils.mjs` が `hook-flags.mjs`→`hook-registry.mjs`（47 フック全体）を import | profile ゲーティングを除去。`safeHookMainWithProfile` は `safeHookMain` 相当に。依存閉包を 4 lib に縮小 |
| `prompt-injection-patterns.mjs` が `learnings.mjs`（動的学習パターン）を import | 学習ストア未移行のためローカルスタブ（空配列）化。静的検出は維持 |
| ルールの `## Enforced by:` が未配備フックを参照 | 配備 4 フック以外には「（本プロジェクトでは未配備 — prompt-level）」を付記し正直化 |

---

## 3. 移行しなかったもの（OUT）と理由

| 除外対象 | 理由 |
|---------|------|
| `commit-guard` フック | 全コミットを `/create-pr` スキル経由に強制し、create-pr/worktree 基盤に依存。ハッカソンの main 中心フローを阻害するため除外（git 安全性は `destructive-git-guard` で確保） |
| `completion-evidence-guard` フック | `governance-events.jsonl`（未移行の post-tool-verifier が生成）に依存し Stop をブロック。本セッションの goal フックと競合・摩擦が大きいため除外（R-CM-010 は prompt-level で適用） |
| `post-edit-typecheck` フック | TS 編集のたびに tsc 実行で重い・ノイズが多いため除外 |
| `tool-error-recovery` フック | `process.stderr.write` を直接使い「hook error」ノイズになる設計のため除外 |
| brief2dev 内部統治ルール（governance-handoff / rule-enforcement-honesty / deer-flow-native-patterns / schema-design-convention / hook-naming / hooks.md / learnings-protocol / skill-doc-hygiene / skill-authoring-discipline / oss-ported-patterns / agents.md / pipeline/*） | brief2dev 生成器自身のメタ開発・監査専用。消費プロジェクトでは無意味/デッド |
| 96 スキル（`.claude/skills/`） | skill ルーティング基盤（keyword-router 等）に依存し、本プロジェクトでは半デッド。必要に応じ後述の手順で個別移行可能 |
| 11 エージェント（go/rust/cpp/java/kotlin/flutter reviewer 等） | 本プロジェクトは TypeScript のみ。対象言語のレビュアーは不要 |
| brief2dev ビジネス決定システム（project-brief.json / decision-dashboard / 8-stage pipeline / continuous-discovery） | 生成器固有のプロダクト探索機構。本プロジェクトのスコープ外 |

---

## 4. 追加で移行したい場合

`.tmp/ecosystem-extract/sample-web-app/.claude/` に全資産が残っている。個別に追加移行する手順:

1. 対象ファイルを READ（原本は編集しない）。
2. 依存（import 連鎖）を確認し、未移行の lib/hook があれば併せて検討。
3. 韓国語/英語を日本語化し、スタック参照（pnpm/Next.js）を npm/Vite に適応。
4. フックなら `.claude/settings.json` に配線し、`node --check` + サンプル stdin で fail-open 動作を検証。
5. `## Enforced by:` の正直化（未配備フックには注記）。

---

## 5. 検証

移行物は同一作業内で検証済み:

- 4 lib + 4 hook: `node --check` 全通過。
- 各フック: サンプル stdin で deny/passthrough/context の期待動作を確認（secret 検出、破壊的 git ブロック、注入警告、Edit 失敗回復、`.env.example` 除外、`git reset --soft` 許可例外など）。
- `settings.json`: 妥当な JSON。
- ルール 17 ファイル: 韓国語残存ゼロを grep で確認。
