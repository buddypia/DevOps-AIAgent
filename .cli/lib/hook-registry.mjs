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
          "description": "セッション開始時にパイプラインメモリを注入",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Pipeline Memory: injecting session context"
        },
        {
          "id": "inbox-guard",
          "module": "./inbox-guard.mjs",
          "priority": 35,
          "profile": "standard",
          "description": "inbox 未処理項目の検知 + 通知",
          "orchestrated": false,
          "timeout": 5,
          "commandArgs": "SessionStart"
        },
        {
          "id": "session-integrity-check",
          "module": "./session-integrity-check.mjs",
          "priority": 40,
          "profile": "standard",
          "description": "エコシステム横断ファイル整合性検証",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Ecosystem Integrity: validating cross-file consistency"
        },
        {
          "id": "worktree-system-symlink-guard",
          "module": "./worktree-system-symlink-guard.mjs",
          "priority": 42,
          "profile": "minimal",
          "description": "[R-CM-030] worktree の .brief2dev/system/ が main worktree の symlink かどうかを検出。自動生成しない (Consequential)。fail-open。",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "R-CM-030: checking system_persistent worktree symlink"
        },
        {
          "id": "learnings-injector",
          "module": "./learnings-injector.mjs",
          "priority": 45,
          "profile": "standard",
          "description": "[R-CM-020] セッション開始時に過去の learnings をコンテキストとして注入",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Learnings: injecting past session learnings (gstack Round 11)"
        },
        {
          "id": "compact-context-preserver",
          "module": "./compact-context-preserver.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "compact 直後の最初のセッション開始時に主要コンテキストを再注入 (source===\"compact\" 限定)",
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
          "description": "セッション整理",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 5
        },
        {
          "id": "session-extractor",
          "module": "./session-extractor.mjs",
          "priority": 50,
          "profile": "standard",
          "description": "セッションパターン分析 + wisdom confidence 更新 + instinct 昇格",
          "orchestrated": false,
          "async": true,
          "timeout": 15
        },
        {
          "id": "pipeline-memory-extractor",
          "module": "./pipeline-memory-extractor.mjs",
          "priority": 60,
          "profile": "standard",
          "description": "セッション終了時にパイプラインファクトを抽出",
          "orchestrated": false,
          "timeout": 10,
          "statusMessage": "Pipeline Memory: extracting session facts"
        },
        {
          "id": "transcript-extractor",
          "module": "./transcript-extractor.mjs",
          "priority": 70,
          "profile": "standard",
          "description": "Claude Code の transcript_path jsonl を active run の transcript/ にコピー (Observatory チャットビュー入力)",
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
          "description": "キーワードルーティング (context 切替 + @agent + NFR/パターン RAG)",
          "orchestrated": false,
          "profileChecked": false,
          "timeout": 10
        },
        {
          "id": "ownership-context-injector",
          "module": ".cli/hooks/ownership-context-injector.mjs",
          "priority": 15,
          "profile": "standard",
          "description": "UserPromptSubmit 時に derived code ownership candidates を注入して NEW/MODIFY routing drift を削減",
          "orchestrated": false,
          "timeout": 5,
          "cliTargets": ["codex"]
        },
        {
          "id": "task-context-injector",
          "module": "./task-context-injector.mjs",
          "priority": 20,
          "profile": "standard",
          "description": "作業性 prompt に最新のタスク/SSOT/検証契約を注入して AI context drift を削減",
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
          "description": "同時サブエージェント数の制限 (MAX=5)",
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
          "description": "サブエージェント終了時に活性リストから除去",
          "orchestrated": false,
          "timeout": 5,
          "statusMessage": "Subagent Cleanup: removing from active agents"
        },
        {
          "id": "stop-handler",
          "module": "../scripts/stop-handler.mjs",
          "priority": 10,
          "profile": "none",
          "description": "ECC instincts 抽出 (サブエージェント終了)",
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

/** 全 entry の平坦化リスト (id 重複除去なし — inbox-guard のような多重登録を保持) */
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
 * HOOK_REGISTRY に登録された hooks/ ディレクトリの module ファイル名集合 (`./xxx.mjs` → `xxx.mjs`).
 *
 * "この hook ファイルが registry に登録されているか(= 死んだ hook ではないか)" の SSOT 質問。settings.json は
 * この registry から codegen されるため (R-CM-006 Rule 4)、registry 登録 = 活性 hook である (orchestrated
 * かどうかは無関係 — orchestrated hook は orchestrator dispatch、それ以外は settings.json の直接 command)。
 *
 * ecosystem-health-guard E1 + ecosystem-integrity-validator EI3 が共有する — 以前は E1 が
 * hook-registry.mjs *ソーステキストを regex パース* して `orchestrated:true` のみを認識し、EI3 は programmatic
 * に *すべての* `./` module を認識していたため、両 validator の registry 認識ロジックが divergent していた。本ヘルパーで
 * 単一化して drift を遮断する。`../scripts/` モジュールは hooks/ 検査範囲外のため除外。
 * 戻り値は basename set — `./X.mjs`(.claude/hooks/) と `.cli/hooks/X.mjs`(マルチ-CLI ガード移行後) の basename
 * を両方収集する(契約の完全性)。EI3/E1 の `.claude/hooks/` disk 検査には `.cli/hooks/` basename が
 * マッチせず無影響であり、registry 全体の hook 認識が必要な消費者は完全な set を受け取る。
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
