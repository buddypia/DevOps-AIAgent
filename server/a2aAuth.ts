import { actionTokenMatches } from "./mergeSteward.js";

const MIN_A2A_TOKEN_LENGTH = 32;

export function a2aAuthConfigured(env: NodeJS.ProcessEnv = process.env) {
  return env.A2A_ENABLED === "true" && (env.A2A_ACTION_TOKEN?.trim().length ?? 0) >= MIN_A2A_TOKEN_LENGTH;
}

export function a2aRequestAuthorized(providedToken: string | undefined, env: NodeJS.ProcessEnv = process.env) {
  if (!a2aAuthConfigured(env)) return false;
  return actionTokenMatches(providedToken, env.A2A_ACTION_TOKEN?.trim());
}

export const A2A_AUTH_HEADER = "x-a2a-token";
