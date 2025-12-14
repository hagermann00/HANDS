const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Helper: Safety Check (Simple version for visual proto)
const isSafeCommand = (cmd) => {
    const forbidden = ['rm -rf', 'format', 'del /s'];
    return !forbidden.some(bad => cmd.includes(bad));
};

// ENDPOINT: Execute Command
app.post('/api/execute', (req, res) => {
    const { command, cwd } = req.body;

    if (!command) return res.status(400).json({ error: 'No command provided' });

    console.log(`[EXEC] ${command} in ${cwd || '.'}`);

    // If "test execution" is passed, just echo
    if (command === 'test execution') {
        return res.json({ stdout: 'Test Execution Successful', stderr: '' });
    }

    exec(command, { cwd: cwd || process.cwd() }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[EXEC ERROR] ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ stdout, stderr });
    });
});

// ENDPOINT: Write File
app.post('/api/write', (req, res) => {
    const { filePath, content } = req.body;

    if (!filePath || content === undefined) {
        return res.status(400).json({ error: 'Missing path or content' });
    }

    try {
        // Ensure dir exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[WRITE] ${filePath}`);
        res.json({ success: true, path: filePath });
    } catch (err) {
        console.error(`[WRITE ERROR] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// ENDPOINT: Get Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        cwd: process.cwd(),
        node: process.version,
        keysConfigured: {
            gemini: !!process.env.GEMINI_API_KEY,
            groq: !!process.env.GROQ_API_KEY
        }
    });
});

app.listen(PORT, () => {
    console.log(`Antigravity Hands Server running on http://localhost:${PORT}`);
});
