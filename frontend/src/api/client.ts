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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${env.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
