import { useState, useEffect } from "react";
import Modal from "./Modal";
import { investmentsApi } from "../lib/api";
import type { Investment } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  investment?: Investment | null;
  currencySymbol: string;
}

const TYPES = ["stock", "crypto", "fund", "bond", "property", "other"] as const;

const empty = {
  name: "", type: "stock" as Investment["type"], symbol: "",
  quantity: "1", purchase_price: "", current_price: "",
  purchase_date: new Date().toISOString().split("T")[0], notes: "",
};

export default function InvestmentModal({ open, onClose, onSaved, investment, currencySymbol }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (investment) {
      setForm({
        name: investment.name, type: investment.type, symbol: investment.symbol || "",
        quantity: String(investment.quantity), purchase_price: String(investment.purchase_price),
        current_price: String(investment.current_price), purchase_date: investment.purchase_date,
        notes: investment.notes || "",
      });
    } else {
      setForm({ ...empty });
    }
    setError("");
  }, [investment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purchase_price || !form.current_price) { setError("Please fill all required fields"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, type: form.type, symbol: form.symbol || undefined,
        quantity: parseFloat(form.quantity) || 1,
        purchase_price: parseFloat(form.purchase_price),
        current_price: parseFloat(form.current_price),
        purchase_date: form.purchase_date, notes: form.notes || undefined,
      };
      if (investment) await investmentsApi.update(investment.id, payload);
      else await investmentsApi.create(payload);
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  };

  const gain = form.purchase_price && form.current_price && form.quantity
    ? (parseFloat(form.current_price) - parseFloat(form.purchase_price)) * parseFloat(form.quantity)
    : null;

  return (
    <Modal open={open} onClose={onClose} title={investment ? "Edit Investment" : "Add Investment"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Name</label>
            <input type="text" required className="input" placeholder="e.g. Apple Inc, Bitcoin…"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Investment["type"] }))}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Symbol / Ticker</label>
            <input type="text" className="input" placeholder="AAPL, BTC…"
              value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Quantity</label>
            <input type="number" step="any" min="0" className="input" placeholder="1"
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="label">Buy Price ({currencySymbol})</label>
            <input type="number" step="0.01" min="0" required className="input" placeholder="0.00"
              value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
          </div>
          <div>
            <label className="label">Current Price ({currencySymbol})</label>
            <input type="number" step="0.01" min="0" required className="input" placeholder="0.00"
              value={form.current_price} onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
          </div>
        </div>

        {gain !== null && (
          <div className={`text-sm font-medium px-3 py-2 rounded-lg ${gain >= 0 ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"}`}>
            Unrealised {gain >= 0 ? "gain" : "loss"}: {currencySymbol}{Math.abs(gain).toFixed(2)}
          </div>
        )}

        <div>
          <label className="label">Purchase Date</label>
          <input type="date" className="input"
            value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={2}
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : investment ? "Save Changes" : "Add Investment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
