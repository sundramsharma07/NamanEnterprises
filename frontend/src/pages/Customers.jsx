import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstin: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      const data = Array.isArray(res.data) ? res.data : [];
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      // Show error toast/notification here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Search and filter
  useEffect(() => {
    const filtered = customers.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, customers]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone)) errors.phone = "Phone must be 10 digits";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format";
    }
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      errors.gstin = "Invalid GSTIN format";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, form);
        alert("Customer updated successfully");
      } else {
        await api.post("/customers", form);
        alert("Customer added successfully");
      }
      
      setForm({ name: "", phone: "", address: "", email: "", gstin: "" });
      setEditingCustomer(null);
      setShowForm(false);
      setFormErrors({});
      fetchCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert(error.response?.data?.message || "Failed to save customer");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      email: customer.email || "",
      gstin: customer.gstin || ""
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    setDeleteLoading(id);
    try {
      const res = await api.delete(`/customers/${id}`);
      alert(res.data.message || "Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [filteredCustomers, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading customers...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>

      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Customers</h1>
          <p style={styles.subtitle}>
            Manage your customer relationships • {filteredCustomers.length} total customers
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCustomer(null);
            setForm({ name: "", phone: "", address: "", email: "", gstin: "" });
            setFormErrors({});
          }}
          style={styles.addButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {showForm ? "Cancel" : "Add New Customer"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={styles.formContainer} className="fade-in">
          <h3 style={styles.formTitle}>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    ...styles.input,
                    borderColor: formErrors.name ? "#ef4444" : "#e2e8f0"
                  }}
                  placeholder="Enter customer name"
                />
                {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{
                    ...styles.input,
                    borderColor: formErrors.phone ? "#ef4444" : "#e2e8f0"
                  }}
                  placeholder="10 digit mobile number"
                />
                {formErrors.phone && <span style={styles.errorText}>{formErrors.phone}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    ...styles.input,
                    borderColor: formErrors.email ? "#ef4444" : "#e2e8f0"
                  }}
                  placeholder="customer@example.com"
                />
                {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>GSTIN</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  style={{
                    ...styles.input,
                    borderColor: formErrors.gstin ? "#ef4444" : "#e2e8f0"
                  }}
                  placeholder="22AAAAA0000A1Z5"
                />
                {formErrors.gstin && <span style={styles.errorText}>{formErrors.gstin}</span>}
              </div>

              <div style={{ ...styles.formGroup, gridColumn: "span 2" }}>
                <label style={styles.label}>Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={styles.textarea}
                  placeholder="Enter complete address"
                  rows="3"
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomer(null);
                  setForm({ name: "", phone: "", address: "", email: "", gstin: "" });
                  setFormErrors({});
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingCustomer ? "Update Customer" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={styles.searchIcon}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search customers by name, phone, email, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={styles.clearSearch}
          >
            ✕
          </button>
        )}
      </div>

      {/* Customers Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.th} onClick={() => handleSort("id")}>
                ID {getSortIcon("id")}
              </th>
              <th style={styles.th} onClick={() => handleSort("name")}>
                Name {getSortIcon("name")}
              </th>
              <th style={styles.th} onClick={() => handleSort("phone")}>
                Phone {getSortIcon("phone")}
              </th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>GSTIN</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((customer) => (
                <tr key={customer.id} style={styles.tableRow}>
                  <td style={styles.td}>#{customer.id}</td>
                  <td style={styles.td}>
                    <div style={styles.customerName}>
                      <div style={styles.avatar}>
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </div>
                  </td>
                  <td style={styles.td}>{customer.phone}</td>
                  <td style={styles.td}>{customer.email || "-"}</td>
                  <td style={styles.td}>
                    <div style={styles.addressCell}>
                      {customer.address || "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <code style={styles.gstin}>
                      {customer.gstin || "-"}
                    </code>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleEdit(customer)}
                        style={styles.editButton}
                        title="Edit customer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        disabled={deleteLoading === customer.id}
                        style={{
                          ...styles.deleteButton,
                          opacity: deleteLoading === customer.id ? 0.5 : 1,
                          cursor: deleteLoading === customer.id ? "wait" : "pointer"
                        }}
                        title="Delete customer"
                      >
                        {deleteLoading === customer.id ? (
                          <div style={styles.buttonSpinner} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={styles.noData}>
                  {searchTerm ? "No customers match your search" : "No customers found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedCustomers.length > 0 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={styles.pageButton}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Customers</span>
          <span style={styles.statValue}>{customers.length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>With GSTIN</span>
          <span style={styles.statValue}>
            {customers.filter(c => c.gstin).length}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>With Email</span>
          <span style={styles.statValue}>
            {customers.filter(c => c.email).length}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748b",
    fontSize: "16px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    color: "#475569",
    fontSize: "16px",
    margin: 0
  },
  addButton: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(59,130,246,0.3)"
  },
  formContainer: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 20px 0"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569"
  },
  input: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease"
  },
  textarea: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit"
  },
  errorText: {
    fontSize: "12px",
    color: "#ef4444"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px"
  },
  cancelButton: {
    padding: "12px 24px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  submitButton: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  searchContainer: {
    position: "relative",
    marginBottom: "24px"
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)"
  },
  searchInput: {
    width: "100%",
    padding: "14px 20px 14px 44px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    background: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px"
  },
  tableContainer: {
    background: "white",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  tableHead: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    userSelect: "none"
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
    transition: "background 0.2s ease",
    cursor: "pointer"
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#1e293b"
  },
  customerName: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
    fontSize: "16px"
  },
  addressCell: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  gstin: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "monospace"
  },
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  editButton: {
    padding: "8px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  deleteButton: {
    padding: "8px",
    background: "#fee2e2",
    border: "none",
    borderRadius: "8px",
    color: "#ef4444",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #ef4444",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  noData: {
    padding: "48px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px"
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px"
  },
  pageButton: {
    padding: "8px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  pageInfo: {
    fontSize: "14px",
    color: "#64748b"
  },
  statsContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "24px",
    marginTop: "24px",
    padding: "16px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0"
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b"
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a"
  }
};

export default Customers;