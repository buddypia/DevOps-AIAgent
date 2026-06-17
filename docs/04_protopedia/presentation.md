---
title: "ProtoPedia Helpcenter: presentation"
source_url: https://protopedia.gitbook.io/helpcenter/presentation
collected_at: 2026-05-11T19:23:34+09:00
source_type: "gitbook_markdown"
---

# ＋プレゼンテーション機能

プレゼンテーションモードを使えば、登録内容をつかってそのままプレゼン可能です。

## 1.基本設定

1-1：作品編集画面で「スライドモード」にチェックする

![](/files/-MN6oXjZqprYUbyW8B5t)

1-2：チェックすると作品ページの右側に「プレゼンテーションを開始する」ボタンが出現します。

![](/files/-MN6ofSz-Wius9jvmkZu)

1-3：ボタンを押すと、プレゼンテーションモードに切り替わります。\
　　例）<https://protopedia.net/prototype/slide/1946#/>\ <br>

**＜プレゼンテーションモードの構成＞**\
プレゼンテーションは、ProtoPediaで登録した「」にある情報を、以下のような順序で表示していきます。\
①表紙：「作品名」と「チーム名」を表示\
　＋\
②作品説明：「ストーリー」入力部分を表示\
　＋\
③システム構成：「システム構成画像」＋「システム構成説明文」を表示

## **2.プレゼン資料の作成**

ストーリーやシステム構成説明文は「markdown」や「html」にて記載ください。

**・markdown によるプレゼン資料の作成**\
セクション(ページ)の区切りは `---` で区切ります。（前後に空行が必要です）\
その他は[こちら](https://protopedia.gitbook.io/helpcenter/markdown)を参照ください。\
\
\&#xNAN;**・htmlによるプレゼン資料の作成**\
マークダウンで表現できない、画像サイズの調整などは、html記法で作成ください。

**・その他**\
背景色の設定の設定も可能です。\
\<!-- .slide: data-background="#000000" -->

例えばこんなかんじです。

```bash
<!-- .slide: data-background="#de1241" -->
ヒーローズ・リーグ オンライン2020にエントリーされた全ての作品を使ったビンゴゲームです。

---

<!-- .slide: data-background="#de1241" -->
### 応募作品を使ってビンゴを実施！

<img src="https://we-are-ma.jp/wp2/wp-content/uploads/2020/11/image.png" alt="BINGO" height="300">

ヒーローズ・ビンゴは、自分が選んだ作品をうめていき、受賞したらあなをあけられます。縦、横、斜めにそろったらビンゴ！
```

実際のスライドの見え方はこちらを参照ください。\
<https://protopedia.net/prototype/slide/2089#/>

＊TIPS＊\
画像のアップロード先にお困りの方\
　＞[GitHubを利用する](https://note.com/npaka/n/n9040538e2edd)

## **3.PDF ファイルでのエクスポート**

1. print-pdf をクエリ文字列に含めてプレゼンテーションを開きます。

　例：[https://protopedia.net/prototype/slide/2089?print-pdf](https://protopedia.net/prototype/slide/1946?print-pdf)

2.ブラウザ内の印刷ダイアログを開きます（CTRL / CMD + P）。

3.\[保存先]設定を\[ PDFとして保存]に変更<br>

---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://protopedia.gitbook.io/helpcenter/presentation.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
