/**
 * Error classes for Anytype API client
 *
 * Provides a hierarchy of error types for different failure scenarios:
 * - ApiError: Base class for all API-related errors
 * - AuthError: Authentication/authorization failures (401, 403)
 * - NetworkError: Connection failures, timeouts, DNS errors
 * - ValidationError: API contract violations, schema validation failures
 */

/**
 * Base error class for all Anytype API errors
 */
export class ApiError extends Error {
    /**
     * HTTP status code (if applicable)
     */
    public readonly status?: number;

    /**
     * Original error that caused this error (if any)
     */
    public readonly originalError?: Error;

    constructor(message: string, status?: number, originalError?: Error) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.originalError = originalError;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        const ErrorWithCapture = Error as typeof Error & {
            captureStackTrace?: (target: object, constructor: new (...args: unknown[]) => unknown) => void;
        };
        if (ErrorWithCapture.captureStackTrace) {
            ErrorWithCapture.captureStackTrace(this, this.constructor as new (...args: unknown[]) => unknown);
        }
    }
}

/**
 * Authentication or authorization error (401, 403)
 *
 * Thrown when API key is invalid, expired, or missing required permissions
 */
export class AuthError extends ApiError {
    constructor(message: string, status: number, originalError?: Error) {
        super(message, status, originalError);
        this.name = 'AuthError';
    }
}

/**
 * Network-related error (connection failure, timeout, DNS error)
 *
 * Thrown when unable to reach Anytype API due to network issues
 */
export class NetworkError extends ApiError {
    constructor(message: string, originalError?: Error) {
        super(message, undefined, originalError);
        this.name = 'NetworkError';
    }
}

/**
 * Validation error (API contract violation)
 *
 * Thrown when API response doesn't match expected schema
 */
export class ValidationError extends ApiError {
    /**
     * Details about which field(s) failed validation
     */
    public readonly validationDetails?: string;

    constructor(message: string, validationDetails?: string, originalError?: Error) {
        super(message, undefined, originalError);
        this.name = 'ValidationError';
        this.validationDetails = validationDetails;
    }
}

/**
 * Classifies an HTTP status code and returns the appropriate error class
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param originalError - Original error (if any)
 * @returns Appropriate error instance based on status code
 *
 * @example
 * ```typescript
 * const error = classifyHttpError(401, 'Unauthorized', new Error('Invalid token'));
 * // Returns AuthError instance
 * ```
 */
export function classifyHttpError(
    status: number,
    message: string,
    originalError?: Error
): ApiError {
    // Authentication/authorization errors
    if (status === 401 || status === 403) {
        return new AuthError(message, status, originalError);
    }

    // All other HTTP errors
    return new ApiError(message, status, originalError);
}
