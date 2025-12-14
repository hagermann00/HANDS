
const fetch = require('node-fetch');

// This file implements the "Natural Language Understanding" layer for Hands Protocol
// It uses a Failover Strategy to ensure high availability.

/**
 * Convert natural-language instruction into a Hands-Protocol JSON directive.
 * Uses Multi-Key Failover: Tries Primary (.env), then Backup (System).
 */
async function interpretNL(text) {
    // 1. Gather Candidate Keys (Primary: .env, Backup: System/Env)
    const candidates = [
        process.env.FREE_LLM_API_KEY, // Primary (Hagermann)
        process.env.GOOGLE_API_KEY    // Backup (System)
    ].filter(k => k && k.trim().length > 0);

    // Remove duplicates
    const apiKeys = [...new Set(candidates)];

    if (apiKeys.length === 0) throw new Error('No LLM API keys found. Set FREE_LLM_API_KEY in .env');

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

    let lastError = null;

    // 2. Try Keys Sequentially (Failover Strategy)
    for (const [index, key] of apiKeys.entries()) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

            // Log failover attempts if not first key
            if (index > 0) console.warn(`⚠️ Primary key failed. Switching to Backup key ${index + 1}...`);

            // Using Gemini 2.0 Flash
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) {
                const errBody = await response.text();
                // If 429 (Rate Limit) or 500+, allow loop to continue to next key
                throw new Error(`${response.status} ${response.statusText} - ${errBody}`);
            }

            const data = await response.json();
            let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

            // Clean markdown if present
            raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(raw);

        } catch (e) {
            lastError = e;
            console.warn(`❌ Key ${index + 1} Error: ${e.message}`);
            // Continue loop to try next key...
        }
    }

    // If all fail
    throw new Error(`All API keys failed. Last error: ${lastError ? lastError.message : 'None'}`);
}

module.exports = { interpretNL };
