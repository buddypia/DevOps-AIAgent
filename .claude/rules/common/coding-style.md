---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,kt,kts,swift,cpp,cc,cxx,hpp,h,cs,php,dart,svelte,vue}"
  - "src/**/*"
  - ".claude/scripts/**/*.mjs"
  - ".claude/hooks/**/*.mjs"
---
# Coding Style Rules

## ID: R-CM-001
## Severity: critical
## Enforced by: null (scaffold target に feature-boundary-guard hook を自動配備 — `.claude/skills/project-scaffolder/templates/hooks/feature-boundary-guard.mjs`。brief2dev リポ自体では prompt-level)

### Rules

1. **Feature-First ディレクトリ構造（推奨）**: すべてのコードを `{FEATURES_DIR}/<feature-name>/` 配下に構成する。*(本プロジェクトでは厳格採用していない — 現状は `src/` 直下に App.tsx, agentEngine.ts, market.ts 等のフラット構成、server/index.ts。新規 feature では推奨)*
2. **動的パス解決**: ハードコードされたパスの使用は禁止。project-config.json の paths を参照する
3. **ネーミング規約**:
   - ファイル名: kebab-case (例: `user-profile.tsx`)
   - コンポーネント: PascalCase (例: `UserProfile`)
   - 関数/変数: camelCase (例: `getUserProfile`)
   - 定数: UPPER_SNAKE_CASE (例: `MAX_RETRY_COUNT`)
4. **単一責任**: ファイルごとに1つの主要な export。200行を超える場合は分割を検討
5. **Import 順序**: 外部ライブラリ → 内部共有 → 同一 feature → 型 (空行で区切る)
6. **絶対パス**: src/ を基準とした絶対パスを使用 (例: `@/features/search/`)
7. **Barrel exports**: 各 feature ディレクトリに index.ts で public API を公開する
