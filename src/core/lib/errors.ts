export type ErrorCode = 
  | 'AUTH_FAILED'
  | 'AUTH_INVALID_KEY'
  | 'AUTH_REQUIRED'
  | 'REPO_NOT_FOUND'
  | 'GITHUB_REF_NOT_FOUND'
  | 'GITHUB_REPO_NOT_FOUND'
  | 'GITHUB_FILE_NOT_FOUND'
  | 'GITHUB_RATE_LIMIT'
  | 'RATE_LIMIT'
  | 'CONTEXT_LENGTH'
  | 'API_QUOTA_EXCEEDED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'FILE_READ_ERROR'
  | 'FILE_SIZE_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  public code: ErrorCode;
  public details?: unknown;
  public status?: number;

  constructor(code: ErrorCode, message: string, details?: unknown, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = status;

    // Ensure proper stack trace
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static fromError(err: unknown, defaultCode: ErrorCode = 'INTERNAL_ERROR'): AppError {
    if (err instanceof AppError) return err;
    
    const message = err instanceof Error ? err.message : String(err);
    return new AppError(defaultCode, message);
  }
}
