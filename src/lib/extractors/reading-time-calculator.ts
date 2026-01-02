/**
 * Utility for calculating reading time from text content.
 */
export class ReadingTimeCalculator {
    private readonly wordsPerMinute: number;

    /**
     * @param wordsPerMinute - Average reading speed (default: 200)
     */
    constructor(wordsPerMinute: number = 200) {
        this.wordsPerMinute = wordsPerMinute;
    }

    /**
     * Calculates the estimated reading time for the given content.
     * 
     * @param content - The text content to analyze
     * @returns Estimated reading time in minutes (minimum 1)
     */
    public calculate(content: string | null | undefined): number {
        if (!content || !content.trim()) {
            return 0;
        }

        const wordCount = this.countWords(content);
        const minutes = Math.ceil(wordCount / this.wordsPerMinute);

        return Math.max(1, minutes);
    }

    /**
     * Counts the number of words in a string, stripping HTML tags if present.
     * 
     * @param text - The text to count words in
     * @returns Number of words
     */
    public countWords(text: string): number {
        // Strip HTML tags if any (basic regex)
        const cleanText = text.replace(/<[^>]*>/g, ' ');

        // Split by whitespace and filter out empty strings
        const words = cleanText.trim().split(/\s+/);

        return words.length > 0 && words[0] !== '' ? words.length : 0;
    }
}
