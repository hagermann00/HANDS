# PowerShell shortcut to launch Hands Protocol server with selected LLM
# -------------------------------------------------
# Usage:   ./start_hands.ps1   (run from the project root)
# -------------------------------------------------

function Show-Menu {
    Write-Host "Select the LLM backend you want to use for Antigravity agents:" -ForegroundColor Cyan
    Write-Host "1) Gemini 1.5 Flash (free tier)"
    Write-Host "2) OpenAI GPT‑4o (requires OPENAI_API_KEY)"
    Write-Host "3) Anthropic Claude 3.5 Sonnet (requires ANTHROPIC_API_KEY)"
    Write-Host "4) Local Ollama (requires OLLAMA_BASE_URL)"
    Write-Host "Enter number (default 1): " -NoNewline
    $choice = Read-Host
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }
    return $choice
}

$selection = Show-Menu
switch ($selection) {
    "1" {
        $env:FREE_LLM_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
        Write-Host "Using Gemini 1.5 Flash (FREE_LLM_API_KEY)" -ForegroundColor Green
    }
    "2" {
        $env:OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE"
        Write-Host "Using OpenAI GPT‑4o (OPENAI_API_KEY)" -ForegroundColor Green
    }
    "3" {
        $env:ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY_HERE"
        Write-Host "Using Anthropic Claude 3.5 Sonnet (ANTHROPIC_API_KEY)" -ForegroundColor Green
    }
    "4" {
        $env:OLLAMA_BASE_URL = "http://localhost:11434"
        Write-Host "Using local Ollama (OLLAMA_BASE_URL)" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid selection – defaulting to Gemini" -ForegroundColor Yellow
        $env:FREE_LLM_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
    }
}

# Ensure the token for Hands Protocol is set (you can edit .env manually if needed)
if (-not $env:HANDSPROTOCOL_TOKEN) {
    $env:HANDSPROTOCOL_TOKEN = "CHANGE_ME_OR_SET_IN_.env"
    Write-Host "HANDSPROTOCOL_TOKEN not set – using placeholder. Edit .env for a real secret." -ForegroundColor Yellow
}

# Change to the webapp directory and start the server
Set-Location "c:/Y-OS/Y-IT_ENGINES/HANDS/webapp"
Write-Host "Starting Hands Protocol server..." -ForegroundColor Cyan
node server.js
