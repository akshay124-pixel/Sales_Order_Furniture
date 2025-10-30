import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaEye, FaBell } from "react-icons/fa";
import { Button, Badge, Popover } from "react-bootstrap";

import FilterSection from "./FilterSection";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { ArrowRight } from "lucide-react";
import io from "socket.io-client";
import styled from "styled-components";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import debounce from "lodash/debounce";
import SalesDashboardDrawer from "./Dashbords/SalesDashboardDrawer";
// Lazy load modals
const ViewEntry = React.lazy(() => import("./ViewEntry"));
const DeleteModal = React.lazy(() => import("./Delete"));
const EditEntry = React.lazy(() => import("./EditEntry"));
const AddEntry = React.lazy(() => import("./AddEntry"));

// Styled Components
const NotificationWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const NotificationIcon = styled(FaBell)`
  font-size: 1.9rem;
  color: blue;
  cursor: pointer;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: scale(1.2);
    color: #ffd700;
  }
`;

const NotificationBadge = styled(Badge)`
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 4px 8px;
  font-size: 0.75rem;
  background: #dc3545;
  border-radius: 50%;
  animation: pulse 2s infinite;
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const NotificationPopover = styled(Popover)`
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: #fff;
  border: none;
`;

const NotificationItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e6f0fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => (props.isRead ? "#f9f9f9" : "#e6f0fa")};
  transition: background 0.3s ease;
  &:hover {
    background: #d1e7ff;
  }
`;

const NotificationText = styled.div`
  font-size: 0.9rem;
  color: #1e3a8a;
  font-weight: ${(props) => (props.isRead ? "normal" : "600")};
  flex: 1;
`;

const NotificationTime = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 10px;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #e6f0fa;
  justify-content: space-between;
`;

const ClearButton = styled(Button)`
  background: #dc3545;
  border: none;
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
  &:hover {
    background: #b02a37;
  }
`;

const MarkReadButton = styled(Button)`
  background: #28a745;
  border: none;
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
  &:hover {
    background: #218838;
  }
`;

const DatePickerWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  .react-datepicker-wrapper {
    width: 150px;
  }
  .react-datepicker__input-container input {
    padding: 14px 20px;
    border-radius: 30px;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.4s ease;
    width: 100%;
    &:focus {
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
      transform: scale(1.02);
      outline: none;
    }
  }
  .react-datepicker,
  .react-datepicker-popper {
    z-index: 1000 !important;
  }
`;
// Updated columnWidths array (removed Credit Days width: 100)
const columnWidths = [
  60, // Seq No
  120, // Order ID
  160, // SO Date
  180, // Customer Name
  180, // Contact Person Name
  140, // Contact No
  200, // Customer Email
  140, // SO Status
  150, // Actions
  120, // Alternate No
  120, // City
  120, // State
  100, // Pin Code
  140, // GST No
  250, // Shipping Address
  250, // Billing Address
  250, // Description of Goods
  150, // Product Category
  100, // Size
  100, // Spec
  80, // Qty
  120, // Unit Price
  100, // GST
  120, // Total
  140, // Payment Collected
  140, // Payment Method
  140, // Payment Due
  140, // Payment Terms
  140, // Payment Received
  120, // Freight Charges
  120, // Actual Freight
  120, // Installation
  140, // Installation Report
  200, // Transporter Details
  140, // Dispatch From
  140, // Dispatch Status
  140, // Signed Stamp Receiving
  120, // Order Type
  120, // Report
  120, // Bill Status
  140, // Production Status
  120, // Bill Number
  120, // PI Number
  140, // Sales Person
  140, // Company
  140, // Created By
  200, // Remarks
];
// Recalculate totalTableWidth
const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

// Updated CSS for perfect table alignment
const tableStyles = `
/* Prevent horizontal page scrolling */
body {
  overflow-x: hidden;
}

/* Constrain outer container to viewport */
.outer-container {
  max-width: 100vw;
  overflow-x: hidden;
}

/* Sales table container */
.sales-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-height: 600px;
  overflow-y: auto;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #2575fc #e6f0fa;
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

/* Sales table */
.sales-table {
  width: 100%;
  min-width: ${totalTableWidth}px;
  table-layout: fixed;
  border-collapse: collapse;
  overflow-x: hidden;
}

/* Table header */
.sales-table thead tr {
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 2;
}

/* Table header cells */
.sales-table th {
  padding: 10px 15px;
  height: 50px;
  line-height: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  white-space: nowrap;
  text-align: center;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

/* Tooltip styling for headers and cells */
.sales-table th .tooltip-inner,
.sales-table td .tooltip-inner {
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  color: white;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  border-radius: 8px;
  padding: 8px 12px;
  max-width: 300px;
  text-align: center;
}

/* Table body rows */
.sales-table tbody tr {
  border-bottom: 1px solid #e6f0fa;
  transition: all 0.3s ease;
}

.sales-table tbody tr:hover {
  background-color: #f0f7ff;
}

/* Table body cells */
.sales-table td {
  padding: 10px 15px;
  height: 50px;
  line-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;
  cursor: pointer;
}

/* Contact Person Name specific styling */
.sales-table td.contact-person-name {
  font-weight: normal;
  text-align: center;
  list-style-type: none;
  padding-left: 15px;
  position: relative;
}
.sales-table td.contact-person-name::before,
.sales-table td.contact-person-name::after {
  content: none !important;
}

/* Badge styling */
.sales-table .badge {
  padding: 6px 12px;
  font-size: 0.9rem;
  display: inline-block;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Actions cell */
.sales-table .actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 5px;
  height: 50px;
  overflow: visible;
  flex-wrap: nowrap;
  cursor: default;
}

/* Action buttons */
.sales-table .actions-cell button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 1;
}

/* Reserve space for scrollbar */
.sales-table-container thead tr th:last-child {
  padding-right: 20px;
}

/* Virtualized list container */
.list-container {
  width: 100%;
  min-width: ${totalTableWidth}px;
}
`;

const Row = React.memo(({ index, style, data }) => {
  const {
    orders,
    handleViewClick,
    handleEditClick,
    handleDeleteClick,
    userRole,
    isOrderComplete,
    columnWidths,
    openTooltipId,
    setOpenTooltipId,
  } = data;

  const order = orders[index];
  const complete = isOrderComplete(order);
  const firstProduct =
    order.products && order.products[0] ? order.products[0] : {};
  const productDetails = order.products
    ? order.products.map((p) => `${p.productType} (${p.qty})`).join(", ")
    : "-";
  const totalUnitPrice = order.products
    ? order.products.reduce(
        (sum, p) => sum + (p.unitPrice || 0) * (p.qty || 0),
        0
      )
    : 0;
  const totalQty = order.products
    ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
    : 0;
  const gstValues = order.products
    ? order.products
        .map((p) => `${p.gst}`)
        .filter(Boolean)
        .join(", ")
    : "-";

  const getRowBackground = () => {
    if (isOrderComplete(order)) return "#ffffff";
    if (order.sostatus === "Approved") return "#e6ffed";
    if (order.sostatus === "Accounts Approved") return "#e6f0ff";
    return "#f3e8ff";
  };

  const getHoverBackground = () => {
    if (isOrderComplete(order)) return "#f0f7ff";
    if (order.sostatus === "Approved") return "#d1f7dc";
    if (order.sostatus === "Accounts Approved") return "#d1e4ff";
    return "#ede4ff";
  };

  return (
    <tr
      style={{
        ...style,
        backgroundColor: getRowBackground(),
        display: "table-row",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = getHoverBackground())
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = getRowBackground())
      }
    >
      {[
        { width: columnWidths[0], content: index + 1, title: `${index + 1}` },
        {
          width: columnWidths[1],
          content: order.orderId || "-",
          title: order.orderId || "-",
        },
        {
          width: columnWidths[2],
          content: order.soDate
            ? new Date(order.soDate).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "-",
          title: order.soDate
            ? new Date(order.soDate).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "-",
        },
        {
          width: columnWidths[3],
          content: order.customername || "-",
          title: order.customername || "-",
        },
        {
          width: columnWidths[4],
          content: order.name || "-",
          title: order.name || "-",
          className: "contact-person-name",
        },
        {
          width: columnWidths[5],
          content: order.contactNo || "-",
          title: order.contactNo || "-",
        },
        {
          width: columnWidths[6],
          content: order.customerEmail || "-",
          title: order.customerEmail || "-",
        },
        {
          width: columnWidths[7],
          content: (
            <Badge
              bg={
                order.sostatus === "Pending for Approval"
                  ? "warning"
                  : order.sostatus === "Accounts Approved"
                  ? "info"
                  : order.sostatus === "Approved"
                  ? "success"
                  : "secondary"
              }
            >
              {order.sostatus || "-"}
            </Badge>
          ),
          title: order.sostatus || "-",
        },
        {
          width: columnWidths[8],
          content: (
            <div className="actions-cell">
              <Button
                variant="primary"
                onClick={() => handleViewClick(order)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "50px",
                }}
              >
                <FaEye />
              </Button>
              {(userRole == "Admin" || userRole == "SuperAdmin") && (
                <>
                  <button
                    className="editBtn"
                    onClick={() => handleEditClick(order)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      padding: "0",
                      background: "#6b7280",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: "1",
                      marginBottom: "50px",
                    }}
                  >
                    <svg height="1em" viewBox="0 0 512 512" fill="#ffffff">
                      <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                    </svg>
                  </button>
                  <button
                    className="bin-button"
                    onClick={() => handleDeleteClick(order)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      padding: "0",
                      background: "#ef4444",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "50px",
                    }}
                  >
                    <svg
                      className="bin-top"
                      viewBox="0 0 39 7"
                      fill="none"
                      style={{ width: "20px", height: "5px" }}
                    >
                      <line
                        y1="5"
                        x2="39"
                        y2="5"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <line
                        x1="12"
                        y1="1.5"
                        x2="26.0357"
                        y2="1.5"
                        stroke="white"
                        strokeWidth="3"
                      />
                    </svg>
                    <svg
                      className="bin-bottom"
                      viewBox="0 0 33 39"
                      fill="none"
                      style={{ width: "20px", height: "20px" }}
                    >
                      <mask id="path-1-inside-1_8_19" fill="white">
                        <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                      </mask>
                      <path
                        d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                        fill="white"
                        mask="url(#path-1-inside-1_8_19)"
                      />
                      <path d="M12 6L12 29" stroke="white" strokeWidth="4" />
                      <path d="M21 6V29" stroke="white" strokeWidth="4" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ),
          title: "",
        },
        {
          width: columnWidths[9],
          content: order.alterno || "-",
          title: order.alterno || "-",
        },
        {
          width: columnWidths[10],
          content: order.city || "-",
          title: order.city || "-",
        },
        {
          width: columnWidths[11],
          content: order.state || "-",
          title: order.state || "-",
        },
        {
          width: columnWidths[12],
          content: order.pinCode || "-",
          title: order.pinCode || "-",
        },
        {
          width: columnWidths[13],
          content: order.gstno || "-",
          title: order.gstno || "-",
        },
        {
          width: columnWidths[14],
          content: order.shippingAddress || "-",
          title: order.shippingAddress || "-",
        },
        {
          width: columnWidths[15],
          content: order.billingAddress || "-",
          title: order.billingAddress || "-",
        },
        {
          width: columnWidths[16],
          content: productDetails,
          title: productDetails,
        },
        {
          width: columnWidths[17],
          content: firstProduct.productType || "-",
          title: firstProduct.productType || "-",
        },
        {
          width: columnWidths[18],
          content: firstProduct.size || "-",
          title: firstProduct.size || "-",
        },
        {
          width: columnWidths[19],
          content: firstProduct.spec || "-",
          title: firstProduct.spec || "-",
        },
        {
          width: columnWidths[20],
          content: totalQty || "-",
          title: totalQty || "-",
        },
        {
          width: columnWidths[21],
          content: `₹${totalUnitPrice.toFixed(2) || "0.00"}`,
          title: `₹${totalUnitPrice.toFixed(2) || "0.00"}`,
        },
        {
          width: columnWidths[22],
          content: `${gstValues}%`,
          title: gstValues,
        },
        {
          width: columnWidths[23],
          content: `₹${order.total?.toFixed(2) || "0.00"}`,
          title: `₹${order.total?.toFixed(2) || "0.00"}`,
        },
        {
          width: columnWidths[24],
          content: order.paymentCollected ? `₹${order.paymentCollected}` : "-",
          title: order.paymentCollected ? `₹${order.paymentCollected}` : "-",
        },
        {
          width: columnWidths[25],
          content: order.paymentMethod || "-",
          title: order.paymentMethod || "-",
        },
        {
          width: columnWidths[26],
          content: order.paymentDue ? `₹${order.paymentDue}` : "-",
          title: order.paymentDue ? `₹${order.paymentDue}` : "-",
        },
        {
          width: columnWidths[27],
          content: order.paymentTerms || "-",
          title: order.paymentTerms || "-",
        },
        {
          width: columnWidths[28],
          content: (
            <Badge
              bg={order.paymentReceived === "Received" ? "success" : "warning"}
            >
              {order.paymentReceived || "-"}
            </Badge>
          ),
          title: order.paymentReceived || "-",
        },
        {
          width: columnWidths[29],
          content: order.freightcs ? `₹${order.freightcs}` : "-",
          title: order.freightcs ? `₹${order.freightcs}` : "-",
        },
        {
          width: columnWidths[30],
          content: order.actualFreight
            ? `₹${order.actualFreight.toFixed(2)}`
            : "-",
          title: order.actualFreight
            ? `₹${order.actualFreight.toFixed(2)}`
            : "-",
        },
        {
          width: columnWidths[31],
          content: (
            <Badge
              bg={
                order.installationStatus === "Pending"
                  ? "warning"
                  : order.installationStatus === "In Progress"
                  ? "info"
                  : order.installationStatus === "Completed"
                  ? "success"
                  : "secondary"
              }
            >
              {order.installationStatus || "-"}
            </Badge>
          ),
          title: order.installationStatus || "-",
        },
        {
          width: columnWidths[32],
          content: (
            <Badge
              bg={order.installationReport === "Yes" ? "success" : "warning"}
            >
              {order.installationReport || "-"}
            </Badge>
          ),
          title: order.installationReport || "-",
        },
        {
          width: columnWidths[33],
          content: order.transporterDetails || "-",
          title: order.transporterDetails || "-",
        },
        {
          width: columnWidths[34],
          content: order.dispatchFrom || "-",
          title: order.dispatchFrom || "-",
        },
        {
          width: columnWidths[35],
          content: (
            <Badge
              bg={
                order.dispatchStatus === "Not Dispatched"
                  ? "warning"
                  : order.dispatchStatus === "Docket Awaited Dispatched"
                  ? "info"
                  : order.dispatchStatus === "Dispatched"
                  ? "primary"
                  : order.dispatchStatus === "Delivered"
                  ? "success"
                  : order.dispatchStatus === "Hold by Salesperson"
                  ? "dark"
                  : order.dispatchStatus === "Hold by Customer"
                  ? "light"
                  : order.dispatchStatus === "Order Cancelled"
                  ? "danger"
                  : "secondary"
              }
            >
              {order.dispatchStatus || "-"}
            </Badge>
          ),
          title: order.dispatchStatus || "-",
        },
        {
          width: columnWidths[36],
          content: (
            <Badge bg={order.stamp === "Received" ? "success" : "warning"}>
              {order.stamp || "-"}
            </Badge>
          ),
          title: order.stamp || "-",
        },
        {
          width: columnWidths[37],
          content: order.orderType || "-",
          title: order.orderType || "-",
        },
        {
          width: columnWidths[38],
          content: order.report || "-",
          title: order.report || "-",
        },
        {
          width: columnWidths[39],
          content: (
            <Badge
              bg={
                order.billStatus === "Pending"
                  ? "warning"
                  : order.billStatus === "Under Billing"
                  ? "info"
                  : order.billStatus === "Billing Complete"
                  ? "success"
                  : "secondary"
              }
            >
              {order.billStatus || "-"}
            </Badge>
          ),
          title: order.billStatus || "-",
        },
        {
          width: columnWidths[40],
          content: (
            <Badge
              style={{
                background:
                  order.fulfillingStatus === "Under Process"
                    ? "linear-gradient(135deg, #f39c12, #f7c200)"
                    : order.fulfillingStatus === "Pending"
                    ? "linear-gradient(135deg, #ff6b6b, #ff8787)"
                    : order.fulfillingStatus === "Partial Dispatch"
                    ? "linear-gradient(135deg, #00c6ff, #0072ff)"
                    : order.fulfillingStatus === "Fulfilled"
                    ? "linear-gradient(135deg, #28a745, #4cd964)"
                    : "linear-gradient(135deg, #6c757d, #a9a9a9)",
              }}
            >
              {order.fulfillingStatus || "Pending"}
            </Badge>
          ),
          title: order.fulfillingStatus || "Pending",
        },
        {
          width: columnWidths[41],
          content: order.billNumber || "-",
          title: order.billNumber || "-",
        },
        {
          width: columnWidths[42],
          content: order.piNumber || "-",
          title: order.piNumber || "-",
        },
        {
          width: columnWidths[43],
          content: order.salesPerson || "-",
          title: order.salesPerson || "-",
        },
        {
          width: columnWidths[44],
          content: order.company || "-",
          title: order.company || "-",
        },
        {
          width: columnWidths[45],
          content:
            order.createdBy && typeof order.createdBy === "object"
              ? order.createdBy.username || "Unknown"
              : typeof order.createdBy === "string"
              ? order.createdBy
              : "-",
          title:
            order.createdBy && typeof order.createdBy === "object"
              ? order.createdBy.username || "Unknown"
              : typeof order.createdBy === "string"
              ? order.createdBy
              : "-",
        },
        {
          width: columnWidths[46],
          content: order.remarks || "-",
          title: order.remarks || "-",
        },
      ].map((cell, idx) => (
        <OverlayTrigger
          key={idx}
          trigger="click"
          placement="top"
          show={openTooltipId === `cell-${index}-${idx}`}
          onToggle={(show) => {
            if (show && cell.title) {
              setOpenTooltipId(`cell-${index}-${idx}`);
            } else {
              setOpenTooltipId(null);
            }
          }}
          overlay={
            cell.title ? (
              <Tooltip id={`cell-tooltip-${index}-${idx}`}>
                {cell.title}
              </Tooltip>
            ) : (
              <Tooltip
                id={`cell-tooltip-${index}-${idx}`}
                style={{ display: "none" }}
              />
            )
          }
        >
          <td
            className={cell.className || ""}
            style={{
              width: `${cell.width}px`,
              minWidth: `${cell.width}px`,
              maxWidth: `${cell.width}px`,
            }}
            title={cell.title}
          >
            {cell.content}
          </td>
        </OverlayTrigger>
      ))}
    </tr>
  );
});
const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productionStatusFilter, setProductionStatusFilter] = useState("All");

  const [installStatusFilter, setInstallStatusFilter] = useState("All");
  const [productStatus, setProductStatusFilter] = useState("All");
  const [accountsStatusFilter, setAccountsStatusFilter] = useState("All");
  const [dispatchFilter, setDispatchFilter] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const [openTooltipId, setOpenTooltipId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const tableContainer = document.querySelector(".sales-table-container");
      if (tableContainer && !tableContainer.contains(event.target)) {
        setOpenTooltipId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token for notifications request:", token);
      if (!token) {
        throw new Error("No token found in localStorage");
      }
      const response = await axios.get(
        `${process.env.REACT_APP_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications!");
    }
  }, []);
  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.REACT_APP_URL}/api/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read!");
    }
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.REACT_APP_URL}/api/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      toast.success("All notifications cleared!");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications!");
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_URL}/api/get-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders!");
    }
  }, []);

  // WebSocket setup
  useEffect(() => {
    const baseOrigin = (() => {
      try {
        return new URL(process.env.REACT_APP_URL).origin;
      } catch {
        return process.env.REACT_APP_URL; // fallback
      }
    })();

    const socket = io(baseOrigin, {
      path: "/furni/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);

      socket.emit("join", { userId, role: userRole });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socket.on("deleteOrder", ({ _id, createdBy, assignedTo }) => {
      const currentUserId = userId;
      const owners = [createdBy, assignedTo].filter(Boolean);
      if (!owners.includes(currentUserId)) return;
      setOrders((prev) => prev.filter((o) => o._id !== _id));
    });

    socket.on("notification", (notif) => {
      setNotifications((prev) => {
        if (notif?._id && prev.some((n) => n._id === notif._id)) return prev;
        const next = [notif, ...prev].slice(0, 50);
        if (notif?.message) toast.info(notif.message);
        return next;
      });
    });

    socket.on(
      "orderUpdate",
      ({ operationType, documentId, fullDocument, createdBy, assignedTo }) => {
        const currentUserId = userId;
        const owners = [createdBy, assignedTo].filter(Boolean);
        if (!owners.includes(currentUserId)) return;
        if (operationType === "insert" && fullDocument) {
          setOrders((prev) => {
            if (prev.some((o) => o._id === documentId)) return prev;
            return [fullDocument, ...prev];
          });
        }
      }
    );

    fetchOrders();
    fetchNotifications();

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("notification");
      socket.off("orderUpdate");
      socket.disconnect();
      console.log("Socket.IO disconnected and listeners cleaned up");
    };
  }, [fetchOrders, fetchNotifications, userRole, userId]);

  const calculateTotalResults = useMemo(() => {
    return Math.floor(
      filteredOrders.reduce((total, order) => {
        const orderQty = order.products
          ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
          : 0;
        return total + orderQty;
      }, 0)
    );
  }, [filteredOrders]);

  const filterOrders = useCallback(
    (
      ordersToFilter,
      search,
      productionStatus,
      installStatus,
      productStatus,
      accountsStatus,
      dispatch,
      start,
      end
    ) => {
      let filtered = [...ordersToFilter].filter(
        (order) => order._id && order.orderId
      ); // Only include orders with _id and orderId

      // Scope client-side list to current user unless admin
      const role = localStorage.getItem("role");
      const currentUserId = localStorage.getItem("userId");
      if (!(role === "Admin" || role === "SuperAdmin")) {
        filtered = filtered.filter((order) => {
          const ownerId =
            typeof order.createdBy === "object" && order.createdBy?._id
              ? order.createdBy._id
              : String(order.createdBy || "");
          return ownerId === currentUserId;
        });
      }

      const searchLower = search.toLowerCase().trim();

      if (searchLower) {
        filtered = filtered.filter((order) => {
          const orderFields = [
            order.customername,
            order.city,
            order.state,
            order.pinCode,
            order.contactNo,
            order.customerEmail,
            order.orderId,
            order.orderType,
            order.salesPerson,
            order.company,
            order.transporter,
            order.transporterDetails,

            order.shippingAddress,
            order.billingAddress,
            order.invoiceNo,
            order.piNumber,
            order.billStatus,
            order.remarks,
            order.sostatus,
            order.gstno,
            order.paymentCollected,
            order.paymentMethod,
            order.paymentDue,
            order.paymentTerms,
            order.gemOrderNumber,
            order.installation,
            order.dispatchFrom,
            order.freightcs,
            order.fulfillingStatus,
            order.remarksByProduction,
            order.remarksByAccounts,
            order.paymentReceived,
            order.billNumber,
            order.remarksByBilling,
            order.verificationRemarks,
            order.completionStatus,
            order.installationStatus,
            order.dispatchStatus,
            order.name,
            order.remarksByInstallation,
            order.report,
            order.soDate
              ? new Date(order.soDate).toLocaleDateString("en-GB")
              : "",
            order.dispatchDate
              ? new Date(order.dispatchDate).toLocaleDateString("en-GB")
              : "",
            order.deliveryDate
              ? new Date(order.deliveryDate).toLocaleDateString("en-GB")
              : "",
            order.receiptDate
              ? new Date(order.receiptDate).toLocaleDateString("en-GB")
              : "",
            order.invoiceDate
              ? new Date(order.invoiceDate).toLocaleDateString("en-GB")
              : "",
            order.fulfillmentDate
              ? new Date(order.fulfillmentDate).toLocaleDateString("en-GB")
              : "",
          ]
            .filter(Boolean)
            .map((field) => String(field).toLowerCase());

          const productFields = (order.products || []).map((p) =>
            [
              p.productType,
              p.size,
              p.spec,
              p.gst,
              p.serialNos?.join(", "),
              p.modelNos?.join(", "),
              String(p.qty),
              String(p.unitPrice),
            ]
              .filter(Boolean)
              .map((field) => String(field).toLowerCase())
              .join(" ")
          );

          const allFields = [...orderFields, ...productFields].join(" ");
          return allFields.includes(searchLower);
        });
      }

      if (productionStatus !== "All") {
        filtered = filtered.filter(
          (order) => order.fulfillingStatus === productionStatus
        );
      }

      if (installStatus !== "All") {
        filtered = filtered.filter(
          (order) => order.installationStatus === installStatus
        );
      }

      if (productStatus !== "All") {
        filtered = filtered.filter((order) =>
          order.products?.some((p) => p.productType === productStatus)
        );
      }

      if (accountsStatus !== "All") {
        filtered = filtered.filter(
          (order) => order.paymentReceived === accountsStatus
        );
      }

      if (dispatch !== "All") {
        filtered = filtered.filter(
          (order) => order.dispatchStatus === dispatch
        );
      }

      if (start || end) {
        filtered = filtered.filter((order) => {
          const orderDate = order.soDate ? new Date(order.soDate) : null;
          if (!orderDate || isNaN(orderDate.getTime())) return false;

          const startDateAdjusted =
            start && start instanceof Date && !isNaN(start.getTime())
              ? new Date(
                  start.getFullYear(),
                  start.getMonth(),
                  start.getDate(),
                  0,
                  0,
                  0,
                  0
                )
              : null;
          const endDateAdjusted =
            end && end instanceof Date && !isNaN(end.getTime())
              ? new Date(
                  end.getFullYear(),
                  end.getMonth(),
                  end.getDate(),
                  23,
                  59,
                  59,
                  999
                )
              : null;

          return (
            (!startDateAdjusted || orderDate >= startDateAdjusted) &&
            (!endDateAdjusted || orderDate <= endDateAdjusted)
          );
        });
      }

      filtered = filtered.sort((a, b) => {
        const aUpdatedAt = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bUpdatedAt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        const aCreatedAt = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bCreatedAt = b.createdAt ? Date.parse(b.createdAt) : 0;
        const aSoDate = a.soDate ? Date.parse(a.soDate) : 0;
        const bSoDate = b.soDate ? Date.parse(b.soDate) : 0;

        if (aUpdatedAt !== bUpdatedAt) {
          return bUpdatedAt - aUpdatedAt;
        }

        if (aCreatedAt !== bCreatedAt) {
          return bCreatedAt - aCreatedAt;
        }

        return bSoDate - aSoDate;
      });

      setFilteredOrders(filtered);
    },
    []
  );

  // Apply filters
  useEffect(() => {
    filterOrders(
      orders,
      searchTerm,
      productionStatusFilter,
      installStatusFilter,
      productStatus,
      accountsStatusFilter,
      dispatchFilter,
      startDate,
      endDate
    );
  }, [
    orders,
    searchTerm,
    productionStatusFilter,
    installStatusFilter,
    productStatus,
    accountsStatusFilter,
    dispatchFilter,
    startDate,
    endDate,
    filterOrders,
  ]);
  // Event handlers
  const handleReset = useCallback(() => {
    // Reset all filter states to their default values
    setProductionStatusFilter("All");
    setInstallStatusFilter("All");
    setProductStatusFilter("All");
    setAccountsStatusFilter("All");
    setDispatchFilter("All");
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);

    // Ensure orders is an array to avoid errors
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      toast.info("Filters reset! No orders available.");
      return;
    }

    // Create a copy of valid orders (with _id and orderId)
    let resetOrders = orders.filter(
      (order) => order && order._id && order.orderId
    );

    // Apply role-based filtering for non-admin users
    const role = localStorage.getItem("role");
    const currentUserId = localStorage.getItem("userId");
    if (!(role === "Admin" || role === "SuperAdmin")) {
      resetOrders = resetOrders.filter((order) => {
        const ownerId =
          typeof order.createdBy === "object" && order.createdBy?._id
            ? order.createdBy._id
            : String(order.createdBy || "");
        return ownerId === currentUserId;
      });
    }

    // Sort orders to match filterOrders sorting logic
    resetOrders = resetOrders.sort((a, b) => {
      const aUpdatedAt = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bUpdatedAt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      const aCreatedAt = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bCreatedAt = b.createdAt ? Date.parse(b.createdAt) : 0;
      const aSoDate = a.soDate ? Date.parse(a.soDate) : 0;
      const bSoDate = b.soDate ? Date.parse(b.soDate) : 0;

      if (aUpdatedAt !== bUpdatedAt) {
        return bUpdatedAt - aUpdatedAt;
      }
      if (aCreatedAt !== bCreatedAt) {
        return bCreatedAt - aCreatedAt;
      }
      return bSoDate - aSoDate;
    });

    // Update filteredOrders with the reset list
    setFilteredOrders(resetOrders);
    toast.info(`Filters reset! Showing ${resetOrders.length} orders.`);
  }, [orders]);

  const handleAddEntry = useCallback(
    async (newEntry) => {
      setIsAddModalOpen(false);
      toast.success("New order added!");
      await fetchOrders();
      setOrders((prev) => {
        const updatedOrders = [...prev, newEntry];
        filterOrders(
          updatedOrders,
          searchTerm,
          productionStatusFilter,
          installStatusFilter,
          productStatus,
          accountsStatusFilter,
          dispatchFilter,
          startDate,
          endDate
        );
        return updatedOrders;
      });
      setIsAddModalOpen(false);
      toast.success("New order added!");
    },
    [
      fetchOrders,
      filterOrders,
      searchTerm,
      productionStatusFilter,
      installStatusFilter,
      productStatus,
      accountsStatusFilter,
      dispatchFilter,
      startDate,
      endDate,
    ]
  );

  const handleViewClick = useCallback((order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  }, []);

  const handleEditClick = useCallback((order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (deletedIds) => {
      setOrders((prev) => {
        const updatedOrders = prev.filter(
          (order) => !deletedIds.includes(order._id)
        );
        filterOrders(
          updatedOrders,
          searchTerm,
          productionStatusFilter,
          installStatusFilter,
          productStatus,
          accountsStatusFilter,
          dispatchFilter,
          startDate,
          endDate
        );
        return updatedOrders;
      });
      setIsDeleteModalOpen(false);
      toast.success("Order deleted successfully!");
    },
    [
      filterOrders,
      searchTerm,
      productionStatusFilter,
      installStatusFilter,
      productStatus,
      accountsStatusFilter,
      dispatchFilter,
      startDate,
      endDate,
    ]
  );

  const handleEntryUpdated = useCallback(
    async (updatedEntry) => {
      // Child (EditEntry) has already completed the API call and returns the updated entry.
      // Avoid sending a second PUT to prevent duplicate server notifications.
      const updatedOrder = updatedEntry;
      setOrders((prev) => {
        const updatedOrders = prev.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        filterOrders(
          updatedOrders,
          searchTerm,
          productionStatusFilter,
          installStatusFilter,
          productStatus,
          accountsStatusFilter,
          dispatchFilter,
          startDate,
          endDate
        );
        return updatedOrders;
      });
      setIsEditModalOpen(false);
    },
    [
      filterOrders,
      searchTerm,
      productionStatusFilter,
      installStatusFilter,
      productStatus,
      accountsStatusFilter,
      dispatchFilter,
      startDate,
      endDate,
    ]
  );

  const formatCurrency = useCallback((value) => {
    if (!value || value === "") return "₹0.00";
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ""));
    if (isNaN(numericValue)) return "₹0.00";
    return `₹${numericValue.toFixed(2)}`;
  }, []);

  const parseExcelDate = useCallback((dateValue) => {
    if (!dateValue) return "";
    if (typeof dateValue === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(
        excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000
      );
      return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    }
    const date = new Date(String(dateValue).trim());
    return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }, []);

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, {
            type: "array",
            raw: false,
            dateNF: "yyyy-mm-dd",
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            blankrows: false,
          });

          const headers = parsedData[0].map((h) =>
            h
              ? h
                  .toLowerCase()
                  .replace(/\s+/g, "")
                  .replace(/[^a-z0-9]/g, "")
              : ""
          );
          const rows = parsedData
            .slice(1)
            .filter((row) =>
              row.some((cell) => cell !== undefined && cell !== "")
            );

          const newEntries = rows.map((row) => {
            const entry = {};
            headers.forEach((header, index) => {
              entry[header] = row[index] !== undefined ? row[index] : "";
            });

            let products = [];
            if (entry.products) {
              try {
                products = JSON.parse(entry.products);
                if (!Array.isArray(products)) {
                  products = [products];
                }
              } catch {
                products = [
                  {
                    productType: String(entry.producttype || "Unknown").trim(),
                    size: String(entry.size || "N/A").trim(),
                    spec: String(entry.spec || "N/A").trim(),
                    qty: Number(entry.qty) || 1,
                    unitPrice: Number(entry.unitprice) || 0,
                    serialNos: entry.serialnos
                      ? String(entry.serialnos)
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [],
                    modelNos: entry.modelnos
                      ? String(entry.modelnos)
                          .split(",")
                          .map((m) => m.trim())
                          .filter(Boolean)
                      : [],
                    gst: String(entry.gst || "18").trim(),
                  },
                ];
              }
            } else {
              products = [
                {
                  productType: String(entry.producttype || "Unknown").trim(),
                  size: String(entry.size || "N/A").trim(),
                  spec: String(entry.spec || "N/A").trim(),
                  qty: Number(entry.qty) || 1,
                  unitPrice: Number(entry.unitprice) || 0,
                  serialNos: entry.serialnos
                    ? String(entry.serialnos)
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [],
                  modelNos: entry.modelnos
                    ? String(entry.modelnos)
                        .split(",")
                        .map((m) => m.trim())
                        .filter(Boolean)
                    : [],
                  gst: String(entry.gst || "18").trim(),
                },
              ];
            }

            return {
              soDate:
                parseExcelDate(entry.sodate) ||
                new Date().toISOString().slice(0, 10),
              dispatchFrom: String(entry.dispatchfrom || "").trim(),
              dispatchDate: parseExcelDate(entry.dispatchdate) || "",
              name: String(entry.name || "").trim(),
              city: String(entry.city || "").trim(),
              state: String(entry.state || "").trim(),
              pinCode: String(entry.pincode || "").trim(),
              contactNo: String(entry.contactno || "").trim(),
              customerEmail: String(entry.customeremail || "").trim(),
              customername: String(entry.customername || "").trim(),
              products,
              total: Number(entry.total) || 0,
              paymentCollected: String(entry.paymentcollected || "").trim(),
              paymentMethod: String(entry.paymentmethod || "").trim(),
              paymentDue: String(entry.paymentdue || "").trim(),
              paymentTerms: String(entry.paymentterms || "").trim(),

              neftTransactionId: String(entry.nefttransactionid || "").trim(),
              chequeId: String(entry.chequeid || "").trim(),
              freightcs: String(entry.freightcs || "").trim(),
              freightstatus: String(entry.freightstatus || "Extra").trim(),
              installchargesstatus: String(
                entry.installchargesstatus || "Extra"
              ).trim(),
              orderType: String(entry.ordertype || "B2C").trim(),
              gemOrderNumber: String(entry.gemordernumber || "").trim(),
              deliveryDate: parseExcelDate(entry.deliverydate) || "",
              installation: String(entry.installation || "N/A").trim(),
              installationStatus: String(
                entry.installationstatus || "Pending"
              ).trim(),
              remarksByInstallation: String(
                entry.remarksbyinstallation || ""
              ).trim(),
              dispatchStatus: String(
                entry.dispatchstatus || "Not Dispatched"
              ).trim(),
              salesPerson: String(entry.salesperson || "").trim(),
              report: String(entry.report || "").trim(),
              company: String(entry.company || "Promark").trim(),
              transporter: String(entry.transporter || "").trim(),
              transporterDetails: String(entry.transporterdetails || "").trim(),

              receiptDate: parseExcelDate(entry.receiptdate) || "",
              shippingAddress: String(entry.shippingaddress || "").trim(),
              billingAddress: String(entry.billingaddress || "").trim(),
              invoiceNo: String(entry.invoiceno || "").trim(),
              invoiceDate: parseExcelDate(entry.invoicedate) || "",
              fulfillingStatus: String(
                entry.fulfillingstatus || "Pending"
              ).trim(),
              remarksByProduction: String(
                entry.remarksbyproduction || ""
              ).trim(),
              remarksByAccounts: String(entry.remarksbyaccounts || "").trim(),
              paymentReceived: String(
                entry.paymentreceived || "Not Received"
              ).trim(),
              billNumber: String(entry.billnumber || "").trim(),
              piNumber: String(entry.pinumber || "").trim(),
              remarksByBilling: String(entry.remarksbybilling || "").trim(),
              verificationRemarks: String(
                entry.verificationremarks || ""
              ).trim(),
              billStatus: String(entry.billstatus || "Pending").trim(),
              completionStatus: String(
                entry.completionstatus || "In Progress"
              ).trim(),
              fulfillmentDate: parseExcelDate(entry.fulfillmentdate) || "",
              remarks: String(entry.remarks || "").trim(),
              sostatus: String(entry.sostatus || "Pending for Approval").trim(),
              gstno: String(entry.gstno || "").trim(),
            };
          });

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${process.env.REACT_APP_URL}/api/bulk-orders`,
            newEntries,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setOrders((prev) => {
            const updatedOrders = [...prev, ...response.data.data];
            filterOrders(
              updatedOrders,
              searchTerm,
              productionStatusFilter,
              installStatusFilter,
              productStatus,
              accountsStatusFilter,
              dispatchFilter,
              startDate,
              endDate
            );
            return updatedOrders;
          });
          toast.success(
            `Successfully uploaded ${response.data.data.length} orders!`
          );
        } catch (error) {
          console.error("Error uploading entries:", error);

          let userFriendlyMessage =
            "Something went wrong while uploading your file.";

          if (error.response) {
            if (error.response.status === 400) {
              userFriendlyMessage =
                "The file format seems incorrect. Please check your Excel template.";
            } else if (error.response.status === 413) {
              userFriendlyMessage =
                "The file is too large. Please upload a smaller file.";
            } else {
              userFriendlyMessage =
                error.response.data?.details?.join(", ") ||
                error.response.data?.message ||
                userFriendlyMessage;
            }
          } else if (error.request) {
            userFriendlyMessage =
              "Could not connect to the server. Please check your internet connection.";
          }

          toast.error(userFriendlyMessage, {
            position: "top-right",
            autoClose: 5000,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [
      parseExcelDate,
      filterOrders,
      searchTerm,
      productionStatusFilter,
      installStatusFilter,
      productStatus,
      accountsStatusFilter,
      dispatchFilter,
      startDate,
      endDate,
    ]
  );
  const handleExport = useCallback(() => {
    try {
      const exportData = filteredOrders.map((order, index) => ({
        "Seq No": index + 1,
        "Order ID": order.orderId || "-",
        "SO Date": order.soDate
          ? new Date(order.soDate).toLocaleDateString("en-GB")
          : "-",
        "Customer Name": order.customername || "-",
        "Contact Person Name": order.name || "-",
        "Contact No": order.contactNo || "-",
        "Customer Email": order.customerEmail || "-",
        "SO Status": order.sostatus || "-",
        "Alternate No": order.alterno || "-",
        City: order.city || "-",
        State: order.state || "-",
        "Pin Code": order.pinCode || "-",
        "GST No": order.gstno || "-",
        "Shipping Address": order.shippingAddress || "-",
        "Billing Address": order.billingAddress || "-",
        "Description of Goods": order.products
          ? order.products.map((p) => `${p.productType} (${p.qty})`).join(", ")
          : "-",
        "Product Category": order.products?.[0]?.productType || "-",
        Size: order.products?.[0]?.size || "-",
        Spec: order.products?.[0]?.spec || "-",
        Qty: order.products
          ? order.products.reduce((sum, p) => sum + (p.qty || 0), 0)
          : "-",
        "Unit Price": order.products
          ? order.products
              .reduce((sum, p) => sum + (p.unitPrice || 0) * (p.qty || 0), 0)
              .toFixed(2)
          : "0.00",
        GST: order.products
          ? order.products
              .map((p) => `${p.gst}`)
              .filter(Boolean)
              .join(", ")
          : "-",
        Total: order.total?.toFixed(2) || "0.00",
        "Payment Collected": formatCurrency(order.paymentCollected) || "-",
        "Payment Method": order.paymentMethod || "-",
        "Payment Due": formatCurrency(order.paymentDue) || "-",
        "Payment Terms": order.paymentTerms || "-",
        "Payment Received": order.paymentReceived || "-",
        "Freight Charges": order.freightcs || "-",
        "Actual Freight": order.actualFreight
          ? `₹${order.actualFreight.toFixed(2)}`
          : "-",
        Installation: order.installation ? `₹${order.installation}` : "-",
        "Installation Report": order.installationReport || "-",
        "Transporter Details": order.transporterDetails || "-",
        "Dispatch From": order.dispatchFrom || "-",
        "Dispatch Status": order.dispatchStatus || "-",
        "Signed Stamp Receiving": order.stamp || "-",
        "Order Type": order.orderType || "-",
        Report: order.report || "-",
        "Bill Status": order.billStatus || "-",
        "Production Status": order.fulfillingStatus || "Pending",
        "Bill Number": order.billNumber || "-",
        "PI Number": order.piNumber || "-",
        "Sales Person": order.salesPerson || "-",
        Company: order.company || "-",
        "Created By":
          order.createdBy && typeof order.createdBy === "object"
            ? order.createdBy.username || "Unknown"
            : typeof order.createdBy === "string"
            ? order.createdBy
            : "-",
        Remarks: order.remarks || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

      const colWidths = Object.keys(exportData[0] || {}).map((key, i) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(
        workbook,
        `orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Orders exported successfully!");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders!");
    }
  }, [filteredOrders, formatCurrency]);
  const isOrderComplete = useCallback((order) => {
    // Essential fields required for an order to be complete
    const requiredFields = [
      "orderId",
      "soDate",
      "customername",
      "contactNo",
      "sostatus",
      "total",
      "products",
      "createdBy",
      "shippingAddress",
      "billingAddress",
      "billStatus",
      "dispatchStatus",
    ];

    // Check if all required fields are present and valid
    const areFieldsComplete = requiredFields.every((field) => {
      const value = order[field];

      // Handle undefined or null fields
      if (value === undefined || value === null) {
        return false;
      }

      if (field === "products") {
        // Validate products: all products must have essential fields
        return (
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            (product) =>
              product.productType &&
              product.productType.trim() !== "" &&
              product.qty !== undefined &&
              product.qty >= 0 &&
              product.unitPrice !== undefined &&
              product.unitPrice >= 0 &&
              product.gst !== undefined &&
              product.gst.trim() !== "" &&
              product.size &&
              product.size.trim() !== "" &&
              product.spec &&
              product.spec.trim() !== ""
          )
        );
      }

      if (field === "createdBy") {
        // Handle createdBy as string or object
        return (
          (typeof value === "string" && value.trim() !== "") ||
          (typeof value === "object" &&
            value !== null &&
            value.username &&
            value.username.trim() !== "")
        );
      }

      if (field === "total") {
        // Allow total to be 0
        return typeof value === "number" && value >= 0;
      }

      if (field === "sostatus") {
        // Require specific status values
        return ["Approved", "Accounts Approved"].includes(value);
      }

      if (field === "billStatus") {
        // Require billing to be complete
        return value === "Billing Complete";
      }

      if (field === "dispatchStatus") {
        // Require dispatch to be delivered
        return value === "Delivered";
      }

      // For other fields, ensure they are non-empty strings
      return typeof value === "string" ? value.trim() !== "" : true;
    });

    // Optional fields that can be empty or undefined
    const optionalFields = [
      "name",
      "customerEmail",
      "city",
      "state",
      "pinCode",
      "actualFreight",
      "installchargesstatus",
      "installation",
      "installationStatus",
      "transporter",
      "transporterDetails",
      "dispatchFrom",
      "dispatchDate",
      "orderType",
      "report",
      "stockStatus",
      "fulfillingStatus",
      "salesPerson",
      "company",
      "remarks",
      "paymentCollected",
      "paymentMethod",
      "paymentDue",
      "paymentTerms",
      "paymentReceived",
      "freightcs",
      "freightstatus",
      "billNumber",
      "piNumber",

      "invoiceNo",
      "invoiceDate",
    ];

    // Ensure optional fields, if present, are valid
    const areOptionalFieldsValid = optionalFields.every((field) => {
      const value = order[field];
      // Allow undefined, null, empty strings, or valid values
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "N/A" ||
        (typeof value === "string" && value.trim() !== "") ||
        (typeof value === "number" && value >= 0)
      );
    });

    return areFieldsComplete && areOptionalFieldsValid;
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const notificationPopover = (
    <NotificationPopover id="notification-popover">
      <Popover.Header
        style={{
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "white",
          borderRadius: "12px 12px 0 0",
          fontWeight: "600",
        }}
      >
        Notifications
      </Popover.Header>
      <Popover.Body>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationItem key={notif.id} isRead={notif.isRead}>
              <NotificationText isRead={notif.isRead}>
                {notif.message}
              </NotificationText>
              <NotificationTime>
                {formatTimestamp(notif.timestamp)}
              </NotificationTime>
            </NotificationItem>
          ))
        ) : (
          <div
            style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}
          >
            No notifications
          </div>
        )}
        {notifications.length > 0 && (
          <NotificationActions>
            <MarkReadButton onClick={markAllRead}>Mark All Read</MarkReadButton>
            <ClearButton onClick={clearNotifications}>Clear All</ClearButton>
          </NotificationActions>
        )}
      </Popover.Body>
    </NotificationPopover>
  );
  const tableHeaders = [
    "Seq No",
    "Order ID",
    "SO Date",
    "Customer Name",
    "Contact Person Name",
    "Contact No",
    "Customer Email",
    "SO Status",
    "Actions",
    "Alternate No",
    "City",
    "State",
    "Pin Code",
    "GST No",
    "Shipping Address",
    "Billing Address",
    "Description of Goods",
    "Product Category",
    "Size",
    "Spec",
    "Qty",
    "Unit Price",
    "GST",
    "Total",
    "Payment Collected",
    "Payment Method",
    "Payment Due",
    "Payment Terms",
    "Payment Received",
    "Freight Charges",
    "Actual Freight",
    "Installation Status",
    "Installation Report",
    "Transporter Details",
    "Dispatch From",
    "Dispatch Status",
    "Signed Stamp Receiving",
    "Order Type",
    "Report",
    "Bill Status",
    "Production Status",
    "Bill Number",
    "PI Number",
    "Sales Person",
    "Company",
    "Created By",
    "Remarks",
  ];

  return (
    <>
      <style>{tableStyles}</style>
      <div
        style={{
          background: "rgb(230, 240, 250)",
          padding: "25px 40px",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <FilterSection
          debouncedSetSearchTerm={debouncedSetSearchTerm}
          userRole={userRole}
          notificationPopover={notificationPopover}
          notifications={notifications}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          productionStatusFilter={productionStatusFilter}
          setProductionStatusFilter={setProductionStatusFilter}
          installStatusFilter={installStatusFilter}
          setInstallStatusFilter={setInstallStatusFilter}
          productStatus={productStatus}
          setProductStatusFilter={setProductStatusFilter}
          accountsStatusFilter={accountsStatusFilter}
          setAccountsStatusFilter={setAccountsStatusFilter}
          dispatchFilter={dispatchFilter}
          setDispatchFilter={setDispatchFilter}
          handleReset={handleReset}
        />
      </div>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e6f0fa, #f3e8ff)",
          padding: "30px",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div
          className="my-4"
          style={{
            background: "linear-gradient(135deg, #2575fc, #6a11cb)", // Updated gradient
            borderRadius: "20px", // Reduced from 25px
            padding: "10px 16px", // Reduced from 12px 20px
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)", // Reduced from 0 5px 15px
            display: "inline-flex",
            alignItems: "center",
            transition: "all 0.3s ease",
          }}
        >
          <h4
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.85rem", // Reduced from 0.9rem
              margin: 0,
              letterSpacing: "0.4px", // Reduced from 0.5px
            }}
            title="Total number of entries"
          >
            Total Results: {filteredOrders.length}
          </h4>
        </div>
        <div
          className="mx-3 my-4"
          style={{
            background: "linear-gradient(135deg, #2575fc, #6a11cb)", // Updated gradient
            borderRadius: "20px", // Reduced from 25px
            padding: "10px 16px", // Reduced from 12px 20px
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)", // Reduced from 0 5px 15px
            display: "inline-flex",
            alignItems: "center",
            transition: "all 0.3s ease",
          }}
        >
          <h4
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.85rem", // Reduced from 0.9rem
              margin: 0,
              letterSpacing: "0.4px", // Reduced from 0.5px
            }}
            title="Total quantity of products"
          >
            Total Product Qty: {calculateTotalResults}
          </h4>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px", // Reduced from 25px
            marginBottom: "30px", // Reduced from 40px
            flexWrap: "wrap",
          }}
        >
          {(userRole === "Admin" || userRole === "SuperAdmin") && (
            <label
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                color: "white",
                padding: "12px 24px", // Reduced from 15px 30px
                borderRadius: "30px", // Reduced from 35px
                fontWeight: "600",
                fontSize: "1rem", // Reduced from 1.1rem
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px", // Reduced from 10px
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)", // Reduced from 0 8px 20px
                transition: "all 0.4s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 10px 24px rgba(0,0,0,0.3)"; // Reduced from 0 12px 30px
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)"; // Reduced from 0 8px 20px
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>⬅</span>{" "}
              {/* Reduced from 1.3rem */}
              Bulk Upload
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
          )}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              border: "none",
              padding: "12px 24px", // Reduced from 15px 30px
              borderRadius: "30px", // Reduced from 35px
              color: "white",
              fontWeight: "600",
              fontSize: "1rem", // Reduced from 1.1rem
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)", // Reduced from 0 8px 20px
              display: "flex",
              alignItems: "center",
              gap: "8px", // Reduced from 10px
              transition: "all 0.4s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 10px 24px rgba(0,0,0,0.3)"; // Reduced from 0 12px 30px
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)"; // Reduced from 0 8px 20px
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>+</span>{" "}
            {/* Reduced from 1.3rem */}
            Add Order
          </Button>
          {userRole === "SuperAdmin" && (
            <Button
              onClick={handleExport}
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                border: "none",
                padding: "12px 24px", // Reduced from 15px 30px
                borderRadius: "30px", // Reduced from 35px
                color: "white",
                fontWeight: "600",
                fontSize: "1rem", // Reduced from 1.1rem
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)", // Reduced from 0 8px 20px
                display: "flex",
                alignItems: "center",
                gap: "8px", // Reduced from 10px
                transition: "all 0.4s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 10px 24px rgba(0,0,0,0.3)"; // Reduced from 0 12px 30px
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)"; // Reduced from 0 8px 20px
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>➔</span>{" "}
              {/* Reduced from 1.3rem */}
              Export Orders
            </Button>
          )}
          {(userRole === "Admin" || userRole === "SuperAdmin") && (
            <Button
              variant="primary"
              onClick={() => setIsDashboardOpen(true)}
              style={{
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "30px",
                fontSize: "1rem",
                fontWeight: "600",
                marginLeft: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              <ArrowRight size={18} />
              View Analytics
            </Button>
          )}
        </div>

        <SalesDashboardDrawer
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          orders={orders}
        />
        {isAddModalOpen && (
          <AddEntry
            onSubmit={handleAddEntry}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}
        {isViewModalOpen && (
          <ViewEntry
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            entry={selectedOrder}
          />
        )}
        {isDeleteModalOpen && (
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onDelete={handleDelete}
            itemId={selectedOrder?._id}
          />
        )}
        {isEditModalOpen && (
          <EditEntry
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onEntryUpdated={handleEntryUpdated}
            entryToEdit={selectedOrder}
          />
        )}

        <div className="sales-table-container">
          <table className="sales-table">
            <thead>
              <tr>
                {tableHeaders.map((header, index) => (
                  <OverlayTrigger
                    key={index}
                    trigger="click"
                    placement="top"
                    show={openTooltipId === `header-${index}`}
                    onToggle={(show) => {
                      if (show) {
                        setOpenTooltipId(`header-${index}`);
                      } else {
                        setOpenTooltipId(null);
                      }
                    }}
                    overlay={
                      <Tooltip id={`tooltip-${index}`}>{header}</Tooltip>
                    }
                  >
                    <th
                      style={{
                        width: `${columnWidths[index]}px`,
                        minWidth: `${columnWidths[index]}px`,
                        maxWidth: `${columnWidths[index]}px`,
                      }}
                    >
                      {header}
                    </th>
                  </OverlayTrigger>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  style={{ padding: 0, border: "none" }}
                >
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <List
                        className="list-container"
                        height={600}
                        itemCount={filteredOrders.length}
                        itemSize={50}
                        width={Math.max(width, totalTableWidth)}
                        itemData={{
                          orders: filteredOrders,
                          handleViewClick,
                          handleEditClick,
                          handleDeleteClick,
                          userRole,
                          userId,
                          isOrderComplete,
                          columnWidths,
                          openTooltipId, // Add openTooltipId to itemData
                          setOpenTooltipId, // Add setOpenTooltipId to itemData
                        }}
                      >
                        {Row}
                      </List>
                    )}
                  </AutoSizer>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>{" "}
      <footer
        style={{
          margin: 0,
          textAlign: "center",
          color: "white",
          padding: "20px",
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          width: "100vw",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          fontSize: "1rem",
          fontWeight: "500",
          bottom: 0,
          left: 0,
          boxSizing: "border-box",
        }}
      >
        © 2025 Sales Order Management. All rights reserved.
      </footer>
    </>
  );
};

export default Sales;
