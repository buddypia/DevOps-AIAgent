# 001: 外部Agent Cardの実委任

> **状態**: SpecDrafting | **優先度**: MVP | **更新日**: 2026-07-12
> **SPECバージョン**: v1.0 Standard/Full（外部API + security-sensitive）

## 0. AI実装契約

### 0.0 Project Context

- Platform: Vite + React frontend / Express backend / TypeScript ESM
- Existing pattern: `server/agentCardDiscovery.ts`で公開Agent CardをSSRFガード付き取得し、`src/customAgent.ts`でマーケット候補へ変換する。
- Existing A2A: `POST /a2a`のJSON-RPC `message/send`。この機能は同じ最小契約を外部originにも適用する。
- Security posture: 外部originは環境変数allowlistで明示許可。認証情報は送信しない。外部レスポンスは未信頼データとして扱う。

#### 用語

| 用語 | 定義 | コード表現 |
| --- | --- | --- |
| Agent Card | エージェント名・skill・接続先を宣言する公開JSON | `/.well-known/agent-card.json` |
| A2A endpoint | 外部エージェントへJSON-RPCタスクを送信するURL | `card.url`または同一origin`/a2a` |
| 外部委任 | allowlist済みの外部A2A endpointへの`message/send` | `delegateExternalAgent` |
| Receipt | 送信先、skill、HTTP、task ID、状態をまとめた検収情報 | `ExternalDelegationReceipt` |

### 0.1 Target Files

| レイヤー | 範囲 | 作業 | 条件 | 備考 |
| --- | --- | :--: | --- | --- |
| External API service | `server/externalAgent.ts` | 🆕 | 常時 | endpoint解決、allowlist、送信、応答検証 |
| Discovery | `server/agentCardDiscovery.ts` | 🔄 | 常時 | CardのA2A endpointを公開結果へ追加 |
| Config | `server/opsAgent.ts` | 🔄 | 常時 | allowlist/timeoutのZod検証 |
| API route | `server/index.ts` | 🔄 | 常時 | `POST /api/external-agent/delegate` |
| UI | `src/AppHome.tsx` | 🔄 | 常時 | import後の試験委任導線 |
| Tests | `tests/externalAgent.test.ts` | 🆕 | 常時 | 成功・拒否・安全境界 |
| Docs/config | `README.md`, `.env.example` | 🔄 | 常時 | 実行方法とallowlistを明示 |

#### FR ↔ Target Files

| FR-ID | 実装 | テスト |
| --- | --- | --- |
| FR-00101 | `server/agentCardDiscovery.ts`, `server/externalAgent.ts` | `tests/externalAgent.test.ts` |
| FR-00102 | `server/opsAgent.ts`, `server/externalAgent.ts` | `tests/externalAgent.test.ts` |
| FR-00103 | `server/externalAgent.ts`, `server/index.ts` | `tests/externalAgent.test.ts` |
| FR-00104 | `server/index.ts`, `src/AppHome.tsx` | `tests/externalAgent.test.ts` |
| FR-00105 | `server/externalAgent.ts` | `tests/externalAgent.test.ts` |
| FR-00106 | `README.md`, `.env.example` | architecture/grep checks |

### 0.2 Core State / Architecture / State Transitions

#### Core State

| 状態 | 型 | 初期値 | 用途 |
| --- | --- | --- | --- |
| `status` | `"idle" | "loading" | "accepted" | "error"` | `"idle"` | UIの委任状態 |
| `receipt` | `ExternalDelegationReceipt | null` | `null` | 送信結果・task状態 |
| `error` | `string | null` | `null` | ユーザー向け安全なエラー |

#### Architecture Guidance

1. Card discoveryは既存の`discoverAgentCardFromUrl`を再利用する。
2. 外部送信・endpoint検証・response parsingは`server/externalAgent.ts`へ分離する。
3. Express routeはZod parseとHTTP status変換だけを担当する。
4. UIは既存のCard import stateへ委任stateを追加し、未許可時は明示的に理由を表示する。

#### State Transitions

```text
idle -> loading -> accepted
              ├-> error
              └-> rejected (allowlist / skill / validation)
```

`accepted`は「外部タスクが受付済み」を意味し、remote stateが`completed`でない限り完了とは表示しない。

### 0.3 Error Handling

| 状況 | 内部コード | HTTP | 外部接続 |
| --- | --- | :--: | :--: |
| 入力不正 | `invalid_request` | 400 | しない |
| origin allowlist外 | `external_origin_not_allowed` | 403 | しない |
| Card/skill不正 | `invalid_agent_card` / `skill_not_declared` | 422 | しない |
| 外部HTTPエラー/JSON-RPC不正 | `external_agent_error` | 502 | 実行済みの可能性をreceiptに残す |
| timeout | `external_agent_timeout` | 504 | 実行済みの可能性を明示 |
| 設定未構成 | `external_delegation_disabled` | 503 | しない |

エラーレスポンスにAuthorization、API key、外部レスポンス全文を含めない。外部エージェントが返すタスク内容は未信頼データとして文字列表示する。

### 0.4 Data Schema

#### 0.4.1 Config

```ts
externalA2AAllowlist: string[] // URL origin only, default []
externalA2ATimeoutMs: number // 1000..15000, default 6000
```

環境変数:

- `OPS_EXTERNAL_A2A_ALLOWLIST`: `https://agent-a.example,https://agent-b.example`
- `OPS_EXTERNAL_A2A_TIMEOUT_MS`: optional integer

#### 0.4.2 Request/Response

```ts
type ExternalDelegationRequest = {
  agentCardUrl: string;
  skillId?: string;
  message: string;
};

type ExternalDelegationReceipt = {
  status: "accepted" | "completed";
  cardUrl: string;
  a2aEndpoint: string;
  agentName: string;
  skillId: string;
  taskId: string | null;
  taskState: string | null;
  remoteHttpStatus: number;
  responseMessage: string | null;
  evidence: Array<{ id: string; source: string; detail: string }>;
};
```

DB schema変更なし。ReceiptはAPI応答とUI表示のみで、既存Firestoreの`agent_runs`へは保存しない。

### 0.5 API Contract

#### `POST /api/external-agent/delegate`

Request:

```json
{
  "agentCardUrl": "https://allowed-agent.example/.well-known/agent-card.json",
  "skillId": "security.scan",
  "message": "依存パッケージの既知脆弱性を確認してください"
}
```

- `agentCardUrl`: absolute `http/https`, 1-1000 chars。private host、credential URL、2回超のredirectを拒否。
- `skillId`: optional。省略時はCardの最初のskillを使用。指定時はCardに宣言されたskillと完全一致させる。
- `message`: 1-4000 chars。外部へAuthorizationなどを付与しない。

送信payload:

```json
{
  "jsonrpc": "2.0",
  "id": "generated-request-id",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "..." }],
      "metadata": { "skillId": "security.scan" }
    }
  }
}
```

Success `200`:

```json
{
  "ok": true,
  "receipt": {
    "status": "accepted",
    "taskId": "remote-task-123",
    "taskState": "working"
  }
}
```

Error response:

```json
{ "ok": false, "error": "external_origin_not_allowed", "message": "..." }
```

### 0.6 NFR

- 外部Card取得とA2A送信の各timeoutは最大15秒、既定6秒。
- 1リクエストあたりの入力は4,000文字、Cardは既存128KiB制限、外部応答は128KiB以内。
- retryは行わない。副作用の二重実行を防ぐ。
- allowlistが空の場合、外部委任は常に無効。既存のCard importは継続する。
- ログはorigin、skill、HTTP status、task stateのみ。payload全文とAuthorizationはログに出さない。

### 0.7 AI Logic & Prompts

N/A - 外部委任の選択は既存UI/APIの入力を使い、今回の新規処理ではLLMを呼び出さない。外部エージェント側のLLMは未信頼なリモート処理として扱う。

### 0.8 Safety & Guardrails

- `OPS_EXTERNAL_A2A_ALLOWLIST`にないoriginへPOSTしない。
- Card取得時の公開DNS/private IPチェックを維持し、A2A endpointもCardと同一originに制限する。
- endpoint URLのuserinfo、非HTTP scheme、private host、危険なredirectを拒否する。
- 外部へ送るのはユーザーが入力したmessageとskillIdだけ。環境変数、ADC token、Cookie、Authorizationは転送しない。
- remote responseの`completed`は外部taskの状態であり、Agent Guild側の安全な完了保証とは表示しない。

### 0.9 Design Tokens

既存の`import-row`、`import-input`、`btn-secondary`、`import-ok`、`import-error`を再利用する。新規カラー・フォント・レイアウトトークンは追加しない。

### 0.10 FR Dependency Graph

| FR | 依存 | レイヤー | 複雑度 |
| --- | --- | --- | --- |
| FR-00101 | なし | discovery | M |
| FR-00102 | FR-00101 | config/security | M |
| FR-00103 | FR-00101, FR-00102 | external API | H |
| FR-00104 | FR-00103 | route/UI | M |
| FR-00105 | FR-00103 | test | M |
| FR-00106 | FR-00102 | docs/config | S |

### 0.11 Parallel Work Units

| Unit | 担当範囲 | 前提 | 完了条件 |
| --- | --- | --- | --- |
| Foundation | config + endpoint resolution | なし | unit tests pass |
| Backend | external delegation + route | Foundation | API contract pass |
| Frontend | import後の委任導線 | Backend contract | UI typecheck pass |
| Test/Docs | security cases + README/env | Foundation | quality gates pass |

## 1. 概要

### 1.1 Goal

公開Agent Cardを読み取って得た能力を、allowlist済みの外部A2A endpointへの実タスク委任へ接続する。

### 1.2 Value

ユーザーは外部AIの能力を確認した後、同じ画面から試験タスクを送り、task IDと受付状態を確認できる。Agent Cardが「名刺」から「安全な委任契約の入口」になる。

### 1.3 Non-goal

認証基盤、任意外部originへの自動POST、非同期taskの長期管理、外部の破壊的DevOps操作は対象外。

### 1.4 UI Flow Contract

既存の外部Agent Card取込欄に、Card accepted時だけ次を追加する。

1. 委任メッセージ入力（既定値あり）
2. Cardの最初のskillを対象にした「試験タスクを委任」ボタン
3. `loading`、`accepted/completed`、`error`表示
4. allowlist未設定時は「評価のみ」と表示し、外部接続を試みない

## 2. Functional Requirements

### FR-00101: A2A endpoint resolution

Cardの`url`が同一originの有効なHTTP(S) URLなら使用し、未指定ならCard URLのorigin + `/a2a`へフォールバックする。別origin・credential付き・private hostは拒否する。

### FR-00102: External origin policy

`OPS_EXTERNAL_A2A_ALLOWLIST`をorigin単位で読み取り、空または一致しない場合は外部POSTを行わず、理由を返す。

### FR-00103: A2A message/send

宣言済みskillに対して最小JSON-RPC payloadを1回だけ送信し、HTTP statusとJSON-RPC 2.0を検証する。外部エラーやtimeoutは安全なエラーに変換する。

### FR-00104: User-visible trial delegation

既存Card import UIからmessageを入力し、最初のskillを使ってAPIを呼べる。receiptを画面に表示し、未完了を完了と誤表示しない。

### FR-00105: Receipt and evidence

Card URL、endpoint、agent、skill、remote HTTP status、task ID/state、応答message、検証可能なevidenceを返す。外部response全文は返さない。

### FR-00106: Operability documentation

allowlist環境変数、公開Agent Cardの前提、外部委任の安全境界、未設定時の挙動をREADMEと`.env.example`へ記載する。

### Business Rules

- `allowlist.length === 0` → discoveryは可能、delegationはdisabled。
- `requestedSkillId && !cardSkillIds.includes(requestedSkillId)` → 外部接続なしで422。
- `remoteState === completed` → receiptの`status`は`completed`、それ以外は`accepted`。
- `remote response`が不正 → `external_agent_error`。再送しない。

## 3. Dependencies & Risks

1. **Remote contract mismatch**: 最小JSON-RPC以外の実装は拒否し、詳細な相互運用は別機能。
2. **SSRF / side effects**: Card取得時のDNS guardとorigin allowlistを送信前にも適用。
3. **Authentication gap**: 無認証公開endpointのみ。企業向け認証は未実装であることをUI/READMEに明示。

## 4. Screen Docs

N/A - 新規画面は作成せず、既存の外部エージェント連携セクションへ委任コントロールを追加する。UI差分は§1.4に定義する。

## 5. Verification & Tests

- `tests/externalAgent.test.ts`
  - allowlist内の成功レスポンスからtask ID/stateを抽出
  - allowlist外でfetch未実行
  - private host/credential URLを拒否
  - unknown skillでfetch未実行
  - malformed JSON-RPCを502相当へ変換
  - Authorizationを送信payloadへ付与しない
  - timeoutをexternal_agent_timeoutへ変換
- `npm run typecheck`
- `npm test`
- `npm run build`
- `make q.check-architecture`

## 6. Messages

| Key | Japanese |
| --- | --- |
| `external_agent_delegate_label` | 試験タスクを委任 |
| `external_agent_delegating` | 委任中… |
| `external_agent_accepted` | 外部エージェントがタスクを受け付けました |
| `external_agent_completed` | 外部エージェントのタスクが完了しました |
| `external_agent_disabled` | 外部委任はallowlist未設定のため無効です |
| `external_agent_error` | 外部エージェントから安全に結果を取得できませんでした |

## 6.5 Product Requirements

- Card importだけで終わらず、許可された場合に「仕事を送れる」ことを画面で理解できる。
- 受付済みと完了済みを明確に区別する。
- allowlist未設定・認証未対応を隠さず、誤った本番利用を誘発しない。

## 7. 変更履歴

| 日付 | バージョン | 変更 |
| --- | --- | --- |
| 2026-07-12 | v1.0 | 外部Agent Cardの実委任機能を定義 |
