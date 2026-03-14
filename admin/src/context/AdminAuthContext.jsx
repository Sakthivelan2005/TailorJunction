import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = "http://192.168.1.7:3001"; // Must match your Node.js backend IP
const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null,
  );
  const [adminId, setAdminId] = useState(
    localStorage.getItem("adminId") || null,
  );
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && adminId) {
      const newSocket = io(API_URL);
      newSocket.on("connect", () => {
        console.log("🟢 Admin Connected to Socket");
        // Join the global admin room for real-time alerts
        newSocket.emit("joinUserRoom", "ADMIN_ROOM");
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [token, adminId]);

  const login = (newToken, id) => {
    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("adminId", id);
    setToken(newToken);
    setAdminId(id);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    setToken(null);
    setAdminId(null);
    if (socket) socket.disconnect();
  };

  return (
    <AdminAuthContext.Provider
      value={{ token, adminId, socket, login, logout, API_URL }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
