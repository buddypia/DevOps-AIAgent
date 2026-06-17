#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import textwrap
import time
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from markdownify import markdownify as html_to_markdown
import trafilatura


ROOT = "https://findy.notion.site/devops-ai-agent-hackathon-2026"
NOTION_PAGE_ID = "32a04bf5-e7e4-8067-86f2-c871e8b6cb00"
NOTION_SPACE_ID = "0ffe0496-1ca2-4424-8f3f-5e99f120c278"
BASE = Path(__file__).resolve().parents[1]
DOCS = BASE / "docs"
RAW = BASE / "raw"
USER_AGENT = "Mozilla/5.0 (compatible; HackathonDocsCollector/1.0)"


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def ensure_dirs() -> None:
    for path in [
        DOCS / "00_overview",
        DOCS / "01_hackathon",
        DOCS / "02_google_cloud_bootcamp" / "events",
        DOCS / "03_submission",
        DOCS / "04_protopedia",
        DOCS / "05_external",
        RAW / "notion",
        RAW / "cloudonair",
        RAW / "forms",
        RAW / "findy",
        RAW / "protopedia",
        RAW / "external",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def fetch_bytes(url: str, *, method: str = "GET", data: bytes | None = None, timeout: int = 60) -> bytes:
    req = Request(url, data=data, method=method, headers={"User-Agent": USER_AGENT})
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=timeout) as response:
        return response.read()


def fetch_text(url: str, *, method: str = "GET", data: bytes | None = None, timeout: int = 60) -> str:
    raw = fetch_bytes(url, method=method, data=data, timeout=timeout)
    return raw.decode("utf-8", errors="replace")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def slugify(value: str, fallback: str = "document") -> str:
    value = re.sub(r"https?://", "", value)
    value = re.sub(r"[^0-9A-Za-z._-]+", "-", value).strip("-._")
    return value.lower()[:100] or fallback


def clean_md(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    return "\n".join(line.rstrip() for line in text.strip().splitlines())


def frontmatter(title: str, source_url: str, extra: dict[str, Any] | None = None) -> str:
    lines = [
        "---",
        f'title: "{title.replace(chr(34), chr(39))}"',
        f"source_url: {source_url}",
        f"collected_at: {now_iso()}",
    ]
    for key, value in (extra or {}).items():
        rendered = json.dumps(value, ensure_ascii=False)
        lines.append(f"{key}: {rendered}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def rich_text(parts: list[Any] | None) -> str:
    if not parts:
        return ""
    out: list[str] = []
    for part in parts:
        if not part:
            continue
        text = str(part[0]).replace("\n", "\n")
        annotations = part[1] if len(part) > 1 and isinstance(part[1], list) else []
        link = None
        bold = italic = code = False
        for annotation in annotations:
            if not annotation:
                continue
            kind = annotation[0]
            if kind == "a" and len(annotation) > 1:
                link = annotation[1]
            elif kind == "b":
                bold = True
            elif kind == "_":
                italic = True
            elif kind == "c":
                code = True
        escaped = text
        if code:
            escaped = f"`{escaped}`"
        if bold:
            escaped = f"**{escaped}**"
        if italic:
            escaped = f"*{escaped}*"
        if link:
            escaped = f"[{escaped}]({link})"
        out.append(escaped)
    return "".join(out)


def block_title(block: dict[str, Any]) -> str:
    return rich_text((block.get("properties") or {}).get("title"))


def notion_image_url(block_id: str, block: dict[str, Any]) -> str:
    props = block.get("properties") or {}
    source = ""
    if props.get("source"):
        source = rich_text(props.get("source"))
    source = source or (block.get("format") or {}).get("display_source", "")
    if source.startswith("http"):
        return source
    if source.startswith("attachment:"):
        encoded = quote(source, safe="")
        return f"https://findy.notion.site/image/{encoded}?table=block&id={block_id}&spaceId={NOTION_SPACE_ID}&cache=v2"
    return source


def render_table(block: dict[str, Any], blocks: dict[str, dict[str, Any]]) -> str:
    order = (block.get("format") or {}).get("table_block_column_order") or []
    rows: list[list[str]] = []
    for row_id in block.get("content") or []:
        row = blocks.get(row_id)
        if not row:
            continue
        props = row.get("properties") or {}
        if not order:
            order = list(props)
        rows.append([rich_text(props.get(column)) for column in order])
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    rows = [row + [""] * (width - len(row)) for row in rows]
    header = rows[0]
    body = rows[1:]
    lines = [
        "| " + " | ".join(cell or " " for cell in header) + " |",
        "| " + " | ".join("---" for _ in header) + " |",
    ]
    lines.extend("| " + " | ".join(cell or " " for cell in row) + " |" for row in body)
    return "\n".join(lines)


def render_notion_block(block_id: str, blocks: dict[str, dict[str, Any]], depth: int = 0) -> str:
    block = blocks.get(block_id)
    if not block:
        return ""
    btype = block.get("type")
    title = block_title(block)
    children = [render_notion_block(child, blocks, depth + 1) for child in block.get("content") or []]
    child_md = "\n\n".join(part for part in children if part.strip())
    prefix = "  " * depth

    if btype == "page":
        return f"# {title}\n\n{child_md}".strip()
    if btype == "header":
        return f"## {title}\n\n{child_md}".strip()
    if btype == "sub_header":
        return f"### {title}\n\n{child_md}".strip()
    if btype in {"sub_sub_header", "header_4"}:
        return f"#### {title}\n\n{child_md}".strip()
    if btype == "tab":
        return child_md
    if btype == "text":
        if child_md and title:
            return f"## {title}\n\n{child_md}".strip() if depth <= 2 else f"{title}\n\n{child_md}".strip()
        return title or child_md
    if btype == "bulleted_list":
        main = f"{prefix}- {title}" if title else ""
        return "\n".join(part for part in [main, child_md] if part.strip()).strip()
    if btype == "numbered_list":
        main = f"{prefix}1. {title}" if title else ""
        return "\n".join(part for part in [main, child_md] if part.strip()).strip()
    if btype == "toggle":
        return f"#### {title}\n\n{child_md}".strip()
    if btype == "callout":
        if title:
            body = "\n\n".join(part for part in [title, child_md] if part.strip())
        else:
            body = child_md
        return "\n".join("> " + line if line else ">" for line in body.splitlines()).strip()
    if btype == "table":
        return render_table(block, blocks)
    if btype == "image":
        image_title = title or "image"
        url = notion_image_url(block_id, block)
        caption = rich_text((block.get("properties") or {}).get("caption"))
        line = f"![{image_title}]({url})" if url else f"![{image_title}]()"
        return f"{line}\n\n{caption}".strip() if caption else line
    if btype in {"divider"}:
        return "---"
    if btype in {"column_list", "column"}:
        return child_md
    return "\n\n".join(part for part in [title, child_md] if part.strip()).strip()


def collect_notion() -> tuple[Path, list[dict[str, str]], dict[str, Any]]:
    url = "https://findy.notion.site/api/v3/loadPageChunk"
    cursor: dict[str, Any] = {"stack": []}
    blocks: dict[str, dict[str, Any]] = {}
    chunk_stats = []

    for chunk in range(30):
        payload = json.dumps(
            {
                "pageId": NOTION_PAGE_ID,
                "limit": 100,
                "cursor": cursor,
                "chunkNumber": chunk,
                "verticalColumns": False,
            }
        ).encode()
        data = json.loads(fetch_text(url, method="POST", data=payload))
        write_json(RAW / "notion" / f"chunk_{chunk}.json", data)
        block_map = data.get("recordMap", {}).get("block", {})
        for block_id, wrapper in block_map.items():
            value = wrapper.get("value", {}).get("value")
            if value:
                blocks[block_id] = value
        chunk_stats.append({"chunk": chunk, "blocks": len(block_map), "total": len(blocks)})
        cursor = data.get("cursor") or {}
        if not cursor.get("stack"):
            break

    sync_url = "https://www.notion.so/api/v3/syncRecordValues"
    round_index = 0
    while True:
        missing: list[str] = []
        for block in list(blocks.values()):
            for child in block.get("content") or []:
                if child not in blocks and child not in missing:
                    missing.append(child)
        if not missing:
            break
        for batch_index in range(0, len(missing), 50):
            batch = missing[batch_index : batch_index + 50]
            payload = json.dumps(
                {
                    "requests": [
                        {"pointer": {"table": "block", "id": block_id}, "version": -1}
                        for block_id in batch
                    ],
                    "version": 2,
                }
            ).encode()
            data = json.loads(fetch_text(sync_url, method="POST", data=payload))
            write_json(RAW / "notion" / f"sync_{round_index}_{batch_index // 50}.json", data)
            for block_id, wrapper in data.get("recordMap", {}).get("block", {}).items():
                value = wrapper.get("value", {}).get("value")
                if value:
                    blocks[block_id] = value
            time.sleep(0.15)
        round_index += 1
        if round_index > 20:
            raise RuntimeError("Notion recursive sync did not converge")

    write_json(RAW / "notion" / "merged_blocks.json", blocks)

    links: list[dict[str, str]] = []
    for block_id, block in blocks.items():
        props = block.get("properties") or {}
        for prop_value in props.values():
            if not isinstance(prop_value, list):
                continue
            for part in prop_value:
                if not part:
                    continue
                text = str(part[0])
                annotations = part[1] if len(part) > 1 and isinstance(part[1], list) else []
                for annotation in annotations:
                    if annotation and annotation[0] == "a" and len(annotation) > 1:
                        links.append(
                            {
                                "block_id": block_id,
                                "block_type": block.get("type", ""),
                                "text": text,
                                "url": annotation[1],
                            }
                        )

    body = render_notion_block(NOTION_PAGE_ID, blocks)
    md = frontmatter(
        "DevOps x AI Agent Hackathon Notion",
        ROOT,
        {
            "source_type": "notion_public_api",
            "block_count": len(blocks),
            "chunk_stats": chunk_stats,
        },
    )
    md += textwrap.dedent(
        """
        > This file was generated from the public Notion block data because generic HTML extraction only returned the first part of the page.

        ## Source Links
        """
    ).strip()
    md += "\n\n"
    for link in links:
        md += f"- [{link['text']}]({link['url']})\n"
    md += "\n---\n\n" + body
    out = DOCS / "01_hackathon" / "devops_ai_agent_hackathon_notion.md"
    write_text(out, clean_md(md))
    return out, links, {"block_count": len(blocks), "types": Counter(block.get("type") for block in blocks.values())}


def markdown_from_html_fragment(fragment: str) -> str:
    if not fragment:
        return ""
    return clean_md(html_to_markdown(fragment, heading_style="ATX"))


def collect_cloudonair() -> list[Path]:
    paths: list[Path] = []
    page_url = "https://cloudonair.withgoogle.com/handson-collection-26q2"
    page_data = json.loads(fetch_text("https://cloudonair.withgoogle.com/api/pages/handson-collection-26q2"))
    write_json(RAW / "cloudonair" / "collection_page.json", page_data)

    collection_id = str(page_data["collection"]["id"])
    events_data = json.loads(
        fetch_text(f"https://cloudonair.withgoogle.com/api/events?collection={collection_id}&page_size=100")
    )
    write_json(RAW / "cloudonair" / "collection_events.json", events_data)
    events = sorted(events_data.get("events", []), key=lambda event: event.get("start", ""))

    collection_md = frontmatter("Agentic AI Bootcamp 2026 Spring", page_url, {"source_type": "cloudonair_api"})
    hero = page_data.get("hero", {})
    collection_md += "# Agentic AI Bootcamp 2026 Spring\n\n"
    collection_md += f"Source: {page_url}\n\n"
    collection_md += f"{hero.get('description') or page_data.get('social_metadata', {}).get('description', '')}\n\n"
    collection_md += "## Sessions\n\n"
    for event in events:
        event_url = f"https://cloudonair.withgoogle.com/events/{event['url_slug']}"
        collection_md += f"- [{event['name']}]({event_url}) ({event.get('start')} - {event.get('end')})\n"
    out = DOCS / "02_google_cloud_bootcamp" / "agentic_ai_bootcamp_2026_spring.md"
    write_text(out, clean_md(collection_md))
    paths.append(out)

    for event in events:
        slug = event["url_slug"]
        detail = json.loads(fetch_text(f"https://cloudonair.withgoogle.com/api/events/{slug}"))
        write_json(RAW / "cloudonair" / f"{slug}.json", detail)
        event_url = f"https://cloudonair.withgoogle.com/events/{slug}"
        md = frontmatter(detail.get("name", slug), event_url, {"source_type": "cloudonair_event_api"})
        md += f"# {detail.get('name', slug)}\n\n"
        md += f"- URL: {event_url}\n"
        md += f"- Start: {detail.get('start')}\n"
        md += f"- End: {detail.get('end')}\n"
        md += f"- Timezone: {detail.get('timezone')}\n"
        md += f"- Location: {'online' if detail.get('digital') else detail.get('physical_location', '')}\n"
        md += f"- Fee: free / registration required (as described by source)\n\n"
        md += "## Description\n\n"
        md += markdown_from_html_fragment(detail.get("description") or "")
        md += "\n\n## Talks\n\n"
        for talk in detail.get("talks") or []:
            md += f"### {talk.get('name', talk.get('id'))}\n\n"
            md += f"- Talk ID: {talk.get('id')}\n"
            md += f"- Slug: {talk.get('url_slug')}\n"
            md += f"- Start: {talk.get('start')}\n"
            md += f"- End: {talk.get('end')}\n"
            if talk.get("description") or talk.get("description_html"):
                md += "\n"
                md += markdown_from_html_fragment(talk.get("description_html") or talk.get("description") or "")
            md += "\n\n"
        out = DOCS / "02_google_cloud_bootcamp" / "events" / f"{slug}.md"
        write_text(out, clean_md(md))
        paths.append(out)
    return paths


def extract_next_flight_strings(html: str) -> str:
    chunks = []
    for match in re.finditer(r"self\.__next_f\.push\(\[1,((?:\"(?:\\.|[^\"\\])*\")|null)\]\)", html):
        literal = match.group(1)
        if literal == "null":
            continue
        try:
            chunks.append(json.loads(literal))
        except json.JSONDecodeError:
            continue
    return "".join(chunks)


def collect_findy_registration() -> Path:
    url = "https://conference.findy-code.io/conferences/DevOps-AI-Agent-Hackathon/30/registration"
    html = fetch_text(url)
    write_text(RAW / "findy" / "registration.html", html)
    soup = BeautifulSoup(html, "html.parser")
    title = soup.find("title").get_text(" ", strip=True) if soup.find("title") else "Findy registration"
    description = ""
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        description = meta["content"]
    flight = extract_next_flight_strings(html)
    terms = ""
    privacy = ""
    terms_match = re.search(r"17:T[0-9a-f]+,(.*?)(?:18:T[0-9a-f]+,)", flight, flags=re.S)
    privacy_match = re.search(r"18:T[0-9a-f]+,(.*?)(?:9:\[)", flight, flags=re.S)
    if terms_match:
        terms = terms_match.group(1)
    if privacy_match:
        privacy = privacy_match.group(1)
    write_text(RAW / "findy" / "registration_flight.txt", flight)

    md = frontmatter(title, url, {"source_type": "nextjs_rsc_html"})
    md += f"# {title}\n\n{description}\n\n"
    md += "## Registration Summary\n\n"
    md += "- Event: DevOps x AI Agent Hackathon\n"
    md += "- Registration requires a Findy Tools account.\n"
    md += "- Team participation still requires each member to register individually, according to the embedded registration introduction.\n"
    md += "- Contact form: https://forms.gle/YepDVdT6RuLSBmHy5\n"
    md += "- Login URL: https://findy-tools.io/sign_in_conference?cr=%2Fconferences%2FDevOps-AI-Agent-Hackathon%2F30%2Fregistration\n\n"
    md += "## Required Profile Fields\n\n"
    md += "- Company name, department, employee size, job position, job type, industry, phone number, and work email are requested by the form setting.\n\n"
    md += "## Terms Of Service\n\n"
    md += (terms.strip() or "_Could not extract terms text._")
    md += "\n\n## Privacy Policy For This Event\n\n"
    md += (privacy.strip() or "_Could not extract privacy text._")
    out = DOCS / "03_submission" / "findy_conference_registration.md"
    write_text(out, clean_md(md))
    return out


def parse_google_form(html: str) -> dict[str, Any]:
    match = re.search(r"var FB_PUBLIC_LOAD_DATA_ = (.*?);</script>", html, flags=re.S)
    if not match:
        raise RuntimeError("FB_PUBLIC_LOAD_DATA_ was not found")
    data = json.loads(match.group(1))
    form = data[1]
    questions = []
    for item in form[1] or []:
        question = {
            "id": item[0],
            "title": item[1],
            "description": BeautifulSoup(item[2] or "", "html.parser").get_text("\n", strip=True) if item[2] else "",
            "type": item[3],
            "required": bool(item[4] and item[4][0] and item[4][0][2]),
        }
        questions.append(question)
    return {
        "title": form[8],
        "description": form[0] or "",
        "questions": questions,
    }


def collect_google_forms() -> list[Path]:
    forms = [
        (
            "google_form_inquiry.md",
            "https://docs.google.com/forms/d/e/1FAIpQLScUZWD-DxquxRPogIpt92k02Z4tVJyiZ6WEI7eOisbu9OXk9g/viewform",
        ),
        (
            "google_form_final_submission.md",
            "https://docs.google.com/forms/d/e/1FAIpQLScYR-nIwo2Fglx1Srlui2dDt5rN_iIS6YYeLfMrRHvUpoMuFg/viewform",
        ),
    ]
    type_names = {0: "short_answer", 1: "paragraph", 2: "multiple_choice", 3: "dropdown", 4: "checkboxes"}
    paths: list[Path] = []
    for filename, url in forms:
        html = fetch_text(url)
        write_text(RAW / "forms" / filename.replace(".md", ".html"), html)
        parsed = parse_google_form(html)
        write_json(RAW / "forms" / filename.replace(".md", ".json"), parsed)
        md = frontmatter(parsed["title"], url, {"source_type": "google_forms_public_data"})
        md += f"# {parsed['title']}\n\n"
        md += "## Description\n\n"
        md += parsed["description"].strip() + "\n\n"
        md += "## Questions\n\n"
        for index, question in enumerate(parsed["questions"], 1):
            required = "required" if question["required"] else "optional"
            md += f"{index}. **{question['title']}** ({type_names.get(question['type'], question['type'])}, {required})\n"
            if question["description"]:
                md += f"   - Note: {question['description']}\n"
        out = DOCS / "03_submission" / filename
        write_text(out, clean_md(md))
        paths.append(out)
    return paths


def collect_protopedia_helpcenter() -> list[Path]:
    sitemap = fetch_text("https://protopedia.gitbook.io/helpcenter/sitemap-pages.xml")
    write_text(RAW / "protopedia" / "sitemap-pages.xml", sitemap)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ET.fromstring(sitemap)
    urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]
    paths: list[Path] = []
    for url in urls:
        md_url = url.rstrip("/") + ".md"
        try:
            body = fetch_text(md_url)
        except Exception as exc:
            body = f"# Fetch failed\n\nCould not fetch `{md_url}`: {exc}"
        slug = urlparse(url).path.removeprefix("/helpcenter").strip("/") or "index"
        out = DOCS / "04_protopedia" / f"{slugify(slug)}.md"
        doc = frontmatter(f"ProtoPedia Helpcenter: {slug}", url, {"source_type": "gitbook_markdown"})
        doc += body
        write_text(out, clean_md(doc))
        paths.append(out)
        time.sleep(0.1)
    return paths


def generic_markdown(url: str, title: str | None = None) -> tuple[str, str]:
    downloaded = trafilatura.fetch_url(url)
    extracted = trafilatura.extract(downloaded, include_links=True, include_images=False, output_format="markdown") if downloaded else None
    page_title = title or url
    description = ""
    if downloaded:
        soup = BeautifulSoup(downloaded, "html.parser")
        if soup.find("title"):
            page_title = title or soup.find("title").get_text(" ", strip=True)
        meta = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta and meta.get("content"):
            description = meta["content"]
    body = extracted or description or "_No extractable body was found. The source may require JavaScript or login._"
    return page_title, body


def collect_external_pages(urls: list[str]) -> list[Path]:
    include = {
        "https://findy.co.jp/",
        "https://findy.co.jp/company/",
        "https://findy.co.jp/privacy/",
        "https://findy-tools.io/terms",
        "https://protopedia.net/",
    }
    paths: list[Path] = []
    for url in sorted(include):
        try:
            title, body = generic_markdown(url)
            write_text(RAW / "external" / f"{slugify(url)}.txt", body)
            md = frontmatter(title, url, {"source_type": "trafilatura"})
            md += f"# {title}\n\n{body}"
        except Exception as exc:
            md = frontmatter(url, url, {"source_type": "fetch_error"})
            md += f"# {url}\n\nFetch failed: {exc}"
        out = DOCS / "05_external" / f"{slugify(url)}.md"
        write_text(out, clean_md(md))
        paths.append(out)
        time.sleep(0.1)
    return paths


def build_index(all_paths: list[Path], notion_links: list[dict[str, str]]) -> Path:
    collected = sorted(str(path.relative_to(BASE)) for path in all_paths)
    unique_links = []
    seen = set()
    for link in notion_links:
        url = link["url"]
        if url in seen:
            continue
        seen.add(url)
        unique_links.append(link)

    skipped = []
    for link in unique_links:
        url = link["url"]
        if url.startswith("mailto:"):
            skipped.append((url, "email address, recorded as link only"))
        elif "x.com/" in url:
            skipped.append((url, "judge social profile, not a hackathon document"))
        elif "conference.findy-code.io/preview/" in url:
            skipped.append((url, "preview duplicate of the public registration page"))

    md = frontmatter("Hackathon document index", ROOT, {"source_type": "generated_index"})
    md += "# DevOps x AI Agent Hackathon Document Index\n\n"
    md += "This directory contains Markdown versions of the hackathon page and linked documents that are useful for AI-assisted development.\n\n"
    md += "## Collected Files\n\n"
    for path in collected:
        md += f"- `{path}`\n"
    md += "\n## Links Found In The Notion Page\n\n"
    for link in unique_links:
        md += f"- {link['text']}: {link['url']}\n"
    md += "\n## Link Scope Notes\n\n"
    if skipped:
        for url, reason in skipped:
            md += f"- Skipped `{url}`: {reason}.\n"
    else:
        md += "- No link was intentionally skipped.\n"
    md += "\n## Source Coverage\n\n"
    md += "- Notion page: full public block tree including toggles was fetched and rendered.\n"
    md += "- Google Cloud Bootcamp: collection metadata and all 7 session event records were fetched through the public CloudOnAir API.\n"
    md += "- Findy registration: public registration HTML, embedded event terms, and event privacy text were extracted.\n"
    md += "- Google Forms: public form metadata and all visible question definitions were extracted.\n"
    md += "- ProtoPedia: all GitBook helpcenter pages listed in its sitemap were fetched as Markdown.\n"
    md += "- External pages: Findy, Findy privacy, Findy Tools terms, and ProtoPedia top page were saved when extractable.\n"

    out = DOCS / "INDEX.md"
    write_text(out, clean_md(md))
    return out


def main() -> None:
    ensure_dirs()
    all_paths: list[Path] = []
    notion_path, notion_links, notion_stats = collect_notion()
    all_paths.append(notion_path)
    all_paths.extend(collect_cloudonair())
    all_paths.append(collect_findy_registration())
    all_paths.extend(collect_google_forms())
    all_paths.extend(collect_protopedia_helpcenter())
    all_paths.extend(collect_external_pages([link["url"] for link in notion_links]))
    index = build_index(all_paths, notion_links)
    all_paths.append(index)
    manifest = {
        "collected_at": now_iso(),
        "root_url": ROOT,
        "notion": notion_stats,
        "files": sorted(str(path.relative_to(BASE)) for path in all_paths),
        "notion_links": notion_links,
    }
    write_json(DOCS / "manifest.json", manifest)
    print(json.dumps({"files": len(all_paths), "index": str(index), "manifest": "docs/manifest.json"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
