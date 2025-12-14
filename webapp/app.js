// -------------------------------------------------
// Hands Protocol – Front-end orchestration & UI logic
// -------------------------------------------------

/* ---------- GLOBAL HELPERS ---------- */
function authHeaders() {
    const token = localStorage.getItem('handsToken') || '';
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/* ---------- SPINNER UTILITIES ---------- */
function showSpinner(message) {
    const overlay = document.getElementById('spinnerOverlay');
    const msgEl = document.getElementById('spinnerMessage');
    if (overlay && msgEl) {
        msgEl.textContent = message || 'Processing…';
        overlay.classList.remove('hidden');
    }
}
function hideSpinner() {
    const overlay = document.getElementById('spinnerOverlay');
    if (overlay) overlay.classList.add('hidden');
}

/* ---------- LLM PRIMER COPY ---------- */
const copyPrimerBtn = document.getElementById('copyPrimerBtn');
const copyStatus = document.getElementById('copyStatus');

if (copyPrimerBtn) {
    copyPrimerBtn.addEventListener('click', async () => {
        try {
            // Fetch the primer template
            const res = await fetch('/api/template/hands_llm_primer');
            if (!res.ok) {
                alert('Could not load LLM primer template.');
                return;
            }

            let content = await res.text();

            // Extract only the content after the "Copy everything below this line" marker
            const marker = '---\n\n## 🤖 SYSTEM CONTEXT';
            const startIndex = content.indexOf(marker);
            if (startIndex !== -1) {
                content = content.substring(startIndex + 4); // Skip the "---\n"
            }

            // Copy to clipboard
            await navigator.clipboard.writeText(content.trim());

            // Show success
            copyPrimerBtn.textContent = '✅ Copied!';
            copyPrimerBtn.style.background = 'hsl(160, 60%, 42%)';
            copyStatus.classList.remove('hidden');

            // Reset after 3 seconds
            setTimeout(() => {
                copyPrimerBtn.textContent = '📋 Copy to Clipboard';
                copyPrimerBtn.style.background = '';
                copyStatus.classList.add('hidden');
            }, 3000);

        } catch (e) {
            alert('Failed to copy: ' + e.message);
        }
    });
}

/* ---------- TEMPLATE UI ---------- */
const templateSelect = document.getElementById('templateSelect');
const loadBtn = document.getElementById('loadBtn');
const combineBtn = document.getElementById('combineBtn');
const quarantineBtn = document.getElementById('quarantineBtn');
const preview = document.getElementById('templatePreview');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const commentInput = document.getElementById('commentInput');
const scoreInput = document.getElementById('scoreInput');
const metaSaveBtn = document.getElementById('metaSaveBtn');
let currentTemplate = null;

async function loadTemplateList() {
    try {
        const res = await fetch('/api/templateList', { headers: authHeaders() });
        if (!res.ok) {
            console.error('Failed to load templates:', res.status);
            return;
        }
        const list = await res.json();
        templateSelect.innerHTML = '';
        if (list.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = '(No templates found)';
            templateSelect.appendChild(opt);
            return;
        }
        list.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = t.name.replace(/_/g, ' ');
            templateSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading templates:', e);
    }
}
loadTemplateList();

if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
        const name = templateSelect.value;
        if (!name || name === '(No templates found)') return alert('Select a template first.');
        const res = await fetch(`/api/template/${name}`, { headers: authHeaders() });
        const md = await res.text();
        preview.value = md;
        preview.readOnly = true;
        if (saveBtn) saveBtn.hidden = true;
        currentTemplate = name;
        // load metadata
        const metaRes = await fetch(`/api/metadata/${name}`, { headers: authHeaders() });
        const meta = await metaRes.json();
        if (commentInput) commentInput.value = meta.comment || '';
        if (scoreInput) scoreInput.value = meta.score ?? '';
    });
}

if (editBtn) {
    editBtn.addEventListener('click', () => {
        preview.readOnly = false;
        if (saveBtn) saveBtn.hidden = false;
    });
}

if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        if (!currentTemplate) return;
        await fetch(`/api/template/${currentTemplate}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ content: preview.value })
        });
        preview.readOnly = true;
        saveBtn.hidden = true;
        alert('Template saved.');
    });
}

if (combineBtn) {
    combineBtn.addEventListener('click', async () => {
        const selected = Array.from(templateSelect.selectedOptions).map(o => o.value);
        if (selected.length < 2) return alert('Select at least two templates to combine.');
        const res = await fetch('/api/combine', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ names: selected })
        });
        const { combinedName } = await res.json();
        alert(`Combined template created: ${combinedName}`);
        await loadTemplateList();
    });
}

if (quarantineBtn) {
    quarantineBtn.addEventListener('click', async () => {
        if (!currentTemplate) return alert('Load a template first.');
        await fetch(`/api/quarantine/${currentTemplate}`, {
            method: 'PATCH',
            headers: authHeaders()
        });
        alert('Template quarantined.');
        await loadTemplateList();
        preview.value = '';
        if (commentInput) commentInput.value = '';
        if (scoreInput) scoreInput.value = '';
        currentTemplate = null;
    });
}

if (metaSaveBtn) {
    metaSaveBtn.addEventListener('click', async () => {
        if (!currentTemplate) return alert('Load a template first.');
        await fetch(`/api/metadata/${currentTemplate}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ comment: commentInput.value, score: Number(scoreInput.value) })
        });
        alert('Metadata saved.');
    });
}

/* ---------- MODE SWITCH ---------- */
const modeRadios = document.getElementsByName('mode');
const jsonArea = document.getElementById('jsonArea');
const nlArea = document.getElementById('nlArea');
function updateMode() {
    const checked = document.querySelector('input[name="mode"]:checked');
    if (!checked) return;
    const mode = checked.value;
    if (jsonArea) jsonArea.hidden = mode !== 'json';
    if (nlArea) nlArea.hidden = mode !== 'nl';
}
if (modeRadios.length > 0) {
    modeRadios.forEach(r => r.addEventListener('change', updateMode));
    updateMode();
}

/* ---------- ORCHESTRATION (JSON) ---------- */
const directiveInput = document.getElementById('directiveInput');
const runBtn = document.getElementById('runBtn');
const outputArea = document.getElementById('outputArea');
const outputLog = document.getElementById('outputLog');

if (runBtn) {
    runBtn.addEventListener('click', async () => {
        const raw = directiveInput.value.trim();
        if (!raw) return alert('Paste a JSON directive.');
        let directive;
        try { directive = JSON.parse(raw); } catch { return alert('Invalid JSON.'); }

        showSpinner('Refining directive… (≈5 s)');
        const refinedResp = await fetch('/api/refine', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ directive })
        });
        const { refined } = await refinedResp.json();

        showSpinner('Executing workflow… (≈10‑15 s)');
        const runResp = await fetch('/run', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(refined)
        });
        const result = await runResp.json();
        hideSpinner();
        outputLog.textContent = JSON.stringify(result, null, 2);
        outputArea.hidden = false;
    });
}

/* ---------- NATURAL-LANGUAGE FLOW ---------- */
const nlInput = document.getElementById('nlInput');
const interpretRunBtn = document.getElementById('interpretRunBtn');

if (interpretRunBtn) {
    interpretRunBtn.addEventListener('click', async () => {
        const instruction = nlInput.value.trim();
        if (!instruction) return alert('Enter a natural-language instruction.');

        showSpinner('Interpreting natural language… (≈5‑8 s)');
        const interpretResp = await fetch('/api/interpret', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ instruction })
        });
        if (!interpretResp.ok) {
            hideSpinner();
            const err = await interpretResp.json();
            return alert('Interpret error: ' + err.error);
        }
        const { directive } = await interpretResp.json();

        showSpinner('Refining directive… (≈5 s)');
        const refinedResp = await fetch('/api/refine', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ directive })
        });
        const { refined } = await refinedResp.json();

        showSpinner('Executing workflow… (≈10‑15 s)');
        const runResp = await fetch('/run', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(refined)
        });
        const result = await runResp.json();
        hideSpinner();
        outputLog.textContent = JSON.stringify(result, null, 2);
        outputArea.hidden = false;
    });
}

/* ---------- TOKEN SETUP (run once on page load) ---------- */
// If no token stored, prompt for one or use the default from .env
if (!localStorage.getItem('handsToken')) {
    // For development, auto-set a token that matches .env
    localStorage.setItem('handsToken', 'super_secret_token_12345');
    console.log('Auto-set handsToken for development.');
}

/* ---------- NATURAL LANGUAGE PLANNING (HARD STOP) ---------- */
const nlPlanInput = document.getElementById('nlPlanInput');
const generatePlanBtn = document.getElementById('generatePlanBtn');
const planReview = document.getElementById('planReview');
const planRiskEl = document.getElementById('planRisk');
const planIdEl = document.getElementById('planId');
const planStepsEl = document.getElementById('planSteps');
const planTemplatesEl = document.getElementById('planTemplates');
const planWarningsEl = document.getElementById('planWarnings');
const confirmPlanBtn = document.getElementById('confirmPlanBtn');
const cancelPlanBtn = document.getElementById('cancelPlanBtn');

let currentPlanData = null;

/* ---------- UNIFIED INPUT HANDLER ---------- */
const unifiedInput = document.getElementById('unifiedInput');
const parseInputBtn = document.getElementById('parseInputBtn');
const detectedFormatBadge = document.getElementById('detectedFormat');
const parsedFormatDisplay = document.getElementById('parsedFormatDisplay');

// Live format detection as user types
if (unifiedInput) {
    unifiedInput.addEventListener('input', () => {
        const text = unifiedInput.value.trim();
        let format = 'Waiting for input...';
        let formatClass = '';

        if (!text) {
            format = 'Waiting for input...';
        } else if (text.startsWith('{') || text.startsWith('[')) {
            format = '📦 JSON Detected';
            formatClass = 'json';
        } else if (text.match(/^(---|[a-zA-Z_]+\s*:)/m) && !text.includes('```')) {
            format = '📄 YAML Detected';
            formatClass = 'yaml';
        } else if (text.includes('```json') || text.includes('### Directive') || text.includes('## Step')) {
            format = '📚 Verbose Markdown Detected';
            formatClass = 'verbose_markdown';
        } else {
            format = '💬 Natural Language';
            formatClass = 'natural_language';
        }

        if (detectedFormatBadge) {
            detectedFormatBadge.textContent = format;
            detectedFormatBadge.className = 'format-badge ' + formatClass;
        }
    });
}

// Parse button click
if (parseInputBtn) {
    parseInputBtn.addEventListener('click', async () => {
        const input = unifiedInput ? unifiedInput.value.trim() : '';
        if (!input) return alert('Paste LLM output first.');

        showSpinner('🔍 Parsing input...');

        try {
            const res = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });

            if (!res.ok) {
                hideSpinner();
                const err = await res.json();
                return alert('Parse error: ' + err.error);
            }

            const plan = await res.json();
            currentPlanData = plan;
            hideSpinner();
            displayPlan(plan);

        } catch (e) {
            hideSpinner();
            alert('Error parsing input: ' + e.message);
        }
    });
}

function displayPlan(plan) {
    // Show the review area
    planReview.classList.remove('hidden');

    // Show detected format
    if (parsedFormatDisplay && plan.detectedFormat) {
        const formatLabels = {
            'json': 'JSON Directive',
            'yaml': 'YAML Directive',
            'verbose_markdown': 'Verbose Markdown',
            'natural_language': 'Natural Language'
        };
        parsedFormatDisplay.textContent = formatLabels[plan.detectedFormat] || plan.detectedFormat;
    }

    // Set plain English summary
    const planSummary = document.getElementById('planSummary');
    if (planSummary) {
        planSummary.textContent = `"${plan.originalCommand}"`;
    }

    // Set risk badge
    planRiskEl.textContent = plan.overallRisk.toUpperCase();
    planRiskEl.className = 'risk-badge ' + plan.overallRisk;

    // Set plan ID
    planIdEl.textContent = plan.planId;

    // Render steps
    planStepsEl.innerHTML = '';
    if (plan.plan.length === 0) {
        planStepsEl.innerHTML = '<p style="color: var(--text-muted);">No actionable steps identified. Try being more specific.</p>';
    } else {
        plan.plan.forEach(step => {
            const stepEl = document.createElement('div');
            stepEl.className = 'plan-step';
            stepEl.innerHTML = `
                <span class="step-num">${step.step}</span>
                <span class="step-action">${step.action}${step.template ? ': <strong>' + step.template + '</strong>' : ''}</span>
                <span class="step-type">${step.type}</span>
            `;
            planStepsEl.appendChild(stepEl);
        });
    }

    // Render templates
    planTemplatesEl.innerHTML = '';
    if (plan.templates.length > 0) {
        planTemplatesEl.innerHTML = '<h4>📦 Templates to Apply:</h4><div class="template-tags"></div>';
        const tagsContainer = planTemplatesEl.querySelector('.template-tags');
        plan.templates.forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'template-tag';
            tag.textContent = t.replace(/_/g, ' ');
            tagsContainer.appendChild(tag);
        });
    }

    // Render warnings
    // Show/hide warnings section
    const warningsSection = document.getElementById('warningsSection');
    if (warningsSection) {
        warningsSection.style.display = plan.warnings.length > 0 ? 'block' : 'none';
    }

    planWarningsEl.innerHTML = '';
    if (plan.warnings.length > 0) {
        plan.warnings.forEach(w => {
            const warningEl = document.createElement('div');
            warningEl.className = 'warning-item';
            warningEl.innerHTML = `⚠️ ${w}`;
            planWarningsEl.appendChild(warningEl);
        });
    }

    // Scroll to plan review
    planReview.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- FIRE TO ANTIGRAVITY ---------- */
const fireToAntigravityBtn = document.getElementById('fireToAntigravityBtn');
const queueStatus = document.getElementById('queueStatus');

if (fireToAntigravityBtn) {
    fireToAntigravityBtn.addEventListener('click', async () => {
        if (!currentPlanData) return alert('No plan to fire.');

        // DOUBLE-CHECK CONFIRMATION
        const stepCount = currentPlanData.plan?.length || 0;
        const templateCount = currentPlanData.templates?.length || 0;
        const risk = currentPlanData.overallRisk?.toUpperCase() || 'UNKNOWN';

        const confirmMsg = `⚠️ CONFIRM EXECUTION ⚠️\n\n` +
            `You are about to fire this directive to Antigravity:\n\n` +
            `"${currentPlanData.originalCommand}"\n\n` +
            `📋 Steps: ${stepCount}\n` +
            `📦 Templates: ${templateCount}\n` +
            `⚠️ Risk Level: ${risk}\n\n` +
            `Are you sure you want to proceed?`;

        if (!confirm(confirmMsg)) {
            return; // User cancelled
        }

        showSpinner('🔥 Firing to Antigravity…');

        try {
            const res = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: currentPlanData.planId,
                    originalCommand: currentPlanData.originalCommand,
                    plan: currentPlanData.plan,
                    templates: currentPlanData.templates,
                    warnings: currentPlanData.warnings,
                    overallRisk: currentPlanData.overallRisk
                })
            });

            const result = await res.json();
            hideSpinner();

            if (result.status === 'queued') {
                // Success! Show queue status
                fireToAntigravityBtn.textContent = '✅ FIRED!';
                fireToAntigravityBtn.style.background = 'hsl(160, 60%, 42%)';
                fireToAntigravityBtn.disabled = true;

                if (queueStatus) {
                    queueStatus.classList.remove('hidden');
                    queueStatus.textContent = '✅ Directive queued! Antigravity will execute shortly...';
                }

                // Display result in output
                outputLog.textContent = JSON.stringify(result, null, 2) + '\n\n' +
                    '─────────────────────────────────────\n' +
                    'ANTIGRAVITY PROMPT (for reference):\n' +
                    '─────────────────────────────────────\n\n' +
                    (result.antigravityPrompt || currentPlanData.originalCommand);
                outputArea.hidden = false;

                // Reset after 3 seconds
                setTimeout(() => {
                    planReview.classList.add('hidden');
                    currentPlanData = null;
                    if (unifiedInput) unifiedInput.value = '';
                    fireToAntigravityBtn.textContent = '🔥 GO MOTHERFUCKER';
                    fireToAntigravityBtn.style.background = '';
                    fireToAntigravityBtn.disabled = false;
                    if (queueStatus) queueStatus.classList.add('hidden');
                }, 3000);

                // Scroll to output
                outputArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert('Queue error: ' + (result.error || 'Unknown error'));
            }

        } catch (e) {
            hideSpinner();
            alert('Fire error: ' + e.message);
        }
    });
}

if (cancelPlanBtn) {
    cancelPlanBtn.addEventListener('click', () => {
        planReview.classList.add('hidden');
        currentPlanData = null;
        if (unifiedInput) unifiedInput.value = '';
        if (detectedFormatBadge) detectedFormatBadge.textContent = 'Waiting for input...';
        if (queueStatus) queueStatus.classList.add('hidden');
    });
}

/* ---------- QUEUE MONITOR ---------- */
const queueList = document.getElementById('queueList');
const queueCount = document.getElementById('queueCount');
const refreshQueueBtn = document.getElementById('refreshQueueBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');

async function loadQueue() {
    try {
        const res = await fetch('/api/queue');
        const queue = await res.json();

        // Update count
        if (queueCount) {
            queueCount.textContent = queue.length;
        }

        // Render queue
        if (queueList) {
            if (queue.length === 0) {
                queueList.innerHTML = '<p class="empty-queue">No pending tasks. Fire a directive above to queue it.</p>';
            } else {
                queueList.innerHTML = queue.map(item => `
                    <div class="queue-item" data-id="${item.id}">
                        <div class="queue-item-header">
                            <span class="queue-item-id">${item.id}</span>
                            <span class="queue-item-status ${item.status}">${item.status}</span>
                        </div>
                        <div class="queue-item-command">"${item.originalCommand}"</div>
                        <div class="queue-item-meta">
                            <span>📦 ${item.templates?.length || 0} templates</span>
                            <span>📋 ${item.plan?.length || 0} steps</span>
                            <span>⏰ ${new Date(item.queuedAt).toLocaleTimeString()}</span>
                        </div>
                        <div class="queue-item-actions">
                            <button class="execute-btn" onclick="executeQueueItem('${item.id}')">▶️ Execute</button>
                            <button class="remove-btn" onclick="removeQueueItem('${item.id}')">🗑️ Remove</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load queue:', e);
    }
}

async function executeQueueItem(planId) {
    // Mark as executing in UI
    const item = document.querySelector(`.queue-item[data-id="${planId}"]`);
    if (item) {
        const statusEl = item.querySelector('.queue-item-status');
        if (statusEl) {
            statusEl.textContent = 'EXECUTING';
            statusEl.className = 'queue-item-status executing';
        }
    }

    // For now, show a message - actual execution goes to Antigravity
    alert(`Task ${planId} marked for execution!\n\nAntigravity will pick this up automatically.\n\n(In a full integration, this would trigger immediate execution.)`);
}

async function removeQueueItem(planId) {
    try {
        const res = await fetch(`/api/queue/${planId}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'removed') {
            loadQueue(); // Refresh the list
        }
    } catch (e) {
        alert('Failed to remove: ' + e.message);
    }
}

async function clearAllQueue() {
    if (!confirm('Clear all pending tasks?')) return;

    try {
        const res = await fetch('/api/queue');
        const queue = await res.json();

        for (const item of queue) {
            await fetch(`/api/queue/${item.id}`, { method: 'DELETE' });
        }

        loadQueue();
    } catch (e) {
        alert('Failed to clear: ' + e.message);
    }
}

// Wire up buttons
if (refreshQueueBtn) {
    refreshQueueBtn.addEventListener('click', loadQueue);
}

if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', clearAllQueue);
}

// Auto-refresh queue every 5 seconds
setInterval(loadQueue, 5000);

// Initial load
loadQueue();

/* ---------- TASK HISTORY ---------- */
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const history = await res.json();

        // Update count
        if (historyCount) {
            historyCount.textContent = history.length;
        }

        // Render history
        if (historyList) {
            if (history.length === 0) {
                historyList.innerHTML = '<p class="empty-history">No completed tasks yet.</p>';
            } else {
                historyList.innerHTML = history.map(item => `
                    <div class="history-item ${item.status === 'failed' ? 'failed' : ''}">
                        <div class="history-item-header">
                            <span class="history-item-id">${item.id}</span>
                            <span class="history-item-status ${item.status}">${item.status}</span>
                        </div>
                        <div class="history-item-command">"${item.originalCommand}"</div>
                        <div class="history-item-meta">
                            <span>📦 ${item.templates?.length || 0} templates</span>
                            <span>📋 ${item.plan?.length || 0} steps</span>
                            <span>⏰ Queued: ${item.queuedAt ? new Date(item.queuedAt).toLocaleTimeString() : 'N/A'}</span>
                            <span>✅ Done: ${new Date(item.completedAt).toLocaleTimeString()}</span>
                        </div>
                        ${item.result ? `<div class="history-item-result">${typeof item.result === 'string' ? item.result : JSON.stringify(item.result, null, 2)}</div>` : ''}
                        ${item.error ? `<div class="history-item-result error">❌ ${item.error}</div>` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}

async function clearHistory() {
    if (!confirm('Clear all task history?')) return;

    try {
        await fetch('/api/history', { method: 'DELETE' });
        loadHistory();
    } catch (e) {
        alert('Failed to clear: ' + e.message);
    }
}

// Wire up history buttons
if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', loadHistory);
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Auto-refresh history every 10 seconds
setInterval(loadHistory, 10000);

// Initial load
loadHistory();

/* ---------- END OF FILE ---------- */
