import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button, Modal, Badge, Form, Spinner } from "react-bootstrap";
import { FaEye, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ViewEntry from "./ViewEntry";

function Accounts() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [formData, setFormData] = useState({
    total: "",
    paymentReceived: "Not Received",
    remarksByAccounts: "",
    installationStatus: "Pending",
    paymentCollected: "",
    paymentMethod: "",
    paymentDue: "",
    neftTransactionId: "",
    chequeId: "",
  });
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAccountsOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://sales-order-furniture-server-4ucn.onrender.com/api/accounts-orders",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setOrders(data);
        setFilteredOrders(data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch accounts orders"
        );
      }
    } catch (error) {
      console.error("Error fetching accounts orders:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch accounts orders";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right", autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (formData.paymentReceived === "Received") {
      setFormData((prev) => ({
        ...prev,
        paymentDue: "0",
        paymentCollected: Number(prev.total || 0).toFixed(2),
      }));
    }
  }, [formData.paymentReceived]);

  useEffect(() => {
    fetchAccountsOrders();
  }, [fetchAccountsOrders]);

  const filterOrders = useCallback(() => {
    let filtered = [...orders];
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const productDetails = Array.isArray(order.products)
          ? order.products
              .map((p) => `${p.productType || ""} (${p.qty || ""})`)
              .join(", ")
          : "";
        return (
          (order.billNumber || "").toLowerCase().includes(query) ||
          (order.dispatchDate
            ? new Date(order.dispatchDate).toLocaleDateString()
            : ""
          )
            .toLowerCase()
            .includes(query) ||
          (order.shippingAddress || "").toLowerCase().includes(query) ||
          (order.customerEmail || "").toLowerCase().includes(query) ||
          (order.contactNo || "").toLowerCase().includes(query) ||
          (order.total?.toString() || "").toLowerCase().includes(query) ||
          productDetails.toLowerCase().includes(query) ||
          (order.paymentReceived || "").toLowerCase().includes(query) ||
          (order.paymentMethod || "").toLowerCase().includes(query) ||
          (order.paymentCollected?.toString() || "")
            .toLowerCase()
            .includes(query) ||
          (order.paymentDue?.toString() || "").toLowerCase().includes(query) ||
          (order.neftTransactionId || "").toLowerCase().includes(query) ||
          (order.chequeId || "").toLowerCase().includes(query) ||
          (order.invoiceDate
            ? new Date(order.invoiceDate).toLocaleDateString()
            : ""
          )
            .toLowerCase()
            .includes(query) ||
          (order.remarksByAccounts || "").toLowerCase().includes(query) ||
          (order.products?.[0]?.gst?.toString() || "")
            .toLowerCase()
            .includes(query) ||
          (order.products?.[0]?.serialNos?.join(", ") || "")
            .toLowerCase()
            .includes(query) ||
          (order.products?.[0]?.modelNos?.join(", ") || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (order) => (order.paymentReceived || "Not Received") === statusFilter
      );
    }
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const uniqueStatuses = [
    "All",
    "Received",
    "Not Received",
    ...new Set(
      orders
        .map((order) => order.paymentReceived || "Not Received")
        .filter((status) => !["Received", "Not Received"].includes(status))
    ),
  ];

  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEdit = (order) => {
    setEditOrder(order);
    setFormData({
      total: order.total || "",
      paymentReceived: order.paymentReceived || "Not Received",
      remarksByAccounts: order.remarksByAccounts || "",
      installationStatus: order.installationStatus || "Pending",
      paymentCollected:
        order.paymentReceived === "Received"
          ? Number(order.total || 0).toFixed(2)
          : order.paymentCollected || "",
      paymentMethod: order.paymentMethod || "",
      paymentDue:
        order.paymentReceived === "Received" ? "0" : order.paymentDue || "",
      neftTransactionId: order.neftTransactionId || "",
      chequeId: order.chequeId || "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.remarksByAccounts ||
      formData.remarksByAccounts.trim() === ""
    ) {
      newErrors.remarksByAccounts = "Remarks are required";
    }
    if (
      formData.paymentMethod &&
      !["Cash", "NEFT", "RTGS", "Cheque", ""].includes(formData.paymentMethod)
    ) {
      newErrors.paymentMethod = "Invalid Payment Method";
    }
    if (
      formData.paymentMethod === "NEFT" &&
      (!formData.neftTransactionId || formData.neftTransactionId.trim() === "")
    ) {
      newErrors.neftTransactionId =
        "NEFT Transaction ID is required for NEFT payments";
    }
    if (
      formData.paymentMethod === "Cheque" &&
      (!formData.chequeId || formData.chequeId.trim() === "")
    ) {
      newErrors.chequeId = "Cheque ID is required for Cheque payments";
    }
    if (
      formData.paymentReceived === "Received" &&
      (!formData.paymentCollected || Number(formData.paymentCollected) <= 0)
    ) {
      newErrors.paymentCollected =
        "Payment Collected must be greater than 0 when Payment Received is set";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submissionData = {
        total: Number(formData.total) || undefined,
        paymentReceived: formData.paymentReceived,
        remarksByAccounts: formData.remarksByAccounts,
        paymentCollected: formData.paymentCollected
          ? Number(formData.paymentCollected)
          : undefined,
        paymentMethod: formData.paymentMethod || undefined,
        paymentDue: formData.paymentDue
          ? Number(formData.paymentDue)
          : undefined,
        neftTransactionId: formData.neftTransactionId || undefined,
        chequeId: formData.chequeId || undefined,
        installationStatus: formData.installationStatus || undefined,
      };

      const response = await axios.put(
        `https://sales-order-furniture-server-4ucn.onrender.com/api/edit/${editOrder?._id}`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const updatedOrder = response.data.data;
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === editOrder._id ? updatedOrder : order
          )
        );
        setShowEditModal(false);
        toast.success("Order updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchAccountsOrders();
      } else {
        throw new Error(response.data.message || "Failed to update order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const exportToExcel = useCallback(() => {
    const exportData = filteredOrders.map((order) => {
      const productDetails = Array.isArray(order.products)
        ? order.products
            .map((p) => `${p.productType || "N/A"} (${p.qty || "N/A"})`)
            .join(", ")
        : "N/A";
      return {
        "Order ID": order.orderId || "N/A",
        "Customer Name": order.customername || "N/A",
        "Bill Number": order.billNumber || "N/A",
        "PI Number": order.piNumber || "N/A",
        "Invoice Date": order.invoiceDate
          ? new Date(order.invoiceDate).toLocaleDateString()
          : "N/A",
        Total: order.total ? `₹${order.total.toFixed(2)}` : "N/A",
        "Payment Collected": order.paymentCollected
          ? `₹${order.paymentCollected}`
          : "N/A",
        "Payment Due": order.paymentDue ? `₹${order.paymentDue}` : "N/A",
        "Payment Method": order.paymentMethod || "N/A",
        "Payment Terms": order.paymentTerms || "N/A",

        "Payment Received": order.paymentReceived || "Not Received",
        Products: productDetails,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts Orders");
    XLSX.writeFile(
      workbook,
      `Accounts_Orders_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  }, [filteredOrders]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  if (loading && orders.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Spinner
          animation="border"
          style={{
            width: "50px",
            height: "50px",
            color: "#2575fc",
            marginBottom: "15px",
          }}
        />
        <p
          style={{
            fontSize: "1.3rem",
            color: "#333",
            fontWeight: "500",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          Loading Payment Collection Orders...
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          margin: "0",
          padding: "20px",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
        </style>
        <header
          style={{
            padding: "20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #2575fc, #6a11cb)",
            color: "#fff",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            Payment Collection Dashboard
          </h1>
        </header>

        <div style={{ padding: "20px", flex: 1 }}>
          {error && (
            <div
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ff8787)",
                color: "#fff",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <span>
                <strong>Error:</strong> {error}
              </span>
              <Button
                onClick={fetchAccountsOrders}
                style={{
                  background: "transparent",
                  border: "1px solid #fff",
                  color: "#fff",
                  padding: "5px 15px",
                  borderRadius: "20px",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#ffffff30")}
                onMouseLeave={(e) =>
                  (e.target.style.background = "transparent")
                }
              >
                Retry
              </Button>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 300px" }}>
              <Form.Control
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: "20px",
                  padding: "10px 40px 10px 15px",
                  border: "1px solid #ced4da",
                  fontSize: "1rem",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                }}
              />
              {searchQuery && (
                <FaTimes
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                flex: "0 1 200px",
                borderRadius: "20px",
                padding: "10px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              }}
            >
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
            <Button
              onClick={handleClearFilters}
              style={{
                background: "linear-gradient(135deg, #6c757d, #5a6268)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: "600",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              Clear Filters
            </Button>
            <Button
              onClick={exportToExcel}
              style={{
                background: "linear-gradient(135deg, #28a745, #4cd964)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: "600",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              Export to Excel
            </Button>
          </div>

          <div
            style={{
              overflowX: "auto",
              maxHeight: "550px",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
              }}
            >
              <thead
                style={{
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  color: "#fff",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                <tr>
                  {[
                    "Order ID",
                    "Customer Name",
                    "Bill Number",
                    "PI Number",
                    "Invoice Date",
                    "Total",
                    "Payment Collected",
                    "Payment Due",
                    "Payment Method",
                    "Payment Terms",

                    "Payment Received",
                    "Actions",
                  ].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        fontWeight: "700",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="13"
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        height: "40px",
                        lineHeight: "40px",
                        color: "#6b7280",
                        fontStyle: "italic",
                        animation: "fadeIn 0.5s ease-in-out",
                      }}
                    >
                      <Spinner
                        animation="border"
                        style={{
                          width: "30px",
                          height: "30px",
                          color: "#2575fc",
                          marginRight: "10px",
                        }}
                      />
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="13"
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        height: "40px",
                        lineHeight: "40px",
                        color: "#6b7280",
                        fontStyle: "italic",
                        background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                        animation: "fadeIn 0.5s ease-in-out",
                      }}
                    >
                      {searchQuery || statusFilter !== "All"
                        ? "No orders match your search criteria."
                        : "No Payment Collection orders available."}
                    </td>
                  </tr>
                ) : (
                  filteredOrders
                    .slice()
                    .sort((a, b) => {
                      const dateA = a.invoiceDate
                        ? new Date(a.invoiceDate)
                        : new Date(0);
                      const dateB = b.invoiceDate
                        ? new Date(b.invoiceDate)
                        : new Date(0);
                      if (dateA.getTime() === dateB.getTime()) {
                        return b._id.localeCompare(a._id);
                      }
                      return dateB - dateA;
                    })
                    .map((order, index) => (
                      <tr
                        key={order._id}
                        style={{
                          background: index % 2 === 0 ? "#f8f9fa" : "#fff",
                          transition: "all 0.3s ease",
                          borderBottom: "1px solid #e6f0fa",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#e9ecef")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            index % 2 === 0 ? "#f8f9fa" : "#fff")
                        }
                      >
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.orderId || "N/A"}
                        >
                          {order.orderId || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "150px",
                          }}
                          title={order.customername || "N/A"}
                        >
                          {order.customername || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.billNumber || "N/A"}
                        >
                          {order.billNumber || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.piNumber || "N/A"}
                        >
                          {order.piNumber || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={
                            order.invoiceDate
                              ? new Date(order.invoiceDate).toLocaleDateString()
                              : "N/A"
                          }
                        >
                          {order.invoiceDate
                            ? new Date(order.invoiceDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100px",
                          }}
                          title={order.total?.toFixed(2) || "N/A"}
                        >
                          {order.total ? `₹${order.total.toFixed(2)}` : "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100px",
                          }}
                          title={order.paymentCollected || "N/A"}
                        >
                          {order.paymentCollected
                            ? `₹${order.paymentCollected}`
                            : "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100px",
                          }}
                          title={order.paymentDue || "N/A"}
                        >
                          {order.paymentDue ? `₹${order.paymentDue}` : "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.paymentMethod || "N/A"}
                        >
                          {order.paymentMethod || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.paymentTerms || "N/A"}
                        >
                          {order.paymentTerms || "N/A"}
                        </td>

                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            color: "#2c3e50",
                            fontSize: "1rem",
                            height: "40px",
                            lineHeight: "40px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                          title={order.paymentReceived || "Not Received"}
                        >
                          <Badge
                            style={{
                              background:
                                order.paymentReceived === "Received"
                                  ? "linear-gradient(135deg, #28a745, #4cd964)"
                                  : order.paymentReceived === "Not Received"
                                  ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
                                  : "linear-gradient(135deg, #6c757d, #a9a9a9)",
                              color: "#fff",
                              padding: "5px 10px",
                              borderRadius: "12px",
                              display: "inline-block",
                              width: "100%",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.paymentReceived || "Not Received"}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: "15px",
                            textAlign: "center",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "20px",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Button
                              variant="primary"
                              onClick={() => handleViewClick(order)}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "22px",
                                padding: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              aria-label="View order details"
                            >
                              <FaEye style={{ marginBottom: "3px" }} />
                            </Button>
                            <button
                              className="editBtn"
                              onClick={() => handleEdit(order)}
                              style={{
                                minWidth: "40px",
                                width: "40px",
                                height: "40px",
                                padding: "0",
                                border: "none",
                                background:
                                  "linear-gradient(135deg, #6c757d, #5a6268)",
                                borderRadius: "22px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                height="1em"
                                viewBox="0 0 512 512"
                                fill="#fff"
                              >
                                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <Modal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            centered
            backdrop="static"
          >
            <Modal.Header
              closeButton
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                color: "#fff",
                borderBottom: "none",
                padding: "20px",
              }}
            >
              <Modal.Title
                style={{
                  fontWeight: "700",
                  fontSize: "1.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Edit Payment Collection
              </Modal.Title>
            </Modal.Header>
            <Modal.Body
              style={{
                padding: "30px",
                background: "#fff",
                borderRadius: "0 0 15px 15px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Form onSubmit={handleEditSubmit}>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Total Payment
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total: e.target.value,
                      })
                    }
                    placeholder="Enter total amount"
                    style={{
                      borderRadius: "10px",
                      border: errors.total
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                  {errors.total && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.total}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Payment Collected
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.paymentCollected}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentCollected: e.target.value,
                      })
                    }
                    placeholder="Enter payment collected"
                    style={{
                      borderRadius: "10px",
                      border: errors.paymentCollected
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    disabled={formData.paymentReceived === "Received"}
                  />
                  {errors.paymentCollected && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.paymentCollected}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Payment Method
                  </Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    style={{
                      borderRadius: "10px",
                      border: errors.paymentMethod
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  >
                    <option value="">-- Select Payment Method --</option>
                    <option value="Cash">Cash</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Cheque">Cheque</option>
                  </Form.Select>
                  {errors.paymentMethod && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.paymentMethod}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Payment Due
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.paymentDue}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDue: e.target.value })
                    }
                    placeholder="Enter payment due"
                    style={{
                      borderRadius: "10px",
                      border: errors.paymentDue
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    disabled={formData.paymentReceived === "Received"}
                  />
                  {errors.paymentDue && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.paymentDue}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    NEFT Transaction ID
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.neftTransactionId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        neftTransactionId: e.target.value,
                      })
                    }
                    placeholder="Enter NEFT transaction ID"
                    style={{
                      borderRadius: "10px",
                      border: errors.neftTransactionId
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    disabled={formData.paymentMethod !== "NEFT"}
                  />
                  {errors.neftTransactionId && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.neftTransactionId}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Cheque ID
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.chequeId}
                    onChange={(e) =>
                      setFormData({ ...formData, chequeId: e.target.value })
                    }
                    placeholder="Enter cheque ID"
                    style={{
                      borderRadius: "10px",
                      border: errors.chequeId
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    disabled={formData.paymentMethod !== "Cheque"}
                  />
                  {errors.chequeId && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.chequeId}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Payment Received
                  </Form.Label>
                  <Form.Select
                    value={formData.paymentReceived}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentReceived: e.target.value,
                      })
                    }
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Received">Received</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group style={{ marginBottom: "20px" }}>
                  <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                    Remarks by Accounts <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.remarksByAccounts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remarksByAccounts: e.target.value,
                      })
                    }
                    placeholder="Enter remarks"
                    style={{
                      borderRadius: "10px",
                      border: errors.remarksByAccounts
                        ? "1px solid red"
                        : "1px solid #ced4da",
                      padding: "12px",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 10px rgba(37, 117, 252, 0.5)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    required
                  />
                  {errors.remarksByAccounts && (
                    <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                      {errors.remarksByAccounts}
                    </Form.Text>
                  )}
                </Form.Group>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "15px",
                  }}
                >
                  <Button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      background: "linear-gradient(135deg, #6c757d, #5a6268)",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "20px",
                      color: "#fff",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={{
                      background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "20px",
                      color: "#fff",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "translateY(0)")
                    }
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </div>
      </div>
      <footer
        className="footer-container"
        style={{
          padding: "15px",
          textAlign: "center",
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "white",
          marginTop: "auto",
          boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          © 2025 Sales Order Management. All rights reserved.
        </p>
      </footer>
      {isViewModalOpen && (
        <ViewEntry
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          entry={selectedOrder}
        />
      )}
    </>
  );
}

export default Accounts;
