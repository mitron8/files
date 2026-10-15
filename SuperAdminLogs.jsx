import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, CheckCircle2, Clock3, Download, PenLine, RefreshCw, Sparkles } from "lucide-react";
import { api } from "../api/client";

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function monthStart() {
  const date = new Date();
  return isoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayLabel(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function SuperAdminLogs() {
  const [dateFrom, setDateFrom] = useState(() => shiftDays(-6));
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (from, to) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.activityLogs(from, to);
      setReport(data);
      setDateFrom(data.date_from || from);
      setDateTo(data.date_to || to);
    } catch (err) {
      setError(err.message || "Could not load activity logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(dateFrom, dateTo);
    // The first range is the initial last-7-days view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const days = report?.days || [];
  const loginRows = report?.login || [];
  const aiRows = report?.ai || [];
  const corrections = report?.corrections || [];
  const decisions = report?.decisions || [];
  const decisionUsers = report?.decision_users || [];
  const activeUsers = useMemo(
    () => loginRows.filter((row) => row.total_seconds > 0 || row.sign_ins > 0).length,
    [loginRows]
  );

  function applyRange(event) {
    event.preventDefault();
    load(dateFrom, dateTo);
  }

  function usePreset(from, to) {
    setDateFrom(from);
    setDateTo(to);
    load(from, to);
  }

  async function exportLogs(scope) {
    setExporting(scope);
    setError("");
    try {
      await api.downloadActivityLogs(dateFrom, dateTo, scope);
    } catch (err) {
      setError(err.message || "Could not export the logs");
    } finally {
      setExporting("");
    }
  }

  return (
    <div className="page activity-page">
      <div className="activity-head">
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-sub">
            Sign-in time, AI runs, approvals, rejections, and model numbers corrected after an AI suggestion.
            Days follow India time.
          </p>
        </div>
        <div className="activity-actions">
          <button
            type="button"
            className="activity-refresh"
            onClick={() => exportLogs("filtered")}
            disabled={loading || Boolean(exporting)}
          >
            <Download size={14} />
            <span>{exporting === "filtered" ? "Exporting…" : "Export filtered"}</span>
          </button>
          <button
            type="button"
            className="activity-refresh"
            onClick={() => exportLogs("all")}
            disabled={loading || Boolean(exporting)}
          >
            <Download size={14} />
            <span>{exporting === "all" ? "Exporting…" : "Export all"}</span>
          </button>
          <button
            type="button"
            className="activity-refresh"
            onClick={() => load(dateFrom, dateTo)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <form className="activity-filters" onSubmit={applyRange}>
        <label>
          <CalendarRange size={14} />
          <span>From</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <button type="submit" className="activity-apply">Apply</button>
        <div className="activity-presets">
          <button type="button" onClick={() => usePreset(isoDate(new Date()), isoDate(new Date()))}>Today</button>
          <button type="button" onClick={() => usePreset(shiftDays(-6), isoDate(new Date()))}>Last 7 days</button>
          <button type="button" onClick={() => usePreset(monthStart(), isoDate(new Date()))}>This month</button>
        </div>
      </form>

      {error && <div className="flash flash-error">{error}</div>}

      <div className="activity-kpis">
        <div>
          <span>Users with activity</span>
          <strong>{activeUsers}</strong>
        </div>
        <div>
          <span>Time online</span>
          <strong>{formatDuration(report?.login_total_seconds || 0)}</strong>
        </div>
        <div>
          <span>AI runs</span>
          <strong>{Number(report?.ai_total_runs || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>Approved</span>
          <strong>{Number(report?.approved_total || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>Rejected</span>
          <strong>{Number(report?.rejected_total || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>Model corrections</span>
          <strong>{Number(report?.correction_total || 0).toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <section className="activity-card">
        <div className="activity-card-title">
          <Clock3 size={16} />
          <h2>Time logged in</h2>
        </div>
        <p>Admin accounts are left out. Time runs from sign-in until logout, or until the session goes quiet.</p>
        {loading && !report ? (
          <div className="activity-empty">Loading logs…</div>
        ) : loginRows.length === 0 ? (
          <div className="activity-empty">No users outside the admin role.</div>
        ) : (
          <div className="activity-table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total</th>
                  {/* <th>Sign-ins</th> */}
                  {days.map((day) => <th key={day}>{dayLabel(day)}</th>)}
                </tr>
              </thead>
              <tbody>
                {loginRows.map((row) => (
                  <tr key={row.user_id}>
                    <td>
                      <div className="activity-user">{row.display_name}</div>
                      <div className="activity-meta">{row.role} · {row.email}</div>
                    </td>
                    <td className="activity-strong">{formatDuration(row.total_seconds)}</td>
                    {/* <td>{row.sign_ins}</td> */}
                    {row.days.map((day) => (
                      <td key={day.date} className={day.seconds || day.sign_ins ? "" : "activity-muted"}>
                        <div>{formatDuration(day.seconds)}</div>
                        {/* {day.sign_ins > 0 && <div className="activity-meta">{day.sign_ins} sign-in{day.sign_ins === 1 ? "" : "s"}</div>} */}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="activity-card">
        <div className="activity-card-title">
          <Sparkles size={16} />
          <h2>AI runs</h2>
        </div>
        <p>Each Run AI press is counted. A bulk run counts once for every case in that batch.</p>
        {loading && !report ? (
          <div className="activity-empty">Loading logs…</div>
        ) : aiRows.length === 0 ? (
          <div className="activity-empty">No AI runs in this date range.</div>
        ) : (
          <div className="activity-table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total</th>
                  {days.map((day) => <th key={day}>{dayLabel(day)}</th>)}
                </tr>
              </thead>
              <tbody>
                {aiRows.map((row) => (
                  <tr key={row.user_id}>
                    <td>
                      <div className="activity-user">{row.display_name}</div>
                      <div className="activity-meta">{row.role} · {row.email}</div>
                    </td>
                    <td className="activity-strong">{row.total_runs}</td>
                    {row.days.map((day) => (
                      <td key={day.date} className={day.runs ? "" : "activity-muted"}>{day.runs || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>All users</td>
                  <td>{report?.ai_total_runs || 0}</td>
                  {days.map((day) => {
                    const runs = aiRows.reduce((sum, row) => {
                      const match = row.days.find((item) => item.date === day);
                      return sum + (match?.runs || 0);
                    }, 0);
                    return <td key={day}>{runs || "—"}</td>;
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="activity-card">
        <div className="activity-card-title">
          <CheckCircle2 size={16} />
          <h2>Approvals and rejections</h2>
        </div>
        <p>
          Each Approve or Reject click is counted, with the inquiry number and the model.
          Decisions made before this log started use the day the suggestion was saved.
        </p>
        {loading && !report ? (
          <div className="activity-empty">Loading logs…</div>
        ) : decisions.length === 0 ? (
          <div className="activity-empty">No approvals or rejections in this date range.</div>
        ) : (
          <>
            <div className="activity-table-scroll">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Approved</th>
                    <th>Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionUsers.map((row) => (
                    <tr key={row.user_id}>
                      <td>
                        <div className="activity-user">{row.display_name}</div>
                        <div className="activity-meta">{row.role} · {row.email}</div>
                      </td>
                      <td className="activity-strong">{row.approved}</td>
                      <td className="activity-rejected">{row.rejected}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>All users</td>
                    <td>{report?.approved_total || 0}</td>
                    <td>{report?.rejected_total || 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="activity-table-scroll activity-decision-list">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Inquiry number</th>
                    <th>Model</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((row) => (
                    <tr key={row.decision_id}>
                      <td>{formatWhen(row.created_at)}</td>
                      <td>
                        <div className="activity-user">{row.display_name}</div>
                        <div className="activity-meta">{row.email}</div>
                      </td>
                      <td className="activity-strong">{row.inquiry_no}</td>
                      <td>{row.model_code || "—"}</td>
                      <td className={row.action === "APPROVED" ? "activity-strong" : "activity-rejected"}>
                        {row.action === "APPROVED" ? "Approved" : "Rejected"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="activity-card">
        <div className="activity-card-title">
          <PenLine size={16} />
          <h2>Model corrections</h2>
        </div>
        <p>Saved when a suggested product is given a different model number after AI has run. The inquiry number and the corrected model number are both kept.</p>
        {loading && !report ? (
          <div className="activity-empty">Loading logs…</div>
        ) : corrections.length === 0 ? (
          <div className="activity-empty">No model corrections in this date range.</div>
        ) : (
          <div className="activity-table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Inquiry number</th>
                  <th>Suggested model</th>
                  <th>Correct model</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((row) => (
                  <tr key={row.correction_id}>
                    <td>{formatWhen(row.created_at)}</td>
                    <td>
                      <div className="activity-user">{row.display_name}</div>
                      <div className="activity-meta">{row.email}</div>
                    </td>
                    <td className="activity-strong">{row.inquiry_no}</td>
                    <td>{row.suggested_model || "—"}</td>
                    <td className="activity-strong">{row.correct_model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
