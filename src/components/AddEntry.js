import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import {
  productOptions,
  statesAndCities,
  orderTypeOptions,
  companyOptions,
  paymentMethodOptions,
  paymentTermsOptions,
  salesPersonlist,
  Reportinglist,
  dispatchFromOptions,
} from "./Options";

function AddEntry({ onSubmit, onClose }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    productType: "",
    size: "",
    spec: "",
    qty: "",
    unitPrice: "",
    gst: "",
    warranty: "",
  });

  const [formData, setFormData] = useState({
    soDate: new Date().toISOString().split("T")[0],
    name: "",
    city: "",
    state: "",
    pinCode: "",
    contactNo: "",
    alterno: "",
    customerEmail: "",
    customername: "",
    report: "",
    freightcs: "",
    freightstatus: "Extra",
    installchargesstatus: "Extra",
    gstno: "",
    installation: "",
    remarks: "",
    salesPerson: "",
    company: "",
    shippingAddress: "",
    billingAddress: "",
    sameAddress: false,
    orderType: "B2C",
    paymentCollected: "",
    paymentMethod: "",
    paymentDue: "",
    neftTransactionId: "",
    chequeId: "",
    gemOrderNumber: "",
    deliveryDate: "",
    demoDate: "",
    paymentTerms: "",
    creditDays: "",
    dispatchFrom: "",
    fulfillingStatus: "Pending",
  });

  // Memoize gstOptions to avoid recalculation
  const gstOptions = useMemo(
    () =>
      formData.orderType === "B2G" ? ["18", "28", "including"] : ["18", "28"],
    [formData.orderType]
  );

  // Calculate total amount
  const calculateTotal = useCallback(() => {
    const subtotalWithGST = products.reduce((sum, product) => {
      const qty = Number(product.qty) || 0;
      const unitPrice = Number(product.unitPrice) || 0;
      const gstRate =
        product.gst === "including" ? 0 : Number(product.gst) || 0;

      const base = qty * unitPrice;
      const gst = base * (gstRate / 100);

      return sum + base + gst;
    }, 0);

    const installation = Number(formData.installation) || 0;
    const freight = Number(formData.freightcs) || 0;

    return Math.round(subtotalWithGST + freight + installation);
  }, [products, formData.installation, formData.freightcs]);

  // Calculate payment due
  const calculatePaymentDue = useCallback(
    (paymentCollected) => {
      const total = calculateTotal();
      const due = total - (Number(paymentCollected) || 0);
      return Number(due.toFixed(2));
    },
    [calculateTotal]
  );

  // Update paymentDue when products or charges change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      paymentDue: calculatePaymentDue(Number(prev.paymentCollected) || 0),
    }));
  }, [
    products,
    formData.freightcs,
    formData.installation,
    calculatePaymentDue,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        sameAddress: checked,
        shippingAddress: checked ? prev.billingAddress : prev.shippingAddress,
      }));
    } else {
      // Validate numeric inputs
      if (
        ["pinCode", "contactNo", "alterno"].includes(name) &&
        value &&
        !/^\d*$/.test(value)
      ) {
        return;
      }
      if (
        ["freightcs", "installation", "paymentCollected"].includes(name) &&
        value &&
        Number(value) < 0
      ) {
        toast.error(`${name} cannot be negative`);
        return;
      }

      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          [name]: value,
          ...(name === "billingAddress" && prev.sameAddress
            ? { shippingAddress: value }
            : {}),
          ...(name === "paymentCollected"
            ? { paymentDue: calculatePaymentDue(Number(value) || 0) }
            : {}),
          ...(name === "paymentMethod"
            ? { neftTransactionId: "", chequeId: "" }
            : {}),
          ...(name === "freightstatus" && value !== "Extra"
            ? { freightcs: "" }
            : {}),
          ...(name === "installchargesstatus" && value !== "Extra"
            ? { installation: "" }
            : {}),
          ...(name === "orderType" && value !== "B2G"
            ? { gemOrderNumber: "", deliveryDate: "" }
            : {}),
          ...(name === "paymentTerms" &&
          value !== "Credit" &&
          value !== "Partial Advance"
            ? { creditDays: "" }
            : {}),
          ...(name === "dispatchFrom"
            ? {
                fulfillingStatus: value === "Morinda" ? "Pending" : "Fulfilled",
              }
            : {}),
        };
        return updatedFormData;
      });
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    if (["qty", "unitPrice"].includes(name) && value && Number(value) < 0) {
      toast.error(`${name} cannot be negative`);
      return;
    }

    setCurrentProduct((prev) => {
      if (name === "productType") {
        return {
          ...prev,
          [name]: value,
          size: "",
          spec: "",
          qty: "",
          unitPrice: "",
          gst: "",
          warranty: formData.orderType === "B2G" ? "As Per Tender" : "1 Year",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const addProduct = () => {
    // Validate required fields
    const requiredFields = [
      {
        name: "productType",
        value: currentProduct.productType,
        label: "Product Type",
      },
      { name: "qty", value: currentProduct.qty, label: "Quantity" },
      {
        name: "unitPrice",
        value: currentProduct.unitPrice,
        label: "Unit Price",
      },
      { name: "gst", value: currentProduct.gst, label: "GST" },
      { name: "warranty", value: currentProduct.warranty, label: "Warranty" },
    ];

    const missingField = requiredFields.find(
      (field) => !field.value || field.value.trim() === ""
    );
    if (missingField) {
      toast.error(`Please fill ${missingField.label} field`);
      return;
    }

    const qty = Number(currentProduct.qty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }

    const unitPrice = Number(currentProduct.unitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast.error("Unit Price must be a positive number");
      return;
    }

    const gst = currentProduct.gst;
    if (!gstOptions.includes(gst)) {
      toast.error("Please select a valid GST option");
      return;
    }

    const newProduct = {
      productType: currentProduct.productType,
      size: currentProduct.size || "N/A",
      spec: currentProduct.spec || "N/A",
      qty,
      unitPrice,
      gst,
      warranty: currentProduct.warranty,
    };

    setProducts((prevProducts) => {
      const updatedProducts = [...prevProducts, newProduct];
      console.log(
        "Updated products:",
        JSON.stringify(updatedProducts, null, 2)
      );
      return updatedProducts;
    });

    // Reset currentProduct
    setCurrentProduct({
      productType: "",
      size: "",
      spec: "",
      qty: "",
      unitPrice: "",
      gst: "",
      warranty: formData.orderType === "B2G" ? "As Per Tender" : "1 Year",
    });
  };

  const removeProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity("");
    setFormData((prev) => ({
      ...prev,
      state,
      city: "",
    }));
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setFormData((prev) => ({
      ...prev,
      city,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userRole = localStorage.getItem("role");
    if (!["Sales", "Admin"].includes(userRole)) {
      toast.error("Only Sales or Admin users can create orders");
      return;
    }

    console.log(
      "Submitting form with products:",
      JSON.stringify(products, null, 2)
    );
    console.log(
      "Current product state:",
      JSON.stringify(currentProduct, null, 2)
    );

    if (!products || products.length === 0) {
      toast.error("Please add at least one product to the list");
      return;
    }

    // Validate required fields
    if (
      !formData.customername ||
      !formData.name ||
      !formData.contactNo ||
      !formData.customerEmail
    ) {
      toast.error("Please fill all required customer details");
      return;
    }
    if (!/^\d{10}$/.test(formData.contactNo)) {
      toast.error("Contact number must be exactly 10 digits");
      return;
    }
    if (formData.alterno && !/^\d{10}$/.test(formData.alterno)) {
      toast.error("Alternate contact number must be exactly 10 digits");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.state || !formData.city || !formData.pinCode) {
      toast.error("Please fill all required address details");
      return;
    }
    if (!/^\d{6}$/.test(formData.pinCode)) {
      toast.error("Pin Code must be exactly 6 digits");
      return;
    }
    if (!formData.shippingAddress || !formData.billingAddress) {
      toast.error("Please fill both billing and shipping addresses");
      return;
    }
    if (formData.orderType === "B2G" && !formData.gemOrderNumber) {
      toast.error("Please provide GEM Order Number for B2G orders");
      return;
    }
    if (formData.orderType === "Demo" && !formData.demoDate) {
      toast.error("Please provide Demo Date for Demo orders");
      return;
    }
    if (formData.orderType !== "Demo" && !formData.paymentTerms) {
      toast.error("Please select payment terms");
      return;
    }
    if (
      (formData.paymentTerms === "Credit" ||
        formData.paymentTerms === "Partial Advance") &&
      !formData.creditDays
    ) {
      toast.error(
        "Please select credit days for Credit or Partial Advance terms"
      );
      return;
    }
    if (!formData.dispatchFrom) {
      toast.error("Please select a dispatch location");
      return;
    }

    for (const product of products) {
      if (
        !product.productType ||
        !product.qty ||
        !product.unitPrice ||
        !product.gst ||
        !product.warranty
      ) {
        toast.error(
          "All added products must have product type, quantity, unit price, GST, and warranty"
        );
        return;
      }
    }

    const total = calculateTotal();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const newEntry = {
      ...formData,
      createdBy: userId,
      products: products.map((p) => ({
        productType: p.productType,
        size: p.size || "N/A",
        spec: p.spec || "N/A",
        qty: Number(p.qty),
        unitPrice: Number(p.unitPrice),
        gst: String(p.gst),
        warranty: p.warranty,
      })),
      soDate: formData.soDate,
      total,
      freightcs: formData.freightcs || "",
      installation: formData.installation || "N/A",
      orderType: formData.orderType,
      paymentCollected: String(formData.paymentCollected || ""),
      paymentMethod: formData.paymentMethod || "",
      paymentDue: String(formData.paymentDue),
      neftTransactionId: String(formData.neftTransactionId || ""),
      chequeId: String(formData.chequeId || ""),
      remarks: String(formData.remarks || ""),
      gemOrderNumber: String(formData.gemOrderNumber || ""),
      deliveryDate: formData.deliveryDate || "",
      demoDate: formData.demoDate || "",
      paymentTerms: formData.paymentTerms || "",
      creditDays: String(formData.creditDays || ""),
      dispatchFrom: formData.dispatchFrom,
      fulfillingStatus: formData.fulfillingStatus,
    };

    console.log(
      "Sending payload to backend:",
      JSON.stringify(newEntry, null, 2)
    );

    try {
      setLoading(true);
      const response = await axios.post(
        "https://sales-order-furniture-server.onrender.com/api/orders",
        newEntry,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Order submitted successfully!");
      onSubmit(response.data);
      onClose();
    } catch (error) {
      console.error("Error submitting order:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details?.join(", ") ||
        "Failed to create order. Please try again.";
      toast.error(errorMessage);
      if (error.response?.status === 403) {
        toast.error("Unauthorized: Insufficient permissions or invalid token");
      } else if (error.response?.status === 400) {
        toast.error(
          `Validation Error: ${JSON.stringify(error.response?.data, null, 2)}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Field configurations for sections
  const orderDetailsFields = [
    {
      label: "SO Date *",
      name: "soDate",
      type: "date",
      required: true,
      disabled: true,
      value: new Date().toISOString().split("T")[0],
      placeholder: "Select SO Date",
      ariaLabel: "Sales Order Date",
    },
    {
      label: "Order Type *",
      name: "orderType",
      type: "select",
      options: orderTypeOptions,
      required: true,
      placeholder: "Select Order Type",
      ariaLabel: "Order Type",
    },
    {
      label: "Sales Person",
      name: "salesPerson",
      type: "select",
      options: salesPersonlist,
      placeholder: "Select Sales Person",
      ariaLabel: "Sales Person",
    },
    {
      label: "Reporting Manager",
      name: "report",
      type: "select",
      options: Reportinglist,
      placeholder: "Select Reporting Manager",
      ariaLabel: "Reporting Manager",
    },
    {
      label: "Company",
      name: "company",
      type: "select",
      options: companyOptions,
      placeholder: "Select Company",
      ariaLabel: "Company",
    },
    {
      label: "Dispatch From *",
      name: "dispatchFrom",
      type: "select",
      options: dispatchFromOptions,
      required: true,
      placeholder: "Select Dispatch Location",
      ariaLabel: "Dispatch Location",
    },
    ...(formData.orderType === "B2G"
      ? [
          {
            label: "GEM Order Number *",
            name: "gemOrderNumber",
            type: "text",
            required: true,
            placeholder: "Enter GEM Order Number",
            ariaLabel: "GEM Order Number",
          },
          {
            label: "Delivery Date",
            name: "deliveryDate",
            type: "date",
            placeholder: "Select Delivery Date",
            ariaLabel: "Delivery Date",
          },
        ]
      : []),
    ...(formData.orderType === "Demo"
      ? [
          {
            label: "Demo Date *",
            name: "demoDate",
            type: "date",
            required: true,
            placeholder: "Select Demo Date",
            ariaLabel: "Demo Date",
          },
        ]
      : []),
  ];

  const customerDetailsFields = [
    {
      label: "Customer Name *",
      name: "customername",
      type: "text",
      required: true,
      placeholder: "Enter Customer Name",
      maxLength: 50,
      ariaLabel: "Customer Name",
    },
    {
      label: "Contact Person Name *",
      name: "name",
      type: "text",
      required: true,
      placeholder: "Enter Contact Person Name",
      ariaLabel: "Contact Person Name",
    },
    {
      label: "Contact Person No *",
      name: "contactNo",
      type: "tel",
      required: true,
      inputMode: "numeric",
      maxLength: 10,
      placeholder: "e.g. 9876543210",
      ariaLabel: "Contact Number",
    },
    {
      label: "Alternate Contact No",
      name: "alterno",
      type: "tel",
      inputMode: "numeric",
      maxLength: 10,
      placeholder: "e.g. 9876543210",
      ariaLabel: "Alternate Contact Number",
    },
    {
      label: "Customer Email *",
      name: "customerEmail",
      type: "email",
      required: true,
      placeholder: "e.g. example@domain.com",
      ariaLabel: "Customer Email",
    },
    {
      label: "GST NO.",
      name: "gstno",
      type: "text",
      placeholder: "Enter GST NO.",
      ariaLabel: "GST Number",
    },
  ];

  const addressDetailsFields = [
    {
      label: "State *",
      name: "state",
      type: "select",
      options: Object.keys(statesAndCities),
      onChange: handleStateChange,
      required: true,
      placeholder: "Select State",
      ariaLabel: "State",
    },
    {
      label: "City",
      name: "city",
      type: "select",
      options: selectedState ? statesAndCities[selectedState] : [],
      onChange: handleCityChange,
      disabled: !selectedState,
      required: true,
      placeholder: "Select City",
      ariaLabel: "City",
    },
    {
      label: "Pin Code *",
      name: "pinCode",
      type: "tel",
      required: true,
      inputMode: "numeric",
      placeholder: "e.g. 110001",
      maxLength: 6,
      pattern: "[0-9]*",
      ariaLabel: "Pin Code",
    },
    {
      label: "Billing Address *",
      name: "billingAddress",
      type: "text",
      required: true,
      placeholder: "Enter Billing Address",
      ariaLabel: "Billing Address",
    },
    {
      label: "Same as Billing",
      name: "sameAddress",
      type: "checkbox",
      ariaLabel: "Same as Billing Address",
    },
    {
      label: "Shipping Address *",
      name: "shippingAddress",
      disabled: formData.sameAddress,
      type: "text",
      required: true,
      placeholder: "Enter Shipping Address",
      ariaLabel: "Shipping Address",
    },
  ];

  const additionalChargesFields = [
    {
      label: "Freight Charges",
      name: "freightcs",
      type: "tel",
      inputMode: "numeric",
      pattern: "[0-9]*",
      placeholder: "e.g. 2000",
      disabled: formData.freightstatus !== "Extra",
      ariaLabel: "Freight Charges",
    },
    {
      label: "Installation Charges",
      name: "installation",
      type: "tel",
      inputMode: "numeric",
      pattern: "[0-9]*",
      placeholder: "e.g. 1000",
      disabled: formData.installchargesstatus !== "Extra",
      ariaLabel: "Installation Charges",
    },
    {
      label: "Freight Status",
      name: "freightstatus",
      type: "select",
      options: ["Self-Pickup", "To Pay", "Including", "Extra"],
      placeholder: "Select status",
      ariaLabel: "Freight Status",
    },
    {
      label: "Installation Charges Status",
      name: "installchargesstatus",
      type: "select",
      options: ["To Pay", "Including", "Extra"],
      placeholder: "Select status",
      ariaLabel: "Installation Charges Status",
    },
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(71, 85, 105, 0.8))",
          backdropFilter: "blur(4px)",
          zIndex: 999,
          opacity: 0,
          animation: "fadeIn 0.4s ease forwards",
        }}
        onClick={onClose}
        aria-label="Close modal"
      ></div>

      <div
        className="modal-container"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          padding: "2rem",
          borderRadius: "1.25rem",
          boxShadow:
            "0 15px 40px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          maxHeight: "85vh",
          width: "90%",
          maxWidth: "1100px",
          fontFamily: "'Poppins', sans-serif",
          opacity: 0,
          animation: "slideUp 0.4s ease forwards",
          overflowY: "auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "1px",
              textShadow: "1px 1px 3px rgba(0, 0, 0, 0.05)",
              marginBottom: "1rem",
            }}
          >
            📝 Add Furniture Order
          </h2>

          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              zIndex: 1001,
            }}
            aria-label="Close modal"
          >
            <svg
              style={{ width: "1.75rem", height: "1.75rem" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
          }}
        >
          {/* Order Details Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              📋 Order Details
            </h3>
            <div
              className="grid-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              {orderDetailsFields.map((field) => (
                <div
                  key={field.name}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#f43f5e" }}>*</span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={field.onChange || handleChange}
                      required={field.required}
                      disabled={field.disabled || false}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: field.disabled ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                        cursor: field.disabled ? "not-allowed" : "pointer",
                      }}
                      aria-label={field.ariaLabel}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={field.value || formData[field.name] || ""}
                      onChange={field.disabled ? undefined : handleChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      disabled={field.disabled || false}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: field.disabled ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                        cursor: field.disabled ? "not-allowed" : "text",
                      }}
                      aria-label={field.ariaLabel}
                      aria-required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Details Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              👤 Customer Details
            </h3>
            <div
              className="grid-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              {customerDetailsFields.map((field) => (
                <div
                  key={field.name}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#f43f5e" }}>*</span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    maxLength={field.maxLength}
                    inputMode={field.inputMode}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label={field.ariaLabel}
                    aria-required={field.required}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Address Details Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              📍 Address Details
            </h3>
            <div
              className="grid-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              {addressDetailsFields.map((field) => (
                <div
                  key={field.name}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#f43f5e" }}>*</span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={field.onChange || handleChange}
                      disabled={field.disabled}
                      required={field.required}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: field.disabled ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label={field.ariaLabel}
                      aria-required={field.required}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={formData[field.name] || false}
                      onChange={handleChange}
                      style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        accentColor: "#6366f1",
                      }}
                      aria-label={field.ariaLabel}
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          field.name === "pinCode" &&
                          value &&
                          !/^\d*$/.test(value)
                        ) {
                          return;
                        }
                        (field.onChange || handleChange)(e);
                      }}
                      disabled={field.disabled}
                      inputMode={field.inputMode}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                      required={field.required}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: field.disabled ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                        ...(formData[field.name] &&
                        field.name === "pinCode" &&
                        !/^\d{6}$/.test(formData[field.name])
                          ? { borderColor: "red" }
                          : {}),
                      }}
                      aria-label={field.ariaLabel}
                      aria-required={field.required}
                    />
                  )}
                  {formData[field.name] &&
                    field.name === "pinCode" &&
                    !/^\d{6}$/.test(formData[field.name]) && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "0.8rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        Pin Code must be exactly 6 digits
                      </span>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Products Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1.5rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              ✨ Add Products
            </h3>
            <div
              className="product-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ gridColumn: "1 / 2" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Product * <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <select
                  name="productType"
                  value={
                    currentProduct.productType &&
                    !Object.keys(productOptions).includes(
                      currentProduct.productType
                    )
                      ? "Others"
                      : currentProduct.productType
                  }
                  onChange={handleProductChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f8fafc",
                    fontSize: "1rem",
                    color: "#1e293b",
                  }}
                  aria-label="Product Type"
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select Product
                  </option>
                  {Object.keys(productOptions).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {(currentProduct.productType === "Others" ||
                  (currentProduct.productType &&
                    !Object.keys(productOptions).includes(
                      currentProduct.productType
                    ))) && (
                  <div
                    style={{
                      marginTop: "1rem",
                      animation: "fadeIn 0.3s ease-in",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Custom Product *{" "}
                      <span style={{ color: "#f43f5e" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="productType"
                      value={
                        currentProduct.productType === "Others"
                          ? ""
                          : currentProduct.productType
                      }
                      onChange={handleProductChange}
                      placeholder="Enter Custom Product Type"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label="Custom Product Type"
                      aria-required="true"
                    />
                  </div>
                )}
              </div>
              <div style={{ gridColumn: "2 / 3" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Size
                </label>
                {currentProduct.productType === "Others" ||
                (currentProduct.productType &&
                  !Object.keys(productOptions).includes(
                    currentProduct.productType
                  )) ? (
                  <input
                    type="text"
                    name="size"
                    value={currentProduct.size}
                    onChange={handleProductChange}
                    placeholder="Enter Size"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Custom Product Size"
                  />
                ) : (
                  <select
                    name="size"
                    value={currentProduct.size}
                    onChange={handleProductChange}
                    disabled={!currentProduct.productType}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: !currentProduct.productType
                        ? "#e5e7eb"
                        : "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Product Size"
                  >
                    <option value="">Select Size</option>
                    {currentProduct.productType &&
                      productOptions[currentProduct.productType]?.sizes?.map(
                        (size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        )
                      )}
                  </select>
                )}
              </div>
              <div style={{ gridColumn: "3 / 4" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Specification
                </label>
                {currentProduct.productType === "Others" ||
                (currentProduct.productType &&
                  !Object.keys(productOptions).includes(
                    currentProduct.productType
                  )) ? (
                  <input
                    type="text"
                    name="spec"
                    value={currentProduct.spec}
                    onChange={handleProductChange}
                    placeholder="Enter Specification"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Custom Product Specification"
                  />
                ) : (
                  <select
                    name="spec"
                    value={currentProduct.spec}
                    onChange={handleProductChange}
                    disabled={!currentProduct.productType}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: !currentProduct.productType
                        ? "#e5e7eb"
                        : "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Product Specification"
                  >
                    <option value="">Select Spec</option>
                    {currentProduct.productType &&
                      productOptions[currentProduct.productType]?.specs?.map(
                        (spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        )
                      )}
                  </select>
                )}
              </div>
              <div style={{ gridColumn: "1 / 2" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Quantity * <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <input
                  type="number"
                  name="qty"
                  value={currentProduct.qty}
                  onChange={handleProductChange}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f8fafc",
                    fontSize: "1rem",
                    color: "#1e293b",
                  }}
                  aria-label="Product Quantity"
                  aria-required="true"
                />
              </div>
              <div style={{ gridColumn: "2 / 3" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Unit Price * <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={currentProduct.unitPrice}
                  onChange={handleProductChange}
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f8fafc",
                    fontSize: "1rem",
                    color: "#1e293b",
                  }}
                  aria-label="Unit Price"
                  aria-required="true"
                />
              </div>
              <div style={{ gridColumn: "3 / 4" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  GST * <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <select
                  name="gst"
                  value={currentProduct.gst}
                  onChange={handleProductChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f8fafc",
                    fontSize: "1rem",
                    color: "#1e293b",
                  }}
                  aria-label="GST Rate"
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select GST
                  </option>
                  {gstOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / 2" }}>
                <label
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Warranty * <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <input
                  type="text"
                  name="warranty"
                  value={currentProduct.warranty}
                  onChange={handleProductChange}
                  placeholder="Enter Warranty (e.g., 1 Year)"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    backgroundColor: "#f8fafc",
                    fontSize: "1rem",
                    color: "#1e293b",
                  }}
                  aria-label="Warranty"
                  aria-required="true"
                />
              </div>
            </div>{" "}
            <button
              type="button"
              onClick={addProduct}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                color: "#fff",
                border: "none",
                marginBottom: "20px",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: "600",
                letterSpacing: "0.5px",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(101, 86, 231, 0.5)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(101, 86, 231, 0.3)")
              }
              aria-label="Add Product"
            >
              Add ➕
            </button>
            <div>
              <label
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks || ""}
                onChange={handleChange}
                placeholder="Enter product-related remarks"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.75rem",
                  backgroundColor: "#f8fafc",
                  fontSize: "1rem",
                  color: "#1e293b",
                }}
                aria-label="Remarks"
              />
            </div>
            {products.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    color: "#475569",
                    marginBottom: "1rem",
                  }}
                >
                  Added Products:
                </h4>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                    padding: "0.5rem",
                  }}
                >
                  {products.map((product, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 0.5fr",
                        padding: "0.75rem",
                        background: "#f1f5f9",
                        borderRadius: "0.5rem",
                        marginBottom: "0.5rem",
                        transition: "background 0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#e2e8f0")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#f1f5f9")
                      }
                    >
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        {product.productType}
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        {product.size || "N/A"}
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        {product.spec || "N/A"}
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        Qty: {product.qty}
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        ₹{product.unitPrice}
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                        GST: {product.gst}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        style={{
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          textAlign: "right",
                        }}
                        aria-label={`Remove product ${product.productType}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Charges Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              💸 Additional Charges
            </h3>
            <div
              className="grid-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              {additionalChargesFields.map((field) => (
                <div
                  key={field.name}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || "Extra"}
                      onChange={handleChange}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label={field.ariaLabel}
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={(e) => {
                        handleChange(e);
                        if (
                          ["freightcs", "installation"].includes(field.name)
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            paymentDue: calculatePaymentDue(
                              Number(prev.paymentCollected) || 0
                            ),
                          }));
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: field.disabled ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label={field.ariaLabel}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Section */}
          <div>
            <h3
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                marginBottom: "1rem",
                letterSpacing: "1px",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              💰 Payment Details
            </h3>
            <div
              className="grid-section"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Total Amount
                  </label>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "0.75rem",
                      fontSize: "1rem",
                      color: "#1e293b",
                      fontWeight: "600",
                    }}
                    aria-label="Total Amount"
                  >
                    ₹ {calculateTotal()}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Payment Collected
                  </label>
                  <input
                    type="number"
                    name="paymentCollected"
                    value={formData.paymentCollected}
                    onChange={handleChange}
                    disabled={formData.orderType === "Demo"}
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor:
                        formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Payment Collected"
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Payment Due
                  </label>
                  <input
                    type="number"
                    name="paymentDue"
                    value={formData.paymentDue}
                    readOnly
                    disabled
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor: "#e5e7eb",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                    aria-label="Payment Due"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    disabled={formData.orderType === "Demo"}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor:
                        formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                      appearance: "auto",
                    }}
                    aria-label="Payment Method"
                  >
                    <option value="">Select Method</option>
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Payment Terms{" "}
                    {formData.orderType !== "Demo" && (
                      <span style={{ color: "#dc2626" }}>*</span>
                    )}
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    disabled={formData.orderType === "Demo"}
                    required={formData.orderType !== "Demo"}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      backgroundColor:
                        formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                      fontSize: "1rem",
                      color: "#1e293b",
                      appearance: "auto",
                    }}
                    aria-label="Payment Terms"
                    aria-required={formData.orderType !== "Demo"}
                  >
                    <option value="" disabled>
                      Select Terms
                    </option>
                    {paymentTermsOptions.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.paymentMethod === "NEFT" && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                      }}
                    >
                      NEFT Transaction ID
                    </label>
                    <input
                      type="text"
                      name="neftTransactionId"
                      value={formData.neftTransactionId}
                      onChange={handleChange}
                      placeholder="Enter NEFT Transaction ID"
                      disabled={formData.orderType === "Demo"}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor:
                          formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label="NEFT Transaction ID"
                    />
                  </div>
                )}
                {formData.paymentMethod === "Cheque" && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Cheque ID
                    </label>
                    <input
                      type="text"
                      name="chequeId"
                      value={formData.chequeId}
                      onChange={handleChange}
                      placeholder="Enter Cheque ID"
                      disabled={formData.orderType === "Demo"}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor:
                          formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                      aria-label="Cheque ID"
                    />
                  </div>
                )}
                {(formData.paymentTerms === "Credit" ||
                  formData.paymentTerms === "Partial Advance") && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                      }}
                    >
                      No. of Credit Days{" "}
                      <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <select
                      name="creditDays"
                      value={formData.creditDays}
                      onChange={handleChange}
                      disabled={formData.orderType === "Demo"}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor:
                          formData.orderType === "Demo" ? "#e5e7eb" : "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                        appearance: "auto",
                      }}
                      aria-label="Credit Days"
                      aria-required="true"
                    >
                      <option value="" disabled>
                        Select Credit Days
                      </option>
                      <option value="7">7 Days</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#e2e8f0",
                color: "#475569",
                border: "none",
                borderRadius: "0.75rem",
                cursor: "pointer",
              }}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.75rem",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              aria-label="Submit Order"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Submit"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @media (max-width: 768px) {
          .modal-container {
            width: 95%;
            max-width: 100%;
            padding: 1rem;
            max-height: 90vh;
          }

          .form-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .grid-section {
            grid-template-columns: 1fr !important;
            gap: 1rem;
          }

          .product-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem;
          }

          .product-grid button {
            align-self: center;
            width: 100%;
            max-width: 200px;
          }

          input,
          select,
          .product-grid div {
            width: 100% !important;
            box-sizing: border-box;
          }

          h2 {
            font-size: 1.8rem;
          }

          h3 {
            font-size: 1.2rem;
          }

          label {
            font-size: 0.85rem;
          }

          input,
          select {
            font-size: 0.9rem;
            padding: 0.6rem;
          }

          button {
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
          }

          .modal-container::-webkit-scrollbar {
            width: 8px;
          }

          .modal-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }

          .modal-container::-webkit-scrollbar-thumb {
            background: #64748b;
            border-radius: 10px;
          }

          .modal-container,
          .form-container,
          .grid-section,
          .product-grid {
            overflow-x: hidden;
          }
        }
      `}</style>
    </>
  );
}

export default AddEntry;
