/**
 * Health check for Anytype API
 *
 * Provides a simple function to check if Anytype Desktop is running and reachable.
 */

/**
 * Checks if Anytype Desktop is running and reachable
 *
 * Uses the /v1/spaces endpoint as a lightweight health check.
 * Returns false on any error (never throws).
 *
 * @param port - Port number for Anytype API (default: 31009)
 * @param timeout - Timeout in milliseconds (default: 2000)
 * @returns true if Anytype is reachable, false otherwise
 *
 * @example
 * ```typescript
 * const isRunning = await checkHealth();
 * if (isRunning) {
 *   console.log('Anytype is running');
 * } else {
 *   console.log('Anytype is not reachable');
 * }
 * ```
 */
export async function checkHealth(port: number = 31009, timeout: number = 2000): Promise<boolean> {
    try {
        // Validate port range
        if (port < 1024 || port > 65535) {
            return false;
        }

        const url = `http://localhost:${port}/v1/spaces`;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            // Consider any response (even errors) as "reachable"
            // We just want to know if Anytype is running
            return response.status !== undefined;
        } catch {
            clearTimeout(timeoutId);
            return false;
        }
    } catch {
        // Never throw - always return false on error
        return false;
    }
}
