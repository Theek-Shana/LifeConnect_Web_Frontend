// ============================================================
// DOCTOR EXTENSIONS
//   1. ProgressNotesModal  — timeline chart + add/view notes
//   2. PrescriptionModal   — generate & download prescription
//   3. PatientCardActions  — active/inactive toggle
// ============================================================

import { useState, useEffect, useRef } from "react";

const API_BASE_URL = "http://localhost:5003/api";
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG  (y-axis: 4=best, 1=worst)
// ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  improving: { level: 4, color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", label: "Improving", icon: "📈" },
  stable:    { level: 3, color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD", label: "Stable",    icon: "➡️"  },
  worsening: { level: 2, color: "#EA580C", bg: "#FFEDD5", border: "#FDBA74", label: "Worsening", icon: "📉" },
  critical:  { level: 1, color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", label: "Critical",  icon: "⚠️"  },
};

// ─────────────────────────────────────────────────────────────
// CONDITION TIMELINE CHART
// Notes arrive newest-first from API → reversed for chronology
// Pure SVG, no external lib, no new API calls
// ─────────────────────────────────────────────────────────────
function ConditionTimelineChart({ notes }) {
  const [hovered, setHovered] = useState(null);

  // Reverse to chronological order (oldest → newest, left → right)
  const ordered = [...notes].reverse();
  const n = ordered.length;
  if (n === 0) return null;

  // SVG viewport — wider left pad so labels never clash with chart
  const VW = 700, VH = 220;
  const PAD = { top: 24, right: 32, bottom: 42, left: 110 };
  const CW = VW - PAD.left - PAD.right;
  const CH = VH - PAD.top - PAD.bottom;

  // Y-axis rows (top=improving, bottom=critical)
  const yRows = [
    { key: "improving", level: 4 },
    { key: "stable",    level: 3 },
    { key: "worsening", level: 2 },
    { key: "critical",  level: 1 },
  ];

  // Map note → pixel coords
  const pts = ordered.map((note, i) => {
    const cfg = STATUS_CFG[note.status] || STATUS_CFG.stable;
    const x = PAD.left + (n === 1 ? CW / 2 : (i / (n - 1)) * CW);
    const y = PAD.top  + ((4 - cfg.level) / 3) * CH;
    return { x, y, cfg, note, idx: i };
  });

  // Smooth cubic bezier path
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return acc + ` C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, "");

  // Filled area under the curve
  const areaPath = n > 1
    ? linePath + ` L ${pts[n-1].x} ${PAD.top + CH} L ${pts[0].x} ${PAD.top + CH} Z`
    : "";

  const fmtShort = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  const fmtLong = iso =>
    new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  const latestCfg = STATUS_CFG[ordered[n-1]?.status] || STATUS_CFG.stable;

  return (
    <div style={tcS.card}>
      {/* ── Header ── */}
      <div style={tcS.headerRow}>
        <div>
          <div style={tcS.cardTitle}>📊 Condition Timeline</div>
          <div style={tcS.cardSub}>{n} note{n !== 1 ? "s" : ""} · oldest → newest</div>
        </div>
        <div style={{ ...tcS.currentPill, background: latestCfg.bg, color: latestCfg.color, border: `1.5px solid ${latestCfg.border}` }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: latestCfg.color, flexShrink: 0, display: "inline-block" }} />
          Current: {latestCfg.icon} {latestCfg.label}
        </div>
      </div>

      {/* ── SVG ── */}
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ display: "block", minWidth: Math.max(n * 72, 300) }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tcAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
            <filter id="tcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Y-axis grid + labels (pill style, no overlap) ── */}
          {yRows.map(({ key, level }) => {
            const cfg = STATUS_CFG[key];
            const y = PAD.top + ((4 - level) / 3) * CH;
            const pillW = 100, pillH = 22, pillX = 4, pillY = y - pillH / 2;
            return (
              <g key={key}>
                {/* dashed grid line — from chart left edge to right */}
                <line
                  x1={PAD.left - 6} y1={y}
                  x2={VW - PAD.right} y2={y}
                  stroke="#E2EBFF" strokeWidth="1.2" strokeDasharray="5 4"
                />
                {/* pill background */}
                <rect
                  x={pillX} y={pillY}
                  width={pillW} height={pillH}
                  rx="11"
                  fill={cfg.bg}
                  stroke={cfg.border}
                  strokeWidth="1.2"
                />
                {/* icon inside pill */}
                <text
                  x={pillX + 10} y={y + 5}
                  fontSize="11" textAnchor="start"
                  fontFamily="DM Sans, sans-serif">
                  {cfg.icon}
                </text>
                {/* label inside pill */}
                <text
                  x={pillX + 28} y={y + 5}
                  fontSize="9.5" fontWeight="800"
                  fill={cfg.color} textAnchor="start"
                  fontFamily="DM Sans, sans-serif">
                  {cfg.label}
                </text>
              </g>
            );
          })}

          {/* ── Area fill ── */}
          {n > 1 && <path d={areaPath} fill="url(#tcAreaGrad)" />}

          {/* ── Line ── */}
          {n > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#tcGlow)"
            />
          )}

          {/* ── X-axis date labels ── */}
          {pts.map((p, i) => (
            <text key={i} x={p.x} y={VH - 6}
              textAnchor="middle" fontSize="9" fill="#93B0E8"
              fontWeight="600" fontFamily="DM Sans, sans-serif">
              {fmtShort(p.note.createdAt)}
            </text>
          ))}

          {/* ── Data points + tooltips ── */}
          {pts.map((p) => {
            const isHov = hovered === p.idx;
            const tipW = 168, tipH = 62;
            // flip tooltip left if too close to right edge
            const tipX = p.x + 18 + tipW > VW ? p.x - tipW - 14 : p.x + 14;
            const tipY = Math.max(PAD.top - 6, Math.min(p.y - tipH / 2, VH - PAD.bottom - tipH));
            return (
              <g key={p.idx}
                onMouseEnter={() => setHovered(p.idx)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}>
                {/* pulse ring on hover */}
                {isHov && <circle cx={p.x} cy={p.y} r={18} fill={p.cfg.color} opacity="0.10" />}
                {/* white halo */}
                <circle cx={p.x} cy={p.y} r={isHov ? 12 : 9}
                  fill="white" stroke={p.cfg.border} strokeWidth="2" />
                {/* colored fill */}
                <circle cx={p.x} cy={p.y} r={isHov ? 8 : 6}
                  fill={p.cfg.color} stroke="white" strokeWidth="2" />
                {/* note index */}
                <text x={p.x} y={p.y + 4}
                  textAnchor="middle" fontSize="8" fontWeight="900"
                  fill="white" fontFamily="DM Sans, sans-serif">
                  {p.idx + 1}
                </text>

                {/* Tooltip */}
                {isHov && (
                  <g>
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="9"
                      fill="white" stroke={p.cfg.border} strokeWidth="1.5"
                      style={{ filter: "drop-shadow(0 6px 16px rgba(37,99,235,0.18))" }} />
                    {/* colored left stripe */}
                    <rect x={tipX} y={tipY} width={4} height={tipH} rx="9"
                      fill={p.cfg.color} />
                    <rect x={tipX} y={tipY + 6} width={4} height={tipH - 12}
                      fill={p.cfg.color} />
                    <text x={tipX + 12} y={tipY + 20}
                      fontSize="12" fontWeight="800" fill={p.cfg.color}
                      fontFamily="DM Sans, sans-serif">
                      {p.cfg.icon} {p.cfg.label}
                    </text>
                    <text x={tipX + 12} y={tipY + 35}
                      fontSize="9.5" fill="#6B9FD4" fontFamily="DM Sans, sans-serif">
                      {fmtLong(p.note.createdAt)}
                    </text>
                    <text x={tipX + 12} y={tipY + 50}
                      fontSize="9.5" fill="#374151" fontFamily="DM Sans, sans-serif">
                      {(p.note.title || "Progress Note").slice(0, 24)}
                      {(p.note.title || "Progress Note").length > 24 ? "…" : ""}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Legend row ── */}
      <div style={tcS.legendRow}>
        {Object.values(STATUS_CFG).map(cfg => (
          <div key={cfg.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#B0C8E8", fontWeight: 500 }}>
          Hover dots for details
        </span>
      </div>
    </div>
  );
}

const tcS = {
  card: {
    background: "linear-gradient(140deg, #F4F8FF 0%, #EBF3FF 100%)",
    border: "1.5px solid #DBEAFE",
    borderRadius: 16,
    padding: "18px 20px 14px",
    marginBottom: 22,
    boxShadow: "0 4px 20px rgba(37,99,235,0.09)",
  },
  headerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 14, flexWrap: "wrap", gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: 800, color: "#1E3A8A", marginBottom: 2 },
  cardSub:   { fontSize: 11, color: "#6B9FD4", fontWeight: 600 },
  currentPill: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  legendRow: {
    display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap",
    paddingTop: 12, borderTop: "1px solid #DBEAFE", marginTop: 6,
  },
};

// ─────────────────────────────────────────────────────────────
// PROGRESS NOTES MODAL
// ─────────────────────────────────────────────────────────────
export function ProgressNotesModal({ patient, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ title: "", content: "", status: "stable" });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/progress-notes/${patient._id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setNotes(data.notes || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newNote.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/progress-notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ patientId: patient._id, ...newNote }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(prev => [data.note, ...prev]);
        setNewNote({ title: "", content: "", status: "stable" });
        setShowForm(false);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const statusColors = {
    improving: { bg: "#D1FAE5", color: "#059669", label: "📈 Improving" },
    stable:    { bg: "#DBEAFE", color: "#2563EB", label: "➡️ Stable" },
    worsening: { bg: "#FFEDD5", color: "#EA580C", label: "📉 Worsening" },
    critical:  { bg: "#FEE2E2", color: "#DC2626", label: "⚠️ Critical" },
  };

  const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return (
    <div style={pnS.overlay} onClick={onClose}>
      <div style={pnS.modal} onClick={e => e.stopPropagation()}>

        {/* ── Modal header ── */}
        <div style={pnS.header}>
          <div>
            <h2 style={pnS.title}>📋 Progress Notes</h2>
            <p style={pnS.sub}>{patient.name} · {patient.condition || "No condition"}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={pnS.addBtn} onClick={() => setShowForm(v => !v)}>
              {showForm ? "✕ Cancel" : "+ Add Note"}
            </button>
            <button style={pnS.closeBtn} onClick={onClose}>×</button>
          </div>
        </div>

        {/* ── Add note form ── */}
        {showForm && (
          <div style={pnS.form}>
            <input
              style={pnS.input}
              placeholder="Note title (e.g. Week 3 check-in)"
              value={newNote.title}
              onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))}
            />
            <textarea
              style={{ ...pnS.input, minHeight: 100, resize: "vertical" }}
              placeholder="Describe the patient's current condition..."
              value={newNote.content}
              onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={pnS.label}>Status:</label>
              {Object.entries(statusColors).map(([key, val]) => (
                <button key={key} style={{
                  ...pnS.statusPill,
                  background: val.bg,
                  color: val.color,
                  border: newNote.status === key ? `2px solid ${val.color}` : "2px solid transparent",
                  fontWeight: newNote.status === key ? 900 : 600,
                }} onClick={() => setNewNote(p => ({ ...p, status: key }))}>
                  {val.label}
                </button>
              ))}
            </div>
            <button style={pnS.saveBtn} onClick={handleSave} disabled={saving || !newNote.content.trim()}>
              {saving ? "Saving..." : "💾 Save Note"}
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div style={pnS.body}>
          {loading ? (
            <div style={pnS.center}>
              <div style={pnS.spinner} />
              <p style={pnS.dim}>Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div style={pnS.center}>
              <div style={{ fontSize: 52 }}>📋</div>
              <h3 style={{ color: "#1E3A8A", margin: "12px 0 6px" }}>No progress notes yet</h3>
              <p style={pnS.dim}>Click "+ Add Note" to record the patient's progress</p>
            </div>
          ) : (
            <>
              {/* ── TIMELINE CHART ── uses already-fetched notes, no extra API call ── */}
              <ConditionTimelineChart notes={notes} />

              {/* ── Notes list ── */}
              <div style={{ display: "grid", gap: 14 }}>
                {notes.map((note, i) => {
                  const sc = statusColors[note.status] || statusColors.stable;
                  return (
                    <div key={note._id} style={pnS.card}>
                      <div style={pnS.cardRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Sequential number badge */}
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: "#EFF6FF", color: "#2563EB",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 900,
                          }}>
                            {notes.length - i}
                          </div>
                          <div>
                            <div style={pnS.noteTitle}>{note.title || "Progress Note"}</div>
                            <div style={pnS.noteDate}>{fmt(note.createdAt)}</div>
                          </div>
                        </div>
                        <div style={{ ...pnS.badge, background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </div>
                      </div>
                      <p style={pnS.noteText}>{note.content}</p>
                      {note.doctorName && <div style={pnS.noteBy}>🩺 Dr. {note.doctorName}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={pnS.footer}>
          <button style={pnS.footerClose} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRESCRIPTION MODAL  (unchanged)
// ─────────────────────────────────────────────────────────────
export function PrescriptionModal({ patient, doctorInfo, onClose }) {
  const [form, setForm] = useState({
    diagnosis: patient?.condition || "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    advice: "",
    followUpDate: "",
    doctorName: doctorInfo?.name || "",
    clinicName: doctorInfo?.clinic || "LifeConnect Health",
    clinicPhone: doctorInfo?.phone || "",
    clinicAddress: doctorInfo?.address || "",
  });
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const addMed = () => setForm(p => ({ ...p, medications: [...p.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }] }));
  const removeMed = (i) => setForm(p => ({ ...p, medications: p.medications.filter((_, idx) => idx !== i) }));
  const updateMed = (i, field, val) => setForm(p => { const meds = [...p.medications]; meds[i] = { ...meds[i], [field]: val }; return { ...p, medications: meds }; });

  const generateDocx = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ patientId: patient._id, ...form }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Prescription_${patient.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        setSaved(true);
      } else { generatePrintFallback(); }
    } catch { generatePrintFallback(); }
    setGenerating(false);
  };

  const generatePrintFallback = () => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prescription - ${patient.name}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a1a2e}
.page{width:210mm;min-height:297mm;margin:0 auto;padding:20mm;position:relative}
.header{border-bottom:3px solid #1565c0;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start}
.clinic-name{font-size:22px;font-weight:700;color:#0d47a1}.clinic-info{font-size:12px;color:#546e7a;margin-top:4px}
.rx-badge{background:#0d47a1;color:white;font-size:36px;font-weight:700;padding:8px 18px;border-radius:8px}
.patient-box{background:#e3f2fd;border-left:4px solid #1565c0;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.patient-label{font-size:11px;font-weight:700;text-transform:uppercase;color:#546e7a;letter-spacing:.5px}
.patient-value{font-size:14px;font-weight:600;color:#0d47a1}
.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#546e7a;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin:18px 0 12px}
.diagnosis{background:#fff8e1;border:1px solid #ffe082;padding:12px 16px;border-radius:8px;font-size:15px;color:#37474f;margin-bottom:16px}
.med-table{width:100%;border-collapse:collapse}.med-table th{background:#0d47a1;color:white;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left}
.med-table td{padding:10px 12px;font-size:13px;border-bottom:1px solid #e3f2fd;vertical-align:top}
.med-table tr:nth-child(even) td{background:#f8fbff}
.advice-box{background:#f1f8e9;border:1px solid #aed581;padding:12px 16px;border-radius:8px;font-size:14px;color:#33691e;white-space:pre-wrap}
.footer{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #e0e0e0;padding-top:16px}
.signature-line{width:180px;border-top:1px solid #546e7a;padding-top:6px;font-size:12px;color:#546e7a;text-align:center}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head>
<body><div class="page">
<div class="header"><div><div class="clinic-name">🏥 ${form.clinicName}</div>
<div class="clinic-info">${form.clinicAddress ? form.clinicAddress + " · " : ""}${form.clinicPhone || ""}</div>
<div class="clinic-info" style="margin-top:4px;color:#0d47a1;font-weight:600">Dr. ${form.doctorName}</div></div>
<div class="rx-badge">Rx</div></div>
<div class="patient-box">
<div><div class="patient-label">Patient Name</div><div class="patient-value">${patient.name}</div></div>
<div><div class="patient-label">Date</div><div class="patient-value">${today}</div></div>
<div><div class="patient-label">Age</div><div class="patient-value">${patient.age || "—"} years</div></div>
<div><div class="patient-label">Gender</div><div class="patient-value">${patient.gender || "—"}</div></div></div>
<div class="section-title">Diagnosis</div><div class="diagnosis">${form.diagnosis || "—"}</div>
<div class="section-title">Prescribed Medications</div>
<table class="med-table"><thead><tr><th>#</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
<tbody>${form.medications.filter(m=>m.name).map((m,i)=>`<tr><td><strong>${i+1}</strong></td><td><strong>${m.name}</strong></td><td>${m.dosage||"—"}</td><td>${m.frequency||"—"}</td><td>${m.duration||"—"}</td><td>${m.instructions||"—"}</td></tr>`).join("")}</tbody></table>
${form.advice ? `<div class="section-title">Advice</div><div class="advice-box">${form.advice}</div>` : ""}
${form.followUpDate ? `<div class="section-title">Follow-up</div><div style="font-size:14px;color:#0d47a1;font-weight:600">📅 Return on: ${form.followUpDate}</div>` : ""}
<div class="footer"><div style="font-size:13px;color:#546e7a">Issued: ${today}</div>
<div class="signature-line">Dr. ${form.doctorName}<br><span style="font-size:11px">Signature & Stamp</span></div></div>
</div><script>window.onload=()=>window.print()</script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) { const a = document.createElement("a"); a.href = url; a.download = `Prescription_${patient.name.replace(/\s+/g,"_")}.html`; a.click(); }
    URL.revokeObjectURL(url);
    setSaved(true);
  };

  return (
    <div style={rxS.overlay} onClick={onClose}>
      <div style={rxS.modal} onClick={e => e.stopPropagation()}>
        <div style={rxS.header}>
          <div>
            <h2 style={rxS.title}>💊 Medical Prescription</h2>
            <p style={rxS.sub}>For: <strong>{patient.name}</strong> · Age {patient.age} · {patient.gender}</p>
          </div>
          <button style={rxS.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={rxS.body}>
          <div style={rxS.section}>
            <div style={rxS.sectionLabel}>🏥 Clinic / Doctor Info</div>
            <div style={rxS.grid2}>
              <div><label style={rxS.label}>Doctor Name *</label><input style={rxS.input} value={form.doctorName} onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))} placeholder="Dr. Full Name" /></div>
              <div><label style={rxS.label}>Clinic Name</label><input style={rxS.input} value={form.clinicName} onChange={e => setForm(p => ({ ...p, clinicName: e.target.value }))} /></div>
              <div><label style={rxS.label}>Clinic Phone</label><input style={rxS.input} value={form.clinicPhone} onChange={e => setForm(p => ({ ...p, clinicPhone: e.target.value }))} placeholder="+94 xx xxx xxxx" /></div>
              <div><label style={rxS.label}>Clinic Address</label><input style={rxS.input} value={form.clinicAddress} onChange={e => setForm(p => ({ ...p, clinicAddress: e.target.value }))} placeholder="Street, City" /></div>
            </div>
          </div>
          <div style={rxS.section}>
            <div style={rxS.sectionLabel}>🔍 Diagnosis</div>
            <textarea style={{ ...rxS.input, minHeight: 60, resize: "vertical" }} value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Enter diagnosis / condition" />
          </div>
          <div style={rxS.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={rxS.sectionLabel}>💊 Medications</div>
              <button style={rxS.addMedBtn} onClick={addMed}>+ Add Medicine</button>
            </div>
            {form.medications.map((med, i) => (
              <div key={i} style={rxS.medCard}>
                <div style={rxS.medNum}>{i + 1}</div>
                {form.medications.length > 1 && <button style={rxS.removeMedBtn} onClick={() => removeMed(i)}>✕</button>}
                <div style={rxS.grid3}>
                  <div style={{ gridColumn: "1/3" }}><label style={rxS.label}>Medicine Name *</label><input style={rxS.input} value={med.name} onChange={e => updateMed(i, "name", e.target.value)} placeholder="e.g. Amoxicillin 500mg" /></div>
                  <div><label style={rxS.label}>Dosage</label><input style={rxS.input} value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} placeholder="1 tablet" /></div>
                  <div><label style={rxS.label}>Frequency</label><input style={rxS.input} value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} placeholder="3x daily" /></div>
                  <div><label style={rxS.label}>Duration</label><input style={rxS.input} value={med.duration} onChange={e => updateMed(i, "duration", e.target.value)} placeholder="7 days" /></div>
                  <div><label style={rxS.label}>Special Instructions</label><input style={rxS.input} value={med.instructions} onChange={e => updateMed(i, "instructions", e.target.value)} placeholder="After meals" /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={rxS.section}>
            <div style={rxS.sectionLabel}>📝 Advice & Follow-up</div>
            <div style={rxS.grid2}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={rxS.label}>General Advice</label>
                <textarea style={{ ...rxS.input, minHeight: 80, resize: "vertical" }} value={form.advice} onChange={e => setForm(p => ({ ...p, advice: e.target.value }))} placeholder="Drink plenty of water, rest..." />
              </div>
              <div>
                <label style={rxS.label}>📅 Follow-up Date</label>
                <input type="date" style={rxS.input} value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
        <div style={rxS.footer}>
          {saved && <span style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>✅ Prescription generated!</span>}
          <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
            <button style={rxS.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...rxS.generateBtn, opacity: generating ? 0.7 : 1 }} onClick={generateDocx} disabled={generating || !form.doctorName || !form.medications.some(m => m.name)}>
              {generating ? "⏳ Generating..." : "🖨️ Generate & Print"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PATIENT CARD ACTIONS  (unchanged)
// ─────────────────────────────────────────────────────────────
export function PatientCardActions({ patient, onViewDetails, onProgressNotes, onPrescription, onToggleActive }) {
  const isActive = patient.isActive !== false;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleActive(patient);
    setToggling(false);
  };

  return (
    <div style={{ paddingTop: 14, borderTop: "1px solid #EFF6FF" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: isActive ? "#D1FAE5" : "#FEE2E2",
          color: isActive ? "#065F46" : "#991B1B",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#10B981" : "#EF4444", display: "inline-block" }} />
          {isActive ? "Active" : "Inactive"}
        </span>
        <button onClick={handleToggle} disabled={toggling}
          style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            cursor: toggling ? "not-allowed" : "pointer",
            border: isActive ? "1.5px solid #FCA5A5" : "1.5px solid #6EE7B7",
            background: isActive ? "#FFF0F0" : "#F0FFF4",
            color: isActive ? "#DC2626" : "#059669",
            opacity: toggling ? 0.6 : 1, transition: "all 0.18s",
          }}>
          {toggling ? "…" : isActive ? "⏸ Deactivate" : "▶ Activate"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ flex: 1, padding: "8px 6px", background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #DBEAFE", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => onViewDetails(patient)}>📋 Details</button>
        <button style={{ flex: 1, padding: "8px 6px", background: "#F0FDF4", color: "#059669", border: "1.5px solid #BBF7D0", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => onProgressNotes(patient)}>📈 Notes</button>
        <button style={{ flex: 1, padding: "8px 6px", background: "#FFFBEB", color: "#D97706", border: "1.5px solid #FDE68A", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => onPrescription(patient)}>💊 Rx</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const pnS = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,35,95,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2500, backdropFilter: "blur(8px)" },
  modal: { background: "white", borderRadius: 18, width: "92%", maxWidth: 760, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(15,35,95,0.3)", border: "1.5px solid #DBEAFE" },
  header: { padding: "20px 24px", background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "white" },
  sub: { margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 },
  addBtn: { padding: "9px 16px", borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  closeBtn: { width: 36, height: 36, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", fontSize: 22, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
  form: { padding: "16px 22px", background: "#F8FBFF", borderBottom: "1.5px solid #DBEAFE", display: "flex", flexDirection: "column", gap: 12 },
  input: { width: "100%", padding: "11px 13px", border: "1.5px solid #DBEAFE", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1E3A8A", background: "#fff", boxSizing: "border-box" },
  label: { fontSize: 13, fontWeight: 700, color: "#1D4ED8", marginBottom: 4, display: "block" },
  statusPill: { padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  saveBtn: { padding: "11px 22px", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" },
  body: { padding: 20, overflow: "auto", flex: 1, background: "#F8FBFF" },
  center: { padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  spinner: { width: 40, height: 40, border: "3px solid #DBEAFE", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  dim: { margin: 0, color: "#6B9FD4", fontWeight: 500 },
  card: { background: "white", borderRadius: 12, padding: 16, border: "1.5px solid #DBEAFE", boxShadow: "0 2px 8px rgba(37,99,235,0.06)" },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  noteTitle: { fontSize: 15, fontWeight: 700, color: "#1E3A8A" },
  noteDate: { fontSize: 12, color: "#6B9FD4", marginTop: 3, fontWeight: 500 },
  badge: { padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 },
  noteText: { margin: 0, color: "#374151", lineHeight: 1.7, fontSize: 14 },
  noteBy: { marginTop: 8, fontSize: 12, color: "#6B9FD4", fontWeight: 500 },
  footer: { padding: "14px 22px", borderTop: "1.5px solid #DBEAFE", display: "flex", justifyContent: "flex-end", background: "#F8FBFF" },
  footerClose: { padding: "9px 20px", borderRadius: 9, border: "1.5px solid #DBEAFE", background: "white", color: "#1E3A8A", fontWeight: 700, cursor: "pointer" },
};

const rxS = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,35,95,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2600, backdropFilter: "blur(8px)" },
  modal: { background: "white", borderRadius: 18, width: "94%", maxWidth: 860, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(15,35,95,0.3)", border: "1.5px solid #DBEAFE" },
  header: { padding: "20px 24px", background: "linear-gradient(135deg, #C2410C, #EA580C)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "white" },
  sub: { margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 },
  closeBtn: { width: 36, height: 36, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", fontSize: 22, cursor: "pointer", color: "white" },
  body: { padding: 22, overflow: "auto", flex: 1, background: "#F8FBFF" },
  section: { background: "white", borderRadius: 12, padding: 18, marginBottom: 14, border: "1.5px solid #DBEAFE" },
  sectionLabel: { fontSize: 12, fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #DBEAFE", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#1E3A8A", background: "#FAFCFF", boxSizing: "border-box", outline: "none" },
  medCard: { background: "#F8FBFF", borderRadius: 10, padding: 14, marginBottom: 10, border: "1.5px solid #DBEAFE", position: "relative" },
  medNum: { position: "absolute", top: 12, left: 14, fontSize: 16, fontWeight: 900, color: "#BFDBFE" },
  removeMedBtn: { position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 6, border: "none", background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: 11, fontWeight: 700 },
  addMedBtn: { padding: "7px 13px", borderRadius: 8, border: "1.5px solid #DBEAFE", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  footer: { padding: "16px 22px", borderTop: "1.5px solid #DBEAFE", display: "flex", alignItems: "center", background: "white" },
  cancelBtn: { padding: "11px 20px", borderRadius: 9, border: "1.5px solid #E5E7EB", background: "#F3F4F6", color: "#6B7280", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  generateBtn: { padding: "12px 24px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #C2410C, #EA580C)", color: "white", fontWeight: 800, cursor: "pointer", fontSize: 14, boxShadow: "0 4px 14px rgba(194,65,12,0.3)" },
};