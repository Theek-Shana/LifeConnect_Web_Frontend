import { useState, useEffect } from "react";

export default function EditPatient({ patient, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: patient.name || "",
    age: patient.age || "",
    gender: patient.gender || "",
    address: patient.address || "",
    phone: patient.phone || "",
    caregiver: patient.caregiver?._id || "",
    medicalHistory: patient.medicalHistory || "",
  });
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5003/api/patients/${patient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Patient updated successfully!");
        onSuccess();
      } else {
        alert(data.message || "Failed to update patient");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Error updating patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Patient</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Name *</label>
              <input
                style={styles.input}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Age *</label>
              <input
                style={styles.input}
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Gender *</label>
              <select
                style={styles.input}
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input
                style={styles.input}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <input
              style={styles.input}
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Assign Caregiver</label>
            <select
              style={styles.input}
              name="caregiver"
              value={formData.caregiver}
              onChange={handleChange}
            >
              <option value="">Select Caregiver</option>
              {caregivers.map((caregiver) => (
                <option key={caregiver._id} value={caregiver._id}>
                  {caregiver.fullName}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Medical History</label>
            <textarea
              style={{ ...styles.input, minHeight: "80px" }}
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange}
            />
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Updating..." : "Update Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    width: "600px",
    maxHeight: "90vh",
    overflow: "auto",
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
    fontSize: "20px",
    color: "#1e293b",
    fontWeight: "600",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#64748b",
    cursor: "pointer",
  },
  form: {
    padding: "24px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
};