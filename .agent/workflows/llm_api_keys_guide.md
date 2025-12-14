---
description: Guide to retrieving API keys for various LLM providers
---

# LLM API Key Retrieval Guide

## Quick Reference

| Provider | Free Tier | Key Location | Env Variable |
|----------|-----------|--------------|--------------|
| Google Gemini | ✅ Yes | ai.google.dev | `GOOGLE_API_KEY` |
| OpenAI | ❌ Paid | platform.openai.com | `OPENAI_API_KEY` |
| Anthropic | ❌ Paid | console.anthropic.com | `ANTHROPIC_API_KEY` |
| Mistral | ✅ Limited | console.mistral.ai | `MISTRAL_API_KEY` |
| Groq | ✅ Yes | console.groq.com | `GROQ_API_KEY` |
| Together AI | ✅ $25 credit | api.together.xyz | `TOGETHER_API_KEY` |
| Ollama | ✅ Free (local) | localhost:11434 | `OLLAMA_BASE_URL` |
| Cohere | ✅ Yes | dashboard.cohere.com | `COHERE_API_KEY` |
| Hugging Face | ✅ Yes | huggingface.co/settings | `HF_TOKEN` |

---

## 🟢 Google Gemini (Recommended - Free)

### Steps
1. Go to: https://ai.google.dev/
2. Click **"Get API key in Google AI Studio"**
3. Sign in with Google account
4. Click **"Create API key"**
5. Copy the key (starts with `AIza...`)

### Environment Setup
```env
GOOGLE_API_KEY=AIzaSy...your-key-here...
FREE_LLM_API_KEY=AIzaSy...your-key-here...
```

### Test Command
```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 🔵 OpenAI (GPT-4, GPT-3.5)

### Steps
1. Go to: https://platform.openai.com/
2. Sign up / Log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy immediately (shown only once)

### Environment Setup
```env
OPENAI_API_KEY=sk-...your-key-here...
```

### Test Command
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🟠 Anthropic (Claude)

### Steps
1. Go to: https://console.anthropic.com/
2. Sign up / Log in
3. Navigate to **API Keys**
4. Click **"Create Key"**
5. Copy the key

### Environment Setup
```env
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### Test Command
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🟣 Mistral AI

### Steps
1. Go to: https://console.mistral.ai/
2. Sign up / Log in
3. Navigate to **API Keys**
4. Click **"Create new key"**
5. Copy the key

### Environment Setup
```env
MISTRAL_API_KEY=...your-key-here...
```

### Test Command
```bash
curl https://api.mistral.ai/v1/chat/completions \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-small","messages":[{"role":"user","content":"Hello"}]}'
```

---

## ⚡ Groq (Fast Inference - Free)

### Steps
1. Go to: https://console.groq.com/
2. Sign up / Log in
3. Navigate to **API Keys**
4. Click **"Create API Key"**
5. Copy the key

### Environment Setup
```env
GROQ_API_KEY=gsk_...your-key-here...
```

### Test Command
```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mixtral-8x7b-32768","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🤝 Together AI ($25 Free Credit)

### Steps
1. Go to: https://api.together.xyz/
2. Sign up / Log in
3. Navigate to **API Keys**
4. Copy your key

### Environment Setup
```env
TOGETHER_API_KEY=...your-key-here...
```

### Test Command
```bash
curl https://api.together.xyz/v1/chat/completions \
  -H "Authorization: Bearer $TOGETHER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"meta-llama/Llama-3-70b-chat-hf","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🦙 Ollama (Free - Local)

### Steps
1. Download from: https://ollama.ai/
2. Install and run
3. Pull a model: `ollama pull llama2`
4. Server runs at `localhost:11434`

### Environment Setup
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Test Command
```bash
curl http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"Hello"}'
```

---

## 🔷 Cohere (Free Tier)

### Steps
1. Go to: https://dashboard.cohere.com/
2. Sign up / Log in
3. Navigate to **API Keys**
4. Copy your key

### Environment Setup
```env
COHERE_API_KEY=...your-key-here...
```

---

## 🤗 Hugging Face

### Steps
1. Go to: https://huggingface.co/settings/tokens
2. Sign up / Log in
3. Click **"New token"**
4. Select permissions (read is enough for inference)
5. Copy the token

### Environment Setup
```env
HF_TOKEN=hf_...your-token-here...
```

---

## 🔒 Storing Keys Securely

### In .env file (local development)
```env
# LLM API Keys
GOOGLE_API_KEY=your-key
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GROQ_API_KEY=gsk_xxx

# Default for Hands Protocol
FREE_LLM_API_KEY=your-preferred-free-key
```

### In Windows Environment Variables
```powershell
[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-xxx", "User")
```

### In production (use secrets manager)
- AWS Secrets Manager
- Google Secret Manager
- Azure Key Vault
- HashiCorp Vault

---

## ✅ Recommended Setup for Hands Protocol

1. **Primary (Free)**: Google Gemini 1.5 Flash
2. **Fallback (Free)**: Groq
3. **Local (Free)**: Ollama with Llama2
4. **Premium (Paid)**: OpenAI GPT-4 or Anthropic Claude

```env
# Hands Protocol .env configuration
FREE_LLM_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-key-as-backup
OLLAMA_BASE_URL=http://localhost:11434
```

---

**End of API Key Retrieval Guide**
