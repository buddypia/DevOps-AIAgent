/**
 * hook-registry.mjs — Single SSOT Hook Registry (R-CM-006 Rule 4)
 *
 * 本ファイルは brief2dev のすべての Hook 情報の **単一の信頼できる情報源 (Single SSOT)** である。
 * - settings.json#hooks はこの registry から codegen される (regen-hooks-settings.mjs)
 * - profile メンバーシップは entry の `profile` フィールドから直接 derive
 * - hook-flags.mjs の PROFILE_MAP はこの registry から build
 *
 * settings.json の直接編集禁止 — settings-codegen-guard hook がブロックする。
 * profile 変更時は entry の `profile` フィールドのみ修正後 `node .claude/scripts/regen-hooks-settings.mjs` を実行。
 *
 * 各 hook entry フィールド:
 *   id                — hookId (safeHookMainWithProfile の引数)
 *   module            — `.mjs` パス (../scripts/ または ./)
 *   priority          — 実行順序 (小さいほど先)
 *   profile           — 'minimal' | 'standard' | 'none' (プロファイル未適用; strict ティア削除 2026-06-11 → 2-tier)
 *   profileChecked    — false なら safeHookMain を使用 (profile 迂回)
 *   orchestrated      — true なら hook-orchestrator 経由の in-process 実行
 *   description       — AI コンテキスト認識用
 *   timeout           — settings.json command タイムアウト (秒)
 *   if                — Bash conditional matcher (例: 'Bash(git *)')
 *   statusMessage     — ユーザー表示ステータスメッセージ
 *   async             — true なら非同期実行
 *   commandArgs       — node module.mjs の追加引数 (例: 'SessionStart')
 *   type              — 'command' (デフォルト) または 'prompt'
 *   prompt            — type='prompt' 時の LLM プロンプト本文
 *   hookType          — PROMPT_AGENT_HOOKS の 'prompt' | 'agent'
 *
 * @see .claude/rules/common/hooks.md (R-CM-006 Rule 4 — Single SSOT)
 * @see .claude/scripts/regen-hooks-settings.mjs (codegen)
 * @see .claude/hooks/settings-codegen-guard.mjs (直接編集ブロック)
 */

/** 有効な hook イベントタイプ (Claude Code プラットフォームイベント vocabulary — 登録 hook の有無と無関係)。 */
export const VALID_EVENT_TYPES = new Set([
  'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Stop', 'SessionStart', 'SessionEnd',
  'PreCompact', 'UserPromptSubmit', 'SubagentStart', 'SubagentStop',
  'TaskCreated', 'TaskCompleted', 'PermissionRequest', 'FileChanged', 'Notification', 'ConfigChange',
  // WorktreeCreate/WorktreeRemove は有効なイベントだが現在は登録 hook が 0 (agent-worktree-guard retire 2026-06-26)。
  'WorktreeCreate', 'WorktreeRemove',
]);

/** orchestrator dispatcher entries (settings.json では 1 matcher = 1 呼び出し) */
export const ORCHESTRATOR_DISPATCHERS = [
  {
    "event": "Stop",
    "matcher": "",
    "timeout": 60
  },
  {
    "event": "PreToolUse",
    "matcher": "Edit|Write",
    "timeout": 15
  },
  {
    "event": "PostToolUse",
    "matcher": "Write|Edit",
    "timeout": 45
  }
];

/** prompt/agent type hooks (PROMPT_AGENT_HOOKS) */
export const PROMPT_AGENT_HOOKS = {
  // completion-evidence-guard は HOOK_REGISTRY.Stop に command-type (priority 58) として実行される。
  // 過去の PROMPT_AGENT_HOOKS.Stop の prompt-type entry は `prompt` 本文フィールドがなく codegen
  // (regen-hooks-settings.mjs#appendPromptHooks `if (!ph.prompt) continue;`) で settings.json への進入が
  // 恒久的に skip される死んだメタデータだった (#109 prompt→command 転換の残滓)。flattenRegistry/getRegistryStats
  // の統計だけを +1 汚染し実行への影響は 0 → 削除。
  "Stop": [],
  "PreToolUse": [],
  "TaskCompleted": [],
  // SubagentStop は prompt-type hook を登録しない (codegen ガードが強制 — regen-hooks-settings.mjs)。
  // 根拠: prompt-type SubagentStop は検証指示文を subagent context に注入するため、
  //       subagent がその指示に応答({"decision":"allow"})しながら実際の産出物
  //       (例: code-reviewer のレビュー結果) を最終結果で上書きする構造的な汚染を引き起こす。
  //       意図であった R-PL-002 Rule 7 stage closure 検証は R-PL-002 Rule 7 prompt-level audit
  //       (stage skills) + handoff-consistency-guard (PostToolUse、handoff 構造検証) が
  //       それぞれの home でカバーするため、allow-biased な本 hook は重複 + 汚染だけを引き起こす。
  //       SubagentStop 検証が必要なら command-type hook としてのみ作成する (R-CM-006 Rule 1)。
  "SubagentStop": []
};

/** Single SSOT — settings.json hooks セクションはこの registry の codegen */
export const HOOK_REGISTRY = {
  "PreToolUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "pre-tool-enforcer",
          "module": "../scripts/pre-tool-enforcer.mjs",
          "priority": 10,
          "profile": "minimal",
          "description": "パイプラインコンテキスト注入 + Skill 実行前検証",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    },
    {
      "matcher": "Edit|Write",
      "hooks": [
        {
          "id": "settings-codegen-guard",
          "module": "./settings-codegen-guard.mjs",
          "priority": 6,
          "profile": "minimal",
          "description": "[R-CM-006 Rule 4] settings.json#hooks 直接編集ブロック (Single SSOT)",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "phase-boundary-file-guard",
          "module": "./phase-boundary-file-guard.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "パイプライン産出物 Write 時に requiredInputs の有効性を検証 (3-Layer L1)",
          "orchestrated": true
        },
        {
          "id": "secret-leak-guard",
          "module": ".cli/hooks/secret-leak-guard.mjs",
          "priority": 5,
          "profile": "minimal",
          "description": "API キー/シークレットのハードコーディング検知 + DENY",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity"],
          "cliMatcherTools": ["Edit", "Write", "MultiEdit"]
        },
        {
          "id": "worktree-policy-guard",
          "module": ".cli/hooks/worktree-policy-guard.mjs",
          "priority": 8,
          "profile": "minimal",
          "description": "main 直接作業の Tier ポリシー強制 (Tier 1/2/3 + hotfix/* escape hatch)。SSOT: .claude/config/worktree-policy.json",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity", "gemini"],
          "cliMatcherTools": ["Edit", "Write", "MultiEdit"]
        },
        {
          "id": "worktree-session-owner-guard",
          "module": ".cli/hooks/worktree-session-owner-guard.mjs",
          "priority": 9,
          "profile": "standard",
          "description": "[R-CM-036] マルチセッション cross-worktree 編集ブロック (Layer 1 cwd-confinement + Layer 2 session_id サイドカー)。Edit|Write|MultiEdit 対象",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity"],
          "cliMatcherTools": ["Edit", "Write", "MultiEdit"]
        },
        {
          "id": "coverage-threshold-guard",
          "module": ".cli/hooks/coverage-threshold-guard.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "カバレッジ threshold の低下防止 (Ratchet: up-only)",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity"],
          "cliMatcherTools": ["Edit", "Write", "MultiEdit"]
        },
        {
          "id": "health-ratchet-guard",
          "module": "./health-ratchet-guard.mjs",
          "priority": 41,
          "profile": "standard",
          "description": "Code Health 7 軸 baseline (data/registry/code-health-ratchet-baseline.json) の直接修正時に score 低下を検知 + warning (R-CM-016 Rule 10 整合)",
          "orchestrated": true
        }
      ]
    },
    {
      "matcher": "Bash",
      "hooks": [
        {
          "id": "merge-guard",
          "module": ".cli/hooks/merge-guard.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "Git merge の衝突防止",
          "orchestrated": false,
          "timeout": 30,
          "if": "Bash(git *)",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "destructive-git-guard",
          "module": ".cli/hooks/destructive-git-guard.mjs",
          "priority": 5,
          "profile": "minimal",
          "description": "reset --hard, force push など破壊的な Git コマンドをブロック",
          "orchestrated": false,
          "timeout": 30,
          "if": "Bash(git *)",
          "cliTargets": ["codex", "antigravity", "gemini"]
        },
        {
          "id": "commit-guard",
          "module": ".cli/hooks/commit-guard.mjs",
          "priority": 20,
          "profile": "standard",
          "description": "Conventional Commits 形式 + 変更範囲の検証",
          "orchestrated": false,
          "timeout": 30,
          "if": "Bash(git *)",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "worktree-session-owner-guard",
          "module": ".cli/hooks/worktree-session-owner-guard.mjs",
          "priority": 25,
          "profile": "standard",
          "description": "[R-CM-036] マルチセッション cross-worktree git commit ブロック (Layer 1 cwd-confinement)。Bash git commit 対象",
          "orchestrated": false,
          "timeout": 5,
          "if": "Bash(git *)",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "dev-server-guard",
          "module": "./dev-server-guard.mjs",
          "priority": 30,
          "profile": "standard",
          "description": "dev server 実行時に tmux セッションの使用を推奨",
          "orchestrated": false,
          "timeout": 30
        },
        {
          "id": "git-push-warning",
          "module": ".cli/hooks/git-push-warning.mjs",
          "priority": 35,
          "profile": "standard",
          "description": "[OSS] git push 前の変更内容レビュー通知",
          "orchestrated": false,
          "timeout": 30,
          "if": "Bash(git push*)",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "guardrail-guard",
          "module": ".cli/hooks/guardrail-guard.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "Bash ツールのリスク度分類 + パイプライン中の high ツールをブロック",
          "orchestrated": false,
          "timeout": 30,
          "statusMessage": "Guardrail: checking tool risk level",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "pre-ship-review-guard",
          "module": ".cli/hooks/pre-ship-review-guard.mjs",
          "priority": 50,
          "profile": "minimal",
          "description": "(settings-only — generated during R-CM-006 single SSOT migration)",
          "orchestrated": false,
          "timeout": 30,
          "cliTargets": ["codex", "antigravity"]
        }
      ]
    },
    {
      "matcher": "Task",
      "hooks": [
        {
          "id": "model-routing-guard",
          "module": "./model-routing-guard.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "Task 実行時のモデル適合性検証 + コスト最適化",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "agent-review-readiness-guard",
          "module": "./agent-review-readiness-guard.mjs",
          "priority": 20,
          "profile": "standard",
          "description": "review/code-simplifier agent 呼び出し時に uncommitted + zero commits をブロック (wrong-scope review 防止)。2026-05-27 のユーザー決定で /simplify を廃止 + simplifit スキルを deprecate した後は /code-review が単一エントリポイント",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    },
    {
      "matcher": "Skill",
      "hooks": [
        {
          "id": "new-run-guard",
          "module": "./new-run-guard.mjs",
          "priority": 2,
          "profile": "standard",
          "description": "新規ビジネスアイデア開始の直前(business-analyzer 進入時)に boundary を自動ブロック (R-CM-014/028)",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "pipeline-boundary-guard",
          "module": "./pipeline-boundary-guard.mjs",
          "priority": 5,
          "profile": "minimal",
          "description": "brief2dev リポでの開発スキル実行をブロック + Saga State 注入",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "pipeline-context-awareness-guard",
          "module": "./pipeline-context-awareness-guard.mjs",
          "priority": 25,
          "profile": "standard",
          "description": "パイプライン状態の認識 + AI コンテキスト案内 (SSOT: SKILL_TO_STAGE)",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "constraint-injector",
          "module": "./constraint-injector.mjs",
          "priority": 35,
          "profile": "standard",
          "description": "前ステージの制約条件を注入 (Rule 6-9)",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Constraint Injector: injecting previous stage constraints (Rule 6-9)"
        },
        {
          "id": "inbox-guard-skill",
          "module": "./inbox-guard.mjs",
          "priority": 3,
          "profile": "standard",
          "description": "Skill 実行前に inbox の未処理項目を検知",
          "orchestrated": false,
          "timeout": 5,
          "commandArgs": "PreToolUse"
        }
      ]
    },
    {
      "matcher": "AskUserQuestion",
      "hooks": [
        {
          "id": "auto-gate-visual",
          "module": "./auto-gate-visual.mjs",
          "priority": 5,
          "profile": "standard",
          "description": "[観点1] native ゲート決定の直前に視覚パネルを自動生成 + ブラウザ open (deny なし、補強)。build.mjs の spawn 余裕のため timeout 10",
          "orchestrated": false,
          "timeout": 10
        }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": "Edit",
      "hooks": [
        {
          "id": "edit-error-recovery",
          "module": "./edit-error-recovery.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "Edit 失敗時の自動復旧ガイド",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    },
    {
      "matcher": "WebSearch",
      "hooks": [
        {
          "id": "websearch-evidence-extractor",
          "module": "./websearch-evidence-extractor.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "[R-CM-035] WebSearch 結果を runs/{active}/research/web-search/ に markdown + meta JSON として永続化 (Observatory 意思決定の根拠)",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    },
    {
      "matcher": "Read",
      "hooks": [
        {
          "id": "wisdom-ref-tracker",
          "module": "./wisdom-ref-tracker.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "Wisdom ファイルの参照追跡 (last_referenced を更新 — session-extractor confidence scoring の入力)",
          "orchestrated": false,
          "timeout": 3
        },
        {
          "id": "prompt-injection-guard",
          "module": "./prompt-injection-guard.mjs",
          "priority": 20,
          "profile": "standard",
          "description": "[ECC] 読み込んだファイル内容のプロンプトインジェクションパターンを検知。standalone: settings.json から直接呼び出し",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    },
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "id": "pipeline-change-tracker",
          "module": "./pipeline-change-tracker.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "パイプライン産出物の変更追跡 + Schema 検証 + Saga 更新",
          "orchestrated": true
        },
        {
          "id": "esp-consistency-guard",
          "module": "./esp-consistency-guard.mjs",
          "priority": 30,
          "profile": "standard",
          "description": "ESP(Enforced Skill Pattern) の一貫性検証",
          "orchestrated": true
        },
        {
          "id": "handoff-consistency-guard",
          "module": "./handoff-consistency-guard.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "Confidence Ratchet + Handoff 構造の検証",
          "orchestrated": true
        },
        {
          "id": "docs-consistency-guard",
          "module": "./docs-consistency-guard.mjs",
          "priority": 45,
          "profile": "standard",
          "description": "Input→Output Staleness を検知",
          "orchestrated": true,
          "async": true
        },
        {
          "id": "compact-warning",
          "module": "./compact-warning.mjs",
          "priority": 80,
          "profile": "standard",
          "description": "Saga State を認識した戦略的 /compact 提案",
          "orchestrated": true,
          "async": true
        },
        {
          "id": "complexity-threshold-warning",
          "module": "./complexity-threshold-warning.mjs",
          "priority": 96,
          "profile": "standard",
          "description": "[Code Health Pipeline Step 2] cyclomatic complexity > 15 を検知 (PostToolUse)。弱い通知 (R-CM-022 -warning)。SSOT: code-health-axes.json#axes.cognitive-complexity。v1: ESLint fallback。v2: sonarjs/cognitive",
          "orchestrated": true
        },
        {
          "id": "skill-structure-check",
          "module": "./skill-structure-check.mjs",
          "priority": 90,
          "profile": "standard",
          "description": "[R-CM-018] SKILL.md 構造の有効性検証",
          "orchestrated": true,
          "timeout": 5,
          "statusMessage": "R-CM-018: validating SKILL.md structure"
        },
        {
          "id": "scaffold-artifact-schema-warning",
          "module": "./scaffold-artifact-schema-warning.mjs",
          "priority": 92,
          "profile": "standard",
          "description": "scaffold 産出物(project-brief/config)の schema drift 通知",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "P13: scaffold artifact schema check"
        },
        {
          "id": "scaffold-validation-warning",
          "module": "./scaffold-validation-warning.mjs",
          "priority": 93,
          "profile": "standard",
          "description": "output scaffold validation report の staleness 通知",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "P20: scaffold validation staleness check"
        },
        {
          "id": "quality-stamp-cleanup",
          "module": "./quality-stamp-cleanup.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "(settings-only — generated during R-CM-006 single SSOT migration)",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Quality Gate: cleaning stamp on file change"
        }
      ]
    },
    {
      "matcher": "Bash",
      "hooks": [
        {
          "id": "worktree-owner-tracker",
          "module": ".cli/hooks/worktree-owner-tracker.mjs",
          "priority": 90,
          "profile": "standard",
          "description": "[R-CM-036] worktree 生成成功時にセッション所有権サイドカー(.session-owner)を記録 (safeHookMain — profile 無関係、絶対に BLOCK しない)",
          "orchestrated": false,
          "timeout": 5,
          "profileChecked": false,
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "bash-file-integrity-guard",
          "module": ".cli/hooks/bash-file-integrity-guard.mjs",
          "priority": 70,
          "profile": "standard",
          "description": "sed -i / awk -i inplace 実行後の 0 バイトファイル破損を検知",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Bash File Integrity: detecting 0-byte corruption from sed -i / awk -i inplace (R-CM-019)",
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "governance-capture",
          "module": "./governance-capture.mjs",
          "priority": 80,
          "profile": "minimal",
          "description": "検証コマンド実行の証拠を governance event としてキャプチャ",
          "orchestrated": false,
          "timeout": 3,
          "statusMessage": "P15: capturing verification command for R-CM-010 evidence"
        },
        {
          "id": "quality-stamp-cleanup",
          "module": "./quality-stamp-cleanup.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "(settings-only — generated during R-CM-006 single SSOT migration)",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Quality Gate: cleaning stamp on bash execution"
        }
      ]
    }
  ],
  "PostToolUseFailure": [
    {
      "matcher": "mcp__*",
      "hooks": [
        {
          "id": "mcp-failure-tracker",
          "module": "./mcp-failure-tracker.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "MCP ツール失敗時に明示的な失敗情報でヘルス状態を更新。standalone: settings.json から直接呼び出し",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    }
  ],
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "quality-gate-stop-guard",
          "module": "./quality-gate-stop-guard.mjs",
          "priority": 5,
          "profile": "standard",
          "description": "品質ゲート (make q.check) の通過を強制",
          "orchestrated": true
        },
        {
          "id": "stop-handler",
          "module": "../scripts/stop-handler.mjs",
          "priority": 10,
          "profile": "none",
          "description": "ECC instincts の抽出 (パイプラインステージの学習)",
          "orchestrated": true,
          "profileChecked": false
        },
        {
          "id": "analyze-guard",
          "module": "../scripts/analyze-guard.mjs",
          "priority": 20,
          "profile": "none",
          "description": "分析結果の要約 + コンテキスト注入",
          "orchestrated": true,
          "profileChecked": false
        },
        {
          "id": "pipeline-drift-guard",
          "module": "./pipeline-drift-guard.mjs",
          "priority": 30,
          "profile": "standard",
          "description": "Drift + 構造 + コンテンツ + スキーマ整合性 + Saga 一貫性の検証 (L3)",
          "orchestrated": true
        },
        {
          "id": "worktree-shipping-guard",
          "module": ".cli/hooks/worktree-shipping-guard.mjs",
          "priority": 35,
          "profile": "standard",
          "description": "[R-CM-030] worktree commit + unmerged 時に /create-pr ship-worktree を自動誘導 (5min 試行マーカー)",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity"],
          "cliTimeout": 10
        },
        {
          "id": "security-scan-guard",
          "module": ".cli/hooks/security-scan-guard.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "セキュリティ脆弱性スキャン",
          "orchestrated": true,
          "cliTargets": ["codex", "antigravity"]
        },
        {
          "id": "ecosystem-health-guard",
          "module": "./ecosystem-health-guard.mjs",
          "priority": 50,
          "profile": "standard",
          "description": ".claude/ エコシステム内部の一貫性検証",
          "orchestrated": true
        },
        {
          "id": "inbox-guard-stop",
          "module": "./inbox-guard.mjs",
          "priority": 5,
          "profile": "standard",
          "description": "Stop 時に inbox の未処理項目を検知",
          "orchestrated": false,
          "timeout": 5,
          "commandArgs": "Stop"
        },
        {
          "id": "completion-evidence-guard",
          "module": "./completion-evidence-guard.mjs",
          "priority": 58,
          "profile": "standard",
          "description": "[R-CM-010] 検証証拠なしの完了主張をブロック (command type)",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "R-CM-010: verifying code changes have test/lint evidence"
        },
        {
          "id": "docs-index-guard",
          "module": "./docs-index-guard.mjs",
          "priority": 55,
          "profile": "standard",
          "description": "docs/ 変更時に docs/index.md の自動インデックス(AUTO マーカー)の stale をブロック + 更新を誘導 (main + 所有 worktree)",
          "orchestrated": false,
          "timeout": 15,
          "statusMessage": "docs-index-guard: checking docs/index.md AUTO section freshness"
        }
      ]
    }
  ],
  "SessionStart": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "trunk-start-warning",
          "module": ".cli/hooks/trunk-start-warning.mjs",
          "priority": 5,
          "profile": "minimal",
          "description": "main ブランチで AI セッション進入時に worktree の案内をコンテキストとして注入 (R-CM-006 Rule 1 整合 — SessionStart はブロック不可)",
          "orchestrated": false,
          "timeout": 10,
          "cliTargets": ["codex", "gemini"]
        },
        {
          "id": "ownership-context-injector",
          "module": ".cli/hooks/ownership-context-injector.mjs",
          "priority": 7,
          "profile": "standard",
          "description": "Claude Code 専用 (SessionStart は公式 Antigravity イベントではない — 実測確認 2026-07-09、agy v1.1.0 埋め込みドキュメント)。UserPromptSubmit 非対応の境界と ownership query 手順をコンテキストとして注入。cliTargets は空 — Antigravity の代替イベント(PreInvocation invocationNum===0 ゲーティング)のマッピングは後続検討",
          "orchestrated": false,
          "timeout": 5
        },
        {
          "id": "session-start",
          "module": "../scripts/session-start.mjs",
          "priority": 10,
          "profile": "none",
          "description": "前セッションのコンテキスト読み込み + パイプライン状態の検知",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 10
        },
        {
          "id": "pipeline-memory-injector",
          "module": "./pipeline-memory-injector.mjs",
          "priority": 30,
          "profile": "standard",
          "description": "세션 시작 시 파이프라인 메모리 주입",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Pipeline Memory: injecting session context"
        },
        {
          "id": "inbox-guard",
          "module": "./inbox-guard.mjs",
          "priority": 35,
          "profile": "standard",
          "description": "inbox 미처리 항목 감지 + 알림",
          "orchestrated": false,
          "timeout": 5,
          "commandArgs": "SessionStart"
        },
        {
          "id": "session-integrity-check",
          "module": "./session-integrity-check.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "에코시스템 교차 파일 일관성 검증",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Ecosystem Integrity: validating cross-file consistency"
        },
        {
          "id": "worktree-system-symlink-guard",
          "module": "./worktree-system-symlink-guard.mjs",
          "priority": 42,
          "profile": "minimal",
          "description": "[R-CM-030] worktree 의 .brief2dev/system/ 이 main worktree symlink 인지 검출. 자동 생성 X (Consequential). fail-open.",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "R-CM-030: checking system_persistent worktree symlink"
        },
        {
          "id": "learnings-injector",
          "module": "./learnings-injector.mjs",
          "priority": 45,
          "profile": "standard",
          "description": "[R-CM-020] 세션 시작 시 이전 learnings를 컨텍스트로 주입",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Learnings: injecting past session learnings (gstack Round 11)"
        },
        {
          "id": "compact-context-preserver",
          "module": "./compact-context-preserver.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "compact 직후 첫 세션 시작 시 핵심 컨텍스트 재주입 (source===\"compact\" 한정)",
          "orchestrated": false,
          "timeout": 15,
          "statusMessage": "Compact Context: re-injecting preserved context after compaction"
        }
      ]
    }
  ],
  "SessionEnd": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "session-end",
          "module": "../scripts/session-end.mjs",
          "priority": 30,
          "profile": "none",
          "description": "세션 정리",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 5
        },
        {
          "id": "session-extractor",
          "module": "./session-extractor.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "세션 패턴 분석 + wisdom confidence 업데이트 + instinct 승격",
          "orchestrated": false,
          "async": true,
          "timeout": 15
        },
        {
          "id": "pipeline-memory-extractor",
          "module": "./pipeline-memory-extractor.mjs",
          "priority": 60,
          "profile": "standard",
          "description": "세션 종료 시 파이프라인 팩트 추출",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Pipeline Memory: extracting session facts"
        },
        {
          "id": "transcript-extractor",
          "module": "./transcript-extractor.mjs",
          "priority": 70,
          "profile": "standard",
          "description": "Claude Code transcript_path jsonl 을 active run 의 transcript/ 로 복사 (Observatory 채팅 뷰 입력)",
          "orchestrated": false,
          "async": true,
          "timeout": 5
        }
      ]
    }
  ],
  "UserPromptSubmit": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "keyword-router",
          "module": "./keyword-router.mjs",
          "priority": 10,
          "profile": "none",
          "description": "키워드 라우팅 (context 전환 + @agent + NFR/패턴 RAG)",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 10
        },
        {
          "id": "ownership-context-injector",
          "module": ".cli/hooks/ownership-context-injector.mjs",
          "priority": 15,
          "profile": "standard",
          "description": "UserPromptSubmit 시 derived code ownership candidates를 주입하여 NEW/MODIFY routing drift를 줄임",
          "orchestrated": false,
          "timeout": 5,
          "cliTargets": ["codex"]
        },
        {
          "id": "task-context-injector",
          "module": "./task-context-injector.mjs",
          "priority": 20,
          "profile": "standard",
          "description": "작업성 prompt에 최신 태스크/SSOT/검증 계약을 주입하여 AI context drift를 줄임",
          "orchestrated": false,
          "timeout": 5
        }
      ]
    }
  ],
  "SubagentStart": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "subagent-limit-guard",
          "module": "./subagent-limit-guard.mjs",
          "priority": 10,
          "profile": "standard",
          "description": "동시 서브에이전트 수 제한 (MAX=5)",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Subagent Limit: tracking concurrency"
        }
      ]
    }
  ],
  "SubagentStop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "id": "subagent-cleanup",
          "module": "./subagent-cleanup.mjs",
          "priority": 5,
          "profile": "standard",
          "description": "서브에이전트 종료 시 활성 목록에서 제거",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Subagent Cleanup: removing from active agents"
        },
        {
          "id": "stop-handler",
          "module": "../scripts/stop-handler.mjs",
          "priority": 10,
          "profile": "none",
          "description": "ECC instincts 추출 (서브에이전트 종료)",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 15
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// Helpers (registry-derived)
// ═══════════════════════════════════════════════════════════════

export function matchesTool(matcher, toolName) {
  if (matcher === '*' || matcher === '') return true;
  return matcher.split('|').some((m) => m.trim() === toolName);
}

export function getHooksForEvent(event, toolName) {
  const groups = HOOK_REGISTRY[event] || [];
  const matched = [];
  for (const g of groups) {
    if (matchesTool(g.matcher, toolName)) matched.push(...g.hooks);
  }
  return matched.sort((a, b) => (a.priority || 50) - (b.priority || 50));
}

/** 모든 entry 의 평탄화 목록 (id 중복 제거 X — inbox-guard 같은 다중 등록 보존) */
export function flattenRegistry() {
  const out = [];
  for (const [event, groups] of Object.entries(HOOK_REGISTRY)) {
    for (const g of groups) {
      for (const h of g.hooks) out.push({ event, matcher: g.matcher, ...h });
    }
  }
  for (const [event, list] of Object.entries(PROMPT_AGENT_HOOKS)) {
    for (const h of list) out.push({ event, matcher: '', ...h });
  }
  return out;
}

/**
 * HOOK_REGISTRY 에 등록된 hooks/ 디렉토리 module 파일명 집합 (`./xxx.mjs` → `xxx.mjs`).
 *
 * "이 hook 파일이 registry 에 등록되었는가(= 죽은 hook 아님)" 의 SSOT 질의. settings.json 은
 * 이 registry 에서 codegen 되므로 (R-CM-006 Rule 4), registry 등록 = 활성 hook 이다 (orchestrated
 * 여부 무관 — orchestrated hook 은 orchestrator dispatch, 나머지는 settings.json 직접 command).
 *
 * ecosystem-health-guard E1 + ecosystem-integrity-validator EI3 가 공유한다 — 이전에는 E1 이
 * hook-registry.mjs *소스 텍스트를 regex 파싱* 해 `orchestrated:true` 만 인식하고, EI3 는 programmatic
 * 으로 *모든* `./` module 을 인식하여 두 validator 의 registry 인식 로직이 divergent 했다. 본 헬퍼로
 * 단일화하여 drift 를 차단한다. `../scripts/` 모듈은 hooks/ 검사 범위 밖이라 제외.
 * 반환은 basename set — `./X.mjs`(.claude/hooks/) 와 `.cli/hooks/X.mjs`(멀티-CLI 가드 이전 후) 의 basename
 * 을 모두 수집한다(계약 완전성). EI3/E1 의 `.claude/hooks/` disk 검사에는 `.cli/hooks/` basename 이
 * 매칭되지 않아 무영향이며, registry 전체 hook 인식이 필요한 소비자는 완전한 set 을 받는다.
 */
export function collectRegistryHookFiles() {
  const set = new Set();
  for (const groups of Object.values(HOOK_REGISTRY)) {
    for (const group of groups || []) {
      for (const hook of group.hooks || []) {
        const mod = hook.module || '';
        if (mod.startsWith('./')) set.add(mod.slice(2));
        else if (mod.startsWith('.cli/')) set.add(mod.split('/').pop());
      }
    }
  }
  return set;
}

export function getRegistryStats() {
  const flat = flattenRegistry();
  return {
    total: flat.length,
    byProfile: {
      minimal: flat.filter((h) => h.profile === 'minimal').length,
      standard: flat.filter((h) => h.profile === 'standard').length,
      none: flat.filter((h) => h.profile === 'none' || h.profileChecked === false).length,
    },
    orchestrated: flat.filter((h) => h.orchestrated).length,
    standalone: flat.filter((h) => h.orchestrated === false).length,
  };
}
