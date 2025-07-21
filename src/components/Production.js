import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button, Modal, Form, Spinner, Badge } from "react-bootstrap";
import { FaEye, FaTimes } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import "../App.css";
import styled from "styled-components";
import DatePicker from "react-datepicker";
const DatePickerWrapper = styled.div`
  display: flex;

  gap: 10px;
  align-items: center;
  .react-datepicker-wrapper {
    width: 150px;
  }
  .react-datepicker__input-container input {
    padding: 8px 12px;
    border-radius: 25px;
    border: 1px solid #ccc;
    font-size: 1rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: border-color 0.3s ease;
    width: 100%;
    &:focus {
      border-color: #2575fc;
      outline: none;
    }
  }
  .react-datepicker {
    z-index: 1000 !important;
  }
  .react-datepicker-popper {
    z-index: 1000 !important;
  }
`;

const FilterLabel = styled(Form.Label)`
  font-weight: 700;
  font-size: 0.95rem;
  color: transparent;
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  -webkit-background-clip: text;
  background-clip: text;
  letter-spacing: 0.5px;
  padding: 5px 10px;
  border-radius: 8px;
  display: inline-block;
  transition: transform 0.2s ease, opacity 0.2s ease;
  cursor: default;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  span.underline {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(135deg, #2575fc, #6a11cb);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover span.underline {
    transform: scaleX(1);
  }
`;

const FilterInput = styled(Form.Control)`
  border-radius: 20px;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:focus {
    box-shadow: 0 0 10px rgba(37, 117, 252, 0.5);
  }
`;

const FilterSelect = styled(Form.Select)`
  border-radius: 20px;
  padding: 10px;
  border: 1px solid #ced4da;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background: #fff;
  transition: all 0.3s ease;

  &:focus {
    box-shadow: 0 0 10px rgba(37, 117, 252, 0.5);
  }
`;

const FilterButton = styled(Button)`
  background: ${({ variant }) =>
    variant === "clear"
      ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
      : "linear-gradient(135deg, #28a745, #4cd964)"};
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;
const Production = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [formData, setFormData] = useState({
    fulfillingStatus: "Pending",
    remarksByProduction: "",
    productUnits: [],
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderTypeFilter, setOrderTypeFilter] = useState("All");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://sales-order-furniture-server-1169.onrender.com/api/production-orders",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const sortedOrders = response.data.data.sort((a, b) => {
          const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
          const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
          return dateB - dateA;
        });
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } else {
        throw new Error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch production orders.";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right", autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);
  const clearFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setStatusFilter("All");
    setOrderTypeFilter("All");
  };

  // Filter orders based on search query, status, and order type
  useEffect(() => {
    let filtered = orders.filter(
      (order) => order.fulfillingStatus !== "Fulfilled"
    );
    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = order.soDate ? new Date(order.soDate) : null;
        const startDateAdjusted = startDate
          ? new Date(startDate.setHours(0, 0, 0, 0))
          : null;
        const endDateAdjusted = endDate
          ? new Date(endDate.setHours(23, 59, 59, 999))
          : null;
        return (
          (!startDateAdjusted ||
            (orderDate && orderDate >= startDateAdjusted)) &&
          (!endDateAdjusted || (orderDate && orderDate <= endDateAdjusted))
        );
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const productDetails = Array.isArray(order.products)
          ? order.products
              .map((p) => `${p.productType || ""} (${p.qty || ""})`)
              .join(", ")
          : "";
        const firstProduct =
          Array.isArray(order.products) && order.products.length > 0
            ? order.products[0]
            : {};
        return (
          (order.orderId || "").toLowerCase().includes(query) ||
          (order.customername || "").toLowerCase().includes(query) ||
          (order.shippingAddress || "").toLowerCase().includes(query) ||
          (order.customerEmail || "").toLowerCase().includes(query) ||
          (order.contactNo || "").toLowerCase().includes(query) ||
          (order.orderType || "").toLowerCase().includes(query) ||
          productDetails.toLowerCase().includes(query) ||
          (firstProduct.size || "").toLowerCase().includes(query) ||
          (firstProduct.spec || "").toLowerCase().includes(query) ||
          (firstProduct.modelNos?.join(", ") || "")
            .toLowerCase()
            .includes(query) ||
          (order.fulfillingStatus || "").toLowerCase().includes(query)
        );
      });
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (order) => order.fulfillingStatus === statusFilter
      );
    }
    if (orderTypeFilter !== "All") {
      filtered = filtered.filter(
        (order) => order.orderType === orderTypeFilter
      );
    }
    // Sort filtered orders by soDate in descending order (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
      const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
      return dateB - dateA;
    });
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, orderTypeFilter, startDate, endDate]);
  // Get unique statuses for filter dropdown
  const uniqueStatuses = [
    "All",
    "Under Process",
    "Pending",
    "Partial Dispatch",
    "Fulfilled",
    ...new Set(
      orders
        .map((order) => order.fulfillingStatus || "Pending")
        .filter(
          (status) =>
            ![
              "Under Process",
              "Pending",
              "Partial Dispatch",
              "Fulfilled",
            ].includes(status)
        )
    ),
  ];
  const uniqueOrderTypes = [
    "All",
    ...new Set(orders.map((order) => order.orderType || "N/A")),
  ];

  const handleEdit = (order) => {
    setEditOrder(order);
    const products = Array.isArray(order.products) ? order.products : [];
    const productUnits = products.flatMap((product, productIndex) => {
      const qty = product.qty || 1;

      const modelNos = Array.isArray(product.modelNos) ? product.modelNos : [];
      return Array.from({ length: qty }, (_, unitIndex) => ({
        productIndex,
        productType: product.productType || "N/A",
        size: product.size || "N/A",
        spec: product.spec || "N/A",
        unitPrice: product.unitPrice || 0,
        gst: product.gst || "0", // Add gst
        modelNo: modelNos[unitIndex] || "",
      }));
    });
    setFormData({
      fulfillingStatus: order.fulfillingStatus || "Pending",
      remarksByProduction: order.remarksByProduction || "",
      productUnits,
    });
    setErrors({});
    setShowEditModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const productMap = formData.productUnits.reduce((acc, unit) => {
      const {
        productIndex,
        productType,
        size,
        spec,
        unitPrice,
        gst, // Add gst
        modelNo,
      } = unit;
      if (!acc[productIndex]) {
        acc[productIndex] = {
          productType,
          size,
          spec,
          unitPrice,
          qty: 0,
          gst, // Add gst
          modelNos: [],
        };
      }
      acc[productIndex].qty += 1;
      acc[productIndex].modelNos.push(modelNo || null);
      return acc;
    }, {});
    const products = Object.values(productMap);
    const submitData = { ...formData, products };
    delete submitData.productUnits;
    try {
      const response = await axios.put(
        `https://sales-order-furniture-server-1169.onrender.com/api/edit/${editOrder?._id}`,
        submitData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setOrders((prevOrders) => {
          if (response.data.data.fulfillingStatus === "Fulfilled") {
            const updatedOrders = prevOrders.filter(
              (order) => order._id !== editOrder._id
            );
            return updatedOrders.sort((a, b) => {
              const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
              const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
              return dateB - dateA;
            });
          } else {
            const updatedOrders = prevOrders.map((order) =>
              order._id === editOrder._id ? response.data.data : order
            );
            return updatedOrders.sort((a, b) => {
              const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
              const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
              return dateB - dateA;
            });
          }
        });
        setShowEditModal(false);
        toast.success("Order updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update order");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };
  const handleView = (order) => {
    setViewOrder(order);
    setShowViewModal(true);
    setCopied(false);
  };

  const handleCopy = useCallback(() => {
    if (!viewOrder) return;
    const productsText = Array.isArray(viewOrder.products)
      ? viewOrder.products
          .map(
            (p, i) =>
              `Product ${i + 1}: ${p.productType || "N/A"} (Qty: ${
                p.qty || "N/A"
              }, Size: ${p.size || "N/A"}, Spec: ${
                p.spec || "N/A"
              }, Model Nos: ${
                p.modelNos.length > 0 ? p.modelNos.join(", ") : "N/A"
              })`
          )
          .join("\n")
      : "N/A";
    const textToCopy = `
      Order ID: ${viewOrder.orderId || "N/A"}
      Customer Name: ${viewOrder.customername || "N/A"}
      Products:\n${productsText}
      Fulfilling Status: ${viewOrder.fulfillingStatus || "Pending"}
      Remarks by Production: ${viewOrder.remarksByProduction || "N/A"}
    `.trim();
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        toast.success("Details copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        toast.error("Failed to copy details!");
        console.error("Copy error:", err);
      });
  }, [viewOrder]);

  const exportToExcel = () => {
    const exportData = filteredOrders.map((order) => {
      const firstProduct =
        Array.isArray(order.products) && order.products.length > 0
          ? order.products[0]
          : {};
      const productDetails = Array.isArray(order.products)
        ? order.products
            .map((p) => `${p.productType || "N/A"} (${p.qty || "N/A"})`)
            .join(", ")
        : "N/A";
      const totalQty = Array.isArray(order.products)
        ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
        : "N/A";
      return {
        "Order ID": order.orderId || "N/A",
        "So Date": order.soDate
          ? new Date(order.soDate).toLocaleDateString("en-IN")
          : "N/A",
        "Customer Name": order.customername || "N/A",
        "Shipping Address": order.shippingAddress || "N/A",
        "Customer Email": order.customerEmail || "N/A",
        "Contact No": order.contactNo || "N/A",
        "Order Type": order.orderType || "N/A",
        "Product Details": productDetails,
        Size: firstProduct.size || "N/A",
        Spec: firstProduct.spec || "N/A",

        "Model Nos":
          firstProduct.modelNos?.length > 0
            ? firstProduct.modelNos.join(", ")
            : "N/A",
        "Production Status": order.fulfillingStatus || "Pending",
        Quantity: totalQty,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Production Orders");
    XLSX.writeFile(
      workbook,
      `Production_Orders_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };
  const totalPending = filteredOrders.filter(
    (order) => order.fulfillingStatus === "Pending"
  ).length;
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
            Production Team Dashboard
          </h1>
        </header>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "20px",
            marginBottom: "20px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <Form.Label
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                color: "transparent",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                letterSpacing: "0.5px",
                padding: "5px 10px",
                borderRadius: "8px",
                display: "inline-block",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              title="Filter by production status"
            >
              <span style={{ marginRight: "5px" }}>📊</span> Search
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.3s ease",
                }}
              />
            </Form.Label>{" "}
            <Form.Label
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                color: "transparent",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                letterSpacing: "0.5px",
                padding: "5px 10px",
                borderRadius: "8px",
                display: "inline-block",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.opacity = "1";
              }}
              title="Filter by production status"
            >
              <span style={{ marginRight: "5px" }}></span>
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "80%",
                  height: "2px",
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.3s ease",
                }}
              />
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                borderRadius: "20px",
                maxWidth: "700px",
                padding: "10px 40px 10px 15px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) =>
                (e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)")
              }
            />
          </div>{" "}
          <div
            style={{
              flex: "1 1 300px",
              maxWidth: "400px",
              display: "flex",
              gap: "10px",
            }}
          >
            <div style={{ flex: 1 }}>
              <FilterLabel title="Select start date">
                <span style={{ marginRight: "5px" }}>📅</span> Start Date
                <span className="underline" />
              </FilterLabel>
              <DatePickerWrapper>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  className="form-control"
                  wrapperClassName="w-100"
                />{" "}
              </DatePickerWrapper>
            </div>
            <div style={{ flex: 1 }}>
              <FilterLabel title="Select end date">
                <span style={{ marginRight: "5px" }}>📅</span> End Date
                <span className="underline" />
              </FilterLabel>{" "}
              <DatePickerWrapper>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="End Date"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  className="form-control"
                  wrapperClassName="w-100"
                />{" "}
              </DatePickerWrapper>
            </div>
          </div>
          <Form.Group style={{ flex: "0 1 200px" }}>
            <Form.Label
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                color: "transparent",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                letterSpacing: "0.5px",
                padding: "5px 10px",
                borderRadius: "8px",
                display: "inline-block",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              title="Filter by production status"
            >
              <span style={{ marginRight: "5px" }}>📊</span> Production Status
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.3s ease",
                }}
              />
            </Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                borderRadius: "20px",
                padding: "10px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                background: "#fff",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) =>
                (e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)")
              }
            >
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group style={{ flex: "0 1 200px" }}>
            <Form.Label
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                color: "transparent",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                letterSpacing: "0.5px",
                padding: "5px 10px",
                borderRadius: "8px",
                display: "inline-block",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              title="Filter by order type"
            >
              <span style={{ marginRight: "5px" }}>📋</span> Order Type
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  transform: "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scaleX(1)")}
                onMouseLeave={(e) => (e.target.style.transform = "scaleX(0)")}
              />
            </Form.Label>
            <Form.Select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              style={{
                borderRadius: "20px",
                padding: "10px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                background: "#fff",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) =>
                (e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)")
              }
            >
              {uniqueOrderTypes.map((orderType) => (
                <option key={orderType} value={orderType}>
                  {orderType}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button
            onClick={exportToExcel}
            style={{
              background: "linear-gradient(135deg, #28a745, #4cd964)",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              color: "#fff",
              fontWeight: "600",
              marginBottom: "-45px",
              fontSize: "1rem",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              alignSelf: "center",
            }}
            onMouseEnter={(e) =>
              (e.target.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            Export to Excel
          </Button>
          {""}
          <Button
            onClick={clearFilters}
            style={{
              background:
                "linear-gradient(135deg,rgb(167, 110, 40),rgb(217, 159, 41))",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              color: "#fff",
              fontWeight: "600",
              marginBottom: "-45px",
              fontSize: "1rem",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              alignSelf: "center",
            }}
            onMouseEnter={(e) =>
              (e.target.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            Clear Filters
          </Button>
        </div>{" "}
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
                onClick={fetchOrders}
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

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Spinner
                animation="border"
                style={{ color: "#2575fc", width: "40px", height: "40px" }}
              />
              <p
                style={{
                  marginTop: "10px",
                  color: "#333",
                  fontSize: "1.1rem",
                  fontWeight: "500",
                }}
              >
                Loading orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ff8787)",
                color: "white",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                fontSize: "1.3rem",
                fontWeight: "500",
              }}
            >
              No approved orders available for production.
            </div>
          ) : (
            <>
              <div className="total-results " style={{ marginBottom: "20px" }}>
                <span>Total Orders: {filteredOrders.length}</span>
                <span>Total Pending: {totalPending}</span>
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
                    }}
                  >
                    <tr>
                      {[
                        "Order ID",
                        "So Date",
                        "Customer Name",
                        "Shipping Address",
                        "Customer Email",
                        "Contact No",
                        "Order Type",
                        "Product Details",
                        "Size",
                        "Spec",

                        "Model Nos",
                        "Remarks",
                        "Production Status",
                        "Quantity",
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
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const firstProduct =
                        Array.isArray(order.products) &&
                        order.products.length > 0
                          ? order.products[0]
                          : {};
                      const totalQty = Array.isArray(order.products)
                        ? order.products.reduce(
                            (sum, p) => sum + (p.qty || 0),
                            0
                          )
                        : "N/A";
                      const productDetails = Array.isArray(order.products)
                        ? order.products
                            .map(
                              (p) =>
                                `${p.productType || "N/A"} (${p.qty || "N/A"})`
                            )
                            .join(", ")
                        : "N/A";
                      return (
                        <tr
                          key={order._id}
                          style={{
                            background: index % 2 === 0 ? "#f8f9fa" : "#fff",
                            transition: "all 0.3s ease",
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
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
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
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={
                              order.soDate
                                ? new Date(order.soDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "N/A"
                            }
                          >
                            {order.soDate
                              ? new Date(order.soDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
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
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "200px",
                            }}
                            title={order.shippingAddress || "N/A"}
                          >
                            {order.shippingAddress || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={order.customerEmail || "N/A"}
                          >
                            {order.customerEmail || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={order.contactNo || "N/A"}
                          >
                            {order.contactNo || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={order.orderType || "N/A"}
                          >
                            {order.orderType || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "200px",
                            }}
                            title={productDetails}
                          >
                            {productDetails}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={firstProduct.size || "N/A"}
                          >
                            {firstProduct.size || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={firstProduct.spec || "N/A"}
                          >
                            {firstProduct.spec || "N/A"}
                          </td>

                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={
                              firstProduct.modelNos?.length > 0
                                ? firstProduct.modelNos.join(", ")
                                : "N/A"
                            }
                          >
                            {firstProduct.modelNos?.length > 0
                              ? firstProduct.modelNos.join(", ")
                              : "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={order.remarks || "N/A"}
                          >
                            {order.remarks || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "150px",
                            }}
                            title={order.fulfillingStatus || "Pending"}
                          >
                            <Badge
                              style={{
                                background:
                                  order.fulfillingStatus === "Under Process"
                                    ? "linear-gradient(135deg, #f39c12, #f7c200)"
                                    : order.fulfillingStatus === "Pending"
                                    ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
                                    : order.fulfillingStatus ===
                                      "Partial Dispatch"
                                    ? "linear-gradient(135deg, #00c6ff, #0072ff)"
                                    : order.fulfillingStatus === "Fulfilled"
                                    ? "linear-gradient(135deg, #28a745, #4cd964)"
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
                              {order.fulfillingStatus || "Pending"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              color: "#2c3e50",
                              fontSize: "1rem",
                              borderBottom: "1px solid #eee",
                              height: "40px",
                              lineHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100px",
                            }}
                            title={totalQty}
                          >
                            {totalQty}
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              textAlign: "center",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "center",
                                marginTop: "25px",
                                alignItems: "center",
                              }}
                            >
                              <Button
                                variant="primary"
                                onClick={() => handleView(order)}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "22px",
                                  padding: "0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        {/* Edit Modal */}
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
              Edit Production Order
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
                  Production Status
                </Form.Label>
                <Form.Select
                  value={formData.fulfillingStatus || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fulfillingStatus: e.target.value,
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
                  <option value="Under Process">Under Process</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial Dispatch">Partial Dispatch</option>
                  <option value="Fulfilled">Completed</option>
                </Form.Select>
              </Form.Group>
              {formData.productUnits.length > 0 ? (
                formData.productUnits.map((unit, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "20px",
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "10px",
                    }}
                  >
                    <h5 style={{ fontSize: "1.1rem", color: "#333" }}>
                      {unit.productType} - Unit {index + 1}
                    </h5>
                    <Form.Group style={{ marginBottom: "15px" }}>
                      <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                        Spec
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={unit.spec || ""}
                        onChange={(e) => {
                          const newUnits = [...formData.productUnits];
                          newUnits[index].spec = e.target.value;
                          setFormData({ ...formData, productUnits: newUnits });
                        }}
                        placeholder={`Model No for ${unit.productType} Unit ${
                          index + 1
                        }`}
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
                      />
                    </Form.Group>
                    <Form.Group style={{ marginBottom: "15px" }}>
                      <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                        Model Number
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={unit.modelNo || ""}
                        onChange={(e) => {
                          const newUnits = [...formData.productUnits];
                          newUnits[index].modelNo = e.target.value;
                          setFormData({ ...formData, productUnits: newUnits });
                        }}
                        placeholder={`Model No for ${unit.productType} Unit ${
                          index + 1
                        }`}
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
                      />
                    </Form.Group>
                  </div>
                ))
              ) : (
                <p style={{ color: "#555" }}>No products available to edit.</p>
              )}
              <Form.Group style={{ marginBottom: "20px" }}>
                <Form.Label style={{ fontWeight: "600", color: "#333" }}>
                  Remarks by Production <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.remarksByProduction || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remarksByProduction: e.target.value,
                    })
                  }
                  placeholder="Enter production remarks"
                  style={{
                    borderRadius: "10px",
                    border: errors.remarksByProduction
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
                {errors.remarksByProduction && (
                  <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.remarksByProduction}
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
        {/* View Modal */}
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          backdrop="static"
          keyboard={false}
          size="lg"
        >
          <Modal.Header
            closeButton
            style={{
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              color: "#fff",
              padding: "20px",
              borderBottom: "none",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Modal.Title
              style={{
                fontWeight: "700",
                fontSize: "1.8rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                textShadow: "1px 1px 3px rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ marginRight: "10px", fontSize: "1.5rem" }}>
                📋
              </span>
              Production Order Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              padding: "30px",
              background: "#fff",
              borderRadius: "0 0 15px 15px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {viewOrder && (
              <>
                <div
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "10px",
                    padding: "20px",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "15px",
                      textTransform: "uppercase",
                    }}
                  >
                    Order Information
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Order ID:</strong> {viewOrder.orderId || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>SO Date:</strong>{" "}
                      {viewOrder.soDate
                        ? new Date(viewOrder.soDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Customer Name:</strong>{" "}
                      {viewOrder.customername || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Shipping Address:</strong>{" "}
                      {viewOrder.shippingAddress || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Customer Email:</strong>{" "}
                      {viewOrder.customerEmail || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Contact No:</strong>{" "}
                      {viewOrder.contactNo || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Order Type:</strong>{" "}
                      {viewOrder.orderType || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Sales Order Remarks:</strong>{" "}
                      {viewOrder.remarks || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Dispatch From:</strong>{" "}
                      {viewOrder.dispatchFrom || "N/A"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "10px",
                    padding: "20px",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "20px",
                      textTransform: "uppercase",
                      borderBottom: "2px solid #e0e0e0",
                      paddingBottom: "10px",
                    }}
                  >
                    Product Information
                  </h3>
                  {Array.isArray(viewOrder.products) &&
                  viewOrder.products.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                      }}
                    >
                      {viewOrder.products.map((product, index) => (
                        <div
                          key={index}
                          style={{
                            background: "#ffffff",
                            borderRadius: "8px",
                            padding: "15px",
                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: "600",
                              color: "#2575fc",
                              marginBottom: "15px",
                            }}
                          >
                            Product {index + 1}
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                              gap: "12px",
                              fontSize: "1rem",
                              color: "#555",
                            }}
                          >
                            <div>
                              <strong>Type:</strong>{" "}
                              {product.productType || "N/A"}
                            </div>
                            <div>
                              <strong>Quantity:</strong> {product.qty || "N/A"}
                            </div>
                            <div>
                              <strong>Size:</strong> {product.size || "N/A"}
                            </div>
                            <div>
                              <strong>Spec:</strong> {product.spec || "N/A"}
                            </div>
                            <div>
                              <strong>Unit Price:</strong>{" "}
                              {product.unitPrice
                                ? `₹${parseFloat(product.unitPrice).toFixed(2)}`
                                : "N/A"}
                            </div>

                            <div>
                              <strong>Model Nos:</strong>{" "}
                              {product.modelNos?.length > 0
                                ? product.modelNos.join(", ")
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "1rem",
                        color: "#555",
                        textAlign: "center",
                        padding: "20px",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <strong>No Products Available</strong>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "10px",
                    padding: "20px",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "15px",
                      textTransform: "uppercase",
                    }}
                  >
                    Production Information
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Production Status:</strong>{" "}
                      {viewOrder.fulfillingStatus || "Pending"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Remarks:</strong>{" "}
                      {viewOrder.remarksByProduction || "N/A"}
                    </span>
                    <span style={{ fontSize: "1rem", color: "#555" }}>
                      <strong>Total Quantity:</strong>{" "}
                      {Array.isArray(viewOrder.products)
                        ? viewOrder.products.reduce(
                            (sum, p) => sum + (p.qty || 0),
                            0
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleCopy}
                  style={{
                    background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                    border: "none",
                    padding: "12px",
                    borderRadius: "25px",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "1.1rem",
                    textTransform: "uppercase",
                    transition: "all 0.3s ease",
                    boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.transform = "translateY(-3px)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.transform = "translateY(0)")
                  }
                >
                  {copied ? "✅ Copied!" : "📑 Copy Details"}
                </Button>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
      <footer
        className="footer-container"
        style={{
          padding: "10px",
          textAlign: "center",
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "white",
          marginTop: "auto",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          © 2025 Sales Order Management. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export default Production;
