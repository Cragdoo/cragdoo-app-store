import { useState, useEffect } from "react";
import Modal from "./Modal";
import { transactionsApi } from "../lib/api";
import type { Transaction, Category } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction?: Transaction | null;
  categories: Category[];
  currencySymbol: string;
}

const empty = {
  type: "expense" as "income" | "expense",
  amount: "",
  category_id: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  is_recurring: false,
  recurring_interval: "monthly",
  notes: "",
};

export default function TransactionModal({ open, onClose, onSaved, transaction, categories, currencySymbol }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        category_id: String(transaction.category_id),
        description: transaction.description,
        date: transaction.date,
        is_recurring: transaction.is_recurring === 1,
        recurring_interval: transaction.recurring_interval || "monthly",
        notes: transaction.notes || "",
      });
    } else {
      setForm({ ...empty });
    }
    setError("");
  }, [transaction, open]);

  const filteredCats = categories.filter(c => c.type === form.type || c.type === "both");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category_id || !form.date) { setError("Please fill all required fields"); return; }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        category_id: parseInt(form.category_id),
        description: form.description,
        date: form.date,
        is_recurring: form.is_recurring ? 1 : 0,
        recurring_interval: form.is_recurring ? form.recurring_interval : undefined,
        notes: form.notes || undefined,
      };
      if (transaction) {
        await transactionsApi.update(transaction.id, payload);
      } else {
        await transactionsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={transaction ? "Edit Transaction" : "Add Transaction"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          {(["expense", "income"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t, category_id: "" }))}
              className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                form.type === t
                  ? t === "expense"
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                    : "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount ({currencySymbol})</label>
            <input type="number" step="0.01" min="0" required className="input" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select required className="select" value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">Select category…</option>
            {filteredCats.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <input type="text" className="input" placeholder="What was this for?"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_recurring}
                onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
              <div className={`w-10 h-5 rounded-full transition-colors ${form.is_recurring ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_recurring ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Recurring</span>
          </label>
          {form.is_recurring && (
            <select className="select flex-1" value={form.recurring_interval}
              onChange={e => setForm(f => ({ ...f, recurring_interval: e.target.value }))}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={2} placeholder="Any additional notes…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : transaction ? "Save Changes" : "Add Transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
