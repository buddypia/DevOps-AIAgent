import LZString from "lz-string";

export function compressToEncodedURIComponent(value: string) {
  return LZString.compressToEncodedURIComponent(value);
}

export function decompressFromEncodedURIComponent(value: string) {
  return LZString.decompressFromEncodedURIComponent(value);
}
