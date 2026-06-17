---
title: "ProtoPedia Helpcenter: markdown"
source_url: https://protopedia.gitbook.io/helpcenter/markdown
collected_at: 2026-05-11T19:23:32+09:00
source_type: "gitbook_markdown"
---

# ＋Markdownの書き方

システム説明や、ストーリーはMarkdownやhtmlにてリッチに表現することも可能です。\
\ <mark style="color:red;">**\[NEW]**</mark> <mark style="color:red;"></mark><mark style="color:red;">画像がアップロードできるようになりました。「画像アイコンのボタンをクリック」or「マークダウンエディタ部分にドラッグ」にて画像アップ可能です。（2022.9.17)</mark>\
\
※Twitter、Flickr、You Tube、speakerdeckなどの外部サービスのURLを記述すると、[コンテンツが埋め込まれる機能が](https://protopedia.gitbook.io/helpcenter/embed)追加されました。（2021.8.25）

## エディターで簡単にできること

太文字、イタリック、見出し1、引用、箇条書き、リンク、画像などはアイコンをタップするだけでMarkdown表記に変換してくれます。

![](/files/-MN78cJRWAedJnupiD9N)

「目」のアイコンをタップすると、どのように表示されるか確認できます。

![](/files/-MN78u0i6-9-H2seV5IN)

「テーブル」のアイコンをタップすると、表示を確認しながら編集できます。\
（自動的に全画面表示になります）

![](/files/-MN798xRaSwYp91BfN77)

## エディター以外での記述方法

## 1.見出し

見出し5まで対応しています。

```
## 見出し2
### 見出し3
#### 見出し4
##### 見出し5
```

<div align="left"><img src="/files/-MN7AHYjvBo1gI819ulR" alt=""></div>

## 2.テーブル

```
| Left align | Right align | Center align |
|:-----------|------------:|:------------:|
| 09:00 | 09:00 |  09:00  |
| 10:00 | 10:00 |  10:00  |
| 11:00 | 11:00 |  11:00  |
| 12:00 | 12:00 |  12:00  |
```

<div align="left"><img src="/files/-MN7CZQHxWCAKAUjeikr" alt=""></div>

## 3.取り消し線

```
~~取り消し線~~
```

~~取り消し線~~

## 4.コードブロック

1タブか4スペースを入力

```
Test

	<html>
		<head>
		<title>Test</title>
		</head>
	<html>

end
```

![](/files/-Mhw0E3BW0mGYnZfF7f7)

## 5.外部コンテンツの埋め込み

Twitter、Flickr、You Tube、speakerdeck、MakeCode、CARTOなどは、サービスのURLを記載すると、コンテンツが埋め込まれた形式で表示されます。（[埋め込み機能詳細](https://protopedia.gitbook.io/helpcenter/embed)）\
　事例：[Twitter](https://protopedia.net/prototype/3035)｜[MakeCode](https://protopedia.net/prototype/3252)｜[CARTO](https://protopedia.net/prototype/212)

<figure><img src="/files/mpEG8ehSrPaeo2IRgNvs" alt=""><figcaption></figcaption></figure>

<figure><img src="/files/wTI6LmLkPbSJmXgnW8Yc" alt=""><figcaption></figcaption></figure>

<figure><img src="/files/Vi9twDPoEAtDZd0Nr8LK" alt=""><figcaption></figcaption></figure>

## 6.html記載

htmlにも対応しておりますので、画像サイズの調整など、Markdown記法でできないことは、htmlで入力ください。

```
<img src="画像のURL" alt="" height="">
```

\
その他は[こちら](https://www.markdownguide.org/basic-syntax/)を参照ください。（Markdown、HTML両方の記載が例があります）

---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://protopedia.gitbook.io/helpcenter/markdown.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
