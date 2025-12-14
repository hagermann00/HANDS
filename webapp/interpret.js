const fetch = require('node-fetch');
const { GOOGLE_API_KEY } = process.env; // optional, use FREE_LLM_API_KEY if set

/**
 * Convert natural‑language instruction into a Hands‑Protocol JSON directive.
 * Uses Gemini 1.5 Flash (free tier) via the REST API.
 */
async function interpretNL(text) {
    const apiKey = process.env.FREE_LLM_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No LLM API key configured');

    const prompt = `You are a helper that converts a plain‑English description of a Hands‑Protocol task into the exact JSON format expected by the /run endpoint.
  Return **only** valid JSON, no extra text.
  Example:
  Input: "Create a new file called hello.txt with the content Hello World"
  Output: {"type":"write","path":"hello.txt","content":"Hello World"}
  Now convert the following instruction:
  "${text}"`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
        throw new Error('LLM did not return a response');
    }
    const resultText = data.candidates[0].content.parts[0].text.trim();
    try {
        return JSON.parse(resultText);
    } catch (e) {
        // If LLM added extra text, try to extract JSON substring
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('Failed to parse LLM output as JSON');
    }
}

module.exports = { interpretNL };
