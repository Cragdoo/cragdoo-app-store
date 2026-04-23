interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  height?: "sm" | "md" | "lg";
}

export default function ProgressBar({ value, max, color = "#6366f1", showLabel = true, label, height = "md" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const overBudget = value > max && max > 0;

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{label}</span>}
          {showLabel && (
            <span className={`text-xs font-medium ml-auto ${overBudget ? "text-rose-600 dark:text-rose-400" : "text-gray-600 dark:text-gray-400"}`}>
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ${heights[height]}`}>
        <div
          className="rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: overBudget ? "#f43f5e" : color,
            minWidth: pct > 0 ? "4px" : "0",
          }}
        />
      </div>
    </div>
  );
}
