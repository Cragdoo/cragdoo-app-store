import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Layout from "../components/Layout";
import TransactionModal from "../components/TransactionModal";
import { transactionsApi, categoriesApi } from "../lib/api";
import type { Transaction, Category, Settings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: Settings; }

const fmt = (s: Settings, n: number) =>
  `${s.currency_symbol}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Transactions({ theme, onToggleTheme, settings }: Props) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "income" | "expense">("");
  const [filterCat, setFilterCat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { year, month };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      if (filterCat) params.category_id = parseInt(filterCat);

      const [txData, cats] = await Promise.all([
        transactionsApi.list(params),
        categoriesApi.list(),
      ]);
      setTransactions(txData.data);

      const summary = await transactionsApi.summary({ year, month });
      setTotalIncome(summary.income);
      setTotalExpense(summary.expense);
      setCategories(cats);
    } finally { setLoading(false); }
  }, [year, month, search, filterType, filterCat]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (delta: number) => {
    const d = new Date(parseInt(year), parseInt(month) - 1 + delta, 1);
    setYear(String(d.getFullYear()));
    setMonth(String(d.getMonth() + 1).padStart(2, "0"));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    setDeleting(id);
    try { await transactionsApi.delete(id); await load(); }
    finally { setDeleting(null); }
  };

  const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Layout title="Transactions" theme={theme} onToggleTheme={onToggleTheme}
      headerContent={
        <div className="flex items-center gap-2 mr-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronLeft size={16} /></button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronRight size={16} /></button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(settings, totalIncome)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-xl font-bold text-rose-600">{fmt(settings, totalExpense)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {totalIncome - totalExpense < 0 ? "-" : ""}{fmt(settings, totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select w-auto min-w-[120px]" value={filterType}
            onChange={e => setFilterType(e.target.value as "" | "income" | "expense")}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="select w-auto min-w-[140px]" value={filterCat}
            onChange={e => setFilterCat(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setModalOpen(true); setEditing(null); }} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm mb-2">No transactions found</p>
              <button onClick={() => { setModalOpen(true); setEditing(null); }} className="btn-primary text-xs">
                Add your first transaction
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Date", "Description", "Category", "Type", "Amount", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{tx.description || tx.category_name}</span>
                        {tx.is_recurring === 1 && <span title="Recurring"><RefreshCw size={10} className="text-brand-500 flex-shrink-0" /></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tx.category_color + "20", color: tx.category_color }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category_color }} />
                        {tx.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={tx.type === "income" ? "badge-income" : "badge-expense"}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {tx.type === "income" ? "+" : "-"}{fmt(settings, tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(tx); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} disabled={deleting === tx.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TransactionModal
        open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={load} transaction={editing} categories={categories}
        currencySymbol={settings.currency_symbol}
      />
    </Layout>
  );
}
