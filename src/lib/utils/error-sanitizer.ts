/**
 * Error Sanitizer Utility
 * 
 * Sanitizes error messages to remove sensitive data (API keys, stack traces, PII)
 * and provides user-friendly messages with actionable next steps.
 */

/**
 * Sanitized error result
 */
export interface SanitizedError {
    /** User-friendly error message */
    message: string;
    /** Actionable next steps for the user */
    nextSteps: string;
    /** Error type for categorization */
    type: 'auth' | 'network' | 'validation' | 'api' | 'unknown';
    /** Original error name (sanitized) */
    name: string;
}

/**
 * Patterns to remove from error messages
 */
const SENSITIVE_PATTERNS = [
    // API keys and tokens
    /api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/gi,
    /api-key:\s*[a-zA-Z0-9_-]+/gi,
    /apikey[:\s=]+[a-zA-Z0-9_-]+/gi,
    /token[:\s=]+[a-zA-Z0-9_.-]+/gi,
    /bearer\s+[a-zA-Z0-9_.-]+/gi,
    /authorization[:\s=]+[^\s]+/gi,

    // Stack traces (with and without leading whitespace)
    /\s*at\s+.+\(.+:\d+:\d+\)/g,
    /\s*at\s+.+:\d+:\d+/g,

    // File paths that might contain usernames
    /[A-Z]:\\Users\\[^\\]+/gi,
    /\/home\/[^\/]+/g,
    /\/Users\/[^\/]+/g,

    // URLs with potential sensitive params
    /https?:\/\/[^\s]+\?[^\s]+/g,
];

/**
 * Error type detection patterns
 */
const ERROR_TYPE_PATTERNS = {
    auth: [
        /401/,
        /unauthorized/i,
        /authentication/i,
        /api.*key/i,
        /token.*expired/i,
    ],
    network: [
        /network/i,
        /fetch.*failed/i,
        /connection/i,
        /timeout/i,
        /econnrefused/i,
        /anytype.*not.*running/i,
    ],
    validation: [
        /validation/i,
        /invalid/i,
        /required/i,
        /missing/i,
    ],
    api: [
        /api.*error/i,
        /500/,
        /503/,
        /bad.*gateway/i,
    ],
};

/**
 * User-friendly error messages and next steps
 */
const ERROR_MESSAGES: Record<string, { message: string; nextSteps: string }> = {
    auth: {
        message: 'Authentication required',
        nextSteps: 'Click "Re-authenticate" to connect to Anytype again.',
    },
    network: {
        message: 'Anytype is not running',
        nextSteps: 'Start Anytype Desktop and try again. Your capture has been queued.',
    },
    validation: {
        message: 'Invalid input',
        nextSteps: 'Please check your input and try again.',
    },
    api: {
        message: 'Anytype API error',
        nextSteps: 'Please try again. If the problem persists, restart Anytype Desktop.',
    },
    unknown: {
        message: 'An unexpected error occurred',
        nextSteps: 'Please try again. Your capture has been queued if Anytype was unavailable.',
    },
};

/**
 * Detect error type from error message
 */
function detectErrorType(error: Error): SanitizedError['type'] {
    const errorString = `${error.name} ${error.message}`.toLowerCase();

    for (const [type, patterns] of Object.entries(ERROR_TYPE_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(errorString))) {
            return type as SanitizedError['type'];
        }
    }

    return 'unknown';
}

/**
 * Remove sensitive data from error message
 */
function sanitizeMessage(message: string): string {
    let sanitized = message;

    // Remove sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Remove stack trace lines
    const lines = sanitized.split('\n');
    const cleanLines = lines.filter(line => !line.trim().startsWith('at '));
    sanitized = cleanLines.join('\n').trim();

    // Limit length
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 200) + '...';
    }

    return sanitized;
}

/**
 * Sanitize error and provide user-friendly message with next steps
 * 
 * @param error - The error to sanitize
 * @returns Sanitized error with user-friendly message and actionable next steps
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.createObject(data);
 * } catch (error) {
 *   const sanitized = sanitizeError(error as Error);
 *   showNotification({
 *     type: 'error',
 *     title: sanitized.message,
 *     message: sanitized.nextSteps,
 *   });
 * }
 * ```
 */
export function sanitizeError(error: Error): SanitizedError {
    // Detect error type
    const type = detectErrorType(error);

    // Get user-friendly message and next steps
    const { message, nextSteps } = ERROR_MESSAGES[type];

    // Sanitize error name (remove sensitive data)
    const sanitizedName = sanitizeMessage(error.name || 'Error');

    return {
        message,
        nextSteps,
        type,
        name: sanitizedName,
    };
}

/**
 * Check if an error message contains sensitive data
 * (Useful for testing and validation)
 * 
 * @param message - The message to check
 * @returns True if sensitive data is detected
 */
export function containsSensitiveData(message: string): boolean {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(message));
}
