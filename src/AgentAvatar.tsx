import { useState } from "react";

// Gemini画像生成 (scripts/generate_agent_art.mjs) で作成したポートレート。
// 画像が無い環境でもイニシャルアバターへフォールバックする。
export function agentPortraitUrl(agentId: string): string {
  return `/assets/agents/${agentId}.png`;
}

interface AgentAvatarProps {
  agentId: string;
  name: string;
  color: string;
  size?: number;
}

export default function AgentAvatar({ agentId, name, color, size = 40 }: AgentAvatarProps) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="agent-avatar-fallback" style={{ background: color, width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      className="agent-avatar-img"
      src={agentPortraitUrl(agentId)}
      alt={`${name} のポートレート`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
