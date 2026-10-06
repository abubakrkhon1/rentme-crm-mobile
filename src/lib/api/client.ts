import { getPublicEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import type { ApiErrorBody } from "@/lib/api/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

async function getValidAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    await supabase.auth.signOut({ scope: "local" });
    throw new ApiError("Your session has expired. Please sign in again.", 401, "UNAUTHENTICATED");
  }

  let session = data.session;
  const expiresSoon = !session?.expires_at || session.expires_at <= Math.floor(Date.now() / 1000) + 60;
  if (session && expiresSoon) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
    if (refreshed.error || !session) {
      await supabase.auth.signOut({ scope: "local" });
      throw new ApiError("Your session has expired. Please sign in again.", 401, "UNAUTHENTICATED");
    }
  }

  if (!session?.access_token) {
    throw new ApiError("Your session has expired. Please sign in again.", 401, "UNAUTHENTICATED");
  }
  return session.access_token;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getValidAccessToken();

  const baseUrl = getPublicEnv().EXPO_PUBLIC_CRM_API_URL.replace(/\/$/, "");
  const requestUrl = `${baseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Prevent ngrok's browser-warning HTML from replacing API responses in development.
        "ngrok-skip-browser-warning": "true",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      `Cannot reach the RentMe CRM API at ${new URL(baseUrl).hostname}. Check the API URL and network connection.`,
      0,
      "NETWORK_UNREACHABLE",
    );
  }

  if (response.status === 404) {
    throw new ApiError(
      "This mobile API endpoint has not been deployed to the CRM yet.",
      404,
      "ENDPOINT_NOT_DEPLOYED",
    );
  }

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Preserve a stable fallback when a proxy returns a non-JSON error page.
    }
    throw new ApiError(
      body.error?.message ?? body.message ?? "The request could not be completed.",
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(
      "The CRM API returned a non-JSON response. Check the ngrok URL and CRM mobile API route.",
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  return (await response.json()) as T;
}
