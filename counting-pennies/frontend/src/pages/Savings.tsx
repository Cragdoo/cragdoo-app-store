import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, PiggyBank } from "lucide-react";
import Modal from "../components/Modal";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import SavingsModal from "../components/SavingsModal";
import { savingsApi } from "../lib/api";
import type { SavingsGoal, Settings } from "../types";
import type { Theme } from "../hooks/useTheme";

interface Props { theme: Theme; onToggleTheme: () => void; settings: Settings; }

const fmt = (s: Settings, n: number) =>
  `${s.currency_symbol}${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Savings({ theme, onToggleTheme, settings }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setGoals(await savingsApi.list()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this savings goal?")) return;
    await savingsApi.delete(id); load();
  };

  const handleContribute = async () => {
    if (!contributeGoal || !contributeAmount) return;
    await savingsApi.contribute(contributeGoal.id, parseFloat(contributeAmount));
    setContributeGoal(null); setContributeAmount(""); load();
  };

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  return (
    <Layout title="Savings Goals" theme={theme} onToggleTheme={onToggleTheme}
      headerContent={
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-1.5 mr-2">
          <Plus size={14} /> New Goal
        </button>
      }
    >
      <div className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Saved</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(settings, totalSaved)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Target</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(settings, totalTarget)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</p>
            <p className="text-xl font-bold text-brand-600">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : "0"}%
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="card flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <PiggyBank size={40} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No savings goals yet</p>
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary text-xs">Create your first goal</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {goals.map(g => {
              const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
              const remaining = Math.max(g.target_amount - g.current_amount, 0);
              const daysLeft = g.target_date ? Math.max(Math.ceil((new Date(g.target_date).getTime() - Date.now()) / 86400000), 0) : null;
              return (
                <div key={g.id} className="card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: g.color + "20" }}>
                        <PiggyBank size={20} style={{ color: g.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{g.name}</h3>
                        {daysLeft !== null && (
                          <p className="text-xs text-gray-400">{daysLeft > 0 ? `${daysLeft} days left` : "Target date passed"}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(g); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-900 dark:text-white font-semibold">{fmt(settings, g.current_amount)}</span>
                      <span className="text-gray-400">of {fmt(settings, g.target_amount)}</span>
                    </div>
                    <ProgressBar value={g.current_amount} max={g.target_amount} color={g.color} showLabel={true} height="lg" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{fmt(settings, remaining)} remaining</span>
                    <button
                      onClick={() => { setContributeGoal(g); setContributeAmount(""); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: g.color + "20", color: g.color }}
                    >
                      + Contribute
                    </button>
                  </div>

                  {g.notes && <p className="text-xs text-gray-400 italic">{g.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SavingsModal
        open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={load} goal={editing} currencySymbol={settings.currency_symbol}
      />

      <Modal open={!!contributeGoal} onClose={() => setContributeGoal(null)} title={`Contribute to "${contributeGoal?.name}"`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Amount ({settings.currency_symbol})</label>
            <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00" autoFocus
              value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} />
          </div>
          {contributeGoal && (
            <p className="text-xs text-gray-400">
              {fmt(settings, contributeGoal.current_amount)} saved · {fmt(settings, Math.max(contributeGoal.target_amount - contributeGoal.current_amount, 0))} remaining
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setContributeGoal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleContribute} disabled={!contributeAmount} className="btn-primary flex-1">Contribute</button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
