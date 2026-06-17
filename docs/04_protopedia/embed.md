---
title: "ProtoPedia Helpcenter: embed"
source_url: https://protopedia.gitbook.io/helpcenter/embed
collected_at: 2026-05-11T19:23:33+09:00
source_type: "gitbook_markdown"
---

# ＋埋め込み機能

システム説明、ストーリー枠は、URL記述でコンテンツが自動で埋め込まれます。\
外部サービスを利用しながら、作品の魅力をより伝えてみてください。\
自動で埋め込まれるサービスは、Twitter、Flickr、You Tubeなどの一部のサービスとなります。\
以下に利用例を上げておりますが、対応サービスの全てではありません。\
\
\&#xNAN;**✔URL入力で自動変換 例**\
・Twitter（動画）→例：[スタックチャンフラワー](https://protopedia.net/prototype/3035) \
・YouTube（動画）→例：[M5Stackがスタックできる超音波風速計](https://protopedia.net/prototype/3286)\
・Flickr（写真）→例：[MashupAwards2017](https://protopedia.net/prototype/541) \
・SlideShare（プレゼン資料）→例：[崩壊地名API ](https://protopedia.net/prototype/88)\
・speakerdeck（プレゼン資料）　→例：[由来のわかる地名カルタ「言の場」](https://protopedia.net/prototype/2312)\
・CARTO（地図）→例：[滝を求めて三千里](https://protopedia.net/prototype/2121) \
・MakeCode（コード）→例：[ブーブードライブシステム](https://protopedia.net/prototype/3252)\
・Googleドライブのファイル　→例：[Diorama Shooting](https://protopedia.net/prototype/1956)

~~**✔埋め込みコード作成ツールを利用した例**~~ 　\
~~・togetter →例：~~[~~スタックチャン~~](https://protopedia.net/prototype/2345) 　\
~~・scratch →例：~~[~~神様クエスト~~](https://protopedia.net/prototype/2231)\
　※セキュリティ強化対策のため表示されなくなりました（2025.8.25）

## 1.動画を追加

誰かに触ってもらっている動画を見せると、より作品が伝わりやすいですよね。\
展示会などで、他の人が撮影し[Twitter](https://twitter.com/?lang=ja)にアップしてくれた動画も、URLを貼るだけで動画が埋め込まれます。そのまま「いいね」してもらえるメリットも！？\
また、動画枠に登録した動画以外で見てもらいたい動画がある場合は、動画共有サイトのURLを貼るだけでストーリー部分に掲載できます。\
[YouTube](https://www.youtube.com/?hl=ja)、[Vimeo](https://vimeo.com/jp/upgrade)、[ニコニコ](https://www.nicovideo.jp/)動画に対応。\
\
・Twitter埋め込み事例＞[スタックチャン フラワー](https://protopedia.net/prototype/3035)

![](/files/lsNYsPeoVjgd9smHEZc0)

## 2.写真を追加

写真共有サイトのURLを貼るだけで写真が掲載できます。[Flickr](https://www.flickr.com/)、[Pinterest](https://www.pinterest.jp/)に対応。\
[Twitter](https://twitter.com/?lang=ja)に投稿された画像も同様に掲載可能です。（その場合コメントも掲載されます）\
　\
・Flickr埋め込み事例＞[MashupAwards 2017](https://protopedia.net/prototype/541)

![](/files/-Mi0BoBGNjOu4e1aKlG-)

## 3.プレゼン資料を掲載

プレゼン資料共有サイトのURLを埋め込むと、ProtoPedia上で内容を確認でき、図解などを利用して、ビジュアル的に伝えやすくなります。\
[Speaker Deck](https://speakerdeck.com/)、[SlideShare](https://www.slideshare.net/)に対応。\
\
・SlideShare埋め込み事例＞[崩壊地名API](https://protopedia.net/prototype/88)

![](/files/-Mi09TCHIqCjHRAh4Rj4)

※ProtoPediaにも[プレゼンテーション機能](https://protopedia.gitbook.io/helpcenter/presentation)はあるよ

## 4.地図を掲載

地図を利用したサービスの場合、地図を表示させることで、ProtoPedia上でサービス内容を伝えやすくなります。[CARTO](https://carto.com/)に対応。\
\
・CARTO埋め込み事例＞[滝を求めて三千里](https://protopedia.net/prototype/2121)

![](/files/-Mi0ARaoUE0ggyXyKkSw)

## 5.ビジュアルプログラミングコード

ビジュアルプログラミングでつくった場合、コードをProtoPedia上で表示できるので、どのようにつくったのか？簡単に伝えやすくなります。[MakeCode](https://www.microsoft.com/ja-jp/makecode)に対応。\
　・MakeCode埋め込み例：[ブーブードライブシステム](https://protopedia.net/prototype/3252)

![](/files/wTI6LmLkPbSJmXgnW8Yc)<br>

---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://protopedia.gitbook.io/helpcenter/embed.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
