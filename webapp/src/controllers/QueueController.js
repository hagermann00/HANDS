const QueueService = require('../services/QueueService');

class QueueController {

    addToQueue(req, res) {
        try {
            const plan = req.body;
            if (!plan.planId) {
                return res.status(400).json({ error: "Missing planId" });
            }
            const queued = QueueService.addToQueue(plan);
            res.json({ status: 'queued', planId: queued.planId, message: "Queued for execution." });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    getPending(req, res) {
        try {
            const pending = QueueService.getPending();
            res.json(pending);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    removeFromQueue(req, res) {
        // Implementation pending in Service if needed
        res.json({ status: 'not_implemented' });
    }

    getHistory(req, res) {
        try {
            const history = QueueService.getHistory();
            res.json(history);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    clearHistory(req, res) {
        try {
            QueueService.clearHistory();
            res.json({ status: 'cleared' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    clearQueue(req, res) {
        try {
            QueueService.clearQueue();
            res.json({ status: 'cleared' });
        } catch(e) {
             res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new QueueController();
