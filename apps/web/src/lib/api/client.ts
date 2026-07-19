import { getAccessToken } from "@/lib/supabase/client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(args: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
    requestId?: string;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
    this.requestId = args.requestId;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | Record<string, unknown> | null;
  signal?: AbortSignal;
  /** Attach the Supabase access token when present (default true). */
  auth?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let code = "HTTP_ERROR";
  let message = `Request failed with status ${response.status}.`;
  let details: Record<string, unknown> | undefined;
  let requestId: string | undefined;
  try {
    const body = (await response.json()) as {
      error?: {
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
        requestId?: string;
      };
    };
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
      requestId = body.error.requestId;
    }
  } catch {
    // Non-JSON error body; keep defaults.
  }
  return new ApiError({ code, message, status: response.status, details, requestId });
}

/**
 * Typed fetch wrapper for the FastAPI backend. Attaches the Supabase access
 * token, serialises JSON bodies (FormData passes through untouched), and
 * converts the structured error envelope into ApiError.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body = null, signal, auth = true } = options;

  const headers = new Headers();
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let payload: BodyInit | null = null;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== null) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      body: payload,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "Could not reach the analysis service. Please check your connection and try again.",
      status: 0,
    });
  }

  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
