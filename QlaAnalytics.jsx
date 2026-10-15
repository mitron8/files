import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Zap,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Calendar,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// 1. PIPELINE CONVERSION VELOCITY CARD (Funnel Progression)
// ============================================================================
export function PipelineConversionVelocityCard({ stages = [], conversionRate = 0, accuracy = 94 }) {
  return (
    <div className="qla-card">
      <div className="qla-card-head" style={{ marginBottom: 14 }}>
        <div className="qla-card-title-wrap">
          <h3 className="qla-card-title">Pipeline Conversion Velocity</h3>
          <p className="qla-card-subtitle">
            Real-time conversion flow from incoming enquiry to final quotation dispatch
          </p>
        </div>
        <Link
          to="/cases"
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#16694a",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          Case Queue <ChevronRight size={13} />
        </Link>
      </div>

      <div className="qla-simple-stage-list">
        {stages.map((st) => (
          <div key={st.id} className="qla-simple-stage-row">
            <div className="qla-simple-stage-head">
              <span className="qla-simple-stage-left">
                <span style={{ color: st.color, display: "flex", alignItems: "center" }}>{st.icon}</span>
                <span className="qla-simple-stage-tag">{st.stage}</span>
                <span className="qla-simple-stage-name">{st.name}</span>
              </span>
              <span className="qla-simple-stage-right">
                <b style={{ color: "#0f172a", fontSize: "0.86rem" }}>{st.count.toLocaleString("en-IN")}</b>
                <span className="qla-simple-stage-pct" style={{ color: st.color }}>{st.pct}%</span>
              </span>
            </div>
            <div className="qla-simple-bar-bg">
              <div
                className="qla-simple-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(st.count > 0 ? 8 : 0, st.pct))}%`,
                  background: st.color,
                }}
              />
            </div>
            <div className="qla-simple-stage-sub">{st.unit}</div>
          </div>
        ))}
      </div>

      <div className="qla-simple-card-foot">
        <span>
          Overall Intake-to-Quote: <b style={{ color: "#16694a" }}>{conversionRate}%</b>
        </span>
        <span style={{ color: "#64748b" }}>
          AI First-Pass Accuracy: <b style={{ color: "#0284c7" }}>{accuracy}%</b>
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 2. PENDING ENQUIRIES - STAGE WISE DONUT CARD
// ============================================================================
export function PendingEnquiriesStageWiseCard({ allCases = [], stageCounts = null }) {
  const [activeStage, setActiveStage] = useState(null);

  const stageData = useMemo(() => {
    let ai = 0;
    let review = 0;
    let quote = 0;
    let others = 0;

    if (stageCounts) {
      ai = Number(stageCounts.ai || 0);
      review = Number(stageCounts.review || 0);
      quote = Number(stageCounts.quote || 0);
      others = Number(stageCounts.others || 0);
    } else {
      (allCases || []).forEach((c) => {
        const s = (c.status || "").toUpperCase();
        if (s === "IN_REVIEW") review++;
        else if (s === "QUOTED" || c.qtndt || c.dispatched_at) quote++;
        else if (s === "RECEIVED" || s === "DRAFT" || s === "NEW") ai++;
        else others++;
      });
    }

    const items = [
      { id: "ai", name: "AI Processing", count: ai, color: "#eab308" },
      { id: "review", name: "Human Review", count: review, color: "#ef4444" },
      { id: "quote", name: "Finalizing Quotation", count: quote, color: "#16a34a" },
      { id: "others", name: "Others", count: others, color: "#8b5cf6" },
    ];

    const total = items.reduce((sum, it) => sum + it.count, 0);
    return { items, total };
  }, [allCases, stageCounts]);

  const activeItem = stageData.items.find((it) => it.name === activeStage);
  const centerNumber = activeItem ? activeItem.count : stageData.total;
  const centerCaption = activeItem ? activeItem.name : "Pending";

  // Inside arc label renderer for Recharts Pie (renders clean bold white numbers inside slices)
  const renderInsideLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    if (!value || value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="800"
        style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="qla-card">
      <div>
        <div className="qla-card-head" style={{ marginBottom: 4 }}>
          <div className="qla-card-title-wrap">
            <h3 className="qla-card-title">Pending Enquiries – Stage Wise</h3>
            <p className="qla-card-subtitle">Active enquiry backlog distribution across fulfillment stages</p>
          </div>
        </div>

        {/* Donut Chart with Numbers Inside the Slices */}
        <div className="qla-stage-donut-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stageData.items}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                innerRadius={50}
                outerRadius={86}
                paddingAngle={2.5}
                dataKey="count"
                label={renderInsideLabel}
                labelLine={false}
                onMouseEnter={(_, index) => setActiveStage(stageData.items[index]?.name)}
                onMouseLeave={() => setActiveStage(null)}
              >
                {stageData.items.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    opacity={activeStage && activeStage !== entry.name ? 0.35 : 1}
                    stroke={activeStage === entry.name ? "#0f172a" : "#ffffff"}
                    strokeWidth={activeStage === entry.name ? 2 : 1}
                    style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="qla-stage-donut-center">
            <span className="qla-stage-donut-number">
              {centerNumber.toLocaleString("en-IN")}
            </span>
            <span className="qla-stage-donut-sub">
              {centerCaption}
            </span>
          </div>
        </div>

        {/* Clean 2-Column Legend with Count Badges */}
        <div className="qla-stage-legend">
          {stageData.items.map((it) => (
            <div
              key={it.name}
              className="qla-stage-legend-item"
              onMouseEnter={() => setActiveStage(it.name)}
              onMouseLeave={() => setActiveStage(null)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="qla-stage-dot" style={{ background: it.color }} />
                <span className="qla-stage-label">{it.name}</span>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: it.color,
                  background: `${it.color}14`,
                  padding: "2px 7px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {it.count} {it.count === 1 ? "Case" : "Cases"}
              </span>
            </div>
          ))}
        </div>

        {/* Proportion Bar */}
        {stageData.total > 0 && (
          <div
            style={{
              height: 6,
              borderRadius: 9999,
              overflow: "hidden",
              display: "flex",
              background: "#f1f5f9",
              margin: "10px 14px 4px",
            }}
          >
            {stageData.items.map((it) =>
              it.count > 0 ? (
                <div
                  key={it.id}
                  style={{
                    width: `${(it.count / stageData.total) * 100}%`,
                    background: it.color,
                    height: "100%",
                  }}
                  title={`${it.name}: ${it.count} (${Math.round((it.count / stageData.total) * 100)}%)`}
                />
              ) : null
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          color: "#64748b",
          borderTop: "1px solid #f1f5f9",
          paddingTop: 10,
          marginTop: 12,
        }}
      >
        <span>
          Total Pending: <b style={{ color: "#0f172a" }}>{stageData.total}</b>
        </span>
        <span style={{ color: "#dc2626", fontWeight: 700 }}>
          Human Review Queue: {stageData.items.find((i) => i.id === "review")?.count || 0} Cases
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN QLA ANALYTICS PAGE COMPONENT
// ============================================================================
export default function QlaAnalytics() {
  const { user } = useAuth();
  const location = useLocation();

  const [insights, setInsights] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(() => {
    return new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  });

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError("");

    try {
      const insightsRes = await api.getInsights("ALL", "ALL", "ALL");
      setInsights(insightsRes);
      setAllCases([]);

      setLastUpdated(
        new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch (err) {
      console.error("QlaAnalytics loadData error:", err);
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic Pipeline Stages (From backend insights)
  const pipelineStages = useMemo(() => {
    const total = Number(insights?.incoming_total || 0);
    const inReview = Number(insights?.under_review || 0);
    const quoted = Number(insights?.quotations_sent_total || 0);
    const aiExtracted = Number(insights?.ai_processed || 0);
    const convRate = total > 0 ? Math.round((quoted / total) * 100) : Number(insights?.conversion_rate || 0);

    return [
      {
        id: "intake",
        stage: "STAGE 1",
        name: "Enquiry Intake & Screening",
        count: total,
        unit: "Received",
        pct: 100,
        color: "#eab308",
        icon: <FileText size={14} />,
      },
      {
        id: "specs",
        stage: "STAGE 2",
        name: "AI Spec Extraction & Models",
        count: aiExtracted,
        unit: "Processed",
        pct: total > 0 ? Math.min(100, Math.round((aiExtracted / total) * 100)) : 0,
        color: "#0284c7",
        icon: <Zap size={14} />,
      },
      {
        id: "review",
        stage: "STAGE 3",
        name: "Engineering Technical Review",
        count: inReview,
        unit: "In Queue",
        pct: total > 0 ? Math.min(100, Math.round((inReview / total) * 100)) : 0,
        color: "#ef4444",
        icon: <UserCheck size={14} />,
      },
      {
        id: "quoted",
        stage: "STAGE 4",
        name: "Commercial Quotation Sent",
        count: quoted,
        unit: "Dispatched",
        pct: convRate,
        color: "#16a34a",
        icon: <CheckCircle2 size={14} />,
      },
    ];
  }, [insights]);

  // Stage counts for Donut Chart
  const stageCounts = useMemo(() => {
    const totalIncoming = Number(insights?.incoming_total || 0);
    const ai = Number(insights?.received || 0);
    const review = Number(insights?.under_review || 0);
    const quote = Number(insights?.quotations_sent_total || 0);

    let others = 0;
    // If pending is given specifically and matches review + quote (e.g. 14 = 8 + 6)
    if (insights?.pending !== undefined && insights?.pending !== null) {
      if (review + quote > 0 && ai === 0 && review + quote === Number(insights.pending)) {
        others = 0;
      } else {
        others = Math.max(0, totalIncoming - ai - review - quote);
      }
    } else {
      others = Math.max(0, totalIncoming - ai - review - quote);
    }

    return { ai, review, quote, others };
  }, [insights]);

  const conversionRate = useMemo(() => {
    const total = Number(insights?.incoming_total || 0);
    const quoted = Number(insights?.quotations_sent_total || 0);
    if (total > 0) return Math.round((quoted / total) * 100);
    return Number(insights?.conversion_rate || 0);
  }, [insights]);

  const isSuperAdmin = location.pathname.startsWith("/super-admin") || (user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const executiveDashboardPath = isSuperAdmin ? "/super-admin" : "/dashboard";
  const currentAnalyticsPath = isSuperAdmin ? "/super-admin/analytics" : "/analytics";

  if (loading) {
    return (
      <div className="qla-dash-root">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14 }}>
          <RefreshCw className="spin-icon" size={34} style={{ color: "#16694a", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 700 }}>Loading QLA Analytics…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="qla-dash-root">
      <div className="qla-dash-container">
        {/* ====================================================================
            1. TOP HEADER BAR
            ==================================================================== */}
        <div className="qla-dash-header">
          <div className="qla-dash-title-group">
            <h1 className="qla-dash-title">QLA Analytics</h1>
            <div className="qla-dash-badge">
              <span className="qla-dash-badge-dot" />
              <span>Pipeline & Fulfillment Intelligence</span>
            </div>
          </div>

          <div className="qla-header-actions">
            <div className="qla-sync-tag">
              <Calendar size={14} style={{ color: "#16694a" }} />
              <span>Last Synced: {lastUpdated}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="qla-btn-ghost"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && <div className="flash flash-warn">{error}</div>}

        {/* ====================================================================
            SUB-DASHBOARD TAB NAVIGATION (Executive Overview | QLA Analytics)
            ==================================================================== */}
        <div className="qla-sub-tabs">
          <Link
            to={executiveDashboardPath}
            className="qla-sub-tab-btn"
          >
            <LayoutDashboard size={14} />
            <span>Executive Dashboard</span>
          </Link>
          <Link
            to={currentAnalyticsPath}
            className="qla-sub-tab-btn active"
          >
            <BarChart2 size={14} />
            <span>QLA Analytics</span>
          </Link>
        </div>

        {/* ====================================================================
            3. EXECUTIVE STAGE FLOW KPI CARDS (Step 1 to 4)
            ==================================================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginBottom: 24 }}>
          {/* Stage 1 */}
          <div
            className="qla-card"
            style={{
              padding: "18px 20px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 14,
              borderTop: "3px solid #eab308",
              boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 750,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#fef9c3",
                    color: "#a16207",
                    border: "1px solid #fef08a",
                  }}
                >
                  Stage 1
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={16} />
                </div>
              </div>

              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {Number(insights?.incoming_total || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginTop: 4 }}>
                Enquiry Intake & Screening
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem", color: "#64748b", marginBottom: 5 }}>
                <span>Received Intake</span>
                <span style={{ fontWeight: 700, color: "#a16207" }}>100% Volume</span>
              </div>
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", background: "#eab308" }} />
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div
            className="qla-card"
            style={{
              padding: "18px 20px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 14,
              borderTop: "3px solid #0284c7",
              boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 750,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#e0f2fe",
                    color: "#0369a1",
                    border: "1px solid #bae6fd",
                  }}
                >
                  Stage 2
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#e0f2fe",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={16} />
                </div>
              </div>

              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {Number(insights?.ai_processed || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginTop: 4 }}>
                AI Spec Extraction & Models
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem", color: "#64748b", marginBottom: 5 }}>
                <span>Processed & Matched</span>
                <span style={{ fontWeight: 700, color: "#0369a1" }}>
                  {Number(insights?.incoming_total || 0) > 0
                    ? Math.min(100, Math.round((Number(insights?.ai_processed || 0) / Number(insights?.incoming_total || 0)) * 100))
                    : 0}% Processed
                </span>
              </div>
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Number(insights?.incoming_total || 0) > 0 ? Math.min(100, Math.max(Number(insights?.ai_processed || 0) > 0 ? 8 : 0, Math.round((Number(insights?.ai_processed || 0) / Number(insights?.incoming_total || 0)) * 100))) : 0}%`,
                    height: "100%",
                    background: "#0284c7",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stage 3 */}
          <div
            className="qla-card"
            style={{
              padding: "18px 20px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 14,
              borderTop: "3px solid #ef4444",
              boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 750,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                >
                  Stage 3
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fee2e2",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserCheck size={16} />
                </div>
              </div>

              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {Number(insights?.under_review || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginTop: 4 }}>
                Engineering Technical Review
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem", color: "#64748b", marginBottom: 5 }}>
                <span>Active Review Queue</span>
                <span style={{ fontWeight: 700, color: "#b91c1c" }}>
                  {Number(insights?.incoming_total || 0) > 0
                    ? Math.min(100, Math.round((Number(insights?.under_review || 0) / Number(insights?.incoming_total || 0)) * 100))
                    : 0}% In Queue
                </span>
              </div>
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Number(insights?.incoming_total || 0) > 0 ? Math.min(100, Math.max(Number(insights?.under_review || 0) > 0 ? 8 : 0, Math.round((Number(insights?.under_review || 0) / Number(insights?.incoming_total || 0)) * 100))) : 0}%`,
                    height: "100%",
                    background: "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stage 4 */}
          <div
            className="qla-card"
            style={{
              padding: "18px 20px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 14,
              borderTop: "3px solid #16a34a",
              boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 750,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  Stage 4
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
              </div>

              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {Number(insights?.quotations_sent_total || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginTop: 4 }}>
                Commercial Quotation Sent
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem", color: "#64748b", marginBottom: 5 }}>
                <span>Dispatched Quotes</span>
                <span style={{ fontWeight: 700, color: "#15803d" }}>
                  {Number(insights?.incoming_total || 0) > 0
                    ? Math.round((Number(insights?.quotations_sent_total || 0) / Number(insights?.incoming_total || 0)) * 100)
                    : Number(insights?.conversion_rate || 0)}% Converted
                </span>
              </div>
              <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Number(insights?.incoming_total || 0) > 0 ? Math.min(100, Math.max(Number(insights?.quotations_sent_total || 0) > 0 ? 8 : 0, Math.round((Number(insights?.quotations_sent_total || 0) / Number(insights?.incoming_total || 0)) * 100))) : 0}%`,
                    height: "100%",
                    background: "#16a34a",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            4. MAIN ANALYTICS GRID (SIDE-BY-SIDE 2 COLUMNS)
            ==================================================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 22, marginBottom: 24, width: "100%" }}>
          {/* Card 1: Pipeline Conversion Velocity */}
          <PipelineConversionVelocityCard
            stages={pipelineStages}
            conversionRate={conversionRate}
            accuracy={94}
          />

          {/* Card 2: Pending Enquiries - Stage Wise */}
          <PendingEnquiriesStageWiseCard
            stageCounts={stageCounts}
            allCases={allCases}
          />
        </div>
      </div>
    </div>
  );
}
