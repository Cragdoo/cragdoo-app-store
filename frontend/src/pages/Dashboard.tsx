import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Percent,
  ChevronLeft, ChevronRight, Plus,
} from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import TransactionModal from "../components/TransactionModal";
import { dashboardApi, categoriesApi } from "../lib/api";
import type { DashboardSummary, TrendPoint, Category, Settings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: Settings; }

const fmt = (s: Settings, n: number) =>
  `${s.currency_symbol}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard({ theme, onToggleTheme, settings }: Props) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txModal, setTxModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, c] = await Promise.all([
        dashboardApi.summary(year, month),
        dashboardApi.trends(6),
        categoriesApi.list(),
      ]);
      setSummary(s); setTrends(t); setCategories(c);
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (delta: number) => {
    const d = new Date(parseInt(year), parseInt(month) - 1 + delta, 1);
    setYear(String(d.getFullYear()));
    setMonth(String(d.getMonth() + 1).padStart(2, "0"));
  };

  const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });

  if (loading && !summary) {
    return (
      <Layout title="Dashboard" theme={theme} onToggleTheme={onToggleTheme}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const pieData = (summary?.expenseByCategory || []).filter(c => c.spent > 0);
  const chartTextColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <Layout title="Dashboard" theme={theme} onToggleTheme={onToggleTheme}
      headerContent={
        <div className="flex items-center gap-2 mr-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronLeft size={16} /></button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><ChevronRight size={16} /></button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Income" value={fmt(settings, summary?.income || 0)}
            icon={<TrendingUp size={20} />} color="green"
            subtitle="Total this month" />
          <StatCard title="Expenses" value={fmt(settings, summary?.expense || 0)}
            icon={<TrendingDown size={20} />} color="red"
            subtitle="Total this month" />
          <StatCard title="Net Balance" value={`${(summary?.net || 0) < 0 ? "-" : ""}${fmt(settings, summary?.net || 0)}`}
            icon={<Wallet size={20} />} color={(summary?.net || 0) >= 0 ? "blue" : "red"}
            subtitle="Income minus expenses" />
          <StatCard title="Savings Rate" value={`${(summary?.savingsRate || 0).toFixed(1)}%`}
            icon={<Percent size={20} />} color="purple"
            subtitle="Of income saved" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Expense Pie Chart */}
          <div className="card p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Expense Breakdown</h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">No expenses this month</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="spent" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(settings, v)} contentStyle={{ background: theme === "dark" ? "#1f2937" : "#fff", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-3 max-h-40 overflow-y-auto">
                  {pieData.slice(0, 8).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{c.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-200">{fmt(settings, c.spent)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 6-month Trend */}
          <div className="card p-5 xl:col-span-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">6-Month Trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trends} barGap={2} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#f3f4f6"} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${settings.currency_symbol}${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip formatter={(v: number) => fmt(settings, v)} contentStyle={{ background: theme === "dark" ? "#1f2937" : "#fff", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Budget Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget Progress</h2>
              <Link to="/budgets" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {(summary?.expenseByCategory || []).filter(c => c.budget_amount > 0).slice(0, 6).map(c => (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{c.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {fmt(settings, c.spent)} / {fmt(settings, c.budget_amount)}
                    </span>
                  </div>
                  <ProgressBar value={c.spent} max={c.budget_amount} color={c.color} showLabel={false} height="sm" />
                </div>
              ))}
              {(summary?.expenseByCategory || []).filter(c => c.budget_amount > 0).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No budgets set yet. <Link to="/budgets" className="text-brand-600 dark:text-brand-400">Add budgets</Link></p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Transactions</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setTxModal(true)} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  <Plus size={12} /> Add
                </button>
                <Link to="/transactions" className="text-xs text-brand-600 dark:text-brand-400 hover:underline ml-2">View all</Link>
              </div>
            </div>
            <div className="space-y-2">
              {(summary?.recentTransactions || []).slice(0, 8).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tx.category_color + "20" }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.category_color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description || tx.category_name}</p>
                      <p className="text-xs text-gray-400">{tx.date} · {tx.category_name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {tx.type === "income" ? "+" : "-"}{fmt(settings, tx.amount)}
                  </span>
                </div>
              ))}
              {(summary?.recentTransactions || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Savings Goals + Portfolio */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Savings Goals</h2>
              <Link to="/savings" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {(summary?.savingsGoals || []).map(g => {
                const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{g.name}</span>
                      <span className="text-xs text-gray-500">{fmt(settings, g.current_amount)} / {fmt(settings, g.target_amount)}</span>
                    </div>
                    <ProgressBar value={g.current_amount} max={g.target_amount} color={g.color} showLabel={true} height="md" />
                  </div>
                );
              })}
              {(summary?.savingsGoals || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No savings goals. <Link to="/savings" className="text-brand-600 dark:text-brand-400">Create one</Link></p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Investment Portfolio</h2>
              <Link to="/investments" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
            </div>
            {(summary?.portfolioValue || 0) === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No investments tracked. <Link to="/investments" className="text-brand-600 dark:text-brand-400">Add one</Link></p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(settings, summary?.portfolioValue || 0)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${(summary?.portfolioGain || 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gain / Loss</p>
                    <p className={`text-lg font-bold ${(summary?.portfolioGain || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {(summary?.portfolioGain || 0) >= 0 ? "+" : ""}{fmt(settings, summary?.portfolioGain || 0)}
                    </p>
                  </div>
                </div>
                <ProgressBar
                  value={summary?.portfolioValue || 0}
                  max={(summary?.portfolioValue || 0) > (summary?.portfolioCost || 0) ? (summary?.portfolioValue || 0) : (summary?.portfolioCost || 1)}
                  color="#6366f1" showLabel={false} height="sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionModal
        open={txModal} onClose={() => setTxModal(false)}
        onSaved={load} categories={categories}
        currencySymbol={settings.currency_symbol}
      />
    </Layout>
  );
}
