import { useState, useEffect } from "react";
import { X, Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { api } from "../api/client";

export default function ChangePasswordModal({ isOpen, onClose, userName }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const newPwd = newPassword.trim();
    const confirmPwd = confirmPassword.trim();

    if (!newPwd) {
      setError("Please enter a new password.");
      return;
    }

    if (newPwd.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPwd !== confirmPwd) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({
        current_password: currentPassword ? currentPassword.trim() : undefined,
        new_password: newPwd,
      });

      setSuccess("Password changed successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change password. Please check your current password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: "92%",
          padding: 0,
          borderRadius: 16,
          boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d4a33 0%, #16694a 100%)",
            color: "white",
            padding: "20px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KeyRound size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                Change Password
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.78)" }}>
                {userName ? `Account: ${userName}` : "Update your security credentials"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "none",
              color: "white",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: "0.82rem",
                color: "#b91c1c",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: "0.82rem",
                color: "#16694a",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.80rem",
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                }}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: "0.70rem", color: "#64748b", marginTop: 4, display: "block" }}>
              Leave blank if setting your password for the first time.
            </span>
          </div>

          {/* New Password Field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.80rem",
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              New Password <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                }}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.80rem",
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Confirm New Password <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="input"
                style={{
                  width: "100%",
                  paddingRight: 40,
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                }}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <span style={{ fontSize: "0.72rem", color: "#b91c1c", marginTop: 4, display: "block" }}>
                Passwords do not match.
              </span>
            )}
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <span style={{ fontSize: "0.72rem", color: "#16694a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={13} /> Passwords match.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ fontSize: "0.84rem", padding: "8px 16px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              style={{
                fontSize: "0.84rem",
                padding: "8px 18px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#16694a",
                borderColor: "#16694a",
              }}
            >
              <Lock size={14} />
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
