import { useState, useEffect } from "react";

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5003/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5003/api/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchPatients();
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading patients...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Patients</h2>
          <p style={styles.subtitle}>{patients.length} total patients</p>
        </div>
        <button style={styles.addBtn}>+ Add Patient</button>
      </div>

      {patients.length === 0 ? (
        <div style={styles.empty}>
          <p>No patients found</p>
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.colName}>Name</div>
            <div style={styles.colAge}>Age</div>
            <div style={styles.colCaregiver}>Caregiver</div>
            <div style={styles.colStatus}>Status</div>
            <div style={styles.colActions}>Actions</div>
          </div>

          {patients.map((patient) => (
            <div key={patient._id} style={styles.tableRow}>
              <div style={styles.colName}>
                <div style={styles.avatar}>{patient.name[0]}</div>
                <span style={styles.name}>{patient.name}</span>
              </div>
              <div style={styles.colAge}>{patient.age || "—"}</div>
              <div style={styles.colCaregiver}>
                {patient.caregiver?.fullName || "Unassigned"}
              </div>
              <div style={styles.colStatus}>
                <span style={styles.statusBadge}>Active</span>
              </div>
              <div style={styles.colActions}>
                <button style={styles.viewBtn}>View</button>
                <button style={styles.editBtn}>Edit</button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(patient._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    color: "#1e293b",
    fontWeight: "600",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  addBtn: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
  },
  empty: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1.5fr 1fr 2fr",
    padding: "12px 24px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1.5fr 1fr 2fr",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    alignItems: "center",
  },
  colName: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  colAge: {
    color: "#475569",
    fontSize: "14px",
  },
  colCaregiver: {
    color: "#475569",
    fontSize: "14px",
  },
  colStatus: {},
  colActions: {
    display: "flex",
    gap: "8px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
  },
  name: {
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: "500",
  },
  statusBadge: {
    padding: "4px 12px",
    background: "#dcfce7",
    color: "#16a34a",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  viewBtn: {
    padding: "6px 12px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  editBtn: {
    padding: "6px 12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 12px",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
};