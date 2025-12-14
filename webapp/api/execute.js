// execute.js – Robust execution with configurable timeout and logging
// ------------------------------------------------------------
const express = require('express');
const { exec } = require('child_process');
const safety = require('./safety');

const router = express.Router();

// Allow timeout configuration via .env, default to 60 seconds (60000ms)
const EXEC_TIMEOUT = process.env.EXEC_TIMEOUT ? parseInt(process.env.EXEC_TIMEOUT) : 60000;

router.post('/execute', safety, (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: "Missing command field." });
    }

    // [OBSERVABILITY] Log the attempt
    console.log(`⚡ Executing: "${command}" (Timeout: ${EXEC_TIMEOUT}ms)`);

    exec(command, { timeout: EXEC_TIMEOUT, cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Execution Failed: "${command}"`, err.message);

            // [RELIABILITY] Distinguish between timeout and crash
            const isTimeout = err.signal === 'SIGTERM';

            return res.status(500).json({
                error: isTimeout ? "Command timed out" : "Command failed",
                details: err.message,
                stderr: stderr || err.message,
                hint: isTimeout ? "Try increasing EXEC_TIMEOUT in .env" : null
            });
        }

        // [OBSERVABILITY] Log success
        console.log(`✅ Success: "${command}"`);
        res.json({ stdout, stderr });
    });
});

module.exports = router;
