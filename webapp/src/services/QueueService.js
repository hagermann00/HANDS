const fs = require('fs');
const path = require('path');

class QueueService {
    constructor() {
        // queue directory is strictly 'queue' at root of project
        // __dirname is webapp/src/services
        // ../../.. goes to webapp/../ -> root
        this.queueDir = path.resolve(__dirname, '../../../queue');
        this.pendingFile = path.join(this.queueDir, 'pending.json');
        this.historyFile = path.join(this.queueDir, 'history.json');

        // Ensure queue exists
        if (!fs.existsSync(this.queueDir)) {
            fs.mkdirSync(this.queueDir, { recursive: true });
        }
    }

    /**
     * Add a plan to the queue (Staging only)
     */
    addToQueue(plan) {
        // 1. Save individual plan file
        const planFile = path.join(this.queueDir, `${plan.planId}.json`);
        // Ensure status is pending
        plan.status = 'pending';
        plan.queuedAt = new Date().toISOString();

        fs.writeFileSync(planFile, JSON.stringify(plan, null, 2), 'utf8');

        // 2. Update pending.json list
        let pending = this.getPending();
        pending.push(plan);
        fs.writeFileSync(this.pendingFile, JSON.stringify(pending, null, 2), 'utf8');

        console.log(`📥 Added to queue: ${plan.planId}`);

        return plan;
    }

    getPending() {
        if (!fs.existsSync(this.pendingFile)) return [];
        try {
            return JSON.parse(fs.readFileSync(this.pendingFile, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    // History is now managed primarily by the external engine, but we read it here
    getHistory() {
        if (!fs.existsSync(this.historyFile)) return [];
        try {
            return JSON.parse(fs.readFileSync(this.historyFile, 'utf8')).reverse();
        } catch (e) {
            return [];
        }
    }

    clearHistory() {
        fs.writeFileSync(this.historyFile, '[]', 'utf8');
    }

    clearQueue() {
        const pending = this.getPending();
        for(const item of pending) {
             const planFile = path.join(this.queueDir, `${item.id}.json`);
             if (fs.existsSync(planFile)) fs.unlinkSync(planFile);
        }
        fs.writeFileSync(this.pendingFile, '[]', 'utf8');
    }
}

module.exports = new QueueService();
