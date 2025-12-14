// safety.js – Central safety middleware for Hands Protocol
// ------------------------------------------------------
// Checks incoming directives against the global safety rules
// Returns 403 if a disallowed action is detected.
// Otherwise calls next().

const path = require('path');

// Protected directories (absolute, case‑insensitive)
const PROTECTED_DIRS = [
    "C:/Users/dell3630/.gemini",
    "C:/Users/dell3630/Documents",
    "C:/Users/dell3630/Desktop",
    "C:/Windows",
    "C:/Program Files",
    "C:/Program Files (x86)"
];

// Protected file name fragments (case‑insensitive)
const PROTECTED_FILES = [
    ".gemini",
    "credentials",
    "secrets",
    ".env",
    "password",
    "token",
    ".git/config",
    "browserAllowlist.txt",
    "GEMINI.md",
    "package.json",
    "requirements.txt"
];

// Blocked destructive command patterns (regex, case‑insensitive)
const BLOCKED_CMDS = [
    /rm\s+-rf\b/i,
    /del\s+\/s\s+\/q\b/i,
    /Remove-Item\s+-Recurse\s+-Force\b/i,
    /format\b/i,
    /diskpart\b/i,
    /reg\s+delete\b/i,
    /reg\s+add\s+HKLM\b/i,
    /reg\s+add\s+HKCU\b/i,
    /net\s+user.*delete\b/i,
    /net\s+user.*add\b/i,
    /Set-ExecutionPolicy\b/i,
    /shutdown\b/i,
    /restart\b/i,
    /Stop-Computer\b/i,
    /Restart-Computer\b/i,
    /taskkill\s+\/f\b/i,
    /Stop-Process\s+-Force\b/i,
    /git\s+clean\s+-fd\b/i,
    /git\s+reset\s+--hard\b/i,
    /git\s+push\s+--force\b/i
];

function isProtectedPath(targetPath) {
    const normalized = path.normalize(targetPath).toUpperCase();
    return PROTECTED_DIRS.some(dir => normalized.startsWith(path.normalize(dir).toUpperCase()));
}

function isProtectedFile(fileName) {
    const lower = fileName.toLowerCase();
    return PROTECTED_FILES.some(pat => lower.includes(pat.toLowerCase()));
}

function safetyMiddleware(req, res, next) {
    const { type, payload } = req.body;

    // Block destructive commands
    if (type === "command" && typeof payload === "string") {
        if (BLOCKED_CMDS.some(re => re.test(payload))) {
            return res.status(403).json({ error: "Blocked destructive command per safety policy." });
        }
    }

    // Prevent writes to protected locations
    if (type === "write" && payload && payload.path) {
        const target = payload.path;
        if (isProtectedPath(target) || isProtectedFile(path.basename(target))) {
            return res.status(403).json({ error: "Attempt to write to a protected location." });
        }
    }

    // All checks passed
    next();
}

module.exports = safetyMiddleware;
