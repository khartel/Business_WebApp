import axios, { AxiosError } from "axios"

// Shape of a successful backend response envelope. Every endpoint that
// succeeds responds with this exact wrapper around the real payload (`data`).
export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

// Shape of a failed backend response envelope. `errors` is populated for
// validation failures (one entry per invalid field) and null otherwise.
export interface ApiFailure {
  success: false
  message: string
  errors: Array<{ path: string; message: string }> | null
}

/**
 * Normalized error thrown for every failed API call (network error or
 * non-2xx response). Consumers should catch this type instead of raw axios
 * errors — `message` is always human-readable, `statusCode` is the HTTP
 * status (0 if the request never reached the server), and `errors` carries
 * field-level validation messages when the backend provided them.
 */
export class ApiError extends Error {
  errors: ApiFailure["errors"]
  statusCode: number

  constructor(message: string, statusCode: number, errors: ApiFailure["errors"] = null) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.errors = errors
  }
}

// Shared axios instance used by every service module. `baseURL` comes from
// the build-time env var VITE_API_URL, and `withCredentials: true` ensures
// the browser sends/receives the httpOnly session cookie set by the backend
// (this is how auth state is carried — no bearer tokens on the client).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

// Response interceptor: passes successful responses through unchanged, but
// converts any error response (or network failure) into an `ApiError` so
// every caller in the app deals with one consistent error shape instead of
// raw AxiosError objects.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    const statusCode = error.response?.status ?? 0
    const message = error.response?.data?.message ?? error.message ?? "Something went wrong"
    const errors = error.response?.data?.errors ?? null
    return Promise.reject(new ApiError(message, statusCode, errors))
  }
)

/** Unwraps the { success, message, data } envelope every backend endpoint returns. */
export async function apiRequest<T>(promise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}
