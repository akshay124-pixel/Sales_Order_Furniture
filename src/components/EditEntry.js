import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Modal, Form, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { FaEdit, FaSyncAlt, FaCog } from "react-icons/fa";
import { salesPersonlist } from "./Options";
import { Reportinglist } from "./Options";
import { productOptions } from "./Options";
// Styled Components
const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    margin: auto;
  }
  .modal-header,
  .modal-footer {
    background: linear-gradient(135deg, #2575fc, #6a11cb);
    color: white;
    border: none;
  }
  .modal-body {
    padding: 2rem;
    background: #f9f9f9;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.variant === "primary"
      ? "linear-gradient(135deg, #2575fc, #6a11cb)"
      : props.variant === "info"
      ? "linear-gradient(135deg, #2575fc, #6a11cb)"
      : props.variant === "danger"
      ? "#dc3545"
      : props.variant === "success"
      ? "#28a745"
      : "linear-gradient(135deg, rgb(252, 152, 11), rgb(244, 193, 10))"};
  &:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
`;

const FormSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

const ProductContainer = styled.div`
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff;
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

function EditEntry({ isOpen, onClose, onEntryUpdated, entryToEdit }) {
  const initialFormData = useMemo(
    () => ({
      soDate: "",
      dispatchFrom: "",
      dispatchDate: "",
      name: "",
      city: "",
      state: "",
      pinCode: "",
      contactNo: "",
      alterno: "",
      customerEmail: "",
      customername: "",
      gstno: "",
      products: [
        {
          productType: "",
          size: "N/A",
          spec: "N/A",
          qty: "",
          unitPrice: "",
          serialNos: "",
          modelNos: "",
          gst: "18",
          brand: "",
          warranty: "",
        },
      ],
      total: "",
      paymentCollected: "",
      paymentMethod: "",
      paymentDue: "",
      paymentTerms: "",

      neftTransactionId: "",
      chequeId: "",
      freightcs: "",
      freightstatus: "Extra",
      actualFreight: "",
      installchargesstatus: "Extra",
      orderType: "B2C",
      gemOrderNumber: "",
      deliveryDate: "",
      installation: "",
      installationStatus: "Pending",
      remarksByInstallation: "",
      dispatchStatus: "Not Dispatched",
      salesPerson: "",
      report: "",
      company: "Promark",
      stamp: "",
      installationReport: "No",
      transporterDetails: "",

      receiptDate: "",
      shippingAddress: "",
      billingAddress: "",
      invoiceNo: "",
      invoiceDate: "",
      fulfillingStatus: "Pending",
      remarksByProduction: "",
      remarksByAccounts: "",
      paymentReceived: "Not Received",
      billNumber: "",
      piNumber: "",
      remarksByBilling: "",
      verificationRemarks: "",
      billStatus: "Pending",
      completionStatus: "In Progress",
      fulfillmentDate: "",
      remarks: "",
      stamp: "Not Received",
      installationReport: "No",
      stockStatus: "In Stock",
      sostatus: "Pending for Approval",
      createdBy: "",
    }),
    []
  );

  const initialUpdateData = useMemo(
    () => ({
      sostatus: "Pending for Approval",
      remarks: "",
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [updateData, setUpdateData] = useState(initialUpdateData);
  const [view, setView] = useState("options");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: initialFormData,
  });

  const selectedState = watch("state");
  const products = watch("products") || [];
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (isOpen && entryToEdit) {
      const newFormData = {
        soDate: entryToEdit.soDate
          ? new Date(entryToEdit.soDate).toISOString().split("T")[0]
          : "",
        dispatchFrom: entryToEdit.dispatchFrom || "",
        dispatchDate: entryToEdit.dispatchDate
          ? new Date(entryToEdit.dispatchDate).toISOString().split("T")[0]
          : "",
        name: entryToEdit.name || "",
        city: entryToEdit.city || "",
        state: entryToEdit.state || "",
        pinCode: entryToEdit.pinCode || "",
        contactNo: entryToEdit.contactNo || "",
        alterno: entryToEdit.alterno || "",
        customerEmail: entryToEdit.customerEmail || "",
        customername: entryToEdit.customername || "",
        gstno: entryToEdit.gstno || "",
        products:
          entryToEdit.products && entryToEdit.products.length > 0
            ? entryToEdit.products.map((p) => ({
                productType: p.productType || "",
                size: p.size || "",
                spec: p.spec || "",
                qty: p.qty !== undefined ? String(p.qty) : "",
                unitPrice: p.unitPrice !== undefined ? String(p.unitPrice) : "",
                modelNos: p.modelNos?.length > 0 ? p.modelNos.join(", ") : "",
                gst: p.gst || "18",
                brand: p.brand || "",
                warranty: p.warranty || "",
              }))
            : [
                {
                  productType: "",
                  size: "",
                  spec: "",
                  qty: "",
                  unitPrice: "",
                  modelNos: "",
                  gst: "18",
                  brand: "",
                  warranty: "",
                },
              ],
        total: entryToEdit.total !== undefined ? String(entryToEdit.total) : "",
        paymentCollected: entryToEdit.paymentCollected || "",
        paymentMethod: entryToEdit.paymentMethod || "",
        paymentDue: entryToEdit.paymentDue || "",
        paymentTerms: entryToEdit.paymentTerms || "",
        stamp: entryToEdit.stamp || "Not Received",
        installationReport: entryToEdit.installationReport || "No",
        neftTransactionId: entryToEdit.neftTransactionId || "",
        chequeId: entryToEdit.chequeId || "",
        freightcs: entryToEdit.freightcs || "",
        freightstatus: entryToEdit.freightstatus || "Extra",
        actualFreight:
          entryToEdit.actualFreight !== undefined
            ? String(entryToEdit.actualFreight)
            : "",
        installchargesstatus: entryToEdit.installchargesstatus || "Extra",
        orderType: entryToEdit.orderType || "B2C",
        gemOrderNumber: entryToEdit.gemOrderNumber || "",
        deliveryDate: entryToEdit.deliveryDate
          ? new Date(entryToEdit.deliveryDate).toISOString().split("T")[0]
          : "",
        installation: entryToEdit.installation || "",
        installationStatus: entryToEdit.installationStatus || "Pending",
        remarksByInstallation: entryToEdit.remarksByInstallation || "",
        dispatchStatus: entryToEdit.dispatchStatus || "Not Dispatched",
        salesPerson: entryToEdit.salesPerson || "",
        report: entryToEdit.report || "",
        company: entryToEdit.company || "Promark",
        transporterDetails: entryToEdit.transporterDetails || "",

        receiptDate: entryToEdit.receiptDate
          ? new Date(entryToEdit.receiptDate).toISOString().split("T")[0]
          : "",
        shippingAddress: entryToEdit.shippingAddress || "",
        billingAddress: entryToEdit.billingAddress || "",
        invoiceNo: entryToEdit.invoiceNo || "",
        invoiceDate: entryToEdit.invoiceDate
          ? new Date(entryToEdit.invoiceDate).toISOString().split("T")[0]
          : "",
        fulfillingStatus: entryToEdit.fulfillingStatus || "Pending",
        remarksByProduction: entryToEdit.remarksByProduction || "",
        remarksByAccounts: entryToEdit.remarksByAccounts || "",
        paymentReceived: entryToEdit.paymentReceived || "Not Received",
        billNumber: entryToEdit.billNumber || "",
        piNumber: entryToEdit.piNumber || "",
        remarksByBilling: entryToEdit.remarksByBilling || "",
        verificationRemarks: entryToEdit.verificationRemarks || "",
        billStatus: entryToEdit.billStatus || "Pending",
        stockStatus: entryToEdit.stockStatus || "In Stock",
        completionStatus: entryToEdit.completionStatus || "In Progress",
        fulfillmentDate: entryToEdit.fulfillmentDate
          ? new Date(entryToEdit.fulfillmentDate).toISOString().split("T")[0]
          : "",
        remarks: entryToEdit.remarks || "",
        sostatus: entryToEdit.sostatus || "Pending for Approval",
        createdBy:
          entryToEdit.createdBy && typeof entryToEdit.createdBy === "object"
            ? entryToEdit.createdBy.username || "Unknown"
            : typeof entryToEdit.createdBy === "string"
            ? entryToEdit.createdBy
            : "",
      };
      setFormData(newFormData);
      setUpdateData({
        sostatus: entryToEdit.sostatus || "Pending for Approval",
        remarks: entryToEdit.remarks || "",
      });
      reset(newFormData);
      setView("options");
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, entryToEdit, reset]);
  const debouncedHandleInputChange = useCallback(
    debounce((name, value, index) => {
      if (name.startsWith("products.")) {
        const [_, field, idx] = name.split(".");
        setFormData((prev) => {
          const newProducts = [...prev.products];
          newProducts[idx] = {
            ...newProducts[idx],
            [field]: value,
          };
          return { ...prev, products: newProducts };
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }, 300),
    []
  );

  const handleUpdateInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onEditSubmit = async (data) => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const submissionData = {
        soDate: data.soDate ? new Date(data.soDate) : undefined,
        dispatchFrom: data.dispatchFrom || null,
        dispatchDate: data.dispatchDate ? new Date(data.dispatchDate) : null,
        name: data.name || null,
        city: data.city || null,
        state: data.state || null,
        pinCode: data.pinCode || null,
        contactNo: data.contactNo || null,
        alterno: data.alterno || null,
        customerEmail: data.customerEmail || null,
        customername: data.customername || null,
        gstno: data.gstno || null,
        products: data.products.map((p) => ({
          productType: p.productType || undefined,
          size: p.size || "N/A",
          spec: p.spec || "N/A",
          qty: p.qty ? Number(p.qty) : undefined,
          unitPrice: p.unitPrice ? Number(p.unitPrice) : undefined,
          serialNos: p.serialNos
            ? p.serialNos
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          modelNos: p.modelNos
            ? p.modelNos
                .split(",")
                .map((m) => m.trim())
                .filter(Boolean)
            : [],
          gst: p.gst || "18",
          brand: p.brand || null,
          warranty: p.warranty || null,
        })),
        total: data.total ? Number(data.total) : undefined,
        paymentCollected: data.paymentCollected || null,
        paymentMethod: data.paymentMethod || null,
        paymentDue: data.paymentDue || null,
        paymentTerms: data.paymentTerms || null,

        neftTransactionId: data.neftTransactionId || null,
        chequeId: data.chequeId || null,
        freightcs: data.freightcs || null,
        freightstatus: data.freightstatus || "Extra",
        actualFreight: data.actualFreight
          ? Number(data.actualFreight)
          : undefined,
        installchargesstatus: data.installchargesstatus || "Extra",
        orderType: data.orderType || "B2C",
        gemOrderNumber: data.gemOrderNumber || null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        installation: data.installation || null,
        installationStatus: data.installationStatus || "Pending",
        remarksByInstallation: data.remarksByInstallation || null,
        dispatchStatus: data.dispatchStatus || "Not Dispatched",
        salesPerson: data.salesPerson || null,
        report: data.report || null,
        company: data.company || "Promark",
        stamp: data.stamp || null,
        installationReport: data.installationReport || null,

        transporterDetails: data.transporterDetails || null,

        receiptDate: data.receiptDate ? new Date(data.receiptDate) : null,
        shippingAddress: data.shippingAddress || null,
        billingAddress: data.billingAddress || null,
        invoiceNo: data.invoiceNo || null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        fulfillingStatus: data.fulfillingStatus || "Pending",
        remarksByProduction: data.remarksByProduction || null,
        remarksByAccounts: data.remarksByAccounts || null,
        paymentReceived: data.paymentReceived || "Not Received",
        billNumber: data.billNumber || null,
        piNumber: data.piNumber || null,
        remarksByBilling: data.remarksByBilling || null,
        verificationRemarks: data.verificationRemarks || null,
        billStatus: data.billStatus || "Pending",
        completionStatus: data.completionStatus || "In Progress",
        fulfillmentDate: data.fulfillmentDate
          ? new Date(data.fulfillmentDate)
          : null,
        remarks: data.remarks || null,
        sostatus: data.sostatus || "Pending for Approval",
        stockStatus: data.stockStatus || "In Stock",
      };

      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${process.env.REACT_APP_URL}/api/edit/${entryToEdit._id}`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedEntry = response.data.data;
      toast.success("Entry updated successfully!");
      onEntryUpdated(updatedEntry);
      setView("options");
      onClose();
    } catch (err) {
      console.error("Edit submission error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update entry.";
      const errorDetails = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err.response?.data?.error || "";
      setError(
        errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const onUpdateSubmit = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const submissionData = {
        sostatus: updateData.sostatus || "Pending for Approval",
        remarks: updateData.remarks || null,
      };
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${process.env.REACT_APP_URL}/api/edit/${entryToEdit._id}`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedEntry = response.data.data;
      toast.success("Approvals updated successfully!");
      onEntryUpdated(updatedEntry);
      setView("options");
      onClose();
    } catch (err) {
      console.error("Update submission error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update approvals.";
      const errorDetails = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err.response?.data?.error || err.message;
      setError(
        errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const addProduct = () => {
    const newProducts = [
      ...products,
      {
        productType: "",
        size: "N/A",
        spec: "N/A",
        qty: "",
        unitPrice: "",
        serialNos: "",
        modelNos: "",
        gst: "18",
        brand: "",
        warranty: "",
      },
    ];
    setValue("products", newProducts);
    setFormData((prev) => ({ ...prev, products: newProducts }));
  };

  const removeProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setValue(
      "products",
      newProducts.length > 0
        ? newProducts
        : [
            {
              productType: "",
              size: "N/A",
              spec: "N/A",
              qty: "",
              unitPrice: "",
              serialNos: "",
              modelNos: "",
              gst: "18",
              brand: "",
              warranty: "",
            },
          ]
    );
    setFormData((prev) => ({
      ...prev,
      products:
        newProducts.length > 0
          ? newProducts
          : [
              {
                productType: "",
                size: "N/A",
                spec: "N/A",
                qty: "",
                unitPrice: "",
                serialNos: "",
                modelNos: "",
                gst: "18",
                brand: "",
                warranty: "",
              },
            ],
    }));
  };

  // Mock Data
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const citiesByState = useMemo(
    () => ({
      "Andhra Pradesh": [
        "Visakhapatnam",
        "Jaganathpuram",
        "Vijayawada",
        "Guntur",
        "Tirupati",
        "Kurnool",
        "Rajahmundry",
        "Nellore",
        "Anantapur",
        "Kadapa",
        "Srikakulam",
        "Eluru",
        "Ongole",
        "Chittoor",
        "Proddatur",
        "Machilipatnam",
      ],
      "Arunachal Pradesh": [
        "Itanagar",
        "Tawang",
        "Ziro",
        "Pasighat",
        "Bomdila",
        "Naharlagun",
        "Roing",
        "Aalo",
        "Tezu",
        "Changlang",
        "Khonsa",
        "Yingkiong",
        "Daporijo",
        "Seppa",
      ],
      Assam: [
        "Agartala",
        "Tripura",
        "Guwahati",
        "Dibrugarh",
        "Jorhat",
        "Silchar",
        "Tezpur",
        "Tinsukia",
        "Nagaon",
        "Sivasagar",
        "Barpeta",
        "Goalpara",
        "Karimganj",
        "Lakhimpur",
        "Diphu",
        "Golaghat",
        "Kamrup",
      ],
      Bihar: [
        "Patna",
        "Mirzapur",
        "Jehanabad",
        "Mithapur",
        "Gaya",
        "Bhagalpur",
        "Muzaffarpur",
        "Darbhanga",
        "Purnia",
        "Ara",
        "Begusarai",
        "Katihar",
        "Munger",
        "Chapra",
        "Sasaram",
        "Hajipur",
        "Bihar Sharif",
        "Sitamarhi",
      ],
      Chhattisgarh: [
        "Raipur",
        "Bilaspur",
        "Durg",
        "Korba",
        "Bhilai",
        "Rajnandgaon",
        "Jagdalpur",
        "Ambikapur",
        "Raigarh",
        "Dhamtari",
        "Kawardha",
        "Mahasamund",
        "Kondagaon",
        "Bijapur",
      ],
      Goa: [
        "Panaji",
        "Margao",
        "Vasco da Gama",
        "Mapusa",
        "Ponda",
        "Bicholim",
        "Sanguem",
        "Canacona",
        "Quepem",
        "Valpoi",
        "Sanquelim",
        "Curchorem",
      ],
      Gujarat: [
        "Ahmedabad",
        "Surat",
        "Vadodara",
        "Rajkot",
        "Bhavnagar",
        "Jamnagar",
        "Junagadh",
        "Gandhinagar",
        "Anand",
        "Morbi",
        "Nadiad",
        "Porbandar",
        "Mehsana",
        "Bharuch",
        "Navsari",
        "Surendranagar",
      ],
      Haryana: [
        "Bahadurgarh",
        "Charkhi Dadri",
        "Gurugram",
        "Faridabad",
        "Panipat",
        "Ambala",
        "Hisar",
        "Rohtak",
        "Karnal",
        "Bhiwani",
        "Kaithal",
        "Kurukshetra",
        "Sonipat",
        "Jhajjar",
        "Jind",
        "Fatehabad",
        "Pehowa",
        "Pinjore",
        "Rewari",
        "Yamunanagar",
        "Sirsa",
        "Dabwali",
        "Narwana",
      ],
      "Himachal Pradesh": [
        "Nagrota Surian",
        "Shimla",
        "Dharamshala",
        "Solan",
        "Mandi",
        "Hamirpur",
        "Kullu",
        "Manali",
        "Nahan",
        "Palampur",
        "Baddi",
        "Sundarnagar",
        "Paonta Sahib",
        "Bilaspur",
        "Chamba",
        "Una",
        "Kangra",
        "Parwanoo",
        "Nalagarh",
        "Rohru",
        "Keylong",
      ],
      Jharkhand: [
        "Ranchi",
        "Jamshedpur",
        "Dhanbad",
        "Bokaro",
        "Deoghar",
        "Hazaribagh",
        "Giridih",
        "Ramgarh",
        "Chaibasa",
        "Palamu",
        "Gumla",
        "Lohardaga",
        "Dumka",
        "Chatra",
        "Pakur",
        "Jamtara",
        "Simdega",
        "Sahibganj",
        "Godda",
        "Latehar",
        "Khunti",
      ],
      Karnataka: [
        "Bengaluru",
        "Mysuru",
        "Mangaluru",
        "Hubballi",
        "Belagavi",
        "Kalaburagi",
        "Ballari",
        "Davangere",
        "Shivamogga",
        "Tumakuru",
        "Udupi",
        "Vijayapura",
        "Chikkamagaluru",
        "Hassan",
        "Mandya",
        "Raichur",
        "Bidar",
        "Bagalkot",
        "Chitradurga",
        "Kolar",
        "Gadag",
        "Yadgir",
        "Haveri",
        "Dharwad",
        "Ramanagara",
        "Chikkaballapur",
        "Kodagu",
        "Koppal",
      ],
      Kerala: [
        "Thiruvananthapuram",
        "Kochi",
        "Kozhikode",
        "Kannur",
        "Alappuzha",
        "Thrissur",
        "Kottayam",
        "Palakkad",
        "Ernakulam",
        "Malappuram",
        "Pathanamthitta",
        "Idukki",
        "Wayanad",
        "Kollam",
        "Kasaragod",
        "Punalur",
        "Varkala",
        "Changanassery",
        "Kayani",
        "Kizhakkambalam",
        "Perumbavoor",
        "Muvattupuzha",
        "Attingal",
        "Vypin",
        "North Paravur",
        "Adoor",
        "Cherthala",
        "Mattancherry",
        "Fort Kochi",
        "Munroe Island",
      ],
      "Madhya Pradesh": [
        "Bhopal",
        "Indore",
        "Gwalior",
        "Jabalpur",
        "Ujjain",
        "Sagar",
        "Ratlam",
        "Satna",
        "Dewas",
        "Murwara (Katni)",
        "Chhindwara",
        "Rewa",
        "Burhanpur",
        "Khandwa",
        "Bhind",
        "Shivpuri",
        "Vidisha",
        "Sehore",
        "Hoshangabad",
        "Itarsi",
        "Neemuch",
        "Chhatarpur",
        "Betul",
        "Mandsaur",
        "Damoh",
        "Singrauli",
        "Guna",
        "Ashok Nagar",
        "Datia",
        "Mhow",
        "Pithampur",
        "Shahdol",
        "Seoni",
        "Mandla",
        "Tikamgarh",
        "Raisen",
        "Narsinghpur",
        "Morena",
        "Barwani",
        "Rajgarh",
        "Khargone",
        "Anuppur",
        "Umaria",
        "Dindori",
        "Sheopur",
        "Alirajpur",
        "Jhabua",
        "Sidhi",
        "Harda",
        "Balaghat",
        "Agar Malwa",
      ],
      Maharashtra: [
        "Mumbai",
        "Pune",
        "Nagpur",
        "Nashik",
        "Aurangabad",
        "Solapur",
        "Kolhapur",
        "Thane",
        "Satara",
        "Latur",
        "Chandrapur",
        "Jalgaon",
        "Bhiwandi",
        "Shirdi",
        "Akola",
        "Parbhani",
        "Raigad",
        "Washim",
        "Buldhana",
        "Nanded",
        "Yavatmal",
        "Beed",
        "Amravati",
        "Kalyan",
        "Dombivli",
        "Ulhasnagar",
        "Nagothane",
        "Vasai",
        "Virar",
        "Mira-Bhayandar",
        "Dhule",
        "Sangli",
        "Wardha",
        "Ahmednagar",
        "Pandharpur",
        "Malegaon",
        "Osmanabad",
        "Gondia",
        "Baramati",
        "Jalna",
        "Hingoli",
        "Sindhudurg",
        "Ratnagiri",
        "Palghar",
        "Ambarnath",
        "Badlapur",
        "Taloja",
        "Alibaug",
        "Murbad",
        "Karjat",
        "Pen",
        "Newasa",
      ],
      Manipur: [
        "Imphal",
        "Churachandpur",
        "Thoubal",
        "Bishnupur",
        "Kakching",
        "Senapati",
        "Ukhrul",
        "Tamenglong",
        "Jiribam",
        "Moreh",
        "Noney",
        "Pherzawl",
        "Kangpokpi",
      ],
      Meghalaya: [
        "Shillong",
        "Tura",
        "Nongpoh",
        "Cherrapunjee",
        "Jowai",
        "Baghmara",
        "Williamnagar",
        "Mawkyrwat",
        "Resubelpara",
        "Mairang",
      ],
      Mizoram: [
        "Aizawl",
        "Lunglei",
        "Champhai",
        "Serchhip",
        "Kolasib",
        "Saiha",
        "Lawngtlai",
        "Mamit",
        "Hnahthial",
        "Khawzawl",
        "Saitual",
      ],
      Nagaland: [
        "Kohima",
        "Dimapur",
        "Mokokchung",
        "Tuensang",
        "Wokha",
        "Mon",
        "Zunheboto",
        "Phek",
        "Longleng",
        "Kiphire",
        "Peren",
      ],
      Odisha: [
        "Bhubaneswar",
        "Cuttack",
        "Rourkela",
        "Puri",
        "Sambalpur",
        "Berhampur",
        "Balasore",
        "Baripada",
        "Bhadrak",
        "Jeypore",
        "Angul",
        "Dhenkanal",
        "Keonjhar",
        "Kendrapara",
        "Jagatsinghpur",
        "Paradeep",
        "Bargarh",
        "Rayagada",
        "Koraput",
        "Nabarangpur",
        "Kalahandi",
        "Nuapada",
        "Phulbani",
        "Balangir",
        "Sundargarh",
      ],
      Punjab: [
        "Amritsar",
        "Ludhiana",
        "Jalandhar",
        "Patiala",
        "Bathinda",
        "Mohali",
        "Hoshiarpur",
        "Gurdaspur",
        "Ferozepur",
        "Sangrur",
        "Moga",
        "Rupnagar",
        "Kapurthala",
        "Faridkot",
        "Muktsar",
        "Fazilka",
        "Barnala",
        "Mansa",
        "Tarn Taran",
        "Nawanshahr",
        "Pathankot",
        "Zirakpur",
        "Khanna",
        "Malerkotla",
        "Abohar",
        "Rajpura",
        "Phagwara",
        "Batala",
        "Samrala",
        "Anandpur Sahib",
        "Sirhind",
        "Kharar",
        "Morinda",
        "Bassi Pathana",
        "Khamanon",
        "Chunni Kalan",
        "Balachaur",
        "Dinanagar",
        "Dasuya",
        "Nakodar",
        "Jagraon",
        "Sunam",
        "Dhuri",
        "Lehragaga",
        "Rampura Phul",
      ],
      Rajasthan: [
        "Baran",
        "Newai",
        "Gaganagar",
        "Suratgarh",
        "Jaipur",
        "Udaipur",
        "Jodhpur",
        "Kota",
        "Ajmer",
        "Bikaner",
        "Alwar",
        "Bharatpur",
        "Sikar",
        "Pali",
        "Nagaur",
        "Jhunjhunu",
        "Chittorgarh",
        "Tonk",
        "Barmer",
        "Jaisalmer",
        "Dholpur",
        "Bhilwara",
        "Hanumangarh",
        "Sawai Madhopur",
      ],
      Sikkim: [
        "Gangtok",
        "Namchi",
        "Pelling",
        "Geyzing",
        "Mangan",
        "Rangpo",
        "Jorethang",
        "Yuksom",
        "Ravangla",
        "Lachen",
        "Lachung",
      ],
      "Tamil Nadu": [
        "Chennai",
        "Coimbatore",
        "Madurai",
        "Tiruchirappalli",
        "Salem",
        "Erode",
        "Tirunelveli",
        "Vellore",
        "Thanjavur",
        "Tuticorin",
        "Dindigul",
        "Cuddalore",
        "Kancheepuram",
        "Nagercoil",
        "Kumbakonam",
        "Karur",
        "Sivakasi",
        "Namakkal",
        "Tiruppur",
      ],
      Telangana: [
        "Hyderabad",
        "Warangal",
        "Nizamabad",
        "Karimnagar",
        "Khammam",
        "Mahbubnagar",
        "Ramagundam",
        "Siddipet",
        "Adilabad",
        "Nalgonda",
        "Mancherial",
        "Kothagudem",
        "Zaheerabad",
        "Miryalaguda",
        "Bhongir",
        "Jagtial",
      ],
      Tripura: [
        "Agartala",
        "Udaipur",
        "Dharmanagar",
        "Kailashahar",
        "Belonia",
        "Kamalpur",
        "Ambassa",
        "Khowai",
        "Sabroom",
        "Sonamura",
        "Melaghar",
      ],
      "Uttar Pradesh": [
        "Shikohabad",
        "Baghpat",
        "Mahuwadabar",
        "Anandnagar Maharajganj",
        "Badhnan",
        "Khalilabad",
        "Lucknow",
        "Matbarganj",
        "Kasganj",
        "Kanpur",
        "Varanasi",
        "Agra",
        "Prayagraj (Allahabad)",
        "Ghaziabad",
        "Noida",
        "Meerut",
        "Aligarh",
        "Bareilly",
        "Moradabad",
        "Saharanpur",
        "Gorakhpur",
        "Firozabad",
        "Jhansi",
        "Muzaffarnagar",
        "Mathura-Vrindavan",
        "Budaun",
        "Rampur",
        "Shahjahanpur",
        "Farrukhabad-Fatehgarh",
        "Ayodhya",
        "Unnao",
        "Jaunpur",
        "Lakhimpur",
        "Hathras",
        "Banda",
        "Pilibhit",
        "Barabanki",
        "Khurja",
        "Gonda",
        "Mainpuri",
        "Lalitpur",
        "Sitapur",
        "Etah",
        "Deoria",
        "Ghazipur",
      ],
      Uttarakhand: [
        "Dehradun",
        "Haridwar",
        "Nainital",
        "Rishikesh",
        "Mussoorie",
        "Almora",
        "Pithoragarh",
        "Haldwani",
        "Rudrapur",
        "Bageshwar",
        "Champawat",
        "Uttarkashi",
        "Roorkee",
        "Tehri",
        "Lansdowne",
      ],
      "West Bengal": [
        "Kolkata",
        "Garia",
        "Darjeeling",
        "Siliguri",
        "Howrah",
        "Asansol",
        "Durgapur",
        "Malda",
        "Cooch Behar",
        "Haldia",
        "Kharagpur",
        "Raiganj",
        "Bardhaman",
        "Jalpaiguri",
        "Chandannagar",
        "Kalimpong",
        "Alipurduar",
      ],
      "Andaman and Nicobar Islands": [
        "Port Blair",
        "Havelock Island",
        "Diglipur",
        "Neil Island",
        "Car Nicobar",
        "Little Andaman",
        "Long Island",
        "Mayabunder",
        "Campbell Bay",
        "Rangat",
        "Wandoor",
      ],
      Chandigarh: [
        "Sector 1",
        "Sector 2",
        "Sector 3",
        "Sector 4",
        "Sector 5",
        "Sector 6",
        "Sector 7",
        "Sector 8",
        "Sector 9",
        "Sector 10",
        "Sector 11",
        "Sector 12",
        "Sector 14",
        "Sector 15",
        "Sector 16",
        "Sector 17",
        "Sector 18",
        "Sector 19",
        "Sector 20",
        "Sector 21",
        "Sector 22",
        "Sector 23",
        "Sector 24",
        "Sector 25",
        "Sector 26",
        "Sector 27",
        "Sector 28",
        "Sector 29",
        "Sector 30",
        "Sector 31",
        "Sector 32",
        "Sector 33",
        "Sector 34",
        "Sector 35",
        "Sector 36",
        "Sector 37",
        "Sector 38",
        "Sector 39",
        "Sector 40",
        "Sector 41",
        "Sector 42",
        "Sector 43",
        "Sector 44",
        "Sector 45",
        "Sector 46",
        "Sector 47",
      ],
      "Dadra and Nagar Haveli and Daman and Diu": [
        "Daman",
        "Diu",
        "Silvassa",
        "Amli",
        "Kachigam",
        "Naroli",
        "Vapi",
        "Marwad",
        "Samarvarni",
        "Kawant",
      ],
      Delhi: [
        "New Delhi",
        "Alaknanda",
        "Old Delhi",
        "Dwarka",
        "Rohini",
        "Karol Bagh",
        "Lajpat Nagar",
        "Saket",
        "Vasant Kunj",
        "Janakpuri",
        "Mayur Vihar",
        "Shahdara",
        "Preet Vihar",
        "Pitampura",
        "Chanakyapuri",
        "Narela",
        "Mehrauli",
        "Najafgarh",
        "Okhla",
        "Tilak Nagar",
      ],
      "Jammu and Kashmir": [
        "Anantnag",
        "Bandipora",
        "Baramulla",
        "Budgam",
        "Doda",
        "Ganderbal",
        "Jammu",
        "Kathua",
        "Kishtwar",
        "Kulgam",
        "Kupwara",
        "Poonch",
        "Pulwama",
        "Rajouri",
        "Ramban",
        "Reasi",
        "Samba",
        "Shopian",
        "Srinagar",
        "Udhampur",
      ],
      Ladakh: [
        "Leh",
        "Kargil",
        "Diskit",
        "Padum",
        "Nubra",
        "Tangtse",
        "Sankoo",
        "Zanskar",
        "Nyoma",
        "Turtuk",
        "Hanle",
      ],
      Lakshadweep: [
        "Kavaratti",
        "Agatti",
        "Minicoy",
        "Amini",
        "Andrott",
        "Kalpeni",
        "Kadmat",
        "Chetlat",
        "Bitra",
        "Bangaram",
      ],
      Puducherry: [
        "Puducherry",
        "Karaikal",
        "Mahe",
        "Yanam",
        "Villianur",
        "Bahour",
        "Oulgaret",
        "Ariyankuppam",
        "Nettapakkam",
      ],
    }),
    []
  );

  const renderOptions = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "1rem",
      }}
    >
      <StyledButton variant="primary" onClick={() => setView("edit")}>
        Edit Full Details
      </StyledButton>
      <StyledButton variant="info" onClick={() => setView("update")}>
        Update Approvals
      </StyledButton>
    </div>
  );

  const renderEditForm = () => (
    <Form onSubmit={handleSubmit(onEditSubmit)}>
      <FormSection>
        <Form.Group controlId="createdBy">
          <Form.Label>👤 Created By</Form.Label>
          <Form.Control
            {...register("createdBy")}
            readOnly
            disabled
            isInvalid={!!errors.createdBy}
          />
        </Form.Group>
        <Form.Group controlId="soDate">
          <Form.Label>📅 SO Date *</Form.Label>
          <Form.Control
            type="date"
            {...register("soDate", { required: "SO Date is required" })}
            onChange={(e) =>
              debouncedHandleInputChange("soDate", e.target.value)
            }
            isInvalid={!!errors.soDate}
          />
          <Form.Control.Feedback type="invalid">
            {errors.soDate?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="dispatchFrom">
          <Form.Label>📍 Dispatch From</Form.Label>
          <Form.Select
            {...register("dispatchFrom")}
            onChange={(e) =>
              debouncedHandleInputChange("dispatchFrom", e.target.value)
            }
            isInvalid={!!errors.dispatchFrom}
            aria-label="Dispatch From"
          >
            <option value="" disabled>
              -- Select Dispatch Location --
            </option>
            <option value="Patna">Patna</option>
            <option value="Bareilly">Bareilly</option>
            <option value="Morinda">Morinda</option>
            <option value="Ranchi">Ranchi</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Delhi">Delhi</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Rajasthan">Rajasthan</option>
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="dispatchDate">
          <Form.Label>📅 Dispatch Date</Form.Label>
          <Form.Control
            type="date"
            {...register("dispatchDate")}
            onChange={(e) =>
              debouncedHandleInputChange("dispatchDate", e.target.value)
            }
            isInvalid={!!errors.dispatchDate}
          />
        </Form.Group>
        <Form.Group controlId="deliveryDate">
          <Form.Label>📅 Delivery Date</Form.Label>
          <Form.Control
            type="date"
            {...register("deliveryDate")}
            onChange={(e) =>
              debouncedHandleInputChange("deliveryDate", e.target.value)
            }
            isInvalid={!!errors.deliveryDate}
          />
        </Form.Group>
        <Form.Group controlId="name">
          <Form.Label>👤 Contact Person</Form.Label>
          <Form.Control
            {...register("name")}
            onChange={(e) => debouncedHandleInputChange("name", e.target.value)}
            isInvalid={!!errors.name}
          />
        </Form.Group>
        <Form.Group controlId="customername">
          <Form.Label>👤 Customer Name</Form.Label>
          <Form.Control
            {...register("customername")}
            onChange={(e) =>
              debouncedHandleInputChange("customername", e.target.value)
            }
            isInvalid={!!errors.customername}
          />
        </Form.Group>
        <Form.Group controlId="customerEmail">
          <Form.Label>📧 Customer Email</Form.Label>
          <Form.Control
            type="email"
            {...register("customerEmail", {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("customerEmail", e.target.value)
            }
            isInvalid={!!errors.customerEmail}
          />
          <Form.Control.Feedback type="invalid">
            {errors.customerEmail?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="contactNo">
          <Form.Label>📱 Contact Number</Form.Label>
          <Form.Control
            {...register("contactNo", {
              pattern: {
                value: /^\d{10}$/,
                message: "Contact number must be 10 digits",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("contactNo", e.target.value)
            }
            isInvalid={!!errors.contactNo}
          />
          <Form.Control.Feedback type="invalid">
            {errors.contactNo?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="alterno">
          <Form.Label>📞 Alternate Contact Number</Form.Label>
          <Form.Control
            {...register("alterno", {
              pattern: {
                value: /^\d{10}$/,
                message: "Alternate contact number must be 10 digits",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("alterno", e.target.value)
            }
            isInvalid={!!errors.alterno}
          />
          <Form.Control.Feedback type="invalid">
            {errors.alterno?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="gstno">
          <Form.Label>📑 GST Number</Form.Label>
          <Form.Control
            {...register("gstno")}
            onChange={(e) =>
              debouncedHandleInputChange("gstno", e.target.value)
            }
            isInvalid={!!errors.gstno}
            placeholder="e.g., 22AAAAA0000A1Z5"
          />
          <Form.Control.Feedback type="invalid">
            {errors.gstno?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="state">
          <Form.Label>🗺️ State</Form.Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("state", e.target.value);
                }}
                isInvalid={!!errors.state}
              >
                <option value="">-- Select State --</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="city">
          <Form.Label>🌆 City</Form.Label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("city", e.target.value);
                }}
                isInvalid={!!errors.city}
                disabled={!selectedState}
              >
                <option value="">-- Select City --</option>
                {selectedState &&
                  citiesByState[selectedState]?.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="pinCode">
          <Form.Label>📮 Pin Code</Form.Label>
          <Form.Control
            {...register("pinCode", {
              pattern: {
                value: /^\d{6}$/,
                message: "Pin Code must be 6 digits",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("pinCode", e.target.value)
            }
            isInvalid={!!errors.pinCode}
          />
          <Form.Control.Feedback type="invalid">
            {errors.pinCode?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="shippingAddress">
          <Form.Label>📦 Shipping Address</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("shippingAddress")}
            onChange={(e) =>
              debouncedHandleInputChange("shippingAddress", e.target.value)
            }
            isInvalid={!!errors.shippingAddress}
          />
        </Form.Group>
        <Form.Group controlId="billingAddress">
          <Form.Label>🏠 Billing Address</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("billingAddress")}
            onChange={(e) =>
              debouncedHandleInputChange("billingAddress", e.target.value)
            }
            isInvalid={!!errors.billingAddress}
          />
        </Form.Group>
        <Form.Group controlId="orderType">
          <Form.Label>📦 Order Type</Form.Label>
          <Controller
            name="orderType"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("orderType", e.target.value);
                }}
                isInvalid={!!errors.orderType}
              >
                <option value="B2G">B2G</option>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
                <option value="Demo">Demo</option>
                <option value="Replacement">Replacement</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="stockStatus">
          <Form.Label>📦 Stock Status</Form.Label>
          <Controller
            name="stockStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("stockStatus", e.target.value);
                }}
                isInvalid={!!errors.stockStatus}
              >
                <option value="">-- Select Stock Status --</option>
                <option value="In Stock">In Stock</option>
                <option value="Not in Stock">Not in Stock</option>
              </Form.Select>
            )}
          />
          <Form.Control.Feedback type="invalid">
            {errors.stockStatus?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="gemOrderNumber">
          <Form.Label>📄 GEM Order Number</Form.Label>
          <Form.Control
            {...register("gemOrderNumber")}
            onChange={(e) =>
              debouncedHandleInputChange("gemOrderNumber", e.target.value)
            }
            isInvalid={!!errors.gemOrderNumber}
          />
        </Form.Group>
        {/* Products Section */}
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
            ✨ Products
          </h3>
          {products.map((product, index) => (
            <ProductContainer key={index}>
              <ProductHeader>
                <h5>Product {index + 1}</h5>
                {products.length > 1 && (
                  <StyledButton
                    variant="danger"
                    onClick={() => removeProduct(index)}
                    style={{ padding: "5px 10px", fontSize: "0.9rem" }}
                  >
                    Remove
                  </StyledButton>
                )}
              </ProductHeader>
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
                  <Form.Group controlId={`products.${index}.productType`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Product Category{" "}
                      <span style={{ color: "#f43f5e" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.productType`, {
                        required: "Product Type is required",
                      })}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.productType`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.productType}
                      placeholder="Enter Product Category"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.productType?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "2 / 3" }}>
                  <Form.Group controlId={`products.${index}.size`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Size
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.size`)}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.size`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.size}
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
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.size?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "3 / 4" }}>
                  <Form.Group controlId={`products.${index}.spec`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Specification
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.spec`)}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.spec`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.spec}
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
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.spec?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "1 / 2" }}>
                  <Form.Group controlId={`products.${index}.qty`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Quantity * <span style={{ color: "#f43f5e" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      {...register(`products.${index}.qty`, {
                        required: "Quantity is required",
                        min: {
                          value: 1,
                          message: "Quantity must be at least 1",
                        },
                      })}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.qty`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.qty}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.qty?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "2 / 3" }}>
                  <Form.Group controlId={`products.${index}.unitPrice`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Unit Price * <span style={{ color: "#f43f5e" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      {...register(`products.${index}.unitPrice`, {
                        required: "Unit Price is required",
                        min: {
                          value: 0,
                          message: "Unit Price cannot be negative",
                        },
                      })}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.unitPrice`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.unitPrice}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.unitPrice?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "3 / 4" }}>
                  <Form.Group controlId={`products.${index}.gst`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      GST * <span style={{ color: "#f43f5e" }}>*</span>
                    </Form.Label>
                    <Form.Select
                      {...register(`products.${index}.gst`, {
                        required: "GST is required",
                      })}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.gst`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.gst}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    >
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                      <option value="including">Including</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.gst?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "1 / 2" }}>
                  <Form.Group controlId={`products.${index}.brand`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Brand
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.brand`)}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.brand`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.brand}
                      placeholder="Enter brand"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.brand?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "2 / 3" }}>
                  <Form.Group controlId={`products.${index}.warranty`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Warranty
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.warranty`)}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.warranty`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.warranty}
                      placeholder="Enter warranty"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.warranty?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div style={{ gridColumn: "3 / 4" }}>
                  <Form.Group controlId={`products.${index}.modelNos`}>
                    <Form.Label
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#475569",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Model Nos
                    </Form.Label>
                    <Form.Control
                      {...register(`products.${index}.modelNos`)}
                      onChange={(e) =>
                        debouncedHandleInputChange(
                          `products.${index}.modelNos`,
                          e.target.value,
                          index
                        )
                      }
                      isInvalid={!!errors.products?.[index]?.modelNos}
                      placeholder="Enter model numbers (e.g., MN1, MN2, MN3)"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#f8fafc",
                        fontSize: "1rem",
                        color: "#1e293b",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.products?.[index]?.modelNos?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
              </div>
            </ProductContainer>
          ))}
          <StyledButton
            variant="primary"
            onClick={addProduct}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              color: "#fff",
              border: "none",
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
          >
            Add Product ➕
          </StyledButton>
        </div>
        <Form.Group controlId="total">
          <Form.Label>💵 Total *</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            {...register("total", {
              required: "Total is required",
              min: { value: 0, message: "Total cannot be negative" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("total", e.target.value)
            }
            isInvalid={!!errors.total}
          />
          <Form.Control.Feedback type="invalid">
            {errors.total?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="paymentCollected">
          <Form.Label>💰 Payment Collected</Form.Label>
          <Form.Control
            {...register("paymentCollected")}
            onChange={(e) =>
              debouncedHandleInputChange("paymentCollected", e.target.value)
            }
            isInvalid={!!errors.paymentCollected}
            placeholder="e.g., 5000"
          />
          <Form.Control.Feedback type="invalid">
            {errors.paymentCollected?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="stamp">
          <Form.Label>📦 Signed Stamp Receiving</Form.Label>
          <Form.Select
            {...register("stamp")}
            onChange={(e) =>
              debouncedHandleInputChange("stamp", e.target.value)
            }
            isInvalid={!!errors.stamp}
            defaultValue="Not Received"
          >
            <option value="Received">Received</option>
            <option value="Not Received">Not Received</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.stamp?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="installationReport">
          <Form.Label>📝 Installation Report</Form.Label>
          <Controller
            name="installationReport"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange(
                    "installationReport",
                    e.target.value
                  );
                }}
                isInvalid={!!errors.installationReport}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </Form.Select>
            )}
          />
          <Form.Control.Feedback type="invalid">
            {errors.installationReport?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="paymentMethod">
          <Form.Label>💳 Payment Method</Form.Label>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("paymentMethod", e.target.value);
                }}
                isInvalid={!!errors.paymentMethod}
              >
                <option value="">-- Select Payment Method --</option>
                <option value="Cash">Cash</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="Cheque">Cheque</option>
              </Form.Select>
            )}
          />
        </Form.Group>{" "}
        <Form.Group controlId="neftTransactionId">
          <Form.Label>📄 NEFT/RTGS Transaction ID</Form.Label>
          <Form.Control
            {...register("neftTransactionId")}
            onChange={(e) =>
              debouncedHandleInputChange("neftTransactionId", e.target.value)
            }
            isInvalid={!!errors.neftTransactionId}
            disabled={paymentMethod !== "NEFT" && paymentMethod !== "RTGS"}
          />
          <Form.Control.Feedback type="invalid">
            {errors.neftTransactionId?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="chequeId">
          <Form.Label>📄 Cheque ID</Form.Label>
          <Form.Control
            {...register("chequeId")}
            onChange={(e) =>
              debouncedHandleInputChange("chequeId", e.target.value)
            }
            isInvalid={!!errors.chequeId}
            disabled={paymentMethod !== "Cheque"}
          />
          <Form.Control.Feedback type="invalid">
            {errors.chequeId?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="paymentDue">
          <Form.Label>💰 Payment Due</Form.Label>
          <Form.Control
            {...register("paymentDue")}
            onChange={(e) =>
              debouncedHandleInputChange("paymentDue", e.target.value)
            }
            isInvalid={!!errors.paymentDue}
            placeholder="e.g., 2000"
          />
          <Form.Control.Feedback type="invalid">
            {errors.paymentDue?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="paymentTerms">
          <Form.Label>📝 Payment Terms</Form.Label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("paymentTerms", e.target.value);
                }}
                isInvalid={!!errors.paymentTerms}
              >
                <option value="">-- Select Payment Terms --</option>
                <option value="100% Advance">100% Advance</option>
                <option value="Partial Advance">Partial Advance</option>
                <option value="Credit">Credit</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="freightcs">
          <Form.Label>🚚 Freight Charges</Form.Label>
          <Form.Control
            {...register("freightcs")}
            onChange={(e) =>
              debouncedHandleInputChange("freightcs", e.target.value)
            }
            isInvalid={!!errors.freightcs}
            placeholder="e.g., 1000"
          />
          <Form.Control.Feedback type="invalid">
            {errors.freightcs?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="freightstatus">
          <Form.Label>🚚 Freight Status</Form.Label>
          <Form.Select
            {...register("freightstatus")}
            onChange={(e) =>
              debouncedHandleInputChange("freightstatus", e.target.value)
            }
            isInvalid={!!errors.freightstatus}
            defaultValue="Extra"
          >
            <option value="To Pay">To Pay</option>
            <option value="Including">Including</option>
            <option value="Extra">Extra</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.freightstatus?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="actualFreight">
          <Form.Label>🚚 Actual Freight</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            {...register("actualFreight", {
              min: {
                value: 0,
                message: "Actual Freight cannot be negative",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("actualFreight", e.target.value)
            }
            isInvalid={!!errors.actualFreight}
          />
          <Form.Control.Feedback type="invalid">
            {errors.actualFreight?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="installchargesstatus">
          <Form.Label>🔧 Installation Charges Status</Form.Label>
          <Form.Select
            {...register("installchargesstatus")}
            onChange={(e) =>
              debouncedHandleInputChange("installchargesstatus", e.target.value)
            }
            isInvalid={!!errors.installchargesstatus}
            defaultValue="Extra"
          >
            <option value="To Pay">To Pay</option>
            <option value="Including">Including</option>
            <option value="Extra">Extra</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.installchargesstatus?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="installation">
          <Form.Label>🛠️ Installation Charges</Form.Label>
          <Form.Control
            {...register("installation")}
            onChange={(e) =>
              debouncedHandleInputChange("installation", e.target.value)
            }
            isInvalid={!!errors.installation}
            placeholder="e.g., 500"
          />
          <Form.Control.Feedback type="invalid">
            {errors.installation?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="installationStatus">
          <Form.Label>🛠️ Installation Status</Form.Label>
          <Controller
            name="installationStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange(
                    "installationStatus",
                    e.target.value
                  );
                }}
                isInvalid={!!errors.installationStatus}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="remarksByInstallation">
          <Form.Label>✏️ Remarks by Installation</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("remarksByInstallation")}
            onChange={(e) =>
              debouncedHandleInputChange(
                "remarksByInstallation",
                e.target.value
              )
            }
            isInvalid={!!errors.remarksByInstallation}
          />
        </Form.Group>
        <Form.Group controlId="dispatchStatus">
          <Form.Label>🚚 Dispatch Status</Form.Label>
          <Controller
            name="dispatchStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("dispatchStatus", e.target.value);
                }}
                isInvalid={!!errors.dispatchStatus}
              >
                <option value="Not Dispatched">Not Dispatched</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="salesPerson">
          <Form.Label>👤 Sales Person</Form.Label>
          <Form.Control
            as="select"
            {...register("salesPerson")}
            onChange={(e) =>
              debouncedHandleInputChange("salesPerson", e.target.value)
            }
            isInvalid={!!errors.salesPerson}
          >
            <option value="">Select Sales Person</option>
            {salesPersonlist.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </Form.Control>
          {errors.salesPerson && (
            <Form.Control.Feedback type="invalid">
              {errors.salesPerson.message}
            </Form.Control.Feedback>
          )}
        </Form.Group>
        <Form.Group controlId="report">
          <Form.Label>👤 Reporting Manager</Form.Label>
          <Form.Control
            as="select"
            {...register("report")}
            onChange={(e) =>
              debouncedHandleInputChange("report", e.target.value)
            }
            isInvalid={!!errors.report}
          >
            <option value="">Select Reporting Manager</option>
            {Reportinglist.map((manager) => (
              <option key={manager} value={manager}>
                {manager}
              </option>
            ))}
          </Form.Control>
          {errors.report && (
            <Form.Control.Feedback type="invalid">
              {errors.report.message}
            </Form.Control.Feedback>
          )}
        </Form.Group>
        <Form.Group controlId="company">
          <Form.Label>🏢 Company</Form.Label>
          <Controller
            name="company"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("company", e.target.value);
                }}
                isInvalid={!!errors.company}
              >
                <option value="Promark">Promark</option>
                <option value="Foxmate">Foxmate</option>
                <option value="Promine">Promine</option>
                <option value="Primus">Primus</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="transporterDetails">
          <Form.Label>📋 Transporter Details</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("transporterDetails")}
            onChange={(e) =>
              debouncedHandleInputChange("transporterDetails", e.target.value)
            }
            isInvalid={!!errors.transporterDetails}
          />
        </Form.Group>
        <Form.Group controlId="receiptDate">
          <Form.Label>📅 Receipt Date</Form.Label>
          <Form.Control
            type="date"
            {...register("receiptDate")}
            onChange={(e) =>
              debouncedHandleInputChange("receiptDate", e.target.value)
            }
            isInvalid={!!errors.receiptDate}
          />
        </Form.Group>
        <Form.Group controlId="invoiceNo">
          <Form.Label>📄 Invoice No</Form.Label>
          <Form.Control
            {...register("invoiceNo")}
            onChange={(e) =>
              debouncedHandleInputChange("invoiceNo", e.target.value)
            }
            isInvalid={!!errors.invoiceNo}
          />
        </Form.Group>
        <Form.Group controlId="invoiceDate">
          <Form.Label>📅 Invoice Date</Form.Label>
          <Form.Control
            type="date"
            {...register("invoiceDate")}
            onChange={(e) =>
              debouncedHandleInputChange("invoiceDate", e.target.value)
            }
            isInvalid={!!errors.invoiceDate}
          />
        </Form.Group>
        <Form.Group controlId="piNumber">
          <Form.Label>📄 PI Number</Form.Label>
          <Form.Control
            {...register("piNumber")}
            onChange={(e) =>
              debouncedHandleInputChange("piNumber", e.target.value)
            }
            isInvalid={!!errors.piNumber}
          />
        </Form.Group>
        <Form.Group controlId="billNumber">
          <Form.Label>📄 Bill Number</Form.Label>
          <Form.Control
            {...register("billNumber")}
            onChange={(e) =>
              debouncedHandleInputChange("billNumber", e.target.value)
            }
            isInvalid={!!errors.billNumber}
          />
        </Form.Group>
        <Form.Group controlId="billStatus">
          <Form.Label>📋 Bill Status</Form.Label>
          <Controller
            name="billStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("billStatus", e.target.value);
                }}
                isInvalid={!!errors.billStatus}
              >
                <option value="Pending">Pending</option>
                <option value="Under Billing">Under Billing</option>
                <option value="Billing Complete">Billing Complete</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="paymentReceived">
          <Form.Label>💰 Payment Received</Form.Label>
          <Controller
            name="paymentReceived"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("paymentReceived", e.target.value);
                }}
                isInvalid={!!errors.paymentReceived}
              >
                <option value="Not Received">Not Received</option>
                <option value="Received">Received</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="completionStatus">
          <Form.Label>📋 Completion Status</Form.Label>
          <Controller
            name="completionStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange(
                    "completionStatus",
                    e.target.value
                  );
                }}
                isInvalid={!!errors.completionStatus}
              >
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="fulfillingStatus">
          <Form.Label>📋 Production Status</Form.Label>
          <Controller
            name="fulfillingStatus"
            control={control}
            render={({ field }) => (
              <Form.Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange(
                    "fulfillingStatus",
                    e.target.value
                  );
                }}
                isInvalid={!!errors.fulfillingStatus}
              >
                <option value="Pending">Pending</option>
                <option value="Under Process">Under Process</option>
                <option value="Order Cancel">Order Cancel</option>
                <option value="Partial Dispatch">Partial Dispatch</option>
                <option value="Fulfilled">Fulfilled</option>
              </Form.Select>
            )}
          />
        </Form.Group>
        <Form.Group controlId="fulfillmentDate">
          <Form.Label>📅 Production Date</Form.Label>
          <Form.Control
            type="date"
            {...register("fulfillmentDate")}
            onChange={(e) =>
              debouncedHandleInputChange("fulfillmentDate", e.target.value)
            }
            isInvalid={!!errors.fulfillmentDate}
          />
        </Form.Group>
        <Form.Group controlId="remarksByProduction">
          <Form.Label>✏️ Remarks by Production</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("remarksByProduction")}
            onChange={(e) =>
              debouncedHandleInputChange("remarksByProduction", e.target.value)
            }
            isInvalid={!!errors.remarksByProduction}
          />
        </Form.Group>
        <Form.Group controlId="remarksByAccounts">
          <Form.Label>✏️ Remarks by Accounts</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("remarksByAccounts")}
            onChange={(e) =>
              debouncedHandleInputChange("remarksByAccounts", e.target.value)
            }
            isInvalid={!!errors.remarksByAccounts}
          />
        </Form.Group>
        <Form.Group controlId="remarksByBilling">
          <Form.Label>✏️ Remarks by Billing</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("remarksByBilling")}
            onChange={(e) =>
              debouncedHandleInputChange("remarksByBilling", e.target.value)
            }
            isInvalid={!!errors.remarksByBilling}
          />
        </Form.Group>
        <Form.Group controlId="verificationRemarks">
          <Form.Label>✏️ Verification Remarks</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("verificationRemarks")}
            onChange={(e) =>
              debouncedHandleInputChange("verificationRemarks", e.target.value)
            }
            isInvalid={!!errors.verificationRemarks}
          />
        </Form.Group>
        <Form.Group controlId="remarks">
          <Form.Label>✏️ Remarks</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            {...register("remarks")}
            onChange={(e) =>
              debouncedHandleInputChange("remarks", e.target.value)
            }
            isInvalid={!!errors.remarks}
          />
        </Form.Group>
      </FormSection>
    </Form>
  );

  const renderUpdateForm = () => (
    <Form onSubmit={handleSubmit(onUpdateSubmit)}>
      <FormSection>
        <Form.Group controlId="sostatus">
          <Form.Label>📊 SO Status</Form.Label>
          <Form.Select
            value={updateData.sostatus}
            onChange={handleUpdateInputChange}
            name="sostatus"
          >
            <option value="Pending for Approval">Pending for Approval</option>
            <option value="Order Cancelled">Order Cancel</option>
            <option value="Accounts Approved">Accounts Approved</option>
            <option value="Approved">Approved</option>
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="remarks">
          <Form.Label>✏️ Remarks</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={updateData.remarks}
            onChange={handleUpdateInputChange}
            name="remarks"
            maxLength={500}
            placeholder="Enter your remarks here..."
          />
          <Form.Text>{updateData.remarks.length}/500</Form.Text>
        </Form.Group>
      </FormSection>
    </Form>
  );

  return (
    <StyledModal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title className="text-center w-100 d-flex align-items-center justify-content-center">
          {view === "options" ? (
            <>
              <FaCog className="me-2" />
              Sales Order Management
            </>
          ) : view === "edit" ? (
            <>
              <FaEdit className="me-2" />
              Edit Entry
            </>
          ) : (
            <>
              <FaSyncAlt className="me-2" />
              Update Approvals
            </>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {view === "options" && renderOptions()}
        {view === "edit" && renderEditForm()}
        {view === "update" && renderUpdateForm()}
      </Modal.Body>

      <Modal.Footer>
        <StyledButton variant="danger" onClick={onClose} disabled={loading}>
          Close
        </StyledButton>
        {(view === "edit" || view === "update") &&
          (showConfirm ? (
            <>
              <StyledButton
                variant="warning"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancel
              </StyledButton>
              <StyledButton
                variant="success"
                onClick={
                  view === "edit" ? handleSubmit(onEditSubmit) : onUpdateSubmit
                }
                disabled={loading}
              >
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Confirm"
                )}
              </StyledButton>
            </>
          ) : (
            <StyledButton
              variant="primary"
              onClick={
                view === "edit" ? handleSubmit(onEditSubmit) : onUpdateSubmit
              }
              disabled={loading}
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : view === "edit" ? (
                "Save Changes"
              ) : (
                "Update"
              )}
            </StyledButton>
          ))}
      </Modal.Footer>
    </StyledModal>
  );
}

export default EditEntry;
