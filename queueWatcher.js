/**
 * Hands Protocol Queue Watcher
 * 
 * This service monitors the queue folder for pending tasks and:
 * 1. Picks up new tasks
 * 2. Updates task status
 * 3. Sends notifications to the AHK launcher via a lightweight endpoint
 * 
 * Run: node queueWatcher.js
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = path.join(__dirname, 'queue');
const POLL_INTERVAL = 2000; // Check every 2 seconds
const PENDING_FILE = path.join(QUEUE_DIR, 'pending.json');

console.log('🔍 Queue Watcher starting...');
console.log(`📁 Watching: ${QUEUE_DIR}`);

// Track which plans we've already processed
const processedPlans = new Set();

function watchQueue() {
    try {
        // Get all plan files
        const files = fs.readdirSync(QUEUE_DIR).filter(f => f.startsWith('plan_') && f.endsWith('.json'));

        for (const file of files) {
            const planId = file.replace('.json', '');

            // Skip if already processed this session
            if (processedPlans.has(planId)) continue;

            const filePath = path.join(QUEUE_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (content.status === 'pending') {
                console.log(`\n🆕 New task detected: ${planId}`);
                console.log(`   Command: ${content.originalCommand?.substring(0, 50)}...`);
                console.log(`   Queued at: ${content.queuedAt}`);

                // Mark as "picked_up" 
                content.status = 'picked_up';
                content.pickedUpAt = new Date().toISOString();
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

                console.log(`   ✅ Status updated to: picked_up`);
                console.log(`   📣 ANTIGRAVITY: Check this task!`);

                // Add to processed set
                processedPlans.add(planId);

                // Output the task details for Antigravity to see
                console.log('\n' + '='.repeat(60));
                console.log('📋 TASK FOR ANTIGRAVITY:');
                console.log('='.repeat(60));
                console.log(JSON.stringify(content, null, 2));
                console.log('='.repeat(60) + '\n');
            }
        }
    } catch (e) {
        // Ignore errors (file locked, etc)
    }
}

// Initial check
watchQueue();

// Continuous polling
setInterval(watchQueue, POLL_INTERVAL);

console.log(`⏱ Polling every ${POLL_INTERVAL}ms...`);
console.log('👀 Waiting for tasks...\n');
