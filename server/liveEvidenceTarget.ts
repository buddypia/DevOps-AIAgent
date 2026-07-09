export function normalizeLiveEvidenceBaseUrl(currentBaseUrl: string, targetUrl?: string) {
  const current = currentBaseUrl.trim().replace(/\/$/, "");
  const target = targetUrl?.trim().replace(/\/$/, "");
  return target || current;
}

export function shouldForwardSelfProbeHeaders(currentBaseUrl: string, targetBaseUrl: string) {
  return currentBaseUrl.trim().replace(/\/$/, "") === targetBaseUrl.trim().replace(/\/$/, "");
}
