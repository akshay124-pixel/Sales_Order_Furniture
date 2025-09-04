import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Sales from "./components/Sales";
import ChangePassword from "./Auth/ChangePassword";
import Production from "./components/Production";
import Finish from "./components/Finish";
import Login from "./Auth/Login";
import SignUp from "./Auth/SignUp";
import Navbar from "./components/Navbar";
import Installation from "./components/installation";
import Accounts from "./components/Accounts";
import Verification from "./components/Verification";
import Bill from "./components/BillGeneration";
import ProductionApproval from "./components/ProductionApproval";

const ConditionalNavbar = ({ isAuthenticated, onLogout, userRole }) => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/change-password";

  return !isAuthPage && isAuthenticated ? (
    <Navbar
      isAuthenticated={isAuthenticated}
      onLogout={onLogout}
      userRole={userRole}
    />
  ) : null;
};

const PrivateRoute = ({ element, isAuthenticated, allowedRoles }) => {
  const userRole = localStorage.getItem("role");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (
      userRole === "Sales" ||
      userRole === "Admin" ||
      userRole === "SuperAdmin"
    ) {
      return <Navigate to="/sales" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return element;
};

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = ({ token, userId, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("role", role);
    setIsAuthenticated(true);
    navigate("/"); // This triggers immediate correct page load!
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    navigate("/login");
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      (location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/signup")
    ) {
      const role = localStorage.getItem("role");
      switch (role) {
        case "Production":
          navigate("/production");
          break;
        case "Finish":
          navigate("/finish");
          break;
        case "Installation":
          navigate("/installation");
          break;
        case "Accounts":
          navigate("/accounts");
          break;
        case "Verification":
          navigate("/verification");
          break;
        case "Bill":
          navigate("/bill");
          break;
        case "ProductionApproval":
          navigate("/production-approval");
          break;
        case "Sales":
        case "SuperAdmin":
        case "Admin":
          navigate("/sales");
          break;
        default:
          navigate("/login");
      }
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return (
    <>
      <ConditionalNavbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        userRole={localStorage.getItem("role")}
      />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/change-password"
          element={
            <PrivateRoute
              element={<ChangePassword />}
              isAuthenticated={isAuthenticated}
              allowedRoles={[
                "Production",
                "Finish",
                "Installation",
                "Accounts",
                "Verification",
                "Bill",
                "ProductionApproval",
                "Sales", // Added Sales
                "Admin", // Added Admin
                "SuperAdmin", // Added SuperAdmin
              ]}
            />
          }
        />

        <Route
          path="/sales"
          element={
            <PrivateRoute
              element={<Sales />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Sales", "Admin", "SuperAdmin"]}
            />
          }
        />
        <Route
          path="/production"
          element={
            <PrivateRoute
              element={<Production />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Production"]}
            />
          }
        />
        <Route
          path="/finish"
          element={
            <PrivateRoute
              element={<Finish />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Finish"]}
            />
          }
        />
        <Route
          path="/installation"
          element={
            <PrivateRoute
              element={<Installation />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Installation"]}
            />
          }
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute
              element={<Accounts />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Accounts"]}
            />
          }
        />
        <Route
          path="/verification"
          element={
            <PrivateRoute
              element={<Verification />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Verification"]}
            />
          }
        />
        <Route
          path="/bill"
          element={
            <PrivateRoute
              element={<Bill />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["Bill"]}
            />
          }
        />
        <Route
          path="/production-approval"
          element={
            <PrivateRoute
              element={<ProductionApproval />}
              isAuthenticated={isAuthenticated}
              allowedRoles={["ProductionApproval"]}
            />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  localStorage.getItem("role") === "Production"
                    ? "/production"
                    : localStorage.getItem("role") === "Finish"
                    ? "/finish"
                    : localStorage.getItem("role") === "Installation"
                    ? "/installation"
                    : localStorage.getItem("role") === "Accounts"
                    ? "/accounts"
                    : localStorage.getItem("role") === "Verification"
                    ? "/verification"
                    : localStorage.getItem("role") === "Bill"
                    ? "/bill"
                    : localStorage.getItem("role") === "ProductionApproval"
                    ? "/production-approval"
                    : "/sales"
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
