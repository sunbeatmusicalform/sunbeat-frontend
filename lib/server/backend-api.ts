export function getBackendApiBaseUrl() {
  const apiUrl =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("API_URL or NEXT_PUBLIC_API_URL is not set");
  }

  return apiUrl.replace(/\/+$/, "");
}

export function parseJsonSafely(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
