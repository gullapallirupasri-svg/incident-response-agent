(() => {
  const STORAGE_KEY = "signalops-incidents-v1";
  const PROFILE_KEY = "signalops-profile-v1";
  const SESSION_KEY = "signalops-demo-session-v1";
  const DEMO_EMAIL = "jordan.davis@example.test";
  const DEMO_PASSWORD = "signalops-demo";
  const root = document.getElementById("root");
  const state = { authenticated: false, loginError: "", view: "Dashboard", selectedId: null, assistantIncidentId: readPreference("signalops-assistant-incident", ""), backendReady: location.protocol === "file:" ? false : null, modalOpen: false, modalType: "incident", reportFromList: false, search: "", status: "All", activeOnly: false, severity: "All", service: "All", dateFrom: "", dateTo: "", sort: "newest", toast: "", notificationOpen: false, readNotifications: new Set(), chatMessages: [], demoMode: false, demoRun: 0, selectedService: null, sidebarCollapsed: readPreference("signalops-sidebar-collapsed", "false") === "true", theme: readPreference("signalops-theme", "light"), profile: loadProfile() };
  const services = [
    { name: "API Gateway", status: "Operational", availability: "99.99%", latency: "42 ms", detail: "Request routing is within latency and error-rate targets." },
    { name: "Checkout", status: "Degraded", availability: "98.42%", latency: "1.8 s", detail: "Payment authorization timeouts are elevated in US-East." },
    { name: "Event Pipeline", status: "Degraded", availability: "99.10%", latency: "8.7 s", detail: "Order event consumers are processing with elevated queue lag." },
    { name: "Authentication", status: "Operational", availability: "99.97%", latency: "86 ms", detail: "Login success rate is recovering; continue watching failed attempts." },
    { name: "Database", status: "Operational", availability: "99.99%", latency: "12 ms", detail: "Connections and query latency are within normal range." },
    { name: "Notification Service", status: "Operational", availability: "99.95%", latency: "128 ms", detail: "Message delivery is healthy and within service-level objectives." },
  ];
  const responders = [
    { name: "Jordan Davis", role: "Primary on-call", team: "Platform SRE", availability: "Available", contact: "jordan.davis@example.test" },
    { name: "Maya Chen", role: "Payments lead", team: "Payments Platform", availability: "Available", contact: "maya.chen@example.test" },
    { name: "Alex Morgan", role: "Incident commander", team: "Reliability Engineering", availability: "In rotation", contact: "alex.morgan@example.test" },
  ];

  function loadProfile() {
    try { return { name: "Jordan Davis", ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
    catch { return { name: "Jordan Davis" }; }
  }

  function readPreference(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch { return fallback; }
  }

  function hasDemoSession() {
    try { return localStorage.getItem(SESSION_KEY) === "active"; }
    catch { return false; }
  }

  function landingPage() {
    return `<main class="landing-page"><header class="landing-nav"><a class="brand" href="#top"><span class="brand-icon">${icon("activity", 17)}</span><b>signal<span>ops</span></b></a><nav><a href="#workflow">How it works</a><a href="#capabilities">Capabilities</a></nav><button class="primary" data-action="demo-login">Open demo workspace ${icon("arrow", 14)}</button></header><section class="landing-hero" id="top"><div class="landing-copy"><div class="landing-eyebrow"><i></i>AI-ASSISTED INCIDENT RESPONSE</div><h1>Resolve the incident.<br><em>Keep control.</em></h1><p>SignalOps turns noisy alerts, logs, and service context into a clear investigation path, with every production decision left to your team.</p><div class="landing-actions"><button class="primary" data-action="demo-login">Explore the live demo ${icon("arrow", 14)}</button><a class="landing-secondary" href="#workflow">See how it works <span>↓</span></a></div><div class="landing-proof"><span>${icon("shield", 14)}Human-approved actions</span><span>${icon("activity", 14)}Evidence-led analysis</span></div></div><div class="landing-console"><div class="console-top"><span><i></i>LIVE INCIDENT BRIEF</span><code>INC-0042</code></div><div class="console-alert"><span class="console-alert-icon">${icon("alert", 17)}</span><div><small>CRITICAL · CHECKOUT API</small><b>Authorization timeouts elevated</b><p>US-East · production · 3 min ago</p></div><span class="console-status">Investigating</span></div><div class="console-analysis"><div class="console-analysis-head">${icon("spark", 14)}First read <span>Signal-based</span></div><p>Timeouts rose after a release. Gateway errors and latency point to an upstream authorization bottleneck.</p><div class="console-evidence"><b>2 signals correlated</b><span>504 responses</span><span>release 2026.09.28.4</span></div></div><div class="console-next"><span class="console-step">01</span><div><b>Confirm customer impact</b><small>Compare error rate by region and checkout stage</small></div><span>›</span></div><div class="console-next console-next-muted"><span class="console-step">02</span><div><b>Review the release window</b><small>Human approval required for mitigation</small></div><span>${icon("shield", 13)}</span></div><div class="console-foot"><i></i>Recommendations only · no automated changes</div></div></section><section class="landing-workflow" id="workflow"><div><small>FROM SIGNAL TO RECOVERY</small><h2>A calmer response starts with better context.</h2></div><div class="workflow-steps"><article><span>01 / Detect</span><b>Bring the signal together</b><p>Capture the service, environment, timestamp, logs, and error details in one incident record.</p></article><article><span>02 / Investigate</span><b>Understand what changed</b><p>Separate observed evidence from possible causes and prioritize what to verify next.</p></article><article><span>03 / Recover</span><b>Keep the operator in charge</b><p>Review response options, record approvals, and verify recovery before closing the incident.</p></article></div></section><section class="landing-capabilities" id="capabilities"><div><small>RESPONSE WORKSPACE</small><h2>One shared picture, from first alert to follow-up.</h2></div><div class="capability-list"><span>${icon("activity", 15)}Incident trends &amp; severity</span><span>${icon("search", 15)}Evidence-linked analysis</span><span>${icon("clock", 15)}Timeline &amp; ownership</span><span>${icon("shield", 15)}Human-controlled actions</span></div></section><footer class="landing-footer"><span>signalops / incident response</span><span>Built for teams on the sharp end of reliability.</span></footer></main>`;
  }

  function homePage() {
    const features = [
      ["alert", "Detect Incidents", "Capture service signals with impact, environment, and time context."],
      ["file", "Analyze Logs", "Bring logs and errors into a single incident record for investigation."],
      ["search", "Identify Possible Root Causes", "Rank evidence-grounded hypotheses for responders to verify."],
      ["activity", "Determine Severity", "Prioritize incidents with clear impact and severity rationale."],
      ["shield", "Recommend Response Actions", "Review safe response steps while keeping people in control."],
      ["clock", "Track Incident Progress", "Follow ownership, status changes, approvals, and recovery."],
      ["spark", "AI Chat Assistant", "Ask incident-aware questions about impact, causes, and next checks."],
      ["history", "Incident History", "Search, filter, and revisit previous service disruptions."],
    ];
    const benefits = [
      ["Faster Incident Analysis", "Start with a structured first read instead of scattered signals."],
      ["AI-Assisted Investigation", "Use likely causes and next checks to focus response work."],
      ["Explainable Recommendations", "Keep evidence and uncertainty visible beside guidance."],
      ["Centralized Incident Tracking", "Keep status, responder, timeline, and notes together."],
      ["Human-in-the-Loop Response", "Review and acknowledge recommendations; no production action runs automatically."],
      ["Real-Time Dashboard", "See active incidents, severity, response time, and trend at a glance."],
    ];
    const workflow = ["Detect", "Analyze", "Investigate", "Recommend", "Human Approval", "Resolve"];
    return `<main class="landing-page landing-home"><header class="landing-nav"><a class="brand" href="#home-top"><span class="brand-icon">${icon("activity", 17)}</span><b>Incident Response Agent</b></a><nav><a href="#home-top">Home</a><a href="#about">About</a><a href="#how-it-works">How It Works</a><a href="#features">Features</a><a href="#contact">Contact</a></nav><button class="primary" data-action="demo-login">Dashboard ${icon("arrow", 14)}</button></header><section class="landing-hero" id="home-top"><div class="landing-copy"><div class="landing-eyebrow"><i></i>AI-ASSISTED INCIDENT RESPONSE</div><h1>AI Incident Response Agent</h1><p class="landing-tagline">Detect. Analyze. Respond. Resolve.</p><p>An AI-powered incident management platform that helps teams detect incidents, analyze their causes, prioritize severity, and generate intelligent response plans while keeping humans in control.</p><div class="landing-actions"><button class="primary" data-action="demo-login">Open Dashboard ${icon("arrow", 14)}</button><a class="landing-secondary" href="#about">Learn More <span>↓</span></a></div><div class="landing-proof"><span>${icon("shield", 14)}Human-approved actions</span><span>${icon("activity", 14)}Evidence-led analysis</span></div></div><div class="landing-console"><div class="console-top"><span><i></i>LIVE INCIDENT BRIEF</span><code>INC-0042</code></div><div class="console-alert"><span class="console-alert-icon">${icon("alert", 17)}</span><div><small>CRITICAL · CHECKOUT API</small><b>Authorization timeouts elevated</b><p>US-East · production · 3 min ago</p></div><span class="console-status">Investigating</span></div><div class="console-analysis"><div class="console-analysis-head">${icon("spark", 14)}AI first read <span>Signal-based</span></div><p>Timeouts rose after a release. Gateway errors and latency point to an upstream authorization bottleneck.</p><div class="console-evidence"><b>2 signals correlated</b><span>504 responses</span><span>release window</span></div></div><div class="console-next"><span class="console-step">01</span><div><b>Investigate customer impact</b><small>Compare errors by region and checkout stage</small></div><span>›</span></div><div class="console-next console-next-muted"><span class="console-step">02</span><div><b>Review response options</b><small>Operator approval required for changes</small></div><span>${icon("shield", 13)}</span></div><div class="console-foot"><i></i>Recommendations only · no automated changes</div></div></section><section class="landing-explainer" id="about"><div><small>ABOUT THE AGENT</small><h2>What is incident response?</h2><p>An IT incident is an unexpected interruption or degradation in a service. A fast, coordinated response helps limit customer impact, restore reliability, and capture what the team learned.</p></div><div><small>WHAT THE AGENT DOES</small><h2>Useful signal, clear next step.</h2><p>The agent organizes incident context, analyzes supplied evidence, suggests investigation paths, and records progress. Responders verify the findings and approve any action.</p></div></section><section class="landing-feature-section" id="features"><div class="landing-section-heading"><small>CAPABILITIES</small><h2>Everything responders need to stay oriented.</h2></div><div class="landing-feature-grid">${features.map(([symbol, title, copy]) => `<article class="landing-feature-card"><span>${icon(symbol, 17)}</span><h3>${title}</h3><p>${copy}</p></article>`).join("")}</div></section><section class="landing-process-section" id="how-it-works"><div class="landing-section-heading"><small>HOW IT WORKS</small><h2>From first signal to verified recovery.</h2></div><ol class="landing-process">${workflow.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><b>${step}</b></li>`).join("")}</ol></section><section class="landing-benefits-section"><div class="landing-section-heading"><small>KEY BENEFITS</small><h2>Clarity for the people doing the work.</h2></div><div class="landing-benefit-grid">${benefits.map(([title, copy]) => `<article><i>${icon("check", 13)}</i><div><h3>${title}</h3><p>${copy}</p></div></article>`).join("")}</div></section><section class="landing-contact-section" id="contact"><div><small>PROJECT INFORMATION</small><h2>Contact the project team</h2><p>Replace these placeholders with your team's official details.</p></div><dl><div><dt>Project Team</dt><dd>[Project team]</dd></div><div><dt>Institution</dt><dd>[Institution]</dd></div><div><dt>Email</dt><dd>[Email address]</dd></div><div><dt>GitHub</dt><dd>[GitHub repository]</dd></div><div><dt>LinkedIn</dt><dd>[LinkedIn profile]</dd></div></dl></section><footer class="landing-footer"><span>Incident Response Agent</span><a href="#home-top">Back to top ↑</a><button class="landing-footer-dashboard" data-action="demo-login">Open Dashboard ${icon("arrow", 12)}</button></footer></main>`;
  }

  function signInPage() {
    return `<div class="signin-page"><section class="signin-panel"><a class="brand signin-brand" href="#home"><span class="brand-icon">${icon("activity", 17)}</span><b>signal<span>ops</span></b></a><div class="signin-content"><div class="eyebrow">NORTHSTAR WORKSPACE</div><h1>Welcome back</h1><p>Sign in to your AI-powered incident response workspace.</p><form id="signin-form"><label for="signin-email">Work email<input id="signin-email" name="email" type="email" autocomplete="username" required placeholder="you@company.com" /></label><label for="signin-password">Password<input id="signin-password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password" /></label>${state.loginError ? `<div class="signin-error" role="alert">${escapeHtml(state.loginError)}</div>` : ""}<button class="primary signin-submit">Sign in</button></form><div class="demo-credentials"><span>DEMO WORKSPACE CREDENTIALS</span><b>${DEMO_EMAIL}</b><b>${DEMO_PASSWORD}</b><small>Local prototype account · no credentials are sent anywhere</small></div><div class="signin-divider"><span>OR</span></div><button class="secondary-button demo-login" data-action="demo-login">${icon("activity", 14)}Continue with demo workspace</button><p class="signin-disclosure">Demo access is stored in this browser only. This prototype does not provide production authentication.</p></div><footer>SignalOps · Incident response workspace</footer></section><aside class="signin-aside"><span class="signin-aside-mark">${icon("spark", 19)}</span><p>AI-POWERED INCIDENT RESPONSE AGENT</p><h2>From first signal to safer resolution.</h2><div class="signin-aside-line"></div><span>Investigate with context. Keep every action human-controlled.</span></aside></div>`;
  }

  const iconPaths = {
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    alert: '<path d="M12 3 2.8 19a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    command: '<path d="M9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7Z"/>',
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"/>',
    history: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6m-8 4v6m-3-3h6"/>',
  };

  function icon(name, size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function ago(value) {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
  }

  function makeSample(title, description, type, severity, service, logs, hoursAgo, status, region, assignedTo, impact, rootCause, resolutionNotes = "") {
    const created = new Date(Date.now() - hoursAgo * 3600000).toISOString();
    const analysis = analyze({ title, description, type, severity, service, logs });
    const assignedTeam = assignedTo.split(" · ")[1] || "Platform SRE";
    const timeline = [
      { time: new Date(new Date(created).getTime() - 60000).toISOString(), label: "Incident detected", detail: `Monitoring alert fired for ${service}.`, actor: "SignalOps Monitor" },
      { time: created, label: "Incident created", detail: description, actor: "Jordan Davis" },
      { time: new Date(new Date(created).getTime() + 30000).toISOString(), label: "Responder assigned", detail: `${assignedTo} is coordinating response.`, actor: assignedTeam },
      { time: new Date(new Date(created).getTime() + 60000).toISOString(), label: "Investigation started", detail: `Initial triage started for ${service}.`, actor: assignedTeam },
    ];
    if (status === "Monitoring" || status === "Resolved") timeline.push({ time: new Date(new Date(created).getTime() + 120000).toISOString(), label: "Mitigation applied", detail: "A mitigation is in place; operators are monitoring recovery indicators.", actor: assignedTeam });
    const resolvedAt = status === "Resolved" ? new Date(Date.now() - 4 * 3600000).toISOString() : null;
    if (resolvedAt) timeline.push({ time: resolvedAt, label: "Incident resolved", detail: resolutionNotes, actor: assignedTeam });
    return {
      id: Date.now() + Math.floor(hoursAgo * 1000), title, description, type: analysis.type,
      summary: analysis.summary, environment: "Production",
      severity, service, logs, region, assigned_to: assignedTo, assigned_team: assignedTeam,
      impact, start_time: created, created_at: created, updated_at: resolvedAt || created,
      status, resolved_at: resolvedAt, resolution_notes: resolutionNotes,
      category: analysis.category, root_causes: analysis.root_causes,
      evidence: analysis.evidence, confidence: analysis.confidence, severity_basis: analysis.severity_basis, ai_source: "local-rules",
      response_plan: analysis.response_plan,
      timeline, messages: [], root_cause: rootCause,
    };
  }

  function samples() {
    return [
      makeSample("Elevated checkout failures in US-East", "Payment authorization requests are timing out for a growing share of checkout sessions. The issue began shortly after the 14:20 deploy.", "Availability", "Critical", "checkout-api", "upstream request timeout after 3000ms\nPOST /v2/authorize status=504 region=us-east-1", 0.4, "Investigating", "US-East", "Maya Chen · Payments Platform", "Checkout conversion is down for US-East customers; payment retries are elevated.", "A downstream payment authorization pool is timing out after the latest checkout deployment."),
      makeSample("Queue lag above target on event workers", "The consumer group is falling behind on order.updated events. Processing continues, but downstream notifications are delayed.", "Performance", "High", "event-worker", "consumer_lag=18420 partition=orders-07\nhandler_duration_p95=8.7s", 1.2, "Monitoring", "Global", "Alex Morgan · Reliability Engineering", "Order updates and downstream notifications are delayed, but no events are currently lost.", "A slow event handler is limiting consumer throughput."),
      makeSample("Intermittent 502 responses from catalog", "A small percentage of product-detail requests return a gateway error. Health checks remain green and the error rate is trending down.", "Availability", "Medium", "catalog-service", "GET /products/sku-9182 status=502\nupstream_reset_before_response_started", 2.1, "Monitoring", "US-West", "Jordan Davis · Platform SRE", "Some product detail pages intermittently fail to load; browse traffic remains available.", "Transient upstream connection resets are reaching the catalog gateway."),
      makeSample("Authentication service login failures", "Login failures increased for a subset of users after a policy update. Existing sessions remain active.", "Security", "High", "auth-service", "login_failure_rate=12.4% region=eu-west\npolicy_check=denied", 3.4, "Investigating", "EU-West", "Jordan Davis · Identity Platform", "Affected users cannot start new sessions in EU-West; existing sessions are unaffected.", "A recent authentication policy change may be rejecting valid login requests."),
      makeSample("Resolved: delayed warehouse sync", "Inventory updates were delayed while a scheduled warehouse export retried. The backlog has drained and freshness is back within target.", "Data integrity", "Low", "inventory-sync", "sync_duration=41m retry_count=3 backlog=0", 20, "Resolved", "US-Central", "Maya Chen · Data Platform", "Inventory freshness was delayed by up to 41 minutes; no records were lost.", "A transient export timeout triggered repeated retries.", "Warehouse export completed, backlog drained, and the sync retry policy was corrected."),
    ];
  }

  function loadIncidents() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeIncident);
      }
    } catch (error) {
      console.warn("Browser storage is unavailable; incidents will remain for this tab only.", error);
    }
    return samples();
  }

  function normalizeIncident(item) {
    const analysis = analyze(item);
    const team = item.assigned_team || item.assigned_to?.split(" · ")[1] || "Platform SRE";
    return {
      ...item,
      type: item.type || analysis.type,
      region: item.region || "Not specified",
      assigned_to: item.assigned_to || `${state.profile.name} · ${team}`,
      assigned_team: team,
      impact: item.impact || item.description,
      start_time: item.start_time || item.created_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      status: item.status || "Investigating",
      category: item.category || analysis.category,
      summary: item.summary || analysis.summary,
      environment: item.environment || "Production",
      error_messages: item.error_messages || "",
      severity_basis: item.severity_basis || analysis.severity_basis,
      ai_source: item.ai_source || "local-rules",
      root_causes: item.root_causes || analysis.root_causes,
      evidence: item.evidence || analysis.evidence,
      confidence: item.confidence || analysis.confidence,
      response_plan: item.response_plan || analysis.response_plan,
      timeline: Array.isArray(item.timeline) ? item.timeline.map((entry) => ({ actor: "Operations", ...entry })) : [],
      messages: Array.isArray(item.messages) ? item.messages : [],
      resolved_at: item.resolved_at || null,
      resolution_notes: item.resolution_notes || "",
      root_cause: item.root_cause || (item.root_causes || analysis.root_causes)[0],
    };
  }

  let incidents = loadIncidents();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents)); }
    catch (error) { console.warn("Could not save incidents to browser storage.", error); }
  }

  function detectType(report) {
    const text = `${report.title} ${report.description} ${report.logs}`.toLowerCase();
    const rules = [
      ["Security", ["security", "unauthorized", "credential", "breach", "suspicious login", "permission denied"]],
      ["Data integrity", ["data loss", "corrupt", "integrity", "sync", "replication"]],
      ["Availability", ["outage", "unavailable", "502", "503", "504", "connection refused", "failed requests"]],
      ["Performance", ["slow", "latency", "timeout", "lag", "overloaded", "high cpu", "high memory"]],
      ["Deployment", ["deploy", "deployment", "release", "rollback", "version"]],
    ];
    for (const [type, terms] of rules) if (terms.some((term) => text.includes(term))) return type;
    return report.type || "Other";
  }

  function analyze(report) {
    const text = `${report.title || ""} ${report.description || ""} ${report.logs || ""} ${report.error_messages || ""}`.toLowerCase();
    const has = (...terms) => terms.some((term) => text.includes(term));
    const type = detectType({ ...report, logs: `${report.logs || ""} ${report.error_messages || ""}` });
    const category = type === "Security" ? "Security / access"
      : type === "Data integrity" ? "Data integrity"
        : type === "Availability" ? "Service availability"
          : type === "Deployment" ? "Deployment change"
            : type === "Performance" ? "Performance degradation" : "Uncategorized signal";
    const rootCauses = [];
    if (has("deploy", "release", "version")) rootCauses.push("A release or version change may be related; compare the incident start with the deployment window.");
    if (has("timeout", "latency", "lag", "slow", "pool exhausted")) rootCauses.push("A slow or saturated dependency may be delaying requests; inspect dependency latency and connection-pool utilization.");
    if (has("502", "503", "504", "connection refused", "connection reset", "upstream")) rootCauses.push("The gateway reports an upstream failure; verify dependency health and network or connection-reset signals.");
    if (has("unauthorized", "permission denied", "credential", "breach", "suspicious login")) rootCauses.push("An authentication or access-policy change may be rejecting requests; verify audit events and expected principal permissions.");
    if (has("corrupt", "integrity", "replication", "sync", "data loss")) rootCauses.push("A synchronization or replication issue may be affecting data consistency; compare source and destination records before remediation.");
    if (has("429", "rate limit", "throttl")) rootCauses.push("Rate limiting or quota exhaustion may be rejecting traffic; compare request volume with service and provider limits.");
    if (!rootCauses.length) rootCauses.push("The supplied signals do not identify a likely cause yet; inspect service metrics and recent changes before choosing a mitigation.");
    const evidenceSignals = [report.logs, report.error_messages].filter((value) => String(value || "").trim()).length;
    const matchingSignals = ["timeout", "latency", "lag", "502", "503", "504", "429", "unauthorized", "permission denied", "corrupt", "sync", "deploy", "release"]
      .filter((term) => text.includes(term)).length;
    const severity = ["Low", "Medium", "High", "Critical"].includes(report.severity) ? report.severity
      : has("complete outage", "all users", "data loss", "security breach", "widespread outage") ? "Critical"
        : has("major impact", "many users", "elevated error", "high latency", "service unavailable") ? "High"
          : has("minor", "isolated", "no customer impact") ? "Low" : "Medium";
    const summaryText = String(report.description || report.title || "Incident reported.").trim().replace(/\s+/g, " ");
    const context = [report.service, report.environment || report.region].filter(Boolean).join(" · ");
    return {
      type,
      category,
      severity,
      summary: `${context ? `${context}: ` : ""}${summaryText}`,
      root_causes: rootCauses.slice(0, 3),
      evidence: [report.logs?.trim() && `Logs: ${report.logs.trim()}`, report.error_messages?.trim() && `Errors: ${report.error_messages.trim()}`].filter(Boolean).join("\n") || "No logs or error messages supplied. Treat causes as low-confidence hypotheses and gather service telemetry.",
      impact: report.impact || report.description || "Customer impact is still being assessed.",
      confidence: evidenceSignals > 1 && matchingSignals > 1 ? "High · multiple matching signals" : matchingSignals > 0 ? "Moderate · one matching signal" : "Low · limited corroborating evidence",
      severity_basis: report.severity && report.severity !== "Auto assess" ? "Operator supplied" : "Estimated from reported impact language",
      response_plan: [
        { step: 1, title: "Confirm impact", detail: "Check service-level indicators, affected regions, and customer impact." },
        { step: 2, title: "Correlate signals", detail: "Compare error and latency changes with recent deploys, dependencies, and infrastructure events." },
        { step: 3, title: "Choose a mitigation", detail: "Review the safest reversible mitigation with the service owner; obtain human approval before any production change." },
        { step: 4, title: "Verify recovery", detail: "Watch error rate, latency, and backlog return to baseline, then record the outcome." },
      ],
    };
  }

  async function analyzeWithBackend(report) {
    const fallback = { ...analyze(report), ai_source: "local-rules" };
    if (location.protocol === "file:" || !["localhost", "127.0.0.1"].includes(location.hostname)) return { ...fallback, backend_unavailable: true };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: report.title,
          description: report.description,
          service: report.service,
          environment: report.environment || "unspecified",
          logs: report.logs || "",
          error_messages: report.error_messages || "",
          type: report.type || null,
          severity: ["Low", "Medium", "High", "Critical"].includes(report.severity) ? report.severity : null,
        }),
      });
      if (!response.ok) { state.backendReady = false; return { ...fallback, backend_unavailable: true }; }
      const result = await response.json();
      state.backendReady = true;
      return result.analysis ? { ...fallback, ...result.analysis, ai_source: result.ai_source || result.analysis.ai_source || "local-rules" } : { ...fallback, backend_unavailable: true };
    } catch {
      state.backendReady = false;
      return { ...fallback, backend_unavailable: true };
    } finally {
      clearTimeout(timeout);
    }
  }

  function severityBadge(value) {
    return `<span class="severity severity-${escapeHtml(value.toLowerCase())}"><i></i>${escapeHtml(value)}</span>`;
  }

  function statusBadge(value) {
    return `<span class="status status-${escapeHtml(value.toLowerCase())}"><i></i>${escapeHtml(value)}</span>`;
  }

  function empty(title, copy) {
    return `<div class="empty"><span>${icon("check", 16)}</span><b>${escapeHtml(title)}</b><small>${escapeHtml(copy)}</small></div>`;
  }

  function heading(eyebrow, title, copy, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p></div>${action}</div>`;
  }

  function incidentRow(item) {
    return `<button class="incident-row" data-open="${item.id}"><span class="row-icon ${escapeHtml(item.severity.toLowerCase())}">${icon("alert", 16)}</span><span class="row-copy"><b>${escapeHtml(item.title)}</b><small><strong>${escapeHtml(item.service)}</strong><i></i>${escapeHtml(item.category)}</small></span><span class="row-tags">${severityBadge(item.severity)}${statusBadge(item.status)}</span><time>${escapeHtml(ago(item.created_at))}${icon("arrow", 13)}</time></button>`;
  }

  function serviceLine(name, stateText, warning = false) {
    return `<div class="service-line"><span><i class="${warning ? "warn-dot" : ""}"></i>${escapeHtml(name)}</span><small class="${warning ? "warning-text" : ""}">${escapeHtml(stateText)}</small></div>`;
  }

  function resolutionTime(item) {
    if (!item.resolved_at) return "—";
    const minutes = Math.max(1, Math.round((new Date(item.resolved_at) - new Date(item.start_time || item.created_at)) / 60000));
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  function averageResolution() {
    const resolved = incidents.filter((item) => item.status === "Resolved" && item.resolved_at);
    if (!resolved.length) return "—";
    const total = resolved.reduce((sum, item) => sum + Math.max(1, (new Date(item.resolved_at) - new Date(item.start_time || item.created_at)) / 60000), 0);
    const average = Math.round(total / resolved.length);
    return average < 60 ? `${average}m` : `${Math.floor(average / 60)}h ${average % 60}m`;
  }

  function averageResponseTime() {
    const responseTimes = incidents.map((item) => responseTimeMilliseconds(item)).filter((elapsed) => elapsed !== null);
    if (!responseTimes.length) return "—";
    const averageSeconds = Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length / 1000);
    return averageSeconds < 60 ? `${averageSeconds}s` : `${Math.round(averageSeconds / 60)}m`;
  }

  function responseTimeMilliseconds(item) {
    const reportedAt = new Date(item.created_at).getTime();
    const acknowledged = item.timeline.find((entry) => /acknowledged|responder assigned|engineer assigned|investigation started/i.test(entry.label));
    if (!acknowledged) return null;
    const elapsed = new Date(acknowledged.time).getTime() - reportedAt;
    return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null;
  }

  function responseTime(item) {
    const elapsed = responseTimeMilliseconds(item);
    if (elapsed === null) return "—";
    const seconds = Math.round(elapsed / 1000);
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
  }

  function trendValues() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const count = incidents.filter((item) => {
        const created = new Date(item.created_at);
        return `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}` === key;
      }).length;
      return { label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date), count };
    });
  }

  function chartRows(title, filter, values, total) {
    const rows = values.map(([label, count, color]) => {
      const width = total ? Math.max(count ? 7 : 0, Math.round(count / total * 100)) : 0;
      return `<button type="button" class="chart-row chart-row-button" data-chart-filter="${filter}" data-chart-value="${escapeHtml(label)}" aria-label="Show ${count} incidents by ${escapeHtml(filter)}: ${escapeHtml(label)}"><div><span>${escapeHtml(label)}</span><b>${count}</b></div><div class="chart-track"><i class="${color}" style="width:${width}%"></i></div></button>`;
    }).join("");
    return `<article class="panel chart-panel"><div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${total} incidents in this browser</p></div></div><div class="chart-rows">${rows}</div></article>`;
  }

  function analyticsSection(resolution) {
    const severityCounts = ["Critical", "High", "Medium", "Low"].map((value, index) => [value, incidents.filter((item) => item.severity === value).length, `chart-color-${index}`]);
    const statusCounts = ["Investigating", "Monitoring", "Resolved"].map((value, index) => [value, incidents.filter((item) => item.status === value).length, `chart-color-${index + 4}`]);
    const serviceCounts = [...new Set(incidents.map((item) => item.service))].slice(0, 5).map((value, index) => [value, incidents.filter((item) => item.service === value).length, `chart-color-${index + 7}`]);
    const operational = services.filter((service) => service.status === "Operational").length;
    return `<section class="analytics-section"><div class="section-head"><div><h2>Incident analytics</h2><p>Workspace trends and service performance</p></div><span class="analytics-tag">LOCAL DATA</span></div><div class="analytics-grid">${chartRows("Incidents by severity", "severity", severityCounts, incidents.length)}${chartRows("Incidents by status", "status", statusCounts, incidents.length)}${chartRows("Incidents by service", "service", serviceCounts, incidents.length)}<article class="panel analytics-summary"><div><span>Average resolution</span><b>${escapeHtml(resolution)}</b><small>Across resolved incidents</small></div><div><span>Service availability</span><b>${(operational / services.length * 100).toFixed(0)}<small>%</small></b><small>${operational} of ${services.length} services operational</small></div></article></div></section>`;
  }

  function dashboard() {
    const active = incidents.filter((item) => item.status !== "Resolved");
    const resolved = incidents.filter((item) => item.status === "Resolved");
    const critical = active.filter((item) => item.severity === "Critical").length;
    const briefIncident = active.find((item) => String(item.id) === String(state.briefIncidentId)) || active[0];
    const metrics = [
      ["Total incidents", incidents.length, "Across all time", "alert", "ink"],
      ["Active now", active.length, "Needs attention", "activity", "green"],
      ["Critical", critical, "Immediate response", "alert", "red"],
      ["Resolved", resolved.length, "Successfully closed", "check", "leaf"],
    ];
    const cards = metrics.map(([label, value, note, symbol, color]) => `<article class="metric"><div>${label}<span class="metric-icon ${color}">${icon(symbol, 15)}</span></div><strong>${value}</strong><small>${note}</small></article>`).join("");
    const activeRows = active.slice(0, 5).map(incidentRow).join("") || empty("No active incidents", "New reports will appear here.");
    const resolvedRows = resolved.slice(0, 4).map((item) => `<button class="resolved-item" data-open="${item.id}"><span>${icon("check", 13)}</span><b>${escapeHtml(item.title)}<small>${escapeHtml(item.service)} · ${escapeHtml(ago(item.resolved_at || item.updated_at))}</small></b>${severityBadge(item.severity)}</button>`).join("") || empty("Nothing resolved yet", "Resolved incidents will show here.");
    const brief = critical
      ? `There ${critical === 1 ? "is" : "are"} ${critical} critical incident${critical === 1 ? "" : "s"} currently active. Validate customer impact and recent changes before selecting a mitigation.`
      : "No critical incidents are active. Monitored services are operating within their current health thresholds.";
    const serviceRows = services.map((service) => `<button class="service-line service-button" data-service="${escapeHtml(service.name)}"><span><i class="${service.status === "Operational" ? "" : service.status === "Down" ? "down-dot" : "warn-dot"}"></i>${escapeHtml(service.name)}</span><small class="${service.status === "Operational" ? "" : "warning-text"}">${escapeHtml(service.status)}</small></button>`).join("");
    const resolvedDuration = averageResolution();
    return `<div class="page">
      ${heading(new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase(), "Good afternoon, Jordan", "Here's what's happening across your services.", `<button class="primary" data-action="create">${icon("file", 15)}Create incident</button>`)}
      <section class="metrics">${cards}</section>
      <section class="overview-grid"><article class="panel active-panel"><div class="panel-head"><div><h2>Active incidents <span class="count">${active.length}</span></h2><p>Prioritized by severity and recency</p></div><button class="link-button" data-view="Incidents">View all ${icon("arrow", 13)}</button></div>
      ${critical ? `<div class="urgent">${icon("alert", 17)}<span><b>${critical} critical incident${critical === 1 ? "" : "s"} need attention</b><small>Review current impact and response guidance.</small></span>${icon("arrow", 14)}</div>` : ""}${activeRows}</article>
      <aside class="right-column"><article class="panel health-panel"><div class="panel-head"><div><h2>Service health</h2><p>Production environment</p></div><span class="healthy-pill"><i></i>${services.some((service) => service.status === "Down") ? "Needs attention" : "Monitoring"}</span></div><div class="uptime"><b>99.94<span>%</span></b><small>Availability · last 24 hours</small></div><div class="bars">${Array.from({ length: 32 }, (_, index) => `<i class="${index === 24 || index === 25 ? "warn-bar" : ""}"></i>`).join("")}</div><div class="bar-caption"><span>24 hours ago</span><span>Now</span></div><div class="service-lines">${serviceRows}</div></article>
      <article class="brief"><div class="brief-title">${icon("spark", 15)}AI INCIDENT BRIEF <small>MOCK AI GUIDANCE</small></div>${briefIncident ? `<h3>${escapeHtml(briefIncident.title)}</h3><p>${escapeHtml(briefIncident.impact)}</p><div class="brief-facts"><span>Suggested severity</span>${severityBadge(briefIncident.severity)}</div><div class="brief-footnote"><b>Possible cause:</b> ${escapeHtml(briefIncident.root_causes[0])}<br><b>Next step:</b> ${escapeHtml(briefIncident.response_plan[0]?.title || "Confirm impact")}</div>` : `<p>${escapeHtml(brief)}</p>`}<div><span><i></i>Prototype guidance</span><button data-open="${briefIncident?.id || ""}" ${briefIncident ? "" : "disabled"}>View analysis ${icon("arrow", 12)}</button></div></article></aside></section>
      ${analyticsSection(resolvedDuration)}
      <section class="recent"><div class="section-head"><div><h2>Recently resolved</h2><p>Closed incidents from your workspace</p></div><button class="link-button" data-view="Incident history">Incident history ${icon("arrow", 13)}</button></div><div class="resolved-grid">${resolvedRows}</div></section></div>`;
  }

  function filteredIncidents() {
    const query = state.search.trim().toLowerCase();
    const filtered = [...incidents].filter((item) => {
      const matchesQuery = !query || `${item.title} ${item.description} ${item.service}`.toLowerCase().includes(query);
      const created = new Date(item.created_at).getTime();
      const from = state.dateFrom ? new Date(`${state.dateFrom}T00:00:00`).getTime() : -Infinity;
      const to = state.dateTo ? new Date(`${state.dateTo}T23:59:59.999`).getTime() : Infinity;
      return matchesQuery && created >= from && created <= to && (!state.activeOnly || item.status !== "Resolved") && (state.status === "All" || item.status === state.status) && (state.severity === "All" || item.severity === state.severity) && (state.service === "All" || item.service === state.service);
    });
    if (state.sort === "severity") {
      const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return filtered.sort((a, b) => rank[a.severity] - rank[b.severity] || new Date(b.created_at) - new Date(a.created_at));
    }
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function history() {
    const rows = filteredIncidents().map((item) => `<tr tabindex="0" data-open="${item.id}"><td><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.category)} · ${escapeHtml(item.region)}</small></td><td><code>${escapeHtml(item.service)}</code></td><td>${severityBadge(item.severity)}</td><td>${statusBadge(item.status)}</td><td>${escapeHtml(item.assigned_to)}</td><td class="date-cell">${item.resolved_at ? escapeHtml(resolutionTime(item)) : "—"}</td><td>${escapeHtml(item.root_cause || item.root_causes[0] || "Under investigation")}</td><td>${escapeHtml(item.resolution_notes || "—")}</td><td>${icon("arrow", 14)}</td></tr>`).join("");
    const noRows = filteredIncidents().length === 0 ? `<div class="table-empty">No incidents match these filters.</div>` : "";
    const serviceOptions = [...new Set(incidents.map((item) => item.service))].sort().map((value) => `<option ${state.service === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
    return `<div class="page"><div class="page-heading"><div><div class="eyebrow">OPERATIONS / INCIDENTS</div><h1>Incident history</h1><p>${incidents.length} incidents · filter, sort, and open any report.</p></div><button class="primary" data-action="create">${icon("file", 15)}Create incident</button></div><section class="panel history-panel"><div class="history-tools"><label class="search">${icon("search", 15)}<input id="history-search" aria-label="Search incidents" value="${escapeHtml(state.search)}" placeholder="Search incident title or service..." /><kbd>Ctrl F</kbd></label><label class="filter">${icon("filter", 14)}<select aria-label="Filter by status" id="status-filter"><option value="All">All statuses</option>${["Investigating", "Monitoring", "Resolved"].map((value) => `<option ${state.status === value ? "selected" : ""}>${value}</option>`).join("")}</select>${icon("down", 13)}</label><label class="filter"><select aria-label="Filter by severity" id="severity-filter"><option value="All">All severity</option>${["Critical", "High", "Medium", "Low"].map((value) => `<option ${state.severity === value ? "selected" : ""}>${value}</option>`).join("")}</select>${icon("down", 13)}</label><label class="filter"><select aria-label="Filter by service" id="service-filter"><option value="All">All services</option>${serviceOptions}</select>${icon("down", 13)}</label><label class="filter"><select aria-label="Sort incidents" id="sort-filter"><option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest first</option><option value="severity" ${state.sort === "severity" ? "selected" : ""}>Severity</option></select>${icon("down", 13)}</label></div><div class="table-scroll"><table><thead><tr><th>INCIDENT</th><th>SERVICE</th><th>SEVERITY</th><th>STATUS</th><th>RESPONDER</th><th>RESOLUTION</th><th>ROOT CAUSE</th><th>RESOLUTION NOTES</th><th></th></tr></thead><tbody>${rows}</tbody></table>${noRows}</div><div class="table-foot">Showing <b>${filteredIncidents().length}</b> of <b>${incidents.length}</b> incidents<span>Saved in this browser</span></div></section></div>`;
  }

  function reportsPage() {
    const reports = [...incidents].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    const rows = reports.map((item) => `<article class="panel report-row"><div class="report-row-main"><span class="report-icon">${icon("file", 17)}</span><div><div class="report-meta">INC-${String(item.id).slice(-4).padStart(4, "0")} · ${escapeHtml(item.service)} · ${dateTime(item.updated_at || item.created_at)}</div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.impact || item.description)}</p><div class="report-tags">${severityBadge(item.severity)}${statusBadge(item.status)}<span>${item.timeline.length} timeline events</span></div></div></div><div class="report-row-actions"><button class="secondary-button" data-open="${item.id}">View incident</button><button class="primary" data-report="${item.id}">${icon("file", 13)}Generate report</button></div></article>`).join("");
    return `<div class="page"><div class="page-heading"><div><div class="eyebrow">OPERATIONS / REPORTS</div><h1>Incident reports</h1><p>${reports.length} report${reports.length === 1 ? "" : "s"} ready from current incident records.</p></div><span class="analytics-tag">PRINT / PDF EXPORT</span></div><section class="reports-list">${rows || `<section class="panel reports-empty"><span>${icon("file", 17)}</span><b>No incident reports yet</b><small>Create an incident to generate its report.</small></section>`}</section><p class="reports-note">Reports include impact, timeline, root-cause analysis, recorded actions, resolution, and AI recommendations.</p></div>`;
  }

  function hindsightDraft(item) {
    const resolved = item.status === "Resolved";
    return {
      went_well: resolved
        ? "Responders coordinated ownership and verified recovery against service indicators before closing the incident."
        : "The service signal identified the affected component and a responder was assigned for follow-up.",
      improve: `Review whether monitoring could have surfaced this earlier, especially around ${item.root_cause || item.root_causes[0] || "the triggering condition"}.`,
      follow_up: `Document an owner and due date for prevention work on ${item.service}; review alert thresholds and the relevant runbook.`,
    };
  }

  function buildSummary(item) {
    const timeline = item.timeline.map((event) => `${dateTime(event.time)} — ${event.label} (${event.actor || "Operations"}): ${event.detail}`).join("\n");
    const rootCause = item.root_cause || item.root_causes[0] || "Under investigation";
    const resolution = item.resolution_notes || (item.status === "Resolved" ? "Incident marked resolved by the response team." : "Pending incident resolution.");
    const hindsight = item.hindsight || hindsightDraft(item);
    const actionsTaken = item.timeline.filter((event) => /assigned|acknowledged|note|status|mitigation|resolved/i.test(event.label)).map((event) => `- ${event.label}: ${event.detail}`).join("\n") || "No operator actions recorded yet.";
    const recommendations = item.response_plan.map((step) => `- ${step.title}: ${step.detail}`).join("\n");
    return `SIGNALOPS INCIDENT REPORT\n${item.title}\nIncident INC-${String(item.id).slice(-4).padStart(4, "0")} · ${item.severity} · ${item.status} · ${item.service}\n\nINCIDENT SUMMARY\n${item.description}\n\nBUSINESS / SERVICE IMPACT\n${item.impact}\n\nTIMELINE\n${timeline}\n\nROOT CAUSE ANALYSIS\nPossible causes: ${item.root_causes.join(" ")}\nEvidence: ${item.evidence || "Review service telemetry and recent changes."}\nConfidence: ${item.confidence || "Moderate"}\n\nACTIONS TAKEN\n${actionsTaken}\n\nRESOLUTION\n${resolution}\n\nAI RECOMMENDATIONS\n${recommendations}\n\nHINDSIGHT / LESSONS LEARNED\nWhat went well: ${hindsight.went_well}\nWhat could improve: ${hindsight.improve}\nPreventive follow-up: ${hindsight.follow_up}`;
  }

  function incidentDetail(item) {
    const messages = item.messages || [];
    const chatContents = messages.length ? messages.map((message) => `<div class="message ${message.role}"><span>${message.role === "assistant" ? icon("spark", 11) : "JD"}</span><div><small>${message.role === "assistant" ? "COPILOT" : "YOU"}</small><p>${escapeHtml(message.content)}</p></div></div>`).join("") : `<div class="welcome"><span>${icon("spark", 17)}</span><b>I'm up to speed.</b><p>Ask about impact, likely causes, or what to investigate next.</p><button data-suggest="What are the most likely root causes?">Likely root causes ${icon("arrow", 12)}</button><button data-suggest="What should we investigate next?">What should we check next? ${icon("arrow", 12)}</button></div>`;
    const causes = item.root_causes.map((cause, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(cause)}</li>`).join("");
    const plan = item.response_plan.map((step, index) => `<div class="plan-step"><i>${index < 2 ? icon("check", 12) : step.step}</i><div><b>${escapeHtml(step.title)}</b><p>${escapeHtml(step.detail)}</p></div>${index >= 2 ? `<button data-approve="${step.step}">${icon("shield", 12)}Approve step</button>` : ""}</div>`).join("");
    const timeline = [...item.timeline].reverse().map((entry, index) => `<div class="timeline-event"><i class="${index === 0 ? "latest" : ""}"></i><div><b>${escapeHtml(entry.label)}</b><p>${escapeHtml(entry.detail)}</p><small>${escapeHtml(entry.actor || "Operations")}</small><time>${escapeHtml(dateTime(entry.time))}</time></div></div>`).join("");
    const investigationSteps = item.response_plan.slice(0, 2).map((step) => `<li>${escapeHtml(step.title)}: ${escapeHtml(step.detail)}</li>`).join("");
    const nextActions = item.response_plan.slice(2).map((step) => `<li>${escapeHtml(step.title)}: ${escapeHtml(step.detail)}</li>`).join("");
    const hindsight = item.hindsight || hindsightDraft(item);
    return `<div class="detail"><div class="detail-nav"><button data-action="back">← <span>All incidents</span></button><code>INC-${String(item.id).slice(-4).padStart(4, "0")}</code><small>Updated ${escapeHtml(ago(item.updated_at))}</small></div><div class="detail-grid"><div class="detail-content"><div class="detail-title"><div class="badge-line">${severityBadge(item.severity)}${statusBadge(item.status)}<span>${escapeHtml(item.category)}</span></div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.description)}</p><button class="icon-button" aria-label="More options">${icon("more", 18)}</button></div>
      <section class="panel summary detail-facts"><div><small>Service</small><b>${icon("activity", 13)}${escapeHtml(item.service)}</b></div><div><small>Affected region</small><b>${escapeHtml(item.region)}</b></div><div><small>Assigned responder</small><b>${escapeHtml(item.assigned_to)}</b></div><div><small>Started</small><b>${escapeHtml(dateTime(item.start_time || item.created_at))}</b></div></section>
      <section class="panel impact-panel"><div><span class="impact-mark">${icon("alert", 15)}</span><b>Current impact</b></div><p>${escapeHtml(item.impact)}</p><small>Created ${escapeHtml(dateTime(item.created_at))} · ${escapeHtml(item.service)} · ${escapeHtml(item.region)}</small></section>
      <section class="detail-actions"><button class="secondary-button" data-action="status-modal">${icon("activity", 14)}Update status</button><button class="secondary-button" data-action="assign-modal">${icon("user", 14)}Assign</button>${item.status !== "Resolved" ? `<button class="resolve-button" data-action="resolve">${icon("check", 14)}Resolve incident</button>` : `<button class="secondary-button" data-action="generate-summary">${icon("file", 14)}Generate incident summary</button>`}<button class="secondary-button" data-action="note-modal">${icon("plus", 14)}Add note</button></section>
      <section class="panel ai-brief-detail"><div class="section-title"><span class="spark-icon">${icon("spark", 16)}</span><div><h2>AI incident brief</h2><p>Prototype guidance · mock AI-generated analysis</p></div><small>AI-GENERATED GUIDANCE</small></div><div class="brief-detail-grid"><div><b>Summary</b><p>${escapeHtml(item.description)}</p></div><div><b>Possible impact</b><p>${escapeHtml(item.impact)}</p></div><div><b>Possible root cause</b><p>${escapeHtml(item.root_cause || item.root_causes[0])}</p></div><div><b>Suggested severity</b><p>${severityBadge(item.severity)}</p></div><div class="brief-next"><b>Suggested investigation steps</b><ol>${investigationSteps}</ol></div><div class="brief-next"><b>Recommended next actions</b><ol>${nextActions}</ol></div></div></section>
      <section class="panel analysis"><div class="section-title"><span class="spark-icon">${icon("spark", 16)}</span><div><h2>Recommended response</h2><p>Review each step with the service owner</p></div><small>HUMAN REVIEW</small></div><div class="plan-list">${plan}</div><div class="safety">${icon("shield", 14)}<span><b>Human-controlled response.</b> Approvals record operator intent only. This app never executes commands or changes production systems.</span></div></section>
      <section class="panel hindsight-panel"><div class="section-title"><span class="hindsight-icon">${icon("history", 16)}</span><div><h2>Hindsight &amp; lessons learned</h2><p>${item.hindsight ? "Saved incident review" : "Mock AI draft · review with responders"}</p></div><button class="secondary-button" data-action="hindsight-modal">${icon("file", 13)}${item.hindsight ? "Edit review" : "Add review"}</button></div><div class="hindsight-grid"><article><b>What went well</b><p>${escapeHtml(hindsight.went_well)}</p></article><article><b>What could improve</b><p>${escapeHtml(hindsight.improve)}</p></article><article><b>Preventive follow-up</b><p>${escapeHtml(hindsight.follow_up)}</p></article></div></section>
      <section class="panel timeline"><div class="section-title"><span class="clock-icon">${icon("clock", 15)}</span><div><h2>Incident timeline</h2><p>Activity with timestamp and owner</p></div><button class="link-button" data-action="note-modal">${icon("plus", 13)}Add activity</button></div><div class="timeline-list">${timeline}</div></section></div>
      <aside class="detail-aside"><section class="panel copilot"><div class="copilot-head"><span>${icon("spark", 14)}</span><div><b>Incident copilot</b><small><i></i>Incident-aware local assistant</small></div>${icon("more", 16)}</div><div class="context"><i></i>Using incident context<code>INC-${String(item.id).slice(-4).padStart(4, "0")}</code></div><div class="chat-body">${chatContents}</div><form class="chat-form" id="chat-form"><input aria-label="Ask about this incident" name="message" placeholder="Ask about this incident..." required maxlength="1000" /><button aria-label="Send message">${icon("send", 14)}</button><small>Mock AI answers use saved incident details. Verify before acting.</small></form></section><div class="aside-safety">${icon("shield", 15)}This local assistant cannot run commands or make production changes.</div></aside></div></div>`;
  }

  function createModal() {
    if (!state.modalOpen) return "";
    const localTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const teams = ["Platform SRE", "Payments Platform", "Reliability Engineering", "Identity Platform", "Data Platform"];
    if (state.modalType === "incident") return `<div class="backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div class="modal-head"><div><div class="eyebrow">NEW REPORT</div><h2 id="create-title">Create incident</h2><p>Capture the signal. The local analyst will help with the first read.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="create-form"><label>Incident title<input name="title" required minlength="3" maxlength="180" placeholder="e.g. Elevated latency on API gateway" /></label><label>Description<textarea name="description" required minlength="5" maxlength="6000" rows="3" placeholder="What are you observing? Include impact and when it started."></textarea></label><div class="form-row"><label>Service<input name="service" required minlength="2" maxlength="120" placeholder="e.g. checkout-api" /></label><label>Severity<select name="severity"><option>Critical</option><option>High</option><option selected>Medium</option><option>Low</option></select></label></div><div class="form-row"><label>Status<select name="status"><option selected>Investigating</option><option>Monitoring</option><option>Resolved</option></select></label><label>Affected region<input name="region" required placeholder="e.g. US-East" /></label></div><label>Assigned responder / team<select name="assigned_to">${responders.map((person) => `<option>${escapeHtml(person.name)} · ${escapeHtml(person.team)}</option>`).join("")}</select></label><label>Start time<input name="timestamp" type="datetime-local" value="${localTime}" required /></label><label>Current impact<textarea name="impact" rows="2" placeholder="Who or what is affected?"></textarea></label><label>Logs or relevant signals<textarea name="logs" rows="2" maxlength="12000" placeholder="Paste relevant log lines, metrics, or errors..."></textarea></label><div class="modal-foot"><span>${icon("spark", 14)}Mock AI analysis runs locally</span><button class="primary">${icon("spark", 14)}Create &amp; analyze</button></div></form></section></div>`;
    if (state.modalType === "assign") return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">RESPONSE TEAM</div><h2>Assign incident</h2><p>Select an accountable responder and team.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="assign-form"><label>Assigned responder / team<select name="assigned_to">${responders.map((person) => `<option>${escapeHtml(person.name)} · ${escapeHtml(person.team)}</option>`).join("")}</select></label><label>Assignment note<input name="note" placeholder="Optional handoff context" /></label><div class="modal-foot"><span>Assignment is recorded in the timeline</span><button class="primary">Assign responder</button></div></form></section></div>`;
    if (state.modalType === "note") return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">INCIDENT ACTIVITY</div><h2>Add a note</h2><p>Record an update in the incident timeline.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="note-form"><label>Note<textarea name="note" required minlength="3" maxlength="2000" rows="4" placeholder="Add a useful investigation update..."></textarea></label><div class="modal-foot"><span>Added as ${escapeHtml(state.profile.name)}</span><button class="primary">Add to timeline</button></div></form></section></div>`;
    if (state.modalType === "hindsight") {
      const item = selectedIncident();
      if (!item) return "";
      const draft = item.hindsight || hindsightDraft(item);
      return `<div class="backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">POST-INCIDENT REVIEW</div><h2>Hindsight &amp; lessons learned</h2><p>Review the mock AI draft, edit it, and save team-owned follow-up.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="hindsight-form"><label>What went well<textarea name="went_well" required rows="3" maxlength="2000">${escapeHtml(draft.went_well)}</textarea></label><label>What could improve<textarea name="improve" required rows="3" maxlength="2000">${escapeHtml(draft.improve)}</textarea></label><label>Preventive follow-up<textarea name="follow_up" required rows="3" maxlength="2000">${escapeHtml(draft.follow_up)}</textarea></label><div class="modal-foot"><span>Saved to this incident in this browser</span><button class="primary">Save hindsight</button></div></form></section></div>`;
    }
    if (state.modalType === "status") return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">INCIDENT WORKFLOW</div><h2>Update status</h2><p>Progress incidents through investigation, monitoring, and resolution.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="status-form"><label>New status<select name="status">${["Investigating", "Monitoring", "Resolved"].map((value) => `<option ${selectedIncident()?.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Update note<textarea name="note" rows="3" placeholder="Optional status update"></textarea></label><div class="modal-foot"><span>Status changes are recorded in the timeline</span><button class="primary">Update status</button></div></form></section></div>`;
    if (state.modalType === "profile") return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">USER PROFILE</div><h2>Edit profile</h2><p>Update the display name for this browser workspace.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><form id="profile-form"><label>Display name<input name="name" required maxlength="80" value="${escapeHtml(state.profile.name)}" /></label><div class="modal-foot"><button type="button" class="secondary-button" data-action="sign-out">Sign out</button><span>Saved in this browser</span><button class="primary">Save profile</button></div></form></section></div>`;
    if (state.modalType === "summary") return `<div class="backdrop" data-action="backdrop"><section class="modal summary-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">POST-INCIDENT</div><h2>Incident summary</h2><p>Mock AI-generated closeout draft. Review before sharing.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><textarea id="incident-summary" rows="16" readonly>${escapeHtml(buildSummary(selectedIncident()))}</textarea><div class="modal-foot"><span>Generated from the incident timeline and notes</span><button class="primary" data-action="copy-summary">${icon("file", 14)}Copy summary</button></div></section></div>`;
    if (state.modalType === "report") return `<div class="backdrop" data-action="backdrop"><section class="modal summary-modal report-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">INCIDENT REPORT</div><h2>Incident report</h2><p>Review the incident record before printing or saving as PDF.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><textarea id="incident-summary" rows="20" readonly>${escapeHtml(buildSummary(selectedIncident()))}</textarea><div class="modal-foot"><span>Includes impact, evidence, timeline, actions, resolution, and recommendations</span><button class="secondary-button" data-action="copy-summary">${icon("file", 14)}Copy</button><button class="primary" data-action="print-report">${icon("file", 14)}Print / PDF</button></div></section></div>`;
    if (state.modalType === "global-chat") return `<div class="backdrop" data-action="backdrop"><section class="modal global-chat-modal" role="dialog" aria-modal="true" aria-labelledby="signalops-chat-title"><div class="modal-head"><div><div class="eyebrow">AI INCIDENT RESPONSE AGENT</div><h2 id="signalops-chat-title">Ask SignalOps</h2><p>Answers are grounded in incidents saved in this workspace.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><div class="global-chat-feed">${state.chatMessages.length ? state.chatMessages.map((message) => `<article class="message ${message.role}"><span>${message.role === "assistant" ? icon("spark", 12) : "JD"}</span><div><small>${message.role === "assistant" ? "SIGNALOPS AI" : "YOU"}</small><p>${escapeHtml(message.content)}</p></div></article>`).join("") : `<div class="global-chat-welcome"><b>Workspace incident context is ready.</b><p>Ask what happened, what is most critical, likely causes, or what to do next.</p><div>${["What happened?", "Which incident is most critical?", "What is the probable root cause?", "What should I do next?", "Summarize today's incidents."].map((prompt) => `<button data-global-suggest="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("")}</div></div>`}</div><form id="global-chat-form" class="global-chat-form"><input name="message" maxlength="1000" required placeholder="Ask about incidents across the workspace..." aria-label="Ask SignalOps" /><button class="primary" aria-label="Send question">${icon("send", 14)}Ask</button><small>Prototype guidance from local incident data. Verify before acting.</small></form></section></div>`;
    if (state.modalType === "help") return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><div class="modal-head"><div><div class="eyebrow">SIGNALOPS RESPONSE AGENT</div><h2 id="help-title">Response workspace</h2><p>Review incident context, compare evidence, and use simulated recommendations. SignalOps never executes production changes.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><div class="modal-foot"><span>Answers use the incident data in this browser</span><button class="primary" data-action="global-chat">${icon("spark", 14)}Ask SignalOps</button></div></section></div>`;
    if (state.modalType === "service") {
      const service = services.find((entry) => entry.name === state.selectedService);
      if (!service) return "";
      const related = incidents.filter((item) => item.service.toLowerCase().includes(service.name.split(" ")[0].toLowerCase()) || service.name === "Checkout" && item.service.includes("checkout") || service.name === "Event Pipeline" && item.service.includes("event") || service.name === "Authentication" && item.service.includes("auth"));
      return `<div class="backdrop" data-action="backdrop"><section class="modal compact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">SERVICE HEALTH</div><h2>${escapeHtml(service.name)}</h2><p>${escapeHtml(service.detail)}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button></div><div class="service-detail-grid"><div><small>Status</small><b class="service-status-${service.status.toLowerCase()}">${escapeHtml(service.status)}</b></div><div><small>Availability</small><b>${escapeHtml(service.availability)}</b></div><div><small>Latency</small><b>${escapeHtml(service.latency)}</b></div><div><small>Related incidents</small><b>${related.length}</b></div></div><div class="modal-foot"><span>Health values are sample prototype data</span><button class="primary" data-action="close-modal">Done</button></div></section></div>`;
    }
    return "";
  }

  function selectedIncident() {
    return incidents.find((item) => String(item.id) === String(state.selectedId));
  }

  function assistantContextIncident() {
    return incidents.find((item) => String(item.id) === String(state.assistantIncidentId))
      || selectedIncident()
      || incidents.find((item) => item.status !== "Resolved" && item.severity === "Critical")
      || incidents.find((item) => item.status !== "Resolved")
      || incidents[0];
  }

  function rememberAssistantIncident(incidentId) {
    state.assistantIncidentId = String(incidentId || "");
    try { localStorage.setItem("signalops-assistant-incident", state.assistantIncidentId); } catch { /* Keep context for this page if storage is unavailable. */ }
  }

  function onCallPage() {
    const primary = responders[0];
    const responseQueue = incidents.filter((item) => item.status !== "Resolved").length;
    const roster = responders.map((person, index) => `<article class="panel responder-card"><span class="responder-avatar">${escapeHtml(person.name.split(" ").map((part) => part[0]).join(""))}</span><div class="responder-copy"><b>${escapeHtml(person.name)}</b><small>${escapeHtml(person.role)} · ${escapeHtml(person.team)}</small><span><i></i>${escapeHtml(person.availability)}</span></div><a class="secondary-button" href="mailto:${escapeHtml(person.contact)}">${icon("send", 13)}Contact</a></article>`).join("");
    return `<div class="page">${heading("OPERATIONS / RESPONDERS", "On-call schedule", "Current coverage and responder availability.", `<button class="secondary-button" data-action="profile-modal">${icon("user", 14)}Edit profile</button>`)}<section class="oncall-feature panel"><div class="oncall-ribbon">CURRENT PRIMARY</div><div class="oncall-main"><span class="oncall-avatar">${escapeHtml(primary.name.split(" ").map((part) => part[0]).join(""))}</span><div><h2>${escapeHtml(primary.name)}</h2><p>${escapeHtml(primary.role)} · ${escapeHtml(primary.team)}</p><span class="oncall-available"><i></i>${escapeHtml(primary.availability)}</span></div><div class="oncall-queue"><b>${responseQueue}</b><small>active incidents</small></div></div><div class="oncall-foot"><span>Coverage: 24/7 primary rotation · Next handoff 08:00 UTC</span><a class="primary" href="mailto:${escapeHtml(primary.contact)}">${icon("send", 14)}Contact on-call</a></div></section><div class="section-head responder-section-head"><div><h2>Responder roster</h2><p>Sample teams available for incident response</p></div></div><div class="responder-list">${roster}</div></div>`;
  }

  function policiesPage() {
    const policies = [
      ["Critical", "Immediate response", "Acknowledge immediately. Page the primary responder and start incident coordination.", "policy-critical"],
      ["High", "Within 15 minutes", "Assign a service owner, assess customer impact, and provide an initial update.", "policy-high"],
      ["Medium", "Within 1 hour", "Triage during staffed hours and monitor for changes in severity.", "policy-medium"],
      ["Low", "Monitor", "Record the signal and review in the normal service health cycle.", "policy-low"],
    ];
    return `<div class="page">${heading("OPERATIONS / RESPONSE", "Response policies", "Severity-based response expectations for this workspace.", `<span class="healthy-pill">${icon("shield", 13)}ACTIVE POLICY SET</span>`)}<section class="policy-list">${policies.map(([severity, target, description, cls], index) => `<article class="panel policy-row"><span class="policy-index">0${index + 1}</span><div class="policy-level ${cls}">${severityBadge(severity)}</div><div class="policy-copy"><h2>${severity} severity</h2><p>${description}</p></div><div class="policy-target"><small>RESPONSE TARGET</small><b>${target}</b></div></article>`).join("")}</section><div class="policy-note">${icon("shield", 15)}These are example policies for the local prototype. They guide operators and do not trigger automated production actions.</div></div>`;
  }

  function notificationItems() {
    const critical = incidents.find((item) => item.status !== "Resolved" && item.severity === "Critical");
    const assigned = incidents.find((item) => item.status !== "Resolved" && item.assigned_to?.startsWith(state.profile.name));
    const approval = incidents.find((item) => item.status !== "Resolved" && item.response_plan.length > 2 && !item.timeline.some((entry) => /step \d+ acknowledged/i.test(entry.label)));
    const resolved = incidents.find((item) => item.status === "Resolved");
    const latest = incidents.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return [
      ...(critical ? [{ title: "New critical incident", detail: critical.title, icon: "alert", incident: critical }] : []),
      ...(approval ? [{ title: "Human approval required", detail: `${approval.service} · ${approval.response_plan[2].title}`, icon: "shield", incident: approval }] : []),
      ...(assigned ? [{ title: "Incident assigned to you", detail: `${assigned.service} · ${assigned.severity}`, icon: "user", incident: assigned }] : []),
      { title: "Service health degraded", detail: "Checkout · elevated authorization latency", icon: "activity", incident: incidents.find((item) => item.service.includes("checkout")) },
      ...(latest ? [{ title: "AI analysis completed", detail: latest.title, icon: "spark", incident: latest }] : []),
      ...(resolved ? [{ title: "Incident resolved", detail: resolved.title, icon: "check", incident: resolved }] : []),
    ];
  }

  function notificationsMenu() {
    if (!state.notificationOpen) return "";
    return `<section class="notification-menu"><div class="notification-menu-head"><div><b>Notifications</b><small>Recent workspace activity</small></div><button data-action="close-notifications" aria-label="Close notifications">${icon("close", 15)}</button></div>${notificationItems().map((item) => `<button class="notification-item" ${item.incident ? `data-open="${item.incident.id}"` : ""}><span>${icon(item.icon, 14)}</span><div><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small><time>Recent</time></div></button>`).join("")}</section>`;
  }

  function analysisPage() {
    const item = selectedIncident() || incidents.find((entry) => entry.status !== "Resolved" && entry.severity === "Critical")
      || incidents.find((entry) => entry.status !== "Resolved") || incidents[0];
    if (!item) return `<div class="page">${heading("AI ANALYSIS", "Analysis workspace", "Analysis appears here when an incident is reported.")}${empty("No incident to analyze", "Create an incident or run the guided demo to begin.")}</div>`;
    const causes = item.root_causes.map((cause, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(cause)}</li>`).join("");
    const actions = item.response_plan.map((step) => `<article class="analysis-action-card"><div><span>STEP ${String(step.step).padStart(2, "0")}</span><b>${escapeHtml(step.title)}</b><p>${escapeHtml(step.detail)}</p></div><div class="analysis-action-meta"><span>Risk: human review</span><span>Expected: verified service signal</span><button class="secondary-button" data-open="${item.id}">Review response</button></div></article>`).join("");
    return `<div class="page">${heading("AI ANALYSIS / INC-" + String(item.id).slice(-4).padStart(4, "0"), "Analysis workspace", "Evidence, ranked hypotheses, and reviewable next steps for this incident.", `<button class="secondary-button" data-open="${item.id}">${icon("arrow", 13)}Open incident</button>`)}<section class="analysis-focus panel"><div class="analysis-focus-main"><div class="badge-line">${severityBadge(item.severity)}${statusBadge(item.status)}<span>${escapeHtml(item.category)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary || item.description)}</p></div><div class="analysis-score"><small>CONFIDENCE</small><b>${escapeHtml(item.confidence || "Low")}</b><span>${escapeHtml(item.severity_basis || "Estimated from available signals")}</span></div></section><section class="analysis-card-grid"><article class="panel analysis-feature-card"><div class="analysis-card-title">${icon("spark", 16)}<h2>AI summary</h2></div><p>${escapeHtml(item.summary || item.description)}</p></article><article class="panel analysis-feature-card"><div class="analysis-card-title">${icon("alert", 16)}<h2>Severity &amp; category</h2></div><div class="analysis-classification">${severityBadge(item.severity)}<b>${escapeHtml(item.category)}</b><small>${escapeHtml(item.type)}</small></div><p>${escapeHtml(item.severity_basis || "Severity inferred from incident signals")}</p></article><article class="panel analysis-feature-card"><div class="analysis-card-title">${icon("history", 16)}<h2>Possible root causes</h2></div><ol class="analysis-causes">${causes}</ol></article><article class="panel analysis-feature-card"><div class="analysis-card-title">${icon("file", 16)}<h2>Evidence</h2></div><pre>${escapeHtml(item.evidence || item.logs || "No log evidence supplied.")}</pre></article></section><section class="analysis-actions-section"><div class="section-head"><div><h2>Recommended actions</h2><p>Review with the incident owner before production changes.</p></div><span class="analytics-tag">HUMAN CONTROLLED</span></div><div class="analysis-action-list">${actions}</div></section></div>`;
  }

  function responseCenterPage() {
    const active = incidents.filter((item) => item.status !== "Resolved").sort((a, b) => ["Critical", "High", "Medium", "Low"].indexOf(a.severity) - ["Critical", "High", "Medium", "Low"].indexOf(b.severity));
    const item = active[0] || incidents[0];
    if (!item) return `<div class="page">${heading("RESPONSE CENTER", "Response workflow", "Coordinate incident recovery with operators in control.")}${empty("No response in progress", "Create an incident or start the demo simulation.")}</div>`;
    const labels = ["Detect", "Analyze", "Investigate", "Respond", "Verify", "Resolve"];
    const timelineText = item.timeline.map((event) => event.label.toLowerCase()).join(" ");
    const current = item.status === "Resolved" ? 5 : /mitigation|action recommended|acknowledged/.test(timelineText) ? 3 : /investigation started|ai analysis/.test(timelineText) ? 2 : 0;
    const stages = labels.map((label, index) => `<li class="${index < current || item.status === "Resolved" ? "complete" : index === current ? "current" : "pending"}"><span>${index < current || item.status === "Resolved" ? icon("check", 12) : String(index + 1).padStart(2, "0")}</span><b>${label}</b><small>${index < current || item.status === "Resolved" ? "Complete" : index === current ? "Current stage" : "Next"}</small></li>`).join("");
    const plans = item.response_plan.map((step) => `<article class="response-action-card"><div class="response-action-number">${String(step.step).padStart(2, "0")}</div><div class="response-action-copy"><small>RECOMMENDED ACTION</small><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.detail)}</p><div><span>Reason: ${escapeHtml(item.root_causes[0] || "Confirm impact before mitigation")}</span><span>Risk: review required</span><span>Expected: verified recovery signal</span></div></div><button class="secondary-button" data-open="${item.id}">${icon("shield", 13)}Review &amp; approve</button></article>`).join("");
    return `<div class="page">${heading("OPERATIONS / RESPONSE CENTER", "Response workflow", "A shared, human-controlled path from detection through verified recovery.", `<button class="primary" data-open="${item.id}">Open active incident ${icon("arrow", 13)}</button>`)}<section class="response-focus panel"><div><div class="badge-line">${severityBadge(item.severity)}${statusBadge(item.status)}</div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.service)} · ${escapeHtml(item.region)} · ${escapeHtml(ago(item.created_at))}</p></div><span class="response-owner">${icon("user", 14)}${escapeHtml(item.assigned_to || "Unassigned")}</span></section><section class="response-stage-panel panel"><div class="section-head"><div><h2>Incident lifecycle</h2><p>Current stage is based on recorded incident activity</p></div><span class="healthy-pill"><i></i>${escapeHtml(labels[current])}</span></div><ol class="response-stage-track">${stages}</ol></section><section class="response-actions-section"><div class="section-head"><div><h2>Response options</h2><p>Every recommendation requires operator review.</p></div><span class="analytics-tag">NO AUTOMATED CHANGES</span></div><div class="response-action-list">${plans}</div></section></div>`;
  }

  function assistantPage() {
    const messages = state.chatMessages.length ? state.chatMessages.map((message) => `<article class="message ${message.role}"><span>${message.role === "assistant" ? icon("spark", 12) : "JD"}</span><div><small>${message.role === "assistant" ? "SIGNALOPS AI" : "YOU"}</small><p>${escapeHtml(message.content)}</p></div></article>`).join("") : `<div class="global-chat-welcome"><b>Workspace incident context is ready.</b><p>Ask what happened, which incident needs attention, likely causes, or what to do next.</p><div>${["What happened?", "Which incident is most critical?", "What is the probable root cause?", "What should I check next?", "Give me a response plan", "Summarize this incident."].map((prompt) => `<button data-global-suggest="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("")}</div></div>`;
    return `<div class="page">${heading("AI ASSISTANT", "Incident copilot", "Ask questions grounded in the incidents and evidence saved in this workspace.") }<section class="assistant-workspace panel"><div class="copilot-head"><span>${icon("spark", 14)}</span><div><b>SignalOps assistant</b><small><i></i>Workspace context connected</small></div></div><div class="global-chat-feed">${messages}</div><form id="global-chat-form" class="global-chat-form"><input name="message" maxlength="1000" required placeholder="Ask about incidents, causes, impact, or next steps..." aria-label="Ask SignalOps" /><button class="primary" aria-label="Send question">${icon("send", 14)}Ask</button><small>Recommendations are advisory. Verify before acting.</small></form></section></div>`;
  }

  function settingsPage() {
    return `<div class="page">${heading("WORKSPACE / SETTINGS", "Workspace settings", "Personalize the local response workspace without changing incident records.") }<section class="settings-grid"><article class="panel settings-card"><div class="analysis-card-title">${icon("user", 16)}<h2>Operator profile</h2></div><p>${escapeHtml(state.profile.name)} · Platform engineer</p><button class="secondary-button" data-action="profile-modal">Edit profile</button></article><article class="panel settings-card"><div class="analysis-card-title">${icon("activity", 16)}<h2>Appearance</h2></div><p>Choose a light workspace or a low-glare dark workspace.</p><button class="secondary-button" data-action="theme-toggle">${icon(state.theme === "dark" ? "sun" : "moon", 14)}Switch to ${state.theme === "dark" ? "light" : "dark"} theme</button></article><article class="panel settings-card"><div class="analysis-card-title">${icon("shield", 16)}<h2>Safety boundary</h2></div><p>Response actions are simulated and approvals are recorded for review. This app does not execute production commands.</p></article></section></div>`;
  }

  function analyticsPage() {
    return `<div class="page">${heading("OBSERVABILITY / ANALYTICS", "Incident analytics", "Trends and distributions based on incidents saved in this workspace.", `<button class="secondary-button" data-view="Incident history">Open incident history ${icon("arrow", 13)}</button>`)}${analyticsSection(averageResolution())}<section class="panel analytics-empty-note"><b>Interactive charts</b><span>Select any severity, status, or service row to drill into matching incidents.</span></section></div>`;
  }

  function renderBase() {
    if (!state.authenticated) {
      root.innerHTML = homePage();
      return;
    }
    const active = selectedIncident();
    const activeCount = incidents.filter((item) => item.status !== "Resolved").length;
    const content = active ? incidentDetail(active)
      : state.view === "Incidents" || state.view === "Incident history" || state.view === "Incident History" || state.view === "Active Incidents" ? history()
        : state.view === "Reports" ? reportsPage()
        : state.view === "On-call" ? onCallPage()
          : state.view === "Response policies" ? policiesPage()
            : state.view === "Response Center" ? responseCenterPage()
              : state.view === "AI Analysis" ? analysisPage()
                : state.view === "AI Assistant" ? assistantPage()
                  : state.view === "Analytics" ? analyticsPage()
                    : state.view === "Settings" ? settingsPage()
                      : dashboard();
    const nav = [
      ["Dashboard", "dashboard", null], ["Create Incident", "file", null, "create"], ["Active Incidents", "alert", activeCount],
      ["Incident History", "history", null], ["AI Assistant", "spark", null], ["Response Center", "shield", null],
      ["Analytics", "activity", null], ["Settings", "user", null], ["AI Analysis", "spark", null],
      ["Reports", "file", null], ["On-call", "clock", null], ["Response policies", "shield", null],
    ];
    const navigation = nav.map(([label, symbol, count, action]) => `<button class="nav-item ${state.view === label ? "selected" : ""}" ${action ? `data-action="${action}"` : `data-view="${label}"`} aria-label="${label === "On-call" ? "On-call schedule" : label}" title="${label === "On-call" ? "On-call schedule" : label}">${icon(symbol, 17)}<span>${label === "On-call" ? "On-call schedule" : label}</span>${count !== null ? `<i>${count}</i>` : ""}</button>`).join("");
    const notifications = notificationItems();
    root.innerHTML = `<div class="shell theme-${state.theme} ${state.sidebarCollapsed ? "sidebar-collapsed" : ""}"><aside class="sidebar"><a class="brand" href="#home" data-view="Overview"><span class="brand-icon">${icon("activity", 17)}</span><b>signal<span>ops</span></b></a><button class="sidebar-toggle icon-button" data-action="toggle-sidebar" aria-label="Collapse sidebar" title="Collapse sidebar">${icon("command", 16)}</button><div class="workspace"><span class="workspace-icon">N</span><span><b>Northstar</b><small>Local browser workspace</small></span>${icon("down", 15)}</div><div class="nav-caption">WORKSPACE</div><nav>${navigation}</nav><div class="sidebar-bottom"><div class="ai-online"><i></i>Local analyst ready</div><button class="profile profile-button" data-action="profile-modal"><span>${escapeHtml(state.profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase())}</span><b>${escapeHtml(state.profile.name)}<small>Platform engineer</small></b>${icon("more", 17)}</button></div></aside><main class="main"><header class="topbar"><div class="crumb">Northstar <span>/</span> <b>${active ? "Incident detail" : escapeHtml(state.view)}</b></div><div class="top-right"><span class="all-healthy"><i></i>Saved in this browser</span><span class="divider"></span><div class="notification-wrap"><button class="icon-button notification-button" data-action="notifications" aria-label="Notifications">${icon("bell", 17)}<i>${notifications.length}</i></button>${notificationsMenu()}</div><button class="icon-button" aria-label="Help">${icon("help", 17)}</button></div></header>${state.toast ? `<div class="toast">${icon("check", 14)}${escapeHtml(state.toast)}</div>` : ""}${content}</main>${createModal()}</div>`;
  }

  function showToast(message) {
    state.toast = message;
    render();
    setTimeout(() => { state.toast = ""; render(); }, 2800);
  }

  function addTimeline(item, label, detail, actor = state.profile.name) {
    const time = new Date().toISOString();
    item.timeline.push({ time, label, detail, actor });
    item.updated_at = time;
  }

  function updateStatus(item, nextStatus, note = "") {
    if (!item || item.status === nextStatus) return;
    item.status = nextStatus;
    if (nextStatus === "Resolved") {
      item.resolved_at = new Date().toISOString();
      item.resolution_notes = note || `Incident resolved by ${state.profile.name} after service recovery was verified.`;
      item.root_cause = item.root_cause || item.root_causes[0] || "Cause documented by the response team.";
      addTimeline(item, "Incident resolved", item.resolution_notes, state.profile.name);
    } else {
      item.resolved_at = null;
      addTimeline(item, `Status changed to ${nextStatus}`, note || "Status updated by an operator.", state.profile.name);
    }
  }

  function answerQuestion(question, item) {
    const text = question.toLowerCase();
    if (/summari[sz]e|what happened/.test(text)) return `${item.summary || item.description} Impact: ${item.impact} Severity: ${item.severity} ${item.category}.`;
    if (["cause", "why", "root"].some((word) => text.includes(word))) return `Likely causes to investigate: ${item.root_causes.join(" ")}`;
    if (["plan", "next", "steps", "mitigate", "recommend"].some((word) => text.includes(word))) return `Recommended next steps: ${item.response_plan.map((step) => `${step.step}. ${step.title}: ${step.detail}`).join(" ")}`;
    if (["severity", "impact", "customer", "affected"].some((word) => text.includes(word))) return `This is a ${item.severity} severity ${item.category} incident affecting ${item.service}. Current status: ${item.status}. Confirm customer impact against live service indicators.`;
    return `For ${item.title}, the current status is ${item.status} with ${item.severity} severity. ${item.description} I can help reason about likely causes, impact, or the response plan.`;
  }

  function answerGlobalQuestion(question) {
    const active = incidents.filter((item) => item.status !== "Resolved");
    const critical = active.filter((item) => item.severity === "Critical");
    const context = assistantContextIncident();
    const text = question.toLowerCase();
    if (/most critical|critical incident|highest severity/.test(text)) {
      const item = critical[0] || active.sort((a, b) => ["Critical", "High", "Medium", "Low"].indexOf(a.severity) - ["Critical", "High", "Medium", "Low"].indexOf(b.severity))[0];
      return item ? `${item.title} is the highest-priority active incident (${item.severity}) affecting ${item.service}. Status: ${item.status}. ${item.impact}` : "There are no active incidents right now.";
    }
    if (context && (/what happened|summari[sz]e.*(?:this|the) incident|(?:this|the) incident.*summari[sz]e/.test(text))) {
      return `${context.title} is ${context.status.toLowerCase()} at ${context.service} (${context.severity}). ${context.summary || context.description} Impact: ${context.impact}`;
    }
    if (/summari[sz]e|today|what happened/.test(text)) {
      const recent = incidents.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      return recent.length ? `There are ${active.length} active incidents (${critical.length} critical) and ${incidents.filter((item) => item.status === "Resolved").length} resolved. ${recent.map((item) => `${item.title}: ${item.status}, ${item.severity} on ${item.service}. ${item.impact}`).join(" ")}` : "No incidents have been reported in this workspace yet.";
    }
    if (/severity|impact|why.*critical/.test(text)) {
      const focus = context || critical[0] || active[0] || incidents[0];
      return focus ? `${focus.title} is ${focus.severity} severity (${focus.severity_basis || "estimated from reported signals"}) in ${focus.category}. Reported impact: ${focus.impact}` : "No incident is available to explain yet.";
    }
    if (/cause|why|root/.test(text)) {
      const focus = context || critical[0] || active[0] || incidents[0];
      return focus ? `For ${focus.title}, the leading hypotheses are: ${focus.root_causes.join(" ")} Evidence to review: ${focus.evidence}` : "There are no incident signals to analyze yet.";
    }
    if (/next|recommend|should i|action|plan/.test(text)) {
      const focus = context || critical[0] || active[0];
      return focus ? `Start with ${focus.title}: ${focus.response_plan.map((step) => `${step.title}: ${step.detail}`).join(" ")} These are review-only recommendations; verify with the service owner before any change.` : "No active incident needs a response. Review resolved incidents for follow-up actions.";
    }
    return `SignalOps is tracking ${incidents.length} incidents, with ${active.length} active and ${critical.length} critical. Ask about the most critical incident, likely root cause, recommended next steps, or today's summary.`;
  }

  function updateIncidentStep(form, step) {
    form.dataset.step = String(step);
    form.querySelectorAll(".incident-step-panel").forEach((panel) => { panel.hidden = Number(panel.dataset.incidentStep) !== step; });
    form.querySelectorAll("[data-step-marker]").forEach((marker) => {
      const markerStep = Number(marker.dataset.stepMarker);
      marker.classList.toggle("is-current", markerStep === step);
      marker.classList.toggle("is-complete", markerStep < step);
    });
    const back = form.querySelector(".incident-step-back");
    const next = form.querySelector(".incident-step-next");
    const submit = form.querySelector(".modal-foot button.primary:not(.incident-step-next)");
    if (back) back.hidden = step <= 1;
    if (next) next.hidden = step !== 1;
    if (submit) submit.hidden = step !== 2;
  }

  function enhanceUI() {
    const offlineBanner = root.querySelector(".backend-offline-banner");
    if (state.backendReady === false && !offlineBanner) {
      const banner = document.createElement("div");
      banner.className = "backend-offline-banner";
      banner.setAttribute("role", "status");
      banner.innerHTML = `<span>${icon("alert", 14)}</span><b>Backend service is not running. Start the backend to enable AI features.</b>`;
      const landingNav = root.querySelector(".landing-nav");
      const topbar = root.querySelector(".topbar");
      if (landingNav) landingNav.after(banner);
      else if (topbar) topbar.after(banner);
    } else if (state.backendReady === true) {
      offlineBanner?.remove();
    }
    const landingActions = root.querySelector(".landing-actions");
    if (landingActions) {
      const launch = landingActions.querySelector('[data-action="demo-login"]');
      if (launch) launch.innerHTML = `Open Dashboard ${icon("arrow", 14)}`;
      const title = root.querySelector(".landing-copy h1");
      if (title && !root.querySelector(".landing-tagline")) {
        title.innerHTML = "AI Incident<br><em>Response Agent</em>";
        const tagline = document.createElement("p");
        tagline.className = "landing-tagline";
        tagline.textContent = "Detect. Analyze. Respond. Resolve.";
        title.after(tagline);
      }
      if (!landingActions.querySelector('[data-action="landing-create"]')) {
        const create = document.createElement("button");
        create.className = "secondary-button landing-create";
        create.dataset.action = "landing-create";
        create.innerHTML = `${icon("file", 14)}Create Incident`;
        landingActions.append(create);
      }
    }
    const incidentForm = root.querySelector("#create-form");
    if (incidentForm && !incidentForm.elements.environment) {
      const typeLabel = document.createElement("label");
      typeLabel.textContent = "Incident Type";
      const typeSelect = document.createElement("select");
      typeSelect.name = "type";
      [["Auto-detect", ""], ["Availability", "Availability"], ["Performance", "Performance"], ["Security", "Security"], ["Data integrity", "Data integrity"], ["Deployment", "Deployment"], ["Other", "Other"]].forEach(([label, value], index) => typeSelect.add(new Option(label, value, index === 0, index === 0)));
      typeLabel.append(typeSelect);
      const environmentLabel = document.createElement("label");
      environmentLabel.textContent = "Environment";
      const environment = document.createElement("select");
      environment.name = "environment";
      ["Production", "Staging", "Development"].forEach((value) => environment.add(new Option(value, value)));
      environmentLabel.append(environment);
      const errorLabel = document.createElement("label");
      errorLabel.textContent = "Error messages";
      const errorMessages = document.createElement("textarea");
      errorMessages.name = "error_messages";
      errorMessages.rows = 2;
      errorMessages.maxLength = 6000;
      errorMessages.placeholder = "Paste exception text or user-facing error messages...";
      errorLabel.append(errorMessages);
      const footer = incidentForm.querySelector(".modal-foot");
      incidentForm.insertBefore(typeLabel, footer);
      incidentForm.insertBefore(environmentLabel, footer);
      incidentForm.insertBefore(errorLabel, footer);
      const severity = incidentForm.elements.severity;
      severity.add(new Option("Auto assess", "Auto assess"), 0);
      severity.value = "Auto assess";
      const simulate = document.createElement("button");
      simulate.type = "button";
      simulate.className = "secondary-button simulate-incident-button";
      simulate.dataset.action = "simulate-incident";
      simulate.innerHTML = `${icon("activity", 13)}Simulate incident`;
      footer.insertBefore(simulate, footer.querySelector("button.primary"));
    }
    if (incidentForm && !incidentForm.querySelector(".incident-stepper")) {
      const stepper = document.createElement("ol");
      stepper.className = "incident-stepper";
      stepper.innerHTML = `<li data-step-marker="1"><span>01</span><b>Incident details</b></li><li data-step-marker="2"><span>02</span><b>Logs &amp; evidence</b></li><li data-step-marker="3"><span>03</span><b>AI analysis</b></li><li data-step-marker="4"><span>04</span><b>Response plan</b></li>`;
      const details = document.createElement("div");
      details.className = "incident-step-panel";
      details.dataset.incidentStep = "1";
      details.innerHTML = "<div class=\"incident-step-intro\"><b>Incident details</b><span>Describe the affected service and impact.</span></div><div class=\"incident-step-fields\"></div>";
      const evidence = document.createElement("div");
      evidence.className = "incident-step-panel";
      evidence.dataset.incidentStep = "2";
      evidence.innerHTML = "<div class=\"incident-step-intro\"><b>Logs &amp; evidence</b><span>Add the signals that will ground the first analysis.</span></div><div class=\"incident-step-fields\"></div>";
      incidentForm.insertBefore(stepper, incidentForm.firstChild);
      incidentForm.insertBefore(details, stepper.nextSibling);
      incidentForm.insertBefore(evidence, details.nextSibling);
      const detailNames = new Set(["title", "description", "type", "service", "severity", "status", "region", "assigned_to", "timestamp", "environment"]);
      [...incidentForm.querySelectorAll("label")].forEach((label) => {
        const field = label.querySelector("input, textarea, select");
        if (!field) return;
        const target = detailNames.has(field.name) ? details : evidence;
        target.querySelector(".incident-step-fields").append(label);
      });
      incidentForm.querySelectorAll(".form-row").forEach((row) => { if (!row.querySelector("label")) row.remove(); });
      const dropZone = document.createElement("div");
      dropZone.className = "log-dropzone";
      dropZone.innerHTML = `<span class="log-drop-icon">${icon("file", 17)}</span><b>Drop log files here</b><small>TXT, LOG, JSON, CSV, or OUT · up to 1 MB each</small><small class="log-drop-status">Files are read locally and added to logs.</small><button type="button" class="secondary-button" data-action="choose-log-files">Browse files</button><input id="incident-log-files" type="file" accept=".txt,.log,.json,.csv,.out,text/plain,application/json,text/csv" multiple hidden>`;
      evidence.append(dropZone);
      const analysisState = document.createElement("div");
      analysisState.className = "ai-run-state";
      analysisState.hidden = true;
      analysisState.innerHTML = `<span>${icon("spark", 16)}</span><div><b>Analyzing incident signals</b><small>Correlating reported impact, logs, and service context...</small></div><i></i>`;
      evidence.append(analysisState);
      const footer = incidentForm.querySelector(".modal-foot");
      const back = document.createElement("button");
      back.type = "button";
      back.className = "secondary-button incident-step-back";
      back.dataset.action = "incident-step-back";
      back.textContent = "Back";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "primary incident-step-next";
      next.dataset.action = "incident-step-next";
      next.innerHTML = `Continue ${icon("arrow", 13)}`;
      footer.insertBefore(back, footer.firstChild);
      footer.insertBefore(next, footer.querySelector("[data-action='simulate-incident']"));
      const submit = footer.querySelector("button.primary:not(.incident-step-next)");
      if (submit) submit.innerHTML = `${icon("spark", 13)}Analyze with AI`;
      incidentForm.dataset.step = "1";
      updateIncidentStep(incidentForm, 1);
      if (!dropZone.dataset.bound) {
        dropZone.dataset.bound = "true";
        const appendFiles = async (files) => {
          const usable = [...files].filter((file) => file.size <= 1024 * 1024 && /\.(txt|log|json|csv|out)$/i.test(file.name));
          const rejected = files.length - usable.length;
          const status = dropZone.querySelector(".log-drop-status");
          try {
            const contents = await Promise.all(usable.map((file) => file.text().then((text) => `--- ${file.name} ---\n${text}`)));
            const logs = incidentForm.querySelector('[name="logs"]');
            if (logs && contents.length) logs.value = [logs.value.trim(), ...contents].filter(Boolean).join("\n\n");
            if (status) status.textContent = rejected ? `${contents.length} added · ${rejected} skipped (unsupported type or over 1 MB)` : `${contents.length} log file(s) added to the evidence field.`;
          } catch {
            if (status) status.textContent = "Could not read a selected file. Try a plain-text log file.";
          }
        };
        dropZone.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("is-dragging"); });
        dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
        dropZone.addEventListener("drop", (event) => { event.preventDefault(); dropZone.classList.remove("is-dragging"); appendFiles(event.dataTransfer.files); });
        dropZone.querySelector("input").addEventListener("change", (event) => { appendFiles(event.target.files); event.target.value = ""; });
      }
    }
    const metrics = root.querySelector(".metrics");
    if (metrics && !metrics.querySelector(".response-time-metric")) {
      const metric = document.createElement("article");
      metric.className = "metric response-time-metric";
      metric.innerHTML = `<div>Avg response time<span class="metric-icon green">${icon("clock", 15)}</span></div><strong>${escapeHtml(averageResponseTime())}</strong><small>Report to first responder activity</small>`;
      metrics.append(metric);
    }
    const analytics = root.querySelector(".analytics-section");
    if (analytics && !analytics.querySelector(".trend-panel")) {
      const values = trendValues();
      const maximum = Math.max(1, ...values.map((entry) => entry.count));
      const chart = document.createElement("article");
      chart.className = "panel chart-panel trend-panel";
      chart.innerHTML = `<div class="panel-head"><div><h2>Incident trend</h2><p>New incidents · last 7 days</p></div></div><div class="trend-bars">${values.map((entry) => `<div title="${entry.count} incident${entry.count === 1 ? "" : "s"}"><b>${entry.count}</b><i style="height:${Math.max(entry.count ? 12 : 4, Math.round(entry.count / maximum * 56))}px"></i><small>${escapeHtml(entry.label)}</small></div>`).join("")}</div>`;
      analytics.querySelector(".analytics-grid")?.prepend(chart);
    }
    const counters = root.querySelectorAll(".metrics .metric:not(.response-time-metric) > strong");
    counters.forEach((counter) => {
      const target = Number(counter.textContent.replace(/,/g, ""));
      if (!Number.isFinite(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const started = performance.now();
      const duration = 520;
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - (1 - progress) ** 3;
        counter.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      counter.textContent = "0";
      requestAnimationFrame(tick);
    });
    const overview = root.querySelector(".overview-grid");
    if (overview && !root.querySelector(".activity-feed-panel")) {
      const events = incidents.flatMap((item) => item.timeline.map((event) => ({ ...event, incident: item })))
        .sort((left, right) => new Date(right.time) - new Date(left.time)).slice(0, 5);
      const activity = document.createElement("section");
      activity.className = "panel activity-feed-panel";
      activity.innerHTML = `<div class="panel-head"><div><h2>Response activity</h2><p>Latest changes across this workspace</p></div><span class="healthy-pill"><i></i>Live timeline</span></div><div class="activity-feed">${events.map((event) => `<button class="activity-feed-row" data-open="${event.incident.id}"><span class="activity-feed-dot"></span><span><b>${escapeHtml(event.label)}</b><small>${escapeHtml(event.incident.title)} · ${escapeHtml(event.incident.service)}</small></span><time>${escapeHtml(ago(event.time))}</time></button>`).join("") || empty("No activity yet", "New incident events will appear here.")}</div>`;
      overview.after(activity);
    }
    const briefIncident = incidents.find((entry) => entry.status !== "Resolved" && entry.severity === "Critical")
      || incidents.find((entry) => entry.status !== "Resolved");
    const briefSource = root.querySelector(".brief-title small");
    if (briefSource) briefSource.textContent = briefIncident?.ai_source === "llm" ? "MODEL-ASSISTED ANALYSIS" : "LOCAL SIGNAL ANALYSIS";
    const briefStatus = root.querySelector(".brief>div:last-child>span");
    if (briefStatus) briefStatus.textContent = briefIncident?.ai_source === "llm" ? "Model analysis ready" : "Local analyst ready";
    const assistantSurface = root.querySelector(".assistant-workspace, .global-chat-modal");
    const assistantContext = assistantContextIncident();
    if (assistantSurface && assistantContext && !assistantSurface.querySelector(".assistant-context-strip")) {
      const contextStrip = document.createElement("div");
      contextStrip.className = "assistant-context-strip";
      contextStrip.innerHTML = `<span>${icon("activity", 13)}CURRENT INCIDENT CONTEXT</span><b>${escapeHtml(assistantContext.title)}</b><small>${escapeHtml(assistantContext.service)} · ${escapeHtml(assistantContext.severity)} · ${escapeHtml(assistantContext.status)}</small><button class="secondary-button" data-open="${assistantContext.id}">Open incident</button>`;
      assistantSurface.querySelector(".copilot-head, .modal-head")?.after(contextStrip);
    }
    const topRight = root.querySelector(".top-right");
    const helpButton = topRight?.querySelector('button[aria-label="Help"]');
    if (helpButton) helpButton.dataset.action = "help";
    if (topRight && !topRight.querySelector('[data-action="theme-toggle"]')) {
      const themeButton = document.createElement("button");
      themeButton.className = "icon-button theme-toggle";
      themeButton.dataset.action = "theme-toggle";
      themeButton.setAttribute("aria-label", `Switch to ${state.theme === "dark" ? "light" : "dark"} theme`);
      themeButton.title = `Switch to ${state.theme === "dark" ? "light" : "dark"} theme`;
      themeButton.innerHTML = icon(state.theme === "dark" ? "sun" : "moon", 16);
      topRight.insertBefore(themeButton, helpButton);
    }
    if (topRight && !topRight.querySelector('[data-action="global-chat"]')) {
      const chatButton = document.createElement("button");
      chatButton.className = "secondary-button global-chat-button";
      chatButton.dataset.action = "global-chat";
      chatButton.innerHTML = `${icon("spark", 14)}Ask SignalOps`;
      topRight.insertBefore(chatButton, topRight.firstChild);
      const demoButton = document.createElement("button");
      demoButton.className = `secondary-button demo-toggle${state.demoMode ? " is-active" : ""}`;
      demoButton.dataset.action = "demo-mode";
      demoButton.innerHTML = `${icon("activity", 14)}${state.demoMode ? "Stop demo" : "Demo mode"}`;
      topRight.insertBefore(demoButton, topRight.querySelector(".notification-wrap"));
    }
    const main = root.querySelector(".main");
    if (main && !root.querySelector(".chat-launcher")) {
      const launcher = document.createElement("button");
      launcher.className = "chat-launcher";
      launcher.dataset.action = "global-chat";
      launcher.setAttribute("aria-label", "Ask SignalOps AI incident chatbot");
      launcher.innerHTML = `${icon("spark", 16)}<span>Ask SignalOps</span>`;
      main.append(launcher);
    }
    const historyTools = root.querySelector(".history-tools");
    const historyHeading = root.querySelector(".history-panel")?.closest(".page")?.querySelector(".page-heading");
    if (historyHeading && state.activeOnly) {
      const title = historyHeading.querySelector("h1");
      const copy = historyHeading.querySelector("p");
      if (title) title.textContent = "Active incidents";
      if (copy) copy.textContent = `${filteredIncidents().length} active incidents · filter, sort, and open any report.`;
    }
    if (historyTools && !historyTools.querySelector(".date-filter")) {
      [ ["From", "date-from", state.dateFrom], ["To", "date-to", state.dateTo] ].forEach(([label, id, value]) => {
        const wrapper = document.createElement("label");
        wrapper.className = "filter date-filter";
        wrapper.innerHTML = `<span>${label}</span><input id="${id}" aria-label="Filter incidents from ${label.toLowerCase()} date" type="date" value="${value}">`;
        historyTools.append(wrapper);
      });
      const historyTable = root.querySelector(".history-panel table");
      if (historyTable && !historyTable.querySelector("[data-response-time-column]")) {
        const headers = [...historyTable.querySelectorAll("thead th")];
        const statusIndex = headers.findIndex((header) => header.textContent.trim() === "STATUS");
        if (statusIndex >= 0) {
          const reportedHeader = document.createElement("th");
          reportedHeader.textContent = "REPORTED";
          reportedHeader.dataset.responseTimeColumn = "reported";
          const responseHeader = document.createElement("th");
          responseHeader.textContent = "RESPONSE TIME";
          responseHeader.dataset.responseTimeColumn = "response";
          headers[statusIndex].after(reportedHeader, responseHeader);
          historyTable.querySelectorAll("tbody tr[data-open]").forEach((row) => {
            const item = incidents.find((entry) => String(entry.id) === row.dataset.open);
            if (!item) return;
            const id = `INC-${String(item.id).slice(-4).padStart(4, "0")}`;
            const metadata = row.cells[0].querySelector("small");
            if (metadata) metadata.textContent = `${id} · ${metadata.textContent}`;
            const reported = row.insertCell(statusIndex + 1);
            reported.className = "date-cell";
            reported.textContent = dateTime(item.created_at);
            const response = row.insertCell(statusIndex + 2);
            response.className = "date-cell";
            response.textContent = responseTime(item);
          });
        }
      }
    }
    const reportModal = root.querySelector(".report-modal");
    if (reportModal && !reportModal.querySelector(".report-print-copy")) {
      const reportText = document.createElement("pre");
      reportText.className = "report-print-copy";
      reportText.textContent = reportModal.querySelector("#incident-summary")?.value || "";
      reportModal.append(reportText);
    }
    const detailActions = root.querySelector(".detail-actions");
    const detailOptions = root.querySelector(".detail-title > .icon-button");
    if (detailOptions) {
      detailOptions.dataset.action = "report";
      detailOptions.setAttribute("aria-label", "Generate incident report");
      detailOptions.title = "Generate incident report";
    }
    if (detailActions && !detailActions.querySelector('[data-action="report"]')) {
      const reportButton = document.createElement("button");
      reportButton.className = "secondary-button";
      reportButton.dataset.action = "report";
      reportButton.innerHTML = `${icon("file", 14)}Generate incident report`;
      detailActions.append(reportButton);
    }
    const briefGrid = root.querySelector(".ai-brief-detail .brief-detail-grid");
    const item = selectedIncident();
    if (briefGrid && item) {
      const summary = [...briefGrid.querySelectorAll("div")].find((block) => block.querySelector("b")?.textContent === "Summary");
      if (summary?.querySelector("p")) summary.querySelector("p").textContent = item.summary || item.description;
      const causes = [...briefGrid.querySelectorAll("div")].find((block) => block.querySelector("b")?.textContent === "Possible root cause");
      if (causes) {
        causes.querySelector("b").textContent = "Possible causes";
        causes.querySelector("p").textContent = (item.root_causes || []).join(" ");
      }
      const facts = root.querySelector(".detail-facts");
      if (facts && !facts.querySelector(".environment-fact")) {
        const environmentFact = document.createElement("div");
        environmentFact.className = "environment-fact";
        environmentFact.innerHTML = `<small>Environment</small><b>${escapeHtml(item.environment || "Production")}</b>`;
        facts.append(environmentFact);
      }
      const analysisCopy = root.querySelector(".ai-brief-detail .section-title p");
      if (analysisCopy) analysisCopy.textContent = `Evidence-led analysis · ${item.confidence || "Limited evidence"}`;
      const analysisBadge = root.querySelector(".ai-brief-detail .section-title > small");
      if (analysisBadge) analysisBadge.textContent = item.ai_source === "llm" ? "MODEL-ASSISTED" : "LOCAL SIGNAL RULES";
    }
    if (briefGrid && item && !briefGrid.querySelector(".analysis-evidence")) {
      const fields = [["Evidence", item.evidence || "Review service logs, metrics, and recent changes."], ["Confidence", item.confidence || "Low · limited corroborating evidence"], ["Severity basis", item.severity_basis || "Estimated from reported impact language"], ["Recommended next step", item.response_plan[0]?.detail || "Confirm service impact with the on-call owner."]];
      fields.forEach(([title, value]) => {
        const block = document.createElement("div");
        block.className = "analysis-evidence";
        block.innerHTML = `<b>${title}</b><p></p>`;
        block.querySelector("p").textContent = value;
        briefGrid.append(block);
      });
    }
    const planList = root.querySelector(".detail-content .analysis .plan-list");
    if (planList) {
      const title = root.querySelector(".detail-content .analysis .section-title h2");
      if (title) title.textContent = "AI Recommended Actions";
      planList.querySelectorAll(".plan-step").forEach((step, index) => {
        if (step.querySelector("[data-simulate]")) return;
        const button = document.createElement("button");
        button.className = "simulate-button";
        button.dataset.simulate = String(index + 1);
        button.innerHTML = `${icon("activity", 12)}Simulate action`;
        step.append(button);
      });
      if (!planList.parentElement.querySelector(".recommended-suggestions")) {
        const suggestions = ["Investigate affected service", "Check recent deployment", "Review logs", "Notify on-call engineer", "Consider rollback"];
        const section = document.createElement("div");
        section.className = "recommended-suggestions";
        section.innerHTML = `<h3>Response options</h3><div>${suggestions.map((action) => `<button class="simulate-button" data-simulate-action="${escapeHtml(action)}">${icon("activity", 12)}${escapeHtml(action)} · Simulate</button>`).join("")}</div>`;
        planList.after(section);
      }
    }
    const timelinePanel = root.querySelector(".detail-content .timeline");
    if (timelinePanel && item && !timelinePanel.querySelector(".lifecycle-track")) {
      const eventLabels = item.timeline.map((entry) => entry.label.toLowerCase());
      const completed = [
        eventLabels.some((label) => label.includes("incident detected") || label.includes("incident reported")),
        eventLabels.some((label) => label.includes("investigation started") || label.includes("status changed to monitoring")) || item.status === "Monitoring" || item.status === "Resolved",
        eventLabels.some((label) => label.includes("ai analysis")) || item.root_causes.length > 0,
        eventLabels.some((label) => label.includes("assigned") || label.includes("responder")) || Boolean(item.assigned_to),
        eventLabels.some((label) => label.includes("action recommended") || label.includes("mitigation")) || item.status === "Monitoring" || item.status === "Resolved",
        item.status === "Resolved",
      ];
      const current = item.status === "Resolved" ? -1 : completed.findIndex((step) => !step);
      const stages = ["Incident detected", "Investigation started", "AI analysis", "Engineer assigned", "Action recommended", "Incident resolved"];
      const track = document.createElement("div");
      track.className = "lifecycle-scroll";
      track.innerHTML = `<ol class="lifecycle-track">${stages.map((stage, index) => `<li class="${completed[index] ? "complete" : index === current ? "current" : "pending"}"><span class="lifecycle-marker">${completed[index] ? icon("check", 12) : String(index + 1).padStart(2, "0")}</span><b>${stage}</b><small>${completed[index] ? "Complete" : index === current ? "In progress" : "Pending"}</small></li>`).join("")}</ol>`;
      timelinePanel.querySelector(".timeline-list")?.before(track);
    }
    const menu = root.querySelector(".notification-menu");
    if (menu && !menu.querySelector('[data-action="mark-read"]')) {
      const markRead = document.createElement("button");
      markRead.className = "mark-read-button";
      markRead.dataset.action = "mark-read";
      markRead.textContent = "Mark all as read";
      menu.querySelector(".notification-menu-head")?.append(markRead);
    }
    root.querySelectorAll(".notification-item").forEach((entry) => {
      const title = entry.querySelector("b")?.textContent || "";
      const detail = entry.querySelector("small")?.textContent || "";
      entry.dataset.notificationId = `${title}|${detail}`;
      if (!state.readNotifications.has(entry.dataset.notificationId)) entry.classList.add("unread");
      else entry.classList.remove("unread");
    });
    const badge = root.querySelector(".notification-button i");
    if (badge) badge.textContent = String(notificationItems().filter((entry) => !state.readNotifications.has(`${entry.title}|${entry.detail}`)).length);
    const demoButton = root.querySelector(".demo-toggle");
    if (demoButton) {
      demoButton.classList.toggle("is-active", state.demoMode);
      demoButton.innerHTML = `${icon("activity", 14)}${state.demoMode ? "Stop demo" : "Demo mode"}`;
    }
    const sidebarToggle = root.querySelector(".sidebar-toggle");
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-label", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
      sidebarToggle.title = state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
    }
  }

  function render() {
    renderBase();
    enhanceUI();
  }

  async function runDemo() {
    state.demoMode = true;
    const run = ++state.demoRun;
    const createdAt = new Date().toISOString();
    const report = { title: "Simulated payment authorization surge", description: "A controlled demo signal shows elevated authorization timeouts following a checkout release.", service: "checkout-api", logs: "demo=true auth_timeout_rate=18.2% region=us-east-1 release=2026.09.28.4", severity: "Critical", impact: "Checkout conversion is reduced for a simulated share of US-East sessions. No production systems are connected." };
    const analysis = analyze(report);
    const item = { ...report, id: Date.now(), type: analysis.type, status: "Investigating", region: "US-East", assigned_to: `${state.profile.name} · Payments Platform`, assigned_team: "Payments Platform", impact: report.impact, created_at: createdAt, start_time: createdAt, updated_at: createdAt, resolved_at: null, resolution_notes: "", category: analysis.category, root_causes: analysis.root_causes, root_cause: analysis.root_causes[0], evidence: analysis.evidence, confidence: analysis.confidence, response_plan: analysis.response_plan, messages: [], timeline: [{ time: createdAt, label: "Incident detected", detail: "Demo alert received from checkout-api error-rate monitor.", actor: "SignalOps Monitor" }] };
    incidents.unshift(item);
    state.selectedId = item.id;
    state.view = "Incidents";
    save(); render(); showToast("Demo: new critical incident detected");
    const pause = () => new Promise((resolve) => setTimeout(resolve, 1250));
    await pause(); if (run !== state.demoRun) return;
    addTimeline(item, "Investigation started", "Payments team is comparing authorization latency with the latest release.", "Payments Platform"); save(); render(); showToast("Demo: investigation started");
    await pause(); if (run !== state.demoRun) return;
    addTimeline(item, "AI analysis completed", `Likely cause: ${item.root_cause} Confidence: ${item.confidence}.`, "SignalOps AI"); save(); render(); showToast("Demo: AI analysis completed");
    await pause(); if (run !== state.demoRun) return;
    addTimeline(item, "Engineer assigned", `${item.assigned_to} is coordinating the response.`, "SignalOps Monitor"); save(); render(); showToast("Demo: payments responder assigned");
    await pause(); if (run !== state.demoRun) return;
    addTimeline(item, "Action recommended", "Review the recent deployment and authorization pool saturation. Rollback is a human-reviewed option only.", "SignalOps AI"); save(); render(); showToast("Demo: safe recommendation ready");
    await pause(); if (run !== state.demoRun) return;
    updateStatus(item, "Resolved", "Demo simulation complete: service indicators returned to baseline."); save(); state.demoMode = false; render(); showToast("Demo: incident resolved");
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action], [data-view], [data-open], [data-report], [data-approve], [data-suggest], [data-global-suggest], [data-simulate], [data-simulate-action], [data-service], [data-chart-filter]");
    if (!target) return;
    if (target.dataset.action === "backdrop" && event.target !== target) return;
    if (target.dataset.action === "landing-create") {
      state.authenticated = true;
      state.view = "Dashboard";
      state.modalType = "incident";
      state.modalOpen = true;
      try { localStorage.setItem(SESSION_KEY, "active"); } catch { /* Continue in this tab if storage is unavailable. */ }
      render();
      root.querySelector('#create-form [name="title"]')?.focus();
      return;
    }
    if (target.dataset.action === "theme-toggle") {
      state.theme = state.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("signalops-theme", state.theme); } catch { /* Keep the selected theme for this page. */ }
      render();
      return;
    }
    if (target.dataset.action === "toggle-sidebar") {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try { localStorage.setItem("signalops-sidebar-collapsed", String(state.sidebarCollapsed)); } catch { /* Keep the selected layout for this page. */ }
      render();
      return;
    }
    if (target.dataset.action === "choose-log-files") {
      root.querySelector("#incident-log-files")?.click();
      return;
    }
    if (target.dataset.action === "incident-step-next" || target.dataset.action === "incident-step-back") {
      const form = root.querySelector("#create-form");
      if (!form) return;
      const step = Number(form.dataset.step || 1);
      if (target.dataset.action === "incident-step-next") {
        const invalid = [...form.querySelectorAll('.incident-step-panel[data-incident-step="1"] input, .incident-step-panel[data-incident-step="1"] select, .incident-step-panel[data-incident-step="1"] textarea')].find((field) => !field.checkValidity());
        if (invalid) { invalid.reportValidity(); return; }
        updateIncidentStep(form, 2);
      } else {
        updateIncidentStep(form, Math.max(1, step - 1));
      }
      return;
    }
    if (target.dataset.chartFilter) {
      state.search = "";
      state.status = "All";
      state.severity = "All";
      state.service = "All";
      state.dateFrom = "";
      state.dateTo = "";
      if (target.dataset.chartFilter === "severity") state.severity = target.dataset.chartValue;
      if (target.dataset.chartFilter === "status") state.status = target.dataset.chartValue;
      if (target.dataset.chartFilter === "service") state.service = target.dataset.chartValue;
      state.view = "Incident history";
      state.selectedId = null;
      render();
      return;
    }
    if (target.dataset.view) {
      if (target.dataset.view === "AI Assistant" && state.selectedId) rememberAssistantIncident(state.selectedId);
      if (target.dataset.view === "Active Incidents") { state.activeOnly = true; state.status = "All"; }
      else if (["Dashboard", "Overview", "Incident History", "Incident history", "Incidents"].includes(target.dataset.view)) state.activeOnly = false;
      event.preventDefault(); state.view = target.dataset.view; state.selectedId = null; state.notificationOpen = false; render(); return;
    }
    if (target.dataset.open) {
      if (target.dataset.notificationId) state.readNotifications.add(target.dataset.notificationId);
      rememberAssistantIncident(target.dataset.open);
      state.selectedId = target.dataset.open; state.view = "Incidents"; state.notificationOpen = false; render(); return;
    }
    if (target.dataset.report) {
      if (!incidents.some((item) => String(item.id) === target.dataset.report)) return;
      state.selectedId = target.dataset.report;
      state.reportFromList = state.view === "Reports";
      state.modalType = "report";
      state.modalOpen = true;
      render();
      return;
    }
    if (target.dataset.globalSuggest) {
      const input = root.querySelector('#global-chat-form [name="message"]');
      if (input) { input.value = target.dataset.globalSuggest; input.focus(); }
      return;
    }
    if (target.dataset.simulate) {
      const item = selectedIncident();
      const step = item?.response_plan[Number(target.dataset.simulate) - 1];
      if (!item || !step) return;
      addTimeline(item, "Action simulated", `${step.title}: ${step.detail} Simulation only; no infrastructure action was performed.`, state.profile.name);
      save(); render(); showToast("Action simulated safely · no production change made"); return;
    }
    if (target.dataset.simulateAction) {
      const item = selectedIncident();
      if (!item) return;
      addTimeline(item, "Action simulated", `${target.dataset.simulateAction}. Simulation only; no infrastructure action was performed.`, state.profile.name);
      save(); render(); showToast("Action simulated safely · no production change made"); return;
    }
    if (target.dataset.service) {
      state.selectedService = target.dataset.service; state.modalType = "service"; state.modalOpen = true; render(); return;
    }
    if (target.dataset.suggest) {
      const input = root.querySelector('[name="message"]');
      input.value = target.dataset.suggest; input.focus(); return;
    }
    if (target.dataset.approve) {
      const item = incidents.find((entry) => String(entry.id) === String(state.selectedId));
      if (!item) return;
      addTimeline(item, `Step ${target.dataset.approve} acknowledged by human operator`, "Approval recorded for review only. No action or command was executed.", state.profile.name);
      save(); render(); showToast(`Step ${target.dataset.approve} approval recorded`); return;
    }
    if (target.dataset.action === "notifications") { state.notificationOpen = !state.notificationOpen; render(); return; }
    if (target.dataset.action === "simulate-incident") {
      const form = root.querySelector("#create-form");
      if (!form) return;
      form.elements.title.value = "Critical checkout authorization outage";
      form.elements.description.value = "A complete outage in payment authorization is affecting all users in US-East. The failure began immediately after the latest checkout release.";
      form.elements.service.value = "checkout-api";
      form.elements.severity.value = "Critical";
      form.elements.region.value = "US-East";
      form.elements.environment.value = "Production";
      form.elements.impact.value = "Checkout payments cannot complete for US-East customers; confirm scope against live transaction metrics.";
      form.elements.logs.value = "POST /v2/authorize status=504 upstream=request-timeout release=2026.09.28.4";
      form.elements.error_messages.value = "PaymentGatewayTimeout: upstream authorization did not respond within 3000ms";
      form.elements.timestamp.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      form.requestSubmit();
      return;
    }
    if (target.dataset.action === "close-notifications") { state.notificationOpen = false; render(); return; }
    if (target.dataset.action === "mark-read") { root.querySelectorAll(".notification-item").forEach((entry) => state.readNotifications.add(entry.dataset.notificationId)); state.notificationOpen = false; render(); showToast("Notifications marked as read"); return; }
    if (target.dataset.action === "demo-login") {
      state.authenticated = true;
      state.view = "Dashboard";
      state.selectedId = null;
      state.loginError = "";
      try { localStorage.setItem(SESSION_KEY, "active"); } catch { /* The session remains active for this page. */ }
      render();
      return;
    }
    if (target.dataset.action === "sign-out") {
      state.authenticated = false;
      state.selectedId = null;
      state.modalOpen = false;
      state.demoMode = false;
      state.demoRun += 1;
      try { localStorage.removeItem(SESSION_KEY); } catch { /* The page will still return to sign-in. */ }
      render();
      return;
    }
    if (target.dataset.action === "global-chat") { state.modalType = "global-chat"; state.modalOpen = true; render(); root.querySelector('#global-chat-form [name="message"]')?.focus(); return; }
    if (target.dataset.action === "help") { state.modalType = "help"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "demo-mode") {
      if (state.demoMode) { state.demoMode = false; state.demoRun += 1; render(); showToast("Demo simulation stopped"); }
      else runDemo();
      return;
    }
    if (target.dataset.action === "create") { state.modalType = "incident"; state.modalOpen = true; render(); root.querySelector('[name="title"]').focus(); return; }
    if (target.dataset.action === "status-modal") { state.modalType = "status"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "assign-modal") { state.modalType = "assign"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "note-modal") { state.modalType = "note"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "hindsight-modal") { state.modalType = "hindsight"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "profile-modal") { state.modalType = "profile"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "generate-summary") { state.modalType = "summary"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "report") { state.reportFromList = false; state.modalType = "report"; state.modalOpen = true; render(); return; }
    if (target.dataset.action === "print-report") { window.print(); return; }
    if (target.dataset.action === "resolve") {
      const item = selectedIncident();
      if (!item) return;
      updateStatus(item, "Resolved"); save(); render(); showToast("Incident resolved · summary is ready"); return;
    }
    if (target.dataset.action === "copy-summary") {
      const summary = root.querySelector("#incident-summary");
      if (!summary) return;
      summary.select();
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(summary.value).then(() => showToast("Summary copied")).catch(() => showToast("Select and copy the summary"));
      else { document.execCommand("copy"); showToast("Summary copied"); }
      return;
    }
    if (target.dataset.action === "close-modal" || target.dataset.action === "backdrop") {
      state.modalOpen = false;
      if (state.modalType === "report" && state.reportFromList) { state.selectedId = null; state.reportFromList = false; }
      render(); return;
    }
    if (target.dataset.action === "back") { state.selectedId = null; state.view = "Incidents"; render(); }
  });

  root.addEventListener("input", (event) => {
    if (event.target.id !== "history-search") return;
    state.search = event.target.value;
    const cursor = event.target.selectionStart;
    render();
    const input = root.querySelector("#history-search");
    input.focus(); input.setSelectionRange(cursor, cursor);
  });

  root.addEventListener("change", (event) => {
    if (event.target.id === "status-filter") { state.status = event.target.value; render(); return; }
    if (event.target.id === "severity-filter") { state.severity = event.target.value; render(); return; }
    if (event.target.id === "service-filter") { state.service = event.target.value; render(); return; }
    if (event.target.id === "date-from") { state.dateFrom = event.target.value; render(); return; }
    if (event.target.id === "date-to") { state.dateTo = event.target.value; render(); return; }
    if (event.target.id === "sort-filter") { state.sort = event.target.value; render(); return; }
    if (event.target.id === "response-status") {
      const item = selectedIncident();
      if (!item) return;
      updateStatus(item, event.target.value);
      save(); render(); showToast(`Incident marked ${item.status.toLowerCase()}`);
    }
  });

  root.addEventListener("submit", async (event) => {
    if (event.target.id === "create-form") {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target));
      const createdAt = new Date(values.timestamp).toISOString();
      const submitButton = event.target.querySelector(".modal-foot .primary");
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Analyzing..."; }
      const analysisState = event.target.querySelector(".ai-run-state");
      if (analysisState) analysisState.hidden = false;
      event.target.querySelectorAll("[data-step-marker]").forEach((marker) => {
        const markerStep = Number(marker.dataset.stepMarker);
        marker.classList.toggle("is-current", markerStep === 3);
        marker.classList.toggle("is-complete", markerStep < 3);
      });
      const analysis = await analyzeWithBackend(values);
      const assignedTeam = values.assigned_to.split(" · ")[1] || "Platform SRE";
      const incidentStatus = values.status || "Investigating";
      const item = {
        id: Date.now(), title: values.title.trim(), description: values.description.trim(),
        type: analysis.type, severity: analysis.severity, service: values.service.trim(), logs: values.logs.trim(),
        error_messages: values.error_messages.trim(), environment: values.environment || "Production",
        summary: analysis.summary, severity_basis: analysis.severity_basis, ai_source: analysis.ai_source,
        region: values.region.trim(), assigned_to: values.assigned_to, assigned_team: assignedTeam,
        impact: values.impact.trim() || values.description.trim(), start_time: createdAt,
        created_at: createdAt, updated_at: new Date().toISOString(), status: incidentStatus,
        resolved_at: incidentStatus === "Resolved" ? new Date().toISOString() : null,
        resolution_notes: incidentStatus === "Resolved" ? "Resolved at incident creation; add closeout notes." : "",
        category: analysis.category, root_causes: analysis.root_causes, evidence: analysis.evidence, confidence: analysis.confidence, response_plan: analysis.response_plan,
        root_cause: analysis.root_causes[0], messages: [],
        timeline: [
          { time: createdAt, label: "Incident detected", detail: `Signal received for ${values.service.trim()}.`, actor: "SignalOps Monitor" },
          { time: createdAt, label: "Incident created", detail: values.description.trim(), actor: state.profile.name },
          { time: createdAt, label: "AI analysis completed", detail: `Possible causes and response guidance prepared with ${analysis.confidence.toLowerCase()} confidence.`, actor: "SignalOps AI" },
          { time: createdAt, label: "Responder assigned", detail: `${values.assigned_to} assigned to this incident.`, actor: state.profile.name },
          { time: createdAt, label: incidentStatus === "Investigating" ? "Investigation started" : `Initial status: ${incidentStatus}`, detail: values.impact.trim() || values.description.trim(), actor: assignedTeam },
        ],
      };
      if (incidentStatus === "Resolved") item.timeline.push({ time: item.resolved_at, label: "Incident resolved", detail: item.resolution_notes, actor: assignedTeam });
      incidents.unshift(item); save(); state.modalOpen = false; state.selectedId = item.id; state.view = "Incidents"; render(); showToast(analysis.backend_unavailable ? "Incident created with local analysis; backend unavailable" : "Incident created and analyzed"); return;
    }
    if (event.target.id === "signin-form") {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target));
      if (values.email.trim().toLowerCase() !== DEMO_EMAIL || values.password !== DEMO_PASSWORD) {
        state.loginError = "Those details do not match the demo account. Use the credentials shown here or continue with the demo workspace.";
        render();
        return;
      }
      state.authenticated = true;
      state.loginError = "";
      try { localStorage.setItem(SESSION_KEY, "active"); } catch { /* The session remains active for this page. */ }
      render();
      return;
    }
    if (event.target.id === "assign-form") {
      event.preventDefault();
      const item = selectedIncident();
      if (!item) return;
      const values = Object.fromEntries(new FormData(event.target));
      item.assigned_to = values.assigned_to;
      item.assigned_team = values.assigned_to.split(" · ")[1] || "Platform SRE";
      addTimeline(item, "Responder assigned", `${item.assigned_to}${values.note ? ` · ${values.note}` : ""}`, state.profile.name);
      save(); state.modalOpen = false; render(); showToast("Responder assigned"); return;
    }
    if (event.target.id === "note-form") {
      event.preventDefault();
      const item = selectedIncident();
      if (!item) return;
      addTimeline(item, "Note added", new FormData(event.target).get("note").trim(), state.profile.name);
      save(); state.modalOpen = false; render(); showToast("Note added to incident timeline"); return;
    }
    if (event.target.id === "hindsight-form") {
      event.preventDefault();
      const item = selectedIncident();
      if (!item) return;
      const values = Object.fromEntries(new FormData(event.target));
      item.hindsight = { went_well: values.went_well.trim(), improve: values.improve.trim(), follow_up: values.follow_up.trim() };
      addTimeline(item, "Hindsight review saved", "Lessons learned and preventive follow-up were updated.", state.profile.name);
      save(); state.modalOpen = false; render(); showToast("Hindsight review saved"); return;
    }
    if (event.target.id === "status-form") {
      event.preventDefault();
      const item = selectedIncident();
      if (!item) return;
      const values = Object.fromEntries(new FormData(event.target));
      updateStatus(item, values.status, values.note.trim());
      save(); state.modalOpen = false; render(); showToast(`Incident marked ${item.status.toLowerCase()}`); return;
    }
    if (event.target.id === "profile-form") {
      event.preventDefault();
      state.profile.name = new FormData(event.target).get("name").trim();
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile)); } catch { /* Browser storage may be disabled. */ }
      state.modalOpen = false; render(); showToast("Profile updated"); return;
    }
    if (event.target.id === "chat-form") {
      event.preventDefault();
      const item = incidents.find((entry) => String(entry.id) === String(state.selectedId));
      const input = event.target.elements.message;
      const question = input.value.trim();
      if (!item || !question) return;
      item.messages = item.messages || [];
      const timestamp = new Date().toISOString();
      item.messages.push({ role: "user", content: question, created_at: timestamp });
      item.messages.push({ role: "assistant", content: answerQuestion(question, item), created_at: timestamp });
      save(); render();
    }
    if (event.target.id === "global-chat-form") {
      event.preventDefault();
      const question = new FormData(event.target).get("message").trim();
      if (!question) return;
      state.chatMessages.push({ role: "user", content: question }, { role: "assistant", content: answerGlobalQuestion(question) });
      render(); root.querySelector('#global-chat-form [name="message"]')?.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modalOpen) {
      state.modalOpen = false;
      if (state.modalType === "report" && state.reportFromList) { state.selectedId = null; state.reportFromList = false; }
      render();
    }
  });

  async function checkBackend() {
    if (location.protocol === "file:" || !["localhost", "127.0.0.1"].includes(location.hostname)) return;
    const previous = state.backendReady;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch("/api/health", { signal: controller.signal });
      const health = response.ok ? await response.json() : null;
      state.backendReady = health?.status === "ok";
    } catch {
      state.backendReady = false;
    } finally {
      clearTimeout(timeout);
      if (previous !== state.backendReady) render();
    }
  }

  new MutationObserver(enhanceUI).observe(root, { childList: true });
  render();
  checkBackend();
})();