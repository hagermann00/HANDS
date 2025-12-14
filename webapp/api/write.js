// write.js – Secure file creation / update
// ---------------------------------------
const express = require('express');
const fs = require('fs');
const path = require('path');
const safety = require('./safety');

const router = express.Router();

router.post('/write', safety, (req, res) => {
    const { path: filePath, content, overwrite = false } = req.body;
    if (!filePath || typeof content !== 'string') {
        return res.status(400).json({ error: "Invalid payload – need 'path' and 'content'." });
    }

    const absolute = path.resolve(process.cwd(), filePath);
    const dir = path.dirname(absolute);
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(absolute) && !overwrite) {
        return res.status(409).json({ error: "File exists and overwrite flag not set." });
    }

    try {
        fs.writeFileSync(absolute, content, { encoding: 'utf8' });
        res.json({ status: "written", path: absolute });
    } catch (e) {
        res.status(500).json({ error: "Failed to write file", details: e.message });
    }
});

module.exports = router;
