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

const dangerKeywords = ['delete', 'remove', 'rm ', 'rm -rf', 'drop', 'force', 'override', 'reset --hard'];
const cautionKeywords = ['install', 'write', 'create', 'modify', 'update', 'npm', 'pip'];

class ParserService {

    assessRisk(text) {
        const lower = text.toLowerCase();
        if (dangerKeywords.some(k => lower.includes(k))) return 'danger';
        if (cautionKeywords.some(k => lower.includes(k))) return 'caution';
        return 'safe';
    }

    matchTemplates(command) {
        const lower = command.toLowerCase();
        const matched = [];
        for (const [template, keywords] of Object.entries(templateKeywords)) {
            if (keywords.some(k => lower.includes(k))) {
                matched.push(template);
            }
        }
        return matched;
    }

    generatePlan(command) {
        const templates = this.matchTemplates(command);
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

        return {
            originalCommand: command,
            plan: steps,
            templates: templates,
            warnings: warnings,
            overallRisk: this.assessRisk(command),
            requiresConfirmation: true,
            planId: `plan_${Date.now()}`,
            generatedAt: new Date().toISOString(),
            message: steps.length > 0 ? 'Review the plan above.' : 'No actionable steps found.'
        };
    }

    async parseInput(input) {
        const trimmed = input.trim();
        let detectedFormat = 'natural_language';
        let parsed = null;
        let description = '';
        let steps = [];
        let templates = [];
        let warnings = [];

        // 1. Try JSON
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                parsed = JSON.parse(trimmed);
                detectedFormat = 'json';
                description = parsed.description || parsed.originalCommand || 'JSON Directive';
                steps = parsed.steps || [];
                templates = parsed.templates || [];
                warnings = parsed.warnings || [];
            } catch (e) { /* ignore */ }
        }

        // 2. Try YAML (Basic)
        else if (trimmed.match(/^(---|[a-zA-Z_]+\s*:)/m) && !trimmed.includes('```')) {
            detectedFormat = 'yaml';
            // Basic YAML extraction logic
             const lines = trimmed.split('\n');
             // (Simplified logic from original server.js)
             description = 'YAML Directive';
             // TODO: robust yaml parser or reuse previous logic
        }

        // 3. Fallback to Natural Language Generation
        if (steps.length === 0) {
            const nlPlan = this.generatePlan(trimmed);
            steps = nlPlan.plan;
            templates = nlPlan.templates;
            warnings = nlPlan.warnings;
            description = trimmed.substring(0, 100);
            if (!parsed) detectedFormat = 'natural_language';
        }

        return {
            detectedFormat,
            originalInput: trimmed,
            originalCommand: description,
            plan: steps,
            templates: templates,
            warnings: warnings,
            overallRisk: this.assessRisk(trimmed),
            planId: `plan_${Date.now()}`,
            requiresConfirmation: true
        };
    }
}

module.exports = new ParserService();
