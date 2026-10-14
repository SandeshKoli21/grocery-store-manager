/** Appends ?error=<message> (or &error=) to a path for the shared ErrorBox. */
export function withError(path: string, message: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}error=${encodeURIComponent(message)}`;
}

/** Reads one search param value from Next's searchParams object. */
export function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type SearchParams = Record<string, string | string[] | undefined>;

/** Route param -> positive integer id, or null. */
export function parseId(param: string): number | null {
  return /^\d+$/.test(param) && Number(param) > 0 ? Number(param) : null;
}
