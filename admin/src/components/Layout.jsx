import { CheckCircle, LayoutDashboard, LogOut, Scissors } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Layout({ children }) {
  const { logout } = useAdminAuth();
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    {
      path: "/verifications",
      icon: <CheckCircle size={20} />,
      label: "Tailor Verifications",
    },
    { path: "/dresses", icon: <Scissors size={20} />, label: "Dress Catalog" },
  ];

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          TailorJunction <span>Admin</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="main-area">
        <header className="header">Control Panel</header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
