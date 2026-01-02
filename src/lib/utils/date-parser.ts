/**
 * Date parsing utilities for Anytype Clipper.
 */

/**
 * Parses a date string and normalizes it to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
 * 
 * @param dateString - The date string to parse (from meta tags or Schema.org)
 * @returns Normalized ISO 8601 date string, or null if the date is invalid
 */
export function parseDate(dateString: string | null | undefined): string | null {
    if (!dateString || !dateString.trim()) {
        return null;
    }

    const trimmedDate = dateString.trim();

    try {
        // Standard Date.parse handles ISO 8601, RFC 2822, and many common formats
        const timestamp = Date.parse(trimmedDate);

        if (isNaN(timestamp)) {
            // Handle some common non-standard formats if needed
            // For now, if Date.parse fails, we return null
            return null;
        }

        const date = new Date(timestamp);

        // Ensure it's a valid date (not "Invalid Date")
        if (date.toString() === 'Invalid Date') {
            return null;
        }

        // Return as ISO 8601 string
        return date.toISOString();
    } catch (error) {
        console.warn(`[Date Parser] Failed to parse date: ${trimmedDate}`, error);
        return null;
    }
}

/**
 * Validates if a date is not in the future (beyond a reasonable threshold).
 * Useful for filtering out obviously wrong metadata.
 * 
 * @param dateString - ISO 8601 date string
 * @returns true if the date is valid and not in the far future
 */
export function isReasonableDate(dateString: string | null): boolean {
    if (!dateString) return false;

    try {
        const date = new Date(dateString);
        const now = new Date();

        // Allow up to 24 hours in the future for timezone discrepancies
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Not earlier than 1990 (pre-web)
        const wayBack = new Date('1990-01-01');

        return date < tomorrow && date > wayBack;
    } catch (e) {
        return false;
    }
}
