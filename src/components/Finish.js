import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button, Modal, Badge } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import OutFinishedGoodModal from "./OutFinishedGoodModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

// Styled Component for DatePicker
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

function Finish() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [freightStatusFilter, setFreightStatusFilter] = useState("");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [dispatchFromFilter, setDispatchFromFilter] = useState("");
  const [dispatchedFilter, setDispatchedFilter] = useState("");
  const [productionStatusFilter, setProductionStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [productQuantity, setProductQuantity] = useState(0);

  const dispatchFromOptions = [
    "",
    "Patna",
    "Bareilly",
    "Ranchi",
    "Morinda",
    "Lucknow",
    "Delhi",
  ];

  const fetchFinishedGoods = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_URL}/api/finished-goods`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        // Map backend 'Fulfilled' to frontend 'Completed'
        const sortedData = response.data.data
          .map((order) => ({
            ...order,
            fulfillingStatus:
              order.fulfillingStatus === "Fulfilled"
                ? "Completed"
                : order.fulfillingStatus,
          }))
          .sort((a, b) => {
            const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
            const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
            return dateB - dateA;
          });
        setOrders(sortedData);
        setFilteredOrders(sortedData);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch finished goods data"
        );
      }
    } catch (error) {
      console.error("Error fetching finished goods:", error);

      let userFriendlyMessage =
        error.response?.data?.message ||
        error.message ||
        "Sorry! We couldn’t load the finished goods data right now.";

      // Extra friendly explanations for common cases
      if (userFriendlyMessage.includes("Network Error")) {
        userFriendlyMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (userFriendlyMessage.includes("401")) {
        userFriendlyMessage =
          "Your session has expired. Please log in again to continue.";
      } else if (userFriendlyMessage.includes("404")) {
        userFriendlyMessage =
          "We couldn't find the finished goods data. It might be moved or deleted.";
      } else if (userFriendlyMessage.includes("500")) {
        userFriendlyMessage =
          "The server is facing some issues. Please try again later.";
      }

      toast.error(userFriendlyMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinishedGoods();
  }, [fetchFinishedGoods]);

  // Apply filters, search, and calculate results
  useEffect(() => {
    let filtered = [...orders];
    let totalProductQuantity = 0;

    // Apply freight status filter
    if (freightStatusFilter) {
      filtered = filtered.filter(
        (order) => order.freightstatus === freightStatusFilter
      );
    }

    // Apply dispatch status filter
    if (dispatchStatusFilter) {
      filtered = filtered.filter(
        (order) => order.dispatchStatus === dispatchStatusFilter
      );
    }

    // Apply order type filter
    if (orderTypeFilter) {
      filtered = filtered.filter(
        (order) => order.orderType === orderTypeFilter
      );
    }

    // Apply dispatchFrom filter
    if (dispatchFromFilter) {
      filtered = filtered.filter(
        (order) => order.dispatchFrom === dispatchFromFilter
      );
    }

    // Apply dispatched filter
    if (dispatchedFilter) {
      filtered = filtered.filter((order) =>
        dispatchedFilter === "Dispatched"
          ? order.dispatchStatus === "Dispatched" ||
            order.dispatchStatus === "Docket Awaited Dispatched"
          : order.dispatchStatus === "Not Dispatched"
      );
    }

    // Apply production status filter
    if (productionStatusFilter) {
      filtered = filtered.filter(
        (order) => order.fulfillingStatus === productionStatusFilter
      );
    }

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

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const productDetails = order.products
          ? order.products
              .map((p) => `${p.productType} (${p.qty})`)
              .join(", ")
              .toLowerCase()
          : "";
        const specDetails = order.products
          ? order.products
              .map((p) => p.spec || "N/A")
              .join(", ")
              .toLowerCase()
          : "";
        const sizeDetails = order.products
          ? order.products
              .map((p) => p.size || "N/A")
              .join(", ")
              .toLowerCase()
          : "";
        const totalQty = order.products
          ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0).toString()
          : "N/A";
        const modelNos = order.products
          ? order.products
              .flatMap((p) => p.modelNos || [])
              .filter(Boolean)
              .join(", ")
              .toLowerCase() || "N/A"
          : "";
        const soDate = order.soDate
          ? new Date(order.soDate).toLocaleDateString().toLowerCase()
          : "N/A";
        const dispatchFrom = order.dispatchFrom
          ? order.dispatchFrom.toLowerCase()
          : "N/A";
        const productStatus = order.fulfillingStatus || "N/A";
        const orderType = order.orderType || "N/A";

        // Check if search term matches product type for quantity counting
        const matchingProducts = (order.products || []).filter((p) =>
          p.productType?.toLowerCase().includes(lowerSearch)
        );
        if (matchingProducts.length > 0) {
          totalProductQuantity += matchingProducts.reduce(
            (sum, p) => sum + Math.floor(p.qty || 0),
            0
          );
        }

        return (
          (order.orderId || "N/A").toLowerCase().includes(lowerSearch) ||
          (order.customername || "N/A").toLowerCase().includes(lowerSearch) ||
          (order.contactNo || "N/A").toLowerCase().includes(lowerSearch) ||
          (order.shippingAddress || "N/A")
            .toLowerCase()
            .includes(lowerSearch) ||
          productDetails.includes(lowerSearch) ||
          modelNos.includes(lowerSearch) ||
          sizeDetails.includes(lowerSearch) ||
          specDetails.includes(lowerSearch) ||
          totalQty.includes(lowerSearch) ||
          (order.salesPerson || "N/A").toLowerCase().includes(lowerSearch) ||
          soDate.includes(lowerSearch) ||
          dispatchFrom.includes(lowerSearch) ||
          (order.freightstatus || "To Pay")
            .toLowerCase()
            .includes(lowerSearch) ||
          productStatus.toLowerCase().includes(lowerSearch) ||
          (order.dispatchStatus || "Not Dispatched")
            .toLowerCase()
            .includes(lowerSearch) ||
          orderType.toLowerCase().includes(lowerSearch)
        );
      });
    } else {
      totalProductQuantity = filtered.reduce((sum, order) => {
        return (
          sum +
          (order.products
            ? order.products.reduce((sum, p) => sum + Math.floor(p.qty || 0), 0)
            : 0)
        );
      }, 0);
    }

    // Sort filtered orders by soDate in descending order (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
      const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
    setTotalResults(filtered.length);
    setProductQuantity(totalProductQuantity);
  }, [
    freightStatusFilter,
    dispatchStatusFilter,
    orderTypeFilter,
    dispatchFromFilter,
    dispatchedFilter,
    productionStatusFilter,
    searchTerm,
    startDate,
    endDate,
    orders,
  ]);

  const uniqueOrderTypes = [
    "",
    ...new Set(orders.map((order) => order.orderType || "N/A")),
  ];

  const handleReset = () => {
    setFreightStatusFilter("");
    setDispatchStatusFilter("");
    setOrderTypeFilter("");
    setDispatchFromFilter("");
    setDispatchedFilter("");
    setProductionStatusFilter("");
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    // Sort orders by soDate in descending order
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
      const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
      return dateB - dateA;
    });
    setFilteredOrders(sortedOrders);
    setTotalResults(sortedOrders.length);
    setProductQuantity(
      sortedOrders.reduce((sum, order) => {
        return (
          sum +
          (order.products
            ? order.products.reduce((sum, p) => sum + Math.floor(p.qty || 0), 0)
            : 0)
        );
      }, 0)
    );
    toast.info("Filters reset!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleEditClick = (order) => {
    console.log("handleEditClick order:", JSON.stringify(order, null, 2));
    console.log("order.billStatus:", order.billStatus);
    setEditData({
      dispatchFrom: order.dispatchFrom || "",

      billNumber: order.billNumber || "",
      transporterDetails: order.transporterDetails || "",
      dispatchDate: order.dispatchDate
        ? new Date(order.dispatchDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      docketNo: order.docketNo || "",
      receiptDate: order.receiptDate
        ? new Date(order.receiptDate).toISOString().split("T")[0]
        : "",
      dispatchStatus: order.dispatchStatus || "Not Dispatched",
      remarksBydispatch: order.remarksBydispatch || "",
      _id: order._id,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (updatedEntry) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders
        .map((order) => (order._id === updatedEntry._id ? updatedEntry : order))
        .filter((order) => order.dispatchStatus !== "Delivered");
      // Sort updated orders by soDate in descending order
      return updatedOrders.sort((a, b) => {
        const dateA = a.soDate ? new Date(a.soDate) : new Date(0);
        const dateB = b.soDate ? new Date(b.soDate) : new Date(0);
        return dateB - dateA;
      });
    });
    setIsModalOpen(false);
    toast.success(
      `Order updated successfully! Status: ${updatedEntry.dispatchStatus}`,
      {
        position: "top-right",
        autoClose: 3000,
      }
    );
    fetchFinishedGoods();
  };

  const handleView = (order) => {
    setViewOrder(order);
    setShowViewModal(true);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!viewOrder) return;
    const productsText = viewOrder.products
      ? viewOrder.products
          .map(
            (p, i) =>
              `Product ${i + 1}: ${p.productType || "N/A"} (Qty: ${
                p.qty || "N/A"
              }, Serial Nos: ${p.serialNos?.join(", ") || "N/A"}, Model Nos: ${
                p.modelNos?.join(", ") || "N/A"
              })`
          )
          .join("\n")
      : "N/A";
    const orderText = `
      Order ID: ${viewOrder.orderId || "N/A"}
      Serial Nos: ${viewOrder.serialNos?.join(", ") || "N/A"}
      Model Nos: ${viewOrder.modelNos?.join(", ") || "N/A"}
      Bill No: ${viewOrder.billNumber || "N/A"}
      Products:\n${productsText}
      SO Date: ${
        viewOrder.soDate
          ? new Date(viewOrder.soDate).toLocaleDateString()
          : "N/A"
      }
      Dispatch Date: ${
        viewOrder.dispatchDate
          ? new Date(viewOrder.dispatchDate).toLocaleDateString()
          : "N/A"
      }
      Dispatch From: ${viewOrder.dispatchFrom || "N/A"}
      Customer: ${viewOrder.customername || "N/A"}
      Address: ${
        viewOrder.shippingAddress ||
        `${viewOrder.city || ""}, ${viewOrder.state || ""}` ||
        "N/A"
      }
      Dispatch Status: ${viewOrder.dispatchStatus || "Not Dispatched"}
    `.trim();
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    toast.success("Details copied to clipboard!", {
      position: "top-right",
      autoClose: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToXLSX = () => {
    const tableData = filteredOrders.map((order) => ({
      "Order ID": order.orderId || "N/A",
      "Customer Name": order.customername || "N/A",
      "Contact No": order.contactNo || "N/A",
      "Delivery Address": order.shippingAddress || "N/A",
      "Product Name": order.products
        ? order.products.map((p) => `${p.productType} (${p.qty})`).join(", ")
        : "N/A",
      "Model Nos": order.products
        ? order.products
            .flatMap((p) => p.modelNos || [])
            .filter(Boolean)
            .join(", ") || "N/A"
        : "N/A",
      Spec: order.products
        ? order.products.map((p) => p.spec || "N/A").join(", ")
        : "N/A",
      Size: order.products
        ? order.products.map((p) => p.size || "N/A").join(", ")
        : "N/A",
      "Serial Nos": order.products
        ? order.products
            .map((p) => {
              const serials = (p.serialNos || []).filter(Boolean);
              return serials.length > 0
                ? `${p.productType}: ${serials.join(", ")}`
                : null;
            })
            .filter(Boolean)
            .join("; ") || "N/A"
        : "N/A",
      Quantity: order.products
        ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
        : "N/A",
      "Sales Person": order.salesPerson || "N/A",
      "Production Remarks": order.remarksByProduction || "N/A",
      "SO Date": order.soDate
        ? new Date(order.soDate).toLocaleDateString()
        : "N/A",
      "Dispatch Date": order.dispatchDate
        ? new Date(order.dispatchDate).toLocaleDateString()
        : "N/A",
      "Dispatch From": order.dispatchFrom || "N/A",
      "Billing Status": order.billStatus || "Pending",
      "Freight Status": order.freightstatus || "To Pay",
      "Product Status": order.fulfillingStatus || "N/A",
      "Dispatch Status": order.dispatchStatus || "Not Dispatched",
      "Dispatch Remarks": order.remarksBydispatch || "Dispatch Remarks",
    }));

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Data");
    XLSX.writeFile(wb, "Dispatch_Dashboard.xlsx");
  };

  if (loading) {
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
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "5px solid #2575fc",
            borderTop: "5px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
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
          Loading Finished Goods...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={{
          width: "100%",
          margin: "0",
          padding: "20px",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          borderRadius: "0",
          boxShadow: "none",
          minHeight: "100vh",
          height: "100%",
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
            Dispatch Dashboard
          </h1>
        </header>

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1", minWidth: "250px" }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across all fields..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2575fc")}
                onBlur={(e) => (e.target.style.borderColor = "#ccc")}
              />
            </div>
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
              />
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
              />
            </DatePickerWrapper>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                  color: "#333",
                }}
              >
                Freight Status:
              </label>
              <select
                value={freightStatusFilter}
                onChange={(e) => setFreightStatusFilter(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">All</option>
                <option value="To Pay">To Pay</option>
                <option value="Including">Including</option>
                <option value="Extra">Extra</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                  color: "#333",
                }}
              >
                Order Type:
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              >
                {uniqueOrderTypes.map((orderType) => (
                  <option key={orderType} value={orderType}>
                    {orderType || "All"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                  color: "#333",
                }}
              >
                Dispatch From:
              </label>
              <select
                value={dispatchFromFilter}
                onChange={(e) => setDispatchFromFilter(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              >
                {dispatchFromOptions.map((dispatchFrom) => (
                  <option key={dispatchFrom} value={dispatchFrom}>
                    {dispatchFrom || "All"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                  color: "#333",
                }}
              >
                Dispatch Status:
              </label>
              <select
                value={dispatchStatusFilter}
                onChange={(e) => setDispatchStatusFilter(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">All</option>
                <option value="Not Dispatched">Not Dispatched</option>
                <option value="Dispatched">Dispatched</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  marginRight: "10px",
                  color: "#333",
                }}
              >
                Production Status:
              </label>
              <select
                value={productionStatusFilter}
                onChange={(e) => setProductionStatusFilter(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">All</option>
                <option value="Under Process">Under Process</option>
                <option value="Pending">Pending</option>
                <option value="Partial Dispatch">Partial Dispatch</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Button
              onClick={handleReset}
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ff8787)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Reset Filters
            </Button>
            <Button
              onClick={handleExportToXLSX}
              style={{
                background: "linear-gradient(135deg, #28a745, #4cd964)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "600",
              }}
            >
              Export to XLSX
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                borderRadius: "25px",
                padding: "12px 20px",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.9rem",
              }}
              title="Total number of matching orders"
            >
              Total Orders: {totalResults}
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #28a745, #4cd964)",
                borderRadius: "25px",
                padding: "12px 20px",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.9rem",
              }}
              title="Total quantity of matching products"
            >
              Total Product Quantity: {Math.floor(productQuantity)}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ff8787)",
                color: "#fff",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                fontSize: "1.3rem",
                fontWeight: "500",
              }}
            >
              No Dispatch available at this time.
            </div>
          ) : (
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
                      "Customer Name",
                      "Contact No",
                      "Delivery Address",
                      "Product Name",
                      "Model Nos",
                      "Spec",
                      "Size",
                      "Quantity",
                      "Sales Person",
                      "Production Remarks",
                      "SO Date",
                      "Dispatch Date",
                      "Dispatch From",
                      "Billing Status",
                      "Freight Status",
                      "Production Status",
                      "Dispatch Status",
                      "Stamp Signed",
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
                    const productDetails = order.products
                      ? order.products
                          .map((p) => `${p.productType} (${p.qty})`)
                          .join(", ")
                      : "N/A";
                    const sizeDetails = order.products
                      ? order.products.map((p) => p.size || "N/A").join(", ")
                      : "N/A";
                    const specDetails = order.products
                      ? order.products.map((p) => p.spec || "N/A").join(", ")
                      : "N/A";
                    const totalQty = order.products
                      ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
                      : "N/A";
                    const modelNos = order.products
                      ? order.products
                          .flatMap((p) => p.modelNos || [])
                          .filter(Boolean)
                          .join(", ") || "N/A"
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
                          title={modelNos}
                        >
                          {modelNos}
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
                          title={specDetails}
                        >
                          {specDetails}
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
                          title={sizeDetails}
                        >
                          {sizeDetails}
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
                          title={order.salesPerson || "N/A"}
                        >
                          {order.salesPerson || "N/A"}
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
                          title={order.remarksByProduction || "N/A"}
                        >
                          {order.remarksByProduction || "N/A"}
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
                              ? new Date(order.soDate).toLocaleDateString()
                              : "N/A"
                          }
                        >
                          {order.soDate
                            ? new Date(order.soDate).toLocaleDateString()
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
                          title={
                            order.dispatchDate
                              ? new Date(
                                  order.dispatchDate
                                ).toLocaleDateString()
                              : "N/A"
                          }
                        >
                          {order.dispatchDate
                            ? new Date(order.dispatchDate).toLocaleDateString()
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
                          title={order.dispatchFrom || "N/A"}
                        >
                          {order.dispatchFrom || "N/A"}
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
                          title={order.billStatus || "Pending"}
                        >
                          <Badge
                            style={{
                              background:
                                order.billStatus === "Pending"
                                  ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
                                  : order.billStatus === "Under Billing"
                                  ? "linear-gradient(135deg, #ffc107, #ffca2c)"
                                  : "linear-gradient(135deg, #28a745, #4cd964)",
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
                            {order.billStatus || "Pending"}
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
                            maxWidth: "150px",
                          }}
                          title={order.freightstatus || "To Pay"}
                        >
                          <Badge
                            style={{
                              background:
                                order.freightstatus === "To Pay"
                                  ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
                                  : order.freightstatus === "Including"
                                  ? "linear-gradient(135deg, #28a745, #4cd964)"
                                  : "linear-gradient(135deg, #ffc107, #ffca2c)",
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
                            {order.freightstatus || "To Pay"}
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
                            maxWidth: "150px",
                          }}
                          title={order.fulfillingStatus}
                        >
                          <Badge
                            style={{
                              background:
                                order.fulfillingStatus === "Under Process"
                                  ? "linear-gradient(135deg, #ff9800, #f44336)"
                                  : order.fulfillingStatus === "Pending"
                                  ? "linear-gradient(135deg, #ffeb3b, #ff9800)"
                                  : order.fulfillingStatus ===
                                    "Partial Dispatch"
                                  ? "linear-gradient(135deg, #00c6ff, #0072ff)"
                                  : "linear-gradient(135deg, #28a745, #4cd964)",
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
                            {order.fulfillingStatus}
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
                            maxWidth: "150px",
                          }}
                          title={order.dispatchStatus || "Not Dispatched"}
                        >
                          <Badge
                            style={{
                              background:
                                order.dispatchStatus === "Not Dispatched"
                                  ? "linear-gradient(135deg, #ff6b6b, #ff8787)" // Red for Not Dispatched
                                  : order.dispatchStatus ===
                                    "Docket Awaited Dispatched"
                                  ? "linear-gradient(135deg, #f39c12, #f7c200)"
                                  : order.dispatchStatus === "Dispatched"
                                  ? "linear-gradient(135deg, #00c6ff, #0072ff)" // Blue for Dispatched
                                  : order.dispatchStatus === "Delivered"
                                  ? "linear-gradient(135deg, #28a745, #4cd964)" // Green for Delivered
                                  : order.dispatchStatus ===
                                    "Hold by Salesperson"
                                  ? "linear-gradient(135deg, #007bff, #4dabf7)" // Blue (lighter) for Hold by Salesperson
                                  : order.dispatchStatus === "Hold by Customer"
                                  ? "linear-gradient(135deg, #8e44ad, #be94e6)" // Purple for Hold by Customer
                                  : order.dispatchStatus === "Order Cancelled"
                                  ? "linear-gradient(135deg, #6c757d, #5a6268)" // Gray for Order Cancelled
                                  : "linear-gradient(135deg, #6c757d, #a9a9a9)", // Default gray
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
                            {order.dispatchStatus || "Not Dispatched"}
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
                            maxWidth: "150px",
                          }}
                          title={order.stamp || "Not Received"}
                        >
                          <Badge
                            style={{
                              background:
                                order.stamp === "Received"
                                  ? "linear-gradient(135deg, #28a745, #4cd964)" // Green for Received
                                  : "linear-gradient(135deg, #ff6b6b, #ff8787)", // Red for Not Received
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
                            {order.stamp || "Not Received"}
                          </Badge>
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            height: "40px",
                            marginTop: "15px",
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
                              onClick={() => handleEditClick(order)}
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
          )}
        </div>
      </div>

      <footer className="footer-container">
        <p style={{ marginTop: "10px", color: "white", height: "20px" }}>
          © 2025 Sales Order Management. All rights reserved.
        </p>
      </footer>
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <style>
          {`
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .serial-nos-container {
        max-height: 100px;
        overflow-y: auto;
        padding: 5px 10px;
        background: #fff;
        border-radius: 5px;
        border: 1px solid #eee;
      }
      .serial-nos-container ul {
        margin: 0;
        padding-left: 20px;
      }
      .serial-nos-container li {
        font-size: 0.95rem;
        color: #555;
        line-height: 1.4;
      }
    `}
        </style>
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
            <span style={{ marginRight: "10px", fontSize: "1.5rem" }}>📋</span>
            Order Details
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
            animation: "fadeIn 0.5s ease-in-out",
          }}
        >
          {viewOrder && (
            <>
              {/* Product Info Section */}
              <div
                style={{
                  background: "#f8f9fa",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
                  animation: "fadeIn 0.5s ease-in-out",
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
                  Product Info
                </h3>
                {viewOrder.products && viewOrder.products.length > 0 ? (
                  viewOrder.products.map((product, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "10px",
                        padding: "10px 0",
                        borderBottom:
                          index < viewOrder.products.length - 1
                            ? "1px solid #eee"
                            : "none",
                        alignItems: "start",
                      }}
                    >
                      <span style={{ fontSize: "1rem", color: "#555" }}>
                        <strong>Product {index + 1}:</strong>{" "}
                        {product.productType || "N/A"}
                      </span>
                      <span style={{ fontSize: "1rem", color: "#555" }}>
                        <strong>Qty:</strong> {product.qty || "N/A"}
                      </span>
                      <span style={{ fontSize: "1rem", color: "#555" }}>
                        <strong>Size:</strong> {product.size || "N/A"}
                      </span>
                      <span style={{ fontSize: "1rem", color: "#555" }}>
                        <strong>Spec:</strong> {product.spec || "N/A"}
                      </span>

                      <span style={{ fontSize: "1rem", color: "#555" }}>
                        <strong>Model Nos:</strong>{" "}
                        {product.modelNos?.[0] || "N/A"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Products:</strong> N/A
                  </span>
                )}
              </div>

              {/* Order Details Section */}
              <div
                style={{
                  background: "#f8f9fa",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
                  animation: "fadeIn 0.5s ease-in-out",
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
                  Order Info
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Order ID:</strong> {viewOrder.orderId || "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>SO Date:</strong>{" "}
                    {viewOrder.soDate
                      ? new Date(viewOrder.soDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Dispatch Date:</strong>{" "}
                    {viewOrder.dispatchDate
                      ? new Date(viewOrder.dispatchDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Dispatch From:</strong>{" "}
                    {viewOrder.dispatchFrom || "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Customer:</strong> {viewOrder.customername || "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Address:</strong>{" "}
                    {viewOrder.shippingAddress || "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Dispatch Status:</strong>{" "}
                    {viewOrder.dispatchStatus || "Not Dispatched"}
                  </span>

                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Docket No:</strong> {viewOrder.docketNo || "N/A"}
                  </span>
                  <span style={{ fontSize: "1rem", color: "#555" }}>
                    <strong>Sales Person:</strong>{" "}
                    {viewOrder.salesPerson || "N/A"}
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
                  alignSelf: "flex-end",
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

      <OutFinishedGoodModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editData}
        entryToEdit={
          editData
            ? orders.find((o) => o._id === editData._id) || editData
            : null
        }
      />
    </>
  );
}

export default Finish;
