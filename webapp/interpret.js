
async function interpretNL(text) {
    const apiKey = process.env.FREE_LLM_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No LLM API key configured in .env');

    const prompt = `You are a Hands Protocol parser. Convert this natural language request into a valid JSON directive.
    
    Expected JSON Schema:
    {
      "description": "Brief summary",
      "workingDirectory": "C:\\\\path\\\\to\\\\project (use placeholder if unknown)",
      "steps": [
        { "action": "command", "content": "npm install...", "risk": "safe|caution" },
        { "action": "file", "content": "file content", "path": "C:\\\\path\\\\file.txt", "risk": "safe" }
      ],
      "templates": ["optional_template_name"],
      "warnings": ["optional warning"]
    }
    
    Request: "${text}"`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`LLM API Error: ${response.status} ${response.statusText} - ${errBody}`);
        }
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
