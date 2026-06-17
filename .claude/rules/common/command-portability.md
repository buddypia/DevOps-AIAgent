---
paths:
  - ".claude/skills/**/SKILL.md"
  - "**/project-config.json"
---
# Command Portability Rules

## ID: R-CM-009
## Severity: critical
## Enforced by: ecosystem-health-guard（本プロジェクトでは未配備 — prompt-level）(E21 Stop hook, validate-command-portability.mjs 呼び出し)

### Rules

1. **make 命令のハードコード禁止**: スキル(SKILL.md)から `make q.lint`, `make q.test`, `make codegen.check` などの特定の Makefile ターゲットを直接参照しない
2. **project-config.json commands SSOT**: 品質ゲート命令は必ず `project-config.json` の `commands` セクションを読んで解決する
3. **null ならスキップ**: `commands.lint` が null の場合、そのプロジェクトに lint 命令が存在しないという意味。エラーではなくスキップとして処理する
4. **動的検出を許可**: project-config.json が存在しないプロジェクトでは Makefile ターゲットを動的検出(`make -pRrq`)し、存在するものだけを実行する
5. **例外リスト**: project-scaffolder, pre-quality-gate, sdlc-governance, deploy, spec-validator は Makefile ターゲットを定義/実行することが存在理由であるため例外 (例: `make deploy`, `make spec.validate` 自体の定義)
6. **検証タイミング**: 本ルールは以下の2経路で強制される。
   - **自動 wire-up**: `ecosystem-health-guard` (L3 Stop hook) の E21 カテゴリが毎回の Stop 時点で `validate-command-portability.mjs#runPortabilityAudit` 関数を呼び出して違反を検出。1つでも発見した場合は MAJOR 警告として報告 (BLOCK ではない — 段階的 cleanup を許可)。R-CM-006 Rule 2 fail-open と整合 — 関数失敗時は hook を通過させる。
   - **手動 audit**: `node .claude/scripts/validate-command-portability.mjs` (CLI モード, exit 1 on violations)。

### 命令マッピング

| commands キー | 用途 | 例の値 |
|---|---|---|
| `typecheck` | 型チェック | `make typecheck`, `npm run typecheck` |
| `lint` | リント | `make q.lint`, `npm run lint` |
| `test` | テスト | `make q.test`, `npm test` |
| `format_check` | フォーマットチェック | `make q.format.check` |
| `format_fix` | フォーマット修正 | `make q.format` |
| `build` | ビルド | `make q.build`, `npm run build` |
| `codegen_check` | コード生成状態の確認 | `make codegen.check` |
| `codegen` | コード生成の実行 | `make codegen` |
| `quality_gate` | 統合品質ゲート | `make q.check` |
| `check_architecture` | アーキテクチャチェック | `make q.check-architecture` |

### SKILL.md 作成ガイド

```
AS-IS (禁止):
  make q.lint
  make q.test
  make q.check

TO-BE (必須):
  project-config.json → commands.lint (null ならスキップ)
  project-config.json → commands.test (null ならスキップ)
  project-config.json → commands.quality_gate (null ならスキップ)
```
