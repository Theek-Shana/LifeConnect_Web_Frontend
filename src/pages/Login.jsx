import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ── Forgot Password State ─────────────────────────────────
  const [forgotOpen,    setForgotOpen]    = useState(false);
  const [resetEmail,    setResetEmail]    = useState("");
  const [resetLoading,  setResetLoading]  = useState(false);
  const [resetSent,     setResetSent]     = useState(false);
  const [resetError,    setResetError]    = useState("");

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ── Login handler ─────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5003/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      switch (data.user.role) {
        case "admin":    navigate("/admin");    break;
        case "doctor":   navigate("/doctor");   break;
        case "caregiver":navigate("/caregiver");break;
        default:         navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handler ───────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    if (!resetEmail.trim()) { setResetError("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) { setResetError("Please enter a valid email address."); return; }

    setResetLoading(true);
    try {
      
  await fetch("http://localhost:5003/api/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
});
      setResetSent(true);
    } catch {
      setResetSent(true); // Still show success for security
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setResetEmail("");
    setResetSent(false);
    setResetError("");
    setResetLoading(false);
  };

  const isMobile = windowWidth <= 768;
  const s = getStyles(isMobile);

  return (
    <div style={s.container}>
      {/* ── FORGOT PASSWORD MODAL ───────────────────────── */}
      {forgotOpen && (
        <div style={s.modalOverlay} onClick={closeForgot}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            {!resetSent ? (
              <>
                <div style={s.modalIconWrap}>🔑</div>
                <h3 style={s.modalTitle}>Reset Password</h3>
                <p style={s.modalSub}>
                  Enter the email address linked to your Life Connect account and we'll send you a reset link.
                </p>

                {resetError && <div style={s.modalError}>{resetError}</div>}

                <form onSubmit={handleForgotPassword} style={{ width: "100%" }}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={s.modalLabel}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      style={s.modalInput}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{ ...s.modalBtn, opacity: resetLoading ? 0.7 : 1 }}
                  >
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <button style={s.modalCancelBtn} onClick={closeForgot}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div style={{ ...s.modalIconWrap, background: "rgba(74,222,128,0.15)", border: "2px solid rgba(74,222,128,0.3)" }}>✅</div>
                <h3 style={s.modalTitle}>Check Your Email</h3>
                <p style={s.modalSub}>
                  If an account exists for{" "}
                  <strong style={{ color: "#3b82f6" }}>{resetEmail}</strong>, a password reset
                  link has been sent. Check your inbox and spam folder.
                  <br /><br />
                  The link expires in <strong style={{ color: "white" }}>1 hour</strong>.
                </p>

                <div style={s.tipBox}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#fbbf24", lineHeight: 1.5 }}>
                    Didn't receive it? Wait a minute, check spam, or try a different email address.
                  </span>
                </div>

                <button style={s.modalBtn} onClick={closeForgot}>
                  Back to Login
                </button>
                <button style={s.modalCancelBtn} onClick={() => setResetSent(false)}>
                  Try a different email
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN LOGIN ───────────────────────────────────── */}
      {isMobile ? (
        <>
          <div style={s.mobileHeader}>
            <div style={s.iconCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <h1 style={s.bannerTitle}>Life Connect</h1>
            <p style={s.bannerSubtitle}>Your Health, Connected</p>
          </div>

          <div style={s.mobileFormSection}>
            <h2 style={s.welcomeTitle}>Welcome Back</h2>
            <p style={s.welcomeSubtitle}>Sign in to access your health dashboard</p>

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleLogin} style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.inputLabel}>EMAIL ADDRESS</label>
                <div style={s.inputWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={s.inputIcon}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={s.input} placeholder="Enter your email" />
                </div>
              </div>

              <div style={s.inputGroup}>
                <label style={s.inputLabel}>PASSWORD</label>
                <div style={s.inputWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={s.inputIcon}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={s.input} placeholder="Enter your password" />
                </div>
              </div>

              <div style={s.forgotPassword}>
                <button type="button" style={s.forgotBtn} onClick={() => setForgotOpen(true)}>
                  Forgot your password?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ ...s.button, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <div style={s.divider}><span style={s.dividerText}>or</span></div>

              <div style={s.createAccount}>
                <span style={s.createAccountText}>New to Life Connect? </span>
                <a href="#" style={s.createAccountLink}>Create Account</a>
              </div>
            </form>

            <div style={s.footer}>
              <span style={s.footerText}>🔒 Secure & HIPAA Compliant</span>
            </div>
          </div>
        </>
      ) : (
        <div style={s.desktopContainer}>
          {/* LEFT PANEL */}
          <div style={s.leftPanel}>
            <div style={s.leftContent}>
              <div style={s.logo}>
                <div style={s.logoIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={s.logoText}>Life Connect</span>
              </div>

              <div style={s.centerSection}>
                <div style={s.iconCircle}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <h1 style={s.bannerTitle}>Life Connect</h1>
                <p style={s.bannerSubtitle}>Your Health, Connected</p>
              </div>

              <div style={s.statusBox}>
                <div style={{ ...s.statusDot, backgroundColor: online ? "#4ade80" : "#f87171" }} />
                <span style={s.statusText}>{online ? "Live connected" : "Offline"}</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={s.rightPanel}>
            <div style={s.formContainer}>
              <h2 style={s.welcomeTitle}>Sign in</h2>

              {error && <div style={s.errorBox}>{error}</div>}

              <form onSubmit={handleLogin} style={s.form}>
                <div style={s.inputGroup}>
                  <label style={s.inputLabel}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={s.input} placeholder="Enter your email" />
                </div>

                <div style={s.inputGroup}>
                  <label style={s.inputLabel}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={s.input} placeholder="Enter your password" />
                </div>

                <button type="submit" disabled={loading} style={{ ...s.button, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              <div style={s.forgotPasswordDesktop}>
                <button type="button" style={s.forgotBtn} onClick={() => setForgotOpen(true)}>
                  Forgot password?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (isMobile) => ({
  container: {
    height: "100vh", width: "100vw", display: "flex",
    padding: "0", margin: "0", overflow: "hidden",
    background: isMobile ? "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" : "transparent",
    position: "relative",
  },

  // ── Modal ──────────────────────────────────────────────────
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px",
  },
  modalCard: {
    background: "#1a1d29",
    borderRadius: "24px", padding: "44px 40px",
    maxWidth: "460px", width: "100%",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    border: "1px solid #2d3142",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  modalIconWrap: {
    width: "72px", height: "72px", borderRadius: "50%",
    background: "rgba(59,130,246,0.15)",
    border: "2px solid rgba(59,130,246,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "32px", marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "24px", fontWeight: "800", color: "white",
    marginBottom: "10px", textAlign: "center",
  },
  modalSub: {
    fontSize: "14px", color: "#94a3b8", textAlign: "center",
    lineHeight: "1.7", marginBottom: "28px",
  },
  modalError: {
    width: "100%", background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "10px", padding: "12px 16px",
    color: "#f87171", fontSize: "13px", marginBottom: "16px",
  },
  modalLabel: {
    display: "block", fontSize: "11px", fontWeight: "700",
    color: "#cbd5e1", letterSpacing: "0.8px", marginBottom: "8px",
  },
  modalInput: {
    width: "100%", padding: "15px 18px",
    background: "#252936", border: "1px solid #2d3142",
    borderRadius: "12px", fontSize: "15px", color: "white",
    outline: "none", boxSizing: "border-box",
  },
  modalBtn: {
    width: "100%", padding: "16px",
    background: "#3b82f6", color: "white",
    border: "none", borderRadius: "12px",
    fontSize: "16px", fontWeight: "700",
    cursor: "pointer", marginBottom: "12px",
    boxShadow: "0 6px 20px rgba(59,130,246,0.4)",
  },
  modalCancelBtn: {
    background: "none", border: "none",
    color: "#64748b", fontSize: "14px",
    fontWeight: "600", cursor: "pointer", padding: "8px",
  },
  tipBox: {
    width: "100%", display: "flex", gap: "10px", alignItems: "flex-start",
    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
    borderRadius: "12px", padding: "14px 16px", marginBottom: "24px",
  },

  // ── Forgot button (replaces <a href="#">) ──────────────────
  forgotBtn: {
    background: "none", border: "none",
    color: "#3b82f6", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", padding: 0,
  },

  // ── Desktop Layout ─────────────────────────────────────────
  desktopContainer: { display: "flex", width: "100%", height: "100%" },
  leftPanel: {
    flex: 1, background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "60px",
  },
  leftContent: {
    maxWidth: "500px", width: "100%",
    display: "flex", flexDirection: "column",
    justifyContent: "space-between", height: "80%",
  },
  logo: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "40px" },
  logoIcon: {
    width: "50px", height: "50px",
    background: "rgba(255,255,255,0.2)", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid rgba(255,255,255,0.3)",
  },
  logoText: { fontSize: "26px", fontWeight: "700", color: "white" },
  centerSection: {
    textAlign: "center", flex: 1,
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
  },
  iconCircle: {
    width: isMobile ? "80px" : "140px",
    height: isMobile ? "80px" : "140px",
    margin: "0 auto 30px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "3px solid rgba(255,255,255,0.3)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  bannerTitle: {
    fontSize: isMobile ? "32px" : "56px", fontWeight: "700", color: "white",
    margin: "0 0 16px 0", textShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  bannerSubtitle: {
    fontSize: isMobile ? "16px" : "22px",
    color: "rgba(255,255,255,0.95)", margin: 0, fontWeight: "400",
  },
  statusBox: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "16px 24px",
    background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
    borderRadius: "16px", border: "1px solid rgba(255,255,255,0.3)",
    width: "fit-content",
  },
  statusDot: { width: "12px", height: "12px", borderRadius: "50%", boxShadow: "0 0 8px currentColor" },
  statusText: { fontSize: "15px", fontWeight: "600", color: "white" },
  rightPanel: {
    flex: 1, background: "#1a1d29",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "60px",
  },
  formContainer: { width: "100%", maxWidth: "450px" },
  welcomeTitle: {
    fontSize: isMobile ? "24px" : "36px", fontWeight: "700",
    color: isMobile ? "#1e293b" : "white", margin: "0 0 40px 0",
  },
  welcomeSubtitle: { fontSize: "15px", color: "#64748b", margin: "0 0 28px 0" },
  errorBox: {
    marginBottom: "20px", padding: "14px 16px",
    background: isMobile ? "#fee2e2" : "rgba(239,68,68,0.1)",
    border: isMobile ? "1px solid #fecaca" : "1px solid rgba(239,68,68,0.3)",
    borderRadius: "12px", color: isMobile ? "#dc2626" : "#f87171", fontSize: "14px",
  },
  form: { display: "flex", flexDirection: "column" },
  inputGroup: { marginBottom: "24px" },
  inputLabel: {
    display: "block", fontSize: "14px", fontWeight: "600",
    color: isMobile ? "#64748b" : "#cbd5e1", marginBottom: "10px",
  },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "16px", zIndex: 1 },
  input: {
    width: "100%", height: isMobile ? "52px" : "56px",
    padding: isMobile ? "0 16px 0 48px" : "0 18px",
    background: isMobile ? "#f8fafc" : "#252936",
    border: isMobile ? "2px solid #e2e8f0" : "1px solid #2d3142",
    borderRadius: "12px", color: isMobile ? "#1e293b" : "white",
    fontSize: "15px", outline: "none", transition: "all 0.3s", boxSizing: "border-box",
  },
  forgotPassword: { textAlign: "right", marginBottom: "24px" },
  forgotPasswordDesktop: { textAlign: "center", marginTop: "24px" },
  button: {
    width: "100%", height: isMobile ? "52px" : "56px",
    background: isMobile ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" : "#3b82f6",
    border: "none", borderRadius: "12px", color: "white",
    fontSize: "16px", fontWeight: "700", transition: "all 0.3s",
    boxShadow: "0 4px 16px rgba(59,130,246,0.4)", cursor: "pointer",
  },
  divider: { margin: "28px 0", textAlign: "center", position: "relative" },
  dividerText: {
    fontSize: "14px", color: "#94a3b8",
    background: "white", padding: "0 16px", position: "relative", zIndex: 1,
  },
  createAccount: { textAlign: "center", marginTop: "8px" },
  createAccountText: { fontSize: "14px", color: "#64748b" },
  createAccountLink: { fontSize: "14px", color: "#3b82f6", textDecoration: "none", fontWeight: "600" },
  mobileHeader: { padding: "40px 24px 30px", textAlign: "center" },
  mobileFormSection: {
    flex: 1, background: "white", borderRadius: "24px 24px 0 0",
    padding: "32px 24px", overflowY: "auto",
  },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px", background: "#fef3c7",
    borderTop: "1px solid #fde68a", marginTop: "24px", borderRadius: "12px",
  },
  footerText: { fontSize: "14px", color: "#92400e", fontWeight: "600" },
});