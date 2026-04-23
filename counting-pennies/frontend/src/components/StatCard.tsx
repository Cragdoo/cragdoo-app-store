import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: "default" | "green" | "red" | "blue" | "purple";
}

const colorMap = {
  default: "text-brand-600 bg-brand-50 dark:bg-brand-900/20",
  green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  red: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
  blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
};

export default function StatCard({ title, value, subtitle, icon, trend, color = "default" }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
