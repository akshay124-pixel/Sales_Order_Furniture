import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EditBill = ({ isOpen, onClose, onEntryUpdated, entryToEdit }) => {
  const [formData, setFormData] = useState({
    billNumber: entryToEdit?.billNumber || "",
    piNumber: entryToEdit?.piNumber || "",
    invoiceDate: entryToEdit?.invoiceDate
      ? new Date(entryToEdit.invoiceDate)
      : null,
    remarksByBilling: entryToEdit?.remarksByBilling || "",
    billStatus: entryToEdit?.billStatus || "Pending",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, invoiceDate: date }));
    setErrors((prev) => ({ ...prev, invoiceDate: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.billNumber || formData.billNumber.trim() === "") {
      newErrors.billNumber = "Bill Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        invoiceDate: formData.invoiceDate
          ? formData.invoiceDate.toISOString()
          : null,
      };
      const response = await axios.put(
        `https://sales-order-furniture-server.onrender.com/api/edit/${entryToEdit._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onEntryUpdated(response.data.data);
      toast.success("Bill order updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      onClose();
    } catch (error) {
      console.error("Error updating bill order:", error);
      toast.error(error.response?.data?.message || "Failed to update order!", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static">
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .custom-datepicker .react-datepicker__input-container input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ced4da;
           
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .custom-datepicker .react-datepicker__input-container input:focus {
            outline: none;
            border-color: #2575fc;
            box-shadow: 0 0 10px rgba(37, 117, 252, 0.5);
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
            textTransform: "uppercase",
            letterSpacing: "1px",
            textShadow: "1px 1px 3px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: "10px", fontSize: "1.5rem" }}>📝</span>
          Edit Bill Order
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          padding: "30px",
          background: "#fff",
          borderRadius: "0 0 15px 15px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          animation: "fadeIn 0.5s ease-in-out",
        }}
      >
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#333" }}>
              Bill Number <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="billNumber"
              value={formData.billNumber}
              onChange={handleChange}
              placeholder="Enter bill number"
              style={{
                borderRadius: "10px",
                padding: "12px",
                border: errors.billNumber
                  ? "1px solid red"
                  : "1px solid #ced4da",
                fontSize: "1rem",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {errors.billNumber && (
              <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.billNumber}
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#333" }}>
              PI Number
            </Form.Label>
            <Form.Control
              type="text"
              name="piNumber"
              value={formData.piNumber}
              onChange={handleChange}
              placeholder="Enter PI number"
              style={{
                borderRadius: "10px",
                padding: "12px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#333" }}>
              Invoice Date
            </Form.Label>
            <div className="custom-datepicker">
              <DatePicker
                selected={formData.invoiceDate}
                onChange={handleDateChange}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Select invoice date"
              />
            </div>
            {errors.invoiceDate && (
              <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.invoiceDate}
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#333" }}>
              Remarks by Billing Team <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="remarksByBilling"
              value={formData.remarksByBilling}
              onChange={handleChange}
              placeholder="Enter billing remarks"
              style={{
                borderRadius: "10px",
                padding: "12px",
                border: errors.remarksByBilling
                  ? "1px solid red"
                  : "1px solid #ced4da",
                fontSize: "1rem",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {errors.remarksByBilling && (
              <Form.Text style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.remarksByBilling}
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#333" }}>
              Bill Status
            </Form.Label>
            <Form.Select
              name="billStatus"
              value={formData.billStatus}
              onChange={handleChange}
              style={{
                borderRadius: "10px",
                padding: "12px",
                border: "1px solid #ced4da",
                fontSize: "1rem",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(37, 117, 252, 0.5)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            >
              <option value="Pending">Pending</option>
              <option value="Under Billing">Under Billing</option>
              <option value="Billing Complete">Billing Complete</option>
            </Form.Select>
          </Form.Group>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "15px",
            }}
          >
            <Button
              onClick={onClose}
              style={{
                background: "linear-gradient(135deg, #6c757d, #5a6268)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "20px",
                color: "#fff",
                fontWeight: "600",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
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
                fontSize: "1rem",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              }}
              onMouseEnter={(e) =>
                (e.target.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditBill;
