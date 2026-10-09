import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
 
  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <a className="brand topbar-brand" href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/techtrol-logo.png"
          alt="Pune Techtrol"
          style={{ height: 28, width: "auto", objectFit: "contain", background: "#fff", padding: "2px 6px", borderRadius: 4 }}
        />
        <span>QLA Admin</span>
      </a>
      <nav className="topnav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Review Queue
        </NavLink>
        <NavLink to="/cases" className={({ isActive }) => (isActive ? "active" : "")}>
          All Cases
        </NavLink>
        {user.role === "ADMIN" && (
          <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
            Users
          </NavLink>
        )}
      </nav>
      <div className="topbar-right">
        <span className="user-chip">{user.display_name} · {user.role}</span>
        <button
          className="logout-btn"
          onClick={() => setShowPasswordModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
          title="Change Password"
        >
          <KeyRound size={13} />
          Change Password
        </button>
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </div>
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userName={user.display_name}
      />
    </header>
  );
}