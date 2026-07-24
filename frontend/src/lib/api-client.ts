import axios, { AxiosError } from "axios"

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiFailure {
  success: false
  message: string
  errors: Array<{ path: string; message: string }> | null
}

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

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

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
