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
    logActivity(`⏳ ${message || 'Processing...'}`);
}
function hideSpinner() {
    const overlay = document.getElementById('spinnerOverlay');
    if (overlay) overlay.classList.add('hidden');
}

/* ---------- LIVE ACTIVITY FEED ---------- */
const activityFeed = document.getElementById('activityFeed');
const connectionStatus = document.getElementById('connectionStatus');
const MAX_ACTIVITY_ITEMS = 10;

function logActivity(message, isActive = false) {
    if (!activityFeed) return;

    const timestamp = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = 'activity-item' + (isActive ? ' active' : '');
    item.textContent = `[${timestamp}] ${message}`;

    activityFeed.insertBefore(item, activityFeed.firstChild);

    while (activityFeed.children.length > MAX_ACTIVITY_ITEMS) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
}

function updateConnectionStatus(connected) {
    if (!connectionStatus) return;
    connectionStatus.textContent = connected ? '● Connected' : '● Disconnected';
    connectionStatus.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
}

async function checkConnection() {
    try {
        // Ping history endpoint as a health check
        const res = await fetch('/api/history');
        updateConnectionStatus(res.ok);
    } catch (e) {
        updateConnectionStatus(false);
    }
}
setInterval(checkConnection, 10000);
checkConnection();


/* ---------- LLM PRIMER COPY ---------- */
const copyPrimerBtn = document.getElementById('copyPrimerBtn');
const copyStatus = document.getElementById('copyStatus');

if (copyPrimerBtn) {
    copyPrimerBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/template/hands_llm_primer');
            if (!res.ok) {
                alert('Could not load LLM primer template.');
                return;
            }
            let content = await res.text();
            const marker = '---\n\n## 🤖 SYSTEM CONTEXT';
            const startIndex = content.indexOf(marker);
            if (startIndex !== -1) {
                content = content.substring(startIndex + 4);
            }
            await navigator.clipboard.writeText(content.trim());
            copyPrimerBtn.textContent = '✅ Copied!';
            copyPrimerBtn.style.background = 'hsl(160, 60%, 42%)';
            copyStatus.classList.remove('hidden');
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
        const res = await fetch('/api/templateList'); // No auth for list
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
        const res = await fetch(`/api/template/${name}`);
        const md = await res.text();
        preview.value = md;
        preview.readOnly = true;
        if (saveBtn) saveBtn.hidden = true;
        currentTemplate = name;
    });
}

/* ---------- MODE SWITCH ---------- */
// (Retaining mode switch logic if elements exist, though unified input is primary now)
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

/* ---------- TOKEN SETUP ---------- */
if (!localStorage.getItem('handsToken')) {
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
    planReview.classList.remove('hidden');

    if (parsedFormatDisplay && plan.detectedFormat) {
        const formatLabels = {
            'json': 'JSON Directive',
            'yaml': 'YAML Directive',
            'verbose_markdown': 'Verbose Markdown',
            'natural_language': 'Natural Language'
        };
        parsedFormatDisplay.textContent = formatLabels[plan.detectedFormat] || plan.detectedFormat;
    }

    const planSummary = document.getElementById('planSummary');
    if (planSummary) {
        planSummary.textContent = `"${plan.originalCommand}"`;
    }

    planRiskEl.textContent = plan.overallRisk.toUpperCase();
    planRiskEl.className = 'risk-badge ' + plan.overallRisk;

    planIdEl.textContent = plan.planId;

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

    const warningsSection = document.getElementById('warningsSection');
    if (warningsSection) {
        warningsSection.style.display = plan.warnings.length > 0 ? 'block' : 'none';
        if (plan.workingDirectory === "BLOCKED_ROOT_PROTECTION") {
            warningsSection.style.border = "2px solid #ff4444";
            warningsSection.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            if (fireToAntigravityBtn) {
                fireToAntigravityBtn.disabled = true;
                fireToAntigravityBtn.textContent = "🛑 BLOCKED: UNSAFE TARGET";
                fireToAntigravityBtn.style.background = "#ff4444";
                fireToAntigravityBtn.style.cursor = "not-allowed";
            }
        } else {
            warningsSection.style.border = "";
            warningsSection.style.backgroundColor = "";
            if (fireToAntigravityBtn) {
                 fireToAntigravityBtn.disabled = false;
                 fireToAntigravityBtn.textContent = "🔥 EXECUTE PLAN";
                 fireToAntigravityBtn.style.background = "";
                 fireToAntigravityBtn.style.cursor = "pointer";
            }
        }
    }

    planWarningsEl.innerHTML = '';
    if (plan.warnings.length > 0) {
        plan.warnings.forEach(w => {
            const warningEl = document.createElement('div');
            warningEl.className = 'warning-item';
            if (w.includes("CRITICAL")) {
                warningEl.classList.add('critical-warning');
                warningEl.style.fontWeight = 'bold';
                warningEl.style.color = '#ff4444';
            }
            warningEl.innerHTML = `⚠️ ${w}`;
            planWarningsEl.appendChild(warningEl);
        });
    }

    planReview.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- FIRE TO EXECUTION ---------- */
const fireToAntigravityBtn = document.getElementById('fireToAntigravityBtn');
const queueStatus = document.getElementById('queueStatus');

if (fireToAntigravityBtn) {
    fireToAntigravityBtn.addEventListener('click', async () => {
        if (!currentPlanData) return alert('No plan to fire.');

        const stepCount = currentPlanData.plan?.length || 0;
        const confirmMsg = `⚠️ CONFIRM EXECUTION ⚠️\n\n` +
            `You are about to EXECUTE this plan directly:\n\n` +
            `"${currentPlanData.originalCommand}"\n\n` +
            `📋 Steps: ${stepCount}\n` +
            `Are you sure?`;

        if (!confirm(confirmMsg)) return;

        showSpinner('🔥 Firing Execution Engine…');

        try {
            const res = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPlanData)
            });

            const result = await res.json();
            hideSpinner();

            if (result.status === 'queued') {
                fireToAntigravityBtn.textContent = '✅ EXECUTING...';
                fireToAntigravityBtn.style.background = 'hsl(160, 60%, 42%)';
                fireToAntigravityBtn.disabled = true;

                if (queueStatus) {
                    queueStatus.classList.remove('hidden');
                    queueStatus.textContent = '✅ Plan queued for execution. Watch activity feed below.';
                }

                setTimeout(() => {
                    planReview.classList.add('hidden');
                    currentPlanData = null;
                    if (unifiedInput) unifiedInput.value = '';
                    fireToAntigravityBtn.textContent = '🔥 EXECUTE PLAN';
                    fireToAntigravityBtn.style.background = '';
                    fireToAntigravityBtn.disabled = false;
                    if (queueStatus) queueStatus.classList.add('hidden');
                }, 3000);
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
        if (queueCount) queueCount.textContent = queue.length;

        if (queueList) {
            if (queue.length === 0) {
                queueList.innerHTML = '<p class="empty-queue">No pending tasks.</p>';
            } else {
                queueList.innerHTML = queue.map(item => `
                    <div class="queue-item" data-id="${item.id}">
                        <div class="queue-item-header">
                            <span class="queue-item-id">${item.id}</span>
                            <span class="queue-item-status ${item.status}">${item.status}</span>
                        </div>
                        <div class="queue-item-command">"${item.originalCommand}"</div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load queue:', e);
    }
}
async function clearAllQueue() {
    if (!confirm('Clear all pending tasks?')) return;
    try {
        await fetch('/api/queue', { method: 'DELETE' });
        loadQueue();
    } catch (e) {
        alert('Failed to clear: ' + e.message);
    }
}
if (refreshQueueBtn) refreshQueueBtn.addEventListener('click', loadQueue);
if (clearQueueBtn) clearQueueBtn.addEventListener('click', clearAllQueue);

setInterval(loadQueue, 5000);
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
        if (historyCount) historyCount.textContent = history.length;

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
                         ${item.result ? `<div class="history-item-result">${formatHistoryResult(item.result)}</div>` : ''}
                        ${item.error ? `<div class="history-item-result error">❌ ${item.error}</div>` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}
function formatHistoryResult(result) {
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) {
        return result.map(s => `Step ${s.step}: ${s.status} ${s.error ? '('+s.error+')' : ''}`).join('<br>');
    }
    return JSON.stringify(result);
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
if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', loadHistory);
if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
setInterval(loadHistory, 10000);
loadHistory();

/* ---------- END OF FILE ---------- */
