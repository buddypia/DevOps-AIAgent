#!/bin/bash
# scripts/setup-worktree-env.sh
# ワークツリー初期化時に実行し、Codex/Antigravity/Claude Code 向けのフック設定ファイルを自動配備・マージする。

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# フック設定ファイルの出力先
HOOKS_JSON="${PROJECT_ROOT}/hooks.json"
CODEX_DIR="${PROJECT_ROOT}/.codex"
CLAUDE_DIR="${PROJECT_ROOT}/.claude"

# スクリプトの実行権限を保証
chmod +x "${PROJECT_ROOT}/scripts/autonomous-gate.sh"

# 1. Codex / Antigravity 向けの hooks.json の生成/マージ
# Stop フックに scripts/autonomous-gate.sh を追加。
# PreToolUse フックに secret-leak-guard や destructive-git-guard などを配備する。
echo "Generating hooks.json for Codex/Antigravity..." >&2

CAT_HOOKS_JSON=$(cat << 'EOF'
{
  "safety-gate": {
    "enabled": true,
    "Stop": [
      {
        "type": "command",
        "command": "./scripts/autonomous-gate.sh",
        "timeout": 120
      }
    ]
  },
  "secret-leak-guard": {
    "enabled": true,
    "PreToolUse": [
      {
        "matcher": "write_to_file|replace_file_content|multi_replace_file_content",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/secret-leak-guard.sh"
          }
        ]
      }
    ]
  },
  "destructive-git-guard": {
    "enabled": true,
    "PreToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/destructive-git-guard.sh"
          }
        ]
      }
    ]
  }
}
EOF
)

# 既存の hooks.json とマージ
if [ -f "$HOOKS_JSON" ]; then
  # jq があればマージ
  if command -v jq >/dev/null 2>&1; then
    jq -s '.[0] * .[1]' "$HOOKS_JSON" <(echo "$CAT_HOOKS_JSON") > "${HOOKS_JSON}.tmp" && mv "${HOOKS_JSON}.tmp" "$HOOKS_JSON"
  else
    echo "Warning: jq not found. Overwriting hooks.json." >&2
    echo "$CAT_HOOKS_JSON" > "$HOOKS_JSON"
  fi
else
  echo "$CAT_HOOKS_JSON" > "$HOOKS_JSON"
fi

# .codex ディレクトリ用の hooks.json にもコピー
mkdir -p "$CODEX_DIR"
cp "$HOOKS_JSON" "${CODEX_DIR}/hooks.json"

# 2. Claude Code 向けの .claude/settings.json の生成/マージ
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
            "command": "./.claude/hooks/destructive-git-guard.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/secret-leak-guard.sh"
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

# 3. ガードレール用のスクリプト配備
mkdir -p "${CLAUDE_DIR}/hooks"
SECRET_GUARD_PATH="${CLAUDE_DIR}/hooks/secret-leak-guard.sh"
if [ ! -f "$SECRET_GUARD_PATH" ]; then
  cat << 'EOF' > "$SECRET_GUARD_PATH"
#!/bin/bash
# シークレット漏洩ガード
INPUT=$(cat)
# APIキーらしき文字列 (AIzaSy..., Slack xoxb..., プライベートキーなど) が含まれていたらブロック
if echo "$INPUT" | grep -qE "AIzaSy[A-Za-z0-9_\-]{35}|xox[bap]-[0-9]+-[0-9]+-[a-zA-Z0-9]+|\-\-\-\-BEGIN[ A-Z]*PRIVATE KEY\-\-\-\-"; then
  echo '{"decision": "deny", "permissionDecision": "deny", "reason": "Security leak detected: Google Cloud or Slack API secret key found in tool input!"}'
  exit 2
fi
exit 0
EOF
  chmod +x "$SECRET_GUARD_PATH"
fi

GIT_GUARD_PATH="${CLAUDE_DIR}/hooks/destructive-git-guard.sh"
if [ ! -f "$GIT_GUARD_PATH" ]; then
  cat << 'EOF' > "$GIT_GUARD_PATH"
#!/bin/bash
# 破壊的 Git 操作ガード
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // .toolCall.args.CommandLine' 2>/dev/null)
if echo "$CMD" | grep -qE "git push.*--force|git reset --hard|git clean -fd|git rebase"; then
  echo '{"decision": "deny", "permissionDecision": "deny", "reason": "Destructive git command blocked by security guardrail!"}'
  exit 2
fi
exit 0
EOF
  chmod +x "$GIT_GUARD_PATH"
fi

echo "Worktree environment setup completed successfully." >&2
