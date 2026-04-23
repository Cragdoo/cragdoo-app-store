import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import Layout from "../components/Layout";
import CategoryModal from "../components/CategoryModal";
import { settingsApi, categoriesApi } from "../lib/api";
import type { Category, Settings as AppSettings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: AppSettings; onSettingsChange: (s: AppSettings) => void; }

const CURRENCIES = [
  { code: "GBP", symbol: "£" }, { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" },
  { code: "CAD", symbol: "CA$" }, { code: "AUD", symbol: "A$" }, { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "CHF" }, { code: "NOK", symbol: "kr" }, { code: "SEK", symbol: "kr" },
];

export default function Settings({ theme, onToggleTheme, settings, onSettingsChange }: Props) {
  const [form, setForm] = useState({ ...settings });
  const [categories, setCategories] = useState<Category[]>([]);
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saved, setSaved] = useState(false);

  const loadCats = useCallback(async () => {
    setCategories(await categoriesApi.list());
  }, []);

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { setForm({ ...settings }); }, [settings]);

  const handleSave = async () => {
    const updated = await settingsApi.update({
      currency: form.currency,
      currency_symbol: CURRENCIES.find(c => c.code === form.currency)?.symbol || form.currency_symbol,
      date_format: form.date_format,
      theme: form.theme,
      week_start: form.week_start,
    });
    onSettingsChange(updated as AppSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteCat = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? It cannot be deleted if it has transactions.`)) return;
    try {
      await categoriesApi.delete(cat.id);
      loadCats();
    } catch (err: any) {
      alert(err.response?.data?.error || "Cannot delete this category");
    }
  };

  const expenseCats = categories.filter(c => c.type === "expense");
  const incomeCats = categories.filter(c => c.type === "income");
  const subscriptions = categories.filter(c => c.is_subscription === 1);

  return (
    <Layout title="Settings" theme={theme} onToggleTheme={onToggleTheme}>
      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-5">General</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="label">Currency</label>
              <select className="select" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value, currency_symbol: CURRENCIES.find(c => c.code === e.target.value)?.symbol || f.currency_symbol }))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date Format</label>
              <select className="select" value={form.date_format}
                onChange={e => setForm(f => ({ ...f, date_format: e.target.value }))}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="label">Theme</label>
              <select className="select" value={form.theme}
                onChange={e => { setForm(f => ({ ...f, theme: e.target.value as "light" | "dark" })); onToggleTheme(); }}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label className="label">Week Starts</label>
              <select className="select" value={form.week_start}
                onChange={e => setForm(f => ({ ...f, week_start: e.target.value as "monday" | "sunday" }))}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 mt-5">
            <Save size={14} />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Categories */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories</h2>
            <button onClick={() => { setEditingCat(null); setCatModal(true); }} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus size={12} /> New Category
            </button>
          </div>

          {[{ label: "Expense Categories", cats: expenseCats }, { label: "Income Categories", cats: incomeCats }].map(({ label, cats }) => (
            <div key={label}>
              <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {cats.map(cat => (
                  <div key={cat.id} className="px-6 py-3 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                      {cat.is_subscription === 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">sub</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {cat.budget_amount > 0 && (
                        <span className="text-xs text-gray-400">Budget: £{cat.budget_amount.toFixed(0)}</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCat(cat); setCatModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteCat(cat)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Subscriptions summary */}
        {subscriptions.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Subscriptions</h2>
            <div className="space-y-2">
              {subscriptions.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {s.budget_amount > 0 ? `£${s.budget_amount.toFixed(2)}/mo` : "—"}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  £{subscriptions.reduce((s, c) => s + c.budget_amount, 0).toFixed(2)}/mo
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CategoryModal
        open={catModal} onClose={() => { setCatModal(false); setEditingCat(null); }}
        onSaved={loadCats} category={editingCat}
      />
    </Layout>
  );
}
