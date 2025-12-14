# 🤝 Hands Protocol

> **"Brains in the Cloud, Hands on the Ground."**

A local web application that bridges external LLMs (ChatGPT, Claude, Gemini) with safe, controlled execution on your machine via Antigravity.

---

## 🎯 What Is This?

Hands Protocol is a **staging dock** for LLM-generated instructions. Instead of blindly executing AI-generated code, it:

1. **Parses** LLM directives into structured actions
2. **Shows** you exactly what will happen
3. **Confirms** before any execution
4. **Executes** safely with your approval

---

## 🚀 Quick Start

### One-Click Launch (Windows)
```batch
start_hands.bat
```

Or via PowerShell:
```powershell
.\start_hands.ps1
```

This will:
- Load environment variables from `.env`
- Start the Express server on port 5000
- Open your browser to `http://localhost:5000`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EXTERNAL LLMs                        │
│         (ChatGPT, Claude, Gemini, etc.)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ JSON Directive / Natural Language
                      ▼
┌─────────────────────────────────────────────────────────┐
│              HANDS PROTOCOL (This App)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Template   │  │   Parser    │  │  Confirmation   │  │
│  │   Library   │◄─┤   Engine    │─►│     Modal       │  │
│  │ (23 skills) │  │             │  │  (Hard Stop)    │  │
│  └─────────────┘  └─────────────┘  └────────┬────────┘  │
│                                              │          │
│  ┌─────────────────────────────────────────▼────────┐  │
│  │              Execution Engine                     │  │
│  │  • POST /api/execute (shell commands)            │  │
│  │  • POST /api/write (file operations)             │  │
│  │  • POST /api/plan (natural language → plan)      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              LOCAL MACHINE (Antigravity)                │
│        File System │ Terminal │ Git │ npm │ etc.        │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Template Library (23 Skills)

These modular workflows can be combined and executed:

| Category | Templates |
|----------|-----------|
| **Project Setup** | `npm_project_init`, `git_repo_setup`, `python_venv_setup`, `env_config_setup` |
| **API Development** | `api_scaffold`, `api_security_setup`, `jwt_auth_setup` |
| **Infrastructure** | `docker_containerize`, `database_setup`, `redis_cache_setup` |
| **CI/CD & Deploy** | `github_actions_cicd`, `deploy_static_site`, `google_cloud_setup` |
| **Features** | `websocket_setup`, `email_setup`, `file_upload_setup`, `logging_setup` |
| **Frontend** | `frontend_setup`, `testing_setup` |
| **Meta** | `catalog`, `llm_agent_framework`, `llm_api_keys_guide` |

---

## 🔌 API Reference

### Authentication
All protected endpoints require:
```
Authorization: Bearer <HANDSPROTOCOL_TOKEN>
```

Set your token in `.env`:
```env
HANDSPROTOCOL_TOKEN=your_secret_token_here
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/templateList` | No | List all available templates |
| GET | `/api/template/:name` | No | Get template content |
| PUT | `/api/template/:name` | Yes | Update template content |
| POST | `/api/combine` | Yes | Combine multiple templates |
| PATCH | `/api/quarantine/:name` | Yes | Quarantine a template |
| POST | `/api/plan` | No | Parse natural language → execution plan |
| POST | `/api/execute` | Yes | Execute shell commands |
| POST | `/api/write` | Yes | Write files |

### Natural Language Planning

```bash
POST /api/plan
Content-Type: application/json

{
  "command": "Create a new Express API with JWT authentication"
}
```

Response:
```json
{
  "plan": [
    { "step": 1, "action": "npm init", "type": "command" },
    { "step": 2, "action": "Install express, jsonwebtoken", "type": "command" },
    { "step": 3, "action": "Create server.js", "type": "file" }
  ],
  "templates": ["api_scaffold", "jwt_auth_setup"],
  "warnings": ["Will create new files", "Requires npm install"],
  "requiresConfirmation": true
}
```

---

## 🛡️ Safety Philosophy

Hands Protocol follows **Antigravity Safety Rules**:

1. **Never auto-execute destructive commands** (`rm -rf`, `git push --force`, etc.)
2. **Protected directories** are off-limits (Documents, .gemini, Windows, etc.)
3. **Credential files** are never modified without explicit approval
4. **Hard stop before execution** – always show plan first

---

## 📁 Project Structure

```
HANDS/
├── .agent/workflows/       # 23 modular templates
├── webapp/
│   ├── index.html          # Main UI
│   ├── app.js              # Frontend logic
│   ├── style.css           # Glassmorphism styling
│   ├── server.js           # Express backend
│   └── api/
│       ├── execute.js      # Shell execution
│       └── write.js        # File operations
├── .env                    # Configuration
├── start_hands.bat         # Windows launcher
├── start_hands.ps1         # PowerShell launcher
└── README.md               # This file
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HANDSPROTOCOL_TOKEN` | Auth token for protected endpoints | `CHANGE_ME` |
| `PORT` | Server port | `5000` |
| `FREE_LLM_API_KEY` | Gemini API key (optional) | - |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `OLLAMA_BASE_URL` | Local Ollama URL (optional) | `http://localhost:11434` |

---

## 🤖 Using with External LLMs

1. Copy the contents of `.agent/workflows/hands_llm_primer.md`
2. Paste it as context to ChatGPT/Claude/Gemini
3. The LLM will now format responses as Hands Protocol directives
4. Paste the LLM's output into Hands Protocol for safe execution

---

## 📊 Related Projects

| Project | Description | Location |
|---------|-------------|----------|
| **Kno-It** | Multi-LLM Research Engine | `c:\Y-OS\Y-IT_ENGINES\kno-it` |
| **Y-IT Machine** | Parent ecosystem | `c:\Y-OS\Y-IT_ENGINES` |
| **Antigravity** | AI coding assistant | `.gemini` config |

---

## 📜 License

Part of the Y-OS ecosystem. Internal use.

---

*Last Updated: 2025-12-13*
