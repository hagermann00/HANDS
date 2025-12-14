// server.js – Hands Protocol Execution Engine
// ---------------------------------------------------------------
// Refactored to separate concerns:
// - /api routes -> src/routes/api.js
// - Execution Logic -> src/services/ExecutionService.js
// - Queue Logic -> src/services/QueueService.js

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve webapp root for index.html/app.js

// API Routes
const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);

// Auth Middleware (Simple Token)
const AUTH_TOKEN = process.env.HANDSPROTOCOL_TOKEN || 'CHANGE_ME';
function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
        // Warn but maybe allow for local dev convenience if needed?
        // Strict for now.
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Protect API routes?
// Currently applying globally to /api/queue writes, but reads might be open.
// For simplicity, let's keep it open for localhost usage or apply selectively in routes.

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Template Endpoints (Legacy support, maybe move to Controller later)
const workflowsDir = path.resolve(__dirname, '..', '.agent', 'workflows');
app.get('/api/templateList', (req, res) => {
    if (!fs.existsSync(workflowsDir)) return res.json([]);
    const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
    res.json(files.map(f => ({ name: f.replace('.md', '') })));
});
app.get('/api/template/:name', (req, res) => {
    const filePath = path.join(workflowsDir, req.params.name + '.md');
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.type('text/plain').send(fs.readFileSync(filePath, 'utf8'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Hands Protocol Staging Dock listening on http://localhost:${PORT}`);
    console.log(`📂 Serving static files from: ${__dirname}`);
    console.log(`📡 Queue location: ${path.resolve(__dirname, '../queue')}`);
});
