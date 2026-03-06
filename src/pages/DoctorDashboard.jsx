import { useState, useEffect } from "react";
import {
  ProgressNotesModal,
  PrescriptionModal,
  PatientCardActions,
} from "../components/admin/DoctorExtensions";

// ─────────────────────────────────────────────
// API Configuration
// ─────────────────────────────────────────────
const API_BASE_URL = "http://localhost:5003/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ─────────────────────────────────────────────
// Global Styles Injection
// ─────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    background: #F0F5FF;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: scale(0.97) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #BFD0F0; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #93B0E8; }

  input, select, textarea, button { font-family: 'DM Sans', sans-serif; }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #2563EB !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
  }

  .btn-hover:hover { filter: brightness(0.93); transform: translateY(-1px); transition: all 0.18s ease; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,99,235,0.13) !important; transition: all 0.22s ease; }
`;

function InjectStyles() {
  useEffect(() => {
    const id = "dd-global-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = globalCSS;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────
function Spinner({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid #DBEAFE`,
      borderTop: `3px solid #2563EB`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      margin: "0 auto",
    }} />
  );
}

// ─────────────────────────────────────────────
// Patient Details Modal (from pending request)
// ─────────────────────────────────────────────
function PatientDetailsModalFromRequest({ patient, requestedBy, message, onClose, onAccept, onReject, processing }) {
  return (
    <div style={S.overlay3} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 620, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.modalHeader, background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Patient Details</span>
          <button style={S.closeWhiteBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
          <div style={S.avatarRow}>
            <div style={{ ...S.avatarLg, background: "linear-gradient(135deg, #2563EB, #60A5FA)" }}>
              {patient.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1E3A8A", marginBottom: 4 }}>{patient.name}</h3>
              <p style={S.metaText}>{patient.age} years • {patient.gender}</p>
              {patient.condition && <span style={S.conditionTag}>{patient.condition}</span>}
            </div>
          </div>

          <div style={S.divider} />

          <div style={S.infoSection}>
            <h4 style={S.sectionHeading}>📧 Contact Information</h4>
            <div style={S.twoCol}>
              {patient.email && <InfoRow label="Email" value={patient.email} />}
              {patient.phone && <InfoRow label="Phone" value={patient.phone} />}
              {patient.address && <InfoRow label="Address" value={patient.address} />}
            </div>
          </div>

          <div style={S.infoSection}>
            <h4 style={S.sectionHeading}>🏥 Medical Information</h4>
            <div style={S.twoCol}>
              <InfoRow label="Condition" value={patient.condition || "—"} />
              {patient.medicalHistory && <InfoRow label="Medical History" value={patient.medicalHistory} full />}
            </div>
          </div>

          <div style={{ ...S.infoSection, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <h4 style={S.sectionHeading}>📝 Request Information</h4>
            <InfoRow label="Requested by" value={requestedBy?.fullName || requestedBy?.email || "Unknown"} />
            {message && <InfoRow label="Message" value={message} full />}
          </div>
        </div>

        <div style={S.modalFooter}>
          <button className="btn-hover" style={S.btnGhost} onClick={onClose} disabled={processing}>Close</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-hover" style={{ ...S.btnDanger, ...(processing ? S.disabledBtn : {}) }} onClick={onReject} disabled={processing}>
              {processing ? "…" : "✕  Reject"}
            </button>
            <button className="btn-hover" style={{ ...S.btnSuccess, ...(processing ? S.disabledBtn : {}) }} onClick={onAccept} disabled={processing}>
              {processing ? "…" : "✓  Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, full }) {
  return (
    <div style={{ ...(full ? { gridColumn: "1/-1" } : {}), marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B9FD4", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1E3A8A" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pending Requests Modal
// ─────────────────────────────────────────────
function PendingRequestsModal({ onClose, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchPending = async () => {
    try {
      setError(""); setLoading(true);
      const res = await fetch(`${API_BASE_URL}/doctor-requests/pending`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load");
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) { setError(e.message); setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const doAction = async (id, action) => {
    try {
      setProcessingId(id); setError("");
      const res = await fetch(`${API_BASE_URL}/doctor-requests/${id}/${action}`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Failed to ${action}`);
      setSelectedRequest(null);
      await fetchPending();
      onChanged?.();
      alert(data.message || "Done");
    } catch (e) { setError(e.message); }
    finally { setProcessingId(null); }
  };

  const timeAgo = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso), now = new Date(), diff = now - d;
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <div style={S.overlay2} onClick={onClose}>
        <div style={{ ...S.modal, maxWidth: 780, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1E3A8A" }}>🔔  Pending Requests</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn-hover" style={S.btnOutline} onClick={fetchPending} disabled={loading}>
                {loading ? "…" : "↻  Refresh"}
              </button>
              <button style={S.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>

          <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "calc(90vh - 130px)" }}>
            {error && <ErrorBanner msg={error} onRetry={fetchPending} />}

            {loading ? (
              <div style={S.centerBox}><Spinner /><p style={S.muted}>Loading requests…</p></div>
            ) : requests.length === 0 ? (
              <div style={S.centerBox}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
                <h3 style={S.emptyTitle}>No Pending Requests</h3>
                <p style={S.muted}>You have no new patient assignment requests.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {requests.map(r => {
                  const name = r.patient?.name || "Unknown Patient";
                  const by = r.requestedBy?.fullName || r.requestedBy?.email || "Unknown";
                  const busy = processingId === r._id;
                  return (
                    <div key={r._id} style={S.reqCard} className="card-hover">
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={S.avatarMd}>{name[0]?.toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#1E3A8A" }}>{name}</span>
                            <span style={S.timeTag}>{timeAgo(r.createdAt)}</span>
                          </div>
                          <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#4B7DD4", fontWeight: 500, marginBottom: 6 }}>
                            <span>Age: {r.patient?.age ?? "—"}</span>
                            <span>•</span>
                            <span>{r.patient?.gender ?? "—"}</span>
                          </div>
                          {r.patient?.condition && <span style={S.conditionTag}>{r.patient.condition}</span>}
                          <div style={{ marginTop: 8, fontSize: 13, color: "#1E40AF" }}>
                            Requested by: <strong>{by}</strong>
                          </div>
                          {r.message && (
                            <div style={S.messageBubble}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 3 }}>MESSAGE</div>
                              <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.5 }}>{r.message}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTop: "1px solid #DBEAFE" }}>
                        <button className="btn-hover" style={{ ...S.btnOutlineBlue, marginRight: "auto" }} onClick={() => setSelectedRequest(r)}>
                          👁  View Details
                        </button>
                        <button className="btn-hover" style={{ ...S.btnDanger, ...(busy ? S.disabledBtn : {}) }} onClick={() => doAction(r._id, "reject")} disabled={busy}>
                          {busy ? "…" : "✕  Reject"}
                        </button>
                        <button className="btn-hover" style={{ ...S.btnPrimary, ...(busy ? S.disabledBtn : {}) }} onClick={() => doAction(r._id, "accept")} disabled={busy}>
                          {busy ? "…" : "✓  Accept"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={S.modalFooter}>
            <button className="btn-hover" style={S.btnGhost} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <PatientDetailsModalFromRequest
          patient={selectedRequest.patient}
          requestedBy={selectedRequest.requestedBy}
          message={selectedRequest.message}
          onClose={() => setSelectedRequest(null)}
          onAccept={() => doAction(selectedRequest._id, "accept")}
          onReject={() => doAction(selectedRequest._id, "reject")}
          processing={processingId === selectedRequest._id}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Add Patient Modal
// ─────────────────────────────────────────────
function AddPatientModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", age: "", gender: "", address: "", phone: "", medicalHistory: "", condition: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/patients`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { alert("Patient added successfully!"); onSuccess(); }
      else setError(data.message || "Failed to add patient");
    } catch { setError("Error adding patient. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.overlay2} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 680, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1E3A8A" }}>➕  Add New Patient</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(90vh - 130px)" }}>
            {error && <ErrorBanner msg={error} />}

            <SectionLabel>Personal Information</SectionLabel>
            <FormField label="Full Name *">
              <input style={S.input} value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Patient's full name" required />
            </FormField>
            <div style={S.twoCol}>
              <FormField label="Age *">
                <input style={S.input} type="number" value={formData.age} onChange={e => set("age", e.target.value)} min="1" max="120" required />
              </FormField>
              <FormField label="Gender *">
                <select style={S.input} value={formData.gender} onChange={e => set("gender", e.target.value)} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </FormField>
            </div>

            <SectionLabel>Login Credentials</SectionLabel>
            <FormField label="Email *">
              <input style={S.input} type="email" value={formData.email} onChange={e => set("email", e.target.value)} required />
            </FormField>
            <FormField label="Password *">
              <input style={S.input} type="password" value={formData.password} onChange={e => set("password", e.target.value)} minLength="6" required />
            </FormField>

            <SectionLabel>Contact & Medical</SectionLabel>
            <div style={S.twoCol}>
              <FormField label="Phone">
                <input style={S.input} value={formData.phone} onChange={e => set("phone", e.target.value)} />
              </FormField>
              <FormField label="Condition">
                <input style={S.input} value={formData.condition} onChange={e => set("condition", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Address">
              <input style={S.input} value={formData.address} onChange={e => set("address", e.target.value)} />
            </FormField>
            <FormField label="Medical History">
              <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} value={formData.medicalHistory} onChange={e => set("medicalHistory", e.target.value)} />
            </FormField>
          </div>

          <div style={S.modalFooter}>
            <button type="button" className="btn-hover" style={S.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-hover" style={{ ...S.btnPrimary, minWidth: 130 }} disabled={loading}>
              {loading ? "Adding…" : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Patient Details Modal
// ─────────────────────────────────────────────
function PatientDetailsModal({ patient, onClose }) {
  return (
    <div style={S.overlay2} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 620, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1E3A8A" }}>Patient Details</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(90vh - 120px)" }}>
          <div style={S.avatarRow}>
            <div style={{ ...S.avatarLg, background: "linear-gradient(135deg, #2563EB, #60A5FA)" }}>
              {patient.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1E3A8A" }}>{patient.name}</h3>
              {patient.condition && <span style={S.conditionTag}>{patient.condition}</span>}
            </div>
          </div>
          <div style={S.divider} />
          <div style={S.twoCol}>
            <InfoRow label="Age" value={patient.age} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Email" value={patient.email || "—"} />
            <InfoRow label="Condition" value={patient.condition || "—"} />
          </div>
          <InfoRow label="Medical History" value={patient.medicalHistory || "No medical history recorded"} full />
        </div>

        <div style={S.modalFooter}>
          <button className="btn-hover" style={S.btnPrimary} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mini Calendar
// ─────────────────────────────────────────────
function MiniCalendar({ sessions, selectedDate, onSelectDate }) {
  const [cur, setCur] = useState(new Date());
  const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const firstDay = new Date(cur.getFullYear(), cur.getMonth(), 1).getDay();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const getSessions = (day) => {
    const ds = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return sessions.filter(s => (s.requestedDate||"").split("T")[0]===ds || (s.confirmedDate||"").split("T")[0]===ds);
  };

  const isToday = d => {
    const t = new Date();
    return d===t.getDate() && cur.getMonth()===t.getMonth() && cur.getFullYear()===t.getFullYear();
  };

  const fmt = d => `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 20, border: "1.5px solid #DBEAFE", boxShadow: "0 2px 12px rgba(37,99,235,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button style={S.calNavBtn} onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth()-1))}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1E3A8A" }}>{months[cur.getMonth()]} {cur.getFullYear()}</span>
        <button style={S.calNavBtn} onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth()+1))}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
        {days.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#93B0E8", padding: "6px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_,i) => {
          const day = i+1, ss = getSessions(day);
          const hasPending = ss.some(x=>x.status==="pending");
          const hasApproved = ss.some(x=>x.status==="approved");
          const hasDone = ss.some(x=>x.status==="completed");
          const ds = fmt(day), isSel = selectedDate===ds, isT = isToday(day);
          return (
            <div key={day} onClick={() => onSelectDate(ds)} style={{
              padding: "8px 4px", textAlign: "center", borderRadius: 8, cursor: "pointer",
              minHeight: 42, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", transition: "all 0.15s",
              border: isSel ? "2px solid #2563EB" : "2px solid transparent",
              background: isSel ? "#DBEAFE" : isT ? "#EFF6FF" : ss.length>0 ? "#F8FAFF" : "transparent",
            }}>
              <span style={{ fontSize: 13, fontWeight: isSel||isT ? 700 : 500, color: isSel ? "#1D4ED8" : "#1E3A8A" }}>{day}</span>
              {ss.length > 0 && (
                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                  {hasPending && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", display: "block" }} />}
                  {hasApproved && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "block" }} />}
                  {hasDone && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366F1", display: "block" }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid #DBEAFE" }}>
        {[["#F59E0B","Pending"],["#10B981","Approved"],["#6366F1","Completed"]].map(([c,l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B9FD4", fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Accept Session Modal
// ─────────────────────────────────────────────
function AcceptSessionModal({ session, onClose, onAccept }) {
  const [useOrig, setUseOrig] = useState(true);
  const [date, setDate] = useState(session.requestedDate || "");
  const [time, setTime] = useState(session.requestedTime || "");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onAccept({ confirmedDate: useOrig ? session.requestedDate : date, confirmedTime: useOrig ? session.requestedTime : time, sessionLink: link });
    setLoading(false);
  };

  return (
    <div style={S.overlay3} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 520, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.modalHeader, background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", borderBottom: "1.5px solid #6EE7B7" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#065F46" }}>✓  Accept Session</span>
          <button style={{ ...S.closeBtn, color: "#065F46", borderColor: "#6EE7B7" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(90vh - 130px)" }}>
          <div style={S.patientMiniCard}>
            <div style={{ ...S.avatarMd, background: "linear-gradient(135deg, #059669, #34D399)" }}>{session.patient?.name?.[0]?.toUpperCase() || "P"}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1E3A8A" }}>{session.patient?.name}</div>
              <div style={{ fontSize: 13, color: "#6B9FD4" }}>Age: {session.patient?.age} • {session.patient?.condition || "No condition"}</div>
            </div>
          </div>

          <div style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>REQUESTED DATE & TIME</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#78350F" }}>{session.requestedDate} at {session.requestedTime}</div>
            {session.notes && <div style={{ marginTop: 8, fontSize: 13, color: "#92400E", fontStyle: "italic" }}>📝 {session.notes}</div>}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["✓  Accept Requested Time", true], ["📝  Suggest Different Time", false]].map(([label, val]) => (
              <button key={label} onClick={() => setUseOrig(val)} style={{
                flex: 1, padding: "12px 10px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: useOrig === val ? "2px solid #059669" : "2px solid #DBEAFE",
                background: useOrig === val ? "#D1FAE5" : "white",
                color: useOrig === val ? "#065F46" : "#6B9FD4",
              }}>{label}</button>
            ))}
          </div>

          {!useOrig && (
            <div style={{ background: "#F0F7FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={S.twoCol}>
                <FormField label="Date">
                  <input type="date" style={S.input} value={date} onChange={e => setDate(e.target.value)} />
                </FormField>
                <FormField label="Time">
                  <input type="time" style={S.input} value={time} onChange={e => setTime(e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          <FormField label="🔗 Meeting Link (Optional)">
            <input type="url" style={S.input} placeholder="https://zoom.us/j/... or Google Meet link" value={link} onChange={e => setLink(e.target.value)} />
          </FormField>
        </div>

        <div style={S.modalFooter}>
          <button className="btn-hover" style={S.btnGhost} onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-hover" style={S.btnSuccess} onClick={handleSubmit} disabled={loading}>
            {loading ? "Accepting…" : "✓  Confirm & Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reject Session Modal
// ─────────────────────────────────────────────
function RejectSessionModal({ session, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div style={S.overlay3} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 460, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.modalHeader, background: "linear-gradient(135deg, #FEE2E2, #FECACA)", borderBottom: "1.5px solid #FCA5A5" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#991B1B" }}>✕  Reject Session</span>
          <button style={{ ...S.closeBtn, color: "#991B1B", borderColor: "#FCA5A5" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "24px 28px" }}>
          <div style={S.patientMiniCard}>
            <div style={{ ...S.avatarMd, background: "linear-gradient(135deg, #DC2626, #EF4444)" }}>{session.patient?.name?.[0]?.toUpperCase() || "P"}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1E3A8A" }}>{session.patient?.name}</div>
              <div style={{ fontSize: 13, color: "#6B9FD4" }}>Requested: {session.requestedDate} at {session.requestedTime}</div>
            </div>
          </div>
          <FormField label="Reason for rejection (optional)">
            <textarea style={{ ...S.input, minHeight: 100, resize: "vertical" }} placeholder="Enter reason…" value={reason} onChange={e => setReason(e.target.value)} />
          </FormField>
        </div>
        <div style={S.modalFooter}>
          <button className="btn-hover" style={S.btnGhost} onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-hover" style={{ ...S.btnDanger, minWidth: 140 }} onClick={async () => { setLoading(true); await onReject(reason); setLoading(false); }} disabled={loading}>
            {loading ? "Rejecting…" : "✕  Reject Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Medical Data Modal
// ─────────────────────────────────────────────
function MedicalDataModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("sessions");
  const [viewMode, setViewMode] = useState("list");
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [acceptModal, setAcceptModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      const { id: doctorId } = JSON.parse(atob(token.split(".")[1]));
      const [sr, nr] = await Promise.all([
        fetch(`${API_BASE_URL}/medical-sessions/doctor/${doctorId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/medical-notes/doctor/${doctorId}`, { headers: getAuthHeaders() }),
      ]);
      const sd = await sr.json(), nd = await nr.json();
      if (sd.success) setSessions(sd.sessions || []);
      if (nd.success) setNotes(nd.notes || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleAccept = async (id, data) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/medical-sessions/${id}/accept`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Accept failed");
      alert("✓ Session accepted!"); setAcceptModal(null); await fetchData();
    } catch (e) { alert("Error: " + e.message); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (id, reason) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/medical-sessions/${id}/reject`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ rejectionReason: reason }) });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Reject failed");
      alert("Session rejected"); setRejectModal(null); await fetchData();
    } catch (e) { alert("Error: " + e.message); }
    finally { setProcessingId(null); }
  };

  const handleComplete = async (id) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/medical-sessions/${id}/complete`, { method: "POST", headers: getAuthHeaders() });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Complete failed");
      alert("✓ Marked as completed!"); await fetchData();
    } catch (e) { alert("Error: " + e.message); }
    finally { setProcessingId(null); }
  };

  const handleSendReply = async (noteId) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/medical-notes/${noteId}/reply`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ reply: replyText }) });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      setReplyText(""); setReplyingToId(null); await fetchData();
    } catch (e) { alert("Error: " + e.message); }
    finally { setReplyLoading(false); }
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const statusMap = {
    pending:   { bg: "#FFFBEB", color: "#D97706", label: "⏳ Pending" },
    approved:  { bg: "#D1FAE5", color: "#059669", label: "✓ Approved" },
    rejected:  { bg: "#FEE2E2", color: "#DC2626", label: "✕ Rejected" },
    completed: { bg: "#E0E7FF", color: "#4F46E5", label: "✓ Completed" },
  };

  const filteredSessions = selectedDate
    ? sessions.filter(s => (s.requestedDate||"").split("T")[0]===selectedDate || (s.confirmedDate||"").split("T")[0]===selectedDate)
    : sessions;

  return (
    <>
      <div style={S.overlay2} onClick={onClose}>
        <div style={{ ...S.modal, maxWidth: 960, animation: "slideIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1E3A8A" }}>📋  Medical Sessions & Notes</span>
            <button style={S.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div style={{ display: "flex", borderBottom: "1.5px solid #DBEAFE", background: "#fff" }}>
            {[["sessions",`📅 Sessions (${sessions.length})`],["notes",`📝 Notes (${notes.length})`]].map(([k,label]) => (
              <button key={k} onClick={() => setActiveTab(k)} style={{
                flex: 1, padding: "14px 16px", border: "none", background: "transparent",
                fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                color: activeTab===k ? "#1D4ED8" : "#6B9FD4",
                borderBottom: activeTab===k ? "3px solid #2563EB" : "3px solid transparent",
              }}>{label}</button>
            ))}
          </div>

          {activeTab==="sessions" && !loading && sessions.length>0 && (
            <div style={{ display: "flex", gap: 8, padding: "10px 20px", background: "#F8FBFF", borderBottom: "1px solid #DBEAFE", alignItems: "center" }}>
              {[["list","📋 List"],["calendar","📆 Calendar"]].map(([m,l]) => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: viewMode===m ? "2px solid #2563EB" : "2px solid #DBEAFE",
                  background: viewMode===m ? "#DBEAFE" : "#fff",
                  color: viewMode===m ? "#1D4ED8" : "#6B9FD4",
                }}>{l}</button>
              ))}
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 8, border: "none", background: "#FEE2E2", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#DC2626" }}>
                  ✕ Clear Filter
                </button>
              )}
            </div>
          )}

          <div style={{ padding: 20, overflowY: "auto", flex: 1, maxHeight: "calc(90vh - 200px)", background: "#F8FBFF" }}>
            {error && <ErrorBanner msg={error} onRetry={fetchData} />}

            {loading ? (
              <div style={S.centerBox}><Spinner /><p style={S.muted}>Loading data…</p></div>
            ) : activeTab==="sessions" ? (
              <>
                {viewMode==="calendar" && <MiniCalendar sessions={sessions} selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
                {filteredSessions.length === 0 ? (
                  <div style={S.centerBox}>
                    <div style={{ fontSize: 52 }}>📅</div>
                    <h3 style={S.emptyTitle}>{selectedDate ? "No Sessions on this Date" : "No Session Requests"}</h3>
                    <p style={S.muted}>{selectedDate ? "Select a different date or clear the filter" : "You have no session requests yet."}</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 14 }}>
                    {filteredSessions.map(sess => {
                      const st = statusMap[sess.status] || statusMap.pending;
                      const busy = processingId === sess._id;
                      return (
                        <div key={sess._id} style={S.sessCard} className="card-hover">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #DBEAFE" }}>
                            <div>
                              <h3 style={{ fontWeight: 700, fontSize: 17, color: "#1E3A8A", marginBottom: 3 }}>{sess.patient?.name || "Unknown"}</h3>
                              <span style={{ fontSize: 13, color: "#6B9FD4" }}>Age: {sess.patient?.age} • {sess.patient?.condition}</span>
                            </div>
                            <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 10 }}>
                            <InfoItem label="Requested Date" value={sess.requestedDate} />
                            <InfoItem label="Requested Time" value={sess.requestedTime} />
                            <InfoItem label="Requested by" value={sess.caregiver?.fullName || "Unknown"} />
                            <InfoItem label="Created" value={fmtDate(sess.createdAt)} />
                          </div>

                          {sess.notes && (
                            <div style={{ background: "#F0F7FF", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B9FD4" }}>NOTES</span>
                              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>{sess.notes}</p>
                            </div>
                          )}

                          {sess.status==="approved" && (
                            <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>✓ Confirmed: {sess.confirmedDate || sess.requestedDate} at {sess.confirmedTime || sess.requestedTime}</span>
                              {sess.sessionLink && <a href={sess.sessionLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 700 }}>🔗 Join →</a>}
                            </div>
                          )}

                          {sess.status==="rejected" && sess.rejectionReason && (
                            <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 600 }}>✕ Reason: {sess.rejectionReason}</span>
                            </div>
                          )}

                          {sess.status==="pending" && (
                            <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #DBEAFE" }}>
                              <button className="btn-hover" style={{ ...S.btnSuccess, flex: 1, ...(busy?S.disabledBtn:{}) }} onClick={() => setAcceptModal(sess)} disabled={busy}>✓ Accept</button>
                              <button className="btn-hover" style={{ ...S.btnDanger, flex: 1, ...(busy?S.disabledBtn:{}) }} onClick={() => setRejectModal(sess)} disabled={busy}>✕ Reject</button>
                            </div>
                          )}
                          {sess.status==="approved" && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #DBEAFE" }}>
                              <button className="btn-hover" style={{ ...S.btnPrimary, width: "100%", ...(busy?S.disabledBtn:{}) }} onClick={() => handleComplete(sess._id)} disabled={busy}>
                                {busy ? "…" : "✓ Mark as Completed"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              notes.length === 0 ? (
                <div style={S.centerBox}>
                  <div style={{ fontSize: 52 }}>📝</div>
                  <h3 style={S.emptyTitle}>No Medical Notes</h3>
                  <p style={S.muted}>No medical notes have been added yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {notes.map(note => (
                    <div key={note._id} style={S.noteCard} className="card-hover">
                      <div style={{ display: "flex", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #DBEAFE" }}>
                        <div style={S.avatarMd}>{note.patient?.name?.[0]?.toUpperCase() || "P"}</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1E3A8A", marginBottom: 2 }}>{note.patient?.name || "Unknown Patient"}</h3>
                          <p style={{ fontSize: 12, color: "#6B9FD4", fontWeight: 500 }}>
                            Added by: {note.caregiver?.fullName || "Unknown"} • {fmtDate(note.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div style={{ background: "#F0F7FF", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                        <p style={{ margin: 0, color: "#1E40AF", lineHeight: 1.6, fontSize: 14 }}>{note.note}</p>
                      </div>

                      {note.doctorReply && (
                        <div style={{ background: "linear-gradient(135deg, #D1FAE5, #ECFDF5)", border: "1.5px solid #6EE7B7", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#065F46" }}>🩺 DOCTOR'S REPLY</span>
                            <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600 }}>{note.doctorReplyAt ? fmtDate(note.doctorReplyAt) : ""}</span>
                          </div>
                          <p style={{ margin: 0, color: "#064E3B", fontSize: 14, lineHeight: 1.6 }}>{note.doctorReply}</p>
                          <button onClick={() => { setReplyingToId(note._id); setReplyText(note.doctorReply); }} style={{ marginTop: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, background: "none", border: "1.5px solid #34D399", borderRadius: 6, color: "#065F46", cursor: "pointer" }}>
                            ✏️ Edit Reply
                          </button>
                        </div>
                      )}

                      {replyingToId === note._id ? (
                        <div style={{ background: "#F0F7FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "14px 16px" }}>
                          <p style={{ margin: "0 0 8px 0", fontSize: 12, fontWeight: 800, color: "#1D4ED8" }}>
                            ✍️ {note.doctorReply ? "Edit your reply:" : "Reply to caregiver:"}
                          </p>
                          <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply here…"
                            style={{ ...S.input, width: "100%", resize: "vertical", boxSizing: "border-box", minHeight: 80 }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={S.btnGhost} onClick={() => { setReplyingToId(null); setReplyText(""); }} disabled={replyLoading}>Cancel</button>
                            <button className="btn-hover" style={{ ...S.btnPrimary, ...(replyLoading||!replyText.trim() ? S.disabledBtn : {}) }} onClick={() => handleSendReply(note._id)} disabled={replyLoading || !replyText.trim()}>
                              {replyLoading ? "Sending…" : "📤 Send Reply"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        !note.doctorReply && (
                          <button className="btn-hover" style={S.btnOutlineBlue} onClick={() => { setReplyingToId(note._id); setReplyText(""); }}>
                            💬 Reply to Caregiver
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div style={S.modalFooter}>
            <button className="btn-hover" style={S.btnGhost} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {acceptModal && <AcceptSessionModal session={acceptModal} onClose={() => setAcceptModal(null)} onAccept={d => handleAccept(acceptModal._id, d)} />}
      {rejectModal && <RejectSessionModal session={rejectModal} onClose={() => setRejectModal(null)} onReject={r => handleReject(rejectModal._id, r)} />}
    </>
  );
}

// ─────────────────────────────────────────────
// Utility Components
// ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0E8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4B7DD4", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#93B0E8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1E3A8A" }}>{value || "—"}</div>
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{ background: "#FEE2E2", border: "1.5px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: 10, fontWeight: 600, fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      ⚠️ {msg}
      {onRetry && <button onClick={onRetry} style={{ padding: "5px 10px", background: "#DC2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>Retry</button>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, worsening: 0 });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMedicalDataModal, setShowMedicalDataModal] = useState(false);
  const [progressNotesPatient, setProgressNotesPatient] = useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);

  useEffect(() => { fetchPatients(); fetchPendingCount(); }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor-requests/pending`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setPendingCount(Array.isArray(data.requests) ? data.requests.length : 0);
      else setPendingCount(0);
    } catch { setPendingCount(0); }
  };

  const fetchPatients = async () => {
    try {
      const pRes = await fetch(`${API_BASE_URL}/patients`, { headers: getAuthHeaders() });
      const pData = await pRes.json();

      if (pData.success) {
        const list = pData.patients || [];
        setPatients(list);

        const results = await Promise.allSettled(
          list.map(p =>
            fetch(`${API_BASE_URL}/progress-notes/${p._id}`, { headers: getAuthHeaders() })
              .then(r => r.json())
              .then(d => ({ id: p._id, notes: d.success ? (d.notes || []) : [] }))
              .catch(() => ({ id: p._id, notes: [] }))
          )
        );

        const worseningCount = results.reduce((acc, r) => {
          if (r.status === "fulfilled") {
            const hasWorsening = r.value.notes.some(
              n => typeof n.status === "string" && n.status.toLowerCase() === "worsening"
            );
            return acc + (hasWorsening ? 1 : 0);
          }
          return acc;
        }, 0);

        setStats({
          total: list.length,
          active: list.filter(p => p.isActive !== false).length,
          worsening: worseningCount,
        });
      }
    } catch (e) {
      console.error("fetchPatients error:", e);
    } finally {
      setLoading(false);
    }
  };

  //: Toggle patient active/inactive — persists to DB and updates UI atomically
  const handleToggleActive = async (patient) => {
    const newStatus = patient.isActive === false ? true : false;
    const action = newStatus ? "activate" : "deactivate";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${patient.name}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patient._id}/toggle-active`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
      
        setPatients(prev => {
          const updated = prev.map(p =>
            p._id === patient._id ? { ...p, isActive: newStatus } : p
          );
          // Recompute active count from the freshly updated list
          setStats(s => ({
            ...s,
            active: updated.filter(p => p.isActive !== false).length,
          }));
          return updated;
        });
      } else {
        alert(data.message || "Failed to update patient status");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.condition?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <>
        <InjectStyles />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F0F5FF", gap: 16 }}>
          <Spinner size={48} />
          <p style={{ color: "#4B7DD4", fontSize: 16, fontWeight: 600 }}>Loading dashboard…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <InjectStyles />
      <div style={{ position: "fixed", inset: 0, background: "#EEF3FF", overflow: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <header style={{
          background: "#fff", padding: "0 32px", height: 68,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1.5px solid #DBEAFE", flexShrink: 0,
          boxShadow: "0 2px 12px rgba(37,99,235,0.07)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
              👨‍⚕️
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1E3A8A", lineHeight: 1.2 }}>Doctor Dashboard</h1>
              <p style={{ margin: 0, fontSize: 12, color: "#6B9FD4", fontWeight: 500 }}>Patient Care & Management</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-hover" style={S.headerBtn} onClick={() => setShowMedicalDataModal(true)}>
              📋 Medical Data
            </button>
            <button className="btn-hover" style={{ ...S.headerBtn, position: "relative" }} onClick={() => setShowPendingModal(true)}>
              🔔 Pending
              {pendingCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s infinite", border: "2px solid #fff" }}>
                  {pendingCount}
                </span>
              )}
            </button>
            <button className="btn-hover" style={{ padding: "9px 18px", background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <div style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { icon: "👥", label: "Total Patients", val: stats.total, color: "#2563EB", light: "#DBEAFE", isWorsening: false },
              { icon: "✓",  label: "Active Patients", val: stats.active, color: "#059669", light: "#D1FAE5", isWorsening: false },
              { icon: "📉", label: "Worsening Patients", val: stats.worsening, color: "#DC2626", light: "#FEE2E2", isWorsening: true },
            ].map(({ icon, label, val, color, light, isWorsening }) => (
              <div key={label} title={isWorsening ? "Patients with at least one Worsening progress note" : ""} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, border: isWorsening && val > 0 ? "1.5px solid #FCA5A5" : "1.5px solid #DBEAFE", boxShadow: isWorsening && val > 0 ? "0 2px 14px rgba(220,38,38,0.10)" : "0 2px 10px rgba(37,99,235,0.06)", transition: "box-shadow 0.2s, border-color 0.2s" }} className="card-hover">
                <div style={{ width: 52, height: 52, borderRadius: 12, background: light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B9FD4", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <h2 style={{ margin: "4px 0 0 0", fontSize: 32, fontWeight: 800, color, letterSpacing: "-1px" }}>{val}</h2>
                    {isWorsening && val > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 20, marginTop: 4 }}>needs attention</span>
                    )}
                  </div>
                  <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#B0C4DE", fontWeight: 500 }}>{isWorsening ? "from progress notes" : ""}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Add */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
              <input style={{ ...S.input, paddingLeft: 42, width: "100%", boxSizing: "border-box" }} placeholder="Search patients by name, email, or condition…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn-hover" style={S.btnPrimary} onClick={() => setShowAddModal(true)}>
              + Add Patient
            </button>
          </div>

          {/* Section title */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1E3A8A" }}>My Patients</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6B9FD4", fontWeight: 500 }}>{filtered.length} {filtered.length === 1 ? "patient" : "patients"}</p>
          </div>

          {/* Patient grid */}
          {filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "64px 40px", textAlign: "center", border: "2px dashed #BFDBFE" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏥</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 800, color: "#1E3A8A" }}>{searchQuery ? "No patients found" : "No patients yet"}</h3>
              <p style={{ margin: 0, color: "#6B9FD4", fontWeight: 500 }}>{searchQuery ? "Try adjusting your search" : "Add your first patient to get started"}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map(patient => (
                <div key={patient._id} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #DBEAFE", boxShadow: "0 2px 10px rgba(37,99,235,0.06)", animation: "fadeIn 0.3s ease" }} className="card-hover">
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #EFF6FF" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #60A5FA)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                      {patient.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1E3A8A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{patient.name}</h3>
                      <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#6B9FD4", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{patient.email || "No email"}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    {[
                      ["📅", `Age: ${patient.age}`],
                      ["⚤", patient.gender],
                      patient.condition && ["🏥", patient.condition],
                    ].filter(Boolean).map(([icon, text]) => (
                      <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: "#4B7DD4", fontWeight: 500, borderBottom: "1px solid #F0F7FF" }}>
                        <span>{icon}</span><span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <PatientCardActions
                    patient={patient}
                    onViewDetails={setSelectedPatient}
                    onProgressNotes={setProgressNotesPatient}
                    onPrescription={setPrescriptionPatient}
                    onToggleActive={handleToggleActive}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchPatients(); }} />}
      {selectedPatient && <PatientDetailsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
      {showPendingModal && <PendingRequestsModal onClose={() => { setShowPendingModal(false); fetchPendingCount(); }} onChanged={() => { fetchPatients(); fetchPendingCount(); }} />}
      {showMedicalDataModal && <MedicalDataModal onClose={() => setShowMedicalDataModal(false)} />}
      {progressNotesPatient && <ProgressNotesModal patient={progressNotesPatient} onClose={() => setProgressNotesPatient(null)} />}
      {prescriptionPatient && <PrescriptionModal patient={prescriptionPatient} doctorInfo={{ name: "Rasika", clinic: "LifeConnect Health" }} onClose={() => setPrescriptionPatient(null)} />}
    </>
  );
}


const S = {
  overlay2: { position: "fixed", inset: 0, background: "rgba(15,35,95,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)" },
  overlay3: { position: "fixed", inset: 0, background: "rgba(15,35,95,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, backdropFilter: "blur(8px)" },
  modal: { background: "#fff", borderRadius: 18, width: "92%", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 24px 72px rgba(15,35,95,0.28)", border: "1.5px solid #DBEAFE", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F0F7FF", borderBottom: "1.5px solid #DBEAFE", flexShrink: 0 },
  modalFooter: { padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1.5px solid #DBEAFE", background: "#F8FBFF", flexShrink: 0 },
  btnPrimary: { padding: "10px 22px", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnSuccess: { padding: "10px 22px", background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnDanger: { padding: "10px 22px", background: "#FEE2E2", color: "#DC2626", border: "1.5px solid #FCA5A5", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { padding: "10px 22px", background: "#F3F4F6", color: "#6B7280", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnOutline: { padding: "8px 14px", background: "white", color: "#1E3A8A", border: "1.5px solid #BFDBFE", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnOutlineBlue: { padding: "8px 16px", background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #BFDBFE", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  headerBtn: { padding: "9px 16px", background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #DBEAFE", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  disabledBtn: { opacity: 0.55, cursor: "not-allowed", pointerEvents: "none" },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #DBEAFE", borderRadius: 9, fontSize: 14, fontWeight: 500, color: "#1E3A8A", background: "#FAFCFF", transition: "border-color 0.2s" },
  avatarLg: { width: 72, height: 72, borderRadius: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, flexShrink: 0 },
  avatarMd: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #2563EB, #60A5FA)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 },
  avatarRow: { display: "flex", gap: 16, alignItems: "center", marginBottom: 20 },
  divider: { height: 1, background: "#DBEAFE", margin: "0 0 20px 0" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" },
  infoSection: { background: "#F8FBFF", border: "1.5px solid #DBEAFE", borderRadius: 12, padding: "16px 18px", marginBottom: 16 },
  sectionHeading: { fontSize: 13, fontWeight: 800, color: "#4B7DD4", marginBottom: 12 },
  conditionTag: { display: "inline-block", padding: "4px 12px", background: "#FFFBEB", color: "#D97706", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid #FDE68A" },
  timeTag: { fontSize: 11, color: "#93B0E8", fontWeight: 600, background: "#EFF6FF", padding: "3px 8px", borderRadius: 6 },
  reqCard: { background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #DBEAFE", boxShadow: "0 2px 10px rgba(37,99,235,0.05)" },
  sessCard: { background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #DBEAFE", boxShadow: "0 2px 10px rgba(37,99,235,0.05)" },
  noteCard: { background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #DBEAFE", boxShadow: "0 2px 10px rgba(37,99,235,0.05)" },
  messageBubble: { marginTop: 10, background: "#EFF6FF", borderLeft: "3px solid #3B82F6", padding: "10px 12px", borderRadius: "0 8px 8px 0" },
  patientMiniCard: { display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", background: "#F8FBFF", borderRadius: 12, marginBottom: 20, border: "1.5px solid #DBEAFE" },
  metaText: { margin: "3px 0 8px 0", fontSize: 14, color: "#4B7DD4", fontWeight: 500 },
  centerBox: { border: "2px dashed #BFDBFE", borderRadius: 14, padding: 60, textAlign: "center", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: "#1E3A8A", margin: 0 },
  muted: { fontSize: 14, color: "#6B9FD4", fontWeight: 500, margin: 0 },
  calNavBtn: { width: 34, height: 34, borderRadius: 8, border: "1.5px solid #DBEAFE", background: "#fff", fontSize: 18, cursor: "pointer", color: "#2563EB", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: "1.5px solid #DBEAFE", background: "#fff", fontSize: 16, cursor: "pointer", color: "#6B9FD4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  closeWhiteBtn: { width: 32, height: 32, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", fontSize: 16, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
};