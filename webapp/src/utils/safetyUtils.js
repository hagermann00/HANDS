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

function checkCommandSafety(command) {
    if (BLOCKED_CMDS.some(re => re.test(command))) {
        return { safe: false, reason: "Blocked destructive command pattern." };
    }
    return { safe: true };
}

function checkWriteSafety(filePath) {
    if (isProtectedPath(filePath)) {
        return { safe: false, reason: "Target directory is protected." };
    }
    if (isProtectedFile(path.basename(filePath))) {
        return { safe: false, reason: "Target filename is protected." };
    }
    return { safe: true };
}

module.exports = {
    isProtectedPath,
    isProtectedFile,
    checkCommandSafety,
    checkWriteSafety,
    PROTECTED_DIRS,
    PROTECTED_FILES,
    BLOCKED_CMDS
};
