import React, { useState } from "react";
import "../App.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter your email and password.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_URL}/auth/login`,
        formData
      );

      if (response.status === 200) {
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("role", user.role);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          })
        );

        toast.success("Login successful! Redirecting...", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });

        onLogin({ token, userId: user.id, role: user.role });
      } else {
        toast.error("Something went wrong. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Error while logging in:", error);

      let friendlyMessage = "Unable to login. Please try again.";

      if (error.response) {
        const serverMsg = error.response.data?.message?.toLowerCase() || "";

        if (
          serverMsg.includes("invalid email") ||
          serverMsg.includes("user not found")
        ) {
          friendlyMessage = "We couldn't find an account with that email.";
        } else if (
          serverMsg.includes("incorrect password") ||
          serverMsg.includes("invalid password")
        ) {
          friendlyMessage = "The password you entered is incorrect.";
        } else if (serverMsg.includes("missing fields")) {
          friendlyMessage = "Please enter all required details.";
        } else {
          friendlyMessage = "Something went wrong. Please try again later.";
        }
      }

      toast.error(friendlyMessage, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      <div className="form-box">
        <form className="form" onSubmit={handleSubmit}>
          <h2 className="title">Login</h2>
          <p className="subtitle">Access your account.</p>

          <div className="form-inputs">
            <input
              autoComplete="off"
              style={{ backgroundColor: "white" }}
              className="input"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInput}
              required
              aria-label="Email Address"
            />
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ backgroundColor: "white", paddingRight: "80px" }}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInput}
                required
                aria-label="Password"
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "blue",
                  cursor: "pointer",
                }}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button1"
            disabled={loading}
            aria-label="Login"
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Login"}
          </button>
        </form>

        <div className="form-section">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
