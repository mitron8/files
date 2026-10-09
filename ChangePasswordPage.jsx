import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Lock,
  User,
  Check,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password validation
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page change-password-page" style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "#64748b",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            marginBottom: 12,
            transition: "color 0.15s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand, #16694a)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="catalog-title-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Change Password</h1>
          <span className="catalog-badge" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <KeyRound size={13} />
            Security & Authentication
          </span>
        </div>
        <p className="page-sub" style={{ marginTop: 4 }}>
          Update your login password. Enter your existing password to verify identity, then create a new secure password.
        </p>
      </div>

      {/* Account Info Pill */}
      {user && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #16694a 0%, #15803d 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1rem"
              }}
            >
              {user.display_name?.charAt(0).toUpperCase() || <User size={18} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#0f172a" }}>
                {user.display_name || user.email}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {user.email || "Current User"}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 20,
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #e2e8f0",
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}
          >
            {user.role || "User"}
          </span>
        </div>
      )}

      {/* Status Banners */}
      {success && (
        <div
          className="flash flash-success"
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderRadius: 8,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534"
          }}
        >
          <CheckCircle2 size={18} />
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{success}</span>
        </div>
      )}

      {error && (
        <div
          className="flash flash-error"
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b"
          }}
        >
          <AlertCircle size={18} />
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div
        className="admin-settings-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px -2px rgba(0,0,0,0.05)"
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 6
              }}
            >
              Current Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.9rem",
                  padding: "9px 40px 9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1"
                }}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your existing password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
                title={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>
              Required to confirm ownership of this account.
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "20px 0" }} />

          {/* New Password */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 6
              }}
            >
              New Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.9rem",
                  padding: "9px 40px 9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1"
                }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 6
              }}
            >
              Confirm New Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.9rem",
                  padding: "9px 40px 9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1"
                }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: passwordsMatch ? "#16a34a" : "#dc2626",
                  fontWeight: 500
                }}
              >
                {passwordsMatch ? (
                  <>
                    <Check size={14} /> Passwords match
                  </>
                ) : (
                  <>
                    <X size={14} /> Passwords do not match
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center", marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              style={{
                padding: "9px 18px",
                fontSize: "0.875rem",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch}
              style={{
                padding: "9px 22px",
                fontSize: "0.875rem",
                borderRadius: 8,
                background: "var(--brand, #16694a)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: loading || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch ? 0.6 : 1
              }}
            >
              <KeyRound size={16} />
              <span>{loading ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
