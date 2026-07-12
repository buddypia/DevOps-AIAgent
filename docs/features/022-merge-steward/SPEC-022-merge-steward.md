# 022-merge-steward: Merge Steward

> **状態**: UI承認待ち | **優先度**: P0 | **更新日**: 2026-07-12
> **SPECバージョン**: v1.0 | **機能タイプ**: UI / GitHub lifecycle / Gemini checker

## 0. AI実装契約

### 0.0 Project Context

Vite + React + TypeScriptのUI、ExpressのAPI、Zodの入力契約、既存Gemini maker/checkerを再利用する。GitHub REST APIへの書き込みはサーバー内に閉じ、deterministic gateが最終的なマージ可否を所有する。新規DB・新規SDKは追加しない。

#### 0.0.1 Naming / Glossary

| 用語 | 定義 | コード表現 |
|---|---|---|
| Merge Steward | Issue化、既存PR評価、条件付きマージを担うエージェント | `merge-steward` |
| Evaluation receipt | PR評価時のhead SHA、ゲート結果、時刻を固定した証拠 | `MergeEvaluationReceipt` |
| Risk path | 自動マージを禁止する変更パス | `HIGH_RISK_PATH_PATTERNS` |
| READY | deterministic gateをすべて通過した状態 | `ready` |
| HUMAN REVIEW | 人間承認なしに進めない状態 | `human_review` |
| BLOCKED | CI、競合、取得失敗等によりマージ不可 | `blocked` |

### 0.1 Target Files

| レイヤー | 範囲 | 作業 | 備考 |
|---|---|:---:|---|
| Type/Domain | `server/mergeSteward.ts` | 🆕 | Zod schema、GitHub gateway、安全ゲート |
| API Route | `server/index.ts` | 🔄 | preview/create/evaluate/merge endpoints |
| Agent Job | `server/agentJobs.ts` | 🔄 | maker/checker用のread-only評価job |
| Market | `src/market.ts` | 🔄 | Merge Stewardカード |
| UI | `src/MergeStewardPanel.tsx` | 🆕 | Issue/PR lifecycle panel |
| UI wiring | `src/AppHome.tsx`, `src/styles.css` | 🔄 | 既存画面への配置・既存tokenによる表示 |
| Asset | `public/assets/agents/merge-steward.png` | 🆕 | 1024px正方形ポートレート |
| Config | `.env.example` | 🔄 | token/repositoryの説明のみ、値なし |
| Test | `tests/mergeSteward.test.ts`, `tests/market.test.ts`, `tests/agentJobs.test.ts` | 🆕/🔄 | gate、API契約、カタログ |
| Docs | `docs/features/022-merge-steward/**`, `docs/02_architecture/a2a-marketplace.md` | 🆕/🔄 | 仕様・実行スキルの同期 |

#### 0.1.1 Traceability Matrix

| FR | 主実装 | テスト |
|---|---|---|
| FR-02201 | `server/mergeSteward.ts`, `server/index.ts` | issue preview/create、重複、token不足 |
| FR-02202 | `server/mergeSteward.ts` | PR/files/checks/reviews取得 |
| FR-02203 | `server/mergeSteward.ts`, `server/agentJobs.ts` | 全gate分岐、maker/checker evidence |
| FR-02204 | `server/mergeSteward.ts`, `server/index.ts` | non-READY非呼出し、SHA差分、成功merge |
| FR-02205 | `src/market.ts`, `src/MergeStewardPanel.tsx` | market契約、build、UI目視 |

### 0.2 Core State / Architecture / State Transitions

| 状態 | 型 | 初期値 | 用途 |
|---|---|---|---|
| `mode` | `issue | pull` | `issue` | 操作領域 |
| `status` | `idle | loading | preview | data | partial | error` | `idle` | UI状態 |
| `issueDraft` | title/body/evidence/acceptance | 空 | Issue入力 |
| `pullNumber` | positive integer | null | 対象PR |
| `evaluation` | `MergeEvaluationReceipt | null` | null | 判定receipt |
| `confirmation` | `none | issue | merge` | `none` | 書き込み前確認 |
| `error` | safe message | null | 復旧可能な失敗 |

**遷移**:

```text
idle → loading → preview → confirmation → loading → data/error
idle → loading → data/partial/error (PR evaluation)
data(READY) → confirmation → loading → merged/error
data(HUMAN REVIEW/BLOCKED) ─X→ merge
```

**境界**: UIはtokenを知らない。RouteはZod検証とrate limitを担当する。`mergeSteward.ts` はGitHub通信とpure gateを分離する。GitHubのレスポンスは必要フィールドだけへ正規化し、ログへbody/tokenを出さない。

### 0.3 Error Handling / Error & Rescue Map

| Method/Path | Failure | Rescued | Test | User sees |
|---|---|:---:|:---:|---|
| Issue preview | 入力不正 | Y | Y | 対象フィールドと修正方法 |
| POST issues | token未設定/403/410/422 | Y | Y | Issueを作成できない理由と設定確認 |
| PR evaluate | 404/timeout/rate limit/partial evidence | Y | Y | BLOCKEDまたはPARTIAL、再試行 |
| PR merge | non-READY | Y | Y | gate阻害条件、API非呼出し |
| PR merge | head SHA変化 | Y | Y | 再評価が必要 |
| PR merge | 403/405/409/422 | Y | Y | GitHub保護条件により停止 |

Silent failureは許可しない。外部APIの一部取得だけ失敗した場合もREADYにせず、`partial` + `blocked` とする。

### 0.4 Data Schema

```ts
type MergeVerdict = "ready" | "human_review" | "blocked";

interface MergeEvaluationReceipt {
  repository: string;
  pullNumber: number;
  headSha: string;
  evaluatedAt: string;
  verdict: MergeVerdict;
  checks: { total: number; successful: number; pending: number; failed: number };
  approvals: number;
  mergeable: boolean | null;
  highRiskFiles: string[];
  blockers: string[];
  evidence: string[];
  receipt: string;
}
```

入力・GitHub応答の境界はZodで検証する。DB schemaはN/A。receiptはcanonical JSONのSHA-256で生成し、tokenやIssue本文全文を含めない。

### 0.5 API Contract

| Method | Path | Auth | Request | Success |
|---|---|---|---|---|
| POST | `/api/merge-steward/issues/preview` | 既存API境界 | title 1-160、problem/evidence/acceptance各上限 | draft body、duplicate query、writeなし |
| POST | `/api/merge-steward/issues` | 既存API境界 + server token | preview payload、`confirm:true` | issue number/url、receipt |
| POST | `/api/merge-steward/pulls/evaluate` | 既存API境界 | pullNumber | normalized evidence、verdict、receipt |
| POST | `/api/merge-steward/pulls/merge` | 既存API境界 + server token | pullNumber、headSha、receipt、`confirm:true` | merged、merge SHA、url |

共通エラーは `{ ok:false, error:{ code, message, retryable } }`。400入力不正、401/403設定/権限、404対象なし、409 SHA/状態競合、422 GitHub拒否、429 rate limit、502外部API不正、503未設定/一時障害。

### 0.6 NFR

- GitHub fetchは6秒timeout、最大ページ件数を制限する。
- 書き込みは10分あたり5回、mergeは10分あたり2回を上限にする。
- Issue createにはclient-generated idempotency markerを本文へ含め、実行前にopen issueを検索する。
- token値はレスポンス、receipt、ログ、Gemini promptに含めない。
- evaluationは同じPR/head SHAで再生成可能なdeterministic verdictを返す。
- UIはキーボード操作、focus-visible、reduced-motion、モバイル1列を維持する。

### 0.7 AI Logic & Prompts

makerは正規化済みのPR証拠のみから変更リスクと説明文を作る。checkerは独立して根拠不足、自己承認、保護条件迂回を反証する。AIの出力がREADYでもdeterministic gateが拒否すれば最終verdictは拒否側を採用する。Gemini未設定時もdeterministic verdictは利用可能。

### 0.8 Safety & Guardrails

- 自動マージ禁止: `.github/workflows/**`, `infra/**`, `**/*auth*`, `**/*secret*`, `**/migrations/**`, lockfileを含む依存更新。
- 競合、draft、mergeable=false/null、失敗/保留check、approvals不足、変更ファイル取得失敗はREADY不可。
- merge APIには評価時head SHAを渡し、直前再取得結果と一致させる。
- GitHub APIの保護拒否を再試行で迂回しない。
- same actorのmaker/checker結果だけでreview approvalを代替しない。
- 任意repository入力は受けず、`OPS_GITHUB_REPO` allowlistの1リポジトリに限定する。

### 0.9 Design Tokens

`src/styles.css` のAmber CircuitをSSOTとする。`--panel`, `--panel-2`, `--line`, `--ink`, `--muted`, `--accent`, `--green`, `--amber`, `--red`, `--radius`, `--mono`だけを使用し、新規カラーtokenを追加しない。

### 0.10 FR Dependency Graph

```text
FR-02201 Issue lifecycle ─┐
FR-02202 PR evidence ─────┼→ FR-02203 deterministic + AI review → FR-02204 guarded merge
FR-02205 market/UI ───────┘                                  └→ integration verification
```

### 0.11 Parallel Work Units

| Unit | 対象 | 依存 |
|---|---|---|
| Foundation | schema、pure gate、GitHub normalizer | なし |
| Backend | endpoints、rate limit、agent job | Foundation |
| Frontend | market card、panel、states | API schema |
| Test | gate matrix、API negative paths、market | Foundation/Backend |
| Integration | wiring、build、architecture、UI目視 | 全Unit |

## 1. Overview

### 1.1 Goal

運用問題をGitHub Issueへ固定し、既存PRを根拠付きで評価して、GitHubの保護条件を満たす低リスク変更だけを安全にマージする。

### 1.4 Goals / Non-Goals

**Goals**: Issue preview/create、PR evidence取得、READY/HUMAN REVIEW/BLOCKED評価、明示確認付きsquash merge、市場カード、監査receipt。

**Non-Goals**: コード生成、ブランチ/PR作成、branch protection変更、高リスクPRの自動マージ、複数repository、fork/merge queue。

### 1.5 UI Flow Contract

Agent Guildホームの専用パネル内で `[Issue化]` と `[PR評価]` を切り替える。Issueはpreviewを必須とし、PRは評価receiptがREADYのときだけマージ確認を表示する。画面遷移なしの単一パネルとし、詳細は [screens/merge-steward.md](screens/merge-steward.md) を参照する。

## 2. Functional Requirements

| FR | 名称 | 要件 | 主要ルール |
|---|---|---|---|
| FR-02201 | Issue lifecycle | 問題、証拠、受入条件からpreviewを作り、明示確認後に重複なくIssueを作る | token不足/duplicate/API失敗を安全表示 |
| FR-02202 | PR evidence | PR metadata、files、checks、reviews、mergeability、head SHAを取得・正規化する | 1つでも必須証拠欠落ならREADY不可 |
| FR-02203 | Independent evaluation | pure gateとmaker/checkerで判定・説明・receiptを返す | deterministic gateが最終SSOT |
| FR-02204 | Guarded merge | READY、confirm、同一SHA、同一receiptの場合だけsquash mergeする | non-READYではmerge APIを呼ばない |
| FR-02205 | Market/UI | 市場カード、専用画像、全UI状態、実行結果を表示する | 既存Amber Circuit、responsive、a11y |

### BDD Acceptance Criteria

BRIEF AC-01〜AC-06を同一IDで継承する。各ACは §0.1.1 のテストへ追跡し、negative pathを最低1件含める。

### Exception Flows / Business Rules

1. Issue書き込みはpreviewなし、`confirm !== true`、duplicate検出時に実行しない。
2. PR evidenceのpartial responseは画面表示できるが最終verdictはBLOCKED。
3. high-risk fileはHUMAN REVIEW。CI失敗、競合、draft、SHA不一致はBLOCKED。
4. GitHub review approvalはAI checkerとは別物であり、必要数を満たすまでREADYにしない。
5. merge成功後はreceiptとGitHub URLを表示し、同じreceiptの再実行を拒否する。

## 3. Dependencies & Risks

| 依存 | verified | verification source / date | リスク・対策 |
|---|:---:|---|---|
| GitHub Issues REST API | yes | GitHub Docs / 2026-07-12 | Issues: write、410/422、secondary rate limit |
| GitHub Pull Requests REST API | yes | GitHub Docs / 2026-07-12 | Contents: write、SHA 409、merge 405/422 |
| Protected branches / required checks | yes | GitHub Docs / 2026-07-12 | 保護条件を迂回せずGitHub拒否を最終停止として扱う |
| Gemini maker/checker | yes | `server/opsAgent.ts` | 未設定時はpure gateのみ、AIはmerge権限を持たない |

## 4. Screen Docs

- [Merge Steward Panel](screens/merge-steward.md)
- [UI Approval Wireframe](../../wireframes/feature-022-merge-steward-wireframe.md)

## 5. Verification & Tests

| 検証 | コマンド | 必須結果 |
|---|---|---|
| Unit/contract | `npm test -- --run tests/mergeSteward.test.ts tests/market.test.ts tests/agentJobs.test.ts` | 全pass |
| Type + all tests | `make q.check` | exit 0 |
| Architecture | `make q.check-architecture` | PASS |
| Production build | `npm run build` | exit 0、asset存在 |
| Diff | `git diff --check` | 出力なし |
| UI | 対象パネルでidle/loading/empty/error/partial/success/confirmation | 承認wireframeと一致 |

## 6. Messages

- `merge_steward.issue.preview`: Issue本文を確認してください
- `merge_steward.issue.created`: Issueを作成しました
- `merge_steward.pull.loading`: GitHubの変更・CI・レビューを確認中です
- `merge_steward.pull.ready`: 全安全ゲートを通過しました
- `merge_steward.pull.human_review`: この変更は人間の確認が必要です
- `merge_steward.pull.blocked`: マージを停止しました
- `merge_steward.pull.stale`: PRが更新されています。再評価してください
- `merge_steward.token_missing`: GitHub連携が未設定です

## 6.5 Product Requirements

- 最初の15秒で「Issue化」「PR評価」「安全マージ」の役割を理解できる。
- 書き込み前に何が起きるかをpreview/confirmationで確認できる。
- READYだけでなく、なぜHUMAN REVIEW/BLOCKEDなのかを証拠付きで読める。
- AIがマージを決めるのではなく、安全ゲートを説明し実行する構造が画面で伝わる。

### Interaction State Coverage

| Component | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Issue composer | CTA無効＋進行表示 | 入力案内 | 項目別/設定エラー | previewまたはIssue URL | duplicate候補を保持して停止 |
| PR evaluator | evidence skeleton | PR番号入力案内 | safe error＋再試行 | verdict/receipt/evidence | 取得済み証拠＋BLOCKED |
| Merge confirmation | 実行中＋二重送信防止 | READY以外では非表示 | GitHub拒否/再評価 | merge SHA/URL | N/A（atomic operation） |

## 7. Change History

| 日付 | 版 | 変更 |
|---|---|---|
| 2026-07-12 | v1.0 | 承認済みBRIEFを実装契約へ変換 |
