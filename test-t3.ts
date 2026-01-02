import { convertToMarkdown } from './src/lib/converters/markdown-converter';

async function test() {
    console.log('Testing Markdown Converter...');

    // Test 1: Basic HTML
    const html1 = '<h1>Hello</h1><p>World</p>';
    const res1 = await convertToMarkdown(html1);
    console.log('Test 1 Result:', res1);

    // Test 2: Code block with class
    const html2 = '<pre><code class="language-typescript">const x = 1;</code></pre>';
    const res2 = await convertToMarkdown(html2);
    console.log('Test 2 Result:', res2);

    // Test 3: Invalid HTML
    const res3 = await convertToMarkdown('');
    console.log('Test 3 Result:', res3);
}

test().catch(console.error);
