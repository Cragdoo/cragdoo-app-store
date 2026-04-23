import { useState, useEffect, useCallback } from "react";
import { Target } from "lucide-react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import { categoriesApi, transactionsApi } from "../lib/api";
import type { Category, Settings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: Settings; }

const fmt = (s: Settings, n: number) =>
  `${s.currency_symbol}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface BudgetRow extends Category { spent: number; }

export default function Budgets({ theme, onToggleTheme, settings }: Props) {
  const now = new Date();
  const [year] = useState(String(now.getFullYear()));
  const [month] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, summary] = await Promise.all([
        categoriesApi.list(),
        transactionsApi.summary({ year, month }),
      ]);
      const spentMap: Record<number, number> = {};
      for (const b of summary.byCategory) {
        if (b.type === "expense") spentMap[b.id] = (spentMap[b.id] || 0) + b.total;
      }
      setRows(
        cats
          .filter(c => c.type === "expense")
          .map(c => ({ ...c, spent: spentMap[c.id] || 0 }))
          .sort((a, b) => b.budget_amount - a.budget_amount)
      );
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleBudgetChange = (id: number, val: string) => {
    setEditing(e => ({ ...e, [id]: val }));
  };

  const handleBudgetSave = async (cat: BudgetRow) => {
    const val = editing[cat.id];
    if (val === undefined) return;
    setSaving(cat.id);
    await categoriesApi.update(cat.id, { budget_amount: parseFloat(val) || 0 });
    setSaving(null);
    setEditing(e => { const n = { ...e }; delete n[cat.id]; return n; });
    load();
  };

  const totalBudget = rows.reduce((s, r) => s + r.budget_amount, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Layout title="Budgets" theme={theme} onToggleTheme={onToggleTheme}>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(settings, totalBudget)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{monthLabel}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
            <p className={`text-xl font-bold ${totalSpent > totalBudget ? "text-rose-600" : "text-gray-900 dark:text-white"}`}>{fmt(settings, totalSpent)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
            <p className={`text-xl font-bold ${totalBudget - totalSpent < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {totalBudget - totalSpent < 0 ? "-" : ""}{fmt(settings, totalBudget - totalSpent)}
            </p>
          </div>
        </div>

        <div className="card p-4 mb-2">
          <ProgressBar value={totalSpent} max={totalBudget || 1} color="#6366f1" label="Overall budget used" height="lg" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Target size={16} className="text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Budgets</h2>
              <span className="ml-auto text-xs text-gray-400">Click budget amount to edit</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {rows.map(row => {
                const remaining = row.budget_amount - row.spent;
                const over = row.budget_amount > 0 && row.spent > row.budget_amount;
                const editVal = editing[row.id];
                return (
                  <div key={row.id} className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{row.name}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-medium ${over ? "text-rose-600" : "text-gray-600 dark:text-gray-400"}`}>
                              {fmt(settings, row.spent)} spent
                            </span>
                            <span className="text-gray-400">/</span>
                            {editVal !== undefined ? (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">{settings.currency_symbol}</span>
                                <input type="number" min="0" step="0.01"
                                  className="w-24 text-xs border border-brand-400 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                                  value={editVal}
                                  onChange={e => handleBudgetChange(row.id, e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") handleBudgetSave(row); if (e.key === "Escape") setEditing(ed => { const n = {...ed}; delete n[row.id]; return n; }); }}
                                  autoFocus
                                />
                                <button onClick={() => handleBudgetSave(row)} disabled={saving === row.id} className="btn-primary py-1 px-2 text-xs">
                                  {saving === row.id ? "…" : "Save"}
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleBudgetChange(row.id, String(row.budget_amount))}
                                className="font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors min-w-[60px] text-right">
                                {row.budget_amount > 0 ? fmt(settings, row.budget_amount) : "Set budget"}
                              </button>
                            )}
                          </div>
                        </div>
                        {row.budget_amount > 0 ? (
                          <ProgressBar value={row.spent} max={row.budget_amount} color={row.color} showLabel={false} height="sm" />
                        ) : (
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
                        )}
                      </div>
                      {row.budget_amount > 0 && (
                        <span className={`text-xs font-medium w-20 text-right flex-shrink-0 ${over ? "text-rose-600" : "text-emerald-600"}`}>
                          {over ? `-${fmt(settings, Math.abs(remaining))}` : `${fmt(settings, remaining)} left`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
