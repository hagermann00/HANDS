/**
 * Antigravity Engine
 *
 * The standalone process that monitors the Hands Protocol queue and EXECUTES the plans.
 * Run this in the background: node antigravity.js
 */

const fs = require('fs');
const path = require('path');
const ExecutionService = require('./webapp/src/services/ExecutionService');

const QUEUE_DIR = path.resolve(__dirname, 'queue');
const PENDING_FILE = path.join(QUEUE_DIR, 'pending.json');
const HISTORY_FILE = path.join(QUEUE_DIR, 'history.json');
const POLL_INTERVAL = 2000;

console.log('🌌 Antigravity Engine Starting...');
console.log(`📂 Monitoring Queue: ${QUEUE_DIR}`);

// Ensure queue dir exists
if (!fs.existsSync(QUEUE_DIR)) {
    fs.mkdirSync(QUEUE_DIR, { recursive: true });
}

function getPending() {
    if (!fs.existsSync(PENDING_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    } catch (e) {
        console.error('Error reading pending file:', e.message);
        return [];
    }
}

function savePending(list) {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function addToHistory(plan, result) {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch (e) {}
    }

    const entry = {
        id: plan.planId,
        originalCommand: plan.originalCommand,
        status: result.success ? 'completed' : 'failed',
        result: result.results,
        error: result.success ? null : (result.error || 'Execution failed'),
        queuedAt: plan.queuedAt,
        completedAt: new Date().toISOString()
    };

    history.push(entry);
    if (history.length > 100) history = history.slice(-100);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

async function processQueue() {
    try {
        const pending = getPending();

        if (pending.length === 0) return;

        // Take the first item
        const item = pending[0];

        console.log(`\n⚡ Picked up task: ${item.planId}`);
        console.log(`   Command: "${item.originalCommand}"`);

        // Execute
        let result;
        try {
            result = await ExecutionService.executePlan(item);
        } catch (e) {
            console.error('   ❌ CRITICAL EXECUTION FAILURE:', e);
            result = { success: false, error: e.message, results: [] };
        }

        console.log(`   ✅ Execution finished. Success: ${result.success}`);

        // Update History
        addToHistory(item, result);

        // Remove from Pending (Atomic-ish: read fresh, filter, save)
        const freshPending = getPending();
        const updatedPending = freshPending.filter(p => p.planId !== item.planId);
        savePending(updatedPending);

        // Remove individual file if exists
        const planFile = path.join(QUEUE_DIR, `${item.planId}.json`);
        if (fs.existsSync(planFile)) fs.unlinkSync(planFile);

    } catch (e) {
        console.error('Error in process loop:', e);
    }
}

// Start polling
setInterval(processQueue, POLL_INTERVAL);
console.log('👀 Waiting for directives...\n');
