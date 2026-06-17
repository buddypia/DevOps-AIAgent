---
title: "ProtoPedia Helpcenter: faq/account-merge"
source_url: https://protopedia.gitbook.io/helpcenter/faq/account-merge
collected_at: 2026-05-11T19:23:40+09:00
source_type: "gitbook_markdown"
---

# 複数アカウントを1つにまとめる

アカウントを複数作ってしまい、1つのアカウントにまとめたい場合、集約することができます。\
ただし、移行したい作品の数だけ対応が必要となり、以下のステップ①②を繰り返し行う形となります。

※削除したいアカウントをA、統合したいアカウントをBとします

**ステップ①：アカウントAとBを対象作品のメンバーにする**\
　・削除したいアカウントAにてログインする\
　・アカウントを差し替えたい対象の作品ページへアクセスする\
　・作品編集画面にアクセスし、アカウントBをメンバー追加する\
\
**ステップ②：削除したいアカウントAをメンバーから削除する**\
　・アカウントAでログインしたまま「設定＞[作品一覧](https://protopedia.net/settings/prototypes)」にアクセスする\
　・対象作品の右側の「…」をクリックし、削除するをクリックする

<figure><img src="/files/NiRppjuxZsCHgntmBABX" alt=""><figcaption></figcaption></figure>

　・削除ボタンを押す

<figure><img src="/files/VpVLUSaX3fYCmOTCUojb" alt="" width="375"><figcaption></figcaption></figure>

上記を対象作品の数だけ繰り返します。

<mark style="color:red;">**※注意）メンバー追加を必ず「先に」してください。メンバーが一人の際に削除ボタンを押すと作品が消えてしまいますので要注意です！**</mark>

---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://protopedia.gitbook.io/helpcenter/faq/account-merge.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
