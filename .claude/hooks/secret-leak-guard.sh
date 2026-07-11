#!/bin/bash
# シークレット漏洩ガード
INPUT=$(cat)
# APIキーらしき文字列 (AIzaSy..., Slack xoxb..., プライベートキーなど) が含まれていたらブロック
if echo "$INPUT" | grep -qE "AIzaSy[A-Za-z0-9_\-]{35}|xox[bap]-[0-9]+-[0-9]+-[a-zA-Z0-9]+|\-\-\-\-BEGIN[ A-Z]*PRIVATE KEY\-\-\-\-"; then
  echo '{"decision": "deny", "permissionDecision": "deny", "reason": "Security leak detected: Google Cloud or Slack API secret key found in tool input!"}'
  exit 2
fi
exit 0
