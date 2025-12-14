// execute.js – Runs a single terminal command after safety checks
// ------------------------------------------------------------
const express = require('express');
const { exec } = require('child_process');
const safety = require('./safety');

const router = express.Router();

router.post('/execute', safety, (req, res) => {
    const { command } = req.body; // e.g. "npm install"
    if (!command) {
        return res.status(400).json({ error: "Missing command field." });
    }

    // Execute with a timeout to avoid runaway processes
    exec(command, { timeout: 15000, cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: "Command failed", details: err.message, stderr });
        }
        res.json({ stdout, stderr });
    });
});

module.exports = router;
