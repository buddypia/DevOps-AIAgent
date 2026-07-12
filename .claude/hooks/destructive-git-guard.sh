#!/bin/bash
# 破壊的 Git 操作ガード
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // .toolCall.args.CommandLine' 2>/dev/null)
if echo "$CMD" | grep -qE "git push.*--force|git reset --hard|git clean -fd|git rebase"; then
  echo '{"decision": "deny", "permissionDecision": "deny", "reason": "Destructive git command blocked by security guardrail!"}'
  exit 2
fi
exit 0
