import axios, { AxiosError, type AxiosInstance } from 'axios';
import { config } from '@/lib/config';
import type { ProblemDetails } from './types';

/**
 * The OIDC layer owns the token; axios just needs to read the current one and
 * be told when a refresh is required. These hooks are wired up once in
 * <AuthBridge /> so this module never imports React.
 */
type TokenProvider = () => string | undefined;
type RefreshHandler = () => Promise<string | undefined>;
type SignoutHandler = () => void;

let getToken: TokenProvider = () => undefined;
let refreshToken: RefreshHandler = async () => undefined;
let onAuthLost: SignoutHandler = () => {};

export function configureApiAuth(handlers: {
  getToken: TokenProvider;
  refreshToken: RefreshHandler;
  onAuthLost: SignoutHandler;
}) {
  getToken = handlers.getToken;
  refreshToken = handlers.refreshToken;
  onAuthLost = handlers.onAuthLost;
}

export const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Single-flight refresh so a burst of 401s triggers one token renewal.
let refreshInFlight: Promise<string | undefined> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        refreshInFlight ??= refreshToken().finally(() => {
          refreshInFlight = null;
        });
        const fresh = await refreshInFlight;
        if (fresh) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${fresh}`;
          return api.request(original);
        }
      } catch {
        // fall through to sign-out
      }
      onAuthLost();
    }

    return Promise.reject(toApiError(error));
  },
);

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const problem = error.response?.data as ProblemDetails | undefined;
  // Prefer the concrete validation messages ("Ends At Utc ...") over the
  // generic `detail` ("One or more validation errors occurred").
  const validationMessages = problemErrors(problem);
  const message =
    (validationMessages.length > 0 ? validationMessages.join(' ') : undefined) ||
    problem?.detail ||
    problem?.title ||
    error.message ||
    'The request failed. Please try again.';
  return new ApiError(message, status, problem);
}

/** Flatten a ProblemDetails.errors bag into readable lines for a form/toast. */
export function problemErrors(problem?: ProblemDetails): string[] {
  if (!problem?.errors) return [];
  if (Array.isArray(problem.errors)) {
    return problem.errors.map((e) => e.description);
  }
  return Object.values(problem.errors).flat();
}
