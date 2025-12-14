const express = require('express');
const { exec } = require('child_process');
const safety = require('./safety');
const router = express.Router();

// Timeout from .env or default to 60s
const EXEC_TIMEOUT = process.env.EXEC_TIMEOUT ? parseInt(process.env.EXEC_TIMEOUT) : 60000;

router.post('/execute', safety, (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "Missing command field." });

    console.log(`⚡ Executing: "${command}" (Timeout: ${EXEC_TIMEOUT}ms)`);

    exec(command, { timeout: EXEC_TIMEOUT, cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Failed: "${command}"`, err.message);
            const isTimeout = err.signal === 'SIGTERM';
            return res.status(500).json({
                error: isTimeout ? "Command timed out" : "Command failed",
                details: err.message,
                stderr: stderr || err.message
            });
        }
        console.log(`✅ Success: "${command}"`);
        res.json({ stdout, stderr });
    });
});

module.exports = router;
