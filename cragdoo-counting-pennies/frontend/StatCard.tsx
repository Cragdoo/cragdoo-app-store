import { useState, useEffect } from "react";
import Modal from "./Modal";
import { savingsApi } from "../lib/api";
import type { SavingsGoal } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal?: SavingsGoal | null;
  currencySymbol: string;
}

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16"];

const empty = {
  name: "", target_amount: "", current_amount: "0",
  target_date: "", color: "#10b981", notes: "",
};

export default function SavingsModal({ open, onClose, onSaved, goal, currencySymbol }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name, target_amount: String(goal.target_amount),
        current_amount: String(goal.current_amount),
        target_date: goal.target_date || "", color: goal.color, notes: goal.notes || "",
      });
    } else {
      setForm({ ...empty });
    }
    setError("");
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target_amount) { setError("Name and target amount are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
        target_date: form.target_date || undefined,
        color: form.color, notes: form.notes || undefined,
      };
      if (goal) await savingsApi.update(goal.id, payload);
      else await savingsApi.create(payload);
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? "Edit Savings Goal" : "New Savings Goal"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="label">Goal Name</label>
          <input type="text" required className="input" placeholder="e.g. Emergency Fund, Holiday, New Car…"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Target ({currencySymbol})</label>
            <input type="number" step="0.01" min="1" required className="input" placeholder="5000.00"
              value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Already Saved ({currencySymbol})</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
              value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">Target Date (optional)</label>
          <input type="date" className="input"
            value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
        </div>

        <div>
          <label className="label">Colour</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={2}
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : goal ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
