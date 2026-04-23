import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, PiggyBank,
  Target, Settings, Coins, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/transactions",icon: ArrowLeftRight,  label: "Transactions" },
  { to: "/investments", icon: TrendingUp,      label: "Investments"  },
  { to: "/savings",     icon: PiggyBank,       label: "Savings"      },
  { to: "/budgets",     icon: Target,          label: "Budgets"      },
  { to: "/settings",    icon: Settings,        label: "Settings"     },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <Coins size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Counting</p>
            <p className="text-xs text-brand-600 font-semibold">Pennies</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 mt-2">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`flex-shrink-0 ${isActive ? "text-brand-600 dark:text-brand-400" : ""}`} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
