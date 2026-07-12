#!/bin/bash
# scripts/setup-worktree-env.sh
# ワークツリー初期化時に実行し、Claude Code 向けのフック設定ファイルを自動配備・マージする。
# Codex/Antigravity 向け設定 (.codex/hooks.json, .claude/hooks.json) は git-worktree-isolation
# バンドルの managed 資産としてリポジトリに既に存在するため、ここでは生成しない
# (誤ったスキーマで上書きし Codex CLI のパースエラーを引き起こした過去のインシデントを踏まえた対応)。

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CLAUDE_DIR="${PROJECT_ROOT}/.claude"

# スクリプトの実行権限を保証
chmod +x "${PROJECT_ROOT}/scripts/autonomous-gate.sh"

# Claude Code 向けの .claude/settings.json の生成/マージ
echo "Generating .claude/settings.json for Claude Code..." >&2
mkdir -p "$CLAUDE_DIR"

CAT_CLAUDE_SETTINGS=$(cat << 'EOF'
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "./scripts/autonomous-gate.sh",
        "timeout": 120
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/destructive-git-guard.mjs\""
          }
        ]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/secret-leak-guard.mjs\""
          }
        ]
      }
    ]
  }
}
EOF
)

CLAUDE_SETTINGS="${CLAUDE_DIR}/settings.json"
if [ -f "$CLAUDE_SETTINGS" ]; then
  if command -v jq >/dev/null 2>&1; then
    jq -s '.[0] * .[1]' "$CLAUDE_SETTINGS" <(echo "$CAT_CLAUDE_SETTINGS") > "${CLAUDE_SETTINGS}.tmp" && mv "${CLAUDE_SETTINGS}.tmp" "$CLAUDE_SETTINGS"
  else
    echo "Warning: jq not found. Overwriting .claude/settings.json." >&2
    echo "$CAT_CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS"
  fi
else
  echo "$CAT_CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS"
fi

# 3. ガードレールは .claude/hooks/{secret-leak-guard,destructive-git-guard}.mjs (managed, git-worktree-isolation
# バンドルで配備済み) を使用する。簡易 .sh 版はここでは生成しない — managed 資産との重複/実装劣化を避けるため。

echo "Worktree environment setup completed successfully." >&2
