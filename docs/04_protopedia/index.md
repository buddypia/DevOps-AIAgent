---
title: "ProtoPedia Helpcenter: index"
source_url: https://protopedia.gitbook.io/helpcenter
collected_at: 2026-05-11T19:23:26+09:00
source_type: "gitbook_markdown"
---

# Page Not Found

The URL `helpcenter` does not exist. This page may have been moved, renamed, or deleted.

## Suggested Pages

You may be looking for one of the following:
- [ProtoPediaのイベント作成](https://protopedia.gitbook.io/helpcenter/event.md)
- [はじめてのProtoPediaガイド](https://protopedia.gitbook.io/helpcenter/master.md)
- [ProtoPediaでできること①：クリエイター](https://protopedia.gitbook.io/helpcenter/cando1.md)
- [ProtoPediaでできること②：イベント運営者](https://protopedia.gitbook.io/helpcenter/cando2.md)
- [＋埋め込み機能](https://protopedia.gitbook.io/helpcenter/embed.md)

## How to find the correct page

If the exact page cannot be found, you can still retrieve the information using the documentation query interface.

### Option 1 — Ask a question (recommended)

Perform an HTTP GET request on the documentation index with the `ask` parameter:

```
GET https://protopedia.gitbook.io/helpcenter/event.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

### Option 2 — Browse the documentation index

Full index: https://protopedia.gitbook.io/helpcenter/sitemap.md

Use this to discover valid page paths or navigate the documentation structure.

### Option 3 — Retrieve the full documentation corpus

Full export: https://protopedia.gitbook.io/helpcenter/llms-full.txt

Use this to access all content at once and perform your own parsing or retrieval. It will be more expensive.

## Tips for requesting documentation

Prefer `.md` URLs for structured content, append `.md` to URLs (e.g., `/helpcenter/event.md`).

You may also use `Accept: text/markdown` header for content negotiation.
