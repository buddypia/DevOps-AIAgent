declare module "lz-string/libs/lz-string.min.js" {
  const LZString: {
    compressToEncodedURIComponent(value: string | null | undefined): string;
    decompressFromEncodedURIComponent(value: string | null | undefined): string | null;
  };

  export default LZString;
}
