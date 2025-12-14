---
description: Catalog of Antigravity Modular Workflows
---
# Antigravity Workflow Catalog

This file lives in **`.agent/workflows/`** and serves as a **living index** of all reusable, extractable templates you can paste into Antigravity’s Manager View.

## How to Use the Catalog
1. **Open the catalog** (this file) in your editor.
2. **Pick a workflow** you need – each entry links to a dedicated markdown file containing the full template.
3. **Copy‑paste** the entire markdown of the chosen workflow into Antigravity’s Manager View.
4. **Replace the `{{PLACEHOLDER}}` tokens** with your project‑specific values.
5. **Run** – the agent will execute the steps, respecting the safety guardrails you defined earlier.

## Extending / Building New Processes
- **Copy an existing template** (or the generic skeleton below) into a new file under `.agent/workflows/`.
- **Add or remove steps** – keep the `# Mission`, `## Required Outcomes`, `## Constraints`, `## Checkpoints`, and numbered step list.  The agent will honor any `// turbo` or `// turbo‑all` annotations you add.
- **Version‑control** – each workflow is a regular markdown file, so you can `git add/commit` it like any source file.
- **Automation tip** – use the helper script `generate_workflow.sh` (see below) to scaffold a new workflow from a JSON config.

---
## Available Templates
| Template File | Description |
|---|---|
| [google_cloud_setup.md](google_cloud_setup.md) | Full GCP project creation, API enablement, service‑account key extraction, `.env` generation. |
| [firebase_setup.md](firebase_setup.md) | Spin up a Firebase project, enable Auth/Firestore/Hosting, download service‑account JSON, create `.env`. |
| [stripe_integration.md](stripe_integration.md) | Create a Stripe account, generate API keys, store them in `.env`, and scaffold a Node.js payment module. |
| [aws_s3_bucket.md](aws_s3_bucket.md) | Provision an S3 bucket via AWS Console, configure IAM policy, download credentials, write `.env`. |
| [github_actions_ci.md](github_actions_ci.md) | Scaffold a GitHub Actions CI workflow for Node.js projects, with lint, test, and build steps. |

---
## Generic Skeleton (Copy & Rename to Create a New Template)
```markdown
---
description: {{SHORT_TITLE}}
---
# Mission
{{HIGH_LEVEL_GOAL}}

## Required Outcomes
1. …
2. …

## Constraints
- Use only `/workspace` paths.
- Block any destructive commands.
- Pause before any billing‑related step.

## Checkpoints (Agent‑Decides)
- **Checkpoint 1 – …**: description.

## Steps (Copy‑Paste into Antigravity Manager View)
1. **Browser Agent** – …
2. **Terminal Agent** – …
```

---
## Helper Script – `generate_workflow.sh`
Create new workflows quickly from a JSON description.
```bash
#!/usr/bin/env bash
# Usage: ./generate_workflow.sh my_new_workflow.json
set -e
JSON_FILE=$1
WORKFLOW_NAME=$(jq -r .name "$JSON_FILE")
TARGET="c:/Y-OS/Y-IT_ENGINES/HANDS/.agent/workflows/${WORKFLOW_NAME}.md"
cat <<EOF > "$TARGET"
---
description: $(jq -r .description "$JSON_FILE")
---
# Mission
$(jq -r .mission "$JSON_FILE")

## Required Outcomes
$(jq -r .outcomes "$JSON_FILE")

## Constraints
$(jq -r .constraints "$JSON_FILE")

## Checkpoints (Agent-Decides)
$(jq -r .checkpoints "$JSON_FILE")

## Steps (Copy-Paste into Antigravity Manager View)
$(jq -r .steps "$JSON_FILE")
EOF
echo "Workflow created at $TARGET"
```

Save the script as `c:/Y-OS/Y-IT_ENGINES/HANDS/.agent/workflows/generate_workflow.sh` and make it executable (`chmod +x`).

---
**Next steps**: Open any of the linked template files, replace the placeholders, and paste the content into Antigravity. Feel free to add more entries to this catalog as you create new workflows.
