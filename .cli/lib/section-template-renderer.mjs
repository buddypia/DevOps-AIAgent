/**
 * section-template-renderer.mjs — pure Markdown section renderer shared by
 * worktree-plan-template.mjs (8-section PLAN.md) and worktree-ship-report.mjs
 * (11-section Pre-Ship Human Review Panel).
 *
 * 목적 (옵션 C — 엔진 공유 + 데이터 분리, 사용자 결정): 두 템플릿의 렌더링 *로직*은
 * 하나의 순수 함수로 공유하되, brief2dev 자신은 데이터를 JS 상수(DEFAULT_*_SECTIONS)로
 * 유지해 라이브 shipping 경로에 파일 I/O 를 추가하지 않는다. 이식(transplant) 대상
 * 프로젝트는 같은 스키마의 JSON(data/registry/transplant-templates/*.generic.json)을
 * 커스터마이징 seed 로 받는다 — brief2dev 는 그 JSON 을 읽지 않는다.
 *
 * 5 프리미티브로 두 템플릿(8섹션/11섹션)의 기존 출력을 100% 표현한다:
 *   - static: 고정 텍스트 라인 ({{var}} 치환 지원)
 *   - checklist_group: `### 부제목` + `- [ ] item` 목록
 *   - field_list: `- Label: value` 목록 (value 는 valueOrDash 처리)
 *   - fenced_block: ```lang\n<content 또는 fallback>\n``` (trim 옵션)
 *   - table: header 라인 + rows_key 배열을 row_template 으로 전개 (빈 배열 시 empty_rows)
 *
 * heading 라인(`section.heading` 또는 `checklist_group.subheading`) 앞에는 문서 첫 줄이
 * 아닌 한 항상 빈 줄 1개가 자동 삽입된다 — 원본 두 템플릿 모두 이 규칙 하나로 전체
 * blank-line 배치가 설명된다. heading 여부는 *구조*(어느 필드에서 왔는지)로 판정하며
 * 렌더링된 텍스트 내용을 정규식으로 재추론하지 않는다 — static 블록의 본문 텍스트가
 * 우연히 `#`로 시작해도(예: "# 참고" 같은 자유 텍스트) 오탐 없이 그대로 렌더된다.
 *
 * 회귀: tests/unit/section-template-renderer.test.mjs.
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
 * block 을 렌더링해 `rawLines` 에 push 하고, heading 으로 취급할 라인의 인덱스를
 * `headingAt` 에 기록한다. `checklist_group` 의 `subheading` 만 block 레벨에서 heading
 * 취급 대상 — 다른 블록 타입은 heading 을 생성하지 않는다(구조적 판정, 텍스트 정규식 아님).
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
 * sections 배열을 Markdown 문자열로 렌더링한다 (trailing newline 없음 — 호출자 책임).
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
