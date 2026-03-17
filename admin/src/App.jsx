import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import Dashboard from "./pages/Dashboard";
import DressManagement from "./pages/DressManagement";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TailorVerification from "./pages/TailorVerification";

const ProtectedRoute = ({ children }) => {
  const { token } = useAdminAuth();

  // Strict check: Prevents the "null" or "undefined" string bug from bypassing security
  const isAuthenticated = token && token !== "null" && token !== "undefined";

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// PUBLIC ROUTE
// Prevents admins who are ALREADY logged in from seeing the Login/Signup pages
const PublicRoute = ({ children }) => {
  const { token } = useAdminAuth();
  const isAuthenticated = token && token !== "null" && token !== "undefined";

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Wrap public pages in the PublicRoute */}
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/verifications" element={<TailorVerification />} />
                <Route path="/dresses" element={<DressManagement />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
