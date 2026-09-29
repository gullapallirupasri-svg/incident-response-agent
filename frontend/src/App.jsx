import { useEffect, useRef, useState } from 'react'
import { Activity, AlertOctagon, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Command, FilePlus2, Filter, LayoutDashboard, LoaderCircle, MoreHorizontal, Search, Send, ShieldCheck, Sparkles, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const severities = ['Critical', 'High', 'Medium', 'Low']
const statuses = ['Investigating', 'Monitoring', 'Resolved']

async function api(path, options) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'The request could not be completed.')
  }
  return response.json()
}

function ago(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`
}

function dateTime(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function Severity({ value }) { return <span className={`severity severity-${value.toLowerCase()}`}><i />{value}</span> }
function Status({ value }) { return <span className={`status status-${value.toLowerCase()}`}><i />{value}</span> }

export default function App() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, resolved: 0 })
  const [incident, setIncident] = useState(null)
  const [view, setView] = useState('Overview')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [severity, setSeverity] = useState('All')
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  async function refresh() {
    try {
      const [dashboard, incidents] = await Promise.all([api('/dashboard'), api('/incidents')])
      setStats(dashboard)
      setItems(incidents)
      if (incident?.id) setIncident(await api(`/incidents/${incident.id}`))
      setError('')
    } catch (problem) { setError(problem.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (status !== 'All') params.set('status', status)
      if (severity !== 'All') params.set('severity', severity)
      api(`/incidents?${params}`).then(setItems).catch(problem => setError(problem.message))
    }, 180)
    return () => clearTimeout(timer)
  }, [search, status, severity])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function open(item) {
    try { setIncident(await api(`/incidents/${item.id}`)); setView('Incidents') }
    catch (problem) { setError(problem.message) }
  }
  async function create(payload) {
    try {
      const created = await api('/incidents', { method: 'POST', body: JSON.stringify(payload) })
      setCreateOpen(false); setView('Incidents'); setIncident(await api(`/incidents/${created.id}`)); await refresh(); setToast('Incident created and analyzed')
    } catch (problem) { setError(problem.message); throw problem }
  }
  async function changeStatus(next) {
    try { await api(`/incidents/${incident.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); await refresh(); setToast(`Incident marked ${next.toLowerCase()}`) }
    catch (problem) { setError(problem.message) }
  }

  const nav = [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Incidents', icon: AlertOctagon }]
  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#home" onClick={() => { setView('Overview'); setIncident(null) }}><span className="brand-icon"><Activity size={17} /></span><b>signal<span>ops</span></b></a>
      <button className="workspace"><span className="workspace-icon">N</span><span><b>Northstar</b><small>Production workspace</small></span><ChevronDown size={15} /></button>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${view === label ? 'selected' : ''}`} onClick={() => { setView(label); setIncident(null) }}><Icon size={17} /><span>{label}</span>{label === 'Incidents' && <i>{stats.active}</i>}</button>)}</nav>
      <div className="nav-caption operations-caption">OPERATIONS</div>
      <div className="nav-item muted"><Clock3 size={17} /><span>On-call schedule</span></div><div className="nav-item muted"><ShieldCheck size={17} /><span>Response policies</span></div>
      <div className="sidebar-bottom"><div className="ai-online"><i />AI analyst online</div><button className="profile"><span>JD</span><b>Jordan Davis<small>Platform engineer</small></b><MoreHorizontal size={17} /></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Northstar <span>/</span> <b>{incident ? 'Incident detail' : view}</b></div><div className="top-right"><span className="all-healthy"><i />All systems operational</span><span className="divider" /><button className="icon-button" aria-label="Help"><CircleHelp size={17} /></button><button className="icon-button command-icon" aria-label="Command menu"><Command size={16} /></button></div></header>
      {error && <div className="error-banner">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {incident ? <Detail incident={incident} onBack={() => setIncident(null)} onStatus={changeStatus} onRefresh={refresh} onToast={setToast} /> : view === 'Overview' ? <Dashboard stats={stats} items={items} loading={loading} onOpen={open} onCreate={() => setCreateOpen(true)} onViewAll={() => setView('Incidents')} /> : <History items={items} stats={stats} loading={loading} search={search} setSearch={setSearch} status={status} setStatus={setStatus} severity={severity} setSeverity={setSeverity} onOpen={open} onCreate={() => setCreateOpen(true)} />}
    </main>
    {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onSubmit={create} />}
    {toast && <div className="toast"><Check size={14} />{toast}</div>}
  </div>
}

function Heading({ eyebrow, title, copy, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{copy}</p></div>{action}</div>
}

function Dashboard({ stats, items, loading, onOpen, onCreate, onViewAll }) {
  const metrics = [{ label: 'Total incidents', value: stats.total, note: 'Across all time', icon: AlertOctagon, cls: 'ink' }, { label: 'Active now', value: stats.active, note: 'Needs attention', icon: Activity, cls: 'green' }, { label: 'Critical', value: stats.critical, note: 'Immediate response', icon: AlertOctagon, cls: 'red' }, { label: 'Resolved', value: stats.resolved, note: 'Successfully closed', icon: Check, cls: 'leaf' }]
  const active = items.filter(item => item.status !== 'Resolved')
  const resolved = items.filter(item => item.status === 'Resolved')
  return <div className="page">
    <Heading eyebrow="MONDAY, SEPTEMBER 28, 2026" title="Good afternoon, Jordan" copy="Here's what's happening across your services." action={<button className="primary" onClick={onCreate}><FilePlus2 size={15} />Create incident</button>} />
    <section className="metrics">{metrics.map(({ label, value, note, icon: Icon, cls }) => <article className="metric" key={label}><div>{label}<span className={`metric-icon ${cls}`}><Icon size={15} /></span></div><strong>{loading ? '—' : value}</strong><small>{note}</small></article>)}</section>
    <section className="overview-grid"><article className="panel active-panel"><div className="panel-head"><div><h2>Active incidents <span className="count">{stats.active}</span></h2><p>Prioritized by severity and recency</p></div><button className="link-button" onClick={onViewAll}>View all <ArrowUpRight size={13} /></button></div>
      {stats.critical > 0 && <div className="urgent"><AlertOctagon size={17} /><span><b>{stats.critical} critical incident{stats.critical > 1 ? 's' : ''} need attention</b><small>Review current impact and response guidance.</small></span><ArrowUpRight size={14} /></div>}
      {loading ? <div className="empty">Loading incidents…</div> : active.slice(0, 5).map(item => <IncidentRow key={item.id} item={item} onClick={() => onOpen(item)} />)}
      {!loading && !active.length && <Empty title="No active incidents" copy="New reports will appear here." />}
    </article><aside className="right-column"><article className="panel health-panel"><div className="panel-head"><div><h2>Service health</h2><p>Production environment</p></div><span className="healthy-pill"><i />Healthy</span></div><div className="uptime"><b>99.94<span>%</span></b><small>Availability · last 24 hours</small></div><div className="bars">{Array.from({ length: 32 }, (_, i) => <i className={i === 24 || i === 25 ? 'warn-bar' : ''} key={i} />)}</div><div className="bar-caption"><span>24 hours ago</span><span>Now</span></div><div className="service-lines"><ServiceLine name="API gateway" state="Operational" /><ServiceLine name="Checkout" state={stats.critical ? 'Degraded' : 'Operational'} warning={!!stats.critical} /><ServiceLine name="Event pipeline" state="Operational" /></div></article>
      <article className="brief"><div className="brief-title"><Sparkles size={15} />AI INCIDENT BRIEF <small>UPDATED JUST NOW</small></div><p>{stats.critical ? `There ${stats.critical === 1 ? 'is' : 'are'} ${stats.critical} critical incident${stats.critical === 1 ? '' : 's'} currently active. Validate customer impact and recent changes before selecting a mitigation.` : 'No critical incidents are active. Monitored services are operating within their current health thresholds.'}</p><div><span><i />Analyst ready</span><button onClick={() => items[0] && onOpen(items[0])}>Ask about an incident <ArrowUpRight size={12} /></button></div></article></aside></section>
    <section className="recent"><div className="section-head"><div><h2>Recently resolved</h2><p>Closed incidents from your workspace</p></div><button className="link-button" onClick={onViewAll}>Incident history <ArrowUpRight size={13} /></button></div><div className="resolved-grid">{resolved.slice(0, 4).map(item => <button className="resolved-item" key={item.id} onClick={() => onOpen(item)}><span><Check size={13} /></span><b>{item.title}<small>{item.service} · {ago(item.created_at)}</small></b><Severity value={item.severity} /></button>)}{!resolved.length && <Empty title="Nothing resolved yet" copy="Resolved incidents will show here." />}</div></section>
  </div>
}

function ServiceLine({ name, state, warning }) { return <div className="service-line"><span><i className={warning ? 'warn-dot' : ''} />{name}</span><small className={warning ? 'warning-text' : ''}>{state}</small></div> }
function IncidentRow({ item, onClick }) { return <button className="incident-row" onClick={onClick}><span className={`row-icon ${item.severity.toLowerCase()}`}><AlertOctagon size={16} /></span><span className="row-copy"><b>{item.title}</b><small><strong>{item.service}</strong><i />{item.category}</small></span><span className="row-tags"><Severity value={item.severity} /><Status value={item.status} /></span><time>{ago(item.created_at)}<ArrowUpRight size={13} /></time></button> }
function Empty({ title, copy }) { return <div className="empty"><span><Check size={16} /></span><b>{title}</b><small>{copy}</small></div> }

function History({ items, stats, loading, search, setSearch, status, setStatus, severity, setSeverity, onOpen, onCreate }) {
  return <div className="page"><Heading eyebrow="OPERATIONS / INCIDENTS" title="Incident history" copy={`${stats.total} total incidents across your services.`} action={<button className="primary" onClick={onCreate}><FilePlus2 size={15} />Create incident</button>} /><section className="panel history-panel"><div className="history-tools"><label className="search"><Search size={15} /><input aria-label="Search incidents" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search incidents, services..." /><kbd>⌘ K</kbd></label><label className="filter"><Filter size={14} /><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="All">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={13} /></label><label className="filter"><select aria-label="Filter by severity" value={severity} onChange={event => setSeverity(event.target.value)}><option value="All">All severity</option>{severities.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={13} /></label></div><div className="table-scroll"><table><thead><tr><th>INCIDENT</th><th>SERVICE</th><th>SEVERITY</th><th>STATUS</th><th>REPORTED</th><th /></tr></thead><tbody>{!loading && items.map(item => <tr key={item.id} onClick={() => onOpen(item)} tabIndex="0" onKeyDown={event => event.key === 'Enter' && onOpen(item)}><td><b>{item.title}</b><small>{item.category}</small></td><td><code>{item.service}</code></td><td><Severity value={item.severity} /></td><td><Status value={item.status} /></td><td className="date-cell">{dateTime(item.created_at)}</td><td><ArrowUpRight size={14} /></td></tr>)}</tbody></table>{(loading || !items.length) && <div className="table-empty">{loading ? 'Loading incidents…' : 'No incidents match these filters.'}</div>}</div><div className="table-foot">Showing <b>{items.length}</b> of <b>{stats.total}</b> incidents<span>Updated just now</span></div></section></div>
}

function Detail({ incident, onBack, onStatus, onRefresh, onToast }) {
  const [messages, setMessages] = useState(incident.messages || [])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [approval, setApproval] = useState(null)
  const chatEnd = useRef(null)
  useEffect(() => { setMessages(incident.messages || []) }, [incident.id, incident.messages])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  async function send(event) {
    event.preventDefault()
    if (!question.trim() || sending) return
    const text = question.trim(); setQuestion(''); setSending(true)
    setMessages(current => [...current, { id: Date.now(), role: 'user', content: text }])
    try { const result = await api(`/incidents/${incident.id}/chat`, { method: 'POST', body: JSON.stringify({ message: text }) }); setMessages(current => [...current, ...result.messages.filter(message => message.role === 'assistant')]) }
    catch (problem) { onToast(problem.message) }
    finally { setSending(false) }
  }
  async function approve(step) {
    setApproval(step)
    try { await api(`/incidents/${incident.id}/approve`, { method: 'POST', body: JSON.stringify({ step }) }); await onRefresh(); onToast(`Step ${step} approval recorded`) }
    catch (problem) { onToast(problem.message) }
    finally { setApproval(null) }
  }
  return <div className="detail"><div className="detail-nav"><button onClick={onBack}>← <span>All incidents</span></button><code>INC-{String(incident.id).padStart(4, '0')}</code><small>Updated {ago(incident.updated_at)}</small></div><div className="detail-grid"><div className="detail-content"><div className="detail-title"><div className="badge-line"><Severity value={incident.severity} /><Status value={incident.status} /><span>{incident.category}</span></div><h1>{incident.title}</h1><p>{incident.description}</p><button className="icon-button" aria-label="More options"><MoreHorizontal size={18} /></button></div>
    <section className="panel summary"><div><small>Service</small><b><Activity size={13} />{incident.service}</b></div><div><small>Type</small><b>{incident.type}</b></div><div><small>Reported</small><b>{dateTime(incident.created_at)}</b></div><label><small>Response status</small><select aria-label="Response status" value={incident.status} onChange={event => onStatus(event.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={12} /></label></section>
    <section className="panel analysis"><div className="section-title"><span className="spark-icon"><Sparkles size={16} /></span><div><h2>AI incident analysis</h2><p>Generated from report, logs, and service context</p></div><small>AI ANALYSIS</small></div><div className="analysis-block"><h3>What may be happening</h3><ul>{incident.root_causes.map((cause, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span>{cause}</li>)}</ul></div><div className="analysis-block plan-block"><div className="plan-head"><div><h3>Recommended response</h3><p>Review each step with the service owner</p></div><span><ShieldCheck size={13} />Human approval required for changes</span></div><div className="plan-list">{incident.response_plan.map((step, index) => <div className="plan-step" key={step.step}><i>{index < 2 ? <Check size={12} /> : step.step}</i><div><b>{step.title}</b><p>{step.detail}</p></div>{index >= 2 && <button disabled={approval === step.step} onClick={() => approve(step.step)}><ShieldCheck size={12} />{approval === step.step ? 'Recording' : 'Approve step'}</button>}</div>)}</div><div className="safety"><ShieldCheck size={14} /><span><b>Human-controlled response.</b> Approval records operator intent only. This agent never executes commands or makes production changes.</span></div></div></section>
    <section className="panel timeline"><div className="section-title"><span className="clock-icon"><Clock3 size={15} /></span><div><h2>Incident timeline</h2><p>Operator and system activity</p></div></div><div className="timeline-list">{[...incident.timeline].reverse().map((event, index) => <div className="timeline-event" key={`${event.time}-${index}`}><i className={index === 0 ? 'latest' : ''} /><div><b>{event.label}</b><p>{event.detail}</p><time>{dateTime(event.time)}</time></div></div>)}</div></section></div>
    <aside className="detail-aside"><section className="panel copilot"><div className="copilot-head"><span><Sparkles size={14} /></span><div><b>Incident copilot</b><small><i />Context-aware assistant</small></div><MoreHorizontal size={16} /></div><div className="context"><i />Using incident context<code>INC-{String(incident.id).padStart(4, '0')}</code></div><div className="chat-body">{!messages.length && <div className="welcome"><span><Sparkles size={17} /></span><b>I'm up to speed.</b><p>Ask about impact, likely causes, or what to investigate next.</p><button onClick={() => setQuestion('What are the most likely root causes?')}>Likely root causes <ArrowUpRight size={12} /></button><button onClick={() => setQuestion('What should we investigate next?')}>What should we check next? <ArrowUpRight size={12} /></button></div>}{messages.map((message, index) => <div className={`message ${message.role}`} key={message.id || index}><span>{message.role === 'assistant' ? <Sparkles size={11} /> : 'JD'}</span><div><small>{message.role === 'assistant' ? 'COPILOT' : 'YOU'}</small><p>{message.content}</p></div></div>)}{sending && <div className="thinking"><LoaderCircle size={14} />Thinking through the incident…</div>}<div ref={chatEnd} /></div><form className="chat-form" onSubmit={send}><input aria-label="Ask about this incident" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about this incident..." /><button disabled={!question.trim() || sending} aria-label="Send message"><Send size={14} /></button><small>AI can make mistakes. Verify before acting.</small></form></section><div className="aside-safety"><ShieldCheck size={15} />Production actions are never run automatically. Keep a human in the loop.</div></aside></div></div>
}

function CreateModal({ onClose, onSubmit }) {
  const [busy, setBusy] = useState(false)
  const dialog = useRef(null)
  const currentLocalTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  useEffect(() => { dialog.current?.focus(); const key = event => event.key === 'Escape' && onClose(); window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key) }, [onClose])
  async function submit(event) {
    event.preventDefault(); setBusy(true)
    const data = new FormData(event.currentTarget)
    try { await onSubmit({ title: data.get('title'), description: data.get('description'), type: data.get('type'), severity: data.get('severity'), service: data.get('service'), logs: data.get('logs'), timestamp: new Date(data.get('timestamp')).toISOString() }) }
    catch { /* The app-level banner reports the API error. */ }
    finally { setBusy(false) }
  }
  return <div className="backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title" tabIndex="-1" ref={dialog}>
      <div className="modal-head"><div><div className="eyebrow">NEW REPORT</div><h2 id="create-title">Create incident</h2><p>Capture the signal. The AI analyst will help with the first read.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <form onSubmit={submit}>
        <label>Incident title<input name="title" minLength="3" maxLength="180" required placeholder="e.g. Elevated latency on API gateway" /></label>
        <label>Description<textarea name="description" rows="3" minLength="5" maxLength="6000" required placeholder="What are you observing? Include impact and when it started." /></label>
        <div className="form-row"><label>Type<select name="type"><option>Availability</option><option>Performance</option><option>Security</option><option>Data integrity</option><option>Deployment</option><option>Other</option></select></label><label>Severity<select name="severity" defaultValue="Medium"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label></div>
        <label>Affected service<input name="service" minLength="2" maxLength="120" required placeholder="e.g. checkout-api" /></label>
        <label>Reported at<input name="timestamp" type="datetime-local" required defaultValue={currentLocalTime} /></label>
        <label>Logs or relevant signals<textarea name="logs" rows="3" maxLength="12000" placeholder="Paste relevant log lines, metrics, or errors..." /></label>
        <div className="modal-foot"><span><Sparkles size={14} />AI analysis runs on submission</span><button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />}{busy ? 'Analyzing…' : 'Create & analyze'}</button></div>
      </form>
    </section>
  </div>
}