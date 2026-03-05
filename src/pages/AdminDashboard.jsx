import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const API = "http://localhost:5003/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const safeFetch = async (url) => {
  try {
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  } catch { return null; }
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
const timeAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:    "#2563EB",
  primaryLt:  "#3B82F6",
  primaryDim: "rgba(37,99,235,0.18)",
  primaryBd:  "rgba(37,99,235,0.32)",
  bgBase:     "#020B18",
  bgGrad1:    "rgba(29,78,216,0.28)",
  bgGrad2:    "rgba(30,58,138,0.18)",
  glass:      "rgba(255,255,255,0.055)",
  glassBd:    "rgba(255,255,255,0.10)",
  glassHov:   "rgba(255,255,255,0.09)",
  text:       "#EFF6FF",
  textMid:    "rgba(219,234,254,0.65)",
  textDim:    "rgba(147,179,232,0.5)",
  green:      "#34d399",
  amber:      "#fbbf24",
  red:        "#f87171",
  purple:     "#818cf8",
  pink:       "#f472b6",
  sky:        "#38bdf8",
};

// ─── STATUS HELPERS (for Progress Notes) ─────────────────────────────────────
const STATUS_COLOR = {
  improving: "#34d399",
  stable:    "#38bdf8",
  worsening: "#fbbf24",
  critical:  "#f87171",
};
const STATUS_BG = {
  improving: "rgba(52,211,153,0.12)",
  stable:    "rgba(56,189,248,0.12)",
  worsening: "rgba(251,191,36,0.12)",
  critical:  "rgba(248,113,113,0.12)",
};
const STATUS_BD = {
  improving: "rgba(52,211,153,0.28)",
  stable:    "rgba(56,189,248,0.28)",
  worsening: "rgba(251,191,36,0.28)",
  critical:  "rgba(248,113,113,0.28)",
};

const statusNumeric = (s) => ({ improving: 4, stable: 3, worsening: 2, critical: 1 }[s?.toLowerCase()] ?? 3);
const statusLabel   = (n) => ({ 4: "Improving", 3: "Stable", 2: "Worsening", 1: "Critical" }[n] ?? "Stable");

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const paths = {
    dashboard:  <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    users:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    doctor:     <><path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM4 21v-1a8 8 0 0 1 8-8 8 8 0 0 1 8 8v1"/><path d="M12 17v4M10 19h4"/></>,
    patient:    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    calendar:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    notes:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    alert:      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    logout:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    plus:       <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit:       <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:      <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    shield:     <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    key:        <><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></>,
    eye:        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:     <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    activity:   <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    search:     <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    x:          <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevron:    <><polyline points="6 9 12 15 18 9"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

// ─── INJECT GLOBAL STYLES ─────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("lc-admin-styles")) return;
  const s = document.createElement("style");
  s.id = "lc-admin-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    .lc-wrap * { box-sizing: border-box; }
    .lc-wrap { font-family: 'DM Sans', 'Segoe UI', sans-serif; }
    .glass-panel {
      background: rgba(10,30,70,0.55);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(59,130,246,0.15);
    }
    .glass-card {
      background: rgba(10,30,70,0.45);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(59,130,246,0.14);
      border-radius: 16px;
      transition: all 0.22s ease;
    }
    .glass-card:hover {
      background: rgba(37,99,235,0.12);
      border-color: rgba(59,130,246,0.32);
      transform: translateY(-2px);
      box-shadow: 0 20px 50px rgba(29,78,216,0.25);
    }
    .stat-in { animation: fadeUp 0.45s ease both; }
    .stat-in:nth-child(1){animation-delay:.05s}
    .stat-in:nth-child(2){animation-delay:.10s}
    .stat-in:nth-child(3){animation-delay:.15s}
    .stat-in:nth-child(4){animation-delay:.20s}
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to { transform: rotate(360deg); } }
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .lc-tab { transition: color 0.18s; }
    .lc-row { transition: background 0.14s; }
    .lc-row:hover { background: rgba(37,99,235,0.08) !important; }
    .lc-btn { transition: all 0.15s; }
    .lc-btn:hover { transform: translateY(-1px); filter: brightness(1.12); }
    .lc-pill { transition: all 0.15s; }
    .lc-nav-item { transition: all 0.18s; }
    .pn-row { transition: all 0.22s ease; }
    input:focus, select:focus, textarea:focus {
      outline: none !important;
      border-color: rgba(59,130,246,0.55) !important;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
    }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.22); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.4); }
  `;
  document.head.appendChild(s);
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = status?.toLowerCase();
  const map = {
    pending:   ["rgba(251,191,36,0.14)",   "#fbbf24",  "rgba(251,191,36,0.3)"],
    accepted:  ["rgba(52,211,153,0.14)",   "#34d399",  "rgba(52,211,153,0.3)"],
    approved:  ["rgba(52,211,153,0.14)",   "#34d399",  "rgba(52,211,153,0.3)"],
    rejected:  ["rgba(248,113,113,0.14)",  "#f87171",  "rgba(248,113,113,0.3)"],
    completed: ["rgba(59,130,246,0.14)",   "#60a5fa",  "rgba(59,130,246,0.3)"],
    active:    ["rgba(52,211,153,0.14)",   "#34d399",  "rgba(52,211,153,0.3)"],
    inactive:  ["rgba(147,179,232,0.14)",  "#93b3e8",  "rgba(147,179,232,0.3)"],
    stable:    ["rgba(56,189,248,0.14)",   "#38bdf8",  "rgba(56,189,248,0.3)"],
    improving: ["rgba(52,211,153,0.14)",   "#34d399",  "rgba(52,211,153,0.3)"],
    critical:  ["rgba(248,113,113,0.14)",  "#f87171",  "rgba(248,113,113,0.3)"],
    worsening: ["rgba(251,191,36,0.14)",   "#fbbf24",  "rgba(251,191,36,0.3)"],
  };
  const [bg, fg, bd] = map[s] || ["rgba(147,179,232,0.14)", "#93b3e8", "rgba(147,179,232,0.3)"];
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${bd}`, padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" }}>
      {status || "—"}
    </span>
  );
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Av = ({ name, accent = C.primaryLt, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `${accent}18`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42, color: accent, flexShrink: 0 }}>
    {(name || "?")[0].toUpperCase()}
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent, sub, onClick }) => (
  <div className="glass-card stat-in" onClick={onClick} style={{ padding: "20px 22px", cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 110, height: 110, borderRadius: "50%", background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: "none" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accent}18`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={19} color={accent} />
      </div>
      {onClick && <span style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: "0.8px" }}>OPEN →</span>}
    </div>
    <div style={{ fontSize: 34, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 5 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.9px" }}>{label}</div>
    {sub && <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 3 }}>{sub}</div>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, background: `linear-gradient(90deg, ${accent}90, transparent)` }} />
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, maxW = 680 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(2,8,24,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(10px)" }} onClick={onClose}>
    <div className="glass-panel" style={{ borderRadius: 20, width: "92%", maxWidth: maxW, maxHeight: "92vh", overflow: "auto", boxShadow: "0 40px 100px rgba(29,78,216,0.25), 0 0 0 1px rgba(59,130,246,0.15)" }} onClick={e => e.stopPropagation()}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(59,130,246,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(4,14,40,0.95)", backdropFilter: "blur(20px)", borderRadius: "20px 20px 0 0", zIndex: 5 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(59,130,246,0.22)", color: C.textMid, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// ─── FORM INPUTS ─────────────────────────────────────────────────────────────
const Fld = ({ label, children }) => (
  <div style={{ marginBottom: 15 }}>
    <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</label>
    {children}
  </div>
);
const iS = { width: "100%", padding: "10px 13px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 9, fontSize: 14, color: C.text, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
const Inp = (p) => <input style={iS} {...p} />;
const Sel = ({ children, ...p }) => <select style={{ ...iS, cursor: "pointer" }} {...p}>{children}</select>;
const Txt = (p) => <textarea style={{ ...iS, resize: "vertical", minHeight: 80 }} {...p} />;

// ─── BUTTONS ─────────────────────────────────────────────────────────────────
const Btn = ({ children, accent, ghost, danger, warning, sm, icon, onClick, disabled, type = "button" }) => {
  const a = accent || C.primaryLt;
  return (
    <button type={type} className="lc-btn" onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: sm ? "5px 12px" : "9px 16px",
      background: danger ? "rgba(248,113,113,0.12)" : warning ? "rgba(251,191,36,0.12)" : ghost ? "rgba(255,255,255,0.05)" : `${a}20`,
      border: `1px solid ${danger ? "rgba(248,113,113,0.32)" : warning ? "rgba(251,191,36,0.32)" : ghost ? "rgba(255,255,255,0.11)" : `${a}45`}`,
      borderRadius: 9, fontSize: sm ? 12 : 13, fontWeight: 600,
      color: danger ? "#f87171" : warning ? "#fbbf24" : ghost ? C.textMid : a,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
    }}>
      {icon && <Icon name={icon} size={sm ? 13 : 14} color={danger ? "#f87171" : warning ? "#fbbf24" : ghost ? C.textMid : a} />}
      {children}
    </button>
  );
};

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
const DTable = ({ cols, rows, eIcon, eText }) => {
  const grid = cols.map(c => c.w || "1fr").join(" ");
  return (
    <div className="glass-panel" style={{ borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: grid, padding: "10px 18px", background: "rgba(37,99,235,0.08)", borderBottom: "1px solid rgba(59,130,246,0.12)", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.1px" }}>
        {cols.map(c => <div key={c.k}>{c.l}</div>)}
      </div>
      {rows.length === 0
        ? <div style={{ padding: "60px 40px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: C.primaryDim, border: `1px solid ${C.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name={eIcon || "notes"} size={22} color={C.textDim} />
            </div>
            <div style={{ color: C.textDim, fontSize: 13, fontWeight: 600 }}>{eText || "No data available"}</div>
          </div>
        : rows.map((row, i) => (
          <div key={i} className="lc-row" style={{ display: "grid", gridTemplateColumns: grid, padding: "12px 18px", borderBottom: i < rows.length - 1 ? "1px solid rgba(59,130,246,0.07)" : "none", alignItems: "center" }}>
            {cols.map(c => <div key={c.k}>{row[c.k]}</div>)}
          </div>
        ))}
    </div>
  );
};

// ─── SECTION HEAD ─────────────────────────────────────────────────────────────
const SHead = ({ icon, title, count, action, sub }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: C.primaryDim, border: `1px solid ${C.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} color={C.primaryLt} />
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.text }}>{title}</h2>
        {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{sub}</div>}
      </div>
      {count !== undefined && (
        <span style={{ background: C.primaryDim, border: `1px solid ${C.primaryBd}`, color: C.primaryLt, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{count}</span>
      )}
    </div>
    {action}
  </div>
);

// ─── LOADER ───────────────────────────────────────────────────────────────────
const Spin = () => (
  <div style={{ padding: "80px 40px", textAlign: "center" }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${C.primaryDim}`, borderTop: `3px solid ${C.primaryLt}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 0.75s linear infinite" }} />
    <div style={{ color: C.textDim, fontSize: 13, fontWeight: 600 }}>Loading…</div>
  </div>
);

// ─── FILTER PILLS ─────────────────────────────────────────────────────────────
const Pills = ({ options, counts, value, onChange }) => (
  <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
    {options.map(k => (
      <button key={k} className="lc-pill" onClick={() => onChange(k)} style={{
        padding: "5px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        background: value === k ? C.primaryDim : "rgba(255,255,255,0.04)",
        color: value === k ? C.primaryLt : C.textDim,
        borderColor: value === k ? C.primaryBd : "rgba(255,255,255,0.08)",
      }}>
        {k.charAt(0).toUpperCase() + k.slice(1)}{counts && ` (${counts[k] ?? 0})`}
      </button>
    ))}
  </div>
);

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", marginBottom: 18 }}>
    <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
      <Icon name="search" size={15} color={C.textDim} />
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Search…"}
      style={{ ...iS, paddingLeft: 40, paddingRight: value ? 38 : 14, background: "rgba(37,99,235,0.08)", border: `1px solid ${C.primaryBd}`, borderRadius: 11, fontSize: 13, height: 40 }}
    />
    {value && (
      <button onClick={() => onChange("")} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "rgba(37,99,235,0.18)", border: "none", borderRadius: 6, cursor: "pointer", padding: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="x" size={12} color={C.primaryLt} />
      </button>
    )}
  </div>
);

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
const PwStrength = ({ pw }) => {
  if (!pw) return null;
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#f87171", "#fbbf24", "#34d399", C.primaryLt];
  return (
    <div style={{ marginTop: 7 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: colors[score], fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
};

// ─── PASSWORD INPUT ───────────────────────────────────────────────────────────
const PwInput = ({ value, onChange, placeholder, showStrength }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder || "Enter password"} style={{ ...iS, paddingRight: 42 }} />
        <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <Icon name={show ? "eyeOff" : "eye"} size={16} color={C.textDim} />
        </button>
      </div>
      {showStrength && <PwStrength pw={value} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// PASSWORD RESET MODAL
// ════════════════════════════════════════════════════════════════════════════════
function PasswordModal({ entityType, item, onClose }) {
  const displayName = entityType === "patient" ? item.name : item.fullName;
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const mismatch = confirm && pw !== confirm;
  const tooShort = pw && pw.length < 6;

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== confirm) { setErr("Passwords do not match"); return; }
    if (pw.length < 6)  { setErr("Password must be at least 6 characters"); return; }
    setLoading(true); setErr("");
    const url = entityType === "patient" ? `${API}/patients/${item._id}/password` : `${API}/users/${item._id}/password`;
    try {
      const res = await fetch(url, { method: "PUT", headers: getHeaders(), body: JSON.stringify({ newPassword: pw }) });
      const data = await res.json();
      if (data.success) setDone(true); else setErr(data.message || "Failed");
    } catch { setErr("Network error"); }
    setLoading(false);
  };

  return (
    <Modal title={`Reset Password — ${displayName}`} onClose={onClose} maxW={440}>
      {done ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="shield" size={26} color="#34d399" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>Password Updated!</div>
          <div style={{ fontSize: 13, color: C.textMid, marginBottom: 20 }}>Password for <strong style={{ color: C.text }}>{displayName}</strong> has been changed.</div>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      ) : (
        <>
          <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 10 }}>
            <Icon name="alert" size={15} color="#fbbf24" />
            <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>Setting new password for <strong style={{ color: "#fbbf24" }}>{displayName}</strong>.</div>
          </div>
          <form onSubmit={submit}>
            {err && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.28)", color: "#f87171", padding: "9px 13px", borderRadius: 9, marginBottom: 14, fontSize: 13 }}>{err}</div>}
            <Fld label="New Password *"><PwInput value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 characters" showStrength />{tooShort && <div style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>Must be at least 6 characters</div>}</Fld>
            <Fld label="Confirm Password *"><PwInput value={confirm} onChange={e => setConfirm(e.target.value)} />{mismatch && <div style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>Passwords do not match</div>}</Fld>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
              <Btn ghost onClick={onClose}>Cancel</Btn>
              <Btn type="submit" accent="#fbbf24" icon="key" disabled={loading || !pw || !confirm || mismatch || tooShort}>{loading ? "Saving…" : "Set Password"}</Btn>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// USER MODAL
// ════════════════════════════════════════════════════════════════════════════════
function UserModal({ mode, role, item, onClose, onSuccess }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({ fullName: item?.fullName || "", email: item?.email || "", password: "", phone: item?.phone || "", address: item?.address || "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const url = isEdit ? `${API}/users/${item._id}` : `${API}/users`;
      const body = isEdit ? { fullName: form.fullName, email: form.email, phone: form.phone, address: form.address } : { ...form, role };
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); } else setErr(data.message || "Failed");
    } catch { setErr("Network error"); }
    setLoading(false);
  };

  return (
    <Modal title={`${isEdit ? "Edit" : "Add"} ${role === "doctor" ? "Doctor" : "Caregiver"}`} onClose={onClose}>
      <form onSubmit={submit}>
        {err && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.28)", color: "#f87171", padding: "9px 13px", borderRadius: 9, marginBottom: 14, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Fld label="Full Name *"><Inp value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Enter full name" required /></Fld></div>
          <Fld label="Email *"><Inp type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" required /></Fld>
          {!isEdit && <Fld label="Password *"><PwInput value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 characters" showStrength /></Fld>}
          <Fld label="Phone"><Inp value={form.phone} onChange={e => set("phone", e.target.value)} /></Fld>
          <Fld label="Address"><Inp value={form.address} onChange={e => set("address", e.target.value)} /></Fld>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? "Saving…" : isEdit ? "Update" : "Add"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PATIENT MODAL
// ════════════════════════════════════════════════════════════════════════════════
function PatientModal({ mode, item, onClose, onSuccess }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({ name: item?.name || "", email: item?.email || "", password: "", age: item?.age || "", gender: item?.gender || "", condition: item?.condition || "", phone: item?.phone || "", address: item?.address || "", medicalHistory: item?.medicalHistory || "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const url = isEdit ? `${API}/patients/${item._id}` : `${API}/patients`;
      const body = isEdit ? { name: form.name, email: form.email, age: form.age, gender: form.gender, condition: form.condition, phone: form.phone, address: form.address, medicalHistory: form.medicalHistory } : form;
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: getHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); } else setErr(data.message || "Failed");
    } catch { setErr("Network error"); }
    setLoading(false);
  };

  return (
    <Modal title={`${isEdit ? "Edit" : "Add"} Patient`} onClose={onClose} maxW={760}>
      <form onSubmit={submit}>
        {err && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.28)", color: "#f87171", padding: "9px 13px", borderRadius: 9, marginBottom: 14, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Fld label="Full Name *"><Inp value={form.name} onChange={e => set("name", e.target.value)} placeholder="Patient full name" required /></Fld></div>
          <Fld label="Email *"><Inp type="email" value={form.email} onChange={e => set("email", e.target.value)} required /></Fld>
          {!isEdit && <Fld label="Password *"><PwInput value={form.password} onChange={e => set("password", e.target.value)} showStrength /></Fld>}
          <Fld label="Age *"><Inp type="number" value={form.age} onChange={e => set("age", e.target.value)} required /></Fld>
          <Fld label="Gender *"><Sel value={form.gender} onChange={e => set("gender", e.target.value)} required><option value="">Select</option><option>Male</option><option>Female</option></Sel></Fld>
          <Fld label="Condition"><Inp value={form.condition} onChange={e => set("condition", e.target.value)} /></Fld>
          <Fld label="Phone"><Inp value={form.phone} onChange={e => set("phone", e.target.value)} /></Fld>
          <div style={{ gridColumn: "1/-1" }}><Fld label="Address"><Inp value={form.address} onChange={e => set("address", e.target.value)} /></Fld></div>
          <div style={{ gridColumn: "1/-1" }}><Fld label="Medical History"><Txt value={form.medicalHistory} onChange={e => set("medicalHistory", e.target.value)} /></Fld></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Btn ghost onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={loading}>{loading ? "Saving…" : isEdit ? "Update" : "Add Patient"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ════════════════════════════════════════════════════════════════════════════════
function UsersTab({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const accent = role === "doctor" ? "#34d399" : C.primaryLt;

  const load = useCallback(async () => {
    setLoading(true);
    const d = await safeFetch(`${API}/users?role=${role}`);
    setUsers(d?.users || []); setLoading(false);
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm(`Remove this ${role}?`)) return;
    await fetch(`${API}/users/${id}`, { method: "DELETE", headers: getHeaders() });
    load();
  };

  if (loading) return <Spin />;

  const q = search.toLowerCase().trim();
  const filtered = q
    ? users.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.address?.toLowerCase().includes(q)
      )
    : users;

  const rows = filtered.map(u => ({
    name: <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Av name={u.fullName} accent={accent} /><div><div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{u.fullName}</div><div style={{ fontSize: 11, color: C.textDim }}>{u.email}</div></div></div>,
    phone: <span style={{ color: C.textMid, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>{u.phone || "—"}</span>,
    address: <span style={{ color: C.textMid, fontSize: 13 }}>{u.address || "—"}</span>,
    actions: (
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Btn sm ghost icon="edit" onClick={() => setModal({ type: "edit", item: u })}>Edit</Btn>
        <Btn sm warning icon="key" onClick={() => setModal({ type: "password", item: u })}>Password</Btn>
        <Btn sm danger icon="trash" onClick={() => del(u._id)}>Remove</Btn>
      </div>
    ),
  }));

  return (
    <>
      <SHead icon={role === "doctor" ? "doctor" : "users"} title={role === "doctor" ? "Doctors" : "Caregivers"} count={users.length}
        action={<Btn icon="plus" onClick={() => setModal({ type: "add" })}>Add {role === "doctor" ? "Doctor" : "Caregiver"}</Btn>} />
      <SearchBar value={search} onChange={setSearch} placeholder={`Search ${role === "doctor" ? "doctors" : "caregivers"} by name, email, phone or address…`} />
      {q && (
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, marginTop: -8 }}>
          {filtered.length === 0 ? `No ${role}s match "${search}"` : `${filtered.length} of ${users.length} ${role}${users.length !== 1 ? "s" : ""} match`}
        </div>
      )}
      <DTable cols={[{ k: "name", l: "Name", w: "3fr" }, { k: "phone", l: "Phone", w: "1.5fr" }, { k: "address", l: "Address", w: "2fr" }, { k: "actions", l: "Actions", w: "2.5fr" }]} rows={rows} eIcon="users" eText={q ? `No ${role}s match "${search}"` : `No ${role}s registered`} />
      {modal?.type === "edit"     && <UserModal     mode="edit" role={role} item={modal.item} onClose={() => setModal(null)} onSuccess={load} />}
      {modal?.type === "add"      && <UserModal     mode="add"  role={role}               onClose={() => setModal(null)} onSuccess={load} />}
      {modal?.type === "password" && <PasswordModal entityType="user" item={modal.item} onClose={() => setModal(null)} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PATIENTS TAB
// ════════════════════════════════════════════════════════════════════════════════
function PatientsTab() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const d = await safeFetch(`${API}/patients`);
    setPatients(d?.patients || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Delete this patient?")) return;
    await fetch(`${API}/patients/${id}`, { method: "DELETE", headers: getHeaders() });
    load();
  };

  if (loading) return <Spin />;

  const q = search.toLowerCase().trim();
  const filtered = q
    ? patients.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.condition?.toLowerCase().includes(q) ||
        p.gender?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        String(p.age || "").includes(q) ||
        p.doctor_id?.fullName?.toLowerCase().includes(q) ||
        p.assignedDoctor?.fullName?.toLowerCase().includes(q)
      )
    : patients;

  const rows = filtered.map(p => ({
    name: <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Av name={p.name} accent="#818cf8" /><div><div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 11, color: C.textDim }}>{p.condition || p.email || "—"}</div></div></div>,
    age:    <span style={{ color: C.textMid, fontSize: 13 }}>{p.age || "—"}</span>,
    gender: <span style={{ color: C.textMid, fontSize: 13 }}>{p.gender || "—"}</span>,
    doctor: <span style={{ color: C.textMid, fontSize: 13 }}>{p.assignedDoctor?.fullName || p.doctor_id?.fullName || "Unassigned"}</span>,
    status: <Badge status={p.status || "active"} />,
    actions: (
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Btn sm ghost icon="edit" onClick={() => setModal({ type: "edit", item: p })}>Edit</Btn>
        <Btn sm warning icon="key" onClick={() => setModal({ type: "password", item: p })}>Password</Btn>
        <Btn sm danger icon="trash" onClick={() => del(p._id)}>Delete</Btn>
      </div>
    ),
  }));

  return (
    <>
      <SHead icon="patient" title="Patients" count={patients.length} action={<Btn icon="plus" onClick={() => setModal({ type: "add" })}>Add Patient</Btn>} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search patients by name, email, condition, age, gender or doctor…" />
      {q && (
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, marginTop: -8 }}>
          {filtered.length === 0 ? `No patients match "${search}"` : `${filtered.length} of ${patients.length} patient${patients.length !== 1 ? "s" : ""} match`}
        </div>
      )}
      <DTable cols={[{ k: "name", l: "Name", w: "2.5fr" }, { k: "age", l: "Age", w: "0.5fr" }, { k: "gender", l: "Gender", w: "0.9fr" }, { k: "doctor", l: "Doctor", w: "1.5fr" }, { k: "status", l: "Status", w: "1fr" }, { k: "actions", l: "Actions", w: "2fr" }]} rows={rows} eIcon="patient" eText={q ? `No patients match "${search}"` : "No patients found"} />
      {modal?.type === "edit"     && <PatientModal  mode="edit" item={modal.item} onClose={() => setModal(null)} onSuccess={load} />}
      {modal?.type === "add"      && <PatientModal  mode="add"               onClose={() => setModal(null)} onSuccess={load} />}
      {modal?.type === "password" && <PasswordModal entityType="patient" item={modal.item} onClose={() => setModal(null)} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SESSIONS TAB
// ════════════════════════════════════════════════════════════════════════════════
function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const pd = await safeFetch(`${API}/patients`);
    const all = [];
    await Promise.all((pd?.patients || []).map(async p => {
      const d = await safeFetch(`${API}/medical-sessions/patient/${p._id}`);
      if (d?.sessions) all.push(...d.sessions.map(s => ({ ...s, _p: p })));
    }));
    const seen = new Set();
    setSessions(all.filter(s => { if (seen.has(s._id)) return false; seen.add(s._id); return true; }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <Spin />;

  const opts = ["all", "pending", "approved", "completed", "rejected"];
  const counts = Object.fromEntries(opts.map(s => [s, s === "all" ? sessions.length : sessions.filter(x => x.status === s).length]));
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.status === filter);

  const rows = filtered.map(s => ({
    patient:   <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{s.patient?.name || s._p?.name || "—"}</span>,
    doctor:    <span style={{ color: C.textMid, fontSize: 13 }}>Dr. {s.doctor?.fullName || "—"}</span>,
    caregiver: <span style={{ color: C.textMid, fontSize: 13 }}>{s.caregiver?.fullName || "—"}</span>,
    dt:        <span style={{ color: C.textDim, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{s.requestedDate || "—"}{s.requestedTime ? ` · ${s.requestedTime}` : ""}</span>,
    status:    <Badge status={s.status} />,
  }));

  return (
    <>
      <SHead icon="calendar" title="Medical Sessions" count={sessions.length} />
      <Pills options={opts} counts={counts} value={filter} onChange={setFilter} />
      <DTable cols={[{ k: "patient", l: "Patient", w: "1.5fr" }, { k: "doctor", l: "Doctor", w: "1.5fr" }, { k: "caregiver", l: "Caregiver", w: "1.2fr" }, { k: "dt", l: "Date & Time", w: "1.5fr" }, { k: "status", l: "Status", w: "1fr" }]} rows={rows} eIcon="calendar" eText="No sessions found" />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PROGRESS NOTES — chart sub-components
// ════════════════════════════════════════════════════════════════════════════════

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const s = statusLabel(val)?.toLowerCase();
  return (
    <div style={{ background: "rgba(4,14,40,0.97)", border: `1px solid ${STATUS_BD[s] || C.primaryBd}`, borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
      <div style={{ color: C.textDim, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: STATUS_COLOR[s] || C.primaryLt, fontSize: 13 }}>{statusLabel(val)}</div>
    </div>
  );
};

const CustomDot = (props) => {
  const { cx, cy, value } = props;
  const s = statusLabel(value)?.toLowerCase();
  const col = STATUS_COLOR[s] || C.primaryLt;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={col} stroke="rgba(4,14,40,0.8)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10} fill={`${col}22`} stroke="none" />
    </g>
  );
};

function StatusTrendChart({ notes }) {
  const sorted = [...notes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const data = sorted.map(n => ({
    date:   fmtDateShort(n.createdAt),
    value:  statusNumeric(n.status),
    status: n.status,
    title:  n.title,
  }));
  const latestStatus = data[data.length - 1]?.status?.toLowerCase() || "stable";
  const lineColor = STATUS_COLOR[latestStatus] || C.primaryLt;

  return (
    <div style={{ background: "rgba(10,25,60,0.6)", border: "1px solid rgba(59,130,246,0.14)", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.1px", marginBottom: 14 }}>
        Health Status Trend
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        {["improving","stable","worsening","critical"].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMid }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[s] }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={{ stroke: "rgba(59,130,246,0.12)" }} tickLine={false} />
          <YAxis domain={[0.5, 4.5]} ticks={[1,2,3,4]} tickFormatter={statusLabel} tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} width={68} />
          <ReferenceLine y={4} stroke="rgba(52,211,153,0.08)"  strokeWidth={18} />
          <ReferenceLine y={3} stroke="rgba(56,189,248,0.08)"  strokeWidth={18} />
          <ReferenceLine y={2} stroke="rgba(251,191,36,0.08)"  strokeWidth={18} />
          <ReferenceLine y={1} stroke="rgba(248,113,113,0.08)" strokeWidth={18} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(59,130,246,0.2)", strokeWidth: 1 }} />
          <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2.5} dot={<CustomDot />} activeDot={{ r: 7, fill: lineColor, stroke: "rgba(4,14,40,0.8)", strokeWidth: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function NoteCard({ note }) {
  const s = note.status?.toLowerCase() || "stable";
  const col = STATUS_COLOR[s] || C.primaryLt;
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(59,130,246,0.08)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0, paddingTop: 3 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: `0 0 8px ${col}66`, flexShrink: 0 }} />
        <div style={{ flex: 1, width: 1.5, background: "rgba(59,130,246,0.12)", marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 2 }}>{note.title || "Progress Note"}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>
              Dr. {note.doctorName || note.doctor?.fullName || "—"} · {timeAgo(note.createdAt)}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}><Badge status={note.status} /></div>
        </div>
        {note.content && (
          <div style={{ fontSize: 12.5, color: C.textMid, lineHeight: 1.6, background: "rgba(37,99,235,0.05)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 8, padding: "8px 12px" }}>
            {note.content}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientNoteRow({ patientName, notes }) {
  const [open, setOpen] = useState(false);
  const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const latest = sorted[0];
  const latestStatus = latest?.status?.toLowerCase() || "stable";
  const col = STATUS_COLOR[latestStatus] || C.primaryLt;

  const counts = { improving: 0, stable: 0, worsening: 0, critical: 0 };
  notes.forEach(n => { const k = n.status?.toLowerCase(); if (counts[k] !== undefined) counts[k]++; });

  return (
    <div className="pn-row" style={{
      background: open ? "rgba(37,99,235,0.07)" : "rgba(10,25,60,0.35)",
      border: `1px solid ${open ? "rgba(59,130,246,0.22)" : "rgba(59,130,246,0.1)"}`,
      borderRadius: 14, marginBottom: 10, overflow: "hidden",
    }}>
      {/* Header row */}
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer", userSelect: "none" }}>
        <Av name={patientName} accent={col} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{patientName}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
            Latest: <span style={{ color: col, fontWeight: 600 }}>{latest?.status || "—"}</span>
            {latest?.createdAt ? ` · ${timeAgo(latest.createdAt)}` : ""}
          </div>
        </div>
        {/* Status mini pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: STATUS_BG[k], border: `1px solid ${STATUS_BD[k]}`, color: STATUS_COLOR[k] }}>
              {v} {k}
            </div>
          ))}
        </div>
        {/* Note count */}
        <div style={{ background: C.primaryDim, border: `1px solid ${C.primaryBd}`, borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 700, color: C.primaryLt }}>
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
        {/* Chevron */}
        <div style={{ transition: "transform 0.22s", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: C.textDim }}>
          <Icon name="chevron" size={16} color={C.textDim} />
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <div style={{ height: 14 }} />
          {notes.length >= 2
            ? <StatusTrendChart notes={notes} />
            : (
              <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 12, padding: "14px 18px", marginBottom: 18, fontSize: 12, color: C.textDim, textAlign: "center" }}>
                Add more notes to see the status trend chart
              </div>
            )
          }
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.1px", marginBottom: 10 }}>
            Notes — newest first
          </div>
          <div>
            {sorted.map((n, i) => <NoteCard key={n._id || i} note={n} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PROGRESS NOTES TAB
// ════════════════════════════════════════════════════════════════════════════════
function ProgressTab() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  const load = async () => {
    setLoading(true);

    const pd = await safeFetch(`${API}/patients`);
    const patients = pd?.patients || [];
    const pMap = Object.fromEntries(patients.map(p => [p._id.toString(), p]));

    const allNotes = [];

    // Try flat /progress-notes endpoint first
    const directAll = await safeFetch(`${API}/progress-notes`);
    if (directAll?.notes?.length > 0) {
      allNotes.push(...directAll.notes.map(n => {
        const pid = n.patientId?.toString() || n.patient?._id?.toString() || n.patient?.toString();
        return { ...n, _p: pMap[pid] || null };
      }));
    } else {
      // Fall back to per-patient fetches (tries three URL patterns)
      await Promise.all(patients.map(async p => {
        let d = await safeFetch(`${API}/progress-notes/${p._id}`);
        if (!d?.notes && Array.isArray(d)) d = { notes: d };
        if (d?.notes?.length > 0) { allNotes.push(...d.notes.map(n => ({ ...n, _p: p }))); return; }

        d = await safeFetch(`${API}/progress-notes/patient/${p._id}`);
        if (!d?.notes && Array.isArray(d)) d = { notes: d };
        if (d?.notes?.length > 0) { allNotes.push(...d.notes.map(n => ({ ...n, _p: p }))); return; }

        d = await safeFetch(`${API}/patients/${p._id}/progress-notes`);
        if (!d?.notes && Array.isArray(d)) d = { notes: d };
        if (d?.notes?.length > 0) allNotes.push(...d.notes.map(n => ({ ...n, _p: p })));
      }));
    }

    // Deduplicate by _id
    const seen = new Set();
    const unique = allNotes.filter(n => {
      if (!n._id || seen.has(n._id.toString())) return false;
      seen.add(n._id.toString()); return true;
    });

    // Group by patient
    const g = {};
    unique.forEach(n => {
      const pid = n.patientId?.toString() || n.patient?._id?.toString() || n._p?._id?.toString() || "unknown";
      const name = n._p?.name || n.patient?.name || "Unknown Patient";
      if (!g[pid]) g[pid] = { name, notes: [] };
      g[pid].notes.push(n);
    });

    setGrouped(g);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spin />;

  const totalNotes    = Object.values(grouped).reduce((a, g) => a + g.notes.length, 0);
  const totalPatients = Object.keys(grouped).length;

  const statusCounts = { all: totalPatients };
  ["improving","stable","worsening","critical"].forEach(s => {
    statusCounts[s] = Object.values(grouped).filter(g => g.notes.some(n => n.status?.toLowerCase() === s)).length;
  });

  const visibleGroups = Object.entries(grouped).filter(([, g]) => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || g.notes.some(n => n.status?.toLowerCase() === filter);
    return matchSearch && matchFilter;
  });

  return (
    <>
      <SHead icon="notes" title="Progress Notes" count={totalNotes} sub={`${totalPatients} patient${totalPatients !== 1 ? "s" : ""}`} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search patients by name…" />

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
        {["all","improving","stable","worsening","critical"].map(k => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "5px 14px", borderRadius: 20, border: "1px solid",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            background: filter === k ? (k === "all" ? C.primaryDim : STATUS_BG[k]) : "rgba(255,255,255,0.04)",
            color:      filter === k ? (k === "all" ? C.primaryLt  : STATUS_COLOR[k]) : C.textDim,
            borderColor: filter === k ? (k === "all" ? C.primaryBd : STATUS_BD[k]) : "rgba(255,255,255,0.08)",
          }}>
            {k.charAt(0).toUpperCase() + k.slice(1)} ({statusCounts[k] ?? 0})
          </button>
        ))}
      </div>

      {visibleGroups.length === 0 ? (
        <div style={{ padding: "60px 40px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: C.primaryDim, border: `1px solid ${C.primaryBd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="notes" size={22} color={C.textDim} />
          </div>
          <div style={{ color: C.textDim, fontSize: 13, fontWeight: 600 }}>
            {totalPatients === 0 ? "No progress notes found" : "No patients match your filters"}
          </div>
        </div>
      ) : (
        visibleGroups.map(([pid, g]) => (
          <PatientNoteRow key={pid} patientName={g.name} notes={g.notes} />
        ))
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "overview",   label: "Overview",       icon: "dashboard" },
  { id: "caregivers", label: "Caregivers",     icon: "users"     },
  { id: "doctors",    label: "Doctors",        icon: "doctor"    },
  { id: "patients",   label: "Patients",       icon: "patient"   },
  { id: "sessions",   label: "Sessions",       icon: "calendar"  },
  { id: "progress",   label: "Progress Notes", icon: "notes"     },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ doctors: 0, caregivers: 0, patients: 0, sessions: 0 });

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    (async () => {
      const [dd, cd, pd] = await Promise.all([
        safeFetch(`${API}/users?role=doctor`),
        safeFetch(`${API}/users?role=caregiver`),
        safeFetch(`${API}/patients`),
      ]);
      const patients = pd?.patients || [];
      let sessions = 0;
      await Promise.all(patients.slice(0, 20).map(async p => {
        const sd = await safeFetch(`${API}/medical-sessions/patient/${p._id}`);
        sessions += sd?.sessions?.length || 0;
      }));
      setStats({ doctors: dd?.users?.length || 0, caregivers: cd?.users?.length || 0, patients: patients.length, sessions });
    })();
  }, []);

  const logout = () => {
    if (window.confirm("Log out of LifeConnect Admin?")) { localStorage.removeItem("token"); window.location.href = "/login"; }
  };

  const cardAccents = {
    doctors:    "#34d399",
    caregivers: C.primaryLt,
    patients:   "#818cf8",
    sessions:   "#38bdf8",
  };

  return (
    <div className="lc-wrap" style={{ position: "fixed", inset: 0, overflow: "auto", background: C.bgBase }}>

      {/* Background atmosphere */}
      <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse 75% 55% at 5% 0%, ${C.bgGrad1} 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 95% 100%, ${C.bgGrad2} 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(59,130,246,0.07) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />

      {/* ── HEADER ── */}
      <div className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 100, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(59,130,246,0.14)" }}>
        <div style={{ padding: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, paddingBottom: 12 }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLt})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.primary}55` }}>
                <Icon name="shield" size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.3px" }}>LifeConnect</div>
                <div style={{ fontSize: 9.5, color: C.textDim, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase" }}>Admin Console</div>
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 13px", background: C.primaryDim, border: `1px solid ${C.primaryBd}`, borderRadius: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 7px #34d399", animation: "pulse 2.5s ease infinite" }} />
                <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>System Admin</span>
              </div>
              <button onClick={logout} className="lc-btn" style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: 9, color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                <Icon name="logout" size={14} color="#f87171" /> Logout
              </button>
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} className="lc-tab" onClick={() => setTab(t.id)} style={{
                padding: "10px 16px", background: "transparent", border: "none",
                borderBottom: tab === t.id ? `2.5px solid ${C.primaryLt}` : "2.5px solid transparent",
                color: tab === t.id ? C.primaryLt : C.textDim,
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer",
                whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <Icon name={t.icon} size={14} color={tab === t.id ? C.primaryLt : C.textDim} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "28px 32px", maxWidth: 1600, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {tab === "overview" && (
          <>
            <div style={{ marginBottom: 26 }}>
              <h2 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>System Overview</h2>
              <p style={{ margin: 0, color: C.textDim, fontSize: 14 }}>Monitor all LifeConnect activity</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 26 }}>
              <StatCard icon="doctor"   label="Doctors"    value={stats.doctors}    accent={cardAccents.doctors}    onClick={() => setTab("doctors")} />
              <StatCard icon="users"    label="Caregivers" value={stats.caregivers} accent={cardAccents.caregivers} onClick={() => setTab("caregivers")} />
              <StatCard icon="patient"  label="Patients"   value={stats.patients}   accent={cardAccents.patients}   onClick={() => setTab("patients")} />
              <StatCard icon="calendar" label="Sessions"   value={stats.sessions}   accent={cardAccents.sessions}   sub="Booked" onClick={() => setTab("sessions")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Quick Access */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 16 }}>Quick Access</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {TABS.filter(t => t.id !== "overview").map(t => (
                    <button key={t.id} className="lc-nav-item" onClick={() => setTab(t.id)}
                      style={{ padding: "10px 13px", background: C.primaryDim, border: `1px solid ${C.primaryBd}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.textMid, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${C.primary}28`; e.currentTarget.style.color = C.primaryLt; e.currentTarget.style.borderColor = `${C.primary}55`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.primaryDim; e.currentTarget.style.color = C.textMid; e.currentTarget.style.borderColor = C.primaryBd; }}>
                      <Icon name={t.icon} size={13} color="currentColor" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Summary */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 16 }}>System Summary</div>
                {[
                  { l: "Doctors registered",     v: stats.doctors,    a: cardAccents.doctors,    i: "doctor"   },
                  { l: "Caregivers registered",   v: stats.caregivers, a: cardAccents.caregivers, i: "users"    },
                  { l: "Patients in system",      v: stats.patients,   a: cardAccents.patients,   i: "patient"  },
                  { l: "Medical sessions booked", v: stats.sessions,   a: cardAccents.sessions,   i: "calendar" },
                ].map(item => (
                  <div key={item.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(59,130,246,0.07)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.a}18`, border: `1px solid ${item.a}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={item.i} size={13} color={item.a} />
                      </div>
                      <span style={{ fontSize: 13, color: C.textMid }}>{item.l}</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 22, color: item.a }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "caregivers" && <UsersTab role="caregiver" />}
        {tab === "doctors"    && <UsersTab role="doctor" />}
        {tab === "patients"   && <PatientsTab />}
        {tab === "sessions"   && <SessionsTab />}
        {tab === "progress"   && <ProgressTab />}
      </div>
    </div>
  );
}