import { HelpCircle, Info, Lightbulb } from "lucide-react";

import type { ReactNode } from "react";

// 初見ユーザー向けの補足説明ボックス。html-artifacts の callout-box を
// Agent Guild の琥珀テーマ（--blue/--accent/--gold）に移植したもの。
type CalloutTone = "note" | "tip" | "help";

const TONE_ICON = {
  note: Info,
  tip: Lightbulb,
  help: HelpCircle
} as const;

interface CalloutProps {
  tone?: CalloutTone;
  title: string;
  children: ReactNode;
}

export default function Callout({ tone = "note", title, children }: CalloutProps) {
  const Icon = TONE_ICON[tone];
  return (
    <aside className={`callout callout-${tone}`}>
      <span className="callout-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="callout-body">
        <p className="callout-title">{title}</p>
        <div className="callout-text">{children}</div>
      </div>
    </aside>
  );
}
