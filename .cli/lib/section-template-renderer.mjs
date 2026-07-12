/**
 * section-template-renderer.mjs — pure Markdown section renderer shared by
 * worktree-plan-template.mjs (8-section PLAN.md) and worktree-ship-report.mjs
 * (11-section Pre-Ship Human Review Panel).
 *
 * 目的 (オプション C — エンジン共有 + データ分離、ユーザー決定): 両テンプレートのレンダリング *ロジック*は
 * 一つの純粋関数として共有しつつ、brief2dev 自身はデータを JS 定数(DEFAULT_*_SECTIONS)として
 * 保持し、ライブ shipping 経路にファイル I/O を追加しない。移植(transplant) 対象の
 * プロジェクトは、同じスキーマの JSON(data/registry/transplant-templates/*.generic.json)を
 * カスタマイズ用の seed として受け取る — brief2dev はその JSON を読まない。
 *
 * 5 つのプリミティブで両テンプレート(8 セクション/11 セクション)の既存出力を 100% 表現する:
 *   - static: 固定テキスト行 ({{var}} 置換に対応)
 *   - checklist_group: `### 副見出し` + `- [ ] item` のリスト
 *   - field_list: `- Label: value` のリスト (value は valueOrDash 処理)
 *   - fenced_block: ```lang\n<content または fallback>\n``` (trim オプション)
 *   - table: header 行 + rows_key 配列を row_template で展開 (空配列時は empty_rows)
 *
 * heading 行(`section.heading` または `checklist_group.subheading`) の前には、文書の先頭行
 * でない限り常に空行 1 個が自動挿入される — 元の両テンプレートともこの規則一つで全体の
 * blank-line 配置が説明できる。heading か否かは *構造*(どのフィールドから来たか)で判定し、
 * レンダリング後のテキスト内容を正規表現で再推論しない — static ブロックの本文テキストが
 * 偶然 `#` で始まっても(例: "# 参考" のような自由テキスト)、誤検知なくそのままレンダリングされる。
 *
 * 回帰: tests/unit/section-template-renderer.test.mjs。
 */

function interpolate(str, context) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(context, key) && context[key] !== undefined
      ? String(context[key])
      : '',
  );
}

function interpolateRow(template, row) {
  return template.replace(/\{(\w+)\}/g, (_, key) => valueOrDash(row ? row[key] : undefined));
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function renderStatic(block, context) {
  return (block.lines || []).map((line) => interpolate(line, context));
}

function renderFieldList(block, context) {
  return (block.fields || []).map((f) => `- ${f.label}: ${valueOrDash(context[f.key])}`);
}

function renderFencedBlock(block, context) {
  const raw = context[block.content_key];
  let content;
  if (block.trim) {
    content = typeof raw === 'string' && raw.trim() ? raw.trim() : block.fallback || '';
  } else {
    content = raw || block.fallback || '';
  }
  return [`\`\`\`${block.lang || 'text'}`, content, '```'];
}

function renderTable(block, context) {
  const source = context[block.rows_key];
  const rows = Array.isArray(source) && source.length > 0 ? source : block.empty_rows || [];
  return [...(block.header_lines || []), ...rows.map((row) => interpolateRow(block.row_template, row))];
}

const BLOCK_RENDERERS = {
  static: renderStatic,
  field_list: renderFieldList,
  fenced_block: renderFencedBlock,
  table: renderTable,
};

/**
 * block をレンダリングして `rawLines` に push し、heading として扱う行のインデックスを
 * `headingAt` に記録する。`checklist_group` の `subheading` のみが block レベルでの heading
 * 扱いの対象 — 他のブロックタイプは heading を生成しない(構造的な判定であり、テキストの正規表現ではない)。
 */
function appendBlockLines(block, context, rawLines, headingAt) {
  if (!block) return;
  if (block.type === 'checklist_group') {
    if (block.subheading) {
      headingAt.add(rawLines.length);
      rawLines.push(interpolate(block.subheading, context));
    }
    for (const item of block.items || []) rawLines.push(`- [ ] ${interpolate(item, context)}`);
    return;
  }
  const renderer = BLOCK_RENDERERS[block.type];
  if (renderer) rawLines.push(...renderer(block, context));
}

/**
 * sections 配列を Markdown 文字列にレンダリングする (trailing newline なし — 呼び出し側の責任)。
 * @param {Array<{heading?: string, blocks?: Array<object>}>} sections
 * @param {Record<string, unknown>} [context]
 * @returns {string}
 */
export function renderTemplateFromSections(sections, context = {}) {
  const rawLines = [];
  const headingAt = new Set();
  for (const section of sections || []) {
    if (section.heading) {
      headingAt.add(rawLines.length);
      rawLines.push(interpolate(section.heading, context));
    }
    for (const block of section.blocks || []) {
      appendBlockLines(block, context, rawLines, headingAt);
    }
  }
  const out = [];
  rawLines.forEach((line, idx) => {
    if (idx > 0 && headingAt.has(idx)) out.push('');
    out.push(line);
  });
  return out.join('\n');
}
