export type ErrorCode = 
  | 'AUTH_FAILED'
  | 'REPO_NOT_FOUND'
  | 'RATE_LIMIT'
  | 'CONTEXT_LENGTH'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
