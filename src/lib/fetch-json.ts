type FetchJsonInit = Omit<RequestInit, "body"> & { json?: unknown };

/**
 * Fetches a JSON API route. Sends `json` as the request body and throws the
 * API's `error` message when the response is not OK.
 */
export async function fetchJson<T = unknown>(
  url: string,
  { json, headers, ...init }: FetchJsonInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    ...(json !== undefined && {
      body: JSON.stringify(json),
      headers: { "Content-Type": "application/json", ...headers },
    }),
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export function getErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}
