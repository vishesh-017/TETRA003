import { env } from "@/config/env";
import type { ApiErrorBody } from "@/types";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Optional AI / ML microservice client (FastAPI later). Not used for CRUD. */
export async function aiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = env.aiApiBaseUrl;
  if (!base) {
    throw new ApiError("AI API base URL is not configured (VITE_AI_API_BASE_URL)", 503);
  }

  const { body, token, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(env.exaApiKey ? { "X-Exa-Key": env.exaApiKey } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const errorBody =
      payload && typeof payload === "object" ? (payload as ApiErrorBody) : null;
    throw new ApiError(
      errorBody?.detail || `Request failed with status ${response.status}`,
      response.status,
      errorBody,
    );
  }

  return payload as T;
}
