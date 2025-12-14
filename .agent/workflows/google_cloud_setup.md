---
description: Google Cloud Project Full Setup (Modular Template)
---
# Mission
Create a new Google Cloud project named **{{PROJECT_NAME}}**, enable the APIs listed below, generate a service‑account JSON key with the roles specified, and store all credentials in a `.env` file inside the workspace.

## Required Outcomes
1. Google Cloud project created.
2. APIs enabled: `{{API_LIST}}` (comma‑separated).
3. Service account `{{SERVICE_ACCOUNT_NAME}}` created with roles `{{ROLE_LIST}}`.
4. Service‑account JSON downloaded to `/workspace/{{SERVICE_ACCOUNT_NAME}}.json`.
5. `.env` file generated with `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY` (escaped).
6. Screenshot artifacts for each major console page saved to `/workspace/artifacts/`.

## Constraints
- Use the currently logged‑in Google account in Antigravity’s browser.
- Do **not** modify any files outside `/workspace`.
- Block any destructive commands (e.g., `rm -rf /`).
- Pause before any billing‑related step; require manual approval.

## Checkpoints (Agent‑Decides)
- **Checkpoint 1 – Project Creation**: After the project appears in the console, capture a screenshot and continue.
- **Checkpoint 2 – API Enablement**: Verify each API is enabled; screenshot the confirmation page.
- **Checkpoint 3 – Service‑Account Creation**: Capture the JSON download dialog.
- **Checkpoint 4 – .env Generation**: Show the generated file content for review.

## Steps (Copy‑Paste into Antigravity Manager View)
1. **Browser Agent** – Navigate to `https://console.cloud.google.com/projectcreate` and create the project `{{PROJECT_NAME}}`.
2. **Browser Agent** – For each API in `{{API_LIST}}`, go to the API library, search the API, and click *Enable*.
3. **Browser Agent** – Open *IAM & Admin → Service Accounts*, click *Create Service Account* with name `{{SERVICE_ACCOUNT_NAME}}` and assign roles `{{ROLE_LIST}}`.
4. **Browser Agent** – Click *Create Key* → JSON, download the file, and save it to `/workspace/{{SERVICE_ACCOUNT_NAME}}.json`.
5. **Terminal Agent** – Run a small script to extract needed fields and write `.env`:
   ```bash
   cat <<EOF > .env
   GOOGLE_PROJECT_ID={{PROJECT_ID}}
   GOOGLE_CLIENT_EMAIL=$(jq -r .client_email {{SERVICE_ACCOUNT_NAME}}.json)
   GOOGLE_PRIVATE_KEY=$(jq -r .private_key {{SERVICE_ACCOUNT_NAME}}.json | sed 's/\n/\\n/g')
   EOF
   ```
6. **Terminal Agent** – `git add .env && git commit -m "Add Google Cloud credentials (masked)"`.
7. **Browser Agent** – Capture final screenshot of the *Credentials* page and store in `/workspace/artifacts/credentials.png`.

## Modular Usage Tips
- Replace all `{{PLACEHOLDER}}` values before pasting.
- You can split the workflow into separate files (e.g., `google_cloud_api_enable.md`, `google_cloud_service_account.md`) and run them sequentially.
- For repeated use, copy the file into your project’s `/workflows/` folder and reference it with `!include google_cloud_setup.md` in future prompts.
- After execution, review the generated artifacts folder for verification before merging any changes.
