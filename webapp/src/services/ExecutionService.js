const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { checkCommandSafety, checkWriteSafety } = require('../utils/safetyUtils');

class ExecutionService {
    constructor() {
        this.timeout = process.env.EXEC_TIMEOUT ? parseInt(process.env.EXEC_TIMEOUT) : 60000;
    }

    /**
     * Execute a full plan
     * @param {Object} plan - The plan object with steps
     * @returns {Object} result - Execution results
     */
    async executePlan(plan) {
        console.log(`🚀 ExecutionService: Starting plan ${plan.id}`);
        const results = [];
        let success = true;

        for (const step of plan.plan) {
            let stepResult = { step: step.step, action: step.action, type: step.type, status: 'pending' };

            try {
                if (step.type === 'command') {
                    const output = await this.runCommand(step.action);
                    stepResult.status = 'success';
                    stepResult.output = output;
                } else if (step.type === 'file' || step.type === 'write') {
                    // For file writes, we rely on the parser to have populated 'path' and 'content'.
                    // If the parser put them in the 'action' string (e.g. "Write file X"), we might need extraction.
                    // But assuming our upgraded parser puts them in specific fields:
                    if (step.path && step.content) {
                        await this.writeFile(step.path, step.content);
                        stepResult.status = 'success';
                    } else {
                        // Attempt to extract from 'action' if path/content missing?
                        // For now, fail safe.
                         stepResult.status = 'skipped';
                         stepResult.message = 'Missing path or content for file operation';
                    }
                } else if (step.type === 'template') {
                    stepResult.status = 'success';
                    stepResult.message = `Template ${step.template} applied (simulated)`;
                } else {
                    stepResult.status = 'skipped';
                    stepResult.message = `Unknown step type: ${step.type}`;
                }
            } catch (error) {
                console.error(`❌ Step ${step.step} failed:`, error);
                stepResult.status = 'failed';
                stepResult.error = error.message;
                success = false;
                // Stop on first failure to prevent cascading damage
                break;
            }

            results.push(stepResult);
        }

        return {
            id: plan.id,
            success,
            results,
            completedAt: new Date().toISOString()
        };
    }

    runCommand(command) {
        return new Promise((resolve, reject) => {
            const safety = checkCommandSafety(command);
            if (!safety.safe) {
                return reject(new Error(`SAFETY BLOCK: ${safety.reason}`));
            }

            console.log(`⚡ Executing: ${command}`);
            exec(command, { timeout: this.timeout, cwd: process.cwd() }, (err, stdout, stderr) => {
                if (err) {
                    return reject(new Error(stderr || err.message));
                }
                resolve(stdout);
            });
        });
    }

    writeFile(filePath, content) {
        return new Promise((resolve, reject) => {
             const safety = checkWriteSafety(filePath);
             if (!safety.safe) {
                 return reject(new Error(`SAFETY BLOCK: ${safety.reason}`));
             }

             const absolute = path.resolve(process.cwd(), filePath);
             console.log(`📝 Writing file: ${absolute}`);

             const dir = path.dirname(absolute);
             fs.mkdirSync(dir, { recursive: true });
             fs.writeFileSync(absolute, content, 'utf8');
             resolve(absolute);
        });
    }
}

module.exports = new ExecutionService();
