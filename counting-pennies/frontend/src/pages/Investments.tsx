import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "../components/Layout";
import InvestmentModal from "../components/InvestmentModal";
import { investmentsApi } from "../lib/api";
import type { Investment, InvestmentSummary, Settings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: Settings; }

const TYPE_COLORS: Record<string, string> = {
  stock: "#6366f1", crypto: "#f59e0b", fund: "#10b981",
  bond: "#3b82f6", property: "#8b5cf6", other: "#6b7280",
};

const fmt = (s: Settings, n: number) =>
  `${s.currency_symbol}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Investments({ theme, onToggleTheme, settings }: Props) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, sum] = await Promise.all([investmentsApi.list(), investmentsApi.summary()]);
      setInvestments(inv); setSummary(sum);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    await investmentsApi.delete(id);
    load();
  };

  const pieData = Object.entries(summary?.byType || {}).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1), value, color: TYPE_COLORS[type] || "#6b7280",
  }));

  return (
    <Layout title="Investments" theme={theme} onToggleTheme={onToggleTheme}
      headerContent={
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-1.5 mr-2">
          <Plus size={14} /> Add Investment
        </button>
      }
    >
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Invested</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(settings, summary?.totalCost || 0)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
            <p className="text-xl font-bold text-brand-600">{fmt(settings, summary?.totalValue || 0)}</p>
          </div>
          <div className={`card p-4 ${(summary?.gainLoss || 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800"}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unrealised Gain/Loss</p>
            <div className="flex items-center gap-1">
              {(summary?.gainLoss || 0) >= 0 ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-rose-600" />}
              <p className={`text-xl font-bold ${(summary?.gainLoss || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {(summary?.gainLoss || 0) >= 0 ? "+" : "-"}{fmt(settings, summary?.gainLoss || 0)}
              </p>
            </div>
          </div>
          <div className={`card p-4 ${(summary?.gainLossPct || 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800"}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">Return %</p>
            <p className={`text-xl font-bold ${(summary?.gainLossPct || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {(summary?.gainLossPct || 0) >= 0 ? "+" : ""}{(summary?.gainLossPct || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pie */}
          {pieData.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Allocation by Type</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(settings, v)} contentStyle={{ background: theme === "dark" ? "#1f2937" : "#fff", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className={`card overflow-hidden ${pieData.length > 0 ? "xl:col-span-2" : "xl:col-span-3"}`}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Holdings</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : investments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm mb-2">No investments tracked yet</p>
                <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-xs">Add first investment</button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Name", "Type", "Qty", "Buy Price", "Current", "Value", "Gain/Loss", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {investments.map(inv => {
                    const value = inv.current_price * inv.quantity;
                    const cost = inv.purchase_price * inv.quantity;
                    const gain = value - cost;
                    const pct = cost > 0 ? (gain / cost) * 100 : 0;
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{inv.name}</p>
                          {inv.symbol && <p className="text-xs text-gray-400">{inv.symbol}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: TYPE_COLORS[inv.type] + "20", color: TYPE_COLORS[inv.type] }}>
                            {inv.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inv.quantity}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmt(settings, inv.purchase_price)}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{fmt(settings, inv.current_price)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{fmt(settings, value)}</td>
                        <td className="px-4 py-3">
                          <div className={`text-xs font-semibold ${gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {gain >= 0 ? "+" : "-"}{fmt(settings, gain)}
                            <span className="block text-gray-400">{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditing(inv); setModalOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(inv.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <InvestmentModal
        open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={load} investment={editing} currencySymbol={settings.currency_symbol}
      />
    </Layout>
  );
}
