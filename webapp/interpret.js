
async function interpretNL(text) {
    const apiKey = process.env.FREE_LLM_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No LLM API key configured in .env');

    const prompt = `Convert to Hands Protocol JSON (type="write" or "command"). No markdown. Request: "${text}"`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`LLM Error: ${response.status}`);
        const data = await response.json();
        let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Clean markdown if present
        raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(raw);
    } catch (e) {
        throw new Error(`Interpret failed: ${e.message}`);
    }
}

module.exports = { interpretNL };
