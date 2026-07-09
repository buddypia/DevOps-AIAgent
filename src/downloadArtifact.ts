function saveBlob(filename: string, blob: Blob) {
  if (typeof document === "undefined") return;
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
}

export function downloadTextFile(filename: string, text: string, mimeType = "text/markdown;charset=utf-8") {
  saveBlob(filename, new Blob([text], { type: mimeType }));
}

export function downloadJsonFile(filename: string, value: unknown) {
  downloadTextFile(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");
}

export function downloadHrefFile(filename: string, href: string) {
  if (typeof window === "undefined") return;
  if (!href.startsWith("data:")) {
    window.location.assign(href);
    return;
  }

  const commaIndex = href.indexOf(",");
  if (commaIndex === -1) return;

  const metadata = href.slice("data:".length, commaIndex);
  const encoded = href.slice(commaIndex + 1);
  const isBase64 = /(?:^|;)base64(?:;|$)/i.test(metadata);
  const mimeType = metadata.replace(/;base64/gi, "") || "text/plain;charset=utf-8";
  const payload = isBase64 ? Uint8Array.from(window.atob(encoded), (character) => character.charCodeAt(0)) : decodeURIComponent(encoded);

  saveBlob(filename, new Blob([payload], { type: mimeType }));
}
