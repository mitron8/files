import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";

function SpecTable({ line }) {
  const rows = Array.isArray(line?.spec_rows) ? line.spec_rows : [];
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--surface-1, #f8fafc)", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: "0.78rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.label}:${row.value}`}>
              <td style={{ fontWeight: 650, padding: "2px 8px 2px 0", width: "120px", verticalAlign: "top", color: "var(--ink)", wordBreak: "break-word" }}>
                {row.label} :
              </td>
              <td style={{ padding: "2px 0", verticalAlign: "top", wordBreak: "break-word", color: "#334155" }}>{row.value}</td>
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
  const [lines, setLines] = useState(
    initialLines.map((l) => ({ ...l, _unitPrice: "", customer_tag_no: l.customer_tag_no || "" }))
  );
  const [discountPct, setDiscountPct] = useState("");
  const [taxPct, setTaxPct] = useState("");
  const [freightAmount, setFreightAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasAllPrices = lines.length > 0 && lines.every((l) => l._unitPrice && parseFloat(l._unitPrice) > 0);

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
      <div className="modal-panel qgm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qgm-header">
          <div>
            <h3 className="qgm-title">Review and generate quotation</h3>
          </div>
          <button className="qgm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="qgm-body">
          {error && <div className="flash flash-error">{error}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p className="qgm-section-label" style={{ margin: 0 }}>Line items ({lines.length})</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddNewItem}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: 8,
                cursor: "pointer",
                background: "var(--brand-tint, #e6f2ec)",
                color: "var(--brand-dark, #0d4a33)",
                borderColor: "#b8ccbf"
              }}
            >
              <Plus size={14} />
              Add New Item
            </button>
          </div>

          <div className="qgm-table-wrap">
            <table className="qgm-table">
              <thead>
                <tr>
                  <th style={{ width: 110, minWidth: 100 }}>Tag No.</th>
                  <th style={{ width: 140, minWidth: 130 }}>Model</th>
                  <th style={{ minWidth: 260 }}>Description</th>
                  <th style={{ width: 85, minWidth: 80, textAlign: "center" }}>Qty</th>
                  <th style={{ width: 140, minWidth: 130, textAlign: "right" }}>Unit price</th>
                  <th style={{ width: 44, minWidth: 44, textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.line_item_id}>
                    <td>
                      <input
                        value={l.customer_tag_no || ""}
                        onChange={(e) => updateLineField(l.line_item_id, "customer_tag_no", e.target.value)}
                        placeholder="Tag no."
                      />
                    </td>
                    <td>
                      <input
                        value={l.model_code || ""}
                        onChange={(e) => updateLineField(l.line_item_id, "model_code", e.target.value)}
                        placeholder="Model code"
                      />
                    </td>
                    <td>
                      <input
                        value={l.description || ""}
                        onChange={(e) => updateLineField(l.line_item_id, "description", e.target.value)}
                        placeholder="Item description & details"
                        style={{ width: "100%", marginBottom: l.spec_rows?.length ? 4 : 0 }}
                      />
                      <SpecTable line={l} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        value={l.qty || ""}
                        onChange={(e) => updateLineField(l.line_item_id, "qty", e.target.value)}
                        className="qgm-qty"
                        placeholder="1"
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={l._unitPrice}
                          onChange={(e) => updateLineField(l.line_item_id, "_unitPrice", e.target.value)}
                          className="qgm-unit-price"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(l.line_item_id)}
                        title="Remove this item"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--danger, #b3261e)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 4,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasAllPrices && (
            <p style={{ fontSize: "0.8rem", color: "var(--warn)", marginBottom: 10 }}>
              ⚠ Enter a unit price (greater than 0) for every line item to enable generation.
            </p>
          )}

          <div className="qgm-terms-grid">
            <div>
              <label>Discount %</label>
              <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label>Tax %</label>
              <input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} placeholder="18" />
            </div>
            <div>
              <label>Freight (₹)</label>
              <input type="number" value={freightAmount} onChange={(e) => setFreightAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="qgm-totals">
            <div className="qgm-totals-row"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            <div className="qgm-totals-row"><span>Discount</span><span>−{formatCurrency(totals.discountAmt)}</span></div>
            <div className="qgm-totals-row"><span>Tax</span><span>+{formatCurrency(totals.taxAmt)}</span></div>
            <div className="qgm-totals-row"><span>Freight</span><span>+{formatCurrency(totals.freight)}</span></div>
            <div className="qgm-totals-row qgm-grand-total"><span>Grand total</span><span>{formatCurrency(totals.grandTotal)}</span></div>
          </div>
        </div>

        <div className="qgm-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn qgm-primary"
            onClick={handleApproveAndGenerate}
            disabled={saving || !hasAllPrices}
            title={!hasAllPrices ? "Enter a unit price for every line item first" : undefined}
          >
            {saving ? "Generating…" : "✓ Approve and generate"}
          </button>
        </div>
      </div>
    </div>
  );
}