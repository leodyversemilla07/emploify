const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
)

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
  })
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)

  if (!response.ok) {
    throw new ApiError(`API request failed (${response.status})`, response.status)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? `Invalid API JSON response: ${error.message}`
        : "Invalid API JSON response",
      response.status,
    )
  }
}
