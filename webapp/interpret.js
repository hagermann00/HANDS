const fetch = require('node-fetch');

/**
 * Convert natural-language instruction into a Hands-Protocol JSON directive.
 * [RELIABILITY] Added timeout, better JSON cleaning, and error logging.
 */
async function interpretNL(text) {
    const apiKey = process.env.FREE_LLM_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No LLM API key configured. Set FREE_LLM_API_KEY in .env');

    const prompt = `You are a strict JSON converter. Convert this natural language request into a Hands Protocol JSON directive.
    Rules:
    1. Return ONLY valid JSON.
    2. No markdown formatting (no \`\`\`).
    3. Use "type": "write" for files, "type": "command" for shell actions.
    
    Request: "${text}"`;

    try {
        // 15s timeout for the LLM itself to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`LLM API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Empty response from LLM');
        }

        let rawText = data.candidates[0].content.parts[0].text.trim();

        // [RELIABILITY] Aggressively clean markdown blocks if the LLM ignored instructions
        if (rawText.includes('```')) {
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        return JSON.parse(rawText);

    } catch (e) {
        console.error("❌ Interpretation Failed:", e.message);
        throw new Error(`Failed to interpret instruction: ${e.message}`);
    }
}

module.exports = { interpretNL };
