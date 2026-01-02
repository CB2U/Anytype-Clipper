import { ReadingTimeCalculator } from '../../src/lib/extractors/reading-time-calculator';

describe('ReadingTimeCalculator', () => {
    let calculator: ReadingTimeCalculator;

    beforeEach(() => {
        calculator = new ReadingTimeCalculator(200); // 200 WPM
    });

    describe('countWords', () => {
        it('should count words in simple text', () => {
            expect(calculator.countWords('Hello world')).toBe(2);
            expect(calculator.countWords('  One   two three  ')).toBe(3);
        });

        it('should count words in HTML text', () => {
            expect(calculator.countWords('<p>Hello world</p>')).toBe(2);
            expect(calculator.countWords('<div>Multiple <span>words</span> and tags</div>')).toBe(4);
        });

        it('should return 0 for empty content', () => {
            expect(calculator.countWords('')).toBe(0);
            expect(calculator.countWords('   ')).toBe(0);
            expect(calculator.countWords('<div></div>')).toBe(0);
        });
    });

    describe('calculate', () => {
        it('should calculate 1 minute for short text', () => {
            expect(calculator.calculate('Small text')).toBe(1);
        });

        it('should calculate correct minutes for long text', () => {
            // 400 words should be 2 minutes at 200 WPM
            const words = new Array(400).fill('word').join(' ');
            expect(calculator.calculate(words)).toBe(2);
        });

        it('should round up for partial minutes', () => {
            // 201 words should be 2 minutes
            const words = new Array(201).fill('word').join(' ');
            expect(calculator.calculate(words)).toBe(2);
        });

        it('should handle missing content', () => {
            expect(calculator.calculate('')).toBe(0);
            expect(calculator.calculate(null)).toBe(0);
        });
    });
});
