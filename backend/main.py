import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")
DB_PATH = Path(os.getenv("DATABASE_PATH") or ROOT / "incidents.db")
app = FastAPI(title="SignalOps Incident Response API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def detect_incident_type(incident: dict[str, Any]) -> str:
    text = " ".join(str(incident.get(key, "")) for key in ("title", "description", "logs", "error_messages")).lower()
    rules = [
        ("Security", ("security", "unauthorized", "permission denied", "credential", "breach", "suspicious login")),
        ("Data integrity", ("data loss", "corrupt", "incorrect data", "integrity", "sync", "replication")),
        ("Availability", ("unavailable", "outage", "502", "503", "504", "connection refused", "failed requests")),
        ("Performance", ("slow", "latency", "timeout", "lag", "overloaded", "high cpu", "high memory")),
        ("Deployment", ("deploy", "deployment", "release", "rollback", "version")),
    ]
    for incident_type, keywords in rules:
        if any(keyword in text for keyword in keywords):
            return incident_type

    supplied_type = str(incident.get("type", "")).strip()
    allowed_types = {"Availability", "Performance", "Security", "Data integrity", "Deployment", "Other"}
    return supplied_type if supplied_type in allowed_types else "Other"


def classify_severity(incident: dict[str, Any]) -> str:
    supplied_severity = incident.get("severity")
    if supplied_severity in {"Low", "Medium", "High", "Critical"}:
        return supplied_severity

    text = " ".join(str(incident.get(key, "")) for key in ("title", "description", "logs", "error_messages")).lower()
    if any(term in text for term in ("complete outage", "all users", "data loss", "security breach", "widespread outage")):
        return "Critical"
    if any(term in text for term in ("major impact", "many users", "elevated error", "high latency", "service unavailable")):
        return "High"
    if any(term in text for term in ("minor", "isolated", "no customer impact")):
        return "Low"

    return "Medium"


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def fallback_analysis(incident: dict[str, Any]) -> dict[str, Any]:
    text = " ".join(str(incident.get(key, "")) for key in ("title", "description", "logs", "error_messages")).lower()
    incident_type = detect_incident_type(incident)
    category = {
        "Security": "Security / access",
        "Data integrity": "Data integrity",
        "Availability": "Service availability",
        "Performance": "Performance degradation",
        "Deployment": "Deployment change",
        "Other": "Uncategorized signal",
    }[incident_type]
    causes = []
    if "deploy" in text or "release" in text:
        causes.append("A recent release may have changed request handling or dependency behavior.")
    if any(term in text for term in ("timeout", "latency", "lag")):
        causes.append("A saturated downstream dependency or resource pool may be increasing latency.")
    if any(term in text for term in ("502", "504")):
        causes.append("Transient upstream instability or connection resets may be surfacing at the gateway.")
    if any(term in text for term in ("unauthorized", "permission denied", "credential", "breach", "suspicious login")):
        causes.append("An authentication or access-policy change may be rejecting requests; verify audit events and expected permissions.")
    if any(term in text for term in ("data loss", "corrupt", "integrity", "sync", "replication")):
        causes.append("A synchronization or replication issue may be affecting data consistency; compare source and destination records.")
    if any(term in text for term in ("429", "rate limit", "throttl")):
        causes.append("Rate limiting or quota exhaustion may be rejecting traffic; compare request volume with service limits.")
    if not causes:
        causes.append("The supplied signals are limited; inspect service metrics and recent changes to narrow the cause.")
    service = str(incident.get("service") or "Unknown service")
    environment = str(incident.get("environment") or "unspecified environment")
    description = str(incident.get("description") or incident.get("title") or "Incident reported.").strip()
    evidence = []
    if str(incident.get("logs", "")).strip():
        evidence.append(f"Logs: {incident['logs'].strip()}")
    if str(incident.get("error_messages", "")).strip():
        evidence.append(f"Errors: {incident['error_messages'].strip()}")
    signal_count = len(evidence)
    matched_signal_count = sum(term in text for term in ("timeout", "latency", "lag", "502", "503", "504", "429", "unauthorized", "permission denied", "corrupt", "sync", "deploy", "release"))
    return {
        "type": incident_type,
        "category": category,
        "severity": classify_severity(incident),
        "summary": f"{service} - {environment}: {' '.join(description.split())}",
        "evidence": "\n".join(evidence) or "No logs or error messages supplied. Treat causes as low-confidence hypotheses and gather service telemetry.",
        "confidence": "High - multiple matching signals" if signal_count > 1 and matched_signal_count > 1 else "Moderate - one matching signal" if matched_signal_count else "Low - limited corroborating evidence",
        "severity_basis": "Operator supplied" if incident.get("severity") in {"Low", "Medium", "High", "Critical"} else "Estimated from reported impact language",
        "root_causes": causes[:3],
        "response_plan": [
            {"step": 1, "title": "Confirm impact", "detail": "Check service-level indicators, affected regions, and customer impact."},
            {"step": 2, "title": "Correlate signals", "detail": "Compare error and latency changes with recent deploys, dependencies, and infrastructure events."},
            {"step": 3, "title": "Choose a mitigation", "detail": "Review the safest reversible mitigation with the service owner; obtain human approval before any production change."},
            {"step": 4, "title": "Verify recovery", "detail": "Watch error rate, latency, and backlog return to baseline, then record the outcome."},
        ],
    }


def llm_json(system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
    api_key = os.getenv("LLM_API_KEY", "").strip()
    if not api_key:
        return None
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    payload = json.dumps({
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }).encode("utf-8")
    request = Request(
        f"{base_url}/chat/completions", data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST",
    )
    try:
        with urlopen(request, timeout=35) as response:
            body = json.loads(response.read().decode("utf-8"))
        parsed = json.loads(body["choices"][0]["message"]["content"])
        return parsed if isinstance(parsed, dict) else None
    except (URLError, TimeoutError, KeyError, IndexError, ValueError, json.JSONDecodeError):
        return None


def analyze(incident: dict[str, Any]) -> dict[str, Any]:
    fallback = fallback_analysis(incident)
    result = llm_json(
        "You are an incident response analyst. Return JSON only with summary, type (Availability/Performance/Security/Data integrity/Deployment/Other), category, severity (Low/Medium/High/Critical), root_causes (array of hypotheses grounded in supplied evidence), and response_plan (array of objects with step, title, detail). Distinguish reported facts from hypotheses; do not claim a root cause is confirmed. Never provide executable commands. Any production change must explicitly require human approval.",
        json.dumps(incident),
    )
    if not result:
        return {**fallback, "ai_source": "local-rules"}
    allowed_types = {"Availability", "Performance", "Security", "Data integrity", "Deployment", "Other"}
    if result.get("type") not in allowed_types:
        result["type"] = fallback["type"]
    result["category"] = str(result.get("category") or fallback["category"])
    if incident.get("severity") in {"Critical", "High", "Medium", "Low"}:
        result["severity"] = incident["severity"]
    elif result.get("severity") not in {"Critical", "High", "Medium", "Low"}:
        result["severity"] = fallback["severity"]
    result["summary"] = str(result.get("summary") or fallback["summary"])[:1000]
    result["evidence"] = fallback["evidence"]
    result["confidence"] = fallback["confidence"]
    result["severity_basis"] = fallback["severity_basis"]
    causes = result.get("root_causes")
    result["root_causes"] = [str(item) for item in causes if item][:4] if isinstance(causes, list) else fallback["root_causes"]
    result["root_causes"] = result["root_causes"] or fallback["root_causes"]
    plan = result.get("response_plan")
    if not isinstance(plan, list) or not plan:
        result["response_plan"] = fallback["response_plan"]
    else:
        result["response_plan"] = [
            {"step": index + 1, "title": str(item.get("title", "Review next step")),
             "detail": str(item.get("detail", "Review with the incident owner.")),
             "requires_approval": index >= 2}
            for index, item in enumerate(plan[:6]) if isinstance(item, dict)
        ] or fallback["response_plan"]
    result["ai_source"] = "llm"
    return result


def initialize_database() -> None:
    with connect() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
                type TEXT NOT NULL, severity TEXT NOT NULL, service TEXT NOT NULL, logs TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL, updated_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Investigating',
                category TEXT NOT NULL DEFAULT 'Service disruption', root_causes TEXT NOT NULL DEFAULT '[]',
                response_plan TEXT NOT NULL DEFAULT '[]', timeline TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT, incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS messages_incident_idx ON messages(incident_id, id);
        """)
        if connection.execute("SELECT COUNT(*) FROM incidents").fetchone()[0] == 0:
            seed_incidents(connection)


def seed_incidents(connection: sqlite3.Connection) -> None:
    samples = [
        {"title": "Elevated checkout failures in US-East", "description": "Payment authorization requests are timing out for a growing share of checkout sessions. The issue began shortly after the 14:20 deploy.", "type": "Availability", "severity": "Critical", "service": "checkout-api", "logs": "upstream request timeout after 3000ms\nPOST /v2/authorize status=504 region=us-east-1", "created_at": "2026-09-28T14:32:00+00:00", "status": "Investigating"},
        {"title": "Queue lag above target on event workers", "description": "The consumer group is falling behind on order.updated events. Processing continues, but downstream notifications are delayed.", "type": "Performance", "severity": "High", "service": "event-worker", "logs": "consumer_lag=18420 partition=orders-07\nhandler_duration_p95=8.7s", "created_at": "2026-09-28T13:48:00+00:00", "status": "Monitoring"},
        {"title": "Intermittent 502 responses from catalog", "description": "A small percentage of product-detail requests return a gateway error. Health checks remain green and the error rate is trending down.", "type": "Availability", "severity": "Medium", "service": "catalog-service", "logs": "GET /products/sku-9182 status=502\nupstream_reset_before_response_started", "created_at": "2026-09-28T12:16:00+00:00", "status": "Monitoring"},
        {"title": "Resolved: delayed warehouse sync", "description": "Inventory updates were delayed while a scheduled warehouse export retried. The backlog has drained and freshness is back within target.", "type": "Data integrity", "severity": "Low", "service": "inventory-sync", "logs": "sync_duration=41m retry_count=3 backlog=0", "created_at": "2026-09-27T17:05:00+00:00", "status": "Resolved"},
    ]
    for sample in samples:
        result = fallback_analysis(sample)
        event = {"time": sample["created_at"], "label": "Incident reported", "detail": sample["description"]}
        connection.execute(
            """INSERT INTO incidents
            (title, description, type, severity, service, logs, created_at, updated_at, status, category, root_causes, response_plan, timeline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (sample["title"], sample["description"], sample["type"], sample["severity"], sample["service"],
             sample["logs"], sample["created_at"], sample["created_at"], sample["status"], result["category"],
             json.dumps(result["root_causes"]), json.dumps(result["response_plan"]), json.dumps([event])),
        )


def incident_dict(row: sqlite3.Row) -> dict[str, Any]:
    result = dict(row)
    for field in ("root_causes", "response_plan", "timeline"):
        result[field] = json.loads(result[field])
    return result


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=5, max_length=6000)
    type: str = Field(min_length=2, max_length=80)
    severity: str = Field(pattern="^(Critical|High|Medium|Low)$")
    service: str = Field(min_length=2, max_length=120)
    logs: str = Field(default="", max_length=12000)
    timestamp: str | None = None


class IncidentAnalysis(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=5, max_length=6000)
    service: str = Field(default="unknown-service", max_length=120)
    logs: str = Field(default="", max_length=12000)
    error_messages: str = Field(default="", max_length=6000)
    environment: str = Field(default="unspecified", max_length=80)
    type: str | None = None
    severity: str | None = Field(default=None, pattern="^(Low|Medium|High|Critical)$")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(Investigating|Monitoring|Resolved)$")


class ApprovalRequest(BaseModel):
    step: int = Field(ge=1, le=10)
    note: str = Field(default="", max_length=1000)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "ai": "configured" if os.getenv("LLM_API_KEY") else "fallback"}


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    with connect() as connection:
        rows = connection.execute("SELECT severity, status FROM incidents").fetchall()
        recent = connection.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT 5").fetchall()
    return {"total": len(rows), "active": sum(row["status"] != "Resolved" for row in rows),
            "critical": sum(row["severity"] == "Critical" and row["status"] != "Resolved" for row in rows),
            "resolved": sum(row["status"] == "Resolved" for row in rows), "recent": [incident_dict(row) for row in recent]}


@app.post("/api/analyze")
def analyze_incident(payload: IncidentAnalysis) -> dict[str, Any]:
    """Classify an incident and suggest safe, human-reviewed response steps."""
    analysis = analyze(payload.model_dump())
    return {"analysis": analysis, "ai_source": analysis["ai_source"]}


@app.get("/api/incidents")
def list_incidents(search: str = Query(default="", max_length=200), status: str = Query(default="All"),
                   severity: str = Query(default="All"), type: str = Query(default="All")) -> list[dict[str, Any]]:
    clauses: list[str] = []
    values: list[str] = []
    if search.strip():
        clauses.append("(title LIKE ? OR description LIKE ? OR service LIKE ?)")
        wildcard = f"%{search.strip()}%"
        values.extend([wildcard, wildcard, wildcard])
    for column, value in (("status", status), ("severity", severity), ("type", type)):
        if value != "All":
            clauses.append(f"{column} = ?")
            values.append(value)
    query = "SELECT * FROM incidents" + (" WHERE " + " AND ".join(clauses) if clauses else "")
    query += " ORDER BY CASE severity WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, created_at DESC"
    with connect() as connection:
        rows = connection.execute(query, values).fetchall()
    return [incident_dict(row) for row in rows]


@app.post("/api/incidents", status_code=201)
def create_incident(payload: IncidentCreate) -> dict[str, Any]:
    incident = payload.model_dump()
    created_at = incident.pop("timestamp") or now_iso()
    try:
        datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Timestamp must be ISO 8601.") from error
    result = analyze(incident)
    timeline = [{"time": created_at, "label": "Incident reported", "detail": incident["description"]}]
    with connect() as connection:
        cursor = connection.execute(
            """INSERT INTO incidents
            (title, description, type, severity, service, logs, created_at, updated_at, status, category, root_causes, response_plan, timeline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Investigating', ?, ?, ?, ?)""",
            (incident["title"], incident["description"], result["type"], result["severity"], incident["service"],
             incident["logs"], created_at, now_iso(), result["category"], json.dumps(result["root_causes"]),
             json.dumps(result["response_plan"]), json.dumps(timeline)),
        )
        row = connection.execute("SELECT * FROM incidents WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return incident_dict(row)


def get_incident_record(incident_id: int) -> dict[str, Any]:
    with connect() as connection:
        row = connection.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Incident not found.")
        messages = connection.execute("SELECT id, role, content, created_at FROM messages WHERE incident_id = ? ORDER BY id", (incident_id,)).fetchall()
    result = incident_dict(row)
    result["messages"] = [dict(message) for message in messages]
    return result


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: int) -> dict[str, Any]:
    return get_incident_record(incident_id)


@app.patch("/api/incidents/{incident_id}/status")
def update_status(incident_id: int, payload: StatusUpdate) -> dict[str, Any]:
    with connect() as connection:
        row = connection.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Incident not found.")
        timeline = json.loads(row["timeline"])
        timeline.append({"time": now_iso(), "label": f"Status changed to {payload.status}", "detail": "Updated by an operator."})
        connection.execute("UPDATE incidents SET status = ?, updated_at = ?, timeline = ? WHERE id = ?", (payload.status, now_iso(), json.dumps(timeline), incident_id))
    return get_incident_record(incident_id)


@app.post("/api/incidents/{incident_id}/approve")
def approve_step(incident_id: int, payload: ApprovalRequest) -> dict[str, Any]:
    with connect() as connection:
        row = connection.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Incident not found.")
        timeline = json.loads(row["timeline"])
        timeline.append({"time": now_iso(), "label": f"Step {payload.step} acknowledged by human operator",
                         "detail": payload.note or "Approval recorded for review only. No action or command was executed."})
        connection.execute("UPDATE incidents SET updated_at = ?, timeline = ? WHERE id = ?", (now_iso(), json.dumps(timeline), incident_id))
    return get_incident_record(incident_id)


def fallback_chat(message: str, incident: dict[str, Any]) -> str:
    text = message.lower()
    if any(word in text for word in ("cause", "why", "root")):
        return "Most likely causes to investigate: " + " ".join(incident["root_causes"])
    if any(word in text for word in ("plan", "next", "steps", "mitigate")):
        steps = " ".join(f"{item['step']}. {item['title']}: {item['detail']}" for item in incident["response_plan"])
        return "Recommended next steps: " + steps
    if any(word in text for word in ("severity", "impact", "customer")):
        return f"This is currently a {incident['severity']} severity {incident['category']} incident affecting {incident['service']}. Status: {incident['status']}. Confirm customer impact against live service indicators."
    return f"For {incident['title']}, the current status is {incident['status']} with {incident['severity']} severity. {incident['description']} I can help reason about likely causes, impact, or the response plan."


@app.post("/api/incidents/{incident_id}/chat")
def chat(incident_id: int, payload: ChatRequest) -> dict[str, Any]:
    incident = get_incident_record(incident_id)
    history = incident["messages"][-8:]
    result = llm_json(
        "You are a careful incident response assistant. Answer using the incident context, distinguish facts from hypotheses, and never execute or claim to execute production commands. State that humans must approve production changes. Return JSON with one string field: answer.",
        json.dumps({"incident": {key: incident[key] for key in ("title", "description", "severity", "status", "service", "logs", "root_causes", "response_plan")}, "history": history, "question": payload.message}),
    )
    answer = str(result.get("answer", "")).strip() if result else ""
    if not answer:
        answer = fallback_chat(payload.message, incident)
    timestamp = now_iso()
    with connect() as connection:
        connection.executemany("INSERT INTO messages (incident_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                               [(incident_id, "user", payload.message, timestamp), (incident_id, "assistant", answer, timestamp)])
        rows = connection.execute("SELECT id, role, content, created_at FROM messages WHERE incident_id = ? ORDER BY id DESC LIMIT 2", (incident_id,)).fetchall()
    return {"answer": answer, "messages": [dict(row) for row in reversed(rows)]}