// server.js – Minimal Express server with simple token auth for Hands Protocol
// ---------------------------------------------------------------
// 1️⃣ Serves the static UI (index.html, style.css, app.js)
// 2️⃣ Exposes POST /run that expects a JSON payload with the LLM directive
// 3️⃣ Checks an Authorization header against a secret stored in .env (HANDSPROTOCOL_TOKEN)
// 4️⃣ If auth passes, forwards the payload to the mock dispatcher (or real Antigravity API)
// ---------------------------------------------------------------

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { interpretNL } = require('./interpret');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API route registrations
const executeRouter = require('./api/execute');
const writeRouter = require('./api/write');
app.use('/api/execute', executeRouter);
app.use('/api/write', writeRouter);

// Simple token guard
const AUTH_TOKEN = process.env.HANDSPROTOCOL_TOKEN || 'CHANGE_ME';

function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized – invalid or missing token' });
    }
    next();
}

// POST /run – receives the LLM directive
app.post('/run', authMiddleware, (req, res) => {
    const directive = req.body;
    if (!directive || typeof directive !== 'object') {
        return res.status(400).json({ error: 'Invalid directive payload' });
    }
    const mockLog = `🛡️ Authenticated request\n📦 Received directive type: ${directive.type}\n🔧 (Mock) Orchestration would start now…`;
    res.json({ status: 'accepted', log: mockLog });
});

// POST /api/refine – Refine code snippets via free LLM
app.post('/api/refine', async (req, res) => {
    const { directive } = req.body;
    if (!directive) {
        return res.status(400).json({ error: 'Missing directive payload' });
    }
    const { refineSnippet } = require('./refine');
    const refined = { ...directive };
    if (refined.params) {
        for (const [key, val] of Object.entries(refined.params)) {
            if (typeof val === 'string' && (val.includes('function') || val.includes('{'))) {
                refined.params[key] = await refineSnippet(val);
            }
        }
    }
    res.json({ refined });
});

// ---------- MODEL CONFIG ENDPOINTS ----------
const modelConfigPath = path.resolve(__dirname, 'modelConfig.json');

// GET current model config
app.get('/api/modelConfig', authMiddleware, (req, res) => {
    if (!fs.existsSync(modelConfigPath)) return res.status(404).json({ error: 'Config not found' });
    const cfg = JSON.parse(fs.readFileSync(modelConfigPath, 'utf8'));
    res.json(cfg);
});

// PUT updated model config
app.put('/api/modelConfig', authMiddleware, (req, res) => {
    const newCfg = req.body;
    if (!newCfg.model) return res.status(400).json({ error: 'Model name required' });
    fs.writeFileSync(modelConfigPath, JSON.stringify(newCfg, null, 2), 'utf8');
    res.json({ status: 'saved' });
});

// ---------- TEMPLATE MANAGEMENT ENDPOINTS ----------
const workflowsDir = path.resolve(__dirname, '..', '.agent', 'workflows');
const metadataPath = path.join(workflowsDir, 'metadata.json');

// Helper to load metadata
function loadMetadata() {
    if (!fs.existsSync(metadataPath)) return {};
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}
function saveMetadata(data) {
    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/templateList - list all templates (excluding quarantined) - NO AUTH for easy loading
app.get('/api/templateList', (req, res) => {
    if (!fs.existsSync(workflowsDir)) {
        return res.json([]);
    }
    const meta = loadMetadata();
    const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
    const list = files
        .map(f => ({ name: f.replace('.md', ''), quarantined: meta[f.replace('.md', '')]?.quarantined || false }))
        .filter(t => !t.quarantined);
    res.json(list);
});

// GET /api/template/:name - get template content - NO AUTH for easy viewing
app.get('/api/template/:name', (req, res) => {
    const filePath = path.join(workflowsDir, req.params.name + '.md');
    if (!fs.existsSync(filePath)) return res.status(404).send('Template not found');
    res.type('text/plain').send(fs.readFileSync(filePath, 'utf8'));
});

// PUT /api/template/:name - update template content
app.put('/api/template/:name', authMiddleware, (req, res) => {
    const filePath = path.join(workflowsDir, req.params.name + '.md');
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Missing content' });
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ status: 'saved' });
});

// POST /api/combine - combine multiple templates
app.post('/api/combine', authMiddleware, (req, res) => {
    const { names } = req.body;
    if (!names || names.length < 2) return res.status(400).json({ error: 'Need at least 2 templates' });
    let combined = '';
    for (const name of names) {
        const filePath = path.join(workflowsDir, name + '.md');
        if (fs.existsSync(filePath)) {
            combined += `\n\n# --- ${name} ---\n\n` + fs.readFileSync(filePath, 'utf8');
        }
    }
    const combinedName = `combined_${Date.now()}`;
    fs.writeFileSync(path.join(workflowsDir, combinedName + '.md'), combined.trim(), 'utf8');
    res.json({ combinedName });
});

// GET /api/metadata/:name - get template metadata - NO AUTH
app.get('/api/metadata/:name', (req, res) => {
    const meta = loadMetadata();
    res.json(meta[req.params.name] || {});
});

// PUT /api/metadata/:name - save template metadata
app.put('/api/metadata/:name', authMiddleware, (req, res) => {
    const meta = loadMetadata();
    meta[req.params.name] = { ...meta[req.params.name], ...req.body };
    saveMetadata(meta);
    res.json({ status: 'saved' });
});

// PATCH /api/quarantine/:name - quarantine a template
app.patch('/api/quarantine/:name', authMiddleware, (req, res) => {
    const meta = loadMetadata();
    meta[req.params.name] = { ...meta[req.params.name], quarantined: true };
    saveMetadata(meta);
    res.json({ status: 'quarantined' });
});

// ---------- NATURAL LANGUAGE PLANNING (HARD STOP) ----------

// Template keyword mapping for intelligent matching
const templateKeywords = {
    'npm_project_init': ['npm', 'node', 'package.json', 'init project', 'new project'],
    'git_repo_setup': ['git', 'repository', 'repo', 'version control', 'gitignore'],
    'python_venv_setup': ['python', 'venv', 'virtual environment', 'pip', 'requirements'],
    'env_config_setup': ['env', 'environment variables', 'dotenv', 'config', 'secrets'],
    'api_scaffold': ['api', 'rest', 'express', 'routes', 'controllers', 'backend'],
    'api_security_setup': ['security', 'rate limit', 'cors', 'helmet', 'protection'],
    'jwt_auth_setup': ['jwt', 'auth', 'authentication', 'login', 'register', 'token'],
    'database_setup': ['database', 'sqlite', 'sql', 'migrations', 'db'],
    'redis_cache_setup': ['redis', 'cache', 'caching', 'session'],
    'docker_containerize': ['docker', 'container', 'dockerfile', 'compose'],
    'github_actions_cicd': ['github actions', 'ci/cd', 'cicd', 'pipeline', 'workflow'],
    'deploy_static_site': ['deploy', 'netlify', 'github pages', 'static', 'hosting'],
    'google_cloud_setup': ['google cloud', 'gcp', 'cloud run', 'firebase'],
    'websocket_setup': ['websocket', 'socket', 'real-time', 'realtime', 'socket.io'],
    'email_setup': ['email', 'nodemailer', 'smtp', 'mail', 'send email'],
    'file_upload_setup': ['upload', 'file upload', 'multer', 'files'],
    'logging_setup': ['logging', 'winston', 'pino', 'logs', 'log'],
    'testing_setup': ['test', 'jest', 'pytest', 'testing', 'unit test'],
    'frontend_setup': ['react', 'next.js', 'vite', 'frontend', 'ui']
};

// Risk assessment keywords
const dangerKeywords = ['delete', 'remove', 'rm ', 'rm -rf', 'drop', 'force', 'override', 'reset --hard'];
const cautionKeywords = ['install', 'write', 'create', 'modify', 'update', 'npm', 'pip'];

function assessRisk(text) {
    const lower = text.toLowerCase();
    if (dangerKeywords.some(k => lower.includes(k))) return 'danger';
    if (cautionKeywords.some(k => lower.includes(k))) return 'caution';
    return 'safe';
}

function matchTemplates(command) {
    const lower = command.toLowerCase();
    const matched = [];
    for (const [template, keywords] of Object.entries(templateKeywords)) {
        if (keywords.some(k => lower.includes(k))) {
            matched.push(template);
        }
    }
    return matched;
}

function generatePlan(command) {
    const templates = matchTemplates(command);
    const steps = [];
    const warnings = [];

    // Add template-based steps
    templates.forEach((t, i) => {
        steps.push({
            step: i + 1,
            action: 'Apply template',
            template: t,
            type: 'template',
            risk: 'safe'
        });
    });

    // Detect common commands in the request
    const lower = command.toLowerCase();

    if (lower.includes('npm install') || lower.includes('install dependencies')) {
        steps.push({ step: steps.length + 1, action: 'npm install', type: 'command', risk: 'caution' });
        warnings.push('Will download npm packages');
    }

    if (lower.includes('create') || lower.includes('new project') || lower.includes('init')) {
        warnings.push('Will create new files/directories');
    }

    if (lower.includes('delete') || lower.includes('remove')) {
        warnings.push('⚠️ DESTRUCTIVE OPERATION - Files may be deleted');
    }

    // Overall risk assessment
    const overallRisk = assessRisk(command);

    return {
        originalCommand: command,
        plan: steps,
        templates: templates,
        warnings: warnings,
        overallRisk: overallRisk,
        requiresConfirmation: true, // Always require confirmation (HARD STOP)
        planId: `plan_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        message: steps.length > 0
            ? '🛡️ HARD STOP: Review the plan above. Nothing has been executed yet.'
            : '⚠️ No matching templates found. Please provide more specific instructions.'
    };
}

// POST /api/parse - UNIFIED SMART PARSER for all formats
app.post('/api/parse', async (req, res) => {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Missing "input" field (string)' });
    }

    const trimmed = input.trim();
    let detectedFormat = 'natural_language';
    let parsed = null;
    let description = '';
    let steps = [];
    let templates = [];
    let warnings = [];
    let workingDirectory = '';

    // Detect format and parse
    try {
        // Try JSON first
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            parsed = JSON.parse(trimmed);
            detectedFormat = 'json';
            description = parsed.description || parsed.originalCommand || 'JSON Directive';
            steps = parsed.steps || [];
            templates = parsed.templates || [];
            warnings = parsed.warnings || [];
            workingDirectory = parsed.workingDirectory || '';
        }
        // Try YAML (starts with key: value or ---)
        else if (trimmed.match(/^(---|[a-zA-Z_]+\s*:)/m)) {
            // Simple YAML parsing (for basic structures)
            detectedFormat = 'yaml';
            const lines = trimmed.split('\n');
            const yamlObj = {};
            let currentKey = '';
            let inArray = false;
            let arrayKey = '';

            for (const line of lines) {
                if (line.startsWith('---')) continue;
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    currentKey = match[1];
                    const value = match[2];
                    if (value) {
                        yamlObj[currentKey] = value;
                    } else {
                        yamlObj[currentKey] = [];
                        inArray = true;
                        arrayKey = currentKey;
                    }
                } else if (inArray && line.trim().startsWith('-')) {
                    const item = line.trim().substring(1).trim();
                    if (item) yamlObj[arrayKey].push(item);
                }
            }

            description = yamlObj.description || 'YAML Directive';
            templates = yamlObj.templates || [];
            warnings = yamlObj.warnings || [];
            workingDirectory = yamlObj.workingDirectory || '';

            // Try to extract steps
            if (yamlObj.steps && Array.isArray(yamlObj.steps)) {
                steps = yamlObj.steps;
            }
        }
        // Check for Markdown with embedded JSON/directives
        else if (trimmed.includes('```json') || trimmed.includes('### Directive') || trimmed.includes('## Step')) {
            detectedFormat = 'verbose_markdown';

            // Extract description from title or first paragraph
            const titleMatch = trimmed.match(/^#\s+(?:Task:\s*)?(.+)$/m);
            description = titleMatch ? titleMatch[1] : 'Verbose Markdown Instructions';

            // Extract all JSON blocks
            const jsonBlocks = trimmed.match(/```json\s*([\s\S]*?)```/g) || [];
            for (const block of jsonBlocks) {
                const jsonStr = block.replace(/```json\s*/, '').replace(/```/, '').trim();
                try {
                    const directive = JSON.parse(jsonStr);
                    if (directive.steps) steps.push(...directive.steps);
                    if (directive.templates) templates.push(...directive.templates);
                    if (directive.warnings) warnings.push(...directive.warnings);
                    if (directive.workingDirectory) workingDirectory = directive.workingDirectory;
                } catch (e) {
                    // Not valid JSON, skip
                }
            }

            // Extract bash commands
            const bashBlocks = trimmed.match(/```bash\s*([\s\S]*?)```/g) || [];
            for (const block of bashBlocks) {
                const cmd = block.replace(/```bash\s*/, '').replace(/```/, '').trim();
                if (cmd && !cmd.includes('#')) {
                    steps.push({
                        step: steps.length + 1,
                        action: cmd,
                        type: 'command',
                        risk: assessRisk(cmd)
                    });
                }
            }

            // Extract warnings from markdown
            const warningMatches = trimmed.match(/⚠️\s*\*?\*?([^*\n]+)\*?\*?/g) || [];
            for (const w of warningMatches) {
                const cleaned = w.replace(/⚠️\s*\*?\*?/, '').replace(/\*?\*?$/, '').trim();
                if (cleaned && !warnings.includes(cleaned)) {
                    warnings.push(cleaned);
                }
            }
        }
        // Natural language fallback
        else {
            try {
                // Try LLM interpretation first
                const llmResult = await interpretNL(trimmed);
                parsed = llmResult;
                detectedFormat = 'json_llm';

                // Map fields
                description = parsed.description || trimmed.substring(0, 200);
                workingDirectory = parsed.workingDirectory || '';
                steps = parsed.steps || [];
                templates = parsed.templates || [];
                warnings = parsed.warnings || [];

            } catch (ignore) {
                console.warn('LLM Interpret failed:', ignore.message);
                // Fallback to keyword match if LLM fails
                detectedFormat = 'natural_language';
                description = trimmed.substring(0, 200);
            }
        }
    } catch (e) {
        // Parsing failed, treat as natural language
        detectedFormat = 'natural_language';
        description = trimmed.substring(0, 200);
    }

    // For natural language, also match templates
    const matchedTemplates = matchTemplates(trimmed);
    templates = [...new Set([...templates, ...matchedTemplates])];

    // If no steps extracted, generate from natural language
    if (steps.length === 0) {
        const nlPlan = generatePlan(trimmed);
        steps = nlPlan.plan;
        if (templates.length === 0) templates = nlPlan.templates;
        if (warnings.length === 0) warnings = nlPlan.warnings;
    }

    // Overall risk assessment
    const overallRisk = assessRisk(trimmed);

    // 🛡️ CRITICAL SAFETY: Check for Root Directory Overwrite
    // Normalize paths for comparison
    const serverRoot = path.resolve(__dirname, '..').toLowerCase();
    const targetDir = workingDirectory ? path.resolve(workingDirectory).toLowerCase() : '';

    // If target is Hands Root OR Server Dir, and we are running templates/files
    if (targetDir && (targetDir === serverRoot || targetDir === __dirname.toLowerCase())) {
        if (templates.length > 0 || steps.some(s => s.action === 'file' || s.action === 'write')) {
            warnings.push("⛔ CRITICAL: Target is HANDS ROOT. Operation blocked to prevent self-destruction.");
            warnings.push("➡️ FIX: Specify a sub-directory (e.g., C:\\Y-OS\\Y-IT_ENGINES\\HANDS\\my-new-project)");
            // Force working directory to be unknown/empty to prevent execution
            workingDirectory = "BLOCKED_ROOT_PROTECTION";
        }
    }

    const result = {
        detectedFormat: detectedFormat,
        originalInput: trimmed,
        originalCommand: description,
        workingDirectory: workingDirectory,
        plan: steps,
        templates: templates,
        warnings: warnings,
        overallRisk: overallRisk,
        requiresConfirmation: true,
        planId: `plan_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        message: '🛡️ HARD STOP: Review the plan above. Nothing has been executed yet.'
    };

    console.log(`📋 Parsed input (${detectedFormat}): "${description.substring(0, 50)}..." → ${templates.length} templates, ${steps.length} steps`);

    res.json(result);
});

// POST /api/execute-plan - Execute a confirmed plan (REQUIRES AUTH)
app.post('/api/execute-plan', authMiddleware, async (req, res) => {
    const { planId, confirmed, plan } = req.body;

    if (!confirmed) {
        return res.status(400).json({
            error: 'Plan not confirmed. Set "confirmed": true to execute.',
            hint: 'This is a safety feature. Review the plan before confirming.'
        });
    }

    if (!planId || !plan) {
        return res.status(400).json({ error: 'Missing planId or plan data' });
    }

    console.log(`✅ Plan ${planId} confirmed. Executing...`);

    const results = [];

    for (const step of plan) {
        if (step.type === 'template') {
            // Load and return template content
            const templatePath = path.join(workflowsDir, step.template + '.md');
            if (fs.existsSync(templatePath)) {
                const content = fs.readFileSync(templatePath, 'utf8');
                results.push({
                    step: step.step,
                    action: step.action,
                    template: step.template,
                    status: 'loaded',
                    content: content.substring(0, 500) + '...' // Preview only
                });
            } else {
                results.push({
                    step: step.step,
                    action: step.action,
                    template: step.template,
                    status: 'not_found'
                });
            }
        } else if (step.type === 'command') {
            // For now, just acknowledge - actual execution goes through /api/execute
            results.push({
                step: step.step,
                action: step.action,
                type: 'command',
                status: 'pending',
                message: 'Use /api/execute to run shell commands'
            });
        }
    }

    res.json({
        planId: planId,
        executedAt: new Date().toISOString(),
        results: results,
        message: '🚀 Plan executed. Template contents loaded.'
    });
});

// ---------- ANTIGRAVITY QUEUE (FIRE TO EXECUTE) ----------
const queueDir = path.resolve(__dirname, '..', 'queue');

// Ensure queue directory exists
if (!fs.existsSync(queueDir)) {
    fs.mkdirSync(queueDir, { recursive: true });
}

// POST /api/queue - Fire approved directive to Antigravity queue
app.post('/api/queue', (req, res) => {
    const { planId, originalCommand, plan, templates, warnings, overallRisk } = req.body;

    if (!planId || !originalCommand) {
        return res.status(400).json({ error: 'Missing planId or originalCommand' });
    }

    const queueItem = {
        id: planId,
        status: 'pending',
        queuedAt: new Date().toISOString(),
        originalCommand: originalCommand,
        plan: plan || [],
        templates: templates || [],
        warnings: warnings || [],
        overallRisk: overallRisk || 'unknown',
        // Format as Antigravity-ready prompt
        antigravityPrompt: formatForAntigravity(originalCommand, plan, templates)
    };

    // Write to queue file
    const queueFile = path.join(queueDir, `${planId}.json`);
    fs.writeFileSync(queueFile, JSON.stringify(queueItem, null, 2), 'utf8');

    // Also update the pending.json for easy watching
    const pendingFile = path.join(queueDir, 'pending.json');
    let pending = [];
    if (fs.existsSync(pendingFile)) {
        try {
            pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
        } catch (e) {
            pending = [];
        }
    }
    pending.push(queueItem);
    fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2), 'utf8');

    console.log(`🔥 FIRED TO ANTIGRAVITY: ${planId}`);
    console.log(`   Command: "${originalCommand.substring(0, 60)}..."`);
    console.log(`   Templates: ${templates.join(', ')}`);

    res.json({
        status: 'queued',
        planId: planId,
        message: '🔥 Directive queued for Antigravity execution!',
        queueFile: queueFile
    });
});

// GET /api/queue - List pending queue items (for monitoring)
app.get('/api/queue', (req, res) => {
    const pendingFile = path.join(queueDir, 'pending.json');
    if (!fs.existsSync(pendingFile)) {
        return res.json([]);
    }
    try {
        const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
        res.json(pending);
    } catch (e) {
        res.json([]);
    }
});

// DELETE /api/queue/:planId - Mark item as processed
app.delete('/api/queue/:planId', (req, res) => {
    const pendingFile = path.join(queueDir, 'pending.json');
    if (!fs.existsSync(pendingFile)) {
        return res.json({ status: 'not_found' });
    }

    try {
        let pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
        pending = pending.filter(item => item.id !== req.params.planId);
        fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2), 'utf8');
        res.json({ status: 'removed', planId: req.params.planId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper: Format directive as Antigravity-ready prompt
function formatForAntigravity(command, plan, templates) {
    let prompt = `EXECUTE APPROVED DIRECTIVE FROM HANDS PROTOCOL:\n\n`;
    prompt += `Original Request: "${command}"\n\n`;

    if (templates && templates.length > 0) {
        prompt += `Templates to Apply: ${templates.join(', ')}\n\n`;
    }

    if (plan && plan.length > 0) {
        prompt += `Steps:\n`;
        plan.forEach(step => {
            prompt += `${step.step}. [${step.type}] ${step.action}`;
            if (step.template) prompt += `: ${step.template}`;
            prompt += `\n`;
        });
        prompt += `\n`;
    }

    prompt += `GO AHEAD - Execute all steps above. This directive was reviewed and approved by the user in Hands Protocol.`;

    return prompt;
}

// ---------- TASK HISTORY ----------
const historyFile = path.join(queueDir, 'history.json');

// GET /api/history - Get completed tasks
app.get('/api/history', (req, res) => {
    if (!fs.existsSync(historyFile)) {
        return res.json([]);
    }
    try {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        // Return most recent first
        res.json(history.reverse().slice(0, 50));
    } catch (e) {
        res.json([]);
    }
});

// POST /api/history - Add completed task to history
app.post('/api/history', (req, res) => {
    const { planId, status, result, error } = req.body;

    if (!planId) {
        return res.status(400).json({ error: 'Missing planId' });
    }

    // Load existing history
    let history = [];
    if (fs.existsSync(historyFile)) {
        try {
            history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (e) {
            history = [];
        }
    }

    // Find the task in pending queue or individual files
    let task = null;
    const taskFile = path.join(queueDir, `${planId}.json`);
    if (fs.existsSync(taskFile)) {
        try {
            task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
        } catch (e) { }
    }

    // Create history entry
    const historyEntry = {
        id: planId,
        originalCommand: task?.originalCommand || 'Unknown',
        templates: task?.templates || [],
        plan: task?.plan || [],
        status: status || 'completed',
        result: result || null,
        error: error || null,
        queuedAt: task?.queuedAt || null,
        completedAt: new Date().toISOString()
    };

    history.push(historyEntry);

    // Keep only last 100 entries
    if (history.length > 100) {
        history = history.slice(-100);
    }

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');

    // Remove from pending queue
    const pendingFile = path.join(queueDir, 'pending.json');
    if (fs.existsSync(pendingFile)) {
        try {
            let pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
            pending = pending.filter(item => item.id !== planId);
            fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2), 'utf8');
        } catch (e) { }
    }

    // Remove individual task file
    if (fs.existsSync(taskFile)) {
        fs.unlinkSync(taskFile);
    }

    console.log(`✅ Task completed: ${planId} (${status})`);

    res.json({ status: 'added', entry: historyEntry });
});

// DELETE /api/history - Clear history
app.delete('/api/history', (req, res) => {
    fs.writeFileSync(historyFile, '[]', 'utf8');
    res.json({ status: 'cleared' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Hands Protocol server listening on http://localhost:${PORT}`);
});
