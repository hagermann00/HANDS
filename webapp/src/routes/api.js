const express = require('express');
const router = express.Router();

const QueueController = require('../controllers/QueueController');
const PlanController = require('../controllers/PlanController');
const safetyMiddleware = require('../middleware/safety');

// Parsing
router.post('/parse', PlanController.parse);

// Queue Management
router.post('/queue', QueueController.addToQueue);
router.get('/queue', QueueController.getPending);
router.delete('/queue', QueueController.clearQueue); // Simplified to clear all for now

// History
router.get('/history', QueueController.getHistory);
router.delete('/history', QueueController.clearHistory);

// Legacy/Compat Routes (can be deprecated or redirected)
// router.post('/execute', safetyMiddleware, ...) -> ExecutionService handles this via queue now

module.exports = router;
