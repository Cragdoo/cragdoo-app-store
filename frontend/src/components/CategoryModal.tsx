import { useState, useEffect } from "react";
import Modal from "./Modal";
import { categoriesApi } from "../lib/api";
import type { Category } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  category?: Category | null;
}

const COLORS = [
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6",
  "#06b6d4","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#6b7280",
];

const ICONS = [
  "tag","home","car","utensils","shopping-cart","zap","wifi","smartphone","tv","music",
  "film","gamepad-2","heart","shield","briefcase","laptop","piggy-bank","trending-up",
  "package","fuel","apple","shirt","coffee","gift",
];

const empty = { name: "", type: "expense" as "income" | "expense", color: "#6366f1", icon: "tag", budget_amount: "0", is_subscription: false };

export default function CategoryModal({ open, onClose, onSaved, category }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name, type: category.type as "income" | "expense",
        color: category.color, icon: category.icon,
        budget_amount: String(category.budget_amount),
        is_subscription: category.is_subscription === 1,
      });
    } else {
      setForm({ ...empty });
    }
    setError("");
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, type: form.type, color: form.color, icon: form.icon,
        budget_amount: parseFloat(form.budget_amount) || 0,
        is_subscription: form.is_subscription ? 1 : 0,
      };
      if (category) await categoriesApi.update(category.id, payload);
      else await categoriesApi.create(payload);
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit Category" : "New Category"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="label">Name</label>
          <input type="text" required className="input" placeholder="Category name…"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "income" | "expense" }))}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="label">Monthly Budget (£)</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
              value={form.budget_amount} onChange={e => setForm(f => ({ ...f, budget_amount: e.target.value }))} />
          </div>
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
          <label className="label">Icon</label>
          <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
            {ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${form.icon === icon ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={form.is_subscription}
              onChange={e => setForm(f => ({ ...f, is_subscription: e.target.checked }))} />
            <div className={`w-10 h-5 rounded-full transition-colors ${form.is_subscription ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"}`} />
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_subscription ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Subscription / Recurring service</span>
        </label>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
