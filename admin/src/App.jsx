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
  return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
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
