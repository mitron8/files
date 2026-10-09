import { useState, useMemo } from "react";
import { Plus, Trash2, Maximize2, Minimize2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileText, X } from "lucide-react";
import { api } from "../api/client";

function SpecTable({ line }) {
  const rows = Array.isArray(line?.spec_rows) ? line.spec_rows : [];
  if (!rows.length) return null;
  return (
    <div className="qgm-spec-table-box">
      <div className="qgm-spec-title">Technical Specifications</div>
      <table className="qgm-spec-table">
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.label}:${row.value}:${idx}`}>
              <td className="qgm-spec-label">{row.label} :</td>
              <td className="qgm-spec-value">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function GenerateQuotationModal({ caseId, lines: initialLines, onClose, onGenerated }) {
  const [lines, setLines] = useState(() =>
    (initialLines || []).map((l) => ({
      ...l,
      _unitPrice: (l._unitPrice != null && l._unitPrice !== "") ? String(l._unitPrice) : (l.unit_price != null ? String(l.unit_price) : ""),
      customer_tag_no: l.customer_tag_no || "",
      technical_spec_text: l.technical_spec_text || (Array.isArray(l.spec_rows) && l.spec_rows.length ? l.spec_rows.map((r) => `${r.label}: ${r.value}`).join(", ") : ""),
    }))
  );
  const [discountPct, setDiscountPct] = useState("");
  const [taxPct, setTaxPct] = useState("");
  const [freightAmount, setFreightAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const COLLAPSED_LIMIT = 4;
  const hasManyItems = lines.length > COLLAPSED_LIMIT;
  const visibleLines = (hasManyItems && !isExpanded) ? lines.slice(0, COLLAPSED_LIMIT) : lines;

  const unpricedCount = lines.filter((l) => !l._unitPrice || parseFloat(l._unitPrice) <= 0).length;
  const hasAllPrices = lines.length > 0 && unpricedCount === 0;

  function updateLineField(lineItemId, field, value) {
    setLines(lines.map((l) => (l.line_item_id === lineItemId ? { ...l, [field]: value } : l)));
  }

  function handleAddNewItem() {
    const newItemId = `custom_${Date.now()}`;
    const nextLineNo = lines.length + 1;
    const newLine = {
      line_item_id: newItemId,
      line_no: nextLineNo,
      customer_tag_no: "",
      model_code: "",
      description: "",
      qty: "1",
      uom: "NOS",
      technical_spec_text: "",
      _unitPrice: "",
      isCustomAdded: true,
    };
    setLines([...lines, newLine]);
    setIsExpanded(true);
  }

  function handleRemoveLine(lineItemId) {
    setLines(lines.filter((l) => l.line_item_id !== lineItemId));
  }

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + (Number(l._unitPrice) || 0) * (Number(l.qty) || 0), 0);
    const discountAmt = subtotal * ((Number(discountPct) || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * ((Number(taxPct) || 0) / 100);
    const freight = Number(freightAmount) || 0;
    const grandTotal = afterDiscount + taxAmt + freight;
    return { subtotal, discountAmt, taxAmt, freight, grandTotal };
  }, [lines, discountPct, taxPct, freightAmount]);

  async function handleApproveAndGenerate() {
    setSaving(true);
    setError("");
    try {
      for (const l of lines.filter((l) => !l.isCustomAdded)) {
        await api.updateQuotationLine(caseId, l.line_item_id, {
          model_code: l.model_code,
          description: l.description,
          qty: l.qty,
          technical_spec_text: l.technical_spec_text,
        });
      }

      const createdCustomLines = [];
      for (const l of lines.filter((l) => l.isCustomAdded)) {
        const created = await api.createQuotationLine(caseId, {
          model_code: l.model_code,
          description: l.description,
          qty: l.qty,
          uom: l.uom,
          technical_spec_text: l.technical_spec_text,
        });
        createdCustomLines.push({ ...l, line_item_id: created.line_item_id });
      }

      const allLinesForPricing = [
        ...lines.filter((l) => !l.isCustomAdded),
        ...createdCustomLines,
      ];

      await api.savePricing(caseId, {
        currency_code: "INR",
        discount_pct: discountPct || 0,
        tax_pct: taxPct || 0,
        freight_amount: freightAmount || 0,
        lines: allLinesForPricing.map((l) => ({
          quote_line_id: l.line_item_id,
          unit_price: l._unitPrice || 0,
        })),
      });

      const result = await api.generateQuotation(caseId);
      onGenerated(result);
    } catch (e) {
      setError(e.message || "Failed to generate quotation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-panel qgm-panel ${isFullscreen ? "is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="qgm-header">
          <div className="qgm-header-left">
            <div className="qgm-header-icon">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="qgm-title">Review and generate quotation</h3>
              <p className="qgm-subtitle">
                Verify item details, pricing, taxes and commercial terms before finalizing
              </p>
            </div>
          </div>
          <div className="qgm-header-actions">
            <button
              type="button"
              className="qgm-icon-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              className="qgm-icon-btn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="qgm-body">
          {error && <div className="flash flash-error">{error}</div>}

          {/* Missing Prices Alert */}
          {!hasAllPrices ? (
            <div className="qgm-alert-warning">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <div className="qgm-alert-content">
                  <strong>Unit price required:</strong> Enter a unit price greater than ₹0 for every line item to enable quotation generation.
                </div>
              </div>
              <span className="qgm-alert-pill">
                {lines.length - unpricedCount} of {lines.length} priced
              </span>
            </div>
          ) : (
            <div className="qgm-alert-success">
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <div className="qgm-alert-content">
                All {lines.length} line items have been priced and are ready for generation.
              </div>
            </div>
          )}

          {/* Line items toolbar */}
          <div className="qgm-items-bar">
            <div className="qgm-items-bar-left">
              <h4 className="qgm-section-title">
                Line Items
                <span className="qgm-badge">{lines.length}</span>
              </h4>
              {hasManyItems && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="btn btn-outline"
                  style={{
                    padding: "3px 10px",
                    fontSize: "0.76rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 6,
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={13} /> Collapse List
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} /> Expand List ({lines.length} items)
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              className="qgm-add-btn"
              onClick={handleAddNewItem}
            >
              <Plus size={15} />
              Add New Item
            </button>
          </div>

          {/* Table Container - Strict 100% width, NO horizontal scroll */}
          <div className="qgm-table-container">
            <div className={`qgm-table-scroll-area ${!isExpanded ? "is-collapsed" : ""}`}>
              <table className="qgm-table">
                <colgroup>
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "35%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "4%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Tag No.</th>
                    <th>Model</th>
                    <th>Description & Specs</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price (₹)</th>
                    <th style={{ textAlign: "right" }}>Total (₹)</th>
                    <th style={{ textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                        No line items available. Click &quot;Add New Item&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    visibleLines.map((l) => {
                      const isUnpriced = !l._unitPrice || parseFloat(l._unitPrice) <= 0;
                      const lineTotal = (Number(l._unitPrice) || 0) * (Number(l.qty) || 0);
                      const descLength = (l.description || "").length;
                      const calculatedRows = Math.max(2, Math.min(5, Math.ceil(descLength / 40)));

                      return (
                        <tr key={l.line_item_id}>
                          <td>
                            <input
                              value={l.customer_tag_no || ""}
                              onChange={(e) => updateLineField(l.line_item_id, "customer_tag_no", e.target.value)}
                              placeholder="Tag no."
                              className="qgm-input"
                            />
                          </td>
                          <td>
                            <input
                              value={l.model_code || ""}
                              onChange={(e) => updateLineField(l.line_item_id, "model_code", e.target.value)}
                              placeholder="Model code"
                              className="qgm-input qgm-input-mono"
                            />
                          </td>
                          <td>
                            <textarea
                              value={l.description || ""}
                              onChange={(e) => updateLineField(l.line_item_id, "description", e.target.value)}
                              placeholder="Item description & details"
                              className="qgm-textarea"
                              rows={calculatedRows}
                              style={{ width: "100%", marginBottom: l.spec_rows?.length ? 6 : 0 }}
                            />
                            <SpecTable line={l} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.qty || ""}
                              onChange={(e) => updateLineField(l.line_item_id, "qty", e.target.value)}
                              className="qgm-input qgm-qty-input"
                              placeholder="1"
                            />
                          </td>
                          <td>
                            <div className={`qgm-price-wrap ${isUnpriced ? "qgm-price-missing" : ""}`}>
                              <span className="qgm-currency-tag">₹</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={l._unitPrice}
                                onChange={(e) => updateLineField(l.line_item_id, "_unitPrice", e.target.value)}
                                className="qgm-input qgm-price-input"
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="qgm-row-total">
                              {formatCurrency(lineTotal)}
                            </div>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(l.line_item_id)}
                              title="Remove this item"
                              className="qgm-delete-btn"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Expand / Collapse bottom bar if multiple items */}
            {hasManyItems && (
              <div className="qgm-expand-footer">
                <button
                  type="button"
                  className="qgm-expand-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={15} />
                      Collapse to {COLLAPSED_LIMIT} items
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />
                      Expand list — View all {lines.length} items ({lines.length - COLLAPSED_LIMIT} more)
                    </>
                  )}
                </button>
                <span className="qgm-expand-counter">
                  Showing {visibleLines.length} of {lines.length} line items
                </span>
              </div>
            )}
          </div>

          {/* Commercial Terms & Totals Side-by-Side */}
          <div className="qgm-bottom-grid">
            {/* Commercial Adjustments */}
            <div className="qgm-card qgm-terms-card">
              <div className="qgm-card-header">
                <h4>Commercial Adjustments</h4>
                <span className="qgm-card-hint">Discount, taxes and freight charges</span>
              </div>
              <div className="qgm-terms-inputs">
                <div className="qgm-field">
                  <label>Discount %</label>
                  <div className="qgm-input-affix-wrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={discountPct}
                      onChange={(e) => setDiscountPct(e.target.value)}
                      placeholder="0"
                      className="qgm-input qgm-input-with-suffix"
                    />
                    <span className="qgm-affix-suffix">%</span>
                  </div>
                </div>

                <div className="qgm-field">
                  <label>Tax %</label>
                  <div className="qgm-input-affix-wrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={taxPct}
                      onChange={(e) => setTaxPct(e.target.value)}
                      placeholder="18"
                      className="qgm-input qgm-input-with-suffix"
                    />
                    <span className="qgm-affix-suffix">%</span>
                  </div>
                </div>

                <div className="qgm-field">
                  <label>Freight (₹)</label>
                  <div className="qgm-input-affix-wrap">
                    <span className="qgm-affix-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={freightAmount}
                      onChange={(e) => setFreightAmount(e.target.value)}
                      placeholder="0"
                      className="qgm-input qgm-input-with-prefix"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quotation Summary */}
            <div className="qgm-card qgm-totals-card">
              <div className="qgm-card-header">
                <h4>Quotation Summary</h4>
                <span className="qgm-card-hint">Calculated totals in INR (₹)</span>
              </div>
              <div className="qgm-totals-list">
                <div className="qgm-totals-row">
                  <span>Subtotal ({lines.length} {lines.length === 1 ? "item" : "items"})</span>
                  <span className="qgm-amount">{formatCurrency(totals.subtotal)}</span>
                </div>
                {Number(totals.discountAmt) > 0 && (
                  <div className="qgm-totals-row qgm-row-discount">
                    <span>Discount ({discountPct || 0}%)</span>
                    <span className="qgm-amount">−{formatCurrency(totals.discountAmt)}</span>
                  </div>
                )}
                <div className="qgm-totals-row">
                  <span>Tax ({taxPct || 0}%)</span>
                  <span className="qgm-amount">+{formatCurrency(totals.taxAmt)}</span>
                </div>
                {Number(totals.freight) > 0 && (
                  <div className="qgm-totals-row">
                    <span>Freight</span>
                    <span className="qgm-amount">+{formatCurrency(totals.freight)}</span>
                  </div>
                )}
                <div className="qgm-totals-divider" />
                <div className="qgm-totals-row qgm-grand-total">
                  <div>
                    <span className="qgm-grand-label">Grand Total</span>
                    <span className="qgm-grand-sub">Final quotation value</span>
                  </div>
                  <span className="qgm-grand-amount">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="qgm-footer">
          <div className="qgm-footer-status">
            {hasAllPrices ? (
              <span className="qgm-status-pill qgm-status-ready">
                <CheckCircle2 size={14} /> Ready to generate
              </span>
            ) : (
              <span className="qgm-status-pill qgm-status-pending">
                <AlertCircle size={14} /> {unpricedCount} item{unpricedCount > 1 ? "s" : ""} pending unit price
              </span>
            )}
          </div>
          <div className="qgm-footer-actions">
            <button className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn qgm-primary-btn"
              onClick={handleApproveAndGenerate}
              disabled={saving || !hasAllPrices}
              title={!hasAllPrices ? "Enter a unit price for every line item first" : undefined}
            >
              {saving ? (
                <>
                  <span className="qgm-spinner" /> Generating…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Approve and generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}