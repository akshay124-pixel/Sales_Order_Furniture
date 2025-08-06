import { useState, useEffect } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordStrengthColor, setPasswordStrengthColor] = useState("");
  const navigate = useNavigate();

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found. Please log in.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_URL}/auth/verify-token`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Token verification:", response.data);
      } catch (error) {
        console.error("Token verification failed:", error);
        toast.error("Invalid or expired token. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        localStorage.clear();
        navigate("/login");
      }
    };
    verifyToken();
  }, [navigate]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({ ...prevForm, [name]: value }));

    if (name === "newPassword") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength.text);
      setPasswordStrengthColor(strength.color);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) return { text: "", color: "" };

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
      isLongEnough,
    ].filter(Boolean).length;

    if (score < 3) return { text: "Weak", color: "#ff4444" };
    if (score < 5) return { text: "Medium", color: "#ffaa00" };
    return { text: "Strong", color: "#00aa00" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmNewPassword
    ) {
      toast.error("Please fill in all fields.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast.error(
        "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        }
      );
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("New password and confirmation do not match.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from current password.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        navigate("/login");
        return;
      }

      console.log("Submitting with:", { token, formData }); // Debug log

      const response = await axios.post(
        `${process.env.REACT_APP_URL}/auth/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Password changed successfully! Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setTimeout(() => {
          localStorage.clear(); // Clear all localStorage
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Error while changing password:", error);
      console.log("Backend response:", error.response?.data);

      if (error.response?.status === 401) {
        toast.error("Current password is incorrect.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Invalid request data.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else if (error.response?.status === 404) {
        toast.error("User not found. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to change password. Please try again.",
          {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div className="form-box" style={{ width: "500px" }}>
        <form className="form" onSubmit={handleSubmit}>
          <h2 className="title">Change Password</h2>
          <p className="subtitle">Update your account password.</p>

          <div className="form-inputs">
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ backgroundColor: "white" }}
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                placeholder="Current Password"
                value={formData.currentPassword}
                onChange={handleInput}
                required
                aria-label="Current Password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "0",
                  zIndex: 1,
                }}
                aria-label={
                  showCurrentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ backgroundColor: "white" }}
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleInput}
                required
                aria-label="New Password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "0",
                  zIndex: 1,
                }}
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
            {formData.newPassword && (
              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: passwordStrengthColor,
                  fontWeight: "bold",
                }}
              >
                Password Strength: {passwordStrength}
              </div>
            )}
            {formData.newPassword && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#666",
                  backgroundColor: "#f8f9fa",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  Password Requirements:
                </div>
                <div
                  style={{
                    color: /[a-z]/.test(formData.newPassword)
                      ? "#28a745"
                      : "#dc3545",
                  }}
                >
                  {/[a-z]/.test(formData.newPassword) ? "✓" : "✗"} Lowercase
                  letter
                </div>
                <div
                  style={{
                    color: /[A-Z]/.test(formData.newPassword)
                      ? "#28a745"
                      : "#dc3545",
                  }}
                >
                  {/[A-Z]/.test(formData.newPassword) ? "✓" : "✗"} Uppercase
                  letter
                </div>
                <div
                  style={{
                    color: /\d/.test(formData.newPassword)
                      ? "#28a745"
                      : "#dc3545",
                  }}
                >
                  {/\d/.test(formData.newPassword) ? "✓" : "✗"} Number
                </div>
                <div
                  style={{
                    color: /[@$!%*?&]/.test(formData.newPassword)
                      ? "#28a745"
                      : "#dc3545",
                  }}
                >
                  {/[@$!%*?&]/.test(formData.newPassword) ? "✓" : "✗"} Special
                  character (@$!%*?&)
                </div>
                <div
                  style={{
                    color:
                      formData.newPassword.length >= 8 ? "#28a745" : "#dc3545",
                  }}
                >
                  {formData.newPassword.length >= 8 ? "✓" : "✗"} At least 8
                  characters
                </div>
              </div>
            )}
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ backgroundColor: "white" }}
                type={showConfirmPassword ? "text" : "password"}
                name="confirmNewPassword"
                placeholder="Confirm New Password"
                value={formData.confirmNewPassword}
                onChange={handleInput}
                required
                aria-label="Confirm New Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "0",
                  zIndex: 1,
                }}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button1"
            disabled={loading}
            aria-label="Change Password"
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Change Password"
            )}
          </button>
        </form>

        <div className="form-section">
          <p>
            Return to <Link to="/">Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
