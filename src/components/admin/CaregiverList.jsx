import { useState, useEffect } from "react";
import AddCaregiver from "./AddCaregiver";
import EditCaregiver from "./Editcaregiver";

export default function CaregiverList() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState(null);

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const fetchCaregivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5003/api/users?role=caregiver", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCaregivers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching caregivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this caregiver?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5003/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Caregiver deleted successfully!");
        fetchCaregivers();
      } else {
        alert("Failed to delete caregiver");
      }
    } catch (error) {
      console.error("Error deleting caregiver:", error);
      alert("Error deleting caregiver");
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchCaregivers();
  };

  const handleEditSuccess = () => {
    setEditingCaregiver(null);
    fetchCaregivers();
  };

  if (loading) {
    return <div style={styles.loading}>Loading caregivers...</div>;
  }

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Caregivers</h2>
            <p style={styles.subtitle}>{caregivers.length} total caregivers</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            + Add Caregiver
          </button>
        </div>

        {caregivers.length === 0 ? (
          <div style={styles.empty}>
            <p>No caregivers found</p>
          </div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.colName}>Name</div>
              <div style={styles.colEmail}>Email</div>
              <div style={styles.colPhone}>Phone</div>
              <div style={styles.colAddress}>Address</div>
              <div style={styles.colActions}>Actions</div>
            </div>

            {caregivers.map((caregiver) => (
              <div key={caregiver._id} style={styles.tableRow}>
                <div style={styles.colName}>
                  <div style={styles.avatar}>
                    {caregiver.fullName[0].toUpperCase()}
                  </div>
                  <span style={styles.name}>{caregiver.fullName}</span>
                </div>
                <div style={styles.colEmail}>{caregiver.email}</div>
                <div style={styles.colPhone}>{caregiver.phone || "—"}</div>
                <div style={styles.colAddress}>{caregiver.address || "—"}</div>
                <div style={styles.colActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => setEditingCaregiver(caregiver)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(caregiver._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddCaregiver
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Modal */}
      {editingCaregiver && (
        <EditCaregiver
          caregiver={editingCaregiver}
          onClose={() => setEditingCaregiver(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
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
    gridTemplateColumns: "2fr 2fr 1.5fr 2fr 1.5fr",
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
    gridTemplateColumns: "2fr 2fr 1.5fr 2fr 1.5fr",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    alignItems: "center",
  },
  colName: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  colEmail: {
    color: "#475569",
    fontSize: "14px",
  },
  colPhone: {
    color: "#475569",
    fontSize: "14px",
  },
  colAddress: {
    color: "#475569",
    fontSize: "14px",
  },
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
  editBtn: {
    padding: "6px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 16px",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
};