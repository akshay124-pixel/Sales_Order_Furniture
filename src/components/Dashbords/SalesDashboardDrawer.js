import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { Button } from "react-bootstrap";
import { X, Download } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

// Styled Components (unchanged)
const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.isOpen ? "block" : "none")};
`;

const DrawerContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80vh;
  max-height: 80vh;
  background: linear-gradient(135deg, #e6f0fa, #f3e8ff);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transform: translateY(${(props) => (props.isOpen ? "0" : "100%")});
  transition: transform 0.4s ease-in-out;
  overflow: hidden;
  padding: 20px;
  font-family: "Poppins", sans-serif;
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  border-radius: 12px;
  margin-bottom: 20px;
`;

const DrawerTitle = styled.h3`
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  margin: 0;
`;

const CloseButton = styled(Button)`
  background: #dc3545;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover {
    background: #b02a37;
  }
`;

const ExportButton = styled(Button)`
  background: #28a745;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover {
    background: #218838;
  }
`;
const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-height: calc(80vh - 100px); /* Adjust to account for DrawerHeader */
`;

const DashboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const TotalHeaderRow = styled.tr`
  background: linear-gradient(135deg, #1e3a8a, #4b0082);
  position: sticky;
  top: 0;
  z-index: 11;
`;

const TableHeaderRow = styled.tr`
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  position: sticky;
  top: 44px; /* Height of TotalHeaderRow to stack below it */
  z-index: 10;
`;
const TableHeader = styled.th`
  padding: 12px 15px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  text-align: left;
  &:nth-child(1) {
    width: 20%;
  }
  &:nth-child(2) {
    width: 12%;
  }
  &:nth-child(3) {
    width: 16%;
  }
  &:nth-child(4) {
    width: 16%;
  }
  &:nth-child(5) {
    width: 16%;
  }
  &:nth-child(6) {
    width: 12%;
  }
  &:nth-child(7) {
    width: 12%;
  }
`;

const TotalHeader = styled.th`
  padding: 12px 15px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  text-align: left;
  &:nth-child(1) {
    width: 20%;
  }
  &:nth-child(2) {
    width: 12%;
  }
  &:nth-child(3) {
    width: 16%;
  }
  &:nth-child(4) {
    width: 16%;
  }
  &:nth-child(5) {
    width: 16%;
  }
  &:nth-child(6) {
    width: 12%;
  }
  &:nth-child(7) {
    width: 12%;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #e6f0fa;
  font-size: 0.9rem;
  color: #1e3a8a;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:nth-child(1) {
    width: 20%;
  }
  &:nth-child(2) {
    width: 12%;
  }
  &:nth-child(3) {
    width: 16%;
  }
  &:nth-child(4) {
    width: 16%;
  }
  &:nth-child(5) {
    width: 16%;
  }
  &:nth-child(6) {
    width: 12%;
  }
  &:nth-child(7) {
    width: 12%;
  }
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f0f7ff;
  }
`;

const SalesDashboardDrawer = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }
      const response = await axios.get("http://localhost:4000/api/get-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched orders:", response.data); // Debug: Log raw orders
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(
        `Failed to fetch orders: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isOpen) {
      // Initial fetch when drawer opens
      fetchOrders();

      // Connect to Socket.IO server
      const socket = io("http://localhost:4000", {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Connected to Socket.IO server, ID:", socket.id);
        socket.emit("join", "global"); // Join global room
        toast.success("Connected to real-time updates!");
      });

      socket.on("orderUpdate", (data) => {
        console.log("Order update received:", data);
        fetchOrders(); // Refetch orders on any change
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error.message);
        toast.error(`Connection to server failed: ${error.message}`);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket.IO disconnected:", reason);
        if (reason !== "io client disconnect") {
          toast.warn(`Disconnected from server: ${reason}. Reconnecting...`);
        }
      });

      socket.on("reconnect", (attempt) => {
        console.log("Socket.IO reconnected after attempt:", attempt);
        toast.success("Reconnected to server!");
        fetchOrders(); // Refetch orders on reconnect
      });

      // Cleanup on unmount or when drawer closes
      return () => {
        socket.disconnect();
        console.log("Socket.IO disconnected");
      };
    }
  }, [isOpen]);

  // Memoize sales analytics computation based on createdBy
  const salesAnalytics = useMemo(() => {
    console.log("Computing sales analytics for orders:", orders); // Debug: Log orders being processed
    return orders.reduce((acc, order) => {
      // Use createdBy.username for grouping
      const createdBy = order.createdBy?.username?.trim() || "Sales Order Team";
      console.log(`Order ID: ${order.orderId}, CreatedBy: ${createdBy}`); // Debug: Log assignment

      // Initialize createdBy data
      if (!acc[createdBy]) {
        acc[createdBy] = {
          totalOrders: 0,
          totalAmount: 0,
          totalPaymentCollected: 0,
          totalPaymentDue: 0,
          dueOver30Days: 0,
          totalUnitPrice: 0,
        };
      }

      // Parse and validate values
      const total = Number(order.total) || 0;
      const paymentCollected = parseFloat(order.paymentCollected) || 0;
      const paymentDue = parseFloat(order.paymentDue) || 0;

      // Calculate total unit price from products
      const unitPriceTotal =
        order.products?.reduce((sum, product) => {
          const unitPrice = Number(product.unitPrice) || 0;
          const qty = Number(product.qty) || 0;
          return sum + unitPrice * qty;
        }, 0) || 0;

      // Increment totals
      if (isFinite(total)) {
        acc[createdBy].totalOrders += 1;
        acc[createdBy].totalAmount += total;
      }
      if (isFinite(paymentCollected)) {
        acc[createdBy].totalPaymentCollected += paymentCollected;
      }
      if (isFinite(paymentDue)) {
        acc[createdBy].totalPaymentDue += paymentDue;
      }
      if (isFinite(unitPriceTotal)) {
        acc[createdBy].totalUnitPrice += unitPriceTotal;
      }

      // Calculate due amount over 30 days
      const soDate = order.soDate ? new Date(order.soDate) : null;
      const currentDate = new Date();
      if (
        soDate &&
        !isNaN(soDate.getTime()) &&
        isFinite(paymentDue) &&
        paymentDue > 0
      ) {
        const daysSinceOrder = Math.floor(
          (currentDate - soDate) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceOrder > 30) {
          acc[createdBy].dueOver30Days += paymentDue;
        }
      }

      return acc;
    }, {});
  }, [orders]);

  // Calculate overall totals
  const overallTotals = Object.values(salesAnalytics).reduce(
    (acc, data) => ({
      totalOrders: acc.totalOrders + data.totalOrders,
      totalAmount: acc.totalAmount + data.totalAmount,
      totalPaymentCollected:
        acc.totalPaymentCollected + data.totalPaymentCollected,
      totalPaymentDue: acc.totalPaymentDue + data.totalPaymentDue,
      dueOver30Days: acc.dueOver30Days + data.dueOver30Days,
      totalUnitPrice: acc.totalUnitPrice + data.totalUnitPrice,
    }),
    {
      totalOrders: 0,
      totalAmount: 0,
      totalPaymentCollected: 0,
      totalPaymentDue: 0,
      dueOver30Days: 0,
      totalUnitPrice: 0,
    }
  );

  // Convert to array for table rendering
  const analyticsData = Object.entries(salesAnalytics).map(
    ([createdBy, data]) => ({
      createdBy,
      totalOrders: data.totalOrders,
      totalAmount: Number(data.totalAmount.toFixed(2)),
      totalPaymentCollected: Number(data.totalPaymentCollected.toFixed(2)),
      totalPaymentDue: Number(data.totalPaymentDue.toFixed(2)),
      dueOver30Days: Number(data.dueOver30Days.toFixed(2)),
      totalUnitPrice: Number(data.totalUnitPrice.toFixed(2)),
    })
  );

  // Handle Excel export
  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = [
        // Add overall totals as the first row
        {
          "Created By": "Overall Totals",
          "Total Orders": overallTotals.totalOrders,
          "Total Amount (₹)": overallTotals.totalAmount.toFixed(2),
          "Payment Collected (₹)":
            overallTotals.totalPaymentCollected.toFixed(2),
          "Payment Due (₹)": overallTotals.totalPaymentDue.toFixed(2),
          "Due Over 30 Days (₹)": overallTotals.dueOver30Days.toFixed(2),
          "Total Unit Price (₹)": overallTotals.totalUnitPrice.toFixed(2),
        },
        // Add a blank row for separation
        {},

        ...analyticsData.map((data) => ({
          "Created By": data.createdBy,
          "Total Orders": data.totalOrders,
          "Total Amount (₹)": data.totalAmount.toFixed(2),
          "Payment Collected (₹)": data.totalPaymentCollected.toFixed(2),
          "Payment Due (₹)": data.totalPaymentDue.toFixed(2),
          "Due Over 30 Days (₹)": data.dueOver30Days.toFixed(2),
          "Total Unit Price (₹)": data.totalUnitPrice.toFixed(2),
        })),
      ];

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Customize column widths
      worksheet["!cols"] = [
        { wch: 20 }, // Created By
        { wch: 12 }, // Total Orders
        { wch: 16 }, // Total Amount
        { wch: 16 }, // Payment Collected
        { wch: 16 }, // Payment Due
        { wch: 16 }, // Due Over 30 Days
        { wch: 16 }, // Total Unit Price
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Analytics");

      // Generate file buffer
      const fileBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Create Blob and trigger download
      const blob = new Blob([fileBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sales_Analytics_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exported sales analytics to Excel!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel. Please try again.");
    }
  };

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={onClose} />
      <DrawerContainer isOpen={isOpen}>
        <DrawerHeader>
          <DrawerTitle>Sales Orders Analytics</DrawerTitle>
          <div style={{ display: "flex", gap: "10px" }}>
            <ExportButton onClick={handleExportToExcel}>
              <Download size={18} />
              Export Excel
            </ExportButton>
            <CloseButton onClick={onClose}>
              <X size={18} />
              Close
            </CloseButton>
          </div>
        </DrawerHeader>
        <TableContainer>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              Loading...
            </div>
          ) : (
            <DashboardTable>
              <thead>
                <TotalHeaderRow>
                  <TotalHeader>Overall Totals</TotalHeader>
                  <TotalHeader>{overallTotals.totalOrders}</TotalHeader>
                  <TotalHeader>
                    ₹{overallTotals.totalAmount.toLocaleString("en-IN")}
                  </TotalHeader>
                  <TotalHeader>
                    ₹
                    {overallTotals.totalPaymentCollected.toLocaleString(
                      "en-IN"
                    )}
                  </TotalHeader>
                  <TotalHeader>
                    ₹{overallTotals.totalPaymentDue.toLocaleString("en-IN")}
                  </TotalHeader>
                  <TotalHeader>
                    ₹{overallTotals.dueOver30Days.toLocaleString("en-IN")}
                  </TotalHeader>
                  <TotalHeader>
                    ₹{overallTotals.totalUnitPrice.toLocaleString("en-IN")}
                  </TotalHeader>
                </TotalHeaderRow>
                <TableHeaderRow>
                  <TableHeader>Sales Persons</TableHeader>
                  <TableHeader>Total Orders</TableHeader>
                  <TableHeader>Total Amount (₹)</TableHeader>
                  <TableHeader>Payment Collected (₹)</TableHeader>
                  <TableHeader>Payment Due (₹)</TableHeader>
                  <TableHeader>Due Over 30 Days (₹)</TableHeader>
                  <TableHeader>Total Unit Price (₹)</TableHeader>
                </TableHeaderRow>
              </thead>
              <tbody>
                {analyticsData.length > 0 ? (
                  analyticsData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.createdBy}</TableCell>
                      <TableCell>{data.totalOrders}</TableCell>
                      <TableCell>
                        ₹{data.totalAmount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        ₹{data.totalPaymentCollected.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        ₹{data.totalPaymentDue.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        ₹{data.dueOver30Days.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        ₹{data.totalUnitPrice.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} style={{ textAlign: "center" }}>
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </DashboardTable>
          )}
        </TableContainer>
      </DrawerContainer>
    </>
  );
};

export default SalesDashboardDrawer;
