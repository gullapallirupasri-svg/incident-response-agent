# SignalOps Incident Response

A local Incident Response console with a product landing page, interactive incident workspace, evidence-led analysis, response recommendations, and an incident-aware chatbot. Incident data is saved in the browser's local storage.

**Safety boundary:** the assistant has no production tool access and cannot execute commands. The human approval control records that an operator reviewed a response-plan step; it does not run a production action.

## Windows Quick Start

Install Node.js LTS and Python 3.10 or newer. Double-click `start.bat` in the project root. On first run it installs missing dependencies, starts FastAPI and Vite in separate windows, waits for both services, then opens Microsoft Edge at <http://localhost:5173/>. Keep the backend and frontend terminal windows open while using the app.

To start it from PowerShell instead, run `.\start.bat` from the project root.

## Open Directly in Edge

For a no-command preview, open `frontend-static\index.html` in File Explorer and double-click it. It needs no VS Code, Node.js, npm, or Vite server; it loads JavaScript and CSS from the sibling `frontend` folder using relative paths, so keep both folders in the project. `frontend\index.html` is also file-compatible. Windows opens `.html` files with its default browser; set Microsoft Edge as the default app for `.html` files if needed. Under `file://`, incidents use local analysis and the app displays a backend notice because browser file pages cannot use the API connection. Use `start.bat` when you need backend-backed AI analysis.

## Frontend

For backend-enabled development, serve `frontend/index.html` with Vite. Open two terminals. In the first, run `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000` from the project root. In the second, run `npm.cmd run dev` from `frontend`, then open <http://localhost:5173/> in Edge. Vite proxies `/api` requests to FastAPI. Select **Launch Dashboard** to open the sample workspace.

## Optional Backend

The FastAPI backend remains available for API-based workflows. Backend setup requires Python 3.10 or newer. To install its dependencies from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

When the frontend is served from `localhost` or `127.0.0.1`, incident submissions try the optional backend analyzer. If the API is unavailable, analysis falls back to local signal rules. To enable LLM analysis in the backend, copy `.env.example` to `.env` and set `LLM_API_KEY`. `LLM_BASE_URL` and `LLM_MODEL` default to OpenAI's chat completions API and `gpt-4o-mini`. Keep `.env` private.

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The backend API docs are at <http://localhost:8000/docs>. SQLite is created at `backend/incidents.db` and seeded on first startup. The frontend's optional browser-to-backend integration is enabled on the default local development origins.

## Included workflows

- Dashboard totals, analytics, service health, and an AI incident brief across active and resolved incidents.
- Incident creation with title, description, affected service, severity, status, responder/team, impact, and supporting signals.
- Incident detail with possible causes, evidence, impact, confidence, recommended next steps, assignments, and a timestamped activity timeline.
- Incident history search and dynamic filters for status, severity, service, and date.
- Ask SignalOps workspace chat and an incident-aware copilot grounded in saved incident data.
- AI-recommended response options with simulation-only controls; no command execution or production changes.
- Unread notifications for critical incidents, service degradation, completed analysis, and resolution.
- Reports workspace to browse reports for all incidents, with impact, timeline, actions, resolution, and recommendations; copy or print/save as PDF.
- Guided demo mode that simulates detection, investigation, analysis, assignment, recommendation, and resolution.
- On-call roster, response policies, and editable hindsight reviews.

## REST endpoints

- `GET /api/health`, `GET /api/dashboard`
- `POST /api/analyze` to classify an incident and return recommended response steps without saving it
- `GET /api/incidents?search=&status=&severity=&type=`
- `POST /api/incidents`, `GET /api/incidents/{id}`
- `PATCH /api/incidents/{id}/status`
- `POST /api/incidents/{id}/approve`
- `POST /api/incidents/{id}/chat`

CORS allows the default Vite origins at `localhost:5173` and `127.0.0.1:5173`.