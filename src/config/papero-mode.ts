export type PaperoDataMode = "local" | "demo" | "database";

const validPaperoDataModes = new Set<PaperoDataMode>(["local", "demo", "database"]);

export function getPaperoDataMode(): PaperoDataMode {
  const mode = process.env.NEXT_PUBLIC_PAPERO_DATA_MODE ?? process.env.PAPERO_DATA_MODE ?? "local";

  return validPaperoDataModes.has(mode as PaperoDataMode) ? (mode as PaperoDataMode) : "local";
}

export function isDemoMode() {
  return getPaperoDataMode() === "demo";
}

export function isDatabaseMode() {
  return getPaperoDataMode() === "database";
}

export function isLocalMode() {
  return getPaperoDataMode() === "local";
}
